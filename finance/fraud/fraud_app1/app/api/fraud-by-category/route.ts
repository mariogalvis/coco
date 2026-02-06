import { NextResponse } from "next/server";
import { query } from "@/lib/snowflake";

interface FraudByCategoryRow {
  CATEGORIA: string;
  TOTAL_TX: number;
  FRAUDES: number;
  TASA_FRAUDE: number;
  MONTO_FRAUDE: number;
}

export async function GET() {
  try {
    const results = await query<FraudByCategoryRow>(`
      SELECT 
        t.MERCHANT_CATEGORY as CATEGORIA,
        COUNT(*) as TOTAL_TX,
        SUM(CASE WHEN fl.IS_FRAUD THEN 1 ELSE 0 END) as FRAUDES,
        ROUND(SUM(CASE WHEN fl.IS_FRAUD THEN 1 ELSE 0 END) * 100.0 / COUNT(*), 2) as TASA_FRAUDE,
        SUM(CASE WHEN fl.IS_FRAUD THEN t.AMOUNT ELSE 0 END) as MONTO_FRAUDE
      FROM MG_COCO.FRAUD_DETECTION.TRANSACTIONS t
      JOIN MG_COCO.FRAUD_DETECTION.FRAUD_LABELS fl ON t.TRANSACTION_ID = fl.TRANSACTION_ID
      GROUP BY 1
      ORDER BY TASA_FRAUDE DESC
    `);

    return NextResponse.json(results);
  } catch (error) {
    console.error("Error fetching fraud by category:", error);
    return NextResponse.json(
      { error: "Failed to fetch data" },
      { status: 500 }
    );
  }
}
