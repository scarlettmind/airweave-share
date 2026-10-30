import type { Language } from './share-config';
export interface ShareAnalytics {
  scan(store: string): void;
  selection(event: 'language' | 'platform', language: Language, platform: string, store: string): void;
}
