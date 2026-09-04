import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/current-user';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const userWithSubscriptions = await db.user.findUnique({
      where: { id: user.id },
      include: {
        subscriptions: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });

    if (!userWithSubscriptions) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const documentsCount = await db.document.count({
      where: { userId: user.id },
    });
    const purchasesCount = await db.purchase.count({
      where: { userId: user.id },
    });

    const activeSubscription = userWithSubscriptions.subscriptions[0] ?? null;

    return NextResponse.json({
      user: {
        id: userWithSubscriptions.id,
        email: userWithSubscriptions.email,
        name: userWithSubscriptions.name,
        plan: userWithSubscriptions.plan,
        credits: userWithSubscriptions.credits,
        createdAt: userWithSubscriptions.createdAt,
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
