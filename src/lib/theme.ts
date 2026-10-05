export type ThemePreference = "light" | "dark" | "system";
export type ResolvedTheme = "light" | "dark";

/** localStorageに保存するテーマ設定のキー。FOUC対策スクリプトと共有する。 */
export const THEME_STORAGE_KEY = "kigyoshiyo-theme";

export const THEME_COLOR_LIGHT = "#f8f9fc";
export const THEME_COLOR_DARK = "#0a0a0a";

export function isThemePreference(value: unknown): value is ThemePreference {
  return value === "light" || value === "dark" || value === "system";
}

/** "system"の場合は端末のprefers-color-schemeを尊重して解決する。 */
export function resolveTheme(
  preference: ThemePreference,
  systemPrefersDark: boolean,
): ResolvedTheme {
  if (preference === "system") {
    return systemPrefersDark ? "dark" : "light";
  }
  return preference;
}
