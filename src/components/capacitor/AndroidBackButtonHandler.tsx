"use client";

import { useEffect } from "react";
import { Capacitor } from "@capacitor/core";
import { App, type BackButtonListenerEvent } from "@capacitor/app";

/**
 * Androidのハードウェア「戻る」ボタンを、Capacitor公式ドキュメントが
 * 推奨する方法で処理する(https://capacitorjs.com/docs/apis/app - backButton)。
 *
 * canGoBackがtrue(WebView内に戻れる履歴がある)なら1つ前のページへ戻り、
 * falseならアプリを終了する。既存のNext.jsのナビゲーション自体は一切
 * 変更せず、ブラウザ標準のwindow.history.back()をそのまま使う。
 *
 * Capacitor.isNativePlatform()がfalseの場合(=Vercel上の通常のWeb版)は
 * 何もしない。@capacitor/core・@capacitor/appはネイティブブリッジが
 * 存在しない環境では安全にno-opになるよう作られているため、Web版の
 * 動作・見た目には一切影響しない。
 */
export function AndroidBackButtonHandler() {
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) {
      return;
    }

    const listenerPromise = App.addListener(
      "backButton",
      ({ canGoBack }: BackButtonListenerEvent) => {
        if (canGoBack) {
          window.history.back();
        } else {
          App.exitApp();
        }
      },
    );

    return () => {
      listenerPromise.then((listener) => listener.remove());
    };
  }, []);

  return null;
}
