import { rawDb } from '@/db';
import { validEvent } from '@/lib/share-config';

export async function POST(req: Request) {
  if (req.headers.get('origin') !== new URL(req.url).origin) return new Response(null, { status: 403 });
  let value: unknown;
  try { value = await req.json(); } catch { return new Response(null, { status: 400 }); }
  if (!validEvent(value)) return new Response(null, { status: 400 });
  try {
    await rawDb().prepare('INSERT INTO share_events (event,language,platform,store,created_at) VALUES (?,?,?,?,?)')
      .bind(value.event, value.language, value.platform, value.store, new Date().toISOString()).run();
    return new Response(null, { status: 204 });
  } catch (error) {
    console.error('Analytics write failed', error);
    return new Response(null, { status: 503 });
  }
}
