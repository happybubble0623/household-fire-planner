"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { calculatePhase1Fire } from "@/lib/phase1/fire";
import { defaultPhase1Workbook } from "@/lib/phase1/default-workbook";
import type { Phase1FireInputs } from "@/types/phase1";

// Live hero quick-calculator for the WEBSITE landing/hub only. It replaces the
// old static "Sample" KPI card with a real, interactive teaser that runs the
// SAME engine as the strategy pages (src/lib/phase1/fire.ts) — no mock numbers.
//
// Kept deliberately lightweight: four inputs, fixed transparent assumptions
// (7% return, the 4% rule, no inflation, no other income), three headline KPIs.
// For richer scenarios the user clicks through to a full strategy. Gating to the
// website (isAppMode === false) happens in the parent <FireHubStatic />, so the
// app's cold-launch hub still shows its original Sample card untouched.

const FIXED_RETURN_PERCENT = 7;
const FIXED_WITHDRAWAL_PERCENT = 4;

function parseNum(value: string) {
  const n = Number(value.replace(/[^0-9.]/g, ""));
  return Number.isFinite(n) ? n : 0;
}

function formatThousands(value: string) {
  const digits = value.replace(/[^0-9]/g, "");
  if (digits === "") return "";
  return Number(digits).toLocaleString("en-US");
}

function formatCompactCurrency(value: number) {
  const abs = Math.abs(value);
  const sig = (n: number) => Number(n.toFixed(n >= 100 ? 0 : n >= 10 ? 1 : 2)).toString();
  let body: string;
  if (abs < 1000) body = `$${Math.round(abs)}`;
  else if (abs < 1_000_000) body = `$${sig(abs / 1000)}k`;
  else if (abs < 1_000_000_000) body = `$${sig(abs / 1_000_000)}M`;
  else body = `$${sig(abs / 1_000_000_000)}B`;
  return value < 0 ? `-${body}` : body;
}

function clampInt(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, Math.round(value)));
}

const quickCalcCss = `
.aurora-home .hqc{max-width:780px;margin:40px auto 0}
.aurora-home .hqc-head{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:16px 22px 4px;flex-wrap:wrap}
.aurora-home .hqc-live{display:inline-flex;align-items:center;gap:7px;font-size:9.5px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:var(--g700)}
.aurora-home .hqc-dot{width:7px;height:7px;border-radius:50%;background:var(--g500);box-shadow:0 0 0 3px var(--g100)}
.aurora-home .hqc-inputs{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;padding:10px 22px 18px}
.aurora-home .hqc-field label{display:block;font-size:11px;font-weight:600;letter-spacing:.04em;text-transform:uppercase;color:var(--n500);margin-bottom:6px}
.aurora-home .hqc-inwrap{display:flex;align-items:center;min-height:44px;background:#fff;border:1px solid var(--n200);border-radius:11px;padding:0 12px;box-shadow:var(--shadow-sm);transition:.15s}
.aurora-home .hqc-inwrap:focus-within{border-color:var(--g500);box-shadow:0 0 0 3px var(--g100)}
.aurora-home .hqc-inwrap .pfx{font-size:14px;font-weight:600;color:var(--n500);padding-right:2px}
.aurora-home .hqc-inwrap input{width:100%;border:0;outline:none;background:transparent;font-size:16px;font-weight:600;color:var(--n900);min-width:0;font-variant-numeric:tabular-nums}
.aurora-home .hqc-divider{height:1px;background:var(--n200);margin:0 22px}
.aurora-home .hqc-foot{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:14px 22px 16px;flex-wrap:wrap}
.aurora-home .hqc-assume{display:inline-flex;align-items:center;gap:7px;font-size:12px;color:var(--n500)}
.aurora-home .hqc-info{position:relative;display:inline-flex}
.aurora-home .hqc-infobtn{width:18px;height:18px;border-radius:50%;border:1px solid var(--n300);background:#fff;color:var(--n500);font-size:11px;font-weight:700;line-height:1;display:flex;align-items:center;justify-content:center;cursor:help;padding:0}
.aurora-home .hqc-tip{position:absolute;bottom:calc(100% + 8px);left:50%;transform:translateX(-50%);width:248px;background:var(--n900);color:#fff;font-size:12px;font-weight:500;line-height:1.45;letter-spacing:0;text-transform:none;padding:10px 12px;border-radius:10px;box-shadow:0 10px 30px rgba(16,40,24,.25);opacity:0;visibility:hidden;transition:.15s;z-index:5}
.aurora-home .hqc-info:hover .hqc-tip,.aurora-home .hqc-info:focus-within .hqc-tip{opacity:1;visibility:visible}
.aurora-home .hqc-cta{font-size:13px;font-weight:600;color:var(--g700)}
.aurora-home .hqc-cta:hover{text-decoration:underline}
.aurora-home .hqc .kpi .bar{margin-top:9px;height:6px;border-radius:999px;background:var(--n200);overflow:hidden}
.aurora-home .hqc .kpi .bar i{display:block;height:100%;border-radius:999px;background:linear-gradient(90deg,var(--g500),var(--g400))}
@media(max-width:880px){
.aurora-home .hqc-inputs{grid-template-columns:repeat(2,1fr)}
}
`;

export function HeroQuickCalc() {
  const [age, setAge] = useState("35");
  const [assets, setAssets] = useState("150,000");
  const [contributions, setContributions] = useState("30,000");
  const [spending, setSpending] = useState("60,000");

  const view = useMemo(() => {
    const annualExpenses = parseNum(spending);
    const currentFireAssets = parseNum(assets);
    const annualSavingsBeforeFire = parseNum(contributions);
    const ageForCalc = clampInt(parseNum(age) || 0, 18, 80);
    const coastRetirementAge = Math.max(65, ageForCalc + 1);

    if (annualExpenses <= 0) {
      return { ready: false as const };
    }

    const inputs: Phase1FireInputs = {
      ...defaultPhase1Workbook.fireInputs,
      currentAge: ageForCalc,
      currentFireAssets,
      annualSavingsBeforeFire,
      annualExpenses,
      // Transparent fixed assumptions for the teaser: no inflation, no other
      // income, the 4% rule and a 7% return — exactly what the caption states.
      expensesInflationAdjusted: false,
      annualPassiveGuaranteedIncome: 0,
      passiveGuaranteedIncomeInflationAdjusted: false,
      useIncomeSourcesOverride: false,
      incomeSources: [],
      useExpenseCategoriesOverride: false,
      expenseCategories: [],
      inflationRatePercent: 0,
      expectedAnnualPortfolioReturnPercent: FIXED_RETURN_PERCENT,
      withdrawalRatePercent: FIXED_WITHDRAWAL_PERCENT,
      coastRetirementAge,
      taxMode: "none",
      simpleEffectiveTaxRatePercent: 0,
      homeSaleAge: 0,
      homeSaleProceeds: 0
    };

    let result;
    try {
      result = calculatePhase1Fire(inputs);
    } catch {
      return { ready: false as const };
    }

    const coast = result.coastFire;
    // With inflation off and no other income, the engine's FIRE number at
    // retirement is the clean 4% rule figure: spending ÷ 4% = 25× spending.
    const fireNumber = coast.fireNumberAtRetirement;
    const fireProgress =
      fireNumber <= 0 ? 0 : Math.min(100, (currentFireAssets / fireNumber) * 100);
    const remaining = Math.max(0, fireNumber - currentFireAssets);

    const coastProgress =
      coast.coastNumber <= 0
        ? 100
        : Math.min(100, (currentFireAssets / coast.coastNumber) * 100);

    return {
      ready: true as const,
      fireNumber,
      fireProgress,
      remaining,
      coastProgress,
      reachedCoast: coast.reachedCoast,
      coastAge: coast.coastAge
    };
  }, [age, assets, contributions, spending]);

  return (
    <div className="glass floatkpi hqc">
      <style dangerouslySetInnerHTML={{ __html: quickCalcCss }} />

      <div className="hqc-head">
        <span className="hqc-live">
          <span className="hqc-dot" aria-hidden="true" /> Live estimate
        </span>
      </div>

      <div className="hqc-inputs">
        <div className="hqc-field">
          <label htmlFor="hqc-age">Your age</label>
          <div className="hqc-inwrap">
            <input
              id="hqc-age"
              type="text"
              inputMode="numeric"
              value={age}
              onChange={(event) => setAge(event.target.value.replace(/[^0-9]/g, ""))}
              onWheel={(event) => event.currentTarget.blur()}
              aria-label="Your current age"
            />
          </div>
        </div>
        <div className="hqc-field">
          <label htmlFor="hqc-assets">Invested now</label>
          <div className="hqc-inwrap">
            <span className="pfx">$</span>
            <input
              id="hqc-assets"
              type="text"
              inputMode="numeric"
              value={assets}
              onChange={(event) => setAssets(formatThousands(event.target.value))}
              onWheel={(event) => event.currentTarget.blur()}
              aria-label="Current invested assets"
            />
          </div>
        </div>
        <div className="hqc-field">
          <label htmlFor="hqc-contrib">Saving / yr</label>
          <div className="hqc-inwrap">
            <span className="pfx">$</span>
            <input
              id="hqc-contrib"
              type="text"
              inputMode="numeric"
              value={contributions}
              onChange={(event) => setContributions(formatThousands(event.target.value))}
              onWheel={(event) => event.currentTarget.blur()}
              aria-label="Annual contributions"
            />
          </div>
        </div>
        <div className="hqc-field">
          <label htmlFor="hqc-spend">Spending / yr</label>
          <div className="hqc-inwrap">
            <span className="pfx">$</span>
            <input
              id="hqc-spend"
              type="text"
              inputMode="numeric"
              value={spending}
              onChange={(event) => setSpending(formatThousands(event.target.value))}
              onWheel={(event) => event.currentTarget.blur()}
              aria-label="Annual retirement spending"
            />
          </div>
        </div>
      </div>

      <div className="hqc-divider" aria-hidden="true" />

      <div className="kpis" aria-live="polite">
        <div className="kpi">
          <div className="l">Your FIRE number</div>
          <div className="n tnum">{view.ready ? formatCompactCurrency(view.fireNumber) : "—"}</div>
          <div className="d">{view.ready ? "Spending ÷ 4% (25×)" : "Enter your spending"}</div>
        </div>
        <div className="kpi">
          <div className="l">Progress to FIRE</div>
          <div className="n tnum">{view.ready ? `${Math.round(view.fireProgress)}%` : "—"}</div>
          <div className="bar" aria-hidden="true">
            <i style={{ width: `${view.ready ? view.fireProgress : 0}%` }} />
          </div>
          <div className="d">
            {view.ready
              ? view.fireProgress >= 100
                ? "You're there 🎉"
                : `${formatCompactCurrency(view.remaining)} to go`
              : "—"}
          </div>
        </div>
        <div className="kpi">
          <div className="l">Coast progress</div>
          <div className="n tnum">{view.ready ? `${Math.round(view.coastProgress)}%` : "—"}</div>
          <div className="bar" aria-hidden="true">
            <i style={{ width: `${view.ready ? view.coastProgress : 0}%` }} />
          </div>
          <div className="d">
            {view.ready
              ? view.reachedCoast
                ? "Coasting now ✓"
                : view.coastAge != null
                  ? `Coast by age ${view.coastAge}`
                  : "Keep investing"
              : "—"}
          </div>
        </div>
      </div>

      <div className="hqc-divider" aria-hidden="true" />

      <div className="hqc-foot">
        <span className="hqc-assume">
          Assumes 7% return, 4% rule
          <span className="hqc-info">
            <button
              type="button"
              className="hqc-infobtn"
              aria-label="About these assumptions"
            >
              i
            </button>
            <span className="hqc-tip" role="tooltip">
              A quick estimate using a fixed 7% annual return and the 4% rule (your
              FIRE number is 25× annual spending). Today&rsquo;s dollars — no inflation,
              taxes, or other income. Open a strategy for the full picture.
            </span>
          </span>
        </span>
        <Link href="#strategies" className="hqc-cta">
          Map your full path →
        </Link>
      </div>
    </div>
  );
}
