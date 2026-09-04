import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/current-user';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const amount: number | undefined = body?.amount;
    const price: number | undefined = body?.price;

    if (amount === undefined || price === undefined) {
      return NextResponse.json(
        { error: 'Missing amount or price' },
        { status: 400 }
      );
    }
    if (typeof amount !== 'number' || typeof price !== 'number') {
      return NextResponse.json(
        { error: 'amount and price must be numbers' },
        { status: 400 }
      );
    }

    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const [purchase, updatedUser] = await db.$transaction([
      db.purchase.create({
        data: {
          userId: user.id,
          type: 'credit_pack',
          amount: price,
          status: 'completed',
        },
      }),
      db.user.update({
        where: { id: user.id },
        data: { credits: user.credits + amount },
      }),
    ]);

    return NextResponse.json({
      ok: true,
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        name: updatedUser.name,
        plan: updatedUser.plan,
        credits: updatedUser.credits,
        createdAt: updatedUser.createdAt,
      },
      purchase,
    });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
