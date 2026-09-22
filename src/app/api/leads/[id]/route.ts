import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

const validStages = new Set(["new", "qualifying", "qualified", "unqualified", "booked"]);

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const result = await db.query("SELECT * FROM leads WHERE id = $1", [id]);

    if (!result.rowCount) {
      return NextResponse.json({ error: "Lead not found" }, { status: 404 });
    }

    return NextResponse.json(result.rows[0]);
  } catch (error) {
    console.error("GET /api/leads/[id] failed", error);
    return NextResponse.json({ error: "Unable to load lead" }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const stage = body.stage ?? null;
    if (stage !== null && !validStages.has(stage)) {
      return NextResponse.json({ error: "Invalid stage" }, { status: 400 });
    }

    const result = await db.query(
      `
        UPDATE leads
        SET
          name = $1,
          budget = $2,
          area = $3,
          intent = $4,
          timeline = $5,
          stage = COALESCE($6, stage),
          qualified = $7,
          meeting_time = $8,
          last_message = $9,
          updated_at = NOW()
        WHERE id = $10
        RETURNING *
      `,
      [
        body.name ?? null,
        body.budget ?? null,
        body.area ?? null,
        body.intent ?? null,
        body.timeline ?? null,
        stage,
        typeof body.qualified === "boolean" ? body.qualified : null,
        body.meeting_time || null,
        body.last_message ?? null,
        id,
      ],
    );

    if (!result.rowCount) {
      return NextResponse.json({ error: "Lead not found" }, { status: 404 });
    }

    return NextResponse.json(result.rows[0]);
  } catch (error) {
    console.error("PATCH /api/leads/[id] failed", error);
    return NextResponse.json({ error: "Unable to update lead" }, { status: 500 });
  }
}
