import { NextResponse } from "next/server";
import { query } from "@/lib/snowflake";
import { NextRequest } from "next/server";

interface CompareRow {
  PERIODO: string;
  TOTAL_TX: number;
  FRAUDES: number;
  TASA_FRAUDE: number;
  MONTO_TOTAL: number;
  MONTO_FRAUDE: number;
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const period1Start = searchParams.get("period1_start") || "2025-01-01";
    const period1End = searchParams.get("period1_end") || "2025-01-15";
    const period2Start = searchParams.get("period2_start") || "2025-01-16";
    const period2End = searchParams.get("period2_end") || "2025-01-31";

    const results = await query<CompareRow>(`
      WITH period1 AS (
        SELECT 
          'Período 1' as PERIODO,
          COUNT(*) as TOTAL_TX,
          SUM(CASE WHEN fl.IS_FRAUD THEN 1 ELSE 0 END) as FRAUDES,
          ROUND(SUM(CASE WHEN fl.IS_FRAUD THEN 1 ELSE 0 END) * 100.0 / NULLIF(COUNT(*), 0), 2) as TASA_FRAUDE,
          SUM(t.AMOUNT) as MONTO_TOTAL,
          SUM(CASE WHEN fl.IS_FRAUD THEN t.AMOUNT ELSE 0 END) as MONTO_FRAUDE
        FROM MG_COCO.FRAUD_DETECTION.TRANSACTIONS t
        JOIN MG_COCO.FRAUD_DETECTION.FRAUD_LABELS fl ON t.TRANSACTION_ID = fl.TRANSACTION_ID
        WHERE t.TRANSACTION_TIMESTAMP BETWEEN '${period1Start}' AND '${period1End}'
      ),
      period2 AS (
        SELECT 
          'Período 2' as PERIODO,
          COUNT(*) as TOTAL_TX,
          SUM(CASE WHEN fl.IS_FRAUD THEN 1 ELSE 0 END) as FRAUDES,
          ROUND(SUM(CASE WHEN fl.IS_FRAUD THEN 1 ELSE 0 END) * 100.0 / NULLIF(COUNT(*), 0), 2) as TASA_FRAUDE,
          SUM(t.AMOUNT) as MONTO_TOTAL,
          SUM(CASE WHEN fl.IS_FRAUD THEN t.AMOUNT ELSE 0 END) as MONTO_FRAUDE
        FROM MG_COCO.FRAUD_DETECTION.TRANSACTIONS t
        JOIN MG_COCO.FRAUD_DETECTION.FRAUD_LABELS fl ON t.TRANSACTION_ID = fl.TRANSACTION_ID
        WHERE t.TRANSACTION_TIMESTAMP BETWEEN '${period2Start}' AND '${period2End}'
      )
      SELECT * FROM period1
      UNION ALL
      SELECT * FROM period2
    `);

    return NextResponse.json(results);
  } catch (error) {
    console.error("Error comparing periods:", error);
    return NextResponse.json(
      { error: "Failed to compare periods" },
      { status: 500 }
    );
  }
}
