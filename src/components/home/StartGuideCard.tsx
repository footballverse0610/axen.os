import { ArrowRight, Compass } from "lucide-react";
import Link from "next/link";
import { Card } from "@/components/ui/Card";

/** ホーム画面の「何から始める？」入口。/start-guideの診断へ誘導する。 */
export function StartGuideCard() {
  return (
    <Card className="flex items-start gap-4 border-white/10 bg-surface-muted/60">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-foreground/10">
        <Compass className="h-5 w-5 text-foreground" aria-hidden />
      </div>
      <div className="flex-1">
        <p className="text-sm font-semibold text-foreground">何から始める？</p>
        <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
          起業したいけど、何をすればいいか分からない？
          簡単な質問に答えると、今やるべきことが分かります。
        </p>
        <Link
          href="/start-guide"
          className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-foreground"
        >
          最初の一歩を決める
          <ArrowRight className="h-3.5 w-3.5" aria-hidden />
        </Link>
      </div>
    </Card>
  );
}
