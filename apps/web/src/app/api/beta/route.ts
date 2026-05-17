import { type NextRequest, NextResponse } from 'next/server';
import { getServiceClient } from '@/lib/supabase-server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: NextRequest): Promise<NextResponse> {
  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { body = {}; }

  const name   = typeof body['name']   === 'string' ? body['name'].trim()                      : '';
  const email  = typeof body['email']  === 'string' ? body['email'].trim().toLowerCase()        : '';
  const reason = typeof body['reason'] === 'string' ? body['reason'].trim()                     : null;
  const role   = typeof body['role']   === 'string' ? body['role'].trim()                       : null;
  const company       = typeof body['company']        === 'string' ? body['company'].trim()       : null;
  const linkedin_url  = typeof body['linkedin_url']   === 'string' ? body['linkedin_url'].trim()  : null;

  if (!name) return NextResponse.json({ error: 'El nombre es requerido' },  { status: 400 });
  if (!EMAIL_RE.test(email)) return NextResponse.json({ error: 'Email inválido' }, { status: 400 });

  const db = getServiceClient();

  const { data: existing } = await db.from('beta_applications')
    .select('id, status')
    .eq('email', email)
    .maybeSingle();

  if (existing) {
    return NextResponse.json({ already: true, status: existing.status });
  }

  const { error } = await db.from('beta_applications').insert({
    name, email, reason, role, company, linkedin_url,
  });

  if (error) {
    if (error.code === '23505') return NextResponse.json({ already: true, status: 'pending' });
    return NextResponse.json({ error: 'Error al registrar solicitud' }, { status: 500 });
  }

  return NextResponse.json({ ok: true }, { status: 201 });
}
