'use client';
import SharePage from '@/components/share-page';
import { recordScan } from '@/lib/share-analytics';
import type { ShareAnalytics } from '@/lib/analytics-types';
const legacyAnalytics: ShareAnalytics = {
  scan: store => { void recordScan(store); },
  selection: (event, language, platform, store) => {
    void fetch('/api/events', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ event, language, platform, store }), keepalive: true }).catch(() => {});
  },
};
// Existing hosted site remains active until Digital configures and accepts GA4.
export default function Home() { return <SharePage analytics={legacyAnalytics} />; }
