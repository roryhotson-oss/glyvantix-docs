import { db } from '../src/lib/db'

async function check() {
  const all = await db.template.findMany({ orderBy: { createdAt: 'asc' } })
  console.log('TOTAL templates in DB:', all.length)
  console.log('---')
  const byCategory: Record<string, number> = {}
  for (const t of all) {
    byCategory[t.category] = (byCategory[t.category] || 0) + 1
  }
  console.log('By category:')
  for (const [cat, n] of Object.entries(byCategory)) {
    console.log(`  ${cat}: ${n}`)
  }
  console.log('---')
  console.log('All template names:')
  for (const t of all) {
    console.log(`  [${t.category}] ${t.name}  (price=${t.price}, premium=${t.premium})`)
  }
  await db.$disconnect()
}
check().catch(e => { console.error(e); process.exit(1) })
