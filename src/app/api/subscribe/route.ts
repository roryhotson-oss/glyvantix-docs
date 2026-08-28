import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

const PLAN_PRICES: Record<string, { monthly: number; yearly: number }> = {
  starter: { monthly: 19, yearly: 190 },
  pro: { monthly: 39, yearly: 390 },
  business: { monthly: 99, yearly: 990 },
};

const PLAN_CREDITS: Record<string, number> = {
  starter: 30,
  pro: 99999,
  business: 99999,
};

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const plan: string | undefined = body?.plan;
    const cycle: string | undefined = body?.cycle;

    if (!plan || !cycle) {
      return NextResponse.json(
        { error: 'Missing plan or cycle' },
        { status: 400 }
      );
    }

    if (!['starter', 'pro', 'business'].includes(plan)) {
      return NextResponse.json({ error: 'Invalid plan' }, { status: 400 });
    }
    if (!['monthly', 'yearly'].includes(cycle)) {
      return NextResponse.json({ error: 'Invalid cycle' }, { status: 400 });
    }

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

    const amount = PLAN_PRICES[plan][cycle as 'monthly' | 'yearly'];
    const credits = PLAN_CREDITS[plan];

    const now = new Date();
    const expiresAt = new Date(now);
    expiresAt.setDate(
      expiresAt.getDate() + (cycle === 'monthly' ? 30 : 365)
    );

    // Create subscription, update user, and create purchase record atomically.
    const [subscription, updatedUser, purchase] = await db.$transaction([
      db.subscription.create({
        data: {
          userId: user.id,
          plan,
          cycle,
          amount,
          status: 'active',
          startedAt: now,
          expiresAt,
        },
      }),
      db.user.update({
        where: { id: user.id },
        data: {
          plan,
          credits,
        },
      }),
      db.purchase.create({
        data: {
          userId: user.id,
          type: 'subscription',
          amount,
          status: 'completed',
        },
      }),
    ]);

    const documentsCount = await db.document.count({
      where: { userId: user.id },
    });
    const purchasesCount = await db.purchase.count({
      where: { userId: user.id },
    });

    return NextResponse.json({
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        name: updatedUser.name,
        plan: updatedUser.plan,
        credits: updatedUser.credits,
        createdAt: updatedUser.createdAt,
      },
      subscription: {
        id: subscription.id,
        plan: subscription.plan,
        cycle: subscription.cycle,
        amount: subscription.amount,
        status: subscription.status,
        startedAt: subscription.startedAt,
        expiresAt: subscription.expiresAt,
      },
      documentsCount,
      purchasesCount,
      purchase,
    });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
