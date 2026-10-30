# Airweave static website — Digital team handoff

## Deliverable
Run `npm ci` and `npm run build:static`. Upload **the contents of dist-static/** to a static HTTPS directory, e.g. `https://www.example.com/airweave-share/`. No Node server, Worker, database, `/api/events` or `/admin` is required. JavaScript must be allowed. Use a trailing slash for a directory URL. Relative assets support subdirectory deployment.

The static build shares the same React UI as the existing site. The existing Cloudflare application remains on its legacy analytics until the company tracking configuration is accepted; deploying this ZIP does not update that site. The ZIP contains no access code or runtime secrets.

## Analytics setup — required before launch
The default `analytics-config.js` uses **dataLayer mode**. It queues events locally but does not install GTM, send data to GA by itself, or grant consent. A successful queue push does **not** prove receipt by GA.

1. Install the company's approved GTM container and consent/CMP integration in `index.html` using the company's standard snippets. A new standalone HTML file does not inherit tags installed on other company pages. Do not install a second Google tag if the page already has one.
2. Keep `window.AIRWEAVE_ANALYTICS = { mode: 'dataLayer' };`.
3. In GTM create one Custom Event trigger matching `^(qr_visit|language_select|platform_select)$` (regex enabled). Scope the GA4 Event tag to `campaign_id` = `airweave_share` if the container also handles similarly named events from other pages.
4. Use the company's Google tag/GA4 destination. Set Event Name to GTM's built-in `{{Event}}` variable. Add Data Layer Variables and event parameters with identical names: `campaign_id`, `store_id`, `selected_language`, `platform`.
5. In GA4 register event-scoped custom dimensions for these parameters. Do not confuse selected_language with GA's built-in device/browser Language dimension.
6. Apply company consent settings to the GA4 Event tag. This package does not override consent or install a consent banner. GTM/CMP must initialize consent before firing Google tags. The package's sessionStorage scan timestamp is subject to the company's storage policy; it does not contain a user ID. If CMP requires blocking all analytics code/storage before consent, initialize the React entry after the CMP grants permission, or have Digital adapt this gate. Do not assume the template is consent-certified.

### Alternative: existing direct gtag
If the company uses a direct Google tag instead of GTM, set:
```js
window.AIRWEAVE_ANALYTICS = { mode: 'gtag', measurementId: 'G-REALCOMPANYID' };
```
Install and initialize the approved Google tag and consent setup **before** the React module runs. The ID is public configuration, not an API secret. A missing/invalid ID or unavailable gtag disables emission without breaking the page. This mode sends to `send_to` explicitly. Choose one mode only; do not configure GTM to resend these same events when using direct gtag.

## Event contract
| Event | When | Parameters |
|---|---|---|
| qr_visit | Page entry; same tab/store deduplicated for 30 minutes | campaign_id=airweave_share; store_id; selected_language=''; platform='' |
| language_select | Each explicit language button click | selected_language=zh/en/ja; store_id; campaign_id; platform='' |
| platform_select | Each explicit platform selection button click | platform=xiaohongshu/dianping/instagram/tiktok/x; selected_language; store_id; campaign_id |

Scan dedup is based on **event queued**, not server delivery. Blocked tags, consent denial, ad blockers or network failure may prevent receipt; queued visits may remain deduplicated for 30 minutes. New tabs/devices may count again. A QR visit cannot be distinguished from someone manually opening the same URL. Repeated language/platform clicks count again. Platform selection does not prove app launch or a published post. Empty parameters intentionally prevent stale dataLayer values carrying over to another event. No photo, filename, clipboard text, email or personal identifier is sent by this event adapter.

Keep normal page_view measurement configured once in the company's tag; this adapter does not emit page_view. Do not add page_view to qr_visit to derive scans.

## Store URLs
Use the final company URL, adding:
- `?store=ginza-mitsukoshi`
- `?store=matsuya-ginza`
- `?store=osaka_shinsaibashi`
A shared QR with no parameter is `unassigned`. Preserve parameters during redirects. Recreate QR codes when changing the URL. Existing Cloudflare QR codes will continue to use the old hosted analytics; they do not become GA-tracked automatically.

## Acceptance checklist
- Upload into a nested directory; logo/CSS/JS load, refresh and logo link stay in that directory.
- Test Chinese, English and Japanese, all platform selections, hashtag copying and manual-copy fallback.
- Use GTM Preview/Tag Assistant to inspect the three events with the correct store/language/platform; check GA4 DebugView in the company property. **Local event tests are not GA collection verification.**
- Refresh: no second qr_visit within the same tab/store/30-minute window. Change store: a new qr_visit. Each selection click: one corresponding event.
- Test granted/denied consent and blocked analytics. Sharing UI must keep working.
- Check that no requests go to the old `/api/events` or old analytics domain.
- Validate the uploaded page on HTTPS mobile browsers; native photo sharing remains device-dependent.
- Historical database records do not automatically appear in GA4; preserve the existing dashboard/export separately.

## References
- https://developers.google.com/tag-platform/devguides/datalayer
- https://developers.google.com/analytics/devguides/collection/ga4/events
- https://developers.google.com/tag-platform/security/guides/consent
