import React, { useEffect, useState, useRef } from 'react';
import { Text, StyleSheet, TextStyle, Animated } from 'react-native';
import { formatCurrency } from '../../utils/format';
import { COLORS, FONTS } from '../../constants/theme';

interface AnimatedNumberProps {
  value: number;
  style?: TextStyle;
  duration?: number;
  prefix?: string;
  suffix?: string;
  isCurrency?: boolean;
}

export const AnimatedNumber: React.FC<AnimatedNumberProps> = ({
  value,
  style,
  duration = 1000,
  prefix = '',
  suffix = '',
  isCurrency = true,
}) => {
  const [displayValue, setDisplayValue] = useState(0);
  const animatedValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    animatedValue.setValue(0);
    
    const animation = Animated.timing(animatedValue, {
      toValue: value,
      duration,
      useNativeDriver: false,
    });

    const listener = animatedValue.addListener(({ value: v }) => {
      setDisplayValue(Math.round(v));
    });

    animation.start();

    return () => {
      animatedValue.removeListener(listener);
      animation.stop();
    };
  }, [value, duration, animatedValue]);

  const formattedValue = isCurrency 
    ? formatCurrency(displayValue) 
    : `${prefix}${displayValue}${suffix}`;

  return (
    <Text style={[styles.number, style]}>
      {formattedValue}
    </Text>
  );
};

const styles = StyleSheet.create({
  number: {
    fontSize: FONTS.xxxl,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
  },
});
