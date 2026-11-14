# LANA — The Fidelio Secret · Build Spec (single source of truth)

Tagline: "Some secrets are written in the stars. Others are unlocked at midnight."

A private, premium, **mobile-first (iPhone Safari, portrait)** interactive birthday surprise for **Lana**, from **Julian**.
It is opened by tapping a ruby-crystal NFC card at midnight (14→15 Nov 2026) in a dark luxury restaurant
(Il Gattopardo, Dubai, skyline view). It must feel like a privately commissioned luxury experience —
jewelry-campaign / perfume-film / masquerade invitation — NOT a SaaS template, kids' game, casino app, horror game or booking UI.

DEADLINE IS TONIGHT. Favor robust, polished, working over ambitious and fragile.

## People & tone
- Lana: Russian, recently moved to Dubai, born 15.11.2002 (turning 24). Feminine, sophisticated, princess-like, intelligent.
  Loves Sudoku, chess, astrology (Scorpio), spirituality, wellness, luxury. Going into wealth management.
- Julian calls her "Rookie" (he beats her at chess) and "my princess".
- Inside joke "no chicken" (she eats clean/chicken; "no chicken" = flirtatious private joke). Use ONCE, subtly, after the climax. Never vulgar.
- Relationship anniversary date: 11.11.2026 ("the day our story began"). Relationship is new: affectionate, no exaggerated forever-declarations.
- Tone: 65% elegant romance · 25% celestial mystery/cinematic suspense · 10% playful inside jokes.
- Language: English primary, a few native Russian phrases (exact strings below; do not machine-translate new ones).
- Astrology is playful, never presented as science. No birth chart, no invented planetary events.
- Opening is *inspired by* masked-ball secrecy (password FIDELIO) — original visuals only; no film frames, quotes, music, actors. Not frightening, not occult-horror, not sexual.

## Two visual worlds
- **WORLD A — The Midnight Chamber** (chapters portal, fidelio, cosmic): ruby `#850C30`, deep burgundy `#280F1D`, midnight plum `#160F1C`, black velvet, antique champagne gold `#D7B47B`. Candlelight, velvet, Venetian mask, floating dust, slow motion.
- **WORLD B — Lana's Royal Universe** (sudoku, dates end, gift, kingdoms, decree, finale): blush `#F4B7C3`, soft pink `#FBE3E7`, ivory `#FFF8F0`, champagne gold `#D7B47B`, rose gold `#C98D93`, pearl. Paper-quilling flowers (the physical card: blush-pink paper, white quilled calligraphy, pink quilled flowers, green leaves, tiny gold dots), handwritten lettering.
- Signature transition (in the `dates` chapter): ruby crystals dissolve into glittering particles that become pink quilled flowers + golden light. Mystery becomes romance.
- Typography: `--font-display` Cormorant Garamond (high-contrast serif, headlines, has Cyrillic), `--font-ui` Manrope (UI, Cyrillic), `--font-script` Marck Script / Great Vibes (calligraphic, sparingly, Cyrillic). Wide letter-spaced small caps for labels.
- Motion: restrained. Good: curtain opening, light sweeping over crystal, slow particles, paper flowers unfolding, handwriting reveal, completion ripple, glowing seal, soft confetti. Bad: bouncing buttons, particle storms, fast cameras, spinners, flashing. Respect `prefers-reduced-motion`.

## Chapters (full-screen, theatrical, no scrolling marketing page)
State persists across refresh. Every cinematic is skippable (tap to advance). No audio autoplay; discreet sound toggle. No dead ends.

### 1 `portal` — The Midnight Portal
Ruby crystal texture on deep black, shimmering highlights, soft glow. Text fades in sequence (fast — first interaction available almost immediately):
- label: `THE MIDNIGHT INVITATION`
- `Princess Lana.`
- `You have been expected.`
- small: `Some doors only open once the clock strikes twelve.`
- ritual line (small, italic): `Your midnight ritual has three ingredients: something sweet, something mysterious, and one secret only you can unlock.`
- decorative: `15 · 11 · 2026`
- Primary button: `Enter the Ritual`
Do not reveal the gift.

### 2 `fidelio` — The Password
Velvet chamber, golden mask emerges from shadow, candles flicker.
- `Every secret has a key.` / `Every invitation has a password.` / `What is the password?`
- optional small line: `The evening has already offered its first indulgence. The real secret is still waiting.`
- Elegant input. Accept `FIDELIO` case-insensitive, trimmed. `autocorrect=off autocomplete=off autocapitalize=characters spellcheck=false`. Theatrical gate, not security.
- Wrong answers (rotate, playful, never lock out): `The stars are not quite aligned.` · `Mercury retrograde, perhaps?` · `Even rookies deserve another attempt.` · after 3+ wrong: `Mercury is clearly responsible for this.`
- Hints (button "Ask the stars for a hint", progressive): 1 `A word of loyalty, hidden in a famous midnight mystery.` 2 `Seven letters. It begins with F.` 3 `F I D E L I O`. After hint 3 show a direct `Reveal the password` option that fills + accepts.
- Success: mask glows, doors/curtains open: `Welcome, Princess Lana.` / `The stars have been waiting.` → cosmic.

### 3 `cosmic` — Her Cosmic Reading
Scorpio constellation draws itself in gold (astronomically sensible star positions — SVG in code), ruby/pink nebula.
- `Born under the sign of Scorpio.`
- `A little mysterious. Beautifully intuitive. Impossible to predict.`
- `Tonight, the stars have aligned around two very special dates.`
- `One marks the beginning of your story.` / `The other marks the beginning of ours.`
- Russian line (script/italic, small): `Звёзды уже всё решили…`
- `But even destiny requires a little strategy.` / `Ready, Rookie?`
- Button: `Reveal My Challenge`

### 4 `sudoku` — The Princess's Sudoku (World B begins: ivory/blush/gold, with constellation + chess-queen ornaments)
A REAL Sudoku. Fixed, pre-validated, medium puzzle with exactly one solution (5–10 min for an enthusiast). No timer.
- Header: `One final challenge before destiny reveals your reward.` sub: `Even queens have to think a few moves ahead.`
- Features: 9×9 board, large touch targets, number pad (shows remaining count per digit), selected-cell highlight (ruby), row/col/box soft highlight, same-number highlight, pencil-notes mode, eraser, undo, error highlighting (conflicts + wrong vs solution, toggle not needed), hint (fill one cell: the selected empty cell or a random one), autosave (values+notes+history-light), completion validation.
- Messages (toast, rare, non-blocking): on completing a 3×3 box: `Beautifully played.`; once only, after a few mistakes: `Careful, Rookie. This isn't chess.`
- `Reveal remaining solution` — clearly labelled, only offered after a genuine attempt (≥ 8 player-filled cells OR ≥ 3 hints used OR 4+ minutes on the board). Uses a confirm sheet. Still leads to the full reveal.
- No horizontal page scroll; board must fit 320–430 px wide screens with pad visible without scrolling on iPhone 13/14/15 (390×844, minus Safari chrome ≈ 390×660).
- Completion: golden pulse travels across the board → `dates`.
- **Test bypass**: URL `?sudoku=solved` → on reaching the sudoku chapter the board auto-fills with the solution (quick cascading animation) and completes exactly as a real solve.
- Date mechanism: do NOT encode dates into the grid as a rule. On completion, digits fade, a few decorative cells glow, grid dissolves into the date display. Dates are rendered as text.

### 5 `dates` — Two Dates, One Story (transition World A/B → fully World B)
Pause, golden pulse, cells → particles. Then, one after another (tap to advance / auto):
- `15.11.2002` — `The day a princess was born.`
- `11.11.2026` — `The day our story began.`
- `Some things are written in the stars.` / `Others begin with one very special person.`
- `Happy Birthday, Lana.` + Russian: `С днём рождения, моя принцесса.`
Screen warms from ruby/dark into blush/pink quilled-flower card world (signature transition lives here). Button: `Open Your Gift`

### 6 `gift` — The Real Gift
Luxury pink/champagne gift box with crown motif; ribbon loosens on tap, lid opens, quilled flowers unfold, warm light.
- Before opening: `One last thing, Princess.` + hint `Tap the ribbon`
- Headline: `One wish. Two hearts. A little escape.`
- Reveal: `A Romantic Staycation — Just You & Me.`
- `You've been wishing for a little getaway together.` / `So I thought it was time we made that wish come true.` / `No schedules. No responsibilities. Just a beautiful little escape with you.`
- Handwritten footer: `With love, Julian ♡` (+ Julian's real signature image, tinted)
- Button: `Choose Your Kingdom`
Never claim anything is booked. Dates are chosen later together.

### 7 `kingdoms` — Choose Your Kingdom
Two cinematic destination cards; swipe/tap between them; each has a detail view; explicit confirmation.
- A `sea` — **KINGDOM OF THE SEA** · Saadiyat Island, Abu Dhabi. `Where the sea is turquoise, the days are slow, and the only plan is enjoying each other.` Highlights (emotional, no invented inclusions): `Barefoot mornings on white sand` · `Turquoise water, unhurried days` · `Sunset walks, just us`
- B `balance` — **KINGDOM OF BALANCE** · SIRO One Za'abeel, Dubai. `Where the city stays beneath us and the world can wait while we recharge together.` Highlights: `The skyline at our feet` · `Rituals of rest and recovery` · `Slow mornings above the city`
- Buttons: `Explore This Kingdom`, in detail: `Choose This Kingdom`
- Images are *conceptual* — show a tiny caption `Illustrative impression` on destination imagery. No prices, packages, bookings.
- Confirm sheet: `Is this your chosen kingdom, Princess?` → `Yes, this one ♡` / `Let me dream a little longer`
- On confirm: persist locally; POST to `/api/choice` (best-effort). Only say "sent to Julian" if the POST really succeeded; otherwise silently keep local + offer `Share with Julian` (Web Share / copy text) on the decree.

### 8 `decree` — The Royal Decree
Animated royal wax seal → certificate unfolds; designed like the physical pink handmade card (blush paper, quilled flowers, gold ornamental border). ALL text is real HTML text.
- `A ROYAL BIRTHDAY INVITATION`
- Presented to: `Princess Lana` · Occasion: `Her 24th Birthday` · Gift: `A Romantic Staycation for Two` · Chosen destination: (her choice, full name + place) · Dates: `To Be Chosen Together` · From: `Julian ♡` (+ signature image)
- Line: `Your wish has been received, Your Highness. I'll take care of the rest.`
- Subtle playful line: `Royal forecast: romance, relaxation… and possibly no chicken.`
- Easter egg: tiny chess-queen icon; tapping reveals `Rookie status: upgraded to Princess.`
- Actions: `Save as Image` (html-to-image → PNG download / share sheet on iOS), `Share with Julian`, `Continue`
### `finale`
- `Some nights are written in the stars.` / `This one is ours.` / `Happy Birthday, моя принцесса ♡` + small `May your next adventure be as sweet as tonight.`
- Buttons: `Revisit My Gift` (→ decree), `Relive the Story` (replays from portal WITHOUT clearing the choice or requiring the Sudoku again — chapters become freely navigable), small text link `Play the Sudoku again` (resets puzzle only).
- Hidden easter egg (long-press the heart): `Chicken: optional. Kisses: highly recommended.`

## Architecture contract (Next.js 16 App Router · React 19 · TS · Tailwind v4 · `motion` · lucide-react)
READ `AGENTS.md` and the relevant guide under `node_modules/next/dist/docs/` before using Next APIs — this Next version differs from training data.
The whole experience is ONE client-rendered route (`/`). `noindex, nofollow`. Viewport: `viewport-fit=cover`, no user zoom jank, `100dvh`, safe-area insets.

```
src/app/layout.tsx            fonts, metadata (noindex), viewport, theme-color
src/app/page.tsx              renders <Experience/>
src/app/globals.css           Tailwind v4 @theme tokens (colors/fonts), base, shared keyframes/utilities
src/app/api/choice/route.ts   POST {id, choice} → @vercel/blob if BLOB_READ_WRITE_TOKEN else 503 {stored:false}; GET ?key=… lists (owner page)
src/lib/story.ts              ALL copy strings, typed, keyed by chapter (single place)
src/lib/store.tsx             ExperienceProvider + useExperience() — state machine + localStorage persistence
src/lib/assets.ts             asset manifest (paths below) 
src/lib/audio.ts              tiny WebAudio synth (soft chime, tap, shimmer, success) — no files, off by default
src/lib/sudoku/               puzzle.ts, engine.ts (pure reducer), solver.ts, *.test.ts (vitest)
src/components/Experience.tsx chapter switcher (AnimatePresence cross-fades), global SoundToggle, query-param handling
src/components/ui/            Button, Backdrop (poster img + optional looping muted video w/ fallback), Particles (canvas), 
                              FadeLines (sequenced text reveal, tap-to-skip), GoldRule, QuillFlower (SVG paper-quilling flower), 
                              Signature (mask-tinted), SoundToggle, Sheet (bottom sheet/confirm), Toast
src/components/chapters/      Portal.tsx Fidelio.tsx Cosmic.tsx SudokuChapter.tsx Dates.tsx Gift.tsx Kingdoms.tsx Decree.tsx Finale.tsx
src/components/sudoku/        Board.tsx Pad.tsx Toolbar.tsx …
```

### Store API (src/lib/store.tsx) — everyone codes against this
```ts
export type ChapterId = 'portal'|'fidelio'|'cosmic'|'sudoku'|'dates'|'gift'|'kingdoms'|'decree'|'finale';
export type Kingdom = 'sea'|'balance';
export interface ExperienceState {
  hydrated: boolean;            // false until localStorage is read (render a neutral dark screen until true)
  chapter: ChapterId;
  passwordAccepted: boolean;
  sudokuSolved: boolean;        // true after real solve, assisted solve, or bypass
  sudokuAssisted: boolean;
  giftOpened: boolean;
  choice: Kingdom | null;       // currently selected/confirmed kingdom
  choiceConfirmed: boolean;
  choiceSynced: boolean;        // server POST succeeded
  completed: boolean;           // reached finale at least once → free navigation
  experienceId: string;         // random opaque id
  soundOn: boolean;
  bypassSudoku: boolean;        // from ?sudoku=solved (not persisted as solved until the chapter completes)
}
export interface ExperienceActions {
  go(chapter: ChapterId): void;          // guarded: dates/gift/kingdoms need sudokuSolved; decree/finale need choiceConfirmed (unless completed)
  next(): void;                          // advance to the following chapter in order (same guards)
  acceptPassword(): void;
  completeSudoku(opts?: {assisted?: boolean}): void;   // sets sudokuSolved, does NOT navigate
  openGift(): void;
  selectKingdom(k: Kingdom | null): void;
  confirmKingdom(k: Kingdom): Promise<void>;  // sets choice + confirmed, POSTs best-effort, sets choiceSynced
  setSound(on: boolean): void;
  resetPuzzle(): void;                   // clears sudoku save + sudokuSolved only
  resetAll(): void;
}
export function useExperience(): ExperienceState & ExperienceActions;
```
- localStorage key `lana.fidelio.v1` (experience) and `lana.fidelio.sudoku.v1` (board save, owned by the sudoku module).
- Query params (handled once in Experience.tsx, then stripped from the URL with `history.replaceState`): `?sudoku=solved` → bypassSudoku; `?reset=1` → resetAll before anything; `?chapter=<id>` → jump (testing; sets the prerequisite flags it needs).
- Each chapter component takes no props, uses `useExperience()`, fills the viewport (`min-h-[100dvh]`, safe areas), and calls `next()`/`go()` itself.

### Asset manifest (public/assets/…) — code against these paths; every visual must degrade gracefully to CSS gradients if a file is missing/slow
| key | file(s) | use |
|---|---|---|
| portal | `portal.webp` (+ `portal.mp4` loop) | ruby crystal portal, chapter 1 hero (9:16) |
| chamber | `chamber.webp` (+ `chamber.mp4` loop) | velvet candlelit hall, chapter 2 (9:16, dark negative space center/bottom) |
| mask | `mask.webp` (transparent, isolated golden mask) | chapter 2 |
| scorpio | `scorpio.webp` | nebula backdrop for chapter 3 (constellation itself is SVG in code) |
| bloom | `bloom.webp` (+ `bloom.mp4`) | pink quilled-paper flower world, dates/gift/finale backdrop (9:16, soft, text-safe center) |
| giftbox | `giftbox-closed.webp`, `giftbox-open.webp` (transparent or on blush) (+ `giftbox.mp4` opening, optional) | chapter 6 |
| sea | `sea.webp` (+ `sea.mp4`) | Kingdom of the Sea |
| balance | `balance.webp` (+ `balance.mp4`) | Kingdom of Balance |
| paper | `paper.webp` | blush paper texture w/ quilled floral corners for the decree (4:5 or 3:4, large empty center) |
| flowers | `flower-1.webp`, `flower-2.webp`, `flower-3.webp` (transparent quilled flowers) | decorative accents |
| signature | `signature-mask.png` (white+alpha, EXISTS), `signature-ink.png` (blue ink, EXISTS) | Julian's real signature — tint via CSS mask (gold on dark, rose-gold/ruby on pink) |
Videos: muted, playsInline, loop, `preload="none"` until its chapter is next; poster = the webp. First screen must be light (< ~250 KB before interaction).

### Quality bar & testing
iPhone Safari portrait first (375×667 up to 430×932), desktop shows the experience centered in a phone-width stage with an elegant dark surround. Large touch targets (≥44px), no hover-dependence, no horizontal scroll, good contrast, no login/cookies/analytics. `npm run build`, `npm run lint`, `npm test` must pass.
