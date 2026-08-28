export const THEME_IDS = ['arctic', 'midnight', 'developer', 'lingo', 'battery', 'sunset'] as const;
export type ThemeId = typeof THEME_IDS[number];

const THEME_ID_SET = new Set<string>(THEME_IDS);
const LEGACY_THEME_MAP: Record<string, ThemeId> = {
  light: 'arctic',
  dark: 'midnight',
  ocean: 'arctic',
  forest: 'arctic',
  violet: 'arctic'
};

const THEME_BROWSER_COLORS: Record<ThemeId, string> = {
  arctic: '#edf5fa',
  midnight: '#07111f',
  developer: '#17191c',
  lingo: '#eef9ef',
  battery: '#000000',
  sunset: '#f3e3cd'
};

export function normalizeThemeId(themeId: string | null | undefined): ThemeId {
  if (!themeId) return 'arctic';
  if (LEGACY_THEME_MAP[themeId]) return LEGACY_THEME_MAP[themeId];
  return THEME_ID_SET.has(themeId) ? themeId as ThemeId : 'arctic';
}

export function applyTheme(themeId: string | null | undefined) {
  const normalizedThemeId = normalizeThemeId(themeId);
  localStorage.setItem('lexuni-theme', normalizedThemeId);

  if (normalizedThemeId === 'arctic') document.documentElement.removeAttribute('data-theme');
  else document.documentElement.setAttribute('data-theme', normalizedThemeId);

  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', THEME_BROWSER_COLORS[normalizedThemeId]);
  return normalizedThemeId;
}
