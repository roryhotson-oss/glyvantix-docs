import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const user = await db.user.findUnique({
      where: { email: 'demo@glyvantix.app' },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const documents = await db.document.findMany({
      where: { userId: user.id },
      include: { template: true },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({
      documents: documents.map((d) => ({
        id: d.id,
        title: d.title,
        content: d.content,
        type: d.type,
        source: d.source,
        templateId: d.templateId,
        templateName: d.template?.name ?? null,
        createdAt: d.createdAt,
      })),
    });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
