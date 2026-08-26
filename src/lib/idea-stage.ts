import type { BadgeTone } from "@/components/ui/Badge";
import type { IdeaStage } from "./types";

export const stageLabel: Record<IdeaStage, string> = {
  draft: "アイデア",
  validating: "検証中",
  building: "構築中",
  launched: "ローンチ済み",
};

export const stageTone: Record<IdeaStage, BadgeTone> = {
  draft: "neutral",
  validating: "warning",
  building: "neutral",
  launched: "good",
};
