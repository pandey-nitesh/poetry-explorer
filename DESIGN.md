# Stanza — Design

> The **visual and interaction design** layer for Poetry Explorer. Behaviour, data, the PoetryDB API and its rules, routing, state architecture, identity, and acceptance criteria live in **`docs/SPEC.md`** and are **not repeated here** — where the two meet, this document defers to the spec. This file owns look, feel, layout, typography, motion, and the composition of each screen.

Stanza is not a generic “calm reading app.” It should feel like a small poetry index found in the back room of a library: folio numbers, marginal notes, fine rules, archival slips, and one deliberate mark of colour.

---

## Design principles

- **Reading-first.** The poem is the event. Interface chrome behaves like annotation, not decoration.
- **Archive, not app shell.** Results feel like bibliographic slips; detail feels like a folio page; saved poems feel like a reader’s drawer.
- **One mark of colour.** Accent is used like rubrication in an old book: small, specific, memorable. The accent stays in the same hue family across themes. No gradient glow, no blue SaaS default, no terracotta lifestyle palette.
- **Asymmetry with discipline.** Pages use a narrow marginal rail plus a wide reading field where space allows. The rail holds metadata and wayfinding; primary verbs stay near the thing they act on.
- **Always legible.** Content is never hidden behind animation; motion is optional polish, not a gate.

---

## Themes

Two complete skins. **Folio** is the light theme, **Nocturne** the dark. The app honours the OS `prefers-color-scheme` on first load; a returning reader’s saved choice wins. The values below are chosen to target **WCAG AA**. Folio’s key small-text/focus pairs have been checked by WCAG relative luminance (`muted`/`accent`/`focus` against both `bg` and `bg2`; `focus` also against `rule`), but implementation should still verify final rendered CSS before claiming compliance in product copy.

The palette deliberately avoids the most common generated-design anchors: electric blue, purple/cyan gradients, terracotta-on-cream lifestyle warmth, and pure monochrome.

| Token | Folio (light) | Nocturne (dark) |
|---|---|---|
| `bg` / `bg2` | `oklch(96% 0.018 92)` aged ivory / `oklch(91% 0.021 92)` deckle paper | `oklch(15% 0.018 292)` ink-violet / `oklch(20% 0.017 292)` raised sheet |
| `ink` / `muted` | `oklch(20% 0.018 72)` walnut ink / `oklch(38% 0.018 78)` dark olive ink | `oklch(92% 0.010 86)` moon paper / `oklch(72% 0.014 286)` lavender ash |
| `rule` | `oklch(77% 0.018 88)` tea-stained hairline | `oklch(34% 0.018 292)` violet graphite |
| `accent` | `oklch(40% 0.150 27)` oxblood rubric | `oklch(72% 0.115 27)` illuminated oxblood |
| `focus` | `oklch(43% 0.170 27)` clear oxblood ring | `oklch(78% 0.125 27)` clear oxblood ring |
| `fontDisplay` | Literata / Georgia fallback | Literata / Georgia fallback |
| `fontPoem` | Literata / Georgia fallback | Literata / Georgia fallback |
| `fontBody` | Atkinson Hyperlegible / system sans | Atkinson Hyperlegible / system sans |
| `fontMono` | ui-monospace, "Cascadia Code", "Roboto Mono", monospace | ui-monospace, "Cascadia Code", "Roboto Mono", monospace |
| `radius` | `2px` slips, `999px` controls | `2px` slips, `999px` controls |

Use the accent only for active state marks, focus rings, selected suggestions, small folio ticks, and underline strokes. Do not fill large buttons, panels, cards, or whole sections with the accent.

On theme switch, values transition briefly (~0.45s) while content stays visible throughout — no fade-from-transparent. Under `prefers-reduced-motion`, the transition is disabled or near-instant. Fonts load from Google Fonts; if slow or blocked, each role falls back to system serif/sans/mono so layout never breaks. Self-host fonts if privacy or performance matters.

---

## Typography

- **Display / headings** — Literata if available, using heavier weight, tighter leading, and the display/heading size range. Georgia is the fallback.
- **Poem body** — Literata as the same family at calmer weight/size. One serif family avoids loading two competing “literary” voices. If implementation cannot create enough hierarchy with Literata alone, keep the poem body as the priority and use spacing, mono metadata, and rule placement before adding a second display face.
- **UI / body** — Atkinson Hyperlegible for plainness and accessibility. Avoid Inter unless the implementation already standardizes on it.
- **Small labels / counts** — `ui-monospace, "Cascadia Code", "Roboto Mono", monospace`, letter-spaced lightly, used sparingly for folio numbers, result counts, and `n`/line-count metadata.
- **Fluid scale** via `clamp()` so type breathes from phone to desktop.
- Comfortable reading **measure (~60–70ch)**; poem text is **never justified**. Ragged right preserves line shape.

Typographic fingerprint: headings can use slightly compressed line-height and modest optical weight, but body prose stays calm. No giant centered hero line. No uppercase mono eyebrow above every section.

---

## Layout language

The recurring shape is a **folio rail**:

- On desktop, a narrow left rail holds quiet metadata: result count, selected search mode, saved count, or short contextual notes. It does **not** hold the primary poem actions.
- The main content sits in a wider reading field.
- On mobile, the asymmetric rail is intentionally **not preserved** — a true side rail would starve the reading column. Instead, mobile keeps the archive identity through a persistent **folio strip**: a thin left rule, one compact count/mode label above the content, and the same slip/rule language.

Use hairline rules and generous gutters instead of card shadows. The app should feel assembled from paper, not floating glass.

---

## Screens

Four route surfaces — Home, Results, Poem detail, Saved — plus the shared **Search field** component. *Which* surface shows, and how it is addressed in the URL, is SPEC’s concern; this describes composition and tone.

### Home

- A restrained **masthead**, not a marketing hero: app name, one-line invitation, and a small folio mark such as `PoetryDB · public domain index`.
- The **search field** is the main object, set like an index drawer label: strong input, segmented Author | Title control, and suggestions directly beneath.
- **Curated poet chips** — a small hand-picked static list, not “popular” ranking. Style them like catalogue tabs: compact, text-first, no emoji, no pastel pills.
- **Poem of the Day** — optional via the *Show Poem of the Day* design option. Present it as a “daily folio” with title, author, line count, and a small action to open. The deterministic selection logic lives in SPEC §13.

### Search field

The search *model* is SPEC’s: Author | Title toggle + local autocomplete (SPEC §9). Its **design**:

- One prominent input paired with a segmented Author | Title control.
- The active segment is marked by a small accent tick and stronger ink, not a big filled pill.
- Suggestions open as a compact **index drawer**: each row shows the suggestion text. Do not add per-row `title`/`poet` labels; the active Author | Title toggle already supplies that context.
- Highlighted suggestion uses a left accent rule plus paper shift. Arrow-key movement should feel precise, not bouncy.
- Submitting or picking a suggestion moves into results with a small positional transition; no page-wide fade.

### Results

- Use a **bibliographic slip grid**, not generic rounded SaaS cards. Each slip has:
  - title in display type;
  - author beneath;
  - line-count tag in mono;
  - a small top or left rule as the visual anchor.
- Grid: `auto-fill, minmax(~280px, 1fr)`. Keep slip structure consistent so rows do not look accidentally broken. If a future design wants masonry, make that an explicit layout choice rather than a vague height variation.
- **No poem preview.** Search is metadata-only (SPEC §2), so slips stay light, uniform, and fast. **Do not fetch poem `lines` to make cards richer** — it breaks the metadata-only rule and floods broad searches.
- A result count sits in the rail on desktop. On mobile, that same count becomes the folio-strip label above the grid — do not render a second duplicate count.
- For large sets, pagination or lazy loading keeps the page from becoming a wall of slips.
- Hover may lift by 1–2px or shift the rule colour; keyboard focus uses a strong outline/ring. Transform-only; reduced or near-instant under `prefers-reduced-motion`.

### Poem detail

- A focused **folio page**: title, author, line-count, then the poem.
- Put primary poem actions close to the title or immediately after the poem intro: Save, Copy, Reading mode, Surprise me. They may be visually quiet, but they must read as controls. The rail can repeat one or two actions only as a secondary convenience on wide screens.
- The poem renders original line breaks and blank-line stanzas intact, in the poem serif.
- Preserve visible stanza air. Do not “normalize” blank lines into generic paragraph spacing.
- The line count is quiet metadata; if unknown (`0`), omit it rather than showing “0 lines.”

### Saved — reading list

- Saved poems appear as the same bibliographic slips as results.
- The empty state should feel like an unused drawer, not a failed task: a short note and one action back to search.
- Avoid confetti, badges, streaks, or “collection gamification.” Saving is a reader’s mark, not a productivity loop.

---

## Reading mode — the reading enhancer

A fullscreen, distraction-free overlay, available from poem detail or the featured poem **once a poem is loaded**.

- The poem sits in a single column with generous margins and no surrounding panel.
- A small floating rail holds **A− / A+**, line-spacing controls, and Close.
- Controls are persistently visible and touch-sized. They may be visually quiet, but never hover-only; phones and tablets must not require focus or hover to discover Close, A− / A+, or line-spacing.
- `Esc` closes and returns the reader exactly where they were.
- Reading mode should feel like clearing the desk, not launching a modal.

---

## Components & affordances

- **Author | Title toggle** — segmented, low-fill, marked by an accent tick; arrow-key operable.
- **Suggestions dropdown** — combobox-style index drawer; highlighted option has a left rule and strong focus state.
- **Curated poet chips** — catalogue tabs; compact, wrapping, hand-picked, not ranked.
- **Poem slip** — title / author / line-count; hairline rule; hover-lift plus strong keyboard focus ring; whole slip is the target.
- **Save control** — a bookmark/ribbon mark that fills when saved. Keep it geometric and small.
- **Copy** — copies formatted poem text with a transient `Copied` state. No celebratory toast; silent success is enough.
- **Surprise me** — a genuinely random poem. It is distinguished by placement and label, not by a separate decorative treatment.

---

## States — visual tone

Every screen that waits on data shows one of three, styled to feel composed rather than alarming:

- **Loading** — skeleton slips or an ongoing low-key progress treatment. PoetryDB can take 1–2 seconds; a single pulse reads as stalled once it finishes. Avoid spinners as the dominant object.
- **Empty** — one brief note plus suggested searches. Do not split “no matches” between the rail and main content.
- **Error** — clear message + Retry. Use accent only for the retry/focus affordance; do not flood the state with red.

---

## Motion

- Content entrances are positional and small: translate 4–8px, never a full-page fade from invisible.
- Theme changes transition colour/type values briefly; content stays visible throughout.
- Hover lifts are ≤2px. No spring bounce, no parallax, no shimmer.
- Under `prefers-reduced-motion`, motion is disabled or reduced to near-instant — never a barrier to seeing or reaching content.

---

## Accessibility — presentation

The behavioural ARIA contract (combobox, radiogroup, focus management, live regions) is specified in SPEC §12. The **presentation** obligations here:

- **WCAG AA** contrast in both themes, verified in implementation before the claim appears in product copy or docs.
- **Visible focus** on every interactive element; focus rings appear instantly and meet contrast.
- Toggle pressed state and highlighted suggestion must be unmistakable without relying only on colour.
- Poem text is **real, selectable text** — never an image.
- Touch targets are comfortably large (~44px); the search field is always reachable.

---

## Designer-facing options — tweaks

Surfaced as host-editable knobs — all purely presentational:

| Option | Default | Effect |
|---|---|---|
| Initial theme | Folio | Fallback skin used only when neither a saved preference nor the OS `prefers-color-scheme` determines one (SPEC §12). A returning reader’s choice always wins. |
| Show Poem of the Day | on | Reveal/hide the home daily folio. |
| Initial reading size | medium | Reading-mode starting text size. |

---

## Anti-slop guardrails

Do **not** introduce:

- centered hero + rounded search card + three equal feature tiles;
- blue primary buttons;
- purple/cyan gradients;
- glass panels or frosted overlays;
- emoji poet chips;
- fake browser/device chrome;
- poem previews in search cards;
- accent-filled cards or giant accent buttons;
- decorative quote marks around every poem;
- a “collection” UX that makes saved poems feel gamified.

The page should look specific even with all copy removed: folio strip/rail, slips, hairlines, sparse oxblood rubric, literary type, and restrained motion.

---

## What lives in SPEC, not here

Data model and the `Poem` shape · the PoetryDB API and the **metadata-only search** rule · the fetcher and error handling · routing and shareable URLs · poem **identity** and duplicate-title disambiguation · **state architecture** (TanStack Query / Zustand) · **Poem-of-the-Day selection** logic · the **acceptance criteria**. When design and behaviour meet, **`docs/SPEC.md` is authoritative.**
