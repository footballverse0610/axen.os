"use client";

import { Plus } from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Bar } from "@/components/ui/Bar";
import { Card } from "@/components/ui/Card";
import { stageLabel, stageTone } from "@/lib/idea-stage";
import { mockIdeas } from "@/lib/mock-data";
import type { IdeaStage } from "@/lib/types";

const filters: { value: IdeaStage | "all"; label: string }[] = [
  { value: "all", label: "すべて" },
  { value: "draft", label: "アイデア" },
  { value: "validating", label: "検証中" },
  { value: "building", label: "構築中" },
  { value: "launched", label: "ローンチ済み" },
];

export default function IdeasPage() {
  const [activeFilter, setActiveFilter] = useState<IdeaStage | "all">("all");

  const filteredIdeas =
    activeFilter === "all"
      ? mockIdeas
      : mockIdeas.filter((idea) => idea.stage === activeFilter);

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          思いついたアイデアを記録し、検証状況を管理します。
        </p>
        <button
          type="button"
          className="flex shrink-0 items-center gap-1.5 rounded-full bg-foreground px-3.5 py-2 text-xs font-semibold text-background transition-opacity hover:opacity-90"
        >
          <Plus className="h-3.5 w-3.5" aria-hidden />
          追加
        </button>
      </div>

      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 md:mx-0 md:px-0">
        {filters.map((filter) => (
          <button
            key={filter.value}
            type="button"
            onClick={() => setActiveFilter(filter.value)}
            className={`shrink-0 rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors ${
              activeFilter === filter.value
                ? "border-foreground bg-foreground text-background"
                : "border-border bg-surface text-muted-foreground hover:text-foreground"
            }`}
          >
            {filter.label}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-3">
        {filteredIdeas.map((idea) => (
          <Card key={idea.id} className="flex flex-col gap-3">
            <div className="flex items-start justify-between gap-3">
              <h3 className="text-sm font-semibold text-foreground">{idea.title}</h3>
              <Badge tone={stageTone[idea.stage]}>{stageLabel[idea.stage]}</Badge>
            </div>
            <p className="text-sm leading-relaxed text-muted-foreground">
              {idea.description}
            </p>
            <div className="flex items-center gap-3">
              <span className="shrink-0 text-xs text-muted-foreground">
                ポテンシャル
              </span>
              <Bar value={idea.potentialScore} max={100} />
              <span className="shrink-0 text-xs font-medium text-foreground">
                {idea.potentialScore}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              作成日: {idea.createdAt}
            </p>
          </Card>
        ))}
        {filteredIdeas.length === 0 ? (
          <Card className="text-center text-sm text-muted-foreground">
            該当するアイデアはありません。
          </Card>
        ) : null}
      </div>
    </div>
  );
}
