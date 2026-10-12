# CAS-EMS — Equipment Management System

Web-based equipment and consumable-supply management system for the College
of Arts and Sciences' six laboratories (IT, Statistics, Mathematics,
Psychology, Physics, Chemistry) at Samar State University. React (Vite)
frontend on **Firebase Hosting**, with **Firebase Authentication** and
**Firebase Realtime Database** as the backend — no server of our own to run
or deploy.

## Stack

- **Client**: React 19 + Vite, React Router, Bootstrap 5 (CDN)
- **Auth**: Firebase Authentication (email/password)
- **Database**: Firebase Realtime Database (`database.rules.json` enforces role- and lab-scoped access — there is no separate backend)
- **Hosting**: Firebase Hosting

## Roles

- **Administrator** — creates and approves Lab Custodian accounts (each pinned to one of the six labs), approves borrower registrations, views cross-lab reports and activity logs.
- **Lab Custodian** — one per laboratory, sees only their own lab's data: registers durable equipment and consumable supplies, approves/rejects/releases/returns borrow requests, approves and issues consumable requests (decrementing stock), logs maintenance, runs reports.
- **Borrower** — registers once (college-wide), requests either a durable unit or a quantity of a consumable from any of the six labs, views their own request history.

Equipment comes in two kinds:
- **Durable** — status-tracked (`available` / `borrowed` / `under_maintenance` / `unserviceable`), released/returned per unit, with borrowing + maintenance history.
- **Consumable / one-time-use** (e.g. latex gloves, reagents) — tracked by live stock quantity, decremented when the custodian issues it, with an optional reorder threshold.

Both kinds can carry an **expiration date**; items that are expired or expiring within 30 days are flagged everywhere (dashboards, inventory tables, release/issue pick-lists) and excluded from the "available to release/issue" list by default.

## Setup

### 1. Create a Firebase project

1. Go to the [Firebase Console](https://console.firebase.google.com/) and create a project.
2. **Build > Authentication > Get started > Sign-in method** — enable **Email/Password**.
3. **Build > Realtime Database > Create Database** — start in your preferred region; rules will be deployed from this repo, so the initial mode doesn't matter.
4. **Project settings > General > Your apps > Add app > Web** — register the app and copy the config object shown.

### 2. Configure the client

```bash
cd client
cp .env.example .env.local
# paste the values from the Firebase config object into .env.local
npm install
```

### 3. Deploy the security rules

From the project root (requires the Firebase CLI: `npm install -g firebase-tools`, then `firebase login`):

```bash
firebase use --add        # select your project, or edit .firebaserc directly
firebase deploy --only database
```

This applies `database.rules.json`, which enforces:
- Borrowers can only create their own pending registration/requests.
- A Lab Custodian can only read/write equipment, categories, maintenance, and transactions that belong to their own assigned `labId`.
- Admins can manage all users; activity logs are admin-read-only and append-only.

### 4. Run locally

```bash
cd client
npm run dev        # http://localhost:5173
```

Without a `.env.local` set up, the app automatically runs in **demo mode** —
a realistic sample dataset (all 6 labs, durable + consumable items, one
expired and one expiring-soon item) lives in your browser's `localStorage`.
The login page shows one-click demo accounts for the Administrator, a
Borrower, and each of the six Lab Custodians.

### 5. Create the first Administrator

Open `http://localhost:5173/setup` and create the Administrator account using
the email configured at `meta/bootstrapAdminEmail` in Realtime Database. Open
the verification link sent to that address, then return to `/setup` and submit
the same form again. The account is created only after email verification, and
the route disables itself once an admin exists (tracked at `meta/adminExists`).

From there:
- Log in as Administrator to create the six Lab Custodian accounts (`/admin/users`), each assigned to one laboratory.
- Borrowers self-register at `/register` and are approved by the Administrator.

### 6. Deploy to Firebase Hosting

```bash
cd client
npm run build
cd ..
firebase deploy --only hosting
```

## Notes

- There is no QR code / scanning step. Release and return are confirmed
  directly by the lab custodian — picking the specific unit from a dropdown
  for durable equipment, or the specific stock entry + quantity for
  consumables — which is what makes the record a confirmed transfer rather
  than just a request.
- All business rules (who can release a unit, who can manage which lab's
  inventory, etc.) are enforced by `database.rules.json` — there is no
  server to bypass them from.
- CSV export for reports is generated client-side and downloaded directly from the browser.
