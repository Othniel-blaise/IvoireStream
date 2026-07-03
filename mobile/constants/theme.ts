import { Platform } from 'react-native';

export const Colors = {
  green:   '#7C3AED',
  green2:  '#FF2E7E',
  orange:  '#FFD93D',
  orange2: '#FF6FA0',
  gold:    '#FFB930',
  red:     '#FF3B55',
  purple:  '#7C3AED',

  dark:    '#15121C',
  dark2:   '#0F0B18',
  dark3:   '#1E1730',
  surface: '#2A1F42',
  card:    '#1A1428',

  ivory:   '#FFF9F4',
  gray:    '#9A8AAE',
  grayDim: 'rgba(154,138,174,0.5)',

  white:   '#FFFFFF',
  black:   '#000000',

  // Semantic
  background:  '#15121C',
  text:        '#FFF9F4',
  textSecond:  '#9A8AAE',
  border:      'rgba(255,255,255,0.07)',
  overlay:     'rgba(0,0,0,0.6)',
} as const;

// expo-linear-gradient requires a tuple with at least 2 elements
type GradientTuple = readonly [string, string, ...string[]];

export const Gradients: Record<string, GradientTuple> = {
  primary:  [Colors.green, Colors.green2, Colors.orange],
  bolt:     [Colors.green, Colors.orange],
  gold:     [Colors.gold,  Colors.orange],
  darkCard: [Colors.dark3, Colors.dark2],
  liveGate: ['rgba(255,185,48,0.12)', 'rgba(255,217,61,0.12)'],
};

export const Typography = {
  // Families (loaded via expo-font)
  fontSyne:  'Syne_900Black',
  fontMono:  'SpaceMono_400Regular',
  fontBody:  Platform.OS === 'ios' ? 'System' : 'sans-serif',

  sizes: {
    xs:   10,
    sm:   12,
    base: 14,
    md:   16,
    lg:   20,
    xl:   24,
    '2xl': 30,
    '3xl': 38,
    '4xl': 48,
  },

  weights: {
    light:   '300',
    regular: '400',
    medium:  '500',
    bold:    '700',
    black:   '900',
  },

  letterSpacing: {
    tight:  -0.5,
    normal: 0,
    wide:   1.5,
    wider:  3,
    widest: 4,
  },
} as const;

export const Spacing = {
  xs:   4,
  sm:   8,
  md:   12,
  base: 16,
  lg:   20,
  xl:   24,
  '2xl': 32,
  '3xl': 48,
  '4xl': 64,
} as const;

export const Radius = {
  sm:   6,
  md:   10,
  lg:   14,
  xl:   18,
  '2xl': 24,
  full: 9999,
} as const;

export const Shadows = {
  greenGlow: {
    shadowColor: Colors.green,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 8,
  },
  goldGlow: {
    shadowColor: Colors.gold,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
  },
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 10,
  },
} as const;
