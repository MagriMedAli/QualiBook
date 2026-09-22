import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const search = request.nextUrl.searchParams.get("search")?.trim() || "";
    const stage = request.nextUrl.searchParams.get("stage")?.trim() || "";

    const values: string[] = [];
    const clauses: string[] = [];

    if (search) {
      values.push(`%${search}%`);
      clauses.push(`(name ILIKE $${values.length} OR contact_id ILIKE $${values.length} OR area ILIKE $${values.length})`);
    }

    if (stage && ["new", "qualifying", "qualified", "unqualified", "booked"].includes(stage)) {
      values.push(stage);
      clauses.push(`stage = $${values.length}`);
    }

    const where = clauses.length ? `WHERE ${clauses.join(" AND ")}` : "";
    const result = await db.query(
      `
        SELECT
          id, contact_id, name, budget, area, intent, timeline, stage,
          qualified, meeting_time, last_message, created_at, updated_at
        FROM leads
        ${where}
        ORDER BY updated_at DESC
        LIMIT 200
      `,
      values,
    );

    return NextResponse.json(result.rows);
  } catch (error) {
    console.error("GET /api/leads failed", error);
    return NextResponse.json(
      { error: "Unable to load leads. Check your PostgreSQL connection." },
      { status: 500 },
    );
  }
}
