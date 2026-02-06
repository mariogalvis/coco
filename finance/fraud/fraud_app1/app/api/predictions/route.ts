import { NextResponse } from "next/server";
import { query } from "@/lib/snowflake";
import { NextRequest } from "next/server";

interface PredictionInput {
  amount: number;
  hour_of_day: number;
  day_of_week: number;
  is_weekend: number;
  is_night: number;
  tx_count_1h: number;
  tx_count_24h: number;
  amount_vs_avg_ratio: number;
  customer_risk_score: number;
  merchant_risk_score: number;
  location_changed: number;
  device_changed: number;
  high_velocity_1h: number;
  is_international: number;
}

export async function POST(request: NextRequest) {
  try {
    const body: PredictionInput = await request.json();

    const {
      amount,
      hour_of_day,
      day_of_week,
      is_weekend,
      is_night,
      tx_count_1h,
      tx_count_24h,
      amount_vs_avg_ratio,
      customer_risk_score,
      merchant_risk_score,
      location_changed,
      device_changed,
      high_velocity_1h,
      is_international,
    } = body;

    const results = await query<{ PREDICTION: number }>(`
      SELECT MG_COCO.FRAUD_DETECTION.FRAUD_DETECTION_MODEL!PREDICT(
        ${amount}::FLOAT,
        ${hour_of_day}::INTEGER,
        ${day_of_week}::INTEGER,
        ${is_weekend}::INTEGER,
        ${is_night}::INTEGER,
        ${tx_count_1h}::INTEGER,
        ${tx_count_24h}::INTEGER,
        ${amount_vs_avg_ratio}::FLOAT,
        ${customer_risk_score}::FLOAT,
        ${merchant_risk_score}::INTEGER,
        ${location_changed}::INTEGER,
        ${device_changed}::INTEGER,
        ${high_velocity_1h}::INTEGER,
        ${is_international}::INTEGER,
        0.0::FLOAT,
        100::INTEGER,
        10::INTEGER,
        1000.0::FLOAT,
        300.0::FLOAT,
        5::INTEGER,
        0::INTEGER,
        3::INTEGER,
        0::INTEGER,
        2::INTEGER,
        2::INTEGER,
        2::INTEGER,
        365::INTEGER
      ) AS PREDICTION
    `);

    if (results.length > 0) {
      return NextResponse.json({
        prediction: results[0].PREDICTION,
        confidence: results[0].PREDICTION === 1 ? 0.85 : 0.92,
        model: "XGBoost v1",
      });
    }

    let riskScore = 0;
    if (amount > 2000) riskScore += 30;
    if (customer_risk_score > 70) riskScore += 25;
    if (tx_count_1h > 3) riskScore += 15;
    if (amount_vs_avg_ratio > 3) riskScore += 15;
    if (location_changed) riskScore += 10;
    if (device_changed) riskScore += 10;
    if (is_international) riskScore += 5;
    if (is_night) riskScore += 5;
    if (merchant_risk_score === 3) riskScore += 10;

    return NextResponse.json({
      prediction: riskScore >= 40 ? 1 : 0,
      confidence: 0.7,
      model: "Heuristic Fallback",
      riskScore,
    });
  } catch (error) {
    console.error("Error making prediction:", error);
    return NextResponse.json(
      { error: "Failed to make prediction" },
      { status: 500 }
    );
  }
}
