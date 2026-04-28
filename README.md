# Trojan Fall

> Chess is war. Every game tells a story.

**Live**: [https://trojan-fall.vercel.app](https://trojan-fall.vercel.app)

## Что это

**Trojan Fall** — шахматная веб-платформа, которая переосмысляет
классические шахматы как тактическую войну.

Партия играется по обычным правилам FIDE (через `chess.js`), но **весь
пользовательский опыт построен вокруг военного нарратива и
объяснения причин**. После каждой партии игрок получает не сухой
engine-вывод (`-2.3 на ходу 14`), а **War Report** на русском
языке: что пошло не так, почему именно этот эпизод стал критическим,
и как исправить это в следующей партии.

## Для кого

- **Игроки 14–35 лет** в Казахстане и СНГ — там нет ни одной
  шахматной платформы с AI-разбором на русском
- **Новички и любители** — они уходят с Chess.com и Lichess, потому что
  не понимают анализ движка. Trojan Fall переводит ошибки на язык
  тактики, а не цифр
- **Все, кто хотят соревнование с другом** — встроенный режим
  «Дуэль» позволяет играть онлайн с реальным противником, со
  спецспособностями (карты ⚡💥🛡👑) и внутренней валютой

## Почему это ценно

1. **Понимаешь, почему проиграл.** Не «−2.3 на ходу 14», а
   «незащищённый штаб», «преждевременная атака ферзём» — конкретный
   эпизод и конкретный совет. На русском языке.

2. **Видишь карту контроля прямо во время партии.** Зоны
   контроля (синие — твои, красные — противника, фиолетовые —
   спорные) накладываются на доску в реальном времени. Этого нет
   ни на Chess.com, ни на Lichess.

3. **Дуэль с другом — со способностями.** Многопользовательский
   режим через Supabase Realtime: создал комнату, скинул ссылку
   другу, играете онлайн. Каждому даётся 3 спецкарты:
   ⚡ Берсерк (двойной ход), 💥 Молния (удалить фигуру),
   🛡 Щит (защита фигуры), 👑 Коронация (пешка → ферзь).

4. **Внутренняя экономика.** Дукаты Δ — военная валюта. Зарабатываются
   за победы / точность / ежедневный вход. Тратятся на расходники,
   скины досок, разблокировку редких карт.

5. **Геймификация уровня Clash Royale.** XP, 8 боевых званий
   (Рекрут → Верховный Главнокомандующий), daily missions,
   серии побед, daily login bonus.

## Stack

| Слой       | Технология                                        |
|------------|---------------------------------------------------|
| Frontend   | Next.js 14 (App Router) + React 18 + TypeScript   |
| Styling    | Tailwind CSS 3 + кастомная тема `war-*`           |
| Шрифты     | Orbitron (display) + Rajdhani (UI)                |
| Шахматы    | `chess.js` + `react-chessboard@4`                 |
| AI         | Minimax + alpha-beta + PST (depth 1–3)            |
| State      | `zustand` с `persist` в localStorage              |
| Backend    | Supabase: Auth + PostgreSQL + Realtime + RLS + RPC|
| Платежи    | Stripe Checkout (опционально)                     |
| Деплой     | Vercel                                            |

## Структура

```
app/
  page.tsx                  ← Landing
  play/page.tsx             ← Battle vs AI (3-column layout)
  match/[id]/page.tsx       ← Match by link (multiplayer chess)
  match/new/page.tsx        ← Create stake match
  siege/[roomId]/page.tsx   ← Дуэль (Siege Mode) — chess + карты
  shop/page.tsx             ← Quartermaster: магазин дукатов и предметов
  review/[id]/page.tsx      ← War Report
  profile/page.tsx          ← Профиль, кошелёк, история
  auth/                     ← login/signup/callback (Supabase Auth)
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
  schema.sql                ← Полная схема БД
```

## Локальный запуск

```bash
npm install
npm run dev      # http://localhost:3000
```

Без Supabase всё работает: профиль/партии хранит `zustand persist`,
локально. Multiplayer и магазин требуют Supabase.

## Подключение Supabase

1. [supabase.com](https://supabase.com) → New project
2. SQL Editor → выполни `supabase/schema.sql`
3. Скопируй `.env.local.example` → `.env.local`:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
   ```
4. Authentication → URL Configuration → добавь
   `http://localhost:3000/auth/callback` в Redirect URLs

## Stripe (опционально)

Без ключей кнопки покупки в магазине показываются как «Скоро доступно».
Для активации:

```
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

Webhook URL для Stripe Dashboard: `https://your-domain/api/webhook`,
event: `checkout.session.completed`.

## Roadmap

- **V2**: Stockfish WASM для глубокого анализа, weekly Battle Pass
- **V3**: B2B Academy mode для шахматных школ, мобильное приложение

---
Built for **nFactorial School Chess Challenge 2025**.
