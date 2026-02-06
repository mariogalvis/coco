import { NextResponse } from "next/server";
import { query } from "@/lib/snowflake";
import { NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sql } = body;

    if (!sql) {
      return NextResponse.json(
        { error: "SQL query is required" },
        { status: 400 }
      );
    }

    const selectOnly = sql.trim().toLowerCase().startsWith("select");
    if (!selectOnly) {
      return NextResponse.json(
        { error: "Only SELECT queries are allowed" },
        { status: 400 }
      );
    }

    const results = await query<Record<string, unknown>>(sql);
    return NextResponse.json({ results });
  } catch (error) {
    console.error("Error executing SQL:", error);
    return NextResponse.json(
      { error: "Failed to execute SQL" },
      { status: 500 }
    );
  }
}
