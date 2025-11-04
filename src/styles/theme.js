import { DefaultTheme } from 'react-native-paper';

export const theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: '#3b82f6',
    primaryDark: '#2563eb',
    primaryLight: '#60a5fa',
    secondary: '#8b5cf6',
    accent: '#06b6d4',
    success: '#10b981',
    warning: '#f59e0b',
    danger: '#ef4444',
    background: '#0a0f1e',
    surface: '#1e293b',
    surfaceVariant: '#334155',
    text: '#f1f5f9',
    textSecondary: '#cbd5e1',
    textDisabled: '#64748b',
    border: '#334155',
  },
};

export const colors = {
  primary: '#3b82f6',
  primaryDark: '#2563eb',
  primaryLight: '#60a5fa',
  secondary: '#8b5cf6',
  accent: '#06b6d4',
  success: '#10b981',
  warning: '#f59e0b',
  danger: '#ef4444',
  background: '#0a0f1e',
  cardBackground: '#1e293b',
  hoverBackground: '#334155',
  border: '#334155',
  textPrimary: '#f1f5f9',
  textSecondary: '#cbd5e1',
  textDisabled: '#64748b',
};

export const gradients = {
  primary: ['#667eea', '#764ba2'],
  blue: ['#3b82f6', '#1d4ed8'],
  success: ['#10b981', '#059669'],
  danger: ['#ef4444', '#dc2626'],
};

export const roleColors = {
  GK: '#ef4444',
  CB: '#3b82f6',
  RB: '#10b981',
  LB: '#10b981',
  CDM: '#f59e0b',
  CM: '#f59e0b',
  CAM: '#8b5cf6',
  RM: '#06b6d4',
  LM: '#06b6d4',
  RW: '#ec4899',
  LW: '#ec4899',
  ST: '#ef4444',
};

export const platformIcons = {
  'PlayStation 5': 'logo-playstation',
  'Xbox Series X/S': 'logo-xbox',
  PC: 'desktop-outline',
};