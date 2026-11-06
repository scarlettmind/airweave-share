'use client';

import { useState, useEffect, useRef } from 'react';
import { ArrowUpRight, ArrowLeft, Copy, Globe2, MapPin } from 'lucide-react';
import { tags, storeNames, languageNames, platforms, platformNames, platformUrl, storeId, type Language, type PlatformId } from '@/lib/share-config';
import { writeHashtags } from '@/lib/share-copy';
import type { ShareAnalytics } from '@/lib/analytics-types';

type CopyState = 'idle' | 'pending' | 'copied' | 'blocked';
const icons: Record<PlatformId, [string, string]> = { red: ['red', '小红书'], dianping: ['orange', '点评'], instagram: ['pink', '◎'], tiktok: ['black', '♪'], x: ['black', '𝕏'] };
const labels = {
  zh: { choose: '选择平台', pending: '正在复制…', copied: '标签已复制，直接粘贴即可', blocked: '复制失败，请长按下方标签复制', copy: '再次复制', open: '重新打开', fallback: '未跳转？请手动打开 App。' },
  en: { choose: 'Choose a platform', pending: 'Copying…', copied: 'Hashtags copied. Just paste.', blocked: 'Copy failed. Press and hold the hashtags to copy.', copy: 'Copy again', open: 'Open again', fallback: 'Didn’t open? Launch the app.' },
  ja: { choose: '投稿先を選ぶ', pending: 'コピー中…', copied: 'コピーしました。そのまま貼り付け', blocked: 'コピーできませんでした。タグを長押ししてコピーしてください。', copy: '再コピー', open: 'もう一度開く', fallback: '開かない場合は、アプリを手動で開いてください。' },
};

export default function SharePage({ analytics, assetBase = '/', logoSrc }: { analytics: ShareAnalytics; assetBase?: string; logoSrc?: string }) {
  const [lang, setLang] = useState<Language | null>(null);
  const [selected, setSelected] = useState<PlatformId | null>(null);
  const [copyState, setCopyState] = useState<CopyState>('idle');
  const [store, setStore] = useState('unassigned');
  const busy = useRef(false);
  const attempt = useRef(0);
  const t = labels[lang ?? 'en'];

  useEffect(() => {
    const sourceStore = storeId(location.search);
    setStore(sourceStore);
    analytics.scan(sourceStore);
  }, [analytics]);
  useEffect(() => { document.documentElement.lang = lang === 'zh' ? 'zh-CN' : lang ?? 'en'; }, [lang]);

  async function copy(language: Language) {
    const current = ++attempt.current;
    setCopyState('pending');
    const success = await writeHashtags(tags[language], true);
    if (current !== attempt.current) return false;
    setCopyState(success ? 'copied' : 'blocked');
    return success;
  }
  function chooseLanguage(language: Language) {
    setLang(language);
    setSelected(null);
    setCopyState('idle');
    analytics.selection('language', language, '', storeId(location.search));
  }
  async function choosePlatform(platform: PlatformId) {
    if (!lang || busy.current) return;
    busy.current = true;
    setSelected(platform);
    const copying = copy(lang);
    analytics.selection('platform', lang, platformNames[platform], storeId(location.search));
    try {
      if (await copying) location.assign(platformUrl(platform, lang));
    } finally { busy.current = false; }
  }
  function back() {
    ++attempt.current;
    busy.current = false;
    setCopyState('idle');
    setSelected(null);
    setLang(null);
  }

  return <div className="site">
    <header><a className="brand-logo" href={assetBase + (store === 'unassigned' ? '' : '?store=' + encodeURIComponent(store))} aria-label="airweave"><img src={logoSrc ?? assetBase + 'airweave-logo.png'} alt="airweave" width={802} height={678} /></a></header>
    <main className={lang ? 'sharing-main' : 'welcome-main'}>
      {!lang ? <>
        <h1>Share your<br /><em>airweave experience.</em></h1>
        <p className="subtitle">Choose your language</p>
        <div className="languages">{(['zh', 'en', 'ja'] as const).map(language => <button key={language} className="language" lang={language === 'zh' ? 'zh-CN' : language} onClick={() => chooseLanguage(language)}>
          <span className="flag" aria-hidden="true">{language === 'zh' ? '🇨🇳' : language === 'ja' ? '🇯🇵' : <Globe2 size={30} />}</span>
          <span className="language-text"><strong>{languageNames[language]}</strong><small>{language === 'zh' ? '小红书 · 大众点评' : 'Instagram · TikTok · X'}</small></span><ArrowUpRight />
        </button>)}</div>
      </> : <>
        <button className="back" onClick={back}><ArrowLeft size={16} />中文 / English / 日本語</button>
        <h1>{t.choose}</h1>
        <div className="platforms">{platforms[lang].map(platform => <button key={platform} disabled={copyState === 'pending'} onClick={() => void choosePlatform(platform)} className="platform">
          <span aria-hidden="true" className={'platform-icon ' + icons[platform][0]}>{icons[platform][1]}</span>
          <span><strong>{platformNames[platform]}</strong></span><ArrowUpRight />
        </button>)}</div>
        {selected && <div className="share-panel">
          <div className={'copy-banner ' + (copyState === 'copied' ? 'copy-success' : 'copy-attention')} role="status" aria-live="polite"><strong>{copyState === 'copied' ? t.copied : copyState === 'pending' ? t.pending : t.blocked}</strong></div>
          <p className="hashtags" tabIndex={0}>{tags[lang]}</p>
          <button className="copy-button" disabled={copyState === 'pending'} onClick={() => void copy(lang)}><Copy size={16} /> {t.copy}</button>
          <a className="manual-open" href={platformUrl(selected, lang)}>{t.open} {platformNames[selected]}<ArrowUpRight size={16} /></a>
          <small className="manual">{t.fallback}</small>
        </div>}
      </>}
      {store !== 'unassigned' && <div className="store"><MapPin size={13} />{storeNames[store] ?? store}</div>}
    </main>
  </div>;
}
