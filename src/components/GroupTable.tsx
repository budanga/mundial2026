import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { ESPNStandingGroup } from '../api/espn';
import { Colors, Typography, Spacing, Radius } from '../constants/theme';

interface GroupTableProps {
  group: ESPNStandingGroup;
  groupIndex: number;
}

function getStat(
  stats: Array<{ name: string; displayValue: string; value: number }>,
  name: string
): string {
  return stats.find((s) => s.name === name)?.displayValue ?? '-';
}

export function GroupTable({ group, groupIndex }: GroupTableProps) {
  const entries = group.standings?.entries ?? [];

  return (
    <View style={styles.container}>
      {/* Group Header */}
      <View style={styles.groupHeader}>
        <Text style={styles.groupLetter}>
          Grupo {group.abbreviation || String.fromCharCode(65 + groupIndex)}
        </Text>
      </View>

      {/* Column Headers */}
      <View style={styles.headerRow}>
        <Text style={[styles.headerCell, styles.posCell]}>#</Text>
        <Text style={[styles.headerCell, styles.teamCell]}>Equipo</Text>
        <Text style={styles.headerCell}>PJ</Text>
        <Text style={styles.headerCell}>G</Text>
        <Text style={styles.headerCell}>E</Text>
        <Text style={styles.headerCell}>P</Text>
        <Text style={styles.headerCell}>GF</Text>
        <Text style={styles.headerCell}>GC</Text>
        <Text style={styles.headerCell}>DG</Text>
        <Text style={[styles.headerCell, styles.ptsCell]}>PTS</Text>
      </View>

      {/* Team rows */}
      {entries.map((entry, idx) => {
        const pos = idx + 1;
        const isTop2 = pos <= 2;
        const is3rd = pos === 3;

        const mp = getStat(entry.stats, 'gamesPlayed');
        const w = getStat(entry.stats, 'wins');
        const d = getStat(entry.stats, 'ties');
        const l = getStat(entry.stats, 'losses');
        const gf = getStat(entry.stats, 'pointsFor');
        const ga = getStat(entry.stats, 'pointsAgainst');
        const gd = getStat(entry.stats, 'pointDifferential');
        const pts = getStat(entry.stats, 'points');

        const logoUrl =
          entry.team.logos?.find((l) => l.rel.includes('default'))?.href ??
          entry.team.logo ??
          '';

        return (
          <View
            key={entry.team.id}
            style={[
              styles.teamRow,
              isTop2 && styles.qualifyTop2,
              is3rd && styles.qualify3rd,
              idx < entries.length - 1 && styles.rowBorder,
            ]}
          >
            <Text style={[styles.cell, styles.posCell, isTop2 && styles.posTop2]}>
              {pos}
            </Text>
            <View style={[styles.teamNameCell, styles.teamCell]}>
              {logoUrl ? (
                <Image source={{ uri: logoUrl }} style={styles.logo} resizeMode="contain" />
              ) : null}
              <Text style={styles.teamName} numberOfLines={1}>
                {entry.team.abbreviation}
              </Text>
            </View>
            <Text style={styles.cell}>{mp}</Text>
            <Text style={styles.cell}>{w}</Text>
            <Text style={styles.cell}>{d}</Text>
            <Text style={styles.cell}>{l}</Text>
            <Text style={styles.cell}>{gf}</Text>
            <Text style={styles.cell}>{ga}</Text>
            <Text style={styles.cell}>{gd}</Text>
            <Text style={[styles.cell, styles.ptsCell, styles.ptsValue]}>{pts}</Text>
          </View>
        );
      })}

      {entries.length === 0 && (
        <View style={styles.emptyRow}>
          <Text style={styles.emptyText}>Sin datos de posiciones aún</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.cardBg,
    borderRadius: Radius.lg,
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  groupHeader: {
    backgroundColor: Colors.cardBgAlt,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  groupLetter: {
    color: Colors.gold,
    fontSize: Typography.fontSizeMD,
    fontWeight: Typography.fontWeightBold,
    letterSpacing: 0.5,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    backgroundColor: Colors.sectionHeader,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerCell: {
    color: Colors.textMuted,
    fontSize: Typography.fontSizeXS,
    fontWeight: Typography.fontWeightBold,
    textAlign: 'center',
    flex: 1,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  teamRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.sm,
  },
  rowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  qualifyTop2: {
    backgroundColor: Colors.qualify1st + '55',
    borderLeftWidth: 3,
    borderLeftColor: Colors.qualify1stText,
  },
  qualify3rd: {
    backgroundColor: Colors.qualify3rd + '55',
    borderLeftWidth: 3,
    borderLeftColor: Colors.qualify3rdText,
  },
  posCell: {
    flex: 0.6,
  },
  teamCell: {
    flex: 2.5,
  },
  ptsCell: {
    flex: 1.2,
  },
  cell: {
    color: Colors.textPrimary,
    fontSize: Typography.fontSizeXS,
    textAlign: 'center',
    flex: 1,
  },
  posTop2: {
    color: Colors.qualify1stText,
    fontWeight: Typography.fontWeightBold,
  },
  teamNameCell: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  logo: {
    width: 18,
    height: 18,
  },
  teamName: {
    color: Colors.textPrimary,
    fontSize: Typography.fontSizeXS,
    fontWeight: Typography.fontWeightSemiBold,
    flex: 1,
  },
  ptsValue: {
    fontWeight: Typography.fontWeightBold,
    color: Colors.goldLight,
  },
  emptyRow: {
    paddingVertical: Spacing.lg,
    alignItems: 'center',
  },
  emptyText: {
    color: Colors.textMuted,
    fontSize: Typography.fontSizeSM,
  },
});
