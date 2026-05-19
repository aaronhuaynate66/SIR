import { getAuthUser, getServiceClient } from '@/lib/supabase-server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: Request): Promise<Response> {
  try {
    const user = await getAuthUser();
    if (!user) return new Response(null, { status: 204 });

    const body = await req.json() as {
      event_name?: string;
      properties?: Record<string, unknown>;
      page_path?: string;
    };
    if (!body.event_name) return new Response(null, { status: 204 });

    const db = getServiceClient();
    void db.from('analytics_events').insert({
      user_id:    user.id,
      event_name: body.event_name,
      properties: body.properties ?? {},
      page_path:  body.page_path ?? null,
    });

    return new Response(null, { status: 204 });
  } catch {
    return new Response(null, { status: 204 });
  }
}
