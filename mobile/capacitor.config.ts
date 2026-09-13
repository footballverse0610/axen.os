import type { CapacitorConfig } from "@capacitor/cli";

/**
 * 「起業しよ。」Androidアプリ(Capacitorラッパー)の設定。
 *
 * server.url はユーザーから提示されたVercel本番URL
 * (https://kigyoshiyo-footballverse0610.vercel.app/)を使用している。
 * 本番ドメインが今後カスタムドメインに変わった場合は、この値を
 * 書き換えること。
 *
 * このファイルはCapacitorラッパー専用の設定であり、Next.jsアプリ本体
 * (リポジトリルートのsrc/等)には一切影響しません。
 */
const config: CapacitorConfig = {
  appId: "com.kigyoshiyo.app",
  appName: "起業しよ。",
  webDir: "www",
  server: {
    url: "https://kigyoshiyo-footballverse0610.vercel.app",
    // 本番URLは常にHTTPSのため平文HTTPは許可しない
    cleartext: false,
    androidScheme: "https",
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 600,
      launchAutoHide: true,
      backgroundColor: "#0a0a0a",
      showSpinner: false,
      androidScaleType: "CENTER_CROP",
    },
  },
};

export default config;
