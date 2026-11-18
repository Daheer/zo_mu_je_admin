# Zo Mu Je Admin Dashboard

Next.js 14 admin dashboard for Zo Mu Je ride-hailing (Lafia, Nasarawa State). Uses the same design system as the Flutter apps (primary #56A48C, DM Mono, spacing/radius from `zo_mu_je/lib/theme/app_theme.dart`).

## Setup

1. Copy `.env.local.example` to `.env.local`.
2. Fill in the Firebase config for the same project as the Flutter apps. Set `FIREBASE_SERVICE_ACCOUNT_KEY_PATH` to the private server credential file and `ADMIN_COOKIE_SECRET` to a strong secret. Set `RIDE_BACKEND_URL` to the deployed API address.
3. `npm run dev` — app runs at http://localhost:3000.

## Features

- **Dashboard** — Total trips, revenue, riders, customers, open reports; trips-by-status pie; 7-day earnings bar; recent trips table.
- **Riders** — List with vehicle type, ratings, earnings, status; detail page with trip history and Deactivate/Reactivate.
- **Customers** — List with trip count; detail page with trip history.
- **Trips** — Filterable list (status, ride type, date range); detail page with status timeline and rider/customer cards.
- **Platform settings** — Pricing, matching, service areas/hours, rider requirements, rewards, operations, support contacts, staff permissions and revision history. See [PLATFORM_SETTINGS.md](PLATFORM_SETTINGS.md) for rollout and validation.
- **Reports** — List with filters (status, reporter role, category); detail page with admin notes and status update (open → under_review → resolved/dismissed).

## Owner login and backend mode

Owner, operator and viewer accounts can sign in using their Firebase email/password. The account must have the corresponding `adminRole` custom claim; sessions recheck the current role and session version. Email login requires `ADMIN_COOKIE_SECRET`, not the optional recovery password.

The designated project owner has been provisioned and checked against `https://zo-mu-je.duckdns.org`. The owner UID is stored in the ignored local environment. The ignored local `.env.local` points to that backend. For a separately hosted admin deployment, set `RIDE_BACKEND_URL` to this address and use a server-only Firebase credential with the existing public Firebase configuration. This admin code must be deployed/rebuilt for owner email login to be available.

Password-only owner recovery remains available when `ADMIN_PASSWORD` and `BACKEND_OWNER_UID` are configured. Normal owner email login uses the Firebase UID directly and does not require the recovery mapping. In backend mode all profiles, rides, reports, settings and staff operations use the API.

## Legacy Firebase mode

- Reads: `users`, `riders`, `All Ride Requests`, `reports`.
- Writes: `riders/{id}/status` (active/inactive), `reports/{id}` (status, adminNotes, resolvedAt).
- The `reports` node is created by this admin; the Flutter apps can write to it when users/drivers submit reports.
- Admin pages read Firebase on each request and refresh every 30 seconds while visible, plus when the tab regains focus. Updates are polled, not streamed in real time. Riders with a registration date appear newest first; older records without a date follow them.


### Hosted admin connection

The hosted admin must set `RIDE_BACKEND_URL=https://zo-mu-je.duckdns.org` in Vercel's Production environment. Password-only owner recovery also needs `BACKEND_OWNER_UID` set to the existing Firebase owner's UID (the local ignored `.env.local` already contains it). Redeploy after changing environment variables; an existing deployment does not pick them up automatically.

Without `RIDE_BACKEND_URL`, the legacy adapter reads the old root `riders`/`users` collections. New app registrations live under `rideFoundation` and are listed through `/v1/admin/profiles?role=rider`; approving an old legacy record does not approve a new backend rider profile. Do not merge the two datasets or infer rider approval from a Google sign-in.

The rider list offers All / Pending / Active / Inactive shortcuts with live counts, combined name/email/phone/ID search, and newest registrations first. Settings uses the shared admin theme, plain category navigation and existing form validation/save behavior.


## Courier implementation branch — 18 November 2026

The `courier-email` branch adds a plain Courier settings tab for editable motorcycle package prices, weights/dimensions, prohibited items and activation. Prices start from the backend’s configured motorcycle fare with ₦0/₦100/₦200 size surcharges; bookings start disabled and enabling requires Gmail SMTP configuration. Existing ride settings retain their schema and drafts. Courier revisions have a separate audit history.

Trips filters now separate packages and rides. Package details show receiver contacts, cash confirmation, private pickup/delivery/return photo links and audited support outcomes. Operators can approve delivery photo fallback, arrange return to the original pickup, confirm handback/refund or revoke receiver tracking. The backend enforces permissions, custody and resolution idempotency. These controls require backend 0.5.0; older backends still serve existing ride pages and show the courier settings unavailable state. No hosted configuration was changed as part of this branch.
