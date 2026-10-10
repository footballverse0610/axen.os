"use client";

import { useState } from "react";
import { COACH_CHARACTERS } from "@/lib/coach/characters";
import type { CoachCharacterId } from "@/lib/supabase/types";

const SIZE_CLASSES = {
  sm: { container: "h-8 w-8", icon: "h-4 w-4" },
  md: { container: "h-10 w-10", icon: "h-5 w-5" },
  lg: { container: "h-16 w-16", icon: "h-8 w-8" },
} as const;

/**
 * AIコーチキャラクターのアバター表示。
 *
 * characterIdのみを受け取り(キャラクター定義のfallbackIconはReactコンポーネント
 * 参照のため、Server ComponentからClient Componentへpropsとしてそのまま渡すと
 * シリアライズできない)、定義自体はこのコンポーネント内でCOACH_CHARACTERSから
 * 解決する。
 *
 * avatarImagePath(public/coach-characters/以下)の画像読み込みに失敗した
 * 場合(ファイル未配置・通信エラー等)は、onErrorでアイコン+グラデーションの
 * フォールバック表示に切り替える。画像は正方形(611x611)を前提に、
 * 正方形コンテナ+object-coverで縦横比を保ったまま表示する。
 */
export function CoachCharacterAvatar({
  characterId,
  size = "md",
  className = "",
}: {
  characterId: CoachCharacterId;
  size?: keyof typeof SIZE_CLASSES;
  className?: string;
}) {
  const [imageFailed, setImageFailed] = useState(false);
  const character = COACH_CHARACTERS[characterId];
  const { container, icon } = SIZE_CLASSES[size];
  const Icon = character.fallbackIcon;

  if (!imageFailed) {
    // next/imageはビルド時のサイズ最適化が前提で、存在しない画像パスに対する
    // onErrorフォールバックが煩雑になるため、素のimgを使う。
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={character.avatarImagePath}
        alt={`${character.name}のアバター`}
        className={`${container} shrink-0 rounded-full border border-border object-cover ${className}`}
        onError={() => setImageFailed(true)}
      />
    );
  }

  return (
    <div
      className={`flex ${container} shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${character.fallbackGradientClass} ${className}`}
    >
      <Icon className={`${icon} text-white`} aria-hidden />
    </div>
  );
}
