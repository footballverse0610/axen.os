export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center px-6 py-24 text-center">
      <span className="mb-6 text-xs font-medium uppercase tracking-[0.3em] text-muted-foreground">
        Axen Gear
      </span>
      <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
        AXEN OS
      </h1>
      <p className="mt-4 max-w-xs text-sm leading-relaxed text-muted-foreground sm:max-w-sm sm:text-base">
        ブランド経営基盤を構築中です。
      </p>
      <div className="mt-10 rounded-full border border-border bg-surface px-4 py-1.5 text-xs font-medium text-muted-foreground">
        Phase 1: Foundation
      </div>
    </main>
  );
}
