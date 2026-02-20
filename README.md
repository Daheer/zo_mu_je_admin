# Zo Mu Je Admin Dashboard

Next.js 14 admin dashboard for Zo Mu Je ride-hailing (Lafia, Nasarawa State). Uses the same design system as the Flutter apps (primary #56A48C, DM Mono, spacing/radius from `zo_mu_je/lib/theme/app_theme.dart`).

## Setup

1. Copy `.env.local.example` to `.env.local`.
2. Fill in Firebase config from your Firebase project (same as the Flutter app). For `FIREBASE_SERVICE_ACCOUNT_KEY`, use the stringified JSON of the service account (e.g. from `zo_mu_je/zo_mu_je/config/fcm_service_account.json`).
3. `npm run dev` — app runs at http://localhost:3000.

## Features

- **Dashboard** — Total trips, revenue, riders, customers, open reports; trips-by-status pie; 7-day earnings bar; recent trips table.
- **Riders** — List with vehicle type, ratings, earnings, status; detail page with trip history and Deactivate/Reactivate.
- **Customers** — List with trip count; detail page with trip history.
- **Trips** — Filterable list (status, ride type, date range); detail page with status timeline and rider/customer cards.
- **Reports** — List with filters (status, reporter role, category); detail page with admin notes and status update (open → under_review → resolved/dismissed).

## Firebase

- Reads: `users`, `riders`, `All Ride Requests`, `reports`.
- Writes: `riders/{id}/status` (active/inactive), `reports/{id}` (status, adminNotes, resolvedAt).
- The `reports` node is created by this admin; the Flutter apps can write to it when users/drivers submit reports.
