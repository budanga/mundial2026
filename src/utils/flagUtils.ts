/**
 * Returns ESPN CDN logo URL for a team abbreviation.
 * e.g. "FRA" → "https://a.espncdn.com/i/teamlogos/countries/500/fra.png"
 */
export function getTeamLogoUrl(abbreviation: string): string {
  const code = abbreviation.toLowerCase();
  return `https://a.espncdn.com/i/teamlogos/countries/500/${code}.png`;
}

/**
 * Map of team abbreviations to flag emoji.
 * Falls back to 🏳 if not found.
 */
const FLAG_MAP: Record<string, string> = {
  // Group A
  USA: '🇺🇸', MEX: '🇲🇽', CAN: '🇨🇦',
  // Group B
  ARG: '🇦🇷', ESP: '🇪🇸', MAR: '🇲🇦',
  // Group C
  BRA: '🇧🇷', DEU: '🇩🇪', GER: '🇩🇪',
  // Group D
  FRA: '🇫🇷', POL: '🇵🇱', SEN: '🇸🇳',
  // Group E
  ENG: '󠁧󠁢󠁥󠁮󠁧󠁿', NED: '🇳🇱', HOL: '🇳🇱',
  // Group F
  POR: '🇵🇹', URU: '🇺🇾', KOR: '🇰🇷',
  // Group G
  BEL: '🇧🇪', JPN: '🇯🇵', CRO: '🇭🇷',
  // Group H
  COL: '🇨🇴', ITA: '🇮🇹', ECU: '🇪🇨',
  // Group I
  IRQ: '🇮🇶', NOR: '🇳🇴',
  // Group J
  ALG: '🇩🇿',
  // Others
  AUS: '🇦🇺', CMR: '🇨🇲', CHE: '🇨🇭', SUI: '🇨🇭',
  DEN: '🇩🇰', GHA: '🇬🇭', IRN: '🇮🇷', MAR2: '🇲🇦',
  MOR: '🇲🇦', NGA: '🇳🇬', SRB: '🇷🇸', SLO: '🇸🇮',
  SVN: '🇸🇮', TUN: '🇹🇳', UKR: '🇺🇦', QAT: '🇶🇦',
  SAU: '🇸🇦', KSA: '🇸🇦', KWT: '🇰🇼', CRC: '🇨🇷',
  HON: '🇭🇳', PAN: '🇵🇦', JAM: '🇯🇲', TRI: '🇹🇹',
  PER: '🇵🇪', CHI: '🇨🇱', PAR: '🇵🇾', VEN: '🇻🇪',
  BOL: '🇧🇴', EGY: '🇪🇬', CIV: '🇨🇮', SEN2: '🇸🇳',
  MLI: '🇲🇱', GUI: '🇬🇳', BEN: '🇧🇯', KEN: '🇰🇪',
  TAN: '🇹🇿', CPV: '🇨🇻', COM: '🇰🇲', CHA: '🇹🇩',
  AZE: '🇦🇿', ALB: '🇦🇱', GEO: '🇬🇪', HUN: '🇭🇺',
  ROU: '🇷🇴', BIH: '🇧🇦', GRE: '🇬🇷', FIN: '🇫🇮',
  NOR2: '🇳🇴', SWE: '🇸🇪', ISR: '🇮🇱', MKD: '🇲🇰',
  CZE: '🇨🇿', SVK: '🇸🇰', AUT: '🇦🇹', SCO: '🏴󠁧󠁢󠁳󠁣󠁴󠁿',
  WAL: '🏴󠁧󠁢󠁷󠁬󠁳󠁿', NIR: '🏴', IRL: '🇮🇪',
  CHN: '🇨🇳', IND: '🇮🇳', THA: '🇹🇭', VIE: '🇻🇳',
  PHI: '🇵🇭', MYS: '🇲🇾', SIN: '🇸🇬', IDN: '🇮🇩',
  OMA: '🇴🇲', UAE: '🇦🇪', BHR: '🇧🇭', JOR: '🇯🇴',
  LBN: '🇱🇧', SYR: '🇸🇾', PAK: '🇵🇰', UZB: '🇺🇿',
  KAZ: '🇰🇿', KGZ: '🇰🇬', TJK: '🇹🇯', TKM: '🇹🇲',
};

export function getTeamFlagEmoji(abbreviation: string): string {
  return FLAG_MAP[abbreviation.toUpperCase()] ?? '🏳';
}

const TEAM_TRANSLATIONS: Record<string, string> = {
  'South Africa': 'Sudáfrica',
  'Mexico': 'México',
  'Czechia': 'República Checa',
  'South Korea': 'Corea del Sur',
  'Bosnia-Herzegovina': 'Bosnia y Herzegovina',
  'Canada': 'Canadá',
  'United States': 'Estados Unidos',
  'USA': 'EE. UU.',
  'Paraguay': 'Paraguay',
  'Switzerland': 'Suiza',
  'Qatar': 'Catar',
  'Scotland': 'Escocia',
  'Brazil': 'Brasil',
  'Morocco': 'Marruecos',
  'Haiti': 'Haití',
  'Australia': 'Australia',
  'Turkey': 'Turquía',
  'Germany': 'Alemania',
  'Ivory Coast': 'Costa de Marfil',
  'Ecuador': 'Ecuador',
  'Curacao': 'Curazao',
  'Sweden': 'Suecia',
  'Japan': 'Japón',
  'Netherlands': 'Países Bajos',
  'Tunisia': 'Túnez',
  'Iran': 'Irán',
  'New Zealand': 'Nueva Zelanda',
  'Belgium': 'Bélgica',
  'Egypt': 'Egipto',
  'Saudi Arabia': 'Arabia Saudita',
  'Uruguay': 'Uruguay',
  'Cape Verde': 'Cabo Verde',
  'Spain': 'España',
  'Norway': 'Noruega',
  'France': 'Francia',
  'Senegal': 'Senegal',
  'Iraq': 'Irak',
  'Algeria': 'Argelia',
  'Argentina': 'Argentina',
  'Austria': 'Austria',
  'Jordan': 'Jordania',
  'Colombia': 'Colombia',
  'DR Congo': 'Congo RD',
  'Portugal': 'Portugal',
  'Uzbekistan': 'Uzbekistán',
  'Croatia': 'Croacia',
  'England': 'Inglaterra',
  'Ghana': 'Ghana',
  'Panama': 'Panamá',
};

export function translateTeamName(name: string): string {
  if (!name) return '';
  return TEAM_TRANSLATIONS[name] ?? TEAM_TRANSLATIONS[name.trim()] ?? name;
}
