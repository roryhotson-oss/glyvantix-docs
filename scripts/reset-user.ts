// Reset the demo user to a clean free state
// Run with: bun run scripts/reset-user.ts
import { db } from '../src/lib/db'

async function reset() {
  // Delete all subscriptions, purchases, and documents for the demo user
  const user = await db.user.findUnique({ where: { email: 'demo@glyvantix.app' } })
  if (!user) {
    console.log('No demo user found, nothing to reset.')
    return
  }
  await db.subscription.deleteMany({ where: { userId: user.id } })
  await db.purchase.deleteMany({ where: { userId: user.id } })
  await db.document.deleteMany({ where: { userId: user.id } })
  await db.user.update({
    where: { id: user.id },
    data: { plan: 'free', credits: 1 }
  })
  console.log('✅ Demo user reset to free plan with 1 credit. All subscriptions/purchases/documents cleared.')
  await db.$disconnect()
}

reset().catch((e) => {
  console.error('Reset failed:', e)
  process.exit(1)
})
