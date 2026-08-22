import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  ScrollView,
  StyleSheet,
  View,
  Text,
  ActivityIndicator,
  RefreshControl,
  StatusBar,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import dayjs from 'dayjs';
import { useScoreboard } from '../hooks/useScoreboard';
import { ESPNEvent } from '../api/espn';
import { getLocalDateKey, formatSectionDate } from '../utils/dateUtils';
import { MatchCard } from '../components/MatchCard';
import { DateSectionHeader } from '../components/DateSectionHeader';
import { Colors, Typography, Spacing, Radius } from '../constants/theme';
import { getAllPredictions, Prediction } from '../utils/storageUtils';
import { sendTestNotification } from '../notifications/backgroundTask';
import { translateTeamName } from '../utils/flagUtils';

interface Section {
  key: string;
  title: string;
  data: ESPNEvent[];
}

function groupByDate(events: ESPNEvent[]): Section[] {
  const map = new Map<string, ESPNEvent[]>();
  const sorted = [...events].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );
  for (const event of sorted) {
    const key = getLocalDateKey(event.date);
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(event);
  }
  return Array.from(map.entries()).map(([key, data]) => ({
    key,
    title: formatSectionDate(data[0].date),
    data,
  }));
}

function removeAccents(str: string): string {
  return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

function matchesSearch(event: ESPNEvent, query: string): boolean {
  if (!query.trim()) return true;
  const q = removeAccents(query.trim()).toLowerCase();
  const comp = event.competitions[0];
  if (!comp) return false;
  return comp.competitors.some((c) => {
    const original = removeAccents(c.team.shortDisplayName || c.team.displayName || c.team.name || '').toLowerCase();
    const translated = removeAccents(translateTeamName(c.team.shortDisplayName || c.team.displayName || '')).toLowerCase();
    const abbr = removeAccents(c.team.abbreviation || '').toLowerCase();
    return original.includes(q) || translated.includes(q) || abbr.includes(q);
  });
}

function findClosestSectionIndex(sections: Section[]): number {
  if (sections.length === 0) return -1;

  // 1. Prioritize exact match for today's date key
  const todayKey = dayjs().format('YYYY-MM-DD');
  const exactIndex = sections.findIndex((s) => s.key === todayKey);
  if (exactIndex !== -1) {
    return exactIndex;
  }

  // 2. Fallback to closest date difference (e.g. during rest days)
  const today = dayjs();
  let closestIndex = 0;
  let minDiff = Infinity;
  for (let i = 0; i < sections.length; i++) {
    const firstEventDate = sections[i].data[0]?.date;
    if (!firstEventDate) continue;
    const diff = Math.abs(dayjs(firstEventDate).diff(today, 'ms'));
    if (diff < minDiff) {
      minDiff = diff;
      closestIndex = i;
    }
  }
  return closestIndex;
}

export function MatchesScreen() {
  const { data, isLoading, isFetching, error, refetch } = useScoreboard();
  const [refreshing, setRefreshing] = useState(false);
  const [predictions, setPredictions] = useState<Record<string, Prediction>>({});
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [scrollViewHeight, setScrollViewHeight] = useState(0);
  const [activeCard, setActiveCard] = useState<{ y: number; height: number } | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingMatchId, setEditingMatchId] = useState<string | null>(null);

  const scrollViewRef = useRef<ScrollView>(null);
  const scrollYRef = useRef(0);
  const sectionLayouts = useRef<{ [key: string]: number }>({});
  const cardLayouts = useRef<{ [key: string]: { y: number; height: number } }>({});
  const homeInputRefs = useRef<{ [key: string]: any }>({});
  const isTransitioningRef = useRef(false);

  const sections: Section[] = data?.events
    ? groupByDate(
      data.events.filter((e) => matchesSearch(e, searchQuery))
    ).filter((s) => s.data.length > 0)
    : [];

  const loadPredictions = useCallback(async () => {
    const all = await getAllPredictions();
    setPredictions(all);
  }, []);

  useEffect(() => {
    loadPredictions();
  }, [loadPredictions]);

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const showSubscription = Keyboard.addListener(showEvent, () => {
      setKeyboardVisible(true);
    });
    const hideSubscription = Keyboard.addListener(hideEvent, () => {
      setKeyboardVisible(false);
      setActiveCard(null);
      if (!isTransitioningRef.current) {
        setEditingMatchId(null);
      }
    });

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);

  useEffect(() => {
    if (keyboardVisible && activeCard && scrollViewRef.current && scrollViewHeight > 0) {
      const { y, height } = activeCard;
      const currentScrollY = scrollYRef.current;
      const visibleHeight = scrollViewHeight;

      // Only scroll if the card is actually covered by the keyboard
      const isCovered = (y + height) > (currentScrollY + visibleHeight);

      if (isCovered) {
        const targetScrollY = y + height - visibleHeight + 16;
        scrollViewRef.current.scrollTo({ x: 0, y: Math.max(0, targetScrollY), animated: true });
      }
    }
  }, [keyboardVisible, activeCard, scrollViewHeight]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const scrollToClosest = useCallback(() => {
    const closestIndex = findClosestSectionIndex(sections);
    if (closestIndex !== -1 && sections[closestIndex] && scrollViewRef.current) {
      const section = sections[closestIndex];
      const targetY = sectionLayouts.current[section.title];
      if (targetY !== undefined) {
        scrollViewRef.current.scrollTo({ x: 0, y: targetY, animated: true });
      }
    }
  }, [sections]);

  if (isLoading && !data) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={Colors.gold} />
        <Text style={styles.loadingText}>Cargando partidos…</Text>
      </View>
    );
  }

  if (error && !data) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorIcon}>📡</Text>
        <Text style={styles.errorTitle}>Error de conexión</Text>
        <Text style={styles.errorSubtitle}>
          No se pudieron cargar los partidos. Comprueba tu conexión.
        </Text>
      </View>
    );
  }

  const flattenedItems: React.ReactNode[] = [];
  const stickyIndices: number[] = [];

  sections.forEach((section) => {
    const headerIndex = flattenedItems.length;
    stickyIndices.push(headerIndex);

    flattenedItems.push(
      <View
        key={`header-${section.title}`}
        onLayout={(event) => {
          sectionLayouts.current[section.title] = event.nativeEvent.layout.y;
        }}
      >
        <DateSectionHeader title={section.title} />
      </View>
    );

    const getNextAvailableMatch = (currentId: string): ESPNEvent | undefined => {
      const displayedMatches = sections.flatMap((s) => s.data);
      const currentIndex = displayedMatches.findIndex((m) => m.id === currentId);
      if (currentIndex === -1) return undefined;

      for (let i = currentIndex + 1; i < displayedMatches.length; i++) {
        const match = displayedMatches[i];
        const comp = match.competitions[0];
        if (comp && comp.status.type.state === 'pre') {
          return match;
        }
      }
      return undefined;
    };

    section.data.forEach((item) => {
      flattenedItems.push(
        <MatchCard
          key={item.id}
          event={item}
          prediction={predictions[item.id] || null}
          isEditing={editingMatchId === item.id}
          onPredictionSaved={() => {
            loadPredictions();
          }}
          onStartEdit={(y, height) => {
            setEditingMatchId(item.id);
            setActiveCard({ y, height });
          }}
          onCancelEdit={() => {
            setEditingMatchId(null);
            setActiveCard(null);
          }}
          onLayout={(y, height) => {
            cardLayouts.current[item.id] = { y, height };
          }}
          onRegisterHomeRef={(ref) => {
            if (ref) {
              homeInputRefs.current[item.id] = ref;
            } else {
              delete homeInputRefs.current[item.id];
            }
          }}
          onConfirmAndNext={() => {
            const nextMatch = getNextAvailableMatch(item.id);
            if (nextMatch) {
              isTransitioningRef.current = true;
              setEditingMatchId(nextMatch.id);
              const nextLayout = cardLayouts.current[nextMatch.id];
              if (nextLayout) {
                setActiveCard(nextLayout);
              }
              setTimeout(() => {
                const nextRef = homeInputRefs.current[nextMatch.id];
                if (nextRef) {
                  nextRef.focus();
                }
                isTransitioningRef.current = false;
              }, 150);
            } else {
              setEditingMatchId(null);
              setActiveCard(null);
              Keyboard.dismiss();
            }
          }}
        />
      );
    });
  });

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.background} />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>⚽ Partidos</Text>
        <View style={styles.headerRight}>
          <TouchableOpacity
            onPress={sendTestNotification}
            style={styles.testButton}
            activeOpacity={0.7}
          >
            <Text style={styles.testButtonText}>Probar Notif.</Text>
          </TouchableOpacity>
          {isFetching && !refreshing && (
            <ActivityIndicator size="small" color={Colors.gold} style={styles.fetchIndicator} />
          )}
          <Text style={styles.headerSub}>Copa Mundial 2026</Text>
        </View>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Buscar país"
          placeholderTextColor={Colors.textMuted}
          selectionColor={Colors.gold}
          returnKeyType="search"
          clearButtonMode="while-editing"
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')} activeOpacity={0.7}>
            <Text style={styles.searchClear}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <ScrollView
          ref={scrollViewRef}
          contentContainerStyle={[
            styles.list,
            { paddingBottom: keyboardVisible ? Spacing.xxl * 2 + 300 : Spacing.xxl * 2 }
          ]}
          stickyHeaderIndices={stickyIndices}
          keyboardShouldPersistTaps="handled"
          scrollEventThrottle={16}
          onScroll={(e) => {
            scrollYRef.current = e.nativeEvent.contentOffset.y;
          }}
          onLayout={(e) => {
            setScrollViewHeight(e.nativeEvent.layout.height);
          }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={Colors.gold}
              colors={[Colors.gold]}
            />
          }
        >
          {sections.length === 0 ? (
            <View style={styles.empty}>
              {searchQuery.trim() ? (
                <>
                  <Text style={styles.emptyIcon}>🔍</Text>
                  <Text style={styles.emptyText}>Sin resultados para "{searchQuery}"</Text>
                </>
              ) : (
                <>
                  <Text style={styles.emptyIcon}>📋</Text>
                  <Text style={styles.emptyText}>No hay partidos disponibles</Text>
                </>
              )}
            </View>
          ) : (
            flattenedItems
          )}
        </ScrollView>
      </KeyboardAvoidingView>

      {sections.length > 0 && (
        <TouchableOpacity style={styles.fab} onPress={scrollToClosest} activeOpacity={0.8}>
          <Text style={styles.fabIcon}>📅</Text>
          <Text style={styles.fabText}>Hoy</Text>
        </TouchableOpacity>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: {
    color: Colors.textPrimary,
    fontSize: Typography.fontSizeXL,
    fontWeight: Typography.fontWeightBold,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  testButton: {
    backgroundColor: Colors.cardBg,
    borderColor: Colors.gold,
    borderWidth: 1,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.sm,
  },
  testButtonText: {
    color: Colors.gold,
    fontSize: Typography.fontSizeXS - 1,
    fontWeight: Typography.fontWeightBold,
  },
  fetchIndicator: {
    marginRight: Spacing.xs,
  },
  headerSub: {
    color: Colors.textPrimary,
    fontSize: Typography.fontSizeSM,
    fontWeight: Typography.fontWeightSemiBold,
  },
  list: {
    paddingBottom: Spacing.xxl * 2,
    paddingTop: Spacing.sm,
  },
  centered: {
    flex: 1,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.md,
  },
  loadingText: {
    color: Colors.textSecondary,
    fontSize: Typography.fontSizeMD,
  },
  errorIcon: {
    fontSize: 40,
  },
  errorTitle: {
    color: Colors.textPrimary,
    fontSize: Typography.fontSizeXL,
    fontWeight: Typography.fontWeightBold,
  },
  errorSubtitle: {
    color: Colors.textSecondary,
    fontSize: Typography.fontSizeMD,
    textAlign: 'center',
    paddingHorizontal: Spacing.xl,
  },
  empty: {
    alignItems: 'center',
    gap: Spacing.md,
    paddingTop: Spacing.xxl * 2,
  },
  emptyIcon: {
    fontSize: 40,
  },
  emptyText: {
    color: Colors.textSecondary,
    fontSize: Typography.fontSizeLG,
  },
  fab: {
    position: 'absolute',
    bottom: Spacing.lg,
    right: Spacing.lg,
    backgroundColor: Colors.gold,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm + 2,
    borderRadius: Radius.round,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 5,
    elevation: 6,
  },
  fabIcon: {
    fontSize: 18,
  },
  fabText: {
    color: Colors.background,
    fontSize: Typography.fontSizeSM,
    fontWeight: Typography.fontWeightBold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.cardBg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    gap: Spacing.sm,
  },
  searchIcon: {
    fontSize: 15,
  },
  searchInput: {
    flex: 1,
    color: Colors.textPrimary,
    fontSize: Typography.fontSizeMD,
    paddingVertical: Spacing.xs,
  },
  searchClear: {
    color: Colors.textMuted,
    fontSize: 22,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
  },
});
