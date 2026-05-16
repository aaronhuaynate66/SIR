import { createServerSupabase, getServiceClient } from '@/lib/supabase-server';

export const dynamic = 'force-dynamic';

interface TranscribeBody {
  transcript: string;
  personId?:  string;
}

export async function POST(req: Request): Promise<Response> {
  const supabase = createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  let body: TranscribeBody;
  try {
    body = await req.json() as TranscribeBody;
  } catch {
    return Response.json({ error: 'Invalid body' }, { status: 400 });
  }

  const { transcript, personId } = body;
  if (!transcript?.trim()) return Response.json({ error: 'transcript required' }, { status: 400 });

  const db = getServiceClient();

  // Claude analysis
  let mentions: string[] = [];
  let emotion  = 'neutral';
  let topics:  string[] = [];
  let signals: string[] = [];

  const apiKey = process.env['ANTHROPIC_API_KEY'];
  if (apiKey) {
    try {
      const { default: Anthropic } = await import('@anthropic-ai/sdk');
      const claude = new Anthropic({ apiKey });
      const prompt = `Analiza esta nota de voz transcrita y responde SOLO con JSON válido (sin markdown):
{
  "mentions": ["nombres de personas mencionadas"],
  "emotion": "positivo|negativo|neutro|ansioso|entusiasmado|reflexivo",
  "topics": ["tema1", "tema2", "tema3"],
  "signals": ["señal accionable si existe, en español — máx 2"]
}

NOTA DE VOZ:
${transcript}`;

      const resp = await claude.messages.create({
        model:      'claude-haiku-4-5-20251001',
        max_tokens: 400,
        messages:   [{ role: 'user', content: prompt }],
      });
      const raw = resp.content[0]?.type === 'text' ? resp.content[0].text.trim() : '{}';
      const parsed = JSON.parse(raw.replace(/^```json\s*/,'').replace(/\s*```$/,'')) as {
        mentions?: string[]; emotion?: string; topics?: string[]; signals?: string[];
      };
      mentions = parsed.mentions ?? [];
      emotion  = parsed.emotion  ?? 'neutro';
      topics   = parsed.topics   ?? [];
      signals  = parsed.signals  ?? [];
    } catch {
      // Proceed without analysis
    }
  }

  // Save memory
  const content = [
    `Nota de voz: "${transcript.slice(0, 300)}${transcript.length > 300 ? '…' : ''}"`,
    topics.length ? `Temas: ${topics.join(', ')}.` : '',
    emotion !== 'neutro' ? `Estado emocional: ${emotion}.` : '',
    mentions.length ? `Personas mencionadas: ${mentions.join(', ')}.` : '',
  ].filter(Boolean).join(' ');

  await db.from('memories').insert({
    user_id:    user.id,
    person_id:  personId ?? null,
    layer:      'emotional',
    content,
    importance: 6,
    metadata:   { source: 'voice_note', emotion, topics, mentions, raw_transcript: transcript.slice(0, 1000) },
  });

  // Create signals for detected events
  for (const signal of signals) {
    await db.from('signals').insert({
      user_id:    user.id,
      person_id:  personId ?? null,
      type:       'insight',
      payload:    { source: 'voice_note', summary: signal },
      created_at: new Date().toISOString(),
    });
  }

  return Response.json({ mentions, emotion, topics, signals, transcript });
}
