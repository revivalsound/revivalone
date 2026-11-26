# Revival One

One movement. One revival. One generation.

Built on the **Spyda stack and design system**: Vite + React 19 + React Router 7,
Tailwind CSS 3, the Solar icon library, `@paper-design/shaders-react` for the
liquid-metal flame and the hero mesh gradient, Supabase for auth and data, and
Vercel-style serverless functions in `api/`.

## Run it

```bash
npm install
npm run dev        # http://localhost:5173 (api/ is served by the dev server too)
npm run build      # type-checks api/ and src/, then builds to dist/
```

Optional environment (`.env.local`):

| Variable | Used for |
| --- | --- |
| `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` | Browser Supabase client (falls back to the existing project) |
| `SUPABASE_URL`, `SUPABASE_ANON_KEY` | `api/` functions (same fallback) |
| `LIVEKIT_URL`, `LIVEKIT_API_KEY`, `LIVEKIT_API_SECRET` | LiveKit project for live prayer walls (`api/prayer-token.ts`) |
| `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT` | Web Push keys (`npx web-push generate-vapid-keys`); `VITE_VAPID_PUBLIC_KEY` is the same public key for the browser |
| `PUSH_WEBHOOK_SECRET` | Shared secret between the database trigger and `api/push.ts` |
| `SUPABASE_SERVICE_ROLE_KEY` | Lets `api/push.ts` read members' push devices (server only, never in the browser) |

## Database

Run these in the Supabase SQL Editor, in order (each is safe to re-run):

1. `supabase/schema.sql`: profiles, initiatives, memberships, courses
2. `supabase/profile-upgrade.sql`: profile fields and the `avatars` bucket
3. `supabase/posts.sql`: the Home feed
4. `supabase/community.sql`: cell group chat (Realtime), prayer walls, the `media` bucket for event, bootcamp and cell covers
5. `supabase/posts-rich.sql`: formatted text and up to six photos or videos per post
6. `supabase/profile-v2.sql`: cover photos and a website link on profiles
7. `supabase/follows.sql`: follows and notifications (new posts, prayer walls and cells from people you follow, and new cells in your city)
8. `supabase/push.sql`: push notifications to closed apps (device sign-ups, and a trigger that hands each notification to `/api/push`)
9. `supabase/bible.sql`: Bible highlights and notes, daily-guide progress and journals, member-made Rev Academy courses (and it removes the old demo courses)

## The Bible

Bible text, audio narration, study notes, commentaries, cross references and the verse of the day come from the
[Free Use Bible API](https://bible.helloao.org) ([HelloAOLab/bible-api](https://github.com/HelloAOLab/bible-api)): free, no key,
CORS-enabled. The default translation is the Berean Standard Bible (public domain).

- **Reader** (`/bible`): ten free English translations, book and chapter picker, the words of Jesus in pink, footnotes,
  chapter narration (BSB), highlights and verse notes saved to the member's account, Tyndale study notes, Matthew Henry and
  Jamieson-Fausset-Brown commentary, and OpenBible.info cross references.
- **Daily guide** (`/guide`): the whole Bible from January to December (Old Testament, New Testament, and Psalms with Proverbs),
  the dataset's verse of the day, a Tyndale note before you read, reflection prompts, a private journal, a streak and a
  year calendar.

`scripts/build-bible-data.mjs` regenerates the book list the guide is built from.

## Real data only

The app ships no sample people, posts, events, cells or courses. Everything shown comes from members, apart from the Bible
and the daily guide built from it.

## Icons

Icons come from Solar (line-duotone), installed in `Font/`, the same library Spyda uses.
To add one, add a row to the `MAP` in `scripts/build-solar-icons.mjs`, then run:

```bash
npm run icons
```

That regenerates `src/components/ui/solar-icons.generated.ts` and the exports in
`src/components/ui/icons.tsx`. Import by name: `import { Fire } from '@/components/ui/icons'`.

## Motion (from Spyda)

- **Card deck** (`src/components/landing/useCardDeck.ts`): grids deal in from a stacked deck
  on scroll, tilt toward the mouse, and `Shuffle the deck` gathers and re-deals them.
- **Lightning border** (`.bolt-card`, `.brand-ring` in `src/index.css`): a conic light that
  strikes once around a card's border, then keeps running. Use `bolt-card--on` (open or
  selected), `bolt-card--hover`, and `bolt-card--inset` for photo cards with `overflow-hidden`.
- **Hero strike** (`.hero-strike`): a lightning flash across the hero field every few seconds.
- **Liquid-metal flame** (`BrandMark`), the **splash** orb, **mesh-gradient hero** (`HeroField`),
  **bloom-texture** cards, and marquees.

All of it respects `prefers-reduced-motion`.

## Layout

```
api/                 serverless functions: profile, initiatives, bible-passage
src/pages/           Landing, Auth, AuthCallback, ResetPassword
src/pages/app/       Home, Community, Events, Academy, Word, Profile
src/components/app/  AppShell: sidebar/icon rail, top bar, phone nav, Create dialog
src/components/ui/   icons, kit (pills, chips, deck, lightning disclosure)
supabase/            SQL schema and upgrades
legacy-next/         the previous Next.js/vinext build, kept for reference
```
