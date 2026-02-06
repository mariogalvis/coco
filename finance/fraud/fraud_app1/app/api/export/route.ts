import { NextResponse } from "next/server";
import { query } from "@/lib/snowflake";
import { NextRequest } from "next/server";

interface MetricsRow {
  TOTAL_TRANSACTIONS: number;
  TOTAL_FRAUDS: number;
  FRAUD_RATE: number;
  TOTAL_AMOUNT: number;
  FRAUD_AMOUNT: number;
}

interface CategoryRow {
  CATEGORIA: string;
  FRAUDES: number;
  TASA_FRAUDE: number;
}

interface CityRow {
  CIUDAD: string;
  FRAUDES: number;
  TASA_FRAUDE: number;
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const format = searchParams.get("format") || "json";

    const [metricsData, categoryData, cityData] = await Promise.all([
      query<MetricsRow>(`
        SELECT 
          COUNT(*) as TOTAL_TRANSACTIONS,
          SUM(CASE WHEN fl.IS_FRAUD THEN 1 ELSE 0 END) as TOTAL_FRAUDS,
          ROUND(SUM(CASE WHEN fl.IS_FRAUD THEN 1 ELSE 0 END) * 100.0 / COUNT(*), 2) as FRAUD_RATE,
          SUM(t.AMOUNT) as TOTAL_AMOUNT,
          SUM(CASE WHEN fl.IS_FRAUD THEN t.AMOUNT ELSE 0 END) as FRAUD_AMOUNT
        FROM MG_COCO.FRAUD_DETECTION.TRANSACTIONS t
        JOIN MG_COCO.FRAUD_DETECTION.FRAUD_LABELS fl ON t.TRANSACTION_ID = fl.TRANSACTION_ID
      `),
      query<CategoryRow>(`
        SELECT 
          t.MERCHANT_CATEGORY as CATEGORIA,
          SUM(CASE WHEN fl.IS_FRAUD THEN 1 ELSE 0 END) as FRAUDES,
          ROUND(SUM(CASE WHEN fl.IS_FRAUD THEN 1 ELSE 0 END) * 100.0 / COUNT(*), 2) as TASA_FRAUDE
        FROM MG_COCO.FRAUD_DETECTION.TRANSACTIONS t
        JOIN MG_COCO.FRAUD_DETECTION.FRAUD_LABELS fl ON t.TRANSACTION_ID = fl.TRANSACTION_ID
        GROUP BY 1
        ORDER BY FRAUDES DESC
        LIMIT 10
      `),
      query<CityRow>(`
        SELECT 
          t.CITY as CIUDAD,
          SUM(CASE WHEN fl.IS_FRAUD THEN 1 ELSE 0 END) as FRAUDES,
          ROUND(SUM(CASE WHEN fl.IS_FRAUD THEN 1 ELSE 0 END) * 100.0 / COUNT(*), 2) as TASA_FRAUDE
        FROM MG_COCO.FRAUD_DETECTION.TRANSACTIONS t
        JOIN MG_COCO.FRAUD_DETECTION.FRAUD_LABELS fl ON t.TRANSACTION_ID = fl.TRANSACTION_ID
        GROUP BY 1
        ORDER BY FRAUDES DESC
        LIMIT 10
      `),
    ]);

    const reportData = {
      generatedAt: new Date().toISOString(),
      summary: metricsData[0],
      fraudByCategory: categoryData,
      fraudByCity: cityData,
    };

    if (format === "csv") {
      let csv = "REPORTE DE FRAUDES\n";
      csv += `Generado: ${reportData.generatedAt}\n\n`;
      
      csv += "RESUMEN\n";
      csv += `Total Transacciones,${reportData.summary.TOTAL_TRANSACTIONS}\n`;
      csv += `Total Fraudes,${reportData.summary.TOTAL_FRAUDS}\n`;
      csv += `Tasa de Fraude,${reportData.summary.FRAUD_RATE}%\n`;
      csv += `Monto Total,$${reportData.summary.TOTAL_AMOUNT}\n`;
      csv += `Monto en Fraudes,$${reportData.summary.FRAUD_AMOUNT}\n\n`;
      
      csv += "FRAUDES POR CATEGORIA\n";
      csv += "Categoria,Fraudes,Tasa Fraude\n";
      categoryData.forEach((row) => {
        csv += `${row.CATEGORIA},${row.FRAUDES},${row.TASA_FRAUDE}%\n`;
      });
      
      csv += "\nFRAUDES POR CIUDAD\n";
      csv += "Ciudad,Fraudes,Tasa Fraude\n";
      cityData.forEach((row) => {
        csv += `${row.CIUDAD},${row.FRAUDES},${row.TASA_FRAUDE}%\n`;
      });

      return new NextResponse(csv, {
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": `attachment; filename=fraud_report_${new Date().toISOString().split("T")[0]}.csv`,
        },
      });
    }

    return NextResponse.json(reportData);
  } catch (error) {
    console.error("Error generating report:", error);
    return NextResponse.json(
      { error: "Failed to generate report" },
      { status: 500 }
    );
  }
}
