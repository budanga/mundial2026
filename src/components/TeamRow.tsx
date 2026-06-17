import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { Colors, Typography, Spacing } from '../constants/theme';

interface TeamRowProps {
  logoUrl: string;
  name: string;
  score?: string;
  isWinner?: boolean;
  align?: 'left' | 'right';
  large?: boolean;
}

export function TeamRow({
  logoUrl,
  name,
  score,
  isWinner = false,
  align = 'left',
  large = false,
}: TeamRowProps) {
  const isRight = align === 'right';

  return (
    <View style={[styles.container, isRight && styles.containerRight]}>
      <Image
        source={{ uri: logoUrl }}
        style={[styles.logo, large && styles.logoLarge]}
        resizeMode="contain"
      />
      <Text
        style={[
          styles.name,
          large && styles.nameLarge,
          isWinner && styles.nameWinner,
          isRight && styles.nameRight,
        ]}
        numberOfLines={1}
        ellipsizeMode="tail"
      >
        {name}
      </Text>
      {score !== undefined && (
        <Text style={[styles.score, large && styles.scoreLarge, isWinner && styles.scoreWinner]}>
          {score}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: Spacing.sm,
  },
  containerRight: {
    flexDirection: 'row-reverse',
    justifyContent: 'flex-start',
  },
  logo: {
    width: 28,
    height: 28,
  },
  logoLarge: {
    width: 40,
    height: 40,
  },
  name: {
    color: Colors.textPrimary,
    fontSize: Typography.fontSizeMD,
    fontWeight: Typography.fontWeightSemiBold,
    flex: 1,
  },
  nameLarge: {
    fontSize: Typography.fontSizeLG,
    fontWeight: Typography.fontWeightBold,
  },
  nameWinner: {
    color: Colors.goldLight,
  },
  nameRight: {
    textAlign: 'right',
  },
  score: {
    color: Colors.textPrimary,
    fontSize: Typography.fontSizeXL,
    fontWeight: Typography.fontWeightBold,
    minWidth: 24,
    textAlign: 'center',
  },
  scoreLarge: {
    fontSize: Typography.fontSizeXXL,
  },
  scoreWinner: {
    color: Colors.goldLight,
  },
});
