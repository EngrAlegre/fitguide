// Fitguide Theme Constants
export const Colors = {
  background: '#1B3022', // Deep Forest Green
  accent: '#CCFF00', // Electric Lime
  cardBg: '#2D2D2D', // Slate Gray
  textPrimary: '#FFFFFF', // Crisp White
  textSecondary: '#A0A0A0',
  success: '#00FF88',
  error: '#FF3B30',
  border: '#3A3A3A',
};

export const Fonts = {
  heading: {
    fontWeight: '700' as const,
    letterSpacing: -0.5,
  },
  body: {
    fontWeight: '400' as const,
  },
  data: {
    fontWeight: '600' as const,
    letterSpacing: 0.5,
  },
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const BorderRadius = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
};
