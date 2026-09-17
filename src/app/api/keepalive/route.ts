import { NextResponse } from "next/server";
import prisma from "@/lib/db";

// Vercel Cron passes this header automatically. Set CRON_SECRET in Vercel.
const CRON_SECRET = process.env.CRON_SECRET;

export const dynamic = "force-dynamic";

// Hit by Vercel Cron every 6 hours (see vercel.json). Runs a trivial query
// through Prisma so the Supabase Postgres connection is exercised and the
// free-tier database is never idle long enough to auto-pause.
export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (CRON_SECRET && authHeader !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json({ ok: true, ts: new Date().toISOString() });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "keepalive query failed" },
      { status: 502 },
    );
  }
}
