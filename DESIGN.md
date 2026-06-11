# Household FIRE Planner Design System

Status: Canonical current Phase 1 visual and UX guidance  
Last updated: 2026-06-10  
Audience: design reviewers and AI/code agents changing UI

## Design Direction

Household FIRE Planner should feel like a quiet, trustworthy planning workspace, not a marketing site. It should support repeated use, scanning, comparison, and careful financial planning.

Design principles:

- Simple top navigation.
- Few primary surfaces.
- Calm and utilitarian.
- Dense enough for portfolio work, but not visually crowded.
- Transparent planning language.
- Avoid anything that feels like financial advice or a black-box recommendation.

Do not add:

- Sidebar navigation.
- Decorative hero illustrations.
- Gradient orb backgrounds.
- Large marketing landing page.
- Excessive tabs.
- Crowded button rows.
- Repeated caveat banners on every row.

## Color Tokens

Current app-level CSS variables are defined in `src/app/globals.css`.

```css
--background: #f3f4f6;
--foreground: #1f2937;
--muted: #f9fafb;
--muted-foreground: #6b7280;
--border: #e5e7eb;
--primary: #15803d;
--primary-hover: #166534;
--primary-foreground: #ffffff;
--ring: #86efac;
--danger: #9f4f46;
```

Tailwind equivalents:

- Background: `bg-gray-100` / `#f3f4f6`.
- Surface: `bg-white`.
- Muted surface: `bg-gray-50` / `#f9fafb`.
- Main text: `text-gray-900` or `#1f2937`.
- Secondary text: `text-gray-500` / `#6b7280`.
- Border: `border-gray-200` / `#e5e7eb`.
- Primary action: `bg-[var(--primary)]` / `#15803d`.
- Primary hover: `bg-[var(--primary-hover)]` / `#166534`.
- Focus ring: `ring-[var(--ring)]` / `#86efac`.
- Danger/error: `text-[var(--danger)]` / `#9f4f46`.

Do not shift the app into purple/blue-gradient, beige, dark-slate, or high-saturation palettes without a deliberate redesign.

## Typography

Current global font stack:

```css
font-family: Arial, Helvetica, sans-serif;
line-height: 1.5;
```

Guidelines:

- Use `text-4xl md:text-5xl` only for the main workspace headline.
- Use `text-2xl` for section titles.
- Use `text-lg` for card/section headings.
- Use `text-sm leading-relaxed text-gray-500` for explanatory copy.
- Do not use negative letter spacing.
- Do not scale font size with viewport width.
- Avoid long explanatory paragraphs inside operational panels.

## Layout

### Shell

Implemented in `src/components/layout/app-shell.tsx`.

- Sticky top header.
- Brand link: `Household FIRE Planner`.
- Primary nav:
  - `Path to FIRE`
  - `Understand Portfolio`
- Active nav state uses `bg-gray-100 text-gray-900 shadow-sm`.
- Header uses `bg-white/90`, `border-b`, `backdrop-blur`.

### Main Content

Use:

```tsx
<section className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
```

Guidelines:

- Keep page sections unframed when they are whole-page areas.
- Use cards for repeated items, tools, and panels.
- Do not nest cards inside cards.
- Avoid oversized hero sections for the app.
- Home FIRE page can use one intro card, but not a marketing landing page.

### Path To FIRE Mode Pages

The mode input layout should keep:

- Timeline card.
- Money card.
- Assumptions card.
- Optional right-side stack:
  - `Expense Categories (Optional)`
  - `Income Sources (Optional)`

Current grid pattern:

```text
lg:grid-cols-3
xl:grid-cols-[repeat(3,minmax(0,1fr))_minmax(320px,0.95fr)]
```

On large screens the optional stack sits to the right of Assumptions. On smaller screens it spans below the main cards.

## Reusable Components

### Button

File: `src/components/ui/button.tsx`

Base behavior:

- `inline-flex`
- `min-h-11`
- `rounded-xl`
- `px-4 py-2.5`
- `text-sm font-semibold`
- `transition-all duration-200`
- focus ring with `var(--ring)`

Variants:

- `default`: primary green fill.
- `secondary`: white button with border.
- `ghost`: low-emphasis action.

Button rules:

- Use primary buttons for clear completion actions.
- Use secondary for optional utility actions.
- Use ghost for low-risk row actions like delete when the surrounding context is clear.
- Keep hit targets easy to click.
- Avoid tiny icon-only controls unless they have accessible labels and are not critical.

### Card

File: `src/components/ui/card.tsx`

Current card style:

```text
rounded-2xl border border-gray-200 bg-white shadow-sm
```

Use cards for:

- FIRE mode cards.
- Calculator cards.
- Input groups.
- Repeated portfolio/collection items.
- Summary/result panels.

Do not use cards:

- As decorative page-section wrappers inside other cards.
- To create a marketing landing page.

### InfoPopover

File: `src/components/ui/info-popover.tsx`

Behavior:

- Circular info button.
- `aria-label="About {label}"`.
- Click toggles tooltip.
- Escape closes.
- Blur outside closes.
- Tooltip uses `role="tooltip"`.

Use info popovers for:

- FIRE terms.
- Projection table columns.
- Calculation outputs.
- Assumptions with non-obvious meanings.

Do not use info popovers for:

- Obvious labels.
- Long documentation paragraphs.
- Disclaimers that should be visible.

## Interaction Patterns

### Navigation

- FIRE mode cards and calculator cards on `/app/fire-path` open in new tabs/windows.
- The top nav links stay in the same tab.
- Legacy/future routes should not be added to top navigation in Phase 1.

### Optional Progressive Accuracy Sections

`Expense Categories (Optional)` and `Income Sources (Optional)` use native `<details>` sections.

Rules:

- Collapsed by default.
- Expense section appears above income section.
- Both are in the right-side optional stack on wide screens.
- Copy must explain whether detailed rows are active or saved-but-ignored.
- Overrides replace the simple input rather than adding to it.

### Numeric Inputs

Numeric business inputs should be editable text inputs:

```tsx
type="text"
inputMode="decimal"
```

Reason:

- Users must be able to fully clear a value such as `40` before entering a replacement.
- Native number inputs can accidentally change value on scroll.

Rules:

- Preserve the user's in-progress blank value.
- Parse and commit numeric values only when valid.
- Use comma formatting for grouped money fields when not actively editing.
- Use `onWheel={(event) => event.currentTarget.blur()}` where relevant.

### Tables and Long Lists

Rules:

- Detailed holdings table: fixed height and scrollable.
- Focused allocation/holding views: fixed height and scrollable.
- Optional expense/income row tables: bounded height and scrollable.
- Avoid pagination controls for detailed holdings in Phase 1.
- Use sorting for detailed holdings where implemented.

### Portfolio Import/Export

Rules:

- One import control for CSV/XLSX.
- One export control for CSV/XLSX.
- Keep import/export visually secondary.
- Do not show separate prominent buttons for every file type.

### Portfolio Add/Edit Form

Rules:

- Use a segmented switch or similarly fast control for account owner: `User 1`, `User 2`, `Joint`, `Child`.
- Home and liability rows show `Household shared` as the owner and should not ask the user to choose User 1/User 2.
- Use a select control for account type. Do not make account type a free-text field.
- Tax treatment auto-defaults when account type changes, but the user can still override it.
- Keep the user's last selected owner/account type/tax treatment while they add more rows, unless the asset type forces a household/shared default.
- Do not add a visible `Account name` input in Phase 1. The product concept is owner + account type + tax treatment.
- For plan-only holdings without a public ticker, make the manual-balance path obvious and do not force ticker/units.

### Manual EOD Refresh

Rules:

- Refresh is user-triggered by button.
- Do not auto-refresh.
- Unsupported rows should communicate fallback clearly.
- Do not repeat successful market-data warning text on every refreshed row.

## Motion and Transitions

Use restrained interaction motion:

- Buttons and cards may use `hover:-translate-y-0.5`.
- Hover shadow can increase from `shadow-sm` to `shadow-md`.
- Use `transition` or `transition-all duration-200`.
- No large page animations.
- No animated backgrounds.
- No motion that distracts from planning data.

## Loading States

Current local workbook loading state:

- White card.
- `Household FIRE Planner` eyebrow.
- `Loading local workbook` heading.
- Status text from local store.

Use similar loading states for future async work:

- State what is loading.
- Show whether local mode/cloud/API is involved.
- Avoid spinner-only states for important workflows.

## Error States

Error style:

- Use `text-[var(--danger)]`.
- Use domain-specific messages.
- Avoid generic messages like `valid numeric values`.

Examples:

- `Enter units for this market holding before saving.`
- `Current age must be less than life expectancy.`
- `Expense end age must be greater than or equal to start age.`

Rules:

- Show errors near the relevant form section.
- Preserve user-entered values when showing errors.
- For import, report row number and specific issue.
- For market data, show fallback status without blocking manual entry.

## Empty States

Empty states should be quiet and actionable.

Examples:

- Expense categories: `No detailed expense categories yet.`
- Collection panel: explain that selected holdings can be added to a collection.
- Portfolio: show import/add path rather than an empty dashboard.

Rules:

- Do not over-explain features in the app.
- Do not use marketing copy.
- One concise sentence is usually enough.

## Accessibility

Minimum rules:

- Every input needs a label.
- Icon-only buttons need `aria-label`.
- Info popovers need accessible `aria-label` and tooltip semantics.
- Use focus-visible rings.
- Preserve keyboard support for details, links, buttons, and forms.
- Do not rely on color alone for success/failure.

## Visual QA Checklist

Before finishing UI changes:

- Text fits inside buttons and cards on mobile and desktop.
- Top nav has only two visible tabs.
- No overlapping UI elements.
- Buttons remain easy to click.
- Tables do not grow the page endlessly.
- Optional sections remain collapsed by default.
- Info icons open visible content.
- Empty/loading/error states are present for any changed workflow.
- Page still feels like a planning workspace, not a landing page.
