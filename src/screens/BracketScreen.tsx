import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useScoreboard } from '../hooks/useScoreboard';
import { ESPNEvent } from '../api/espn';
import { BracketMatch } from '../components/BracketMatch';
import { Colors, Typography, Spacing, Radius } from '../constants/theme';

const ROUND_SLUGS = [
  { slug: 'round-of-32', label: 'Ronda de 32', count: 16 },
  { slug: 'round-of-16', label: 'Octavos', count: 8 },
  { slug: 'quarterfinals', label: 'Cuartos', count: 4 },
  { slug: 'semifinals', label: 'Semifinales', count: 2 },
  { slug: 'third-place', label: '3er Puesto', count: 1 },
  { slug: 'final', label: 'Final', count: 1 },
];

interface BracketRoundInfo {
  type: 'round';
  slug: string;
  label: string;
  side: 'left' | 'right';
  count: number;
  indexOffset: number;
}

interface BracketCenterInfo {
  type: 'center';
}

interface BracketConnectorInfo {
  type: 'connector';
  direction: 'left' | 'right';
}

type BracketLayoutItem = BracketRoundInfo | BracketCenterInfo | BracketConnectorInfo;

const BRACKET_LAYOUT: BracketLayoutItem[] = [
  { type: 'round', slug: 'round-of-32', label: 'Ronda de 32', side: 'left', count: 8, indexOffset: 0 },
  { type: 'connector', direction: 'right' },
  { type: 'round', slug: 'round-of-16', label: 'Octavos', side: 'left', count: 4, indexOffset: 0 },
  { type: 'connector', direction: 'right' },
  { type: 'round', slug: 'quarterfinals', label: 'Cuartos', side: 'left', count: 2, indexOffset: 0 },
  { type: 'connector', direction: 'right' },
  { type: 'round', slug: 'semifinals', label: 'Semifinales', side: 'left', count: 1, indexOffset: 0 },
  { type: 'connector', direction: 'right' },
  { type: 'center' },
  { type: 'connector', direction: 'left' },
  { type: 'round', slug: 'semifinals', label: 'Semifinales', side: 'right', count: 1, indexOffset: 1 },
  { type: 'connector', direction: 'left' },
  { type: 'round', slug: 'quarterfinals', label: 'Cuartos', side: 'right', count: 2, indexOffset: 2 },
  { type: 'connector', direction: 'left' },
  { type: 'round', slug: 'round-of-16', label: 'Octavos', side: 'right', count: 4, indexOffset: 4 },
  { type: 'connector', direction: 'left' },
  { type: 'round', slug: 'round-of-32', label: 'Ronda de 32', side: 'right', count: 8, indexOffset: 8 },
];

function getSlugFromEvent(event: ESPNEvent): string {
  return event.season?.slug ?? '';
}

function matchesRound(event: ESPNEvent, slug: string): boolean {
  const s = getSlugFromEvent(event).toLowerCase();
  return (
    s === slug ||
    s.replace(/-/g, '') === slug.replace(/-/g, '') ||
    s.includes(slug.replace(/-/g, ''))
  );
}

function ColumnConnector({ direction }: { direction: 'left' | 'right' }) {
  return (
    <View style={styles.connectorColumn}>
      <Text style={styles.connectorArrow}>
        {direction === 'right' ? '➔' : '⬅'}
      </Text>
    </View>
  );
}

function RoundColumn({
  label,
  events,
  count,
  indexOffset,
}: {
  label: string;
  events: ESPNEvent[];
  count: number;
  indexOffset: number;
}) {
  const slots = Array.from({ length: count }, (_, i) => events[indexOffset + i]);

  return (
    <View style={styles.roundColumn}>
      <View style={styles.roundHeader}>
        <Text style={styles.roundLabel}>{label}</Text>
      </View>
      <View style={styles.matchesStack}>
        {slots.map((event, i) => (
          <BracketMatch key={event?.id ?? `tbd-${indexOffset}-${i}`} event={event} />
        ))}
      </View>
    </View>
  );
}

function CenterColumn({
  finalEvent,
  thirdPlaceEvent,
}: {
  finalEvent?: ESPNEvent;
  thirdPlaceEvent?: ESPNEvent;
}) {
  return (
    <View style={styles.roundColumn}>
      <View style={styles.roundHeader}>
        <Text style={styles.roundLabel}>Final</Text>
      </View>
      <View style={[styles.matchesStack, { justifyContent: 'center', gap: Spacing.xl }]}>
        <BracketMatch event={finalEvent} label="Gran Final" />
        <BracketMatch event={thirdPlaceEvent} label="3er Puesto" />
      </View>
    </View>
  );
}

export function BracketScreen() {
  const { data, isLoading } = useScoreboard();
  const events = data?.events ?? [];

  // Filter out group stage
  const knockoutEvents = events.filter(
    (e: ESPNEvent) => !matchesRound(e, 'group-stage') && e.season?.slug !== 'group-stage'
  );

  if (isLoading && !data) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={Colors.gold} />
        <Text style={styles.loadingText}>Cargando eliminatorias…</Text>
      </View>
    );
  }

  const hasKnockout = knockoutEvents.length > 0;

  function renderBracket(eventsList: ESPNEvent[]) {
    const roundEventsMap: Record<string, ESPNEvent[]> = {};
    ROUND_SLUGS.forEach(({ slug }) => {
      roundEventsMap[slug] = eventsList.filter((e) => matchesRound(e, slug));
    });

    return (
      <ScrollView style={{ flex: 1 }}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.bracketContent}
        >
          {BRACKET_LAYOUT.map((item, index) => {
            if (item.type === 'round') {
              const roundEvents = roundEventsMap[item.slug] ?? [];
              return (
                <RoundColumn
                  key={`${item.slug}-${item.side}`}
                  label={item.label}
                  events={roundEvents}
                  count={item.count}
                  indexOffset={item.indexOffset}
                />
              );
            } else if (item.type === 'center') {
              const finalEvent = roundEventsMap['final']?.[0];
              const thirdPlaceEvent = roundEventsMap['third-place']?.[0];
              return (
                <CenterColumn
                  key="center-column"
                  finalEvent={finalEvent}
                  thirdPlaceEvent={thirdPlaceEvent}
                />
              );
            } else if (item.type === 'connector') {
              return (
                <ColumnConnector
                  key={`connector-${index}`}
                  direction={item.direction}
                />
              );
            }
            return null;
          })}
        </ScrollView>
      </ScrollView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.background} />

      <View style={styles.header}>
        <Text style={styles.headerTitle}>🏆 Eliminatorias</Text>
        <Text style={styles.headerSub}>Fase Final</Text>
      </View>

      {!hasKnockout ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>🗓</Text>
          <Text style={styles.emptyTitle}>La Fase Final no ha comenzado</Text>
          <Text style={styles.emptySubtitle}>
            El cuadro de eliminatorias se completará después de la fase de grupos (28 de Jun).
          </Text>
          {renderBracket([])}
        </View>
      ) : (
        renderBracket(knockoutEvents)
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
  headerSub: {
    color: Colors.textPrimary,
    fontSize: Typography.fontSizeSM,
    fontWeight: Typography.fontWeightSemiBold,
  },
  bracketContent: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.xxl,
    gap: Spacing.sm,
    alignItems: 'flex-start',
  },
  roundColumn: {
    width: 140,
    gap: Spacing.sm,
  },
  roundHeader: {
    backgroundColor: Colors.cardBgAlt,
    borderRadius: Radius.sm,
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.borderGold,
    marginBottom: Spacing.xs,
  },
  roundLabel: {
    color: Colors.gold,
    fontSize: Typography.fontSizeSM,
    fontWeight: Typography.fontWeightBold,
    textAlign: 'center',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  matchesStack: {
    height: 680,
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  connectorColumn: {
    width: 30,
    height: 680,
    marginTop: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  connectorArrow: {
    color: Colors.border,
    fontSize: Typography.fontSizeXL,
    fontWeight: Typography.fontWeightBold,
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
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    paddingTop: Spacing.xl,
    gap: Spacing.md,
  },
  emptyIcon: {
    fontSize: 40,
  },
  emptyTitle: {
    color: Colors.textPrimary,
    fontSize: Typography.fontSizeLG,
    fontWeight: Typography.fontWeightBold,
  },
  emptySubtitle: {
    color: Colors.textSecondary,
    fontSize: Typography.fontSizeSM,
    textAlign: 'center',
    paddingHorizontal: Spacing.xl,
  },
});
