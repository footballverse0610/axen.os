import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { AndroidBackButtonHandler } from "@/components/capacitor/AndroidBackButtonHandler";
import { ThemeProvider } from "@/components/theme/ThemeProvider";
import { ThemeScript } from "@/components/theme/ThemeScript";
import { THEME_COLOR_DARK, THEME_COLOR_LIGHT } from "@/lib/theme";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "起業しよ。",
  description: "アイデアを、実際のビジネスに変えるためのAIビジネス支援アプリ",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  // 初回ペイント時点(JS実行前)の既定値。実際の選択テーマへの反映は
  // ThemeScript(hydration前に同期実行)とThemeProvider(切り替え時)が担う。
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: THEME_COLOR_LIGHT },
    { media: "(prefers-color-scheme: dark)", color: THEME_COLOR_DARK },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="ja"
      // ThemeScriptがhydration前にdata-theme属性/style.colorSchemeを
      // 書き換えるため、Reactのサーバー/クライアント不一致警告を抑制する。
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <ThemeScript />
      </head>
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <ThemeProvider>
          <AndroidBackButtonHandler />
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
