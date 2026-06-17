import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { ESPNEvent, getHomeAway, isFinishedStatus } from '../api/espn';
import { Colors, Typography, Spacing, Radius } from '../constants/theme';

interface BracketMatchProps {
  event?: ESPNEvent;
  label?: string;
}

export function BracketMatch({ event, label }: BracketMatchProps) {
  if (!event) {
    return (
      <View style={styles.card}>
        {label ? <Text style={styles.label}>{label}</Text> : null}
        <View style={styles.tbdRow}>
          <Text style={styles.tbd}>Por definir</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.tbdRow}>
          <Text style={styles.tbd}>Por definir</Text>
        </View>
      </View>
    );
  }

  const comp = event.competitions[0];
  const { home, away } = getHomeAway(comp);
  const isFinished = isFinishedStatus(comp.status.type.name);

  function TeamSlot({
    competitor,
    isWinner,
  }: {
    competitor: typeof home;
    isWinner: boolean;
  }) {
    return (
      <View style={[styles.teamSlot, isWinner && styles.winnerSlot]}>
        <Image
          source={{ uri: competitor.team.logo }}
          style={styles.logo}
          resizeMode="contain"
        />
        <Text
          style={[styles.teamName, isWinner && styles.winnerName]}
          numberOfLines={1}
        >
          {competitor.team.abbreviation}
        </Text>
        {isFinished && (
          <Text style={[styles.slotScore, isWinner && styles.slotScoreWinner]}>
            {competitor.score}
          </Text>
        )}
      </View>
    );
  }

  return (
    <View style={styles.card}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <TeamSlot competitor={home} isWinner={home.winner} />
      <View style={styles.divider} />
      <TeamSlot competitor={away} isWinner={away.winner} />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.cardBg,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
    width: 130,
    marginVertical: Spacing.xs,
  },
  label: {
    color: Colors.gold,
    fontSize: 9,
    fontWeight: Typography.fontWeightBold,
    textAlign: 'center',
    paddingVertical: 3,
    backgroundColor: Colors.cardBgAlt,
    letterSpacing: 0.3,
    textTransform: 'uppercase',
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  teamSlot: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 6,
    gap: Spacing.xs,
  },
  winnerSlot: {
    backgroundColor: Colors.qualify1st + '44',
  },
  logo: {
    width: 20,
    height: 20,
  },
  teamName: {
    color: Colors.textSecondary,
    fontSize: Typography.fontSizeXS,
    fontWeight: Typography.fontWeightSemiBold,
    flex: 1,
  },
  winnerName: {
    color: Colors.textPrimary,
    fontWeight: Typography.fontWeightBold,
  },
  slotScore: {
    color: Colors.textSecondary,
    fontSize: Typography.fontSizeXS,
    fontWeight: Typography.fontWeightBold,
    minWidth: 14,
    textAlign: 'right',
  },
  slotScoreWinner: {
    color: Colors.gold,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
  },
  tbdRow: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 8,
  },
  tbd: {
    color: Colors.textMuted,
    fontSize: Typography.fontSizeXS,
    fontStyle: 'italic',
  },
});
