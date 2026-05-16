import { createServerSupabase, getServiceClient } from '@/lib/supabase-server';

export const dynamic = 'force-dynamic';

interface DateBody {
  label:     string;
  date:      string;
  recurring?: boolean;
  notes?:    string;
}

export async function GET(_req: Request, { params }: { params: { id: string } }): Promise<Response> {
  const supabase = createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const { data } = await getServiceClient()
    .from('people_dates')
    .select('id, label, date, recurring, notes, created_at')
    .eq('user_id', user.id)
    .eq('person_id', params.id)
    .order('date');

  return Response.json(data ?? []);
}

export async function POST(req: Request, { params }: { params: { id: string } }): Promise<Response> {
  const supabase = createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  let body: DateBody;
  try { body = await req.json() as DateBody; } catch { return Response.json({ error: 'Invalid body' }, { status: 400 }); }

  const { label, date, recurring = true, notes } = body;
  if (!label?.trim() || !date) return Response.json({ error: 'label and date required' }, { status: 400 });

  const { data, error } = await getServiceClient()
    .from('people_dates')
    .insert({ user_id: user.id, person_id: params.id, label, date, recurring, notes: notes ?? null })
    .select()
    .single();

  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json(data, { status: 201 });
}

export async function DELETE(req: Request): Promise<Response> {
  const supabase = createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await req.json() as { id?: string };
  if (!id) return Response.json({ error: 'id required' }, { status: 400 });

  await getServiceClient().from('people_dates').delete().eq('id', id).eq('user_id', user.id);
  return Response.json({ ok: true });
}
