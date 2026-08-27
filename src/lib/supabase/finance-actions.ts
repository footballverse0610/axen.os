"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "./server";
import { getCurrentBusiness } from "./business";
import { getCurrentUser } from "./get-current-user";

export interface FinanceActionState {
  error: string | null;
  success?: boolean;
}

export type TransactionKind = "sale" | "expense";

const MAX_LABEL_LENGTH = 100;
const MAX_CATEGORY_LENGTH = 50;
const MAX_PARTY_NAME_LENGTH = 100;

interface ParsedTransactionInput {
  kind: string;
  label: string;
  category: string;
  amountRaw: string;
  date: string;
  partyName: string;
  quantityRaw: string;
}

function parseTransactionForm(formData: FormData): ParsedTransactionInput {
  return {
    kind: String(formData.get("kind") ?? ""),
    label: String(formData.get("label") ?? "").trim(),
    category: String(formData.get("category") ?? "").trim(),
    amountRaw: String(formData.get("amount") ?? ""),
    date: String(formData.get("date") ?? "").trim(),
    partyName: String(formData.get("partyName") ?? "").trim(),
    quantityRaw: String(formData.get("quantity") ?? "1"),
  };
}

function validateTransactionInput(input: ParsedTransactionInput): string | null {
  if (input.kind !== "sale" && input.kind !== "expense") {
    return "種別が不正です。";
  }
  if (!input.label) {
    return "取引名を入力してください。";
  }
  if (input.label.length > MAX_LABEL_LENGTH) {
    return `取引名は${MAX_LABEL_LENGTH}文字以内で入力してください。`;
  }
  if (!input.category) {
    return "カテゴリーを入力してください。";
  }
  if (input.category.length > MAX_CATEGORY_LENGTH) {
    return `カテゴリーは${MAX_CATEGORY_LENGTH}文字以内で入力してください。`;
  }
  if (input.partyName.length > MAX_PARTY_NAME_LENGTH) {
    return `${input.kind === "sale" ? "顧客名" : "支払先"}は${MAX_PARTY_NAME_LENGTH}文字以内で入力してください。`;
  }
  const amount = Number(input.amountRaw);
  if (input.amountRaw === "" || Number.isNaN(amount) || amount <= 0) {
    return "金額は0より大きい数値を入力してください。";
  }
  if (!input.date || Number.isNaN(Date.parse(input.date))) {
    return "日付を入力してください。";
  }
  if (input.kind === "sale") {
    const quantity = input.quantityRaw === "" ? 1 : Number(input.quantityRaw);
    if (!Number.isInteger(quantity) || quantity < 1) {
      return "数量は1以上の整数で入力してください。";
    }
  }
  return null;
}

/**
 * 売上または経費を新規登録する。
 * business_idはgetCurrentBusiness()、user_idはgetCurrentUser()由来の値のみを
 * 使用し、クライアントからのuser_id/business_id入力は一切受け付けない。
 */
export async function createTransaction(
  _prevState: FinanceActionState,
  formData: FormData,
): Promise<FinanceActionState> {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  const business = await getCurrentBusiness();
  if (!business) {
    return { error: "事業が見つかりませんでした。" };
  }

  const parsed = parseTransactionForm(formData);
  const validationError = validateTransactionInput(parsed);
  if (validationError) {
    return { error: validationError };
  }

  const amount = Number(parsed.amountRaw);
  const supabase = await createClient();

  if (parsed.kind === "sale") {
    const quantity = parsed.quantityRaw === "" ? 1 : Number(parsed.quantityRaw);
    const { error } = await supabase.from("sales").insert({
      business_id: business.id,
      user_id: user.id,
      label: parsed.label,
      category: parsed.category,
      customer_name: parsed.partyName || null,
      quantity,
      amount,
      sold_on: parsed.date,
    });
    if (error) {
      console.error("createTransaction(sale) failed", error);
      return { error: "売上の登録に失敗しました。時間をおいて再度お試しください。" };
    }
  } else {
    const { error } = await supabase.from("expenses").insert({
      business_id: business.id,
      user_id: user.id,
      label: parsed.label,
      category: parsed.category,
      vendor: parsed.partyName || null,
      amount,
      spent_on: parsed.date,
    });
    if (error) {
      console.error("createTransaction(expense) failed", error);
      return { error: "経費の登録に失敗しました。時間をおいて再度お試しください。" };
    }
  }

  revalidatePath("/finance");
  revalidatePath("/");
  return { error: null, success: true };
}

/**
 * 既存の売上/経費を更新する。クライアントからは対象の entryId と
 * (変更不可の)kind のみを受け取り、business_id/user_idの指定は
 * 受け付けない。RLS(sales/expensesのUPDATE: auth.uid() = user_id)が
 * 「自分の取引しか更新できない」ことを保証する。
 */
export async function updateTransaction(
  _prevState: FinanceActionState,
  formData: FormData,
): Promise<FinanceActionState> {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  const entryId = String(formData.get("entryId") ?? "");
  if (!entryId) {
    return { error: "対象の取引が見つかりませんでした。" };
  }

  const parsed = parseTransactionForm(formData);
  const validationError = validateTransactionInput(parsed);
  if (validationError) {
    return { error: validationError };
  }

  const amount = Number(parsed.amountRaw);
  const supabase = await createClient();

  if (parsed.kind === "sale") {
    const quantity = parsed.quantityRaw === "" ? 1 : Number(parsed.quantityRaw);
    const { data, error } = await supabase
      .from("sales")
      .update({
        label: parsed.label,
        category: parsed.category,
        customer_name: parsed.partyName || null,
        quantity,
        amount,
        sold_on: parsed.date,
      })
      .eq("id", entryId)
      .select("id");

    if (error) {
      console.error("updateTransaction(sale) failed", error);
      return { error: "売上の更新に失敗しました。時間をおいて再度お試しください。" };
    }
    if (!data || data.length === 0) {
      return { error: "対象の取引が見つかりませんでした。" };
    }
  } else {
    const { data, error } = await supabase
      .from("expenses")
      .update({
        label: parsed.label,
        category: parsed.category,
        vendor: parsed.partyName || null,
        amount,
        spent_on: parsed.date,
      })
      .eq("id", entryId)
      .select("id");

    if (error) {
      console.error("updateTransaction(expense) failed", error);
      return { error: "経費の更新に失敗しました。時間をおいて再度お試しください。" };
    }
    if (!data || data.length === 0) {
      return { error: "対象の取引が見つかりませんでした。" };
    }
  }

  revalidatePath("/finance");
  revalidatePath("/");
  return { error: null, success: true };
}

/**
 * 売上/経費を削除する。受け取るのは kind と entryId のみ。
 * RLS(DELETE: auth.uid() = user_id)により、自分が所有する取引以外は
 * 削除できない。
 */
export async function deleteTransaction(
  kind: TransactionKind,
  entryId: string,
): Promise<{ error: string | null }> {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  if (!entryId) {
    return { error: "対象の取引が見つかりませんでした。" };
  }

  const supabase = await createClient();
  const table = kind === "sale" ? "sales" : "expenses";
  const { data, error } = await supabase.from(table).delete().eq("id", entryId).select("id");

  if (error) {
    console.error("deleteTransaction failed", error);
    return { error: "取引の削除に失敗しました。時間をおいて再度お試しください。" };
  }
  if (!data || data.length === 0) {
    return { error: "対象の取引が見つかりませんでした。" };
  }

  revalidatePath("/finance");
  revalidatePath("/");
  return { error: null };
}
