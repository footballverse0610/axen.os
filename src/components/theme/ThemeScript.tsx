import { THEME_COLOR_DARK, THEME_COLOR_LIGHT, THEME_STORAGE_KEY } from "@/lib/theme";

/**
 * テーマ確定前の一瞬だけライト(またはダーク)表示になってしまう
 * FOUC(Flash of Unstyled/Incorrect Content)を防ぐための、
 * React hydration前に同期的に実行されるインラインスクリプト。
 *
 * localStorageの保存値(または端末のprefers-color-scheme)から
 * 表示すべきテーマを即座に判定し、<html>のdata-theme属性と
 * theme-colorメタタグをCSS/Reactが動き出す前に確定させる。
 * 失敗しても既存の動作(ライトテーマ表示)を壊さないよう、
 * 全体をtry/catchで囲む。
 */
export function ThemeScript() {
  const script = `(function(){try{
var k=${JSON.stringify(THEME_STORAGE_KEY)};
var stored=localStorage.getItem(k);
var pref=(stored==="light"||stored==="dark"||stored==="system")?stored:"system";
var resolved=pref==="system"
  ?(window.matchMedia&&window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light")
  :pref;
var root=document.documentElement;
root.setAttribute("data-theme",resolved);
root.style.colorScheme=resolved;
var meta=document.querySelector('meta[name="theme-color"]');
if(meta){meta.setAttribute("content",resolved==="dark"?${JSON.stringify(THEME_COLOR_DARK)}:${JSON.stringify(THEME_COLOR_LIGHT)});}
}catch(e){}})();`;

  return <script dangerouslySetInnerHTML={{ __html: script }} />;
}
