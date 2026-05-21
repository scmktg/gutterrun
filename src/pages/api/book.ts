import type { APIRoute } from 'astro';
import {
  appendBooking,
  findSuburb,
  getAvailability,
  type Booking,
  type SuburbSlug,
} from '../../lib/availability';

export const prerender = false;

const SUBURB_SLUGS: SuburbSlug[] = ['tuggerah', 'wyong', 'the-entrance'];

function bad(message: string, status = 400) {
  return new Response(JSON.stringify({ ok: false, error: message }), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

export const POST: APIRoute = async ({ request }) => {
  let body: any;
  try {
    body = await request.json();
  } catch {
    return bad('Invalid JSON.');
  }

  const name = String(body?.name ?? '').trim();
  const address = String(body?.address ?? '').trim();
  const suburb = String(body?.suburb ?? '').trim() as SuburbSlug;
  const date = String(body?.date ?? '').trim();
  const phone = String(body?.phone ?? '').trim();

  if (!name) return bad('Name is required.');
  if (!address) return bad('Address is required.');
  if (!SUBURB_SLUGS.includes(suburb)) return bad('Pick a suburb.');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return bad('Pick a date.');
  if (!/^[\d\s+()-]{6,}$/.test(phone)) return bad('A working phone number is required.');

  // Validate that the date is one we offer for that suburb, and has a spot.
  const availability = await getAvailability();
  const suburbAv = availability.find((s) => s.slug === suburb);
  if (!suburbAv) return bad('Pick a suburb.');
  const slot = suburbAv.dates.find((d) => d.iso === date);
  if (!slot) return bad("That date isn't a route day for this suburb.");
  if (slot.spotsLeft <= 0) return bad('That day is fully booked — pick another.');

  const meta = findSuburb(suburb)!;
  const booking: Booking = {
    name,
    address,
    suburb,
    date,
    phone,
    createdAt: new Date().toISOString(),
  };

  await appendBooking(booking);
  // TODO: also notify the operator (SMS via Twilio, email via Resend, etc.)

  return new Response(
    JSON.stringify({
      ok: true,
      booking: {
        name,
        suburb: meta.name,
        date,
        dateLabel: slot.label,
      },
      availability: await getAvailability(),
    }),
    { status: 200, headers: { 'content-type': 'application/json' } },
  );
};
