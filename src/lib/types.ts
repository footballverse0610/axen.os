export type IdeaStage = "draft" | "validating" | "building" | "launched";

export interface BusinessIdea {
  id: string;
  title: string;
  description: string;
  stage: IdeaStage;
  potentialScore: number; // 0-100
  createdAt: string; // ISO date
}

export type TaskPriority = "HIGH" | "MEDIUM" | "LOW";

export type TaskCategory =
  | "商品"
  | "マーケティング"
  | "営業"
  | "資金調達"
  | "運営"
  | "その他";

export interface Task {
  id: string;
  title: string;
  description?: string;
  dueDate?: string; // ISO date
  priority: TaskPriority;
  category: TaskCategory;
  done: boolean;
}

export type TransactionType = "sale" | "expense";

export interface Transaction {
  id: string;
  type: TransactionType;
  label: string;
  category: string;
  amount: number; // always positive; type decides sign
  date: string; // ISO date
}

export interface CoachMessage {
  id: string;
  role: "coach" | "user";
  content: string;
}
