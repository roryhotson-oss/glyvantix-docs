import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/current-user';

export async function GET() {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
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
