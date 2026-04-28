# Trojan Fall

> Chess is war. Every game tells a story.

**Live**: [https://trojan-fall.vercel.app](https://trojan-fall.vercel.app)

## What it is

**Trojan Fall** is a chess web platform that reimagines classical chess
as tactical warfare.

Games are played by standard FIDE rules (via `chess.js`), but **the
entire user experience is built around a military narrative and
explaining why you lost**. After every game, the player gets — instead
of a dry engine output (`-2.3 on move 14`) — a **War Report** in
their language: what went wrong, why this exact episode became
critical, and how to fix it in the next game.

## Who it's for

- **Players 14–35** in Kazakhstan and CIS — there isn't a single chess
  platform with AI analysis in Russian for this audience
- **Beginners and casual players** — they leave Chess.com and Lichess
  because they don't understand engine analysis. Trojan Fall translates
  mistakes into the language of tactics, not numbers
- **Anyone who wants to play with friends** — built-in **Дуэль (Duel)**
  mode lets you play online vs a real opponent with special abilities
  (cards ⚡💥🛡👑) and an in-game currency

## Why it's valuable

1. **You understand why you lost.** Not "−2.3 on move 14", but
   "Unprotected HQ", "Premature queen sortie" — a specific incident
   and a specific recommendation. In Russian.

2. **You see a control map during the game.** Control zones (blue =
   yours, red = enemy's, purple = contested) are overlaid on the
   board in real time. Neither Chess.com nor Lichess do this.

3. **Duel mode with friends — with abilities.** Multiplayer via
   Supabase Realtime: create a room, send the link to a friend, play
   live. Each player gets 3 special cards: ⚡ Berserk (double move),
   💥 Lightning (remove a piece), 🛡 Shield (piece immunity),
   👑 Coronation (pawn → queen).

4. **In-game economy.** Ducats Δ — military currency. Earned for
   wins / accuracy / daily login. Spent on consumables, board skins,
   rare card unlocks.

5. **Clash-Royale-level gamification.** XP, 8 military ranks
   (Recruit → Supreme Commander), daily missions, win streaks,
   daily login bonus.

## Stack

| Layer      | Technology                                        |
|------------|---------------------------------------------------|
| Frontend   | Next.js 14 (App Router) + React 18 + TypeScript   |
| Styling    | Tailwind CSS 3 + custom `war-*` theme             |
| Fonts      | Orbitron (display) + Rajdhani (UI)                |
| Chess      | `chess.js` + `react-chessboard@4`                 |
| AI         | Minimax + alpha-beta + PST (depth 1–3)            |
| State      | `zustand` with `persist` to localStorage          |
| Backend    | Supabase: Auth + PostgreSQL + Realtime + RLS + RPC|
| Payments   | Stripe Checkout (optional)                        |
| Deploy     | Vercel                                            |

## Project structure

```
app/
  page.tsx                  ← Landing
  play/page.tsx             ← Battle vs AI (3-column layout)
  match/[id]/page.tsx       ← Match by link (multiplayer chess)
  match/new/page.tsx        ← Create stake match
  siege/[roomId]/page.tsx   ← Дуэль (Duel mode) — chess + cards
  shop/page.tsx             ← Quartermaster: ducat shop and items
  review/[id]/page.tsx      ← War Report
  profile/page.tsx          ← Profile, wallet, history
  auth/                     ← login / signup / callback (Supabase Auth)
  api/checkout/route.ts     ← Stripe checkout
  api/webhook/route.ts      ← Stripe webhook → credit ducats

components/
  battle/                   ← BattleBoard, MultiplayerBoard, BattleHUD
  siege/                    ← SiegeBoard, RoomLobby, CardBar, CardModal
  review/                   ← WarReport, IncidentCard, MomentsTimeline
  ui/                       ← AccuracyGauge, StabilityBar, TerritoryHexMap, ...
  auth/                     ← AuthProvider, AuthForm
  layout/                   ← Navbar, Footer

lib/
  chess/                    ← ai, zones, review, narrative, xp, stats
  siege/                    ← cards, room helpers, types
  shop/                     ← items, skins
  supabase/                 ← client, server, middleware, types
  stripe.ts                 ← Stripe SDK + packages

hooks/                      ← useMatch, useSiegeRoom, useWallet, useInventory

supabase/
  schema.sql                ← Full database schema
```

## Local development

```bash
npm install
npm run dev      # http://localhost:3000
```

Without Supabase everything still works: profile and games are stored
locally via `zustand persist`. Multiplayer and the shop require Supabase.

## Connecting Supabase

1. Go to [supabase.com](https://supabase.com) → New project
2. SQL Editor → run `supabase/schema.sql`
3. Copy `.env.local.example` → `.env.local`:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
   ```
4. Authentication → URL Configuration → add
   `http://localhost:3000/auth/callback` to Redirect URLs

## Stripe (optional)

Without keys, shop purchase buttons display "Coming soon".
To enable real payments:

```
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

Webhook URL for Stripe Dashboard: `https://your-domain/api/webhook`,
event: `checkout.session.completed`.

## Roadmap

- **V2**: Stockfish WASM for deeper analysis, weekly Battle Pass
- **V3**: B2B Academy mode for chess schools, mobile app

---
Built for **nFactorial School Chess Challenge 2025**.
