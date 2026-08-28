import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Params) {
  try {
    const { id } = await params;

    const user = await db.user.findUnique({
      where: { email: 'demo@glyvantix.app' },
    });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const document = await db.document.findUnique({
      where: { id },
    });

    if (!document || document.userId !== user.id) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    return NextResponse.json({
      document: {
        id: document.id,
        title: document.title,
        content: document.content,
        type: document.type,
        source: document.source,
        createdAt: document.createdAt,
        updatedAt: document.updatedAt,
      },
    });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: Params) {
  try {
    const { id } = await params;

    const user = await db.user.findUnique({
      where: { email: 'demo@glyvantix.app' },
    });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const document = await db.document.findUnique({ where: { id } });
    if (!document || document.userId !== user.id) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    await db.document.delete({ where: { id } });

    return NextResponse.json({ ok: true });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
