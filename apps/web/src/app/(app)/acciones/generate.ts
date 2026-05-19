// Server-only module — not a Server Action, not an API route.
// Called from both page.tsx (server render) and /api/actions/suggest (client refresh).

import { getServiceClient } from '@/lib/supabase-server';
import { costTracker } from '@sir/ai';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ActionWithPerson {
  id:                string;
  person_id:         string;
  action_text:       string;
  timing_reason:     string;
  message_suggestion: string;
  impact_prediction: string;
  urgency:           'high' | 'medium' | 'low';
  status:            'pending' | 'completed' | 'postponed' | 'dismissed';
  created_at:        string;
  completed_at:      string | null;
  date_bucket:       string;
  person_name:       string;
  person_org:        string | null;
  person_role:       string | null;
  person_type:       string;
  person_slug:       string | null;
}

interface ClaudeJson {
  action_text:        string;
  timing_reason:      string;
  message_suggestion: string;
  impact_prediction:  string;
  urgency:            'high' | 'medium' | 'low';
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function todayBucket(): string {
  return new Date().toISOString().split('T')[0]!;
}

function daysAgo(iso: string): number {
  return Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
}

function daysUntil(dateStr: string): number {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  // people_dates.date is a plain date, handle recurring by year
  const [, mm, dd] = dateStr.split('-').map(Number) as [number, number, number];
  const candidate = new Date(today.getFullYear(), mm - 1, dd);
  if (candidate < today) candidate.setFullYear(today.getFullYear() + 1);
  return Math.floor((candidate.getTime() - today.getTime()) / 86_400_000);
}

const URGENCY_ORDER: Record<string, number> = { high: 0, medium: 1, low: 2 };

function sortByUrgency(a: ActionWithPerson, b: ActionWithPerson): number {
  return (URGENCY_ORDER[a.urgency] ?? 3) - (URGENCY_ORDER[b.urgency] ?? 3);
}

// ─── JSON parser — tolerant ───────────────────────────────────────────────────

function parseClaudeJson(text: string): ClaudeJson | null {
  const attempt = (s: string): ClaudeJson | null => {
    try {
      const parsed = JSON.parse(s) as Record<string, unknown>;
      if (typeof parsed['action_text'] === 'string') return parsed as unknown as ClaudeJson;
    } catch { /* continue */ }
    return null;
  };

  const direct = attempt(text);
  if (direct) return direct;

  const block = text.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
  if (block?.[1]) { const r = attempt(block[1]); if (r) return r; }

  const start = text.indexOf('{');
  const end   = text.lastIndexOf('}');
  if (start !== -1 && end > start) return attempt(text.slice(start, end + 1));

  return null;
}

// ─── Fallback when Claude is unavailable ─────────────────────────────────────

function buildFallback(candidate: {
  personName: string;
  personOrg:  string | null;
  reason:     string;
  urgency:    'high' | 'medium' | 'low';
}): ClaudeJson {
  return {
    action_text:        `Retoma el contacto con ${candidate.personName}`,
    timing_reason:      candidate.reason,
    message_suggestion: `Hola ${candidate.personName.split(' ')[0]}, ¿cómo estás? Quería saber cómo van las cosas${candidate.personOrg ? ` en ${candidate.personOrg}` : ''}.`,
    impact_prediction:  'Mantener la relación activa y el vínculo fuerte.',
    urgency:            candidate.urgency,
  };
}

// ─── Main export ──────────────────────────────────────────────────────────────

export async function generateDailyActions(userId: string): Promise<ActionWithPerson[]> {
  console.log('[ACTIONS] Starting for user:', userId);
  const db     = getServiceClient();
  const today  = todayBucket();

  // ── 1. Return cached suggestions if they exist for today ──────────────────
  type RawRow = {
    id: string; person_id: string; action_text: string; timing_reason: string;
    message_suggestion: string; impact_prediction: string;
    urgency: string; status: string; created_at: string;
    completed_at: string | null; date_bucket: string;
    people: { name: string; organization: string | null; role: string | null;
              relationship_type: string; slug: string | null } | null;
  };

  const { data: existing } = await db
    .from('action_suggestions')
    .select('*, people(name, organization, role, relationship_type, slug)')
    .eq('user_id', userId)
    .eq('date_bucket', today)
    .neq('status', 'dismissed')
    .order('created_at', { ascending: true });

  console.log('[ACTIONS] Cached today:', existing?.length ?? 0);
  if (existing && existing.length > 0) {
    const statuses = (existing as RawRow[]).map(r => r.status);
    console.log('[ACTIONS] Cached statuses:', JSON.stringify(statuses));
    const cached = (existing as RawRow[]).map(r => ({
      ...r,
      urgency:    r.urgency    as ActionWithPerson['urgency'],
      status:     r.status     as ActionWithPerson['status'],
      person_name: r.people?.name             ?? '(desconocido)',
      person_org:  r.people?.organization     ?? null,
      person_role: r.people?.role             ?? null,
      person_type: r.people?.relationship_type ?? 'networking',
      person_slug: r.people?.slug             ?? null,
    })).sort(sortByUrgency);
    console.log('[ACTIONS] Returning cached:', cached.length,
      JSON.stringify(cached.map(a => ({ id: a.id, status: a.status, person_id: a.person_id }))));
    return cached;
  }

  // ── 2. Build candidate pool ───────────────────────────────────────────────
  const thirtyDaysAgo = new Date(Date.now() - 30 * 86_400_000).toISOString();

  const [relsRes, signalsRes, datesRes, peopleRes] = await Promise.all([
    db.from('relationships')
      .select('person_id, strength, reciprocity, trust_score, stage, last_contact_at, contact_frequency_days')
      .eq('user_id', userId),
    db.from('signals')
      .select('person_id, signal_type, created_at')
      .eq('user_id', userId)
      .not('person_id', 'is', null)
      .gte('created_at', thirtyDaysAgo),
    db.from('people_dates')
      .select('person_id, label, date')
      .eq('user_id', userId),
    db.from('people')
      .select('id, name, organization, role, relationship_type, slug')
      .eq('user_id', userId),
  ]);

  type RelRow   = { person_id: string; strength: number; reciprocity: number; trust_score: number; stage: string; last_contact_at: string | null; contact_frequency_days: number | null };
  type SigRow   = { person_id: string | null; signal_type: string | null; created_at: string };
  type DateRow  = { person_id: string; label: string; date: string };
  type PersonRow = { id: string; name: string; organization: string | null; role: string | null; relationship_type: string; slug: string | null };

  const rels    = (relsRes.data   ?? []) as RelRow[];
  const signals = (signalsRes.data ?? []) as SigRow[];
  const dates   = (datesRes.data  ?? []) as DateRow[];
  const people  = (peopleRes.data ?? []) as PersonRow[];

  console.log('[ACTIONS] Relationships:', rels.length);
  console.log('[ACTIONS] Signals with person_id:', signals.filter(s => s.person_id).length);
  console.log('[ACTIONS] Upcoming dates rows:', dates.length);
  console.log('[ACTIONS] People:', people.length);
  if (relsRes.error)    console.error('[ACTIONS] relsRes error:', relsRes.error.message);
  if (signalsRes.error) console.error('[ACTIONS] signalsRes error:', signalsRes.error.message);
  if (peopleRes.error)  console.error('[ACTIONS] peopleRes error:', peopleRes.error.message);

  const personMap   = new Map(people.map(p => [p.id, p]));

  // signals per person (last 30d)
  const signalMap = new Map<string, number>();
  for (const s of signals) {
    if (s.person_id) signalMap.set(s.person_id, (signalMap.get(s.person_id) ?? 0) + 1);
  }

  // upcoming dates per person (next 14 days)
  const upcomingDates = new Map<string, { label: string; daysUntilDate: number }[]>();
  for (const d of dates) {
    const days = daysUntil(d.date);
    if (days <= 14) {
      const arr = upcomingDates.get(d.person_id) ?? [];
      arr.push({ label: d.label, daysUntilDate: days });
      upcomingDates.set(d.person_id, arr);
    }
  }

  // ── 3. Score each relationship ────────────────────────────────────────────
  type Candidate = {
    person: PersonRow; rel: RelRow; score: number;
    urgency: 'high' | 'medium' | 'low'; reason: string;
    daysSince: number | null; sigCount: number;
    upcoming: { label: string; daysUntilDate: number }[];
  };

  const allScored = rels
    .map(rel => {
      const person = personMap.get(rel.person_id);
      if (!person) return null;

      const now       = Date.now();
      const lastMs    = rel.last_contact_at ? new Date(rel.last_contact_at).getTime() : null;
      const daysSince = lastMs !== null ? Math.floor((now - lastMs) / 86_400_000) : null;
      const freq      = rel.contact_frequency_days ?? 30;

      const overdueScore = Math.min(100, (daysSince !== null ? daysSince / freq : 1.5) * 50);
      const relScore     = Math.round(rel.strength * 0.4 + rel.reciprocity * 0.3 + rel.trust_score * 100 * 0.3);
      const healthNeed   = 100 - relScore;
      const stageMap: Record<string, number> = { dormant: 80, prospect: 50, active: 20, strategic: 15 };
      const stageUrgency = stageMap[rel.stage] ?? 30;

      let score = Math.round(overdueScore * 0.4 + healthNeed * 0.3 + stageUrgency * 0.3);

      const upcoming = upcomingDates.get(rel.person_id);
      if (upcoming && upcoming.length > 0) score += 30;

      const sigCount = signalMap.get(rel.person_id) ?? 0;
      if (sigCount > 0) score += 10;

      const urgency: 'high' | 'medium' | 'low' = score >= 65 ? 'high' : score >= 40 ? 'medium' : 'low';

      let reason: string;
      if (upcoming && upcoming.length > 0) {
        const d = upcoming[0]!;
        reason = `${d.label} en ${d.daysUntilDate} día${d.daysUntilDate !== 1 ? 's' : ''}`;
      } else if (rel.stage === 'dormant') {
        reason = 'Relación dormida — reactívala antes de que sea difícil';
      } else if (daysSince !== null && daysSince > freq * 1.5) {
        reason = `Sin contacto hace ${daysSince} días (objetivo: cada ${freq})`;
      } else if (daysSince !== null && daysSince > freq) {
        reason = `${daysSince - freq} días pasado tu objetivo de contacto`;
      } else if (relScore < 40) {
        reason = 'Relación débil que necesita más atención';
      } else {
        reason = 'Buen momento para reforzar el vínculo';
      }

      return { person, rel, score, urgency, reason, daysSince, sigCount, upcoming: upcoming ?? [] } as Candidate;
    })
    .filter((c): c is Candidate => c !== null && c.score > 10)
    .sort((a, b) => b.score - a.score);

  console.log('[ACTIONS] Total candidates after scoring (score>10):', allScored.length,
    allScored.slice(0, 5).map(c => `${c.person.name}(${c.score})`));

  let scored = allScored.slice(0, 3);

  // Fallback: if scoring yielded nothing (e.g. relationships table empty),
  // pick top 3 people by signal count so we always show something.
  if (scored.length === 0 && people.length > 0) {
    console.log('[ACTIONS] Scoring empty → using signal-count fallback');
    const top3 = [...people]
      .sort((a, b) => (signalMap.get(b.id) ?? 0) - (signalMap.get(a.id) ?? 0))
      .slice(0, 3);
    scored = top3.map(person => ({
      person,
      rel: { person_id: person.id, strength: 50, reciprocity: 50, trust_score: 0.5,
             stage: 'active', last_contact_at: null, contact_frequency_days: 30 } as RelRow,
      score: 50,
      urgency: 'medium' as const,
      reason:  'Mantener el contacto regular',
      daysSince: null,
      sigCount:  signalMap.get(person.id) ?? 0,
      upcoming:  upcomingDates.get(person.id) ?? [],
    }));
    console.log('[ACTIONS] Fallback candidates:', scored.map(c => c.person.name));
  }

  console.log('[ACTIONS] Final scored:', scored.length, scored.map(c => c.person.name));
  if (scored.length === 0) return [];

  // ── 4. Build context + call Claude for each candidate ────────────────────
  const apiKey = process.env['ANTHROPIC_API_KEY'];
  console.log('[ACTIONS] ANTHROPIC_API_KEY present:', !!apiKey);
  console.log('[ACTIONS] Key prefix:', apiKey?.substring(0, 10));

  const SYSTEM = `Eres un asesor de relaciones profesionales. Analiza el contexto de esta persona y genera exactamente 5 campos JSON.
Responde ÚNICAMENTE con JSON válido, sin markdown, sin explicaciones adicionales.

Schema exacto:
{
  "action_text": "qué hacer hoy, máx 12 palabras, imperativo",
  "timing_reason": "por qué ahora y no después, máx 20 palabras",
  "message_suggestion": "mensaje exacto a enviar, personalizado con contexto real",
  "impact_prediction": "qué ganas si lo haces / qué arriesgas si no, máx 30 palabras",
  "urgency": "high" | "medium" | "low"
}

Reglas estrictas:
- Usa nombres, fechas y eventos reales del contexto proporcionado
- Sin consejos genéricos tipo "reconéctate con tu red"
- message_suggestion debe ser copiable y enviable sin edición
- Idioma: español`;

  console.log('[ACTIONS] Starting', scored.length, 'Claude calls in parallel');
  const results = await Promise.allSettled(
    scored.map(async candidate => {
      const { person, rel, reason, daysSince, sigCount, upcoming } = candidate;
      console.log('[ACTIONS] Calling Claude for:', person.name);

      // Build context packet
      const ctxLines: string[] = [
        `Persona: ${person.name}${person.role ? `, ${person.role}` : ''}${person.organization ? ` en ${person.organization}` : ''}`,
        `Categoría de relación: ${person.relationship_type}`,
        `Salud relacional: ${Math.round(rel.strength * 0.4 + rel.reciprocity * 0.3 + rel.trust_score * 100 * 0.3)}/100`,
        `Stage: ${rel.stage}`,
        `Fuerza: ${rel.strength}/100  Reciprocidad: ${rel.reciprocity}/100`,
        `Último contacto: ${daysSince !== null ? `hace ${daysSince} días` : 'nunca registrado'}`,
        `Frecuencia objetivo: cada ${rel.contact_frequency_days ?? 30} días`,
        `Señales recientes (30d): ${sigCount}`,
      ];
      if (upcoming.length > 0) {
        ctxLines.push(`Fechas próximas: ${upcoming.map(d => `${d.label} en ${d.daysUntilDate} días`).join(', ')}`);
      }
      ctxLines.push(`Razón de urgencia: ${reason}`);

      const context = ctxLines.join('\n');

      if (!apiKey) {
        return buildFallback({ personName: person.name, personOrg: person.organization, reason, urgency: candidate.urgency });
      }

      const start = Date.now();
      const { default: Anthropic } = await import('@anthropic-ai/sdk');
      const anthropic = new Anthropic({ apiKey });

      const response = await anthropic.messages.create({
        model:      'claude-haiku-4-5-20251001', // use haiku for cost efficiency on bulk generation
        max_tokens: 400,
        system:     SYSTEM,
        messages:   [{ role: 'user', content: context }],
      });

      const text = response.content
        .filter(b => b.type === 'text')
        .map(b => (b as { type: 'text'; text: string }).text)
        .join('');

      const tokensIn  = response.usage.input_tokens;
      const tokensOut = response.usage.output_tokens;
      costTracker.track(userId, 'claude-haiku-4-5-20251001', tokensIn, tokensOut, 'actions', Date.now() - start).catch(() => undefined);

      const parsed = parseClaudeJson(text);
      console.log('[ACTIONS] Claude done for:', person.name, 'parsed:', !!parsed);
      return parsed ?? buildFallback({ personName: person.name, personOrg: person.organization, reason, urgency: candidate.urgency });
    })
  );
  console.log('[ACTIONS] All Claude calls settled:', results.map(r => r.status));

  // ── 5. Collect successful results ─────────────────────────────────────────
  const toInsert: Array<{
    user_id: string; person_id: string;
    action_text: string; timing_reason: string;
    message_suggestion: string; impact_prediction: string;
    urgency: string; date_bucket: string;
  }> = [];

  const withPerson: ActionWithPerson[] = [];

  scored.forEach((candidate, i) => {
    const result = results[i];
    if (result?.status !== 'fulfilled') return;
    const json = result.value;

    toInsert.push({
      user_id:           userId,
      person_id:         candidate.person.id,
      action_text:       json.action_text,
      timing_reason:     json.timing_reason,
      message_suggestion: json.message_suggestion,
      impact_prediction:  json.impact_prediction,
      urgency:            json.urgency,
      date_bucket:        today,
    });
    withPerson.push({
      id:                '', // will be set after insert
      person_id:         candidate.person.id,
      action_text:       json.action_text,
      timing_reason:     json.timing_reason,
      message_suggestion: json.message_suggestion,
      impact_prediction:  json.impact_prediction,
      urgency:            json.urgency as ActionWithPerson['urgency'],
      status:            'pending',
      created_at:        new Date().toISOString(),
      completed_at:      null,
      date_bucket:       today,
      person_name:       candidate.person.name,
      person_org:        candidate.person.organization,
      person_role:       candidate.person.role,
      person_type:       candidate.person.relationship_type,
      person_slug:       candidate.person.slug,
    });
  });

  if (toInsert.length > 0) {
    const { data: inserted } = await db
      .from('action_suggestions')
      .insert(toInsert)
      .select('id');

    if (inserted) {
      (inserted as Array<{ id: string }>).forEach((row, i) => {
        if (withPerson[i]) withPerson[i]!.id = row.id;
      });
    }
  }

  console.log('[ACTIONS] Returning', withPerson.length, 'actions');
  return withPerson.sort(sortByUrgency);
}
