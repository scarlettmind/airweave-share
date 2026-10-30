// Default: publish events to the company's existing GTM dataLayer.
// This file does NOT install Google scripts or grant tracking consent.
// Digital must install/configure its approved Google tag/GTM and CMP.
window.AIRWEAVE_ANALYTICS = { mode: 'dataLayer' };
// For an existing direct Google tag instead:
// window.AIRWEAVE_ANALYTICS = { mode: 'gtag', measurementId: 'G-YOUR_REAL_ID' };
