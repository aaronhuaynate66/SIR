import { NextResponse } from 'next/server';
import { getServiceClient } from '@/lib/supabase-server';
import type { DbMemory } from '@sir/db';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  try {
    const body = await req.json() as { personName?: string; memoryId?: string };
    const { personName, memoryId } = body;

    if (!personName || !memoryId) {
      return NextResponse.json({ error: 'personName and memoryId required' }, { status: 400 });
    }

    const db = getServiceClient();

    // Carga la memoria social de la persona
    const { data: contactData } = await db.from('memories')
      .select('*')
      .eq('id', memoryId)
      .single();

    if (!contactData) {
      return NextResponse.json({ error: 'Person not found' }, { status: 404 });
    }

    const contact = contactData as DbMemory;

    // Memorias relacionadas
    const { data: memoriesData } = await db.from('memories')
      .select('layer, content, importance')
      .eq('user_id', contact.user_id)
      .not('layer', 'in', '("sensory","working")')
      .is('expires_at', null)
      .order('importance', { ascending: false })
      .limit(30);

    const relatedMemories = ((memoriesData ?? []) as Pick<DbMemory, 'layer' | 'content' | 'importance'>[])
      .filter(m => m.content.toLowerCase().includes(personName.toLowerCase()))
      .slice(0, 10);

    const context = relatedMemories.length > 0
      ? relatedMemories.map(m => `[${m.layer}] ${m.content}`).join('\n')
      : contact.content;

    const prompt = `Genera un briefing conciso sobre ${personName} basado en las siguientes memorias:

${context}

El briefing debe incluir:
- Quién es esta persona y su relación
- Temas o intereses en común
- Puntos clave a recordar en la próxima interacción
- Estado emocional o vínculo actual (si hay datos)

Responde en español, máximo 200 palabras, formato claro.`;

    // Llama a Claude
    const apiKey = process.env['ANTHROPIC_API_KEY'];
    if (!apiKey) {
      return NextResponse.json({ briefing: `Briefing manual:\n\n${contact.content}` });
    }

    const { default: Anthropic } = await import('@anthropic-ai/sdk');
    const claude = new Anthropic({ apiKey });

    const message = await claude.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 512,
      messages: [{ role: 'user', content: prompt }],
    });

    const text = message.content
      .filter(b => b.type === 'text')
      .map(b => (b as { type: 'text'; text: string }).text)
      .join('');

    return NextResponse.json({ briefing: text });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
