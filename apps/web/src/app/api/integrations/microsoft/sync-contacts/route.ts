import { createServerSupabase, getServiceClient } from '@/lib/supabase-server';
import { getMsValidToken, type MicrosoftIntegration } from '../_lib';

export const dynamic = 'force-dynamic';

interface GraphContact {
  displayName?:    string;
  emailAddresses?: Array<{ address: string; name?: string }>;
  businessPhones?: string[];
  companyName?:    string;
  jobTitle?:       string;
}

function makeSlug(name: string): string {
  return (
    name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '').slice(0, 48) +
    '-' + Math.random().toString(36).slice(2, 6)
  );
}

export async function POST(): Promise<Response> {
  const supabase = createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const db = getServiceClient();
  const { data: intRow } = await db
    .from('microsoft_integrations')
    .select('*')
    .eq('user_id', user.id)
    .single();

  if (!intRow) return Response.json({ error: 'Not connected to Microsoft' }, { status: 400 });
  const integration = intRow as MicrosoftIntegration;

  let token: string;
  try {
    token = await getMsValidToken(integration, user.id);
  } catch (e) {
    return Response.json({ error: (e as Error).message }, { status: 401 });
  }

  const { data: existingPeople } = await db
    .from('people')
    .select('id, name, email, phone, organization, role')
    .eq('user_id', user.id);

  type ExistingPerson = { id: string; name: string; email: string | null; phone: string | null; organization: string | null; role: string | null };
  const byEmail = new Map<string, ExistingPerson>();
  const byName  = new Map<string, ExistingPerson>();

  for (const p of (existingPeople ?? []) as ExistingPerson[]) {
    if (p.email) byEmail.set(p.email.toLowerCase(), p);
    byName.set(p.name.toLowerCase(), p);
  }

  let created = 0, updated = 0, skipped = 0;
  let nextLink: string | null = 'https://graph.microsoft.com/v1.0/me/contacts?$top=100&$select=displayName,emailAddresses,businessPhones,companyName,jobTitle';

  while (nextLink) {
    const res = await fetch(nextLink, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json() as { value?: GraphContact[]; '@odata.nextLink'?: string };
    if (!res.ok) break;

    for (const contact of (data.value ?? [])) {
      const name = contact.displayName?.trim();
      if (!name) continue;

      const email = contact.emailAddresses?.[0]?.address?.toLowerCase() ?? null;
      const phone = contact.businessPhones?.[0] ?? null;
      const org   = contact.companyName ?? null;
      const role  = contact.jobTitle ?? null;

      const existing = (email ? byEmail.get(email) : undefined) ?? byName.get(name.toLowerCase());

      if (existing) {
        const patch: Record<string, string> = {};
        if (email && !existing.email) patch['email'] = email;
        if (phone && !existing.phone) patch['phone'] = phone;
        if (org   && !existing.organization) patch['organization'] = org;
        if (role  && !existing.role)  patch['role']  = role;

        if (Object.keys(patch).length > 0) {
          await db.from('people').update(patch).eq('id', existing.id);
          updated++;
        } else {
          skipped++;
        }
      } else {
        await db.from('people').insert({
          user_id:           user.id,
          name,
          email,
          phone,
          organization:      org,
          role,
          relationship_type: 'networking',
          slug:              makeSlug(name),
        });
        const fake = { id: 'new', name, email, phone, organization: org, role };
        if (email) byEmail.set(email, fake);
        byName.set(name.toLowerCase(), fake);
        created++;
      }
    }

    nextLink = data['@odata.nextLink'] ?? null;
  }

  await db.from('microsoft_integrations').update({
    contacts_synced: created + updated,
    last_sync_at:    new Date().toISOString(),
  }).eq('user_id', user.id);

  return Response.json({ created, updated, skipped });
}
