import React from 'react';
import { createRoot } from 'react-dom/client';
import SharePage from '../components/share-page';
import { createCompanyAnalytics } from '../lib/company-analytics';
import '../app/globals.css';
let storage: Storage | undefined;
try { storage = window.sessionStorage; } catch { /* Private/restricted browser. */ }
const analytics = createCompanyAnalytics(window as unknown as Parameters<typeof createCompanyAnalytics>[0], storage);
createRoot(document.getElementById('root')!).render(<SharePage analytics={analytics} assetBase="./" />);
