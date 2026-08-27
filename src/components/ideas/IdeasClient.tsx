"use client";

import { Lightbulb, Pencil, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Bar } from "@/components/ui/Bar";
import { Card } from "@/components/ui/Card";
import { Modal } from "@/components/ui/Modal";
import { stageLabel, stageTone } from "@/lib/idea-stage";
import type { BusinessIdea, IdeaStage } from "@/lib/supabase/types";
import { IdeaForm } from "./IdeaForm";
import { DeleteIdeaModal } from "./DeleteIdeaModal";

const filters: { value: IdeaStage | "all"; label: string }[] = [
  { value: "all", label: "すべて" },
  { value: "draft", label: "アイデア" },
  { value: "validating", label: "検証中" },
  { value: "building", label: "構築中" },
  { value: "launched", label: "ローンチ済み" },
];

type ModalState =
  | { type: "create" }
  | { type: "edit"; idea: BusinessIdea }
  | { type: "delete"; idea: BusinessIdea }
  | null;

export function IdeasClient({ ideas }: { ideas: BusinessIdea[] }) {
  const [activeFilter, setActiveFilter] = useState<IdeaStage | "all">("all");
  const [modal, setModal] = useState<ModalState>(null);

  const filteredIdeas =
    activeFilter === "all" ? ideas : ideas.filter((idea) => idea.stage === activeFilter);

  if (ideas.length === 0) {
    return (
      <>
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-border bg-surface px-6 py-16 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-surface-muted">
            <Lightbulb className="h-6 w-6 text-muted-foreground" aria-hidden />
          </div>
          <p className="text-sm font-semibold text-foreground">まだアイデアがありません</p>
          <p className="text-sm text-muted-foreground">
            最初のビジネスアイデアを追加してみよう。
          </p>
          <button
            type="button"
            onClick={() => setModal({ type: "create" })}
            className="mt-2 flex items-center gap-1.5 rounded-full bg-foreground px-4 py-2 text-xs font-semibold text-background transition-opacity hover:opacity-90"
          >
            <Plus className="h-3.5 w-3.5" aria-hidden />
            アイデアを追加
          </button>
        </div>

        {modal?.type === "create" ? (
          <Modal title="アイデアを追加" onClose={() => setModal(null)}>
            <IdeaForm onDone={() => setModal(null)} />
          </Modal>
        ) : null}
      </>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          思いついたアイデアを記録し、検証状況を管理します。
        </p>
        <button
          type="button"
          onClick={() => setModal({ type: "create" })}
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
            {idea.description ? (
              <p className="text-sm leading-relaxed text-muted-foreground">
                {idea.description}
              </p>
            ) : null}
            <div className="flex items-center gap-3">
              <span className="shrink-0 text-xs text-muted-foreground">
                ポテンシャル
              </span>
              <Bar value={idea.potential_score} max={100} />
              <span className="shrink-0 text-xs font-medium text-foreground">
                {idea.potential_score}
              </span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs text-muted-foreground">
                作成日: {idea.created_at.slice(0, 10)}
              </p>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setModal({ type: "edit", idea })}
                  aria-label="編集"
                  className="flex h-7 w-7 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-surface-muted hover:text-foreground"
                >
                  <Pencil className="h-3.5 w-3.5" aria-hidden />
                </button>
                <button
                  type="button"
                  onClick={() => setModal({ type: "delete", idea })}
                  aria-label="削除"
                  className="flex h-7 w-7 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-red-500/10 hover:text-red-400"
                >
                  <Trash2 className="h-3.5 w-3.5" aria-hidden />
                </button>
              </div>
            </div>
          </Card>
        ))}
        {filteredIdeas.length === 0 ? (
          <Card className="text-center text-sm text-muted-foreground">
            該当するアイデアはありません。
          </Card>
        ) : null}
      </div>

      {modal?.type === "create" ? (
        <Modal title="アイデアを追加" onClose={() => setModal(null)}>
          <IdeaForm onDone={() => setModal(null)} />
        </Modal>
      ) : null}

      {modal?.type === "edit" ? (
        <Modal title="アイデアを編集" onClose={() => setModal(null)}>
          <IdeaForm idea={modal.idea} onDone={() => setModal(null)} />
        </Modal>
      ) : null}

      {modal?.type === "delete" ? (
        <DeleteIdeaModal idea={modal.idea} onClose={() => setModal(null)} />
      ) : null}
    </div>
  );
}
