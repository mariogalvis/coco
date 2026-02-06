import { NextResponse } from "next/server";
import { query } from "@/lib/snowflake";

interface MetricsRow {
  TOTAL_TRANSACTIONS: number;
  TOTAL_FRAUDS: number;
  TOTAL_AMOUNT: number;
  FRAUD_AMOUNT: number;
  UNIQUE_CUSTOMERS: number;
  FRAUD_RATE: number;
}

export async function GET() {
  try {
    const results = await query<MetricsRow>(`
      SELECT 
        COUNT(*) as TOTAL_TRANSACTIONS,
        SUM(CASE WHEN fl.IS_FRAUD THEN 1 ELSE 0 END) as TOTAL_FRAUDS,
        SUM(t.AMOUNT) as TOTAL_AMOUNT,
        SUM(CASE WHEN fl.IS_FRAUD THEN t.AMOUNT ELSE 0 END) as FRAUD_AMOUNT,
        COUNT(DISTINCT t.CUSTOMER_ID) as UNIQUE_CUSTOMERS,
        ROUND(SUM(CASE WHEN fl.IS_FRAUD THEN 1 ELSE 0 END) * 100.0 / COUNT(*), 2) as FRAUD_RATE
      FROM MG_COCO.FRAUD_DETECTION.TRANSACTIONS t
      JOIN MG_COCO.FRAUD_DETECTION.FRAUD_LABELS fl ON t.TRANSACTION_ID = fl.TRANSACTION_ID
    `);

    return NextResponse.json(results[0] || {});
  } catch (error) {
    console.error("Error fetching metrics:", error);
    return NextResponse.json(
      { error: "Failed to fetch metrics" },
      { status: 500 }
    );
  }
}
