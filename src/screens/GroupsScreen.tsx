import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  StatusBar,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { useScoreboard } from '../hooks/useScoreboard';
import { GroupTable } from '../components/GroupTable';
import { Colors, Typography, Spacing, Radius } from '../constants/theme';
import {
  ESPNEvent,
  getHomeAway,
  isFinishedStatus,
  isLiveStatus,
} from '../api/espn';
import { getAllPredictions, Prediction } from '../utils/storageUtils';

interface CalculatedStandingEntry {
  team: {
    id: string;
    displayName: string;
    abbreviation: string;
    logo: string;
  };
  stats: Array<{
    name: string;
    displayValue: string;
    value: number;
  }>;
}

interface CalculatedGroup {
  name: string;
  abbreviation: string;
  standings: {
    entries: CalculatedStandingEntry[];
  };
}

function calculateStandings(
  events: ESPNEvent[],
  predictions: Record<string, Prediction>
): CalculatedGroup[] {
  const groupMap = new Map<string, Map<string, {
    team: { id: string; displayName: string; abbreviation: string; logo: string };
    pj: number; g: number; e: number; p: number; gf: number; gc: number; dg: number; pts: number;
  }>>();

  // 1. Initialize groups and teams from all matches
  for (const event of events) {
    const comp = event.competitions[0];
    if (!comp) continue;

    const note = comp.altGameNote ?? '';
    const match = note.match(/Group\s+([A-L])/i);
    if (!match) continue;

    const groupLetter = match[1].toUpperCase();
    const { home, away } = getHomeAway(comp);

    if (!groupMap.has(groupLetter)) {
      groupMap.set(groupLetter, new Map());
    }

    const teamMap = groupMap.get(groupLetter)!;

    if (!teamMap.has(home.team.id)) {
      teamMap.set(home.team.id, {
        team: {
          id: home.team.id,
          displayName: home.team.displayName,
          abbreviation: home.team.abbreviation,
          logo: home.team.logo,
        },
        pj: 0, g: 0, e: 0, p: 0, gf: 0, gc: 0, dg: 0, pts: 0,
      });
    }

    if (!teamMap.has(away.team.id)) {
      teamMap.set(away.team.id, {
        team: {
          id: away.team.id,
          displayName: away.team.displayName,
          abbreviation: away.team.abbreviation,
          logo: away.team.logo,
        },
        pj: 0, g: 0, e: 0, p: 0, gf: 0, gc: 0, dg: 0, pts: 0,
      });
    }
  }

  // 2. Accumulate stats for played/live matches or predictions
  for (const event of events) {
    const comp = event.competitions[0];
    if (!comp) continue;

    const note = comp.altGameNote ?? '';
    const match = note.match(/Group\s+([A-L])/i);
    if (!match) continue;

    const groupLetter = match[1].toUpperCase();
    const { home, away } = getHomeAway(comp);
    const statusName = comp.status.type.name;

    const isPlayedReal = isFinishedStatus(statusName) || isLiveStatus(statusName) || statusName === 'STATUS_HALFTIME';
    const pred = predictions[event.id];
    const isPredicted = !isPlayedReal && pred !== undefined;

    if (isPlayedReal || isPredicted) {
      let homeScore = 0;
      let awayScore = 0;

      if (isPlayedReal) {
        homeScore = parseInt(home.score, 10);
        awayScore = parseInt(away.score, 10);
      } else {
        homeScore = pred.homeScore;
        awayScore = pred.awayScore;
      }

      if (!isNaN(homeScore) && !isNaN(awayScore)) {
        const teamMap = groupMap.get(groupLetter)!;
        const homeStanding = teamMap.get(home.team.id);
        const awayStanding = teamMap.get(away.team.id);

        if (homeStanding && awayStanding) {
          homeStanding.pj += 1;
          awayStanding.pj += 1;
          homeStanding.gf += homeScore;
          awayStanding.gf += awayScore;
          homeStanding.gc += awayScore;
          awayStanding.gc += homeScore;
          homeStanding.dg = homeStanding.gf - homeStanding.gc;
          awayStanding.dg = awayStanding.gf - awayStanding.gc;

          if (homeScore > awayScore) {
            homeStanding.g += 1;
            homeStanding.pts += 3;
            awayStanding.p += 1;
          } else if (awayScore > homeScore) {
            awayStanding.g += 1;
            awayStanding.pts += 3;
            homeStanding.p += 1;
          } else {
            homeStanding.e += 1;
            homeStanding.pts += 1;
            awayStanding.e += 1;
            awayStanding.pts += 1;
          }
        }
      }
    }
  }

  // 3. Format and sort groups
  const result: CalculatedGroup[] = [];

  for (const [groupLetter, teamMap] of groupMap.entries()) {
    const entries = Array.from(teamMap.values());

    // Sort by Points -> Goal Diff -> Goals For -> Alphabetical Display Name
    entries.sort((a, b) => {
      if (b.pts !== a.pts) return b.pts - a.pts;
      if (b.dg !== a.dg) return b.dg - a.dg;
      if (b.gf !== a.gf) return b.gf - a.gf;
      return a.team.displayName.localeCompare(b.team.displayName);
    });

    const formattedEntries: CalculatedStandingEntry[] = entries.map((e) => ({
      team: e.team,
      stats: [
        { name: 'gamesPlayed', displayValue: String(e.pj), value: e.pj },
        { name: 'wins', displayValue: String(e.g), value: e.g },
        { name: 'ties', displayValue: String(e.e), value: e.e },
        { name: 'losses', displayValue: String(e.p), value: e.p },
        { name: 'pointsFor', displayValue: String(e.gf), value: e.gf },
        { name: 'pointsAgainst', displayValue: String(e.gc), value: e.gc },
        { name: 'pointDifferential', displayValue: (e.dg > 0 ? '+' : '') + e.dg, value: e.dg },
        { name: 'points', displayValue: String(e.pts), value: e.pts },
      ],
    }));

    result.push({
      name: `Grupo ${groupLetter}`,
      abbreviation: groupLetter,
      standings: {
        entries: formattedEntries,
      },
    });
  }

  // Sort groups alphabetically (A to L)
  result.sort((a, b) => a.abbreviation.localeCompare(b.abbreviation));
  return result;
}

export function GroupsScreen() {
  const { data, isLoading, error } = useScoreboard();
  const [predictions, setPredictions] = useState<Record<string, Prediction>>({});

  useFocusEffect(
    useCallback(() => {
      let active = true;
      getAllPredictions().then((preds) => {
        if (active) {
          setPredictions(preds);
        }
      });
      return () => {
        active = false;
      };
    }, [])
  );

  const events = data?.events ?? [];
  const groups = calculateStandings(events, predictions);

  if (isLoading && !data) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={Colors.gold} />
        <Text style={styles.loadingText}>Cargando posiciones…</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.background} />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>📊 Grupos</Text>
        <Text style={styles.headerSub}>Copa Mundial 2026</Text>
      </View>

      {/* Legend */}
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: Colors.qualify1stText }]} />
          <Text style={styles.legendText}>Clasifican (Top 2 + Mejores 3º)</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: Colors.qualify3rdText }]} />
          <Text style={styles.legendText}>Posible clasificado</Text>
        </View>
      </View>

      {groups.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>🏆</Text>
          <Text style={styles.emptyTitle}>Posiciones próximamente</Text>
          <Text style={styles.emptySubtitle}>
            Las posiciones de los grupos aparecerán aquí a medida que avance el torneo.
          </Text>
          {error && (
            <Text style={styles.errorHint}>
              (No se pudo cargar desde ESPN — comprueba tu conexión)
            </Text>
          )}
        </View>
      ) : (
        <FlatList
          data={groups}
          keyExtractor={(item) => item.abbreviation}
          renderItem={({ item, index }) => (
            <GroupTable group={item as any} groupIndex={index} />
          )}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
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

  legend: {
    flexDirection: 'row',
    gap: Spacing.lg,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    marginTop: Spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    color: Colors.textSecondary,
    fontSize: Typography.fontSizeXS,
  },
  list: {
    paddingTop: Spacing.md,
    paddingBottom: Spacing.xxl,
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
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    gap: Spacing.md,
  },
  emptyIcon: {
    fontSize: 52,
  },
  emptyTitle: {
    color: Colors.textPrimary,
    fontSize: Typography.fontSizeXL,
    fontWeight: Typography.fontWeightBold,
    textAlign: 'center',
  },
  emptySubtitle: {
    color: Colors.textSecondary,
    fontSize: Typography.fontSizeMD,
    textAlign: 'center',
    lineHeight: 22,
  },
  errorHint: {
    color: Colors.textMuted,
    fontSize: Typography.fontSizeSM,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});

