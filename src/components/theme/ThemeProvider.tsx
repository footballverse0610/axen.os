"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import {
  isThemePreference,
  resolveTheme,
  THEME_COLOR_DARK,
  THEME_COLOR_LIGHT,
  THEME_STORAGE_KEY,
  type ResolvedTheme,
  type ThemePreference,
} from "@/lib/theme";

interface ThemeContextValue {
  /** ユーザーが選択した設定値("system"を含む)。 */
  preference: ThemePreference;
  /** "system"を実際のライト/ダークへ解決した、表示に使う値。 */
  resolvedTheme: ResolvedTheme;
  setPreference: (preference: ThemePreference) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

/*
 * localStorageに保存されたテーマ設定を読むための小さな外部ストア。
 * useSyncExternalStoreを使うことで、
 * - サーバー(getServerSnapshot)とクライアントの初回値の差異を
 *   Reactが安全に扱う(hydrationエラーにならず、hydration直後に
 *   自動的に実際の値へ更新される)
 * - 同一タブ内でsetPreference()が呼ばれた際にも、手動でlistenersへ
 *   通知することで即座に再レンダリングされる
 * ことを、effect内でのsetState呼び出しなしに実現できる。
 */
const preferenceListeners = new Set<() => void>();

function readStoredPreference(): ThemePreference {
  try {
    const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
    return isThemePreference(stored) ? stored : "system";
  } catch {
    return "system";
  }
}

function subscribePreference(listener: () => void): () => void {
  // 他タブでの変更にも追従する(このタブ自身の変更はsetPreference内でnotifyする)。
  window.addEventListener("storage", listener);
  preferenceListeners.add(listener);
  return () => {
    window.removeEventListener("storage", listener);
    preferenceListeners.delete(listener);
  };
}

function getPreferenceServerSnapshot(): ThemePreference {
  return "system";
}

function writeStoredPreference(preference: ThemePreference) {
  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, preference);
  } catch {
    // 保存できない環境でも、今回の表示切り替え自体(resolvedThemeの更新)は行う。
  }
  preferenceListeners.forEach((listener) => listener());
}

/** 端末のprefers-color-schemeを読むための外部ストア(「システム」選択時に使う)。 */
function getSystemPrefersDarkSnapshot(): boolean {
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

function subscribeSystemPrefersDark(listener: () => void): () => void {
  const media = window.matchMedia("(prefers-color-scheme: dark)");
  media.addEventListener("change", listener);
  return () => media.removeEventListener("change", listener);
}

function getSystemPrefersDarkServerSnapshot(): boolean {
  return false;
}

function applyTheme(resolved: ResolvedTheme) {
  const root = document.documentElement;
  root.setAttribute("data-theme", resolved);
  root.style.colorScheme = resolved;
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) {
    meta.setAttribute("content", resolved === "dark" ? THEME_COLOR_DARK : THEME_COLOR_LIGHT);
  }
}

/**
 * ライト/ダーク/システムのテーマ設定を管理するProvider。
 *
 * ページの実際の配色切り替え自体は、hydration前に実行される
 * ThemeScriptとCSSのdata-theme属性セレクタ(globals.css)が担っており、
 * このProviderは (1) 設定画面のトグルUIが現在値を読み書きするための状態、
 * (2) 「システム」選択時に端末のテーマ変更をリアルタイムに追従すること、
 * (3) 切り替え後にDOM(data-theme属性・theme-colorメタタグ)を同期すること、
 * の3点を担当する。
 */
export function ThemeProvider({ children }: { children: ReactNode }) {
  const preference = useSyncExternalStore(
    subscribePreference,
    readStoredPreference,
    getPreferenceServerSnapshot,
  );
  const systemPrefersDark = useSyncExternalStore(
    subscribeSystemPrefersDark,
    getSystemPrefersDarkSnapshot,
    getSystemPrefersDarkServerSnapshot,
  );
  const resolvedTheme = resolveTheme(preference, systemPrefersDark);

  // ReactのstateをDOM(外部システム)へ反映するだけの、effectの正しい使い方。
  // ThemeScriptが初回ペイント前に済ませているため、ここでの実行はFOUCを
  // 起こさない(値が変化した時にだけ、CSSのtransitionで自然に切り替わる)。
  useEffect(() => {
    applyTheme(resolvedTheme);
  }, [resolvedTheme]);

  const setPreference = useCallback((next: ThemePreference) => {
    writeStoredPreference(next);
  }, []);

  return (
    <ThemeContext.Provider value={{ preference, resolvedTheme, setPreference }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return ctx;
}
