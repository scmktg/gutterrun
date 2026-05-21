// Suburb route definitions and date/spot computation.
//
// Persistence: bookings are appended to a JSON file on disk. This works in
// dev and with the @astrojs/node adapter. For serverless deploys (Vercel,
// Cloudflare Pages), swap `loadBookings` / `appendBooking` for a real
// backend (Airtable, Supabase, KV, D1, etc.) — the rest of the module is
// adapter-agnostic.

import fs from 'node:fs/promises';
import path from 'node:path';

export type SuburbSlug = 'tuggerah' | 'wyong' | 'the-entrance';

export interface Suburb {
  slug: SuburbSlug;
  name: string;
  dayLabel: string;   // e.g. "MONDAYS"
  dayOfWeek: number;  // 1 = Mon, 2 = Tue, 3 = Wed
}

export interface AvailableDate {
  iso: string;         // e.g. "2026-05-25"
  label: string;       // e.g. "Mon 25 May"
  spotsLeft: number;   // 0..5
}

export interface SuburbAvailability extends Suburb {
  dates: AvailableDate[];
  next: AvailableDate | null;
}

export interface Booking {
  name: string;
  address: string;
  suburb: SuburbSlug;
  date: string;        // ISO yyyy-mm-dd
  phone: string;
  createdAt: string;   // ISO timestamp
}

export const DAILY_CAP = 5;
export const PRICE_AUD = 175;
export const WEEKS_AHEAD = 4;

export const SUBURBS: Suburb[] = [
  { slug: 'tuggerah',     name: 'Tuggerah',     dayLabel: 'MONDAYS',    dayOfWeek: 1 },
  { slug: 'wyong',        name: 'Wyong',        dayLabel: 'TUESDAYS',   dayOfWeek: 2 },
  { slug: 'the-entrance', name: 'The Entrance', dayLabel: 'WEDNESDAYS', dayOfWeek: 3 },
];

const BOOKINGS_FILE = path.resolve(process.cwd(), 'src/data/bookings.json');

async function loadBookings(): Promise<Booking[]> {
  try {
    const raw = await fs.readFile(BOOKINGS_FILE, 'utf-8');
    return JSON.parse(raw) as Booking[];
  } catch (err: any) {
    if (err?.code === 'ENOENT') return [];
    throw err;
  }
}

export async function appendBooking(b: Booking): Promise<void> {
  const existing = await loadBookings();
  existing.push(b);
  await fs.mkdir(path.dirname(BOOKINGS_FILE), { recursive: true });
  await fs.writeFile(BOOKINGS_FILE, JSON.stringify(existing, null, 2), 'utf-8');
}

function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

// Next N occurrences of `dayOfWeek` (1..6) from today (inclusive if today matches).
function nextDatesForDay(dayOfWeek: number, weeks: number, from = new Date()): Date[] {
  const today = startOfDay(from);
  const diff = (dayOfWeek - today.getDay() + 7) % 7;
  const first = new Date(today);
  first.setDate(today.getDate() + diff);
  return Array.from({ length: weeks }, (_, i) => {
    const d = new Date(first);
    d.setDate(first.getDate() + i * 7);
    return d;
  });
}

function formatLabel(d: Date): string {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${days[d.getDay()]} ${d.getDate()} ${months[d.getMonth()]}`;
}

function isoDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export async function getAvailability(now = new Date()): Promise<SuburbAvailability[]> {
  const bookings = await loadBookings();
  const counts = new Map<string, number>();
  for (const b of bookings) {
    const key = `${b.suburb}|${b.date}`;
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  return SUBURBS.map((s) => {
    const dates: AvailableDate[] = nextDatesForDay(s.dayOfWeek, WEEKS_AHEAD, now).map((d) => {
      const iso = isoDate(d);
      const used = counts.get(`${s.slug}|${iso}`) ?? 0;
      return { iso, label: formatLabel(d), spotsLeft: Math.max(0, DAILY_CAP - used) };
    });
    const next = dates.find((d) => d.spotsLeft > 0) ?? null;
    return { ...s, dates, next };
  });
}

export function findSuburb(slug: string): Suburb | undefined {
  return SUBURBS.find((s) => s.slug === slug);
}
