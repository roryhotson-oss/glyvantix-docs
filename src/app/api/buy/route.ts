import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const templateId: string | undefined = body?.templateId;

    if (!templateId) {
      return NextResponse.json(
        { error: 'Missing templateId' },
        { status: 400 }
      );
    }

    const template = await db.template.findUnique({
      where: { id: templateId },
    });
    if (!template) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 });
    }

    const user = await db.user.findUnique({
      where: { email: 'demo@glyvantix.app' },
    });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Free templates require no purchase.
    if (!template.premium || template.price === 0) {
      return NextResponse.json({
        ok: true,
        message: 'Free template, no purchase needed',
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          plan: user.plan,
          credits: user.credits,
          createdAt: user.createdAt,
        },
      });
    }

    // Premium template: record a one-time purchase and grant 1 credit.
    const [purchase, updatedUser] = await db.$transaction([
      db.purchase.create({
        data: {
          userId: user.id,
          templateId: template.id,
          type: 'one_time',
          amount: template.price,
          status: 'completed',
        },
      }),
      db.user.update({
        where: { id: user.id },
        data: { credits: user.credits + 1 },
      }),
    ]);

    return NextResponse.json({
      ok: true,
      purchase,
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        name: updatedUser.name,
        plan: updatedUser.plan,
        credits: updatedUser.credits,
        createdAt: updatedUser.createdAt,
      },
    });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
