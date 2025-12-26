import React from 'react';
import { TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, SHADOWS } from '../../constants/theme';
import { useScaleAnimation } from '../../hooks/useAnimatedValue';

interface FABProps {
  onPress: () => void;
  icon?: string;
  gradient?: string[];
  testID?: string;
}

export const FAB: React.FC<FABProps> = ({
  onPress,
  icon = 'plus',
  gradient = COLORS.gradientPurple,
  testID,
}) => {
  const { scale, onPressIn, onPressOut } = useScaleAnimation();
  const insets = useSafeAreaInsets();
  const bottomOffset = Math.max(insets.bottom + 80, 80);

  return (
    <Animated.View
      style={[
        styles.container,
        { bottom: bottomOffset, transform: [{ scale }] },
      ]}
    >
      <TouchableOpacity
        onPress={onPress}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        activeOpacity={0.9}
        testID={testID}
        accessibilityRole="button"
        accessibilityLabel="Abo hinzufügen"
        accessible
      >
        <LinearGradient
          colors={gradient as [string, string]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.fab}
        >
          <MaterialCommunityIcons name={icon as any} size={28} color="#fff" />
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    right: 20,
    bottom: 80,
    zIndex: 999,
    elevation: 12,
    ...SHADOWS.glow,
  },
  fab: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
