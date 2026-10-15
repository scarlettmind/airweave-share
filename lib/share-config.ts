export type Language = 'zh' | 'en' | 'ja';
export type PlatformId = 'red' | 'dianping' | 'instagram' | 'tiktok' | 'x';
export const tags: Record<Language, string> = {
  zh: '#爱维福 #airweave #日本旅行',
  en: '#airweave #SleepWell #JapanTravel',
  ja: '#エアウィーヴ #airweave #快眠 #日本旅行',
};
export const languageNames = { zh: '中文', en: 'English', ja: '日本語' };
export const platformNames: Record<PlatformId, string> = { red: '小红书', dianping: '大众点评', instagram: 'Instagram', tiktok: 'TikTok', x: 'X' };
export const platforms: Record<Language, PlatformId[]> = { zh: ['red', 'dianping'], en: ['instagram', 'tiktok', 'x'], ja: ['instagram', 'tiktok', 'x'] };
export function platformUrl(platform: PlatformId, language: Language) {
  if (platform === 'x') return 'https://x.com/intent/post?text=' + encodeURIComponent(tags[language]);
  return { red: 'https://www.xiaohongshu.com/', dianping: 'https://www.dianping.com/', instagram: 'https://www.instagram.com/', tiktok: 'https://www.tiktok.com/tiktokstudio' }[platform];
}
export function storeId(search: string) {
  const value = new URLSearchParams(search).get('store');
  return value && /^[a-zA-Z0-9_-]{1,80}$/.test(value) ? value : 'unassigned';
}
export function validEvent(value: unknown): value is { event: 'language' | 'platform'; language: Language; platform: string; store: string } {
  if (!value || typeof value !== 'object') return false;
  const b = value as Record<string, unknown>;
  if (typeof b.language !== 'string' || !Object.hasOwn(platforms, b.language) || typeof b.store !== 'string' || !/^[a-zA-Z0-9_-]{1,80}$/.test(b.store)) return false;
  if (b.event === 'language') return b.platform === '';
  return b.event === 'platform' && platforms[b.language as Language].some(id => platformNames[id] === b.platform);
}
export const MAX_PHOTOS = 9;
export function validatePhotos(files: File[]): 'type' | 'size' | 'count' | null {
  if (files.length > MAX_PHOTOS) return 'count';
  if (files.some(f => !/^image\/(jpeg|png|webp|heic|heif)$/i.test(f.type) && !(f.type === '' && /\.(jpe?g|png|webp|heic|heif)$/i.test(f.name)))) return 'type';
  if (files.some(f => f.size > 20 * 1024 * 1024) || files.reduce((sum, f) => sum + f.size, 0) > 60 * 1024 * 1024) return 'size';
  return null;
}
