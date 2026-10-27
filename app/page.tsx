'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { ArrowUpRight, ArrowLeft, Copy, Check, Globe2, MapPin, Camera, Images, Share2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { tags, storeNames, languageNames, platforms, platformNames, platformUrl, storeId, validatePhotos, type Language, type PlatformId } from '@/lib/share-config';
import { copyText } from '@/lib/share-text';
import { writeHashtags } from '@/lib/share-copy';
import { recordScan } from '@/lib/share-analytics';

type CopyState = 'idle' | 'pending' | 'copied' | 'blocked';
type ShareState = 'idle' | 'unsupported' | 'cancelled' | 'shared' | 'shareFailed' | 'noPhotos';
const icons: Record<PlatformId, [string, string]> = { red: ['red', '小红书'], dianping: ['orange', '点评'], instagram: ['pink', '◎'], tiktok: ['black', '♪'], x: ['black', '𝕏'] };

function PhotoPreview({ file, index, lang, onRemove }: { file: File; index: number; lang: Language; onRemove: () => void }) {
  const [url, setUrl] = useState('');
  const [failed, setFailed] = useState(false);
  useEffect(() => { const next = URL.createObjectURL(file); setUrl(next); return () => URL.revokeObjectURL(next); }, [file]);
  return <div className="photo-preview">
    {url && !failed ? <img src={url} alt={`${copyText[lang].preview} ${index + 1}`} onError={() => setFailed(true)} /> : <span>{copyText[lang].previewFailed}</span>}
    <Button variant="outline" size="icon" className="remove-photo" aria-label={`${copyText[lang].remove} ${index + 1}`} onClick={onRemove}><X /></Button>
  </div>;
}

export default function Home() {
  const [lang, setLang] = useState<Language | null>(null);
  const [selected, setSelected] = useState<PlatformId | null>(null);
  const [copyState, setCopyState] = useState<CopyState>('idle');
  const [store, setStore] = useState('unassigned');
  const [photos, setPhotos] = useState<File[]>([]);
  const [photoError, setPhotoError] = useState<'type' | 'size' | 'count' | null>(null);
  const [shareState, setShareState] = useState<ShareState>('idle');
  const [sharing, setSharing] = useState(false);
  const [opening, setOpening] = useState(false);
  const [manualOpen, setManualOpen] = useState(false);
  const [fileSharingSupported, setFileSharingSupported] = useState(false);
  const copyAttempt = useRef(0);
  const sharingLock = useRef(false);
  const album = useRef<HTMLInputElement>(null);
  const camera = useRef<HTMLInputElement>(null);
  const t = copyText[lang ?? 'en'];
  const currentName = selected ? platformNames[selected] : '';
  const withPlatform = (value: string) => value.replace('{platform}', currentName);

  useEffect(() => {
    const sourceStore = storeId(location.search);
    setStore(sourceStore);
    void recordScan(sourceStore);
    setFileSharingSupported(typeof navigator.share === 'function' && typeof navigator.canShare === 'function');
  }, []);
  useEffect(() => { document.documentElement.lang = lang === 'zh' ? 'zh-CN' : lang ?? 'en'; }, [lang]);

  const copy = useCallback(async (language: Language, gesture = true) => {
    const attempt = ++copyAttempt.current;
    setCopyState('pending');
    const success = await writeHashtags(tags[language], gesture);
    if (attempt === copyAttempt.current) setCopyState(success ? 'copied' : 'blocked');
    return success;
  }, []);

  useEffect(() => {
    if (!lang || !selected) return;
    // Restored pages can retain old React state. Invalidate old success and retry
    // when returning from an app or the browser's back/forward cache.
    const visible = () => { if (document.visibilityState === 'visible') { setOpening(false); void copy(lang, false); } else { ++copyAttempt.current; setCopyState('idle'); } };
    const restored = () => { setOpening(false); void copy(lang, false); };
    document.addEventListener('visibilitychange', visible);
    window.addEventListener('pageshow', restored);
    return () => { document.removeEventListener('visibilitychange', visible); window.removeEventListener('pageshow', restored); };
  }, [lang, selected, copy]);

  function track(event: 'language' | 'platform', language: Language, platform: string = '') {
    void fetch('/api/events', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ event, language, platform, store: storeId(location.search) }), keepalive: true }).catch(() => {});
  }
  function chooseLanguage(language: Language) {
    // Language and platform buttons both provide a fresh browser user gesture.
    void copy(language);
    setLang(language); setSelected(null); setManualOpen(false);
    track('language', language);
  }
  function choosePlatform(platform: PlatformId) {
    if (!lang) return;
    void copy(lang);
    setSelected(platform); setShareState('idle'); setManualOpen(false);
    track('platform', lang, platformNames[platform]);
  }
  function back() {
    ++copyAttempt.current; setCopyState('idle'); setShareState('idle'); setManualOpen(false);
    if (selected) setSelected(null); else setLang(null);
  }
  function pickPhotos(list: FileList | null) {
    if (!list?.length) return; // Cancelling the picker keeps the current photos.
    const next = Array.from(list);
    const problem = validatePhotos(next);
    setPhotoError(problem);
    if (problem) return;
    setPhotos(next); setShareState('idle');
    if (lang) void copy(lang);
  }
  async function openPlatform() {
    if (!lang || !selected || opening) return;
    setOpening(true);
    const success = await copy(lang);
    setOpening(false);
    if (!success) { setManualOpen(true); return; }
    // Same-tab navigation avoids asynchronous popup blocking.
    location.assign(platformUrl(selected, lang));
  }
  async function sharePhotos() {
    if (!lang || sharingLock.current) return;
    if (!photos.length) { setShareState('noPhotos'); return; }
    const data: ShareData = { files: photos };
    try {
      if (!navigator.share || !navigator.canShare?.(data)) { setShareState('unsupported'); return; }
    } catch { setShareState('unsupported'); return; }
    sharingLock.current = true; setSharing(true); setShareState('idle');
    // Do not await clipboard work before share(): native sharing needs this click's
    // transient activation. Files-only sharing offers the widest image-app support.
    void copy(lang);
    try { await navigator.share(data); setShareState('shared'); }
    catch (error) { setShareState(error instanceof Error && error.name === 'AbortError' ? 'cancelled' : 'shareFailed'); }
    finally { sharingLock.current = false; setSharing(false); }
  }

  return <div className="site">
    <header><a className="brand-logo" href={store === 'unassigned' ? '/' : '/?store=' + encodeURIComponent(store)} aria-label="airweave"><img src="/airweave-logo.png" alt="airweave" width={802} height={678} /></a><span className="header-note">{t.tagline}</span></header>
    <main className={lang ? 'sharing-main' : 'welcome-main'}>
      <div className="eyebrow">{t.eyebrow}</div>
      {!lang ? <>
        <h1>Share your<br /><em>airweave experience.</em></h1>
        <p className="subtitle">Choose your language</p>
        <div className="languages">{(['zh', 'en', 'ja'] as const).map(language => <button key={language} className="language" lang={language === 'zh' ? 'zh-CN' : language} onClick={() => chooseLanguage(language)}>
          <span className="flag" aria-hidden="true">{language === 'zh' ? '🇨🇳' : language === 'ja' ? '🇯🇵' : <Globe2 size={30} />}</span>
          <span className="language-text"><strong>{languageNames[language]}</strong><small>{language === 'zh' ? '小红书 · 大众点评' : 'Instagram · TikTok · X'}</small></span><ArrowUpRight />
        </button>)}</div>
      </> : <>
        <button className="back" onClick={back}><ArrowLeft size={16} />{selected ? t.back : '中文 / English / 日本語'}</button>
        <h1>{t.title}<br /><em>{t.titleEnd}</em></h1>
        <p className="subtitle">{selected ? currentName : t.choose}</p>
        {!selected ? <div className="platforms">{platforms[lang].map(platform => <button key={platform} onClick={() => choosePlatform(platform)} className="platform">
          <span aria-hidden="true" className={'platform-icon ' + icons[platform][0]}>{icons[platform][1]}</span>
          <span><strong>{platformNames[platform]}</strong><small>{t.descriptors[platform]}</small></span><ArrowUpRight />
        </button>)}</div> : <div className="share-panel">
          <div className={'copy-banner ' + (copyState === 'copied' ? 'copy-success' : 'copy-attention')} role="status" aria-live="polite">
            {copyState === 'copied' ? <Check size={28} /> : <Copy size={28} />}
            <div><strong>{copyState === 'copied' ? t.copied : copyState === 'pending' ? t.pending : t.blocked}</strong><p>{copyState === 'copied' ? t.copiedDetail : t.blockedDetail}</p></div>
          </div>
          <p className="hashtags" tabIndex={0}>{tags[lang]}</p>
          <Button variant="outline" className="copy-button" onClick={() => void copy(lang)}><Copy />{copyState === 'copied' ? t.recopy : t.copy}</Button>
          <p className="guidance">{selected === 'dianping' ? t.review : t.story}</p>
          <section className="photo-section" aria-labelledby="photo-title">
            <h2 id="photo-title">{t.photos}</h2><p>{t.photoHint}</p>
            <div className="photo-actions">
              <Button variant="outline" onClick={() => album.current?.click()}><Images />{t.album}</Button>
              <Button variant="outline" onClick={() => camera.current?.click()}><Camera />{t.camera}</Button>
            </div>
            <input ref={album} type="file" accept="image/jpeg,image/png,image/webp,image/heic,image/heif" multiple hidden tabIndex={-1} aria-label={t.album} onChange={e => { pickPhotos(e.target.files); e.target.value = ''; }} />
            <input ref={camera} type="file" accept="image/*" capture="environment" hidden tabIndex={-1} aria-label={t.camera} onChange={e => { pickPhotos(e.target.files); e.target.value = ''; }} />
            {photoError && <p className="flow-message" role="alert">{photoError === 'type' ? t.typeError : photoError === 'size' ? t.sizeError : t.countError}</p>}
            {photos.length > 0 && <div className="photo-grid">{photos.map((file, index) => <PhotoPreview key={`${file.name}-${file.lastModified}-${index}`} file={file} index={index} lang={lang} onRemove={() => { setPhotos(photos.filter((_, i) => i !== index)); setShareState('idle'); }} />)}</div>}
            <small className="photo-local">{t.local}</small>
            <Button className="share-photos" disabled={sharing} onClick={sharePhotos}><Share2 />{sharing ? t.sharing : t.share}</Button>
            <p className="share-hint">{withPlatform(t.shareHint)}</p>
            {!fileSharingSupported && <p className="flow-message">{t.unsupported}</p>}
            {shareState !== 'idle' && <p className="flow-message" role="status">{t[shareState]}</p>}
          </section>
          <Button className="open-platform" variant="outline" disabled={opening} onClick={openPlatform}>{opening ? t.pending : selected === 'x' ? t.xOpen : withPlatform(t.open)}<ArrowUpRight size={18} /></Button>
          {manualOpen && <a className="manual-open" href={platformUrl(selected, lang)}>{withPlatform(t.continue)}<ArrowUpRight size={16} /></a>}
          <small className="manual">{t.fallback}</small>
        </div>}
      </>}
      {store !== 'unassigned' && <div className="store"><MapPin size={13} />{storeNames[store] ?? store}</div>}
    </main><footer><span>{t.footer}</span><span>airweave</span></footer>
  </div>;
}
