import { db } from '@/lib/db';
import { getServerSession } from 'next-auth';

import { authOptions } from '@/lib/auth';

const demoEmail = process.env.DEMO_USER_EMAIL || 'demo@glyvantix.app';

export async function getCurrentUser() {
  if (process.env.NODE_ENV === 'production') {
    const session = await getServerSession(authOptions);
    const email = session?.user?.email;
    if (!email) {
      return null;
    }

    return db.user.upsert({
      where: { email },
      update: { name: session.user?.name ?? undefined },
      create: { email, name: session.user?.name ?? null },
    });
  }

  return db.user.findUnique({
    where: { email: demoEmail },
  });
}