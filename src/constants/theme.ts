export const Colors = {
  // Backgrounds
  background: '#08111E',
  cardBg: '#0F1D35',
  cardBgAlt: '#142240',
  sectionHeader: '#0A1628',
  modalBg: '#0D1A2E',
  inputBg: '#1A2A45',

  // Accents
  gold: '#FF8849',
  goldLight: '#FFAF82',
  goldDim: '#C4571A',

  // Status
  live: '#E53935',
  liveGlow: '#FF5252',
  finished: '#4CAF50',
  finishedDim: '#2E7D32',
  scheduled: '#90A4AE',

  // Text
  textPrimary: '#FFFFFF',
  textSecondary: '#8FA8C8',
  textMuted: '#4A6080',
  textGold: '#FF8849',

  // Borders
  border: '#1E3050',
  borderGold: '#FF884940',

  // Groups
  qualify1st: '#1A4D2E',   // top 2 - green
  qualify1stText: '#4CAF50',
  qualify3rd: '#3D2B00',   // best 3rd - amber
  qualify3rdText: '#FFB300',

  // Tab bar
  tabBar: '#091524',
  tabActive: '#FF8849',
  tabInactive: '#3D5470',
} as const;

export const Typography = {
  fontSizeXS: 10,
  fontSizeSM: 12,
  fontSizeMD: 14,
  fontSizeLG: 16,
  fontSizeXL: 20,
  fontSizeXXL: 28,
  fontSizeScore: 36,

  fontWeightRegular: '400' as const,
  fontWeightMedium: '500' as const,
  fontWeightSemiBold: '600' as const,
  fontWeightBold: '700' as const,
  fontWeightExtraBold: '800' as const,
} as const;

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

export const Radius = {
  sm: 6,
  md: 10,
  lg: 16,
  xl: 24,
  round: 999,
} as const;
