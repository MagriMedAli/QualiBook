import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import type { LeadStage } from "@/lib/types";

export async function GET() {
  try {
    const result = await db.query(`
      SELECT
        COUNT(*)::int AS total,
        COUNT(*) FILTER (WHERE stage = 'new')::int AS new,
        COUNT(*) FILTER (WHERE stage = 'qualifying')::int AS qualifying,
        COUNT(*) FILTER (WHERE stage = 'qualified')::int AS qualified,
        COUNT(*) FILTER (WHERE stage = 'unqualified')::int AS unqualified,
        COUNT(*) FILTER (WHERE stage = 'booked')::int AS booked,
        COUNT(*) FILTER (
          WHERE meeting_time >= date_trunc('week', NOW())
            AND meeting_time < date_trunc('week', NOW()) + INTERVAL '7 days'
        )::int AS meetings_this_week
      FROM leads;
    `);

    const row = result.rows[0] as Record<string, number>;
    const total = Number(row.total || 0);
    const qualified = Number(row.qualified || 0);

    const stages: Array<{ name: LeadStage; value: number }> = [
      { name: "new", value: Number(row.new || 0) },
      { name: "qualifying", value: Number(row.qualifying || 0) },
      { name: "qualified", value: Number(row.qualified || 0) },
      { name: "booked", value: Number(row.booked || 0) },
      { name: "unqualified", value: Number(row.unqualified || 0) },
    ];

    return NextResponse.json({
      total,
      new: Number(row.new || 0),
      qualifying: Number(row.qualifying || 0),
      qualified,
      unqualified: Number(row.unqualified || 0),
      booked: Number(row.booked || 0),
      meetingsThisWeek: Number(row.meetings_this_week || 0),
      qualifiedRate: total ? Math.round((qualified / total) * 100) : 0,
      stages,
    });
  } catch (error) {
    console.error("GET /api/stats failed", error);
    return NextResponse.json(
      { error: "Unable to load dashboard stats. Check your PostgreSQL connection." },
      { status: 500 },
    );
  }
}
