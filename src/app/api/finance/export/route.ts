import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/supabase/get-current-user";
import { getCurrentBusiness } from "@/lib/supabase/business";
import { createClient } from "@/lib/supabase/server";
import { buildCsv, UTF8_BOM } from "@/lib/csv";

const CSV_HEADER = ["日付", "種別", "取引名", "カテゴリー", "金額", "数量", "取引先", "課税区分"];

interface ExportRow {
  date: string;
  createdAt: string;
  kind: "sale" | "expense";
  label: string;
  category: string;
  amount: number;
  quantity: string;
  counterparty: string;
  taxDeductible: string;
}

/**
 * 現在選択中の事業のsales/expensesを1つのCSVに統合してダウンロードさせる。
 *
 * このパスはsrc/proxy.tsの保護対象に含めていない(リダイレクトはダウンロード
 * リンクに不向きなため、/api/coachと同様に自前で認証チェックを行う)。
 * business_idはURL/ボディ等クライアントからは一切受け取らず、必ず
 * getCurrentUser() → getCurrentBusiness()(Cookie+RLS検証済み)で解決する。
 */
export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "ログインが必要です" }, { status: 401 });
  }

  const business = await getCurrentBusiness();
  if (!business) {
    return NextResponse.json({ error: "事業情報が見つかりません" }, { status: 400 });
  }

  const supabase = await createClient();
  const [salesRes, expensesRes] = await Promise.all([
    supabase
      .from("sales")
      .select("label, category, customer_name, quantity, amount, sold_on, created_at")
      .eq("business_id", business.id),
    supabase
      .from("expenses")
      .select("label, category, vendor, amount, is_tax_deductible, spent_on, created_at")
      .eq("business_id", business.id),
  ]);

  if (salesRes.error || expensesRes.error) {
    console.error(
      "finance export failed",
      salesRes.error ?? expensesRes.error,
    );
    return NextResponse.json({ error: "データの取得に失敗しました" }, { status: 500 });
  }

  const saleRows: ExportRow[] = (salesRes.data ?? []).map((s) => ({
    date: s.sold_on,
    createdAt: s.created_at,
    kind: "sale",
    label: s.label,
    category: s.category,
    amount: s.amount,
    quantity: String(s.quantity),
    counterparty: s.customer_name ?? "",
    taxDeductible: "",
  }));

  const expenseRows: ExportRow[] = (expensesRes.data ?? []).map((e) => ({
    date: e.spent_on,
    createdAt: e.created_at,
    kind: "expense",
    label: e.label,
    category: e.category,
    amount: e.amount,
    quantity: "",
    counterparty: e.vendor ?? "",
    taxDeductible: e.is_tax_deductible ? "対象" : "",
  }));

  // Finance画面と同じく日付降順。同日の場合はcreated_atの降順で順序を安定させる。
  const rows = [...saleRows, ...expenseRows].sort((a, b) => {
    if (a.date !== b.date) {
      return a.date < b.date ? 1 : -1;
    }
    return a.createdAt < b.createdAt ? 1 : a.createdAt > b.createdAt ? -1 : 0;
  });

  const csvRows = [
    CSV_HEADER,
    ...rows.map((r) => [
      r.date,
      r.kind === "sale" ? "売上" : "経費",
      r.label,
      r.category,
      String(r.amount),
      r.quantity,
      r.counterparty,
      r.taxDeductible,
    ]),
  ];

  const csv = UTF8_BOM + buildCsv(csvRows);
  const today = new Date().toISOString().slice(0, 10);
  const filename = `axen-os-finance-${today}.csv`;

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
