import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { createDocumentCompletion } from '@/lib/ai';
import { getCurrentUser } from '@/lib/current-user';
import { validateTemplateFields } from '@/lib/template-validation';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const templateId: string | undefined = body?.templateId;
    const fields: Record<string, unknown> | undefined = body?.fields;

    if (!templateId) {
      return NextResponse.json(
        { error: 'Missing templateId' },
        { status: 400 }
      );
    }
    if (!fields || typeof fields !== 'object') {
      return NextResponse.json(
        { error: 'Missing fields' },
        { status: 400 }
      );
    }

    const template = await db.template.findUnique({
      where: { id: templateId },
    });
    if (!template) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 });
    }

    const templateFields: Array<{
      name: string;
      label: string;
      type: string;
      required?: boolean;
    }> = JSON.parse(template.fields);
    const allowedNames = new Set(templateFields.map((field) => field.name));
    const unknownField = Object.keys(fields).find((name) => !allowedNames.has(name));
    if (unknownField) {
      return NextResponse.json({ error: `Unknown template field: ${unknownField}` }, { status: 400 });
    }
    const fieldErrors = validateTemplateFields(templateFields, fields);
    if (Object.keys(fieldErrors).length > 0) {
      return NextResponse.json(
        { error: 'Please correct the highlighted fields.', fieldErrors },
        { status: 400 }
      );
    }

    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const isSubscribed = user.plan !== 'free';
    const isPremium = template.premium && template.price > 0;

    // Determine the source of this generation.
    let source: 'subscription' | 'purchase' | 'free';
    if (!isPremium) {
      source = 'free';
    } else if (isSubscribed) {
      source = 'subscription';
    } else if (user.credits > 0) {
      source = 'purchase';
    } else {
      // Premium template, free user, no credits → payment required.
      return NextResponse.json(
        {
          error: 'Purchase required',
          needsPurchase: true,
          price: template.price,
          templateId: template.id,
        },
        { status: 402 }
      );
    }

    // Build the LLM prompt and call the model.
    const content = await createDocumentCompletion([
      { role: 'system', content: template.prompt },
      {
        role: 'user',
        content:
          'User inputs (use these values):\n' +
          JSON.stringify(fields, null, 2),
      },
    ]);

    // Build a sensible document title from the first user-supplied field value.
    const firstFieldValue = Object.values(fields).find(
      (v): v is string => typeof v === 'string' && v.trim().length > 0
    );
    const title = firstFieldValue
      ? `${template.name} — ${firstFieldValue}`
      : template.name;

    // Decrement credits if the user is spending a one-time credit.
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
        templateId: template.id,
        title,
        content,
        type: template.category.toLowerCase(),
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
