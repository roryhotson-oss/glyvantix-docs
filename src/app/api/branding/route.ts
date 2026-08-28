import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import {
  getOrCreateBranding,
  parseBrandingUpdate,
  serializeBranding,
} from '@/lib/branding';

// GET /api/branding
// Returns the singleton branding row (key "default"). If none exists yet,
// creates it with defaults first, then returns it.
export async function GET() {
  try {
    const branding = await getOrCreateBranding();
    return NextResponse.json({ branding: serializeBranding(branding) });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// PUT /api/branding
// Accepts a partial body with any of the branding fields (except id, key,
// createdAt, updatedAt). Updates the singleton row.
export async function PUT(req: Request) {
  try {
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { error: 'Request body must be valid JSON.' },
        { status: 400 }
      );
    }

    const parsed = parseBrandingUpdate(body);
    if ('error' in parsed) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }

    // Ensure the singleton row exists before updating (defensive — GET
    // would have created it, but a buyer might PUT first).
    const existing = await getOrCreateBranding();
    const updated = await db.branding.update({
      where: { id: existing.id },
      data: parsed.data,
    });

    return NextResponse.json({ branding: serializeBranding(updated) });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
