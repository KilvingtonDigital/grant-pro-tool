import { NextRequest, NextResponse } from 'next/server';

/**
 * Returns a signed Google Static Maps satellite URL for a lat/lng.
 * Keeping the key server-side prevents exposure in browser network tabs.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const lat = searchParams.get('lat');
  const lng = searchParams.get('lng');
  const zoom = searchParams.get('zoom') ?? '19';
  const width = searchParams.get('w') ?? '640';
  const height = searchParams.get('h') ?? '400';

  if (!lat || !lng) {
    return NextResponse.json({ error: 'lat and lng are required' }, { status: 400 });
  }

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  if (!apiKey || apiKey === 'your-google-maps-api-key') {
    return NextResponse.json({ error: 'Google Maps API key not configured' }, { status: 503 });
  }

  const url =
    `https://maps.googleapis.com/maps/api/staticmap` +
    `?center=${lat},${lng}` +
    `&zoom=${zoom}` +
    `&size=${width}x${height}` +
    `&maptype=satellite` +
    `&key=${apiKey}`;

  return NextResponse.json({ url });
}
