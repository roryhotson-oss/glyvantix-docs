import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { createDocumentCompletion } from '@/lib/ai';
import { getCurrentUser } from '@/lib/current-user';

// Free-form AI document generation.
// The user types whatever they want in natural language and the AI
// generates a polished document from it — no fixed template needed.
//
// POST /api/generate-custom
// Body: { prompt: string, title?: string }
// Returns the same shape as /api/generate so the frontend can reuse the
// same outcome handling. Premium feature: free users spend 1 credit,
// subscribers generate for free.

const SYSTEM_PROMPT = `You are a professional document writer. The user will describe any document they need in plain language. Generate a polished, well-structured document in Markdown based on their request.

Guidelines:
- Output clean, professional Markdown with appropriate headings, lists, tables and paragraphs.
- Use the right structure for the document type the user asks for (letter, contract, report, email, invoice, proposal, script, summary, etc.).
- If the user gives specific details (names, dates, numbers, company names), use them faithfully.
- If the user omits something important, make a sensible placeholder (e.g. [Company Name]) rather than inventing fake specifics.
- Keep the tone professional and concise unless the user asks otherwise.
- Do NOT wrap the output in code fences. Return only the document content.
- Start the document with a clear title as a Markdown H1 (# Title) or appropriate heading, unless the format (e.g. email) doesn't need one.`;

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const prompt: string | undefined = body?.prompt;
    const customTitle: string | undefined = body?.title;

    if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
      return NextResponse.json(
        { error: 'Please describe what document you want to create.' },
        { status: 400 }
      );
    }
    if (prompt.length > 8000) {
      return NextResponse.json(
        { error: 'Prompt is too long (max 8000 characters).' },
        { status: 400 }
      );
    }

    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    // Free-form generation is a premium feature:
    // - Subscribers (any non-free plan) → source = "subscription", no credit spent.
    // - Free users with at least 1 credit → source = "purchase", spend 1 credit.
    // - Free users with 0 credits → 402, ask them to subscribe or buy credits.
    const isSubscribed = user.plan !== 'free';

    let source: 'subscription' | 'purchase' | 'free';
    if (isSubscribed) {
      source = 'subscription';
    } else if (user.credits > 0) {
      source = 'purchase';
    } else {
      return NextResponse.json(
        {
          error:
            'You need a subscription or a credit to generate a custom document. Subscribe for unlimited docs, or buy credits.',
          needsPurchase: true,
          // Custom docs cost a single credit; surface the cheapest pack as the upsell.
          price: 19.99,
          templateId: 'custom',
        },
        { status: 402 }
      );
    }

    // Build a sensible default title from the first ~60 chars of the prompt.
    const derivedTitle =
      customTitle && customTitle.trim().length > 0
        ? customTitle.trim()
        : prompt.trim().replace(/\s+/g, ' ').slice(0, 60) +
          (prompt.trim().length > 60 ? '…' : '');

    const content = await createDocumentCompletion([
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: prompt },
    ]);

    if (!content.trim()) {
      return NextResponse.json(
        { error: 'The AI returned an empty response. Please try rephrasing your request.' },
        { status: 502 }
      );
    }

    // Spend a credit if the free user is paying per-doc.
    let updatedUser = user;
    if (source === 'purchase') {
      updatedUser = await db.user.update({
        where: { id: user.id },
        data: { credits: Math.max(0, user.credits - 1) },
      });
    }

    const document = await db.document.create({
      data: {
        userId: user.id,
        templateId: null,
        title: derivedTitle,
        content,
        type: 'custom',
        source,
      },
    });

    return NextResponse.json({
      document: {
        id: document.id,
        title: document.title,
        content: document.content,
        type: document.type,
        source: document.source,
        createdAt: document.createdAt,
      },
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        name: updatedUser.name,
        plan: updatedUser.plan,
        credits: updatedUser.credits,
        createdAt: updatedUser.createdAt,
      },
      remainingCredits: updatedUser.credits,
    });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
