import { db } from '../src/lib/db'

async function seed() {
  const existing = await db.branding.findUnique({ where: { key: 'default' } })
  if (existing) {
    console.log('Branding already seeded:', existing.companyName)
    await db.$disconnect()
    return
  }
  const b = await db.branding.create({ data: { key: 'default' } })
  console.log('✅ Seeded branding:', b.companyName, b.tagline)
  await db.$disconnect()
}
seed().catch((e) => { console.error(e); process.exit(1) })
