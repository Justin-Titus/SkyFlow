# SkyFlow - Premium Flight Management Web App

A production-ready Flight Management Progressive Web App (PWA) built with Next.js 16 (App Router), Supabase, Zustand, and Tailwind CSS. Features a beautiful dark-mode first design inspired by modern SaaS applications like Linear and Stripe.

## Features

- **Flight Search**: Search flights by origin, destination, and date.
- **Interactive Seat Map**: Real-time seat selection with live updates using Supabase Realtime.
- **Atomic Bookings**: Safe RPC-based booking system preventing race conditions.
- **Manage Bookings**: View, cancel, and manage your flights. Cancellations are blocked within 2 hours of departure via database triggers.
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
   - `003_rpc_functions.sql` (Creates atomic reservation and cancellation logic)
   - `004_triggers.sql` (Enforces the 2-hour cancellation rule)
   - `005_seed.sql` (Seeds 8 flights across 4 routes with full seat maps and a test user account)
3. Ensure Email/Password Authentication is enabled in your Supabase Auth settings.
4. **Test Account Credentials** (for testing authentication):
   - **Email**: `test@skyflow.com`
   - **Password**: `password123`

### 2. Environment Variables
Copy the example environment file:
```bash
cp .env.example .env.local
```
Fill in your Supabase URL and Anon Key (NEXT_PUBLIC_SUPABASE_ANON_KEY) from your project settings.

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

## Deployment
This app is ready to be deployed on Vercel. 
1. Push to GitHub.
2. Import project in Vercel.
3. Add `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` as environment variables.
4. Deploy!

