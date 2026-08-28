import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const user = await db.user.findUnique({
      where: { email: 'demo@glyvantix.app' },
      include: {
        subscriptions: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const documentsCount = await db.document.count({
      where: { userId: user.id },
    });
    const purchasesCount = await db.purchase.count({
      where: { userId: user.id },
    });

    const activeSubscription = user.subscriptions[0] ?? null;

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        plan: user.plan,
        credits: user.credits,
        createdAt: user.createdAt,
      },
      subscription: activeSubscription
        ? {
            id: activeSubscription.id,
            plan: activeSubscription.plan,
            cycle: activeSubscription.cycle,
            amount: activeSubscription.amount,
            status: activeSubscription.status,
            startedAt: activeSubscription.startedAt,
            expiresAt: activeSubscription.expiresAt,
          }
        : null,
      documentsCount,
      purchasesCount,
    });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
