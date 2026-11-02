# Platform settings

> **Security correction:** `config/database.rules.json` is an interim settings
> isolation ruleset, not a complete production security fix. It still allows
> anonymous reads/writes on the legacy application nodes. The earlier rollout
> instruction to publish it must not be treated as resolving Firebase's insecure
> rules warning. A coordinated ownership/role-based rules and backend migration
> is required before relying on this database for protected production data.

Implemented 2 November 2026. Source changes are local; no production settings,
users, Auth claims or database rules were changed during implementation.

## Controls and consumers

| Controls | Effect |
| --- | --- |
| Vehicle pricing | Minimum fare, naira per kilometre and per minute for Tricycle and Motorcycle. Both apps finish a ride using its saved pricing snapshot. |
| Matching | Search radius around the selected pickup, total request timeout, additional searches and retry interval. Retries notify newly eligible riders once per request. |
| Service | Maximum driving distance; optional named circular service areas; operating days and opening/closing times in Lagos/WAT. Overnight hours belong to the opening day. |
| Verification | Allowed vehicle types; require vehicle model/number/colour; require an ID photo. Admin activation remains mandatory. Checks run during activation, online entry and candidate selection. |
| Rewards | Enable new referrals, inviter reward, welcome voucher, voucher percentage and naira cap. A zero naira cap means no extra cap; zero percent stops voucher redemption. Existing balances are retained when referrals are paused. |
| Operations | Booking pause, maintenance message/mode, support phone and email. Contact support opens configured phone/email actions in both apps. |
| Access | Owner manages settings and staff; operator manages riders/reports; viewer reads only. Permissions are checked in server actions and against current Firebase Auth claims on every request. |
| History | Atomic settings revisions with actor, time, reason and before/after JSON values. Latest 30 revisions shown; complete history retained. Staff access attempts have requested/applied/failed outcomes. |

Original defaults remain in place until an owner saves settings. No service areas
or operating-hour restrictions are enabled by default. Referral amounts are ₦500,
matching is 45 seconds / 5 km with no retries, maximum trip distance is 30 km.

Settings live at `platformControl/current`; history lives at
`platformControl/history`. Settings are public to read, never writable from an
app. History and `adminAccessHistory` are server-only. Staff passwords are held
by Firebase Authentication, never by the realtime database or audit history.
Staff session versions rotate on role/access changes, revoking existing admin
cookies immediately. The existing owner password remains the recovery login
(leave staff email blank). Staff passwords must contain 12–128 characters.

New requests capture `settingsRevision`, `pricingPolicy`, `voucherPolicy` and
`searchTimeoutSeconds`. Database rules reject newly created requests while
bookings are paused or maintenance is on, reject mismatched policies/revisions,
and keep the saved pricing/voucher policies immutable on subsequent updates.
Existing rides can finish while bookings are paused. Old rides without a policy
use the original fares and full-balance voucher rules, not the latest settings.
New referral registrations capture their promised inviter reward; later settings
changes do not alter that promise.

Both apps fetch public settings over HTTPS before a new booking or online entry.
A failed fetch blocks that action. REST is intentional: the Firebase SDK may
return cached data while offline. If the fare changed since the displayed quote,
the customer sees the updated fare and must request again.

## Rollout

The current production rules were read, not changed. They grant root read/write
access, so publishing settings there would allow clients to overwrite them.
The admin therefore refuses settings/staff mutations until the protected rules
and new-request policy validation are installed.

1. Build/deploy the admin with the existing server-only service-account credential,
   `ADMIN_PASSWORD`, `ADMIN_COOKIE_SECRET`, Firebase API key and database URL.
   `FIREBASE_DATABASE_URL` is the server override; the existing
   `NEXT_PUBLIC_FIREBASE_DATABASE_URL` remains a fallback. Firebase Email/Password
   sign-in must be enabled for staff login.
2. Distribute **both 1.0.5+6 APKs before publishing the first settings revision**.
   Earlier apps do not understand these settings. Once settings are published,
   database rules require policy snapshots on all new requests, so old apps must
   update to book. Existing requests can continue to update their status.
3. Replace the interim `config/database.rules.json` with fully restricted rules
   and test them against the app flows before production deployment. The interim
   file is insufficient to resolve the insecure-data exposure.
   It removes root access and explicitly preserves the seven known legacy nodes
   (`users`, `riders`, `reports`, `All Ride Requests`, `referrals`, `referralCodes`,
   `activeRiders`), including the Geofire index. Unknown root paths become denied.
   The current production node names were checked before preparing this file.
   Export the live rules first and retain them for rollback. Apply the reviewed
   JSON using the Firebase console or the project's existing rules deployment.
4. Sign in as owner, open Settings, review values, enter a reason and save. No
   defaults were seeded in production. Add staff with separate staff email
   addresses; existing customer/rider Auth accounts are not promoted.
5. Test one new request end to end with the new apps. Confirm the saved revision
   and policies, pause new bookings, finish an existing ride, then resume bookings.

Security boundaries: this migration protects configuration, audit data and new
ride policy snapshots. It deliberately preserves the legacy nodes' existing
access model. Operating-hour/zone/distance checks and dispatch selection run in
the updated apps; they are not an authoritative server-side dispatch engine.
The existing client-side wallet/referral settlement and bundled FCM credential
need a separate server migration and credential rotation before treating the
whole ride/payment system as hardened. No credential values are included here.

Settings history grows within the atomic settings transaction. Archive old audit
entries when that node becomes large. Staff listing scans Firebase Auth users;
use a staff index if account volume makes that slow.

## Validation

- `npm test`: 13 tests, including validation, signed session expiry, role checks,
  session revocation, stale/cold-cache saves, audit history and rules guards.
- `npm run lint`; `npm run build`: passed.
- `node scripts/check-settings-emulator.cjs`: local-only integration test. It
  forces demo database/Auth endpoints, resets **only local emulator data**, and
  checks actual competing transactions, protected reads/writes, booking pauses,
  immutable fare/voucher policies and staff Auth lifecycle.
- Browser: saves, stale-edit error/draft preservation, area add/remove, staff
  creation/login, operator/viewer access, role-change revocation and disabling
  passed against local emulators. Recovery from an invalid server settings revision also passed. Light/dark UI audit: 66 route/theme/width cases
  (1440/390/320 px), no overflow, no unlabeled controls or contrast failures;
  minimum observed text contrast 5.59:1.
- Flutter: customer 8 tests and rider 10 tests passed, including default parity,
  frozen fares/voucher caps, Lagos/overnight hours, area/distance eligibility,
  rider requirements and referral pause. Both analyzers report no errors or
  warnings; pre-existing informational lints remain.

For the integration check, run a database emulator on 127.0.0.1:19000 and an Auth
emulator on 127.0.0.1:19099, project `demo-zo-settings`. It supplies its own rules
and test credential, and never loads production credentials. For browser testing,
start the production build with both emulator host variables,
`FIREBASE_DATABASE_URL=http://127.0.0.1:19000?ns=demo-zo-settings-default-rtdb`
and `GCLOUD_PROJECT=demo-zo-settings`.

## Settings UI redesign

The settings page now uses a dedicated category rail on desktop and a native
section selector on smaller screens. One focused panel is visible at a time.
The workspace inherits the app’s normal DM Mono font, with a consistent
form-control scale, switch rows, contextual help and a sticky save area. Team management and
history have their own categories. Drafts persist across categories; native
validation reveals a hidden invalid field before focusing it.

Redesign verification: 13 admin tests, lint and production build passed. The
browser workflow verified edits across three categories in one save, history,
stale-draft preservation, hidden-field validation, area editing, staff creation,
login, permission visibility and immediate session revocation. All 64 category /
theme / viewport checks passed at 1440, 1024, 390 and 320 px, with no horizontal
overflow or unlabeled fields; minimum observed text contrast was 5.01:1.

Local demo-data previews: [desktop](docs/settings-desktop.png),
[pricing](docs/settings-pricing.png), [dark mobile](docs/settings-mobile-dark.png),
[service areas on mobile](docs/settings-mobile-service.png).
