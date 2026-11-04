# Single HTML delivery / 単一HTML版

Run `npm run build:single`. Upload `dist-single/index.html` alone to a static HTTPS host. All application JavaScript, CSS and the logo are embedded. No assets folder, database or build runtime is needed on the server. The existing multi-file release remains available but is not needed for this delivery.

単一HTML版では、index.html のみをアップロードしてください。JavaScript、CSS、ロゴ画像はすべてファイル内に含まれています。別の assets フォルダーは不要です。PCでの表示確認用として、通常のスクリプトを使用しています。本番運用はHTTPSをご利用ください。

The single HTML uses a classic IIFE script, not external ES modules, so it removes the previous file:// module-loading dependency. Automated local-file navigation was blocked by the testing tool security policy; direct double-click rendering remains unverified. HTTP browser testing passed for language selection, platform details, copy feedback and store-preserving home navigation. Mobile/native app sharing and clipboard behavior still depend on browser permissions and secure context; opening a local file is only for visual preview.

## Company analytics

The inline AIRWEAVE_ANALYTICS configuration defaults to dataLayer mode. Digital must insert its approved Google tag/GTM and consent setup in the marked head section and configure the events described in STATIC-DEPLOYMENT.md. The file does not send to the former database. Company GA4 receipt remains pending configuration/acceptance. A static host that strips scripts or prohibits inline scripts through CSP requires the web administrator to configure the approved deployment policy; do not disable security globally.

Store links remain supported, e.g. index.html?store=ginza-mitsukoshi. The logo returns to the current filename and keeps the store parameter.
