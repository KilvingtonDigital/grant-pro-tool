import { NextRequest, NextResponse } from 'next/server';

function parseComponents(components: Array<{ types: string[]; long_name: string; short_name: string }>) {
  let state = '';
  let zipCode = '';
  let county = '';
  let city = '';
  let country = '';

  for (const c of components) {
    if (c.types.includes('administrative_area_level_1')) state = c.short_name;
    if (c.types.includes('administrative_area_level_2')) county = c.long_name.replace(' County', '').replace(' Parish', '').trim();
    if (c.types.includes('postal_code')) zipCode = c.long_name;
    if (c.types.includes('locality')) city = c.long_name;
    if (c.types.includes('country')) country = c.short_name;
  }

  return { state, zipCode, county, city, country };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function extractResult(result: any) {
  const { lat, lng } = result.geometry.location;
  const formattedAddress: string = result.formatted_address;
  const { state, zipCode, county, city, country } = parseComponents(result.address_components ?? []);
  return {
    lat,
    lng,
    formattedAddress,
    state,
    zipCode,
    county,
    city,
    country,
    placeId: (result.place_id as string | undefined) ?? null,
    locationType: (result.geometry.location_type as string | undefined) ?? null,
    resultTypes: (result.types as string[] | undefined) ?? [],
  };
}

function getApiKey() {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  if (!apiKey || apiKey === 'your-google-maps-api-key') {
    throw new Error('Google Maps API key not configured. Set NEXT_PUBLIC_GOOGLE_MAPS_API_KEY in .env.local');
  }
  return apiKey;
}

async function geocodePlaceId(placeId: string) {
  const apiKey = getApiKey();
  const url = `https://maps.googleapis.com/maps/api/geocode/json?place_id=${encodeURIComponent(placeId)}&key=${apiKey}`;
  const res = await fetch(url);
  const data = await res.json();

  if (data.status !== 'OK' || !data.results?.length) {
    console.warn('[geocode] place_id lookup failed:', data.status, data.error_message ?? '', '| place_id:', placeId);
    return null;
  }
  return extractResult(data.results[0]);
}

async function geocodeAddress(address: string) {
  const apiKey = getApiKey();
  const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${apiKey}`;
  const res = await fetch(url);
  const data = await res.json();

  if (data.status !== 'OK' || !data.results?.length) {
    console.warn('[geocode] address lookup failed:', data.status, data.error_message ?? '', '| address:', address);
    return null;
  }
  return extractResult(data.results[0]);
}

/** POST /api/geocode  body: { address } or { placeId } */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { address, placeId } = body;

    if (!address && !placeId) {
      return NextResponse.json({ error: 'address or placeId is required' }, { status: 400 });
    }

    const result = placeId
      ? await geocodePlaceId(placeId)
      : await geocodeAddress(address);

    if (!result) return NextResponse.json({ error: 'Address not found' }, { status: 404 });
    return NextResponse.json(result);
  } catch (error: unknown) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}

/** GET /api/geocode?address=...  OR  /api/geocode?place_id=... */
export async function GET(req: NextRequest) {
  try {
    const params = new URL(req.url).searchParams;
    const placeId = params.get('place_id');
    const address = params.get('address');

    if (!placeId && !address) {
      return NextResponse.json({ error: 'place_id or address query param is required' }, { status: 400 });
    }

    const result = placeId
      ? await geocodePlaceId(placeId)
      : await geocodeAddress(address!);

    if (!result) return NextResponse.json({ error: 'Address not found' }, { status: 404 });
    return NextResponse.json(result);
  } catch (error: unknown) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
