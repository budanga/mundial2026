import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Typography, Spacing } from '../constants/theme';

interface DateSectionHeaderProps {
  title: string;
}

export function DateSectionHeader({ title }: DateSectionHeaderProps) {
  return (
    <View style={styles.container}>
      <View style={styles.line} />
      <Text style={styles.title}>{title}</Text>
      <View style={styles.line} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.background,
  },
  line: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.border,
  },
  title: {
    color: Colors.gold,
    fontSize: Typography.fontSizeSM,
    fontWeight: Typography.fontWeightBold,
    letterSpacing: 0.6,
    marginHorizontal: Spacing.md,
    textTransform: 'uppercase',
  },
});
