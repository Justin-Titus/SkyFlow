# SkyFlow - Premium Flight Management Web App

A production-ready Flight Management Progressive Web App (PWA) built with Next.js 16 (App Router), Supabase, Zustand, and Tailwind CSS. Features a beautiful dark-mode first design inspired by modern SaaS applications like Linear and Stripe.

## Features

- **Flight Search**: Search flights by origin, destination, and date.
- **Interactive Seat Map**: Real-time seat selection with live updates using Supabase Realtime.
- **Atomic Bookings**: Safe RPC-based booking system preventing race conditions.
- **Manage Bookings**: View, reschedule, and cancel your flights. Cancellations are blocked within 2 hours of departure via database triggers.
- **PWA Ready**: Installable on desktop and mobile with offline caching.
- **Premium Design System**: Glassmorphism, smooth Framer Motion-style CSS animations, and rigorous typography.

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Database & Auth**: Supabase (PostgreSQL, Auth, Realtime)
- **State Management**: Zustand (with Persist Middleware)
- **Styling**: Tailwind CSS v4
- **Icons**: Lucide React
- **PWA**: Custom Service Worker (Turbopack compatible)

## Local Setup

### 1. Supabase Setup
1. Create a new project on [Supabase](https://supabase.com).
2. Go to the SQL Editor and run the migration files in order, found in `supabase/migrations/`:
   - `001_schema.sql` (Creates tables)
   - `002_rls_policies.sql` (Secures tables with Row Level Security)
   - `003_rpc_functions.sql` (Creates atomic reservation, cancellation, and reschedule logic)
   - `004_triggers.sql` (Enforces the 2-hour cancellation rule)
   - `005_seed.sql` (Seeds 8 flights across 4 routes with full seat maps and a test user account)
   - `006_fix_security_warnings.sql` (Fixes Supabase linter security warnings: search_path, anon access revocation)
3. Ensure Email/Password Authentication is enabled in your Supabase Auth settings.
4. **Recommended**: Enable "Leaked password protection" in **Authentication → Settings → Security** to resolve the Supabase auth linter warning.
5. **Test Account Credentials** (for testing authentication):
   - **Email**: `test@skyflow.com`
   - **Password**: `password123`

### 2. Environment Variables
Copy the example environment file:
```bash
cp .env.example .env.local
```
Fill in your Supabase URL and Anon Key (`NEXT_PUBLIC_SUPABASE_ANON_KEY`) from your project settings → API.

### 3. Install Dependencies
```bash
npm install
```

### 4. Run the Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Architecture Highlights

- **Atomic Seat Locks**: The `reserve_seat` RPC function uses `FOR UPDATE` to lock the specific seat row during the transaction, preventing race conditions where two users might book the same seat simultaneously.
- **Zustand Persistence**: Search queries and active booking steps are persisted to `localStorage`. Sensitive information like `passport_no` is excluded using Zustand's `partialize`.
- **Realtime UI**: The Seat Map uses a custom hook `useRealtimeSeats` to listen to PostgreSQL changes, showing instantly when someone else selects a seat.
- **Tailwind v4**: Uses the new Tailwind CSS v4 `@theme` block with CSS variables for an ultra-fast build and a clean configuration.

## Zustand Store Architecture

The app uses two Zustand stores with `persist` middleware to manage client-side state:

### `useFlightStore` (`src/store/flightStore.ts`)

Manages the entire booking journey state:

| Field | Type | Persisted? | Notes |
|---|---|---|---|
| `searchQuery` | `{origin, destination, date, passengers}` | ✅ | Saved so users can resume search after closing tab |
| `selectedFlight` | `Flight \| null` | ✅ | The chosen flight from search results |
| `selectedSeat` | `Seat \| null` | ✅ | Single-seat backward-compat reference |
| `selectedSeats` | `Seat[]` | ✅ | All seats for multi-passenger bookings |
| `currentStep` | `'search' \| 'flights' \| 'seats' \| 'passenger' \| 'confirmation'` | ✅ | Tracks booking wizard progress |
| `passengerData` | `PassengerFormData \| null` | ✅ (sanitized) | **Passport number excluded** from localStorage via `partialize` |
| `passengerDataList` | `PassengerFormData[]` | ✅ (sanitized) | Multi-passenger version, **passport numbers excluded** |

**Key design decisions:**
- **`partialize`** is used to explicitly exclude `passport_no` from being persisted to `localStorage`. When persisting, `passport_no` is replaced with an empty string `''`, so sensitive travel document data never touches disk.
- **Optimistic seat selection**: When a user clicks a seat, the store updates immediately (`setSelectedSeat` / `setSelectedSeats`) before the Supabase write confirms, giving instant visual feedback.
- **`resetBooking()`** clears all booking state (including `searchQuery`) and is triggered on booking cancellation and logout.

### `useUserStore` (`src/store/userStore.ts`)

Manages authentication and cached booking data:

| Field | Type | Persisted? | Notes |
|---|---|---|---|
| `session` | `Session \| null` | ✅ | Only the session token is persisted |
| `user` | `User \| null` | ❌ | Derived from session, not separately persisted |
| `cachedBookings` | `Booking[]` | ✅ | Enables offline access to My Bookings page |

**Key design decisions:**
- **`partialize`** persists only `session` and `cachedBookings` — the `user` object is excluded (derived from session).
- **`logout()`** calls `useFlightStore.getState().resetBooking()` to clear all booking state, then resets its own state. This ensures a clean slate on sign-out.
- **Offline support**: `cachedBookings` is persisted so the My Bookings page remains readable offline using last-cached data.

## Deployment
This app is ready to be deployed on Vercel. 
1. Push to GitHub.
2. Import project in Vercel.
3. Add `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` as environment variables.
4. Deploy!
