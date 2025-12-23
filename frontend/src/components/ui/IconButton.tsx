import React from 'react';
import { TouchableOpacity, StyleSheet, View, Text } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, RADIUS } from '../../constants/theme';

interface IconButtonProps {
  icon: string;
  label?: string;
  onPress: () => void;
  color?: string;
  backgroundColor?: string;
  size?: number;
}

export const IconButton: React.FC<IconButtonProps> = ({
  icon,
  label,
  onPress,
  color = COLORS.primary,
  backgroundColor = 'transparent',
  size = 24,
}) => {
  return (
    <TouchableOpacity
      style={[styles.button, { backgroundColor }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <MaterialCommunityIcons name={icon as any} size={size} color={color} />
      {label && <Text style={[styles.label, { color }]}>{label}</Text>}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    padding: 8,
    borderRadius: RADIUS.sm,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
  },
});
