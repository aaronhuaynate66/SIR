import { type NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest, AuthError } from '@/lib/auth';
import { getServiceClient } from '@/lib/supabase-server';
import { generateSlug } from '@sir/shared';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type WorkEntry = { role: string; company: string; dates?: string | null };

type EnrichPayload = {
  name?:          string;
  username?:      string;
  linkedin_url?:  string;
  instagram_url?: string;
  role?:          string;
  organization?:  string;
  location?:      string;
  education?:     string;
  work_history?:  WorkEntry[];
  bio?:           string;
  followers?:     string;
  following?:     string;
  website?:       string;
  source:         'linkedin' | 'instagram';
};

type PersonRow = {
  id:            string;
  slug:          string | null;
  linkedin_url:  string | null;
  instagram_url: string | null;
  role:          string | null;
  organization:  string | null;
  location:      string | null;
  education:     string | null;
  work_history:  WorkEntry[] | null;
  notes:         string | null;
};

export async function POST(req: NextRequest): Promise<NextResponse> {
  // ── Auth ──────────────────────────────────────────────────────────────────
  let userId: string;
  try {
    userId = await getUserFromRequest(req);
  } catch (err) {
    const msg = err instanceof AuthError ? err.message : 'Unauthorized';
    return NextResponse.json({ error: msg }, { status: 401 });
  }

  // ── Parse body ─────────────────────────────────────────────────────────────
  let payload: EnrichPayload;
  try {
    payload = (await req.json()) as EnrichPayload;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const name = (payload.name || payload.username || '').trim();
  if (!name) return NextResponse.json({ error: 'name is required' }, { status: 400 });

  const db = getServiceClient();

  // ── Find existing person ───────────────────────────────────────────────────
  let existing: PersonRow | null = null;

  if (payload.linkedin_url) {
    const { data } = await db.from('people')
      .select('id, slug, linkedin_url, instagram_url, role, organization, location, education, work_history, notes')
      .eq('user_id', userId)
      .eq('linkedin_url', payload.linkedin_url)
      .maybeSingle();
    existing = data as PersonRow | null;
  }

  if (!existing && payload.instagram_url) {
    const { data } = await db.from('people')
      .select('id, slug, linkedin_url, instagram_url, role, organization, location, education, work_history, notes')
      .eq('user_id', userId)
      .eq('instagram_url', payload.instagram_url)
      .maybeSingle();
    existing = data as PersonRow | null;
  }

  if (!existing) {
    const { data } = await db.from('people')
      .select('id, slug, linkedin_url, instagram_url, role, organization, location, education, work_history, notes')
      .eq('user_id', userId)
      .ilike('name', name)
      .maybeSingle();
    existing = data as PersonRow | null;
  }

  // ── Update existing ────────────────────────────────────────────────────────
  if (existing) {
    const updates: Record<string, unknown> = {};

    if (!existing.linkedin_url  && payload.linkedin_url)  updates['linkedin_url']  = payload.linkedin_url;
    if (!existing.instagram_url && payload.instagram_url) updates['instagram_url'] = payload.instagram_url;
    if (!existing.role          && payload.role)          updates['role']          = payload.role;
    if (!existing.organization  && payload.organization)  updates['organization']  = payload.organization;
    if (!existing.location      && payload.location)      updates['location']      = payload.location;
    if (!existing.education     && payload.education)     updates['education']     = payload.education;

    // Merge work history — append only new role+company combos
    if (payload.work_history?.length) {
      const current = existing.work_history ?? [];
      const existing_keys = new Set(current.map(w => `${w.role}|${w.company}`));
      const newEntries = payload.work_history.filter(w => !existing_keys.has(`${w.role}|${w.company}`));
      if (newEntries.length > 0) updates['work_history'] = [...current, ...newEntries];
    }

    // Append bio as a note if not already present
    if (payload.bio && !existing.notes?.includes(payload.bio)) {
      const prefix = payload.source === 'instagram' ? '[Bio Instagram]' : '[Bio LinkedIn]';
      updates['notes'] = existing.notes
        ? `${existing.notes}\n${prefix} ${payload.bio}`
        : `${prefix} ${payload.bio}`;
    }

    if (Object.keys(updates).length > 0) {
      await db.from('people').update(updates).eq('id', existing.id);
    }

    return NextResponse.json({ action: 'updated', person_id: existing.id, slug: existing.slug });
  }

  // ── Create new person ──────────────────────────────────────────────────────
  const baseSlug = generateSlug(name);
  let slug       = baseSlug;
  let counter    = 1;
  while (true) {
    const { data: check } = await db.from('people')
      .select('id').eq('user_id', userId).eq('slug', slug).maybeSingle();
    if (!check) break;
    counter++;
    slug = `${baseSlug}-${counter}`;
  }

  const notesVal = payload.bio
    ? `${payload.source === 'instagram' ? '[Bio Instagram]' : '[Bio LinkedIn]'} ${payload.bio}`
    : null;

  const insert: Record<string, unknown> = {
    user_id:           userId,
    name,
    slug,
    relationship_type: 'networking',
    ...(payload.linkedin_url   ? { linkedin_url:  payload.linkedin_url }  : {}),
    ...(payload.instagram_url  ? { instagram_url: payload.instagram_url } : {}),
    ...(payload.role           ? { role:          payload.role }          : {}),
    ...(payload.organization   ? { organization:  payload.organization }  : {}),
    ...(payload.location       ? { location:      payload.location }      : {}),
    ...(payload.education      ? { education:     payload.education }     : {}),
    ...(payload.work_history?.length ? { work_history: payload.work_history } : {}),
    ...(notesVal ? { notes: notesVal } : {}),
  };

  const { data: created, error } = await db.from('people')
    .insert(insert)
    .select('id, slug')
    .single();

  if (error) {
    return NextResponse.json({ error: `Failed to create: ${error.message}` }, { status: 500 });
  }

  const row = created as { id: string; slug: string | null };
  return NextResponse.json({ action: 'created', person_id: row.id, slug: row.slug }, { status: 201 });
}
