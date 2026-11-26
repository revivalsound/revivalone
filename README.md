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
| `YVP_APP_KEY` | YouVersion Platform key for licensed Bible text in Today's Word |
| `LIVEKIT_URL`, `LIVEKIT_API_KEY`, `LIVEKIT_API_SECRET` | LiveKit project for live prayer walls (`api/prayer-token.ts`) |

## Database

Run these in the Supabase SQL Editor, in order (each is safe to re-run):

1. `supabase/schema.sql`: profiles, initiatives, memberships, courses
2. `supabase/profile-upgrade.sql`: profile fields and the `avatars` bucket
3. `supabase/posts.sql`: the Home feed
4. `supabase/community.sql`: cell group chat (Realtime), prayer walls, the `media` bucket for event, bootcamp and cell covers

## Rev Academy audio

Courses are audio, episode by episode. Each episode plays `public/audio/academy/<course-slug>/<n>.mp3`.
The files there now are placeholder narration made with the Windows speech voice:

```bash
node --experimental-strip-types scripts/build-academy-audio.mjs                   # regenerate all
node --experimental-strip-types scripts/build-academy-audio.mjs --durations-only  # after swapping in real recordings
```

Listening progress is saved on the device; finished episodes light up pink on the course card.

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
