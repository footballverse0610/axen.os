import type { BadgeTone } from "@/components/ui/Badge";
import type { TaskPriority } from "./types";

export const priorityTone: Record<TaskPriority, BadgeTone> = {
  HIGH: "critical",
  MEDIUM: "warning",
  LOW: "neutral",
};
