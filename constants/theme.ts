// FitGuide Theme Constants - Pro Athlete Aesthetic
export const Colors = {
  background: '#0A0A0A', // Matte Black
  accent: '#CCFF00', // Electric Lime
  cardBg: '#1B3022', // Deep Forest Green for depth
  textPrimary: '#FFFFFF', // Crisp White
  textSecondary: '#A0A0A0',
  success: '#CCFF00',
  warning: '#FFB800',
  error: '#FF3B30',
  border: '#1B3022', // Deep Forest Green for subtle borders
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
