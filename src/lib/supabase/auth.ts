"use client";

import { createClient } from "./client";

/**
 * Supabase Auth用の薄いラッパー関数群。
 * 現時点ではどの画面からも呼び出されていない（次のPhaseでUIと接続する）。
 * ブラウザ用anon keyのみを使用し、RLSの前提を崩さない。
 */

export async function signUpWithEmail(email: string, password: string) {
  const supabase = createClient();
  return supabase.auth.signUp({ email, password });
}

export async function signInWithEmail(email: string, password: string) {
  const supabase = createClient();
  return supabase.auth.signInWithPassword({ email, password });
}

export async function signOut() {
  const supabase = createClient();
  return supabase.auth.signOut();
}
