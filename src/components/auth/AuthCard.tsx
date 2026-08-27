import type { ReactNode } from "react";

export function AuthCard({
  subtitle,
  children,
  footer,
}: {
  subtitle: string;
  children: ReactNode;
  footer: ReactNode;
}) {
  return (
    <div className="w-full max-w-sm">
      <div className="mb-8 text-center">
        <p className="text-2xl font-semibold tracking-tight text-foreground">起業しよ。</p>
        <p className="mt-2 text-sm text-muted-foreground">{subtitle}</p>
      </div>
      <div className="rounded-2xl border border-border bg-surface p-6">{children}</div>
      <div className="mt-6 text-center text-sm text-muted-foreground">{footer}</div>
    </div>
  );
}
