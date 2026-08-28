// Seed script for GLYvantix Docs templates
// Run with: bun run scripts/seed.ts
import { db } from '../src/lib/db'

async function seed() {
  console.log('🌱 Seeding GLYvantix Docs templates...')

  // Create a default demo user
  const user = await db.user.upsert({
    where: { email: 'demo@glyvantix.app' },
    update: {},
    create: {
      email: 'demo@glyvantix.app',
      name: 'Demo User',
      plan: 'free',
      credits: 1,
    },
  })
  console.log('✅ Created demo user:', user.email)

  const templates = [
    {
      name: 'Professional Invoice',
      description: 'Generate a polished, itemised invoice with your branding, line items, totals and payment terms.',
      category: 'Business',
      icon: 'ReceiptText',
      prompt: `You are a professional accountant. Generate a clean, well-formatted invoice in Markdown based on the user inputs. Include: invoice header with number and date, billed-from and billed-to sections, an itemised table of line items (description, qty, unit price, amount), subtotal, tax (if applicable), and grand total. Add a payment terms section and a thank-you note. Use Markdown tables. Keep it professional and concise.`,
      fields: JSON.stringify([
        { name: 'invoiceNumber', label: 'Invoice Number', type: 'text', placeholder: 'INV-2026-001', required: true },
        { name: 'fromName', label: 'Your Business Name', type: 'text', placeholder: 'Acme Studio Ltd', required: true },
        { name: 'toName', label: 'Client Name', type: 'text', placeholder: 'Globex Corporation', required: true },
        { name: 'toEmail', label: 'Client Email', type: 'email', placeholder: 'accounts@globex.com', required: false },
        { name: 'items', label: 'Line Items (description, qty, unit price)', type: 'textarea', placeholder: 'Logo design, 1, 450\nWebsite hosting (3 mo), 3, 80\nBrand guide PDF, 1, 220', required: true },
        { name: 'taxRate', label: 'Tax Rate (%)', type: 'text', placeholder: '20', required: false },
        { name: 'notes', label: 'Payment Notes', type: 'textarea', placeholder: 'Payment due within 14 days via bank transfer.', required: false }
      ]),
      price: 9.99,
      premium: true,
      estTime: 12
    },
    {
      name: 'Service Contract',
      description: 'A binding service agreement covering scope, deliverables, payment, IP and termination clauses.',
      category: 'Legal',
      icon: 'FileSignature',
      prompt: `You are a contract lawyer. Draft a professional service agreement in Markdown based on the inputs. Include numbered sections: 1) Parties, 2) Scope of Services, 3) Deliverables & Timeline, 4) Fees & Payment Terms, 5) Intellectual Property, 6) Confidentiality, 7) Term & Termination, 8) Limitation of Liability, 9) Governing Law, 10) Signatures. Use clear, plain-English legal language. End with a signature block.`,
      fields: JSON.stringify([
        { name: 'providerName', label: 'Service Provider Name', type: 'text', placeholder: 'Jane Smith Consulting', required: true },
        { name: 'clientName', label: 'Client Name', type: 'text', placeholder: 'Globex Corporation', required: true },
        { name: 'serviceName', label: 'Service Description', type: 'text', placeholder: 'Brand identity design', required: true },
        { name: 'deliverables', label: 'Deliverables', type: 'textarea', placeholder: 'Logo pack, brand guide, business card design', required: true },
        { name: 'timeline', label: 'Timeline / Duration', type: 'text', placeholder: '8 weeks from start date', required: true },
        { name: 'fee', label: 'Total Fee', type: 'text', placeholder: '$6,500 USD', required: true },
        { name: 'paymentTerms', label: 'Payment Terms', type: 'text', placeholder: '50% upfront, 50% on delivery', required: true },
        { name: 'jurisdiction', label: 'Governing Law / Jurisdiction', type: 'text', placeholder: 'England and Wales', required: false }
      ]),
      price: 14.99,
      premium: true,
      estTime: 18
    },
    {
      name: 'Business Proposal',
      description: 'A persuasive proposal that outlines the problem, solution, scope, timeline and investment.',
      category: 'Business',
      icon: 'FileText',
      prompt: `You are a business consultant. Write a persuasive, well-structured business proposal in Markdown. Include these sections: Executive Summary, Client Situation & Challenges, Proposed Solution, Scope of Work, Methodology, Timeline & Milestones, Investment & Pricing, Why Choose Us, Next Steps. Use a confident but professional tone. End with a clear call to action.`,
      fields: JSON.stringify([
        { name: 'clientName', label: 'Prospect / Client Name', type: 'text', placeholder: 'Globex Corporation', required: true },
        { name: 'projectTitle', label: 'Project Title', type: 'text', placeholder: 'Digital transformation roadmap', required: true },
        { name: 'problem', label: 'Client Problem / Goal', type: 'textarea', placeholder: 'Globex needs to modernise legacy systems and improve customer onboarding.', required: true },
        { name: 'solution', label: 'Your Proposed Solution', type: 'textarea', placeholder: 'A phased migration to a headless CMS with a redesigned onboarding flow.', required: true },
        { name: 'duration', label: 'Estimated Duration', type: 'text', placeholder: '12 weeks', required: true },
        { name: 'investment', label: 'Investment / Price', type: 'text', placeholder: '$28,000 USD', required: true },
        { name: 'yourCompany', label: 'Your Company Name', type: 'text', placeholder: 'Acme Digital Ltd', required: true }
      ]),
      price: 12.99,
      premium: true,
      estTime: 15
    },
    {
      name: 'Cover Letter',
      description: 'A tailored cover letter for a job application that highlights fit and motivation.',
      category: 'Personal',
      icon: 'Mail',
      prompt: `You are a career coach. Write a polished, concise cover letter in Markdown based on the user inputs. Address the hiring manager by name if provided. Open with a strong hook, demonstrate fit with specific experience, show enthusiasm for the company, and close with a confident call to action. Keep it under 350 words.`,
      fields: JSON.stringify([
        { name: 'applicantName', label: 'Your Name', type: 'text', placeholder: 'Alex Patel', required: true },
        { name: 'jobTitle', label: 'Job Title', type: 'text', placeholder: 'Senior Product Designer', required: true },
        { name: 'companyName', label: 'Company Name', type: 'text', placeholder: 'Figma', required: true },
        { name: 'hiringManager', label: 'Hiring Manager Name', type: 'text', placeholder: 'Sam Rivera', required: false },
        { name: 'experience', label: 'Your Relevant Experience', type: 'textarea', placeholder: '6 years designing SaaS dashboards, led design system at Acme.', required: true },
        { name: 'motivation', label: 'Why this company?', type: 'textarea', placeholder: 'I admire Figmas real-time collaboration tools and want to shape the next era of multiplayer design.', required: true }
      ]),
      price: 0,
      premium: false,
      estTime: 8
    },
    {
      name: 'Marketing Email',
      description: 'A high-converting marketing email with subject line, body and call to action.',
      category: 'Marketing',
      icon: 'Megaphone',
      prompt: `You are an email marketing expert. Write a high-converting marketing email in Markdown. Include a compelling subject line (provide 3 options at the top), preview text, a hook opener, body content focused on benefits not features, and a single clear CTA. Keep the tone friendly and persuasive. Use short paragraphs and a clear structure.`,
      fields: JSON.stringify([
        { name: 'productName', label: 'Product / Service', type: 'text', placeholder: 'TaskFlow Pro', required: true },
        { name: 'audience', label: 'Target Audience', type: 'text', placeholder: 'Freelance designers', required: true },
        { name: 'offer', label: 'Offer / Hook', type: 'text', placeholder: '50% off annual plan for life', required: true },
        { name: 'keyBenefit', label: 'Main Benefit', type: 'textarea', placeholder: 'Save 6 hours a week by automating recurring client tasks.', required: true },
        { name: 'cta', label: 'Call-to-Action', type: 'text', placeholder: 'Start your free trial', required: true },
        { name: 'tone', label: 'Tone', type: 'select', placeholder: 'Friendly,energetic,Professional,Playful,Urgent', required: false }
      ]),
      price: 4.99,
      premium: true,
      estTime: 7
    },
    {
      name: 'Project Plan',
      description: 'A structured project plan with phases, milestones, owners and risks.',
      category: 'Business',
      icon: 'ClipboardList',
      prompt: `You are a certified project manager (PMP). Produce a structured project plan in Markdown. Include: Project Overview, Goals & Success Metrics, Scope (In/Out), Phases & Milestones (with weeks), Resource & Owner Matrix (use a Markdown table), Risk Register (table with risk, impact, mitigation), Communication Plan, and a Status Reporting cadence. Be specific and professional.`,
      fields: JSON.stringify([
        { name: 'projectName', label: 'Project Name', type: 'text', placeholder: 'Website Redesign 2026', required: true },
        { name: 'objective', label: 'Project Objective', type: 'textarea', placeholder: 'Modernise the marketing website to increase demo conversions by 30%.', required: true },
        { name: 'duration', label: 'Total Duration', type: 'text', placeholder: '12 weeks', required: true },
        { name: 'team', label: 'Team / Roles', type: 'textarea', placeholder: 'PM, Designer, 2 Developers, QA', required: true },
        { name: 'budget', label: 'Budget (optional)', type: 'text', placeholder: '$45,000', required: false }
      ]),
      price: 11.99,
      premium: true,
      estTime: 14
    },
    {
      name: 'NDA Agreement',
      description: 'A mutual non-disclosure agreement to protect confidential information between parties.',
      category: 'Legal',
      icon: 'ShieldCheck',
      prompt: `You are a contract lawyer. Draft a mutual Non-Disclosure Agreement (NDA) in Markdown. Include numbered clauses: 1) Parties, 2) Definition of Confidential Information, 3) Obligations of Receiving Party, 4) Exclusions, 5) Term & Termination, 6) Return of Materials, 7) Remedies, 8) Governing Law, 9) Signatures. Use precise legal English. End with signature blocks for both parties.`,
      fields: JSON.stringify([
        { name: 'partyA', label: 'Party A (Disclosing)', type: 'text', placeholder: 'Acme Studio Ltd', required: true },
        { name: 'partyB', label: 'Party B (Receiving)', type: 'text', placeholder: 'Globex Corporation', required: true },
        { name: 'purpose', label: 'Purpose of Disclosure', type: 'textarea', placeholder: 'Evaluating a potential partnership for a co-branded product launch.', required: true },
        { name: 'term', label: 'Term (years)', type: 'text', placeholder: '2', required: true },
        { name: 'jurisdiction', label: 'Governing Law', type: 'text', placeholder: 'England and Wales', required: false }
      ]),
      price: 9.99,
      premium: true,
      estTime: 10
    },
    {
      name: 'Sales Report',
      description: 'A monthly sales report summarising performance, pipeline and recommendations.',
      category: 'Business',
      icon: 'BarChart3',
      prompt: `You are a sales operations analyst. Produce a monthly sales report in Markdown. Include: Executive Summary, Key Metrics (use a table: metric, this month, last month, % change), Win/Loss Analysis, Top Deals Closed (table), Pipeline by Stage (table), Sales by Rep (table), Goals vs Actuals, Risks & Watchouts, Recommendations for next month. Use clean Markdown tables. Be data-driven and concise.`,
      fields: JSON.stringify([
        { name: 'month', label: 'Reporting Month', type: 'text', placeholder: 'August 2026', required: true },
        { name: 'companyName', label: 'Company Name', type: 'text', placeholder: 'Acme Inc', required: true },
        { name: 'revenue', label: 'Revenue This Month', type: 'text', placeholder: '$128,400', required: true },
        { name: 'prevRevenue', label: 'Previous Month Revenue', type: 'text', placeholder: '$112,800', required: true },
        { name: 'deals', label: 'Deals Closed / Lost', type: 'text', placeholder: '14 closed, 6 lost', required: true },
        { name: 'pipeline', label: 'Open Pipeline Value', type: 'text', placeholder: '$340,000', required: true },
        { name: 'goal', label: 'Monthly Goal', type: 'text', placeholder: '$120,000', required: false }
      ]),
      price: 7.99,
      premium: true,
      estTime: 13
    },
    {
      name: 'Privacy Policy',
      description: 'A website privacy policy covering data collection, cookies, third parties and user rights.',
      category: 'Legal',
      icon: 'Lock',
      prompt: `You are a privacy lawyer (GDPR/CCPA aware). Draft a website Privacy Policy in Markdown. Include numbered sections: 1) Introduction, 2) Information We Collect, 3) How We Use Information, 4) Cookies & Tracking, 5) Third-Party Services, 6) Data Sharing, 7) Data Security, 8) Your Rights (access, deletion, opt-out), 9) Childrens Privacy, 10) International Transfers, 11) Policy Updates, 12) Contact. Use clear language a non-lawyer can understand.`,
      fields: JSON.stringify([
        { name: 'companyName', label: 'Company Name', type: 'text', placeholder: 'Acme Inc', required: true },
        { name: 'websiteUrl', label: 'Website URL', type: 'text', placeholder: 'https://acme.com', required: true },
        { name: 'email', label: 'Contact Email', type: 'email', placeholder: 'privacy@acme.com', required: true },
        { name: 'dataCollected', label: 'Data You Collect', type: 'textarea', placeholder: 'Name, email, billing address, usage analytics, cookies.', required: true },
        { name: 'thirdParties', label: 'Third-Party Services', type: 'textarea', placeholder: 'Stripe, Google Analytics, Mailchimp', required: false },
        { name: 'jurisdiction', label: 'Jurisdiction', type: 'text', placeholder: 'United Kingdom (GDPR + UK DPA)', required: false }
      ]),
      price: 12.99,
      premium: true,
      estTime: 12
    },
    {
      name: 'Terms of Service',
      description: 'A website terms of service agreement covering usage, accounts, IP, liability and termination.',
      category: 'Legal',
      icon: 'Scale',
      prompt: `You are a contract lawyer. Draft a Terms of Service agreement in Markdown. Include numbered sections: 1) Acceptance of Terms, 2) Description of Service, 3) Account Registration, 4) Acceptable Use, 5) Intellectual Property, 6) User Content, 7) Payments & Subscriptions, 8) Termination, 9) Disclaimers, 10) Limitation of Liability, 11) Governing Law, 12) Contact. Use precise but readable language.`,
      fields: JSON.stringify([
        { name: 'companyName', label: 'Company Name', type: 'text', placeholder: 'Acme Inc', required: true },
        { name: 'websiteUrl', label: 'Website URL', type: 'text', placeholder: 'https://acme.com', required: true },
        { name: 'serviceName', label: 'Service Name', type: 'text', placeholder: 'Acme Cloud', required: true },
        { name: 'email', label: 'Contact Email', type: 'email', placeholder: 'legal@acme.com', required: true },
        { name: 'jurisdiction', label: 'Governing Law', type: 'text', placeholder: 'England and Wales', required: false }
      ]),
      price: 12.99,
      premium: true,
      estTime: 12
    },
    {
      name: 'Job Description',
      description: 'A clear, inclusive job description with responsibilities, requirements and benefits.',
      category: 'HR',
      icon: 'Briefcase',
      prompt: `You are a senior HR copywriter. Write an inclusive, clear and compelling job description in Markdown. Include: About Us, About the Role, Key Responsibilities (bullet list), Must-Have Qualifications (bullet list), Nice-to-Have Qualifications (bullet list), Benefits & Perks, How to Apply. Use inclusive language. Avoid jargon and biased phrases.`,
      fields: JSON.stringify([
        { name: 'jobTitle', label: 'Job Title', type: 'text', placeholder: 'Senior Backend Engineer', required: true },
        { name: 'companyName', label: 'Company Name', type: 'text', placeholder: 'Acme Inc', required: true },
        { name: 'location', label: 'Location / Work Mode', type: 'text', placeholder: 'Remote (Europe)', required: true },
        { name: 'summary', label: 'Role Summary', type: 'textarea', placeholder: 'Own the design and scaling of our event-driven billing platform serving 2M+ requests/day.', required: true },
        { name: 'responsibilities', label: 'Key Responsibilities', type: 'textarea', placeholder: 'Design services, mentor juniors, own uptime, collaborate with product.', required: true },
        { name: 'requirements', label: 'Must-Have Qualifications', type: 'textarea', placeholder: '5+ years Node/Go, PostgreSQL, AWS, event-driven systems.', required: true },
        { name: 'benefits', label: 'Benefits', type: 'textarea', placeholder: 'Equity, 30 days leave, learning budget, remote-first.', required: false }
      ]),
      price: 6.99,
      premium: true,
      estTime: 10
    },
    {
      name: 'Press Release',
      description: 'A press-ready announcement with headline, dateline, quotes and boilerplate.',
      category: 'Marketing',
      icon: 'Newspaper',
      prompt: `You are a PR specialist. Write a press release in Markdown. Follow the inverted pyramid structure. Include: FOR IMMEDIATE RELEASE, a strong headline, dateline (CITY, Country — Date), a 1-paragraph lead with the news, supporting paragraphs with details, a quote from a spokesperson (use a placeholder name if not provided), a second section with context, an About section (boilerplate), and Media Contact block. Keep it under 500 words, newsworthy and professional.`,
      fields: JSON.stringify([
        { name: 'headline', label: 'Headline / News', type: 'text', placeholder: 'Acme raises $20M Series A to redefine document automation', required: true },
        { name: 'companyName', label: 'Company Name', type: 'text', placeholder: 'Acme Inc', required: true },
        { name: 'city', label: 'City, Country', type: 'text', placeholder: 'London, UK', required: true },
        { name: 'date', label: 'Release Date', type: 'text', placeholder: '28 August 2026', required: true },
        { name: 'summary', label: 'News Summary', type: 'textarea', placeholder: 'Acme announces a $20M Series A led by Sequoia to expand its AI document platform into Europe.', required: true },
        { name: 'spokesperson', label: 'Spokesperson (name + title)', type: 'text', placeholder: 'Jane Doe, CEO', required: false },
        { name: 'contact', label: 'Media Contact', type: 'text', placeholder: 'press@acme.com', required: true }
      ]),
      price: 5.99,
      premium: true,
      estTime: 9
    }
  ]

  for (const t of templates) {
    await db.template.create({ data: t })
  }
  console.log(`✅ Seeded ${templates.length} templates`)

  const count = await db.template.count()
  console.log(`📦 Total templates in DB: ${count}`)

  // Ensure the singleton branding row exists with defaults.
  const branding = await db.branding.upsert({
    where: { key: 'default' },
    update: {},
    create: { key: 'default' },
  })
  console.log(`✅ Branding ready: ${branding.companyName} — ${branding.tagline}`)

  await db.$disconnect()
  console.log('🌱 Seed complete.')
}

seed().catch((e) => {
  console.error('Seed failed:', e)
  process.exit(1)
})
