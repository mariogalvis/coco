import { NextResponse } from "next/server";
import { query } from "@/lib/snowflake";
import { NextRequest } from "next/server";

interface CustomerRow {
  CUSTOMER_ID: string;
  NAME: string;
  EMAIL: string;
  CITY: string;
  COUNTRY: string;
  RISK_SCORE: number;
}

interface TransactionRow {
  TRANSACTION_ID: string;
  FECHA: string;
  MONTO: number;
  CATEGORIA: string;
  CIUDAD: string;
  CANAL: string;
  ESTADO: string;
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get("search");
    const customerId = searchParams.get("id");

    if (customerId) {
      const transactions = await query<TransactionRow>(`
        SELECT 
          t.TRANSACTION_ID,
          t.TRANSACTION_TIMESTAMP as FECHA,
          t.AMOUNT as MONTO,
          t.MERCHANT_CATEGORY as CATEGORIA,
          t.CITY as CIUDAD,
          t.CHANNEL as CANAL,
          CASE WHEN fl.IS_FRAUD THEN 'Fraude' ELSE 'Normal' END as ESTADO
        FROM MG_COCO.FRAUD_DETECTION.TRANSACTIONS t
        JOIN MG_COCO.FRAUD_DETECTION.FRAUD_LABELS fl ON t.TRANSACTION_ID = fl.TRANSACTION_ID
        WHERE t.CUSTOMER_ID = '${customerId}'
        ORDER BY t.TRANSACTION_TIMESTAMP DESC
        LIMIT 100
      `);
      return NextResponse.json({ transactions });
    }

    if (search) {
      const customers = await query<CustomerRow>(`
        SELECT 
          CUSTOMER_ID,
          NAME,
          EMAIL,
          CITY,
          COUNTRY,
          RISK_SCORE
        FROM MG_COCO.FRAUD_DETECTION.CUSTOMERS
        WHERE LOWER(NAME) LIKE LOWER('%${search}%')
        OR LOWER(EMAIL) LIKE LOWER('%${search}%')
        ORDER BY RISK_SCORE DESC
        LIMIT 20
      `);
      return NextResponse.json({ customers });
    }

    const topRiskCustomers = await query<CustomerRow>(`
      SELECT 
        c.CUSTOMER_ID,
        c.NAME,
        c.EMAIL,
        c.CITY,
        c.COUNTRY,
        c.RISK_SCORE
      FROM MG_COCO.FRAUD_DETECTION.CUSTOMERS c
      ORDER BY c.RISK_SCORE DESC
      LIMIT 10
    `);

    return NextResponse.json({ customers: topRiskCustomers });
  } catch (error) {
    console.error("Error fetching customers:", error);
    return NextResponse.json(
      { error: "Failed to fetch customers" },
      { status: 500 }
    );
  }
}
