import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Text } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, RADIUS, FONTS } from '../../constants/theme';

interface ProgressBarProps {
  progress: number; // 0-100
  label?: string;
  value?: string;
  gradient?: string[];
  height?: number;
  showPercentage?: boolean;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  progress,
  label,
  value,
  gradient = COLORS.gradientPurple,
  height = 8,
  showPercentage = false,
}) => {
  const animatedWidth = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(animatedWidth, {
      toValue: Math.min(progress, 100),
      duration: 1000,
      useNativeDriver: false,
    }).start();
  }, [progress, animatedWidth]);

  const width = animatedWidth.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%'],
  });

  return (
    <View style={styles.container}>
      {(label || value) && (
        <View style={styles.labelRow}>
          {label && <Text style={styles.label}>{label}</Text>}
          {value && <Text style={styles.value}>{value}</Text>}
        </View>
      )}
      <View style={[styles.track, { height }]}>
        <Animated.View style={[styles.progressContainer, { width, height }]}>
          <LinearGradient
            colors={gradient as [string, string]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[styles.progress, { height }]}
          />
        </Animated.View>
      </View>
      {showPercentage && (
        <Text style={styles.percentage}>{Math.round(progress)}%</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  label: {
    fontSize: FONTS.sm,
    color: COLORS.textSecondary,
  },
  value: {
    fontSize: FONTS.sm,
    color: COLORS.textPrimary,
    fontWeight: '600',
  },
  track: {
    width: '100%',
    backgroundColor: COLORS.surfaceLight,
    borderRadius: RADIUS.full,
    overflow: 'hidden',
  },
  progressContainer: {
    borderRadius: RADIUS.full,
    overflow: 'hidden',
  },
  progress: {
    width: '100%',
    borderRadius: RADIUS.full,
  },
  percentage: {
    fontSize: FONTS.xs,
    color: COLORS.textMuted,
    marginTop: 4,
    textAlign: 'right',
  },
});
