# Admin UI review — November 2, 2026

Reviewed the local admin app using Impeccable's existing-product polish and accessibility guidance.

Scope: dashboard, riders, customers, trips, reports, login, and one detail page for each record type. Authenticated pages used live read-only data.

## Fixed

- Phone layouts pushed the page wider than the viewport. Navigation now adapts to the screen, all navigation destinations remain visible, and wide tables scroll inside their cards.
- Long record IDs, email addresses, and verification images could overflow detail cards.
- The on-trip badge's light-mode contrast was 4.23:1. It now uses a readable emerald background/text pair. Timeline arrows also use a readable foreground.
- Search fields, filters, and report-edit controls lacked associated accessible labels.
- Keyboard users now have a skip-to-content link, consistent focus indicators, and the current navigation item marked explicitly.
- Login and rider-status buttons show pending states. Rider updates prevent duplicate submissions; failed report saves preserve drafts and announce errors.
- Pie-chart labels crowded or clipped at small sizes. Percentages now appear in the legend; charts no longer animate on every refresh.
- The Active Riders metric now counts only riders with active status.

## Verification

- 60 browser combinations: 10 page types × light/dark × 320px/390px/1440px widths.
- No page-level horizontal overflow, unlabelled visible form controls, or sampled text-contrast failures.
- Minimum sampled rendered text contrast: 5.45:1.
- Keyboard skip-link focus and rider search empty/clear recovery passed in both themes.
- Four regression tests pass, including action failure, retry, draft preservation, refresh, and database-read behavior.
- Production build and lint pass.

Action failures were exercised with mocked requests. This is a local Chromium review, not a formal screen-reader or cross-browser accessibility certification.

Deployment status: local changes only; the deployed admin app still needs updating.


## Riders and Settings update — 18 November 2026

The existing Google account had a pending backend rider profile with vehicle and ID information at the first check. A later authenticated API read showed it active, with an approval audit from the owner account. The hosted rider page was displaying the legacy collection instead. The deployment connection must use `RIDE_BACKEND_URL` and, for password-only recovery, `BACKEND_OWNER_UID`; no rider record or approval was changed during diagnosis.

Added status shortcuts with counts and combined search, email beneath each rider's name, and newest-first backend listings. Filter state is retained when new rider data refreshes. Removed Settings' separate color palette/background, decorative SVGs/avatars, redundant page descriptions and navigation metadata. It now inherits the same theme and card treatment as Riders/Customers; category drafts, validation, permissions, save reasons and history remain intact.

Validation: 21 admin tests passed, including status/search/clear/refresh behavior and ordering of new pending backend signups. TypeScript, ESLint and the Next production build passed. A read-only synthetic preview was generated from the actual components; native screenshot capture was intermittent, so a full responsive visual acceptance pass remains to be confirmed after deployment.
