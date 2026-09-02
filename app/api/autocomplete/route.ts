import { NextRequest, NextResponse } from 'next/server';

/**
 * Proxy for Google Places Autocomplete API.
 * Keeps the API key server-side and enforces US-only address lookups.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const input = searchParams.get('input')?.trim();
  const sessiontoken = searchParams.get('sessiontoken') ?? '';

  if (!input || input.length < 3) {
    return NextResponse.json({ predictions: [], status: 'ZERO_RESULTS' });
  }

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  if (!apiKey || apiKey === 'your-google-maps-api-key') {
    return NextResponse.json({ error: 'Google Maps API key not configured' }, { status: 503 });
  }

  try {
    const params = new URLSearchParams({
      input,
      types: 'address',
      components: 'country:us',
      sessiontoken,
      key: apiKey,
    });

    const res = await fetch(
      `https://maps.googleapis.com/maps/api/place/autocomplete/json?${params}`,
      { next: { revalidate: 0 } }
    );

    if (!res.ok) return NextResponse.json({ error: 'Upstream error' }, { status: 502 });
    const data = await res.json();
    return NextResponse.json(data);
  } catch (err: unknown) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
