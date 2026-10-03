"use client";

import { useEffect } from "react";
import { Capacitor } from "@capacitor/core";
import { removeSettingsBannerAd, showSettingsBannerAd } from "@/lib/capacitor/admob";

/**
 * Settings画面専用のAdMobバナー広告。
 *
 * Capacitor.isNativePlatform()がfalseの場合(Web版)は何もしない
 * (@capacitor-community/admobはネイティブブリッジが存在しない環境では
 * 安全にno-opになるよう作られているが、ここでも明示的にガードする)。
 * アンマウント時(=Settings画面を離れる時)に必ずバナーを削除するため、
 * 他の画面に広告が残ることはない。
 */
export function AdBanner() {
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) {
      return;
    }

    showSettingsBannerAd();

    return () => {
      removeSettingsBannerAd();
    };
  }, []);

  return null;
}
