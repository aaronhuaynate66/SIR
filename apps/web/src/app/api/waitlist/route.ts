import { type NextRequest, NextResponse } from 'next/server';
import { getServiceClient } from '@/lib/supabase-server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: NextRequest): Promise<NextResponse> {
  let body: { email?: unknown; name?: unknown; source?: unknown };
  try { body = await req.json(); } catch { body = {}; }

  const email  = typeof body.email  === 'string' ? body.email.trim().toLowerCase()  : '';
  const name   = typeof body.name   === 'string' ? body.name.trim()                 : null;
  const source = typeof body.source === 'string' ? body.source.trim()               : 'landing';

  if (!EMAIL_RE.test(email)) {
    return NextResponse.json({ error: 'Email inválido' }, { status: 400 });
  }

  const db = getServiceClient();

  // Check if already on waitlist
  const { data: existing } = await db.from('waitlist')
    .select('id, position')
    .eq('email', email)
    .maybeSingle();

  if (existing) {
    return NextResponse.json({ position: existing.position, already: true });
  }

  const { data: inserted, error } = await db.from('waitlist')
    .insert({ email, name, source })
    .select('id, position')
    .single();

  if (error) {
    if (error.code === '23505') {
      // Race condition — already exists
      const { data: existing2 } = await db.from('waitlist').select('position').eq('email', email).maybeSingle();
      return NextResponse.json({ position: existing2?.position ?? 1, already: true });
    }
    return NextResponse.json({ error: 'Error al registrar' }, { status: 500 });
  }

  // Optional: send confirmation email via Resend
  const resendKey = process.env['RESEND_API_KEY'];
  if (resendKey) {
    fetch('https://api.resend.com/emails', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${resendKey}` },
      body: JSON.stringify({
        from:    process.env['EMAIL_FROM'] ?? 'SIR <noreply@marlabinc.com>',
        to:      [email],
        subject: '✓ Estás en la lista — SIR',
        html:    `<p>Hola${name ? ` ${name}` : ''}!</p>
<p>Quedaste en la posición <strong>#${(inserted as { position: number }).position}</strong> de la lista de espera de SIR.</p>
<p>Te avisaremos cuando tu acceso esté listo.</p>
<p>— El equipo SIR</p>`,
      }),
    }).catch(() => undefined);
  }

  const row = inserted as { id: string; position: number };
  return NextResponse.json({ position: row.position, already: false }, { status: 201 });
}

export async function GET(): Promise<NextResponse> {
  const db = getServiceClient();
  const { count } = await db.from('waitlist').select('id', { count: 'exact', head: true });
  return NextResponse.json({ count: count ?? 0 });
}
