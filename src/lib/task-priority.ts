import type { BadgeTone } from "@/components/ui/Badge";
import type { TaskPriority } from "./types";

export const priorityTone: Record<TaskPriority, BadgeTone> = {
  HIGH: "critical",
  MEDIUM: "warning",
  LOW: "neutral",
};

export const priorityLabel: Record<TaskPriority, string> = {
  HIGH: "優先度: 高",
  MEDIUM: "優先度: 中",
  LOW: "優先度: 低",
};

/** 高→低の表示順。Task一覧のグループ分け・ソートで使う。 */
export const priorityOrder: TaskPriority[] = ["HIGH", "MEDIUM", "LOW"];
