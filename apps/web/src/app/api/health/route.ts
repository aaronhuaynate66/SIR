import { NextResponse } from 'next/server';
import { getServiceClient } from '@/lib/supabase-server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const START_TIME = Date.now();

const CRITICAL_ENVS = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'SUPABASE_SERVICE_ROLE_KEY',
  'ANTHROPIC_API_KEY',
];

async function checkSupabase(): Promise<'ok' | 'error'> {
  try {
    const db = getServiceClient();
    const { error } = await db.from('users').select('id', { count: 'exact', head: true });
    return error ? 'error' : 'ok';
  } catch {
    return 'error';
  }
}

async function checkNeo4j(): Promise<'ok' | 'error'> {
  if (!process.env['NEO4J_PASSWORD'] || !process.env['NEO4J_URI']) return 'error';
  try {
    const { getNeo4jDriver } = await import('@sir/db');
    const driver = getNeo4jDriver();
    await driver.verifyConnectivity();
    return 'ok';
  } catch {
    return 'error';
  }
}

export async function GET(): Promise<NextResponse> {
  const [supabase, neo4j] = await Promise.all([
    checkSupabase(),
    checkNeo4j(),
  ]);

  const missingEnvs = CRITICAL_ENVS.filter(k => !process.env[k]);
  const envStatus = missingEnvs.length === 0 ? 'ok' : `missing: ${missingEnvs.join(', ')}`;

  const allOk = supabase === 'ok' && missingEnvs.length === 0;
  const status: 'ok' | 'degraded' | 'down' = allOk
    ? 'ok'
    : supabase === 'error'
      ? 'down'
      : 'degraded';

  return NextResponse.json({
    status,
    supabase,
    neo4j,
    env: envStatus,
    version: process.env['VERCEL_GIT_COMMIT_SHA']?.slice(0, 7) ?? 'local',
    uptime: Math.floor((Date.now() - START_TIME) / 1000),
    timestamp: new Date().toISOString(),
  });
}
