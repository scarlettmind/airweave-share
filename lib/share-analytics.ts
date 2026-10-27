// A visit is one successful page-entry event per store and browser tab per
// 30-minute window. No cross-browser identity or personal data is collected.
const inFlight = new Map<string, Promise<void>>();
export const SCAN_WINDOW_MS = 30 * 60 * 1000;
export function recordScan(store: string): Promise<void> {
  const pending = inFlight.get(store);
  if (pending) return pending;
  const task = (async () => {
    const key = `airweave-scan:${store}`;
    const now = Date.now();
    try {
      const previous = Number(sessionStorage.getItem(key));
      if (previous > 0 && now >= previous && now - previous < SCAN_WINDOW_MS) return;
    } catch { /* Storage disabled: still record this page entry. */ }
    try {
      const response = await fetch('/api/events', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ event: 'scan', language: '', platform: '', store }), keepalive: true,
      });
      if (response.ok) {
        try { sessionStorage.setItem(key, String(now)); } catch { /* No persistent dedup available. */ }
      }
    } catch { /* Analytics failure must not block the sharing flow. */ }
  })();
  inFlight.set(store, task);
  void task.finally(() => { inFlight.delete(store); });
  return task;
}
