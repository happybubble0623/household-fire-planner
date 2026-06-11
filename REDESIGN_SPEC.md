# Freedom Path — Visual Redesign Spec

Status: **DRAFT FOR APPROVAL — no application code changed.** This document only.

Grounded in: (a) the 19 reference designs in `/webdesign` (`IMG_8099`–`IMG_8117`), and (b) the current codebase — `src/app/globals.css` (10 tokens, Arial/Helvetica, light-only), `src/components/ui/{button,card,info-popover}.tsx`, `src/components/charts/calculator-charts.tsx` (8 ad‑hoc hex colors), `src/components/planning/{fire-strategy-panel,planning-tool-panel,healthcare-cost-panel,path-to-fire-panel,portfolio-panel}.tsx`.

Palette direction: **white / warm‑grey / green primary**, **gold accent `#f5b301`**, blue noted only as an alternate.

---

## 1. Design principles (finance)

- **Trust through restraint.** Calm surfaces, generous whitespace, one accent. Matches the existing `public/brand/brand-design-philosophy.md` ("Quiet Ascent").
- **Numbers are the hero.** Money is the largest, heaviest, darkest, *tabular* element on screen (refs 8115, 8117, 8107). Labels recede; values dominate.
- **Clarity over decoration.** Charts and tables read at a glance; color encodes meaning (positive/negative/milestone), never just garnish.
- **Legibility first.** AA contrast minimum; ± never encoded by color alone.

---

## 2. Color system

Replaces the 9‑grey + 1‑green token set in `globals.css`. Brand green is anchored so today's `#15803d` becomes **green‑600** and `#166534` becomes **green‑700** (no logo/favicon change needed).

### Green primary ramp
| Token | Hex | Use |
|---|---|---|
| `--green-50` | `#ecfdf3` | tint backgrounds, success pill bg |
| `--green-100` | `#d1fadf` | hover tints, chart area fill top |
| `--green-200` | `#a6f0c2` | borders on green surfaces |
| `--green-300` | `#6ee0a0` | focus ring (replaces `--ring #86efac`) |
| `--green-400` | `#34c77e` | secondary chart series |
| `--green-500` | `#16a34a` | bright accents, positive bars |
| **`--green-600`** | **`#15803d`** | **PRIMARY (current brand)** |
| `--green-700` | `#166534` | primary hover (current `--primary-hover`) |
| `--green-800` | `#14532d` | dark‑green hero bands, pressed |
| `--green-900` | `#0f3d22` | dark surfaces, dark‑mode bg |

### Warm‑neutral grey ramp (replaces default Tailwind cool greys)
Slightly warm (stone/green‑slate undertone) so the chrome reads intentional, not "starter".
| Token | Hex | Replaces | Use |
|---|---|---|---|
| `--bg` | `#f7f7f5` | `#f3f4f6` | page background (warm off‑white) |
| `--surface` | `#ffffff` | white | cards |
| `--neutral-100` | `#efeee9` | `gray-100` | subtle fills, zebra rows |
| `--neutral-200` | `#e4e3dd` | `#e5e7eb` border | borders, dividers |
| `--neutral-300` | `#d3d2ca` | `gray-300` | input borders, disabled |
| `--neutral-400` | `#a8a79d` | `gray-400` | placeholders, icons‑muted |
| `--neutral-500` | `#7c7b71` | `gray-500` | tertiary text |
| `--neutral-600` | `#5c5b53` | — | **secondary text (AA on white)** |
| `--neutral-800` | `#2c2b27` | `#1f2937` | **body / foreground** |
| `--neutral-900` | `#1c1b18` | `gray-900` | headings, KPI values |

Text rule: headings/KPIs = `--neutral-900`; body = `--neutral-800`; secondary = `--neutral-600` (passes AA); never use `--neutral-400/500` for paragraph text.

### Gold accent (the brand doc's "warm spark")
| Token | Hex | Use |
|---|---|---|
| `--gold-50` | `#fff8e6` | warning/highlight pill bg |
| `--gold-100` | `#fdecbf` | milestone band fill |
| **`--gold-400`** | **`#f5b301`** | **accent: FIRE flame, milestone lines, "recommended" badge, highlighted bar** |
| `--gold-600` | `#b07d00` | gold *text* on light (AA — never use `#f5b301` for text) |

### Semantic colors
| Token | Hex | Note |
|---|---|---|
| `--positive` | `#15803d` | gains, surplus, +deltas (text + fill) |
| `--positive-bg` | `#ecfdf3` | positive pill background |
| `--negative` | `#c0392b` | losses, shortfall, −deltas — **replaces `--danger #9f4f46`** (the current brick reads brown, not "loss") |
| `--negative-bg` | `#fdecea` | negative pill background |
| `--neutral-data` | `#7c7b71` | zero / inactive series |
| `--highlight` | `#f5b301` | attention without alarm (e.g. ACA cliff, IRMAA tier) |

### Chart palette (6 swatches, brand‑derived, replaces the ad‑hoc `#3f6f9f / #a9c5dd / #c4b5fd / #eceef1 …` in `calculator-charts.tsx`)
| # | Token | Hex | Typical series |
|---|---|---|---|
| 1 | `--chart-1` | `#15803d` | primary (balance, principal, premiums) |
| 2 | `--chart-2` | `#34c77e` | secondary (growth, contributions) |
| 3 | `--chart-3` | `#f5b301` | accent / milestone / out‑of‑pocket |
| 4 | `--chart-4` | `#0d9488` | teal — third category (subsidy, fees) |
| 5 | `--chart-5` | `#7c7b71` | neutral series, gridline emphasis |
| 6 | `--chart-6` | `#9333ea` | rare 4th+ category (e.g. travel band, replaces `#c4b5fd`) |
| grid | `--chart-grid` | `#e4e3dd` | gridlines (replaces `#eceef1`) |
| down | `--chart-negative` | `#c0392b` | diverging "down" bars / withdrawals |

**Dark‑mode approach:** keep one source of truth. Define the ramps as raw values, then map *semantic* aliases (`--bg`, `--surface`, `--foreground`, `--border`, `--primary`, `--chart-*`) and override only those under `:root[data-theme="dark"]` / `@media (prefers-color-scheme: dark)` (dark bg `--green-900`/`#15140f`, surface `#22211c`, text inverted, charts keep hue but lift lightness). Components reference only semantic aliases so dark mode "just works" (refs 8115, 8116, 8117 ship a dark toggle).

> Alternate (blue) direction, if green is ever reconsidered: primary `#2563eb`, ramp 50→900 analogous, gold accent unchanged. Several refs (8099, 8112, 8113, 8114) use a blue system. **Recommended: stay green** — 8 of 19 refs are green finance brands and it matches the logo + "FIRE".

---

## 3. Typography

Today: `font-family: Arial, Helvetica, sans-serif`, no `next/font`. This is the single biggest "AI‑default" tell.

- **Primary UI font: Inter** (via `next/font/google`, `display: "swap"`), variable, with **tabular figures enabled globally** for the app shell: `font-feature-settings: "tnum" 1, "cv05" 1;`. Free, neutral‑confident, ships tabular lining figures — matches the grotesque feel of 8107/8115/8117. *(Alt: Geist.)*
- **Optional display face for hero H1 only: Fraunces** (a soft serif) to add editorial warmth/identity, used *sparingly* (hub hero, maybe strategy page title). Keeps restraint. If skipped, use Inter 700 at display size.
- **Money/tabular rule:** every monetary value, %, axis label, and table number uses **tabular figures** (`.tabular-nums` utility / `font-variant-numeric: tabular-nums`). Non‑negotiable — it's what makes the projection table and KPI rail read as financial software.

### Type scale
| Role | Size (px / rem) | Weight | Notes |
|---|---|---|---|
| Hero display | 56 / 3.5 | 700 | hub hero (Fraunces or Inter) |
| H1 | 40 / 2.5 | 700 | tool/strategy page title |
| H2 | 30 / 1.875 | 600 | section |
| H3 | 22 / 1.375 | 600 | card title |
| Body‑lg | 18 / 1.125 | 400 | intros |
| Body | 16 / 1 | 400 | default |
| Small | 14 / 0.875 | 500 | helper text |
| Label/caption | 12 / 0.75 | 600 | uppercase, `letter-spacing: 0.04em`, `--neutral-500` |
| **KPI value** | 32 / 2 | 700 | tabular, `--neutral-900` |
| **KPI value — hero** | 48 / 3 | 700 | tabular (e.g. lifetime cost, total balance) |
| Delta chip | 12 / 0.75 | 600 | tabular, in pill |

---

## 4. Component specs

Elevation tiers (introduce hierarchy — today everything is the same `rounded-2xl border border-gray-200 shadow-sm`):
| Tier | Treatment | Used for |
|---|---|---|
| 0 — flat | border `--neutral-200`, no shadow | input fields, in‑card sub‑groups |
| 1 — content | `--surface` + border + `shadow-sm` | standard cards (current default) |
| 2 — elevated | `shadow-md` + optional 2px top accent border in `--green-600`/`--gold-400` | **KPI cards**, result rail |
| 3 — feature | gradient/tinted bg + `rounded-3xl` + `shadow-lg` | hero, "recommended strategy" |

### KPI card — *refs 8115, 8117, 8111, 8107*
Structure: tinted icon chip (green or gold) · **label** (caption, `--neutral-500`, uppercase) · **value** (KPI value, tabular, `--neutral-900`) · **delta chip** (pill: positive `--positive-bg`/`--positive` with ▲, negative `--negative-bg`/`--negative` with ▼; include the arrow + sign so it's not color‑only) · optional sparkline. Tier 2.
Applies to: strategy summary stats (FIRE age, assets, withdrawal rate), all calculator result rails.

### Content card — *current Card*
Keep `rounded-2xl`, swap border to `--neutral-200`, bg `--surface`, `shadow-sm`. Tier 1.

### Input group — *current NumberInput / NumberField*
Keep `rounded-xl`, border `--neutral-300`, focus ring `--green-300` (2px). Label = caption style. Tier 0. No change to behavior (Calculate‑gate, draft logic stays).

### Buttons — *current button.tsx*
| Variant | Style | Use |
|---|---|---|
| primary | `--green-600` bg, white text, hover `--green-700` (current) | main CTA |
| secondary | white, `--neutral-200` border (current) | secondary |
| ghost | text only (current) | tertiary |
| **accent (new)** | `--gold-400` bg, `--neutral-900` text | sparingly — "recommended", upgrade, FIRE CTA |
Keep `min-h-11 rounded-xl`. Add the missing `--primary-dark` is *not needed* (see §9) — hovers already use `--primary-hover`.

### Tables — *refs 8115, 8117, 8116; applies to strategy projection table & portfolio holdings*
- **Sortable headers:** caption style, `--neutral-500`, sort chevron; sticky on scroll with `--neutral-100` fill.
- **Zebra rows:** alternate `--surface` / `--neutral-100`.
- **Color‑coded ± amounts:** `--positive` / `--negative`, right‑aligned, tabular, with explicit `+`/`−` sign.
- **Status pills:** success `--green-50`/`--green-700`, pending `--gold-50`/`--gold-600`, attention `--negative-bg`/`--negative`.
- Row hover: `--green-50` tint.

---

## 5. Data‑viz specs

Recharts already in use; restyle + point at `--chart-*` tokens. Branded **tooltip** everywhere: `--surface` card, `--neutral-200` border, `rounded-xl`, `shadow-md`, tabular values, caption label (refs 8111, 8112, 8117).

| Pattern | Spec | Maps to |
|---|---|---|
| **Area fill under lines** | line `--chart-1`, gradient fill `--green-100`→transparent | Investment balance chart; Healthcare net‑cost line; Strategy net‑worth; Portfolio value *(refs 8111, 8107)* |
| **Rounded / gradient bars** | `radius={[6,6,0,0]}`, subtle vertical gradient per series | Mortgage amortization (principal/interest/fees); Healthcare premiums/OOP stack *(refs 8099, 8107)* |
| **Diverging cash‑flow bars** | income/savings up in `--chart-1`/`--chart-2`, withdrawals down in `--chart-negative`, zero baseline | Strategy year‑by‑year (in vs out) *(ref 8117 Sequence)* |
| **Donut‑with‑center number** | ring of category colors, big tabular value centered, legend rows w/ values + % | **Mortgage monthly‑payment breakdown** (center = `$/mo`); Healthcare cost composition; Portfolio allocation *(refs 8099, 8111, 8116)* |
| **Milestone callouts** | dashed `--gold-400` reference line + small labeled pill | Healthcare **"Medicare 65"** line (currently plain grey `#9ca3af`); Strategy **FIRE‑age** marker on the projection line; SS **62 / FRA / 70** markers *(ref 8111 annotations)* |
| **Highlighted bar + tooltip** | one bar in `--green-600`, others `--green-200`, persistent value callout | Mortgage "will give / will take"; SS claim‑age comparison *(refs 8099, 8111)* |

---

## 6. Hero / brand direction

- **Hub hero (Tier 3):** soft **gradient or sky** treatment — green→mint gradient, or a restrained warm sky (à la Galmora 8107) — behind the existing H1. Render **"FIRE" in `--green-600`** per the brand doc; add a **small `--gold-400` flame/spark** glyph on the word "FIRE" only (the doc's "optional warm spark", validated by Galmora's literal 🔥). One gradient, no clutter.
- **Logo/wordmark:** replace the hand‑inlined SVG in `app-shell.tsx` with the canonical assets in `public/brand/` — **`wordmark.svg`** + **`mark-b.svg`** (the doc's recommended default). "FIRE" already green in the wordmark.
- **FIRE‑flame motif:** gold spark reused *sparingly* — hero word, milestone markers, "recommended strategy" badge. Never a repeating texture.
- **Restraint level:** high. Gradient + one accent + tabular numbers does the work; avoid stock photography except possibly one trust image on the hub (refs 8104/8110 use it tastefully).

---

## 7. Page‑by‑page application

### Home / Hub — `path-to-fire-panel.tsx`
- Tier‑3 gradient hero; H1 in display face; FIRE in green + gold spark.
- Strategy cards: add a lucide icon per card, accent the CTA, hover lift (already partly present).
- Tool cards (4): add icons, tabular hover.
- "Local workbook" status → small KPI‑style chip.

### Calculators — `planning-tool-panel.tsx` + `healthcare-cost-panel.tsx`
- **Healthcare:** result rail → **KPI cards** (lifetime cost as hero KPI 48px, gap/Medicare/subsidy/HSA as tier‑2 KPIs with context); chart gets area fills + **gold dashed "Medicare 65"** milestone; year‑by‑year table → zebra + sortable + ± colors + status‑style phase tags; ACA‑cliff & IRMAA callouts use `--highlight` (gold) / `--negative`.
- **Social Security:** the 62 / FRA / 70 results → **3 KPI cards with the chosen/optimal one highlighted gold**; add a claim‑age **comparison bar** with highlighted bar; FAQ as clean disclosure list.
- **Mortgage:** add the **donut‑with‑center monthly payment** (ref 8099 — near‑identical product); amortization bars rounded + tokenized; payoff totals as KPI cards.
- **Investment:** area chart with gradient fill; contributions‑vs‑growth stacked bars with rounded caps; ending balance as hero KPI.

### Strategy pages — `fire-strategy-panel.tsx`
- The 4 summary stats (FIRE age, FIRE year, assets at FIRE, withdrawal rate) → **proper KPI cards** with delta/context chips (today they're plain text cells).
- **Projection table** → sortable headers, zebra, ± color‑coded, tabular, sticky header.
- Add a **diverging cash‑flow chart** (contributions vs withdrawals by year) + FIRE‑age milestone on the line.
- Keep the new "Refine your estimate" nav card; add icons to its 4 tool links.
- Optional Tier‑3 band showing strategy name + the one headline result.

### Portfolio — `/app/portfolio-lab` → `portfolio-panel.tsx` *(exists; large panel)*
- Allocation **donut‑with‑center total**; holdings **table** restyled per §4; totals as KPI cards. Restyle is mostly token + card/table reuse (no logic change). Flag: this file is ~99 KB — treat as its own Phase‑3 sub‑task.

### App shell — `app-shell.tsx`
- Swap inline logo for brand assets; nav active state uses `--green-50`/`--green-700`; add dark‑mode toggle (Phase 3).

---

## 8. Component / content changes that need approval

These alter look, content, or structure beyond pure restyling — please confirm:

| # | Change | Rationale |
|---|---|---|
| 1 | Replace `--danger #9f4f46` with `--negative #c0392b` | current brick reads brown/"warning", not financial loss |
| 2 | Add **icons** to strategy cards, tool cards, KPI cards (lucide) | refs show iconography aids scannability; today icons are near‑absent |
| 3 | **Gradient/sky hero** on hub + optional one trust photo | adds brand warmth vs flat grey (refs 8104, 8107, 8110) |
| 4 | **Gold flame spark** on the word "FIRE" | activates the brand doc's "warm spark"; on‑theme (8107) |
| 5 | Optional **display serif (Fraunces)** for hero headings | editorial identity; can decline to keep all‑Inter |
| 6 | **Dark mode** | refs 8115/8116/8117 ship it; needs a toggle + token pass |
| 7 | **Mortgage donut** chart (new) alongside/!replacing bar‑only view | ref 8099 is the canonical pattern for this exact tool |
| 8 | Retokenize all **chart colors** (drop ad‑hoc blues/purple) | unifies UI + chart color; current charts use a parallel palette |
| 9 | Possible **KPI label rewording** for brevity to fit cards (e.g. "Gap years total · 15 yrs" → "Pre‑Medicare (15 yrs)") | KPI cards need short labels; confirm wording |
| 10 | "Recommended" **gold badge** on the default strategy (Portfolio Drawdown) | guides new users; adds a content element |

No data, formulas, or calculator logic change in any phase — visual/markup only.

---

## 9. Phased rollout

| Phase | Scope | Effort |
|---|---|---|
| **Phase 1 — Type & numbers** | Add Inter via `next/font`; global **tabular figures**; apply KPI type hierarchy (bigger/bolder/darker values); add green/gold/neutral semantic aliases for hovers. *(Note: the previously‑flagged `--primary-dark` dangling token is already gone — links that used it were removed when nav was consolidated; just confirm hovers use `--primary-hover`.)* | **S — ~0.5–1 day.** Kills ~70% of the "AI‑default" feel. |
| **Phase 2 — Color & tokens** | Implement full ramps (green, warm‑neutral, gold), semantic + `--chart-*` palette in `globals.css`; repoint `calculator-charts.tsx` and components to tokens; replace `--danger`; warm the neutrals. | **M — ~1–2 days.** |
| **Phase 3 — Layout, viz, polish** | Elevation tiers; KPI/card/table restyle; data‑viz (donuts, diverging bars, gradient fills, milestone callouts, branded tooltips); iconography; hero + brand assets; dark mode; portfolio‑panel pass. | **L — ~3–5 days** (portfolio‑panel + dark mode are the long poles). |

> **theme‑factory skill** can generate the cohesive ramps/semantic token set in Phase 2 (and a matching dark variant) — useful as a generator, but nothing is applied to the app until you approve a phase.

---

### Open questions for you
1. Green confirmed as primary (vs the blue alternate)? *(Recommend green.)*
2. Display serif for headings, or all‑Inter? *(Recommend optional serif on hero only.)*
3. Is dark mode in scope now (Phase 3) or deferred?
4. OK to retokenize chart colors (item #8) — i.e. charts will change color?
