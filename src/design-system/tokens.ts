/**
 * VETMIND OFFICIAL DESIGN SYSTEM TOKENS
 */

export const colors = {
  clinicalBlue: '#4F46E5',
  clinicalBlueDark: '#3730A3',
  clinicalBlueLight: '#EEF2FF',
  trustedGreen: '#0F8A5F',
  greenDark: '#08704C',
  greenLight: '#ECFDF5',
  background: '#F7F7F5',
  surface: '#FFFFFF',
  surfaceSubtle: '#FAF9F6',
  text: '#292D3A',
  secondary: '#667085',
  tertiary: '#98A2B3',
  border: '#E7E7E3',
  borderSubtle: '#F0F0EC',
  urgency: {
    critical: '#DC2626',
    high: '#EA580C',
    moderate: '#D97706',
    low: '#0F8A5F',
  },
} as const;

export const typography = {
  fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  scale: {
    display1: { size: '36px', lineHeight: '44px', weight: '700' },
    heading1: { size: '28px', lineHeight: '36px', weight: '600' },
    heading2: { size: '22px', lineHeight: '28px', weight: '600' },
    heading3: { size: '18px', lineHeight: '24px', weight: '500' },
    bodyLarge: { size: '16px', lineHeight: '24px', weight: '400' },
    bodyDefault: { size: '14px', lineHeight: '20px', weight: '400' },
    caption: { size: '12px', lineHeight: '16px', weight: '500' },
  },
} as const;

export const spacing = {
  xs: '4px',
  sm: '8px',
  md: '12px',
  lg: '16px',
  xl: '24px',
  '2xl': '32px',
  '3xl': '48px',
  '4xl': '64px',
} as const;

export const radius = {
  xs: '4px',
  sm: '6px',
  md: '8px',
  lg: '10px',
  xl: '12px',
  '2xl': '16px',
  full: '9999px',
} as const;

export const shadows = {
  none: 'none',
  subtle: '0 1px 2px 0 rgba(41, 45, 58, 0.04)',
  card: '0 1px 3px 0 rgba(41, 45, 58, 0.06), 0 1px 2px -1px rgba(41, 45, 58, 0.04)',
  modal: '0 10px 25px -5px rgba(41, 45, 58, 0.1), 0 8px 10px -6px rgba(41, 45, 58, 0.05)',
  focus: '0 0 0 3px rgba(79, 70, 229, 0.2)',
  focusGreen: '0 0 0 3px rgba(15, 138, 95, 0.2)',
} as const;

export const borders = {
  thin: '1px solid #E7E7E3',
  subtle: '1px solid #F0F0EC',
  active: '1px solid #4F46E5',
  green: '1px solid #0F8A5F',
  error: '1px solid #DC2626',
} as const;

export const breakpoints = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
} as const;

export const motion = {
  duration: {
    fast: '0.15s',
    normal: '0.25s',
    slow: '0.4s',
  },
  easing: {
    easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
    easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
    easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
    spring: { type: 'spring', stiffness: 300, damping: 25 },
  },
} as const;

export type IconName =
  | 'activity'
  | 'alert'
  | 'check'
  | 'chevronDown'
  | 'chevronRight'
  | 'close'
  | 'document'
  | 'edit'
  | 'fileText'
  | 'filter'
  | 'heart'
  | 'info'
  | 'lock'
  | 'mail'
  | 'plus'
  | 'search'
  | 'trash'
  | 'user'
  | 'stethoscope'
  | 'fileCheck';
