import type { ShareAnalytics } from './analytics-types';
export const COMPANY_SCAN_WINDOW_MS = 30 * 60 * 1000;
type AnalyticsHost = {
  dataLayer?: unknown[];
  gtag?: (...args: unknown[]) => void;
  AIRWEAVE_ANALYTICS?: { mode?: 'dataLayer' | 'gtag'; measurementId?: string };
};
export function createCompanyAnalytics(host: AnalyticsHost, storage?: Pick<Storage, 'getItem' | 'setItem'>, now = Date.now): ShareAnalytics {
  const memory = new Map<string, number>();
  const send = (event: string, store: string, language = '', platform = '') => {
    const params = { campaign_id: 'airweave_share', store_id: store, selected_language: language, platform };
    try {
      if (host.AIRWEAVE_ANALYTICS?.mode === 'gtag') {
        const id = host.AIRWEAVE_ANALYTICS.measurementId;
        if (!id || !/^G-[A-Z0-9]+$/.test(id) || typeof host.gtag !== 'function') return false;
        host.gtag('event', event, { ...params, send_to: id });
      } else {
        host.dataLayer = host.dataLayer || [];
        host.dataLayer.push({ event, ...params });
      }
      return true; // Queued only: not a confirmation that GA received the event.
    } catch { return false; }
  };
  return {
    scan(store) {
      const key = `airweave-ga4-scan:${store}`;
      const time = now();
      let previous = memory.get(key) ?? 0;
      try { previous = Number(storage?.getItem(key)) || previous; } catch { /* Memory dedup remains available. */ }
      if (previous > 0 && time >= previous && time - previous < COMPANY_SCAN_WINDOW_MS) return;
      if (send('qr_visit', store)) {
        memory.set(key, time);
        try { storage?.setItem(key, String(time)); } catch { /* Storage optional. */ }
      }
    },
    selection(event, language, platform, store) {
      const names: Record<string, string> = { '小红书': 'xiaohongshu', '大众点评': 'dianping', Instagram: 'instagram', TikTok: 'tiktok', X: 'x' };
      send(event === 'language' ? 'language_select' : 'platform_select', store, language, event === 'platform' ? (names[platform] ?? platform) : '');
    },
  };
}
