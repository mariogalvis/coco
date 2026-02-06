import { NextResponse } from "next/server";
import { NextRequest } from "next/server";
import { query } from "@/lib/snowflake";

interface ContentItem {
  type: string;
  text?: string;
  statement?: string;
  suggestions?: string[];
}

interface AnalystMessage {
  content: ContentItem[];
}

const SCHEMA_CONTEXT = `
Eres un asistente de análisis de fraudes en Colombia. Tienes acceso a las siguientes tablas en Snowflake:

1. MG_COCO.FRAUD_DETECTION.TRANSACTIONS - Transacciones
   - TRANSACTION_ID (VARCHAR): ID único de transacción
   - CUSTOMER_ID (VARCHAR): ID del cliente
   - MERCHANT_ID (VARCHAR): ID del comercio
   - MERCHANT_CATEGORY (VARCHAR): Categoría del comercio (grocery_pos, shopping_pos, etc.)
   - CITY (VARCHAR): Ciudad colombiana (Bogotá, Medellín, Cali, Barranquilla, Cartagena, Bucaramanga, Pereira, Santa Marta, Manizales, Villavicencio, Ibagué, Pasto, Cúcuta, Montería, Neiva)
   - CHANNEL (VARCHAR): Canal (online, chip, swipe, contactless)
   - TRANSACTION_TIMESTAMP (TIMESTAMP): Fecha y hora
   - AMOUNT (NUMBER): Monto de la transacción

2. MG_COCO.FRAUD_DETECTION.FRAUD_LABELS - Etiquetas de fraude
   - TRANSACTION_ID (VARCHAR): ID de transacción
   - IS_FRAUD (NUMBER): 1 si es fraude, 0 si no
   - FRAUD_TYPE (VARCHAR): Tipo de fraude (card_theft, account_takeover, etc.)

3. MG_COCO.FRAUD_DETECTION.CUSTOMERS - Clientes en Colombia
   - CUSTOMER_ID (VARCHAR): ID del cliente
   - NAME (VARCHAR): Nombre del cliente
   - EMAIL (VARCHAR): Email
   - CITY (VARCHAR): Ciudad colombiana
   - COUNTRY (VARCHAR): Colombia

4. MG_COCO.FRAUD_DETECTION.MERCHANTS - Comercios en Colombia
   - MERCHANT_ID (VARCHAR): ID del comercio
   - NAME (VARCHAR): Nombre
   - CATEGORY (VARCHAR): Categoría
   - CITY (VARCHAR): Ciudad colombiana
   - COUNTRY (VARCHAR): Colombia

Para unir transacciones con fraudes usa: LEFT JOIN MG_COCO.FRAUD_DETECTION.FRAUD_LABELS f ON t.TRANSACTION_ID = f.TRANSACTION_ID

Para calcular tasa de fraude: ROUND(SUM(CASE WHEN f.IS_FRAUD = 1 THEN 1 ELSE 0 END) * 100.0 / COUNT(*), 2)

Responde SOLO con un JSON válido con la siguiente estructura:
{
  "thinking": "tu razonamiento breve",
  "sql": "SELECT ... FROM ... -- query SQL para responder",
  "response_text": "texto de respuesta natural que explica lo que encontraste"
}

Si la pregunta no puede responderse con SQL, responde:
{
  "thinking": "razón",
  "sql": null,
  "response_text": "explicación de por qué no puedo responder"
}
`;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { question, reset } = body;

    if (reset) {
      return NextResponse.json({ success: true });
    }

    if (!question) {
      return NextResponse.json(
        { error: "Question is required" },
        { status: 400 }
      );
    }

    const prompt = `${SCHEMA_CONTEXT}

Pregunta del usuario: ${question}

Genera el JSON de respuesta:`;

    const escapedPrompt = prompt.replace(/'/g, "''");
    
    const llmResults = await query<{ RESPONSE: string }>(`
      SELECT SNOWFLAKE.CORTEX.COMPLETE(
        'llama3.1-70b',
        '${escapedPrompt}'
      ) as RESPONSE
    `);

    if (!llmResults.length || !llmResults[0].RESPONSE) {
      throw new Error("No LLM response");
    }

    const responseText = llmResults[0].RESPONSE;
    
    let parsed: { thinking?: string; sql?: string | null; response_text?: string };
    try {
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsed = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("No JSON found");
      }
    } catch {
      return NextResponse.json({
        message: {
          content: [
            { type: "text", text: responseText }
          ]
        }
      });
    }

    const content: ContentItem[] = [];

    if (parsed.sql) {
      try {
        const sqlResults = await query<Record<string, unknown>>(parsed.sql);
        
        if (sqlResults.length > 0) {
          const firstRow = sqlResults[0];
          const values = Object.entries(firstRow)
            .map(([k, v]) => {
              const formatted = typeof v === 'number' 
                ? v.toLocaleString('es-ES', { maximumFractionDigits: 2 })
                : String(v);
              return `**${k}**: ${formatted}`;
            })
            .join(", ");

          let responseText = parsed.response_text || `Encontré ${sqlResults.length} resultado(s).`;
          if (sqlResults.length === 1) {
            responseText = `${responseText}\n\n${values}`;
          }

          content.push({
            type: "text",
            text: responseText
          });
          content.push({
            type: "sql",
            statement: parsed.sql
          });
        } else {
          content.push({
            type: "text",
            text: "No se encontraron resultados para esta consulta."
          });
        }
      } catch (sqlErr) {
        console.error("SQL execution error:", sqlErr);
        content.push({
          type: "text",
          text: parsed.response_text || "Hubo un error ejecutando la consulta."
        });
      }
    } else {
      content.push({
        type: "text",
        text: parsed.response_text || "No pude generar una consulta para esta pregunta."
      });
    }

    content.push({
      type: "suggestions",
      suggestions: [
        "¿Cuál es la tasa de fraude?",
        "¿Cuáles son las categorías con más fraudes?",
        "¿Cuál es el monto promedio de fraudes?"
      ]
    });

    const response: { message: AnalystMessage } = {
      message: { content }
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error in intelligence API:", error);

    return NextResponse.json({
      message: {
        content: [
          {
            type: "text",
            text: "No pude procesar tu pregunta. Por favor, intenta reformularla."
          }
        ]
      }
    });
  }
}
