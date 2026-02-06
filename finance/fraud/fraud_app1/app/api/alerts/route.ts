import { NextResponse } from "next/server";
import { query } from "@/lib/snowflake";
import { NextRequest } from "next/server";

interface AlertRow {
  TRANSACTION_ID: string;
  FECHA: string;
  CLIENTE: string;
  MONTO: number;
  CATEGORIA: string;
  CIUDAD: string;
  TIPO_FRAUDE: string;
  ESTADO: string;
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const pending = searchParams.get("pending");
    const limit = searchParams.get("limit") || "50";

    let whereClause = "WHERE fl.IS_FRAUD = TRUE";
    if (pending === "true") {
      whereClause += " AND fl.INVESTIGATION_STATUS IN ('pending', 'investigating')";
    }

    const results = await query<AlertRow>(`
      SELECT 
        t.TRANSACTION_ID,
        t.TRANSACTION_TIMESTAMP as FECHA,
        c.NAME as CLIENTE,
        t.AMOUNT as MONTO,
        t.MERCHANT_CATEGORY as CATEGORIA,
        t.CITY as CIUDAD,
        fl.FRAUD_TYPE as TIPO_FRAUDE,
        fl.INVESTIGATION_STATUS as ESTADO
      FROM MG_COCO.FRAUD_DETECTION.TRANSACTIONS t
      JOIN MG_COCO.FRAUD_DETECTION.CUSTOMERS c ON t.CUSTOMER_ID = c.CUSTOMER_ID
      JOIN MG_COCO.FRAUD_DETECTION.FRAUD_LABELS fl ON t.TRANSACTION_ID = fl.TRANSACTION_ID
      ${whereClause}
      ORDER BY t.TRANSACTION_TIMESTAMP DESC
      LIMIT ${parseInt(limit)}
    `);

    return NextResponse.json(results);
  } catch (error) {
    console.error("Error fetching alerts:", error);
    return NextResponse.json(
      { error: "Failed to fetch alerts" },
      { status: 500 }
    );
  }
}
