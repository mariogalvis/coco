import { NextResponse } from "next/server";
import { query } from "@/lib/snowflake";

export async function GET() {
  try {
    const results = await query<{
      CITY: string;
      TOTAL_TRANSACTIONS: number;
      FRAUD_RATE: number;
    }>(`
      SELECT 
        t.CITY,
        COUNT(*) as TOTAL_TRANSACTIONS,
        ROUND(SUM(CASE WHEN f.IS_FRAUD = 1 THEN 1 ELSE 0 END) * 100.0 / COUNT(*), 2) as FRAUD_RATE
      FROM MG_COCO.FRAUD_DETECTION.TRANSACTIONS t
      LEFT JOIN MG_COCO.FRAUD_DETECTION.FRAUD_LABELS f ON t.TRANSACTION_ID = f.TRANSACTION_ID
      GROUP BY t.CITY
      ORDER BY TOTAL_TRANSACTIONS DESC
    `);

    const data = results.map((r) => ({
      city: r.CITY,
      count: r.TOTAL_TRANSACTIONS,
      fraudRate: r.FRAUD_RATE,
    }));

    return NextResponse.json({ data });
  } catch (error) {
    console.error("Error fetching map data:", error);
    return NextResponse.json({ data: [] }, { status: 500 });
  }
}
