import Link from "next/link";

export function SectionHeader({
  title,
  href,
  hrefLabel = "すべて見る",
}: {
  title: string;
  href?: string;
  hrefLabel?: string;
}) {
  return (
    <div className="mb-3 flex items-center justify-between">
      <h2 className="text-sm font-semibold text-foreground">{title}</h2>
      {href ? (
        <Link
          href={href}
          className="text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          {hrefLabel}
        </Link>
      ) : null}
    </div>
  );
}
