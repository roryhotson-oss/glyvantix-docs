import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const templates = await db.template.findMany({
      orderBy: { createdAt: 'asc' },
    });

    const parsed = templates.map((t) => ({
      id: t.id,
      name: t.name,
      description: t.description,
      category: t.category,
      icon: t.icon,
      fields: JSON.parse(t.fields),
      price: t.price,
      premium: t.premium,
      estTime: t.estTime,
    }));

    return NextResponse.json({ templates: parsed });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
