import type { APIRoute } from 'astro';
import { getAvailability } from '../../lib/availability';

export const prerender = false;

export const GET: APIRoute = async () => {
  return new Response(JSON.stringify({ availability: await getAvailability() }), {
    status: 200,
    headers: { 'content-type': 'application/json' },
  });
};
