import React from 'react';
import { createRoot } from 'react-dom/client';
import SharePage from '../components/share-page';
import { createCompanyAnalytics } from '../lib/company-analytics';
import logo from '../public/airweave-logo.png?inline';
import '../app/globals.css';
let storage: Storage | undefined;
try { storage = window.sessionStorage; } catch { /* Local/private browser. */ }
const analytics = createCompanyAnalytics(window as unknown as Parameters<typeof createCompanyAnalytics>[0], storage);
createRoot(document.getElementById('root')!).render(<SharePage analytics={analytics} logoSrc={logo} assetBase={window.location.pathname} />);
