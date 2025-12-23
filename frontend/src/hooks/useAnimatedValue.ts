import { useEffect, useRef } from 'react';
import { Animated } from 'react-native';

/**
 * Hook for animating number counters
 */
export const useAnimatedCounter = (targetValue: number, duration: number = 1000) => {
  const animatedValue = useRef(new Animated.Value(0)).current;
  const displayValue = useRef(0);

  useEffect(() => {
    animatedValue.setValue(0);
    
    const animation = Animated.timing(animatedValue, {
      toValue: targetValue,
      duration,
      useNativeDriver: false,
    });

    animation.start();

    const listener = animatedValue.addListener(({ value }) => {
      displayValue.current = Math.round(value);
    });

    return () => {
      animatedValue.removeListener(listener);
      animation.stop();
    };
  }, [targetValue, duration, animatedValue]);

  return { animatedValue, displayValue };
};

/**
 * Hook for fade-in animations
 */
export const useFadeIn = (delay: number = 0) => {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    const animation = Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 500,
        delay,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 500,
        delay,
        useNativeDriver: true,
      }),
    ]);

    animation.start();

    return () => animation.stop();
  }, [delay, opacity, translateY]);

  return { opacity, translateY };
};

/**
 * Hook for scale animations on press
 */
export const useScaleAnimation = () => {
  const scale = useRef(new Animated.Value(1)).current;

  const onPressIn = () => {
    Animated.spring(scale, {
      toValue: 0.95,
      useNativeDriver: true,
    }).start();
  };

  const onPressOut = () => {
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  return { scale, onPressIn, onPressOut };
};
