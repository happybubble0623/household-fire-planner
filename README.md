# Household FIRE Planner

Household FIRE Planner is a local-first Phase 1 FIRE planning workspace for multi-account households.

Start here for handoff, setup, and current product scope:

```text
docs/AI_HANDOFF.md
```

Canonical current docs:

- `PRD.md` - current Phase 1 product requirements.
- `DESIGN.md` - visual system and UX interaction rules.
- `ARCHITECTURE.md` - technical architecture, data model, service boundaries, and development constraints.
- `docs/AI_HANDOFF.md` - onboarding guide for another AI agent or developer, including which older docs are historical.

Historical docs and older PRDs remain in `docs/` and `freedom_path_full_codex_handoff_prd_v1_7.md`, but they are not the current implementation contract unless `docs/AI_HANDOFF.md` says so.

Current visible app routes:

- `/app/fire-path`
- `/app/portfolio-lab`

Local setup:

```bash
npm install
npm run dev
```

Verification:

```bash
npm test -- --run
npm run lint
npm run build
```

Do not commit `.env.local`. EODHD market data requires:

```bash
EODHD_API_KEY=your_eodhd_key_here
MARKET_DATA_PROVIDER=eodhd
```
