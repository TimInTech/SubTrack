// ===== Modern Color Palette =====
export const COLORS = {
  // Primary Colors
  primary: '#7C3AED',        // Vivid Purple
  primaryLight: '#A78BFA',   // Light Purple
  primaryDark: '#5B21B6',    // Dark Purple
  
  // Secondary Colors
  secondary: '#06B6D4',      // Cyan
  secondaryLight: '#67E8F9', // Light Cyan
  secondaryDark: '#0891B2',  // Dark Cyan
  
  // Accent Colors
  accent: '#F59E0B',         // Amber
  success: '#10B981',        // Emerald
  warning: '#F97316',        // Orange
  error: '#EF4444',          // Red
  info: '#3B82F6',           // Blue
  
  // Neutral Colors
  background: '#0F0F1A',     // Deep Dark
  surface: '#1A1A2E',        // Card Background
  surfaceLight: '#252542',   // Lighter Surface
  border: '#3D3D5C',         // Border Color
  
  // Text Colors
  textPrimary: '#FFFFFF',
  textSecondary: '#A0A0B8',
  textMuted: '#6B6B80',
  
  // Gradient Colors
  gradientPurple: ['#7C3AED', '#A78BFA'],
  gradientCyan: ['#06B6D4', '#67E8F9'],
  gradientOrange: ['#F97316', '#FBBF24'],
  gradientGreen: ['#10B981', '#34D399'],
  gradientBlue: ['#3B82F6', '#60A5FA'],
  gradientPink: ['#EC4899', '#F472B6'],
  
  // Glassmorphism
  glass: 'rgba(255, 255, 255, 0.05)',
  glassBorder: 'rgba(255, 255, 255, 0.1)',
};

// ===== Spacing =====
export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

// ===== Border Radius =====
export const RADIUS = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
};

// ===== Font Sizes =====
export const FONTS = {
  xs: 10,
  sm: 12,
  md: 14,
  lg: 16,
  xl: 18,
  xxl: 24,
  xxxl: 32,
  display: 40,
};

// ===== Shadows =====
export const SHADOWS = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  lg: {
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  glow: {
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10,
  },
};
