import { NextResponse } from "next/server";
import { query } from "@/lib/snowflake";

interface ModelPerformanceRow {
  TRUE_POSITIVES: number;
  FALSE_POSITIVES: number;
  FALSE_NEGATIVES: number;
  TRUE_NEGATIVES: number;
}

export async function GET() {
  try {
    const results = await query<ModelPerformanceRow>(`
      SELECT 
        SUM(CASE WHEN st.XGB_PREDICTION = 1 AND tf.IS_FRAUD = TRUE THEN 1 ELSE 0 END) as TRUE_POSITIVES,
        SUM(CASE WHEN st.XGB_PREDICTION = 1 AND tf.IS_FRAUD = FALSE THEN 1 ELSE 0 END) as FALSE_POSITIVES,
        SUM(CASE WHEN st.XGB_PREDICTION = 0 AND tf.IS_FRAUD = TRUE THEN 1 ELSE 0 END) as FALSE_NEGATIVES,
        SUM(CASE WHEN st.XGB_PREDICTION = 0 AND tf.IS_FRAUD = FALSE THEN 1 ELSE 0 END) as TRUE_NEGATIVES
      FROM MG_COCO.FRAUD_DETECTION.SCORED_TRANSACTIONS st
      JOIN MG_COCO.FRAUD_DETECTION.TRANSACTION_FEATURES tf ON st.TRANSACTION_ID = tf.TRANSACTION_ID
    `);

    const data = results[0];
    const tp = data?.TRUE_POSITIVES || 0;
    const fp = data?.FALSE_POSITIVES || 0;
    const fn = data?.FALSE_NEGATIVES || 0;
    const tn = data?.TRUE_NEGATIVES || 0;

    const precision = tp / (tp + fp) || 0;
    const recall = tp / (tp + fn) || 0;
    const f1 = 2 * (precision * recall) / (precision + recall) || 0;
    const accuracy = (tp + tn) / (tp + tn + fp + fn) || 0;

    return NextResponse.json({
      ...data,
      precision: precision * 100,
      recall: recall * 100,
      f1: f1 * 100,
      accuracy: accuracy * 100,
    });
  } catch (error) {
    console.error("Error fetching model performance:", error);
    return NextResponse.json(
      { error: "Failed to fetch model performance" },
      { status: 500 }
    );
  }
}
