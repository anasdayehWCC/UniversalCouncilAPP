import { NextResponse } from 'next/server';
import { PERSONAS, MEETINGS, TEMPLATES } from '@/config/personas';

// Static snapshot for the demo; quick to serve and cacheable in dev.
export const dynamic = 'force-static';
export const revalidate = 0;

export async function GET() {
  const payload = {
    personas: PERSONAS,
    meetings: MEETINGS,
    templates: TEMPLATES,
    generatedAt: new Date().toISOString(),
  };

  return NextResponse.json(payload, {
    status: 200,
    headers: {
      'Cache-Control': 'public, max-age=0, s-maxage=0, stale-while-revalidate=30',
    },
  });
}
