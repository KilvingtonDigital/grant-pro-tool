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

async function geocodeAddress(address: string) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  if (!apiKey || apiKey === 'your-google-maps-api-key') {
    throw new Error('Google Maps API key not configured. Set NEXT_PUBLIC_GOOGLE_MAPS_API_KEY in .env.local');
  }

  const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${apiKey}`;
  const res = await fetch(url);
  const data = await res.json();

  if (data.status !== 'OK' || !data.results?.length) {
    return null;
  }

  const result = data.results[0];
  const { lat, lng } = result.geometry.location;
  const formattedAddress = result.formatted_address;
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

/** POST /api/geocode */
export async function POST(req: NextRequest) {
  try {
    const { address } = await req.json();
    if (!address) return NextResponse.json({ error: 'address is required' }, { status: 400 });
    const result = await geocodeAddress(address);
    if (!result) return NextResponse.json({ error: 'Address not found' }, { status: 404 });
    return NextResponse.json(result);
  } catch (error: unknown) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}

/** GET /api/geocode?address=... */
export async function GET(req: NextRequest) {
  try {
    const address = new URL(req.url).searchParams.get('address');
    if (!address) return NextResponse.json({ error: 'address query param is required' }, { status: 400 });
    const result = await geocodeAddress(address);
    if (!result) return NextResponse.json({ error: 'Address not found' }, { status: 404 });
    return NextResponse.json(result);
  } catch (error: unknown) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
