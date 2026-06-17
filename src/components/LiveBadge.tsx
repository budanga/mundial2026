import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text } from 'react-native';
import { Colors, Typography, Radius, Spacing } from '../constants/theme';

export function LiveBadge() {
  const opacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.2,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, [opacity]);

  return (
    <Animated.View style={[styles.badge, { opacity }]}>
      <Text style={styles.text}>● LIVE</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  badge: {
    backgroundColor: Colors.live,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: Radius.round,
    alignSelf: 'flex-start',
  },
  text: {
    color: Colors.textPrimary,
    fontSize: Typography.fontSizeXS,
    fontWeight: Typography.fontWeightBold,
    letterSpacing: 0.8,
  },
});
