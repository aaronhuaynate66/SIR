import { NextResponse } from 'next/server';
import { readFileSync } from 'fs';
import { resolve } from 'path';

export const dynamic = 'force-dynamic';

export async function GET(): Promise<Response> {
  try {
    // Resolves from apps/web → ../chrome-extension/sir-extension.zip
    const zipPath = resolve(process.cwd(), '..', 'chrome-extension', 'sir-extension.zip');
    const data    = readFileSync(zipPath);

    return new Response(data, {
      headers: {
        'Content-Type':        'application/zip',
        'Content-Disposition': 'attachment; filename="sir-extension.zip"',
        'Content-Length':      data.length.toString(),
      },
    });
  } catch {
    return NextResponse.json({ error: 'Extension not found' }, { status: 404 });
  }
}
