import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { serializeBranding } from '@/lib/branding';

// POST /api/branding/reset
// Resets the branding to defaults: deletes the singleton row and recreates
// it with defaults. Useful if a buyer messes up the settings.
export async function POST() {
  try {
    // Delete the existing singleton row if present, then recreate with defaults.
    // (The key column is unique, so we must delete before re-create.)
    await db.branding.deleteMany({ where: { key: 'default' } });
    const branding = await db.branding.create({ data: { key: 'default' } });

    return NextResponse.json({ branding: serializeBranding(branding) });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
