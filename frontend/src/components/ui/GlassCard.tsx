import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, RADIUS, SHADOWS } from '../../constants/theme';

interface GlassCardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  gradient?: string[];
  borderColor?: string;
  noPadding?: boolean;
}

export const GlassCard: React.FC<GlassCardProps> = ({
  children,
  style,
  gradient,
  borderColor = COLORS.glassBorder,
  noPadding = false,
}) => {
  if (gradient) {
    return (
      <LinearGradient
        colors={gradient as [string, string]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[
          styles.gradientCard,
          !noPadding && styles.padding,
          style,
        ]}
      >
        {children}
      </LinearGradient>
    );
  }

  return (
    <View
      style={[
        styles.glassCard,
        { borderColor },
        !noPadding && styles.padding,
        style,
      ]}
    >
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  glassCard: {
    backgroundColor: COLORS.glass,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    ...SHADOWS.md,
  },
  gradientCard: {
    borderRadius: RADIUS.lg,
    ...SHADOWS.lg,
  },
  padding: {
    padding: 16,
  },
});
