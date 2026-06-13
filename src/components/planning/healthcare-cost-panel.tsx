"use client";

import { useMemo, useState, type ReactNode } from "react";
import { Card } from "@/components/ui/card";
import { InfoPopover } from "@/components/ui/info-popover";
import { HealthcareCostChart } from "@/components/charts/calculator-charts";
import {
  CalculateBar,
  NumberInput,
  ResultCard,
  ToolShell,
  formatCurrency,
  percentToDecimal,
  useCalculateGate
} from "@/components/planning/planning-tool-panel";
import {
  applyMetalTierPreset,
  estimateBenchmarkPremium,
  estimateHealthcareCosts,
  medigapPlanEstimate,
  type HealthcareCostInput,
  type HealthcareHousehold,
  type HsaStrategy,
  type MedicareCoverage,
  type OopUsage,
  type TravelMode
} from "@/lib/calculations/healthcare-cost";
import {
  csrSilverOopMaxPerPerson,
  DEFAULT_DENTAL_VISION_HEARING_ANNUAL,
  federalPovertyLevel,
  medicaidIncomeThreshold,
  subsidyCliffIncome
} from "@/lib/calculations/healthcare-data";
import type { MetalTier, OopUsageLevel, RegionCostLevel } from "@/lib/calculations/healthcare-data";

function SelectField<T extends string>({
  id,
  label,
  value,
  onChange,
  options,
  help,
  note
}: {
  id: string;
  label: string;
  value: T;
  onChange: (value: T) => void;
  options: Array<{ value: T; label: string }>;
  help?: string;
  // Always-visible basis/caption text under the field (see NumberInput's note).
  note?: ReactNode;
}) {
  return (
    <div>
      <div className="flex items-center gap-1.5 text-sm font-medium text-gray-800">
        <label htmlFor={id}>{label}</label>
        {help ? <InfoPopover label={label} content={help} /> : null}
      </div>
      <select
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value as T)}
        className="mt-2 min-h-12 w-full rounded-xl border border-gray-200 bg-white px-4 py-2 text-base font-medium text-gray-900 shadow-sm focus:border-[var(--primary)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {note ? <p className="mt-1.5 text-xs leading-relaxed text-gray-500">{note}</p> : null}
    </div>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <details className="rounded-xl border border-gray-200 bg-gray-50 p-4">
      <summary className="cursor-pointer text-sm font-semibold text-gray-800">{title}</summary>
      <div className="mt-4 grid gap-4">{children}</div>
    </details>
  );
}

function Callout({ tone, children }: { tone: "amber" | "gray"; children: ReactNode }) {
  // "amber" = attention without alarm — the gold highlight tokens (spec §2).
  const className =
    tone === "amber"
      ? "rounded-2xl border border-[var(--gold-border)] bg-[var(--gold-bg)] p-5 text-sm leading-relaxed text-[var(--gold-text)] shadow-sm"
      : "rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 text-sm leading-relaxed text-gray-500 shadow-sm";
  return <p className={className}>{children}</p>;
}

// Two-card summary band shown directly above a result table (REDESIGN). Each is
// a clean white tile: muted label, value below at ~19px/500. The value color
// follows the same green-positive / red-negative rule the tables use
// (gains/assets = green; costs/spend/shortfall = red); "neutral" stays dark.
function SummaryCard({
  label,
  value,
  tone = "neutral"
}: {
  label: string;
  value: string;
  tone?: "neutral" | "positive" | "negative";
}) {
  const valueClass =
    tone === "positive"
      ? "text-[var(--positive)]"
      : tone === "negative"
        ? "text-[var(--negative)]"
        : "text-gray-900";
  return (
    <div className="rounded-lg border border-[var(--border)] bg-white p-4 shadow-sm">
      <p className="text-xs font-medium text-gray-500">{label}</p>
      <p className={`mt-1 text-[19px] font-medium leading-tight tabular-nums ${valueClass}`}>
        {value}
      </p>
    </div>
  );
}

function oopUsageValue(level: OopUsageLevel, custom: number): OopUsage {
  return custom > 0 ? { expectedAnnualOop: custom } : level;
}

export function HealthcareCostPanel() {
  const [household, setHousehold] = useState<HealthcareHousehold>("single");
  const [currentAge, setCurrentAge] = useState(50);
  const [fireAge, setFireAge] = useState(55);
  const [medicareAge, setMedicareAge] = useState(65);
  const [planToAge, setPlanToAge] = useState(90);
  const [displayMode, setDisplayMode] = useState<"today_dollars" | "future_dollars">(
    "today_dollars"
  );
  const [annualMagi, setAnnualMagi] = useState(60_000);

  // ACA — two ways to set the plan numbers. "estimate" (default) derives the
  // benchmark internally from age + area band and fills plan economics from a
  // metal tier; "exact" exposes the manual healthcare.gov fields.
  const [acaPlanMode, setAcaPlanMode] = useState<"estimate" | "exact">("estimate");
  const [metalTier, setMetalTier] = useState<MetalTier>("silver");
  const [regionCost, setRegionCost] = useState<RegionCostLevel>("average");
  const [benchmarkSlcspMonthly, setBenchmarkSlcspMonthly] = useState(650);
  const [chosenPlanMonthly, setChosenPlanMonthly] = useState(600);
  const [acaDeductible, setAcaDeductible] = useState(5_000);
  const [acaOutOfPocketMax, setAcaOutOfPocketMax] = useState(10_600);
  const [acaUsage, setAcaUsage] = useState<OopUsageLevel>("moderate");
  const [acaCustomOop, setAcaCustomOop] = useState(0);
  const [acaInflationPercent, setAcaInflationPercent] = useState(5.5);

  // Medicare
  const [medicareCoverage, setMedicareCoverage] = useState<MedicareCoverage>("medigap");
  const [medigapPlanLetter, setMedigapPlanLetter] = useState("G");
  const [medigapMonthly, setMedigapMonthly] = useState(155);
  const [partDMonthly, setPartDMonthly] = useState(40);
  const [advantageMonthly, setAdvantageMonthly] = useState(15);
  const [medicareOutOfPocketMax, setMedicareOutOfPocketMax] = useState(6_000);
  const [medicareUsage, setMedicareUsage] = useState<OopUsageLevel>("moderate");
  const [medicareCustomOop, setMedicareCustomOop] = useState(0);
  const [dentalVisionHearing, setDentalVisionHearing] = useState(
    DEFAULT_DENTAL_VISION_HEARING_ANNUAL
  );
  const [medicareInflationPercent, setMedicareInflationPercent] = useState(5);
  const [generalInflationPercent, setGeneralInflationPercent] = useState(3);

  // HSA
  const [hsaBalance, setHsaBalance] = useState(0);
  const [hsaGrowthPercent, setHsaGrowthPercent] = useState(4);
  const [hsaStrategy, setHsaStrategy] = useState<HsaStrategy>("off");

  // Travel
  const [travelMode, setTravelMode] = useState<TravelMode>("off");
  const [daysAbroadPerYear, setDaysAbroadPerYear] = useState(0);
  const [travelAnnualPremium, setTravelAnnualPremium] = useState(0);

  // Derived ACA plan economics for the default "estimate" mode. The benchmark
  // uses each covered adult's age at the start of the ACA phase (premiums are
  // age-rated); the metal tier fills the chosen-plan numbers from presets.
  const people = household === "couple" ? 2 : 1;
  const acaPhaseStartAge = Math.max(currentAge, Math.min(fireAge, 64));
  const estimatedBenchmarkMonthly = estimateBenchmarkPremium({
    ages: Array.from({ length: people }, () => acaPhaseStartAge),
    region: regionCost
  });
  const tierFill = applyMetalTierPreset({
    tier: metalTier,
    benchmarkMonthly: estimatedBenchmarkMonthly,
    people
  });
  const isEstimateMode = acaPlanMode === "estimate";
  const effectiveBenchmarkMonthly = isEstimateMode ? estimatedBenchmarkMonthly : benchmarkSlcspMonthly;
  const effectiveChosenPlanMonthly = isEstimateMode ? tierFill.chosenPlanMonthly : chosenPlanMonthly;
  const effectiveAcaDeductible = isEstimateMode ? tierFill.acaDeductible : acaDeductible;
  const effectiveAcaOopMax = isEstimateMode ? tierFill.acaOutOfPocketMax : acaOutOfPocketMax;
  // CSR-reduced Silver out-of-pocket max for the live inputs, shown in the
  // estimate summary so the number on screen matches what the engine applies.
  const liveIncomePctFpl = annualMagi / federalPovertyLevel(people);
  const csrLiveOopMaxPerPerson =
    isEstimateMode && metalTier === "silver" ? csrSilverOopMaxPerPerson(liveIncomePctFpl) : null;
  const displayAcaOopMax =
    csrLiveOopMaxPerPerson !== null ? csrLiveOopMaxPerPerson * people : effectiveAcaOopMax;

  // Live per-letter estimates at the chosen usage, from the entered Plan-G base.
  // Computed with the same engine helper the projection uses, so the picker can
  // never drift from the modeled numbers. The array drives the G/N/F comparison
  // table; the selected letter's row also feeds the headline preview line.
  const medigapUsage = oopUsageValue(medicareUsage, medicareCustomOop);
  const medigapPlanComparison = ["G", "N", "F"].map((letter) => {
    const est = medigapPlanEstimate({
      baseMonthlyPremium: medigapMonthly,
      planLetter: letter,
      usage: medigapUsage
    });
    return {
      letter,
      monthly: est.effectiveMonthlyPremium,
      oopYr: est.annualMedicalOutOfPocket,
      // Apples-to-apples plan-choice cost: premium + medical out-of-pocket only.
      // Part B, Part D, IRMAA and dental/vision/hearing are identical across
      // letters, so they're excluded here.
      comparableYr: est.effectiveMonthlyPremium * 12 + est.annualMedicalOutOfPocket
    };
  });
  const selectedPlan =
    medigapPlanComparison.find((plan) => plan.letter === medigapPlanLetter) ??
    medigapPlanComparison[0];
  const medigapPreviewMonthly = selectedPlan.monthly;
  const medigapPreviewOop = selectedPlan.oopYr;
  // Lowest premium + out-of-pocket letter at the current usage — surfaces the
  // crossover (Plan N at low/moderate, Plan G catching up at high).
  const cheapestPlanLetter = medigapPlanComparison.reduce((min, plan) =>
    plan.comparableYr < min.comparableYr ? plan : min
  ).letter;

  const liveInput = useMemo<HealthcareCostInput>(
    () => ({
      household,
      currentAge,
      fireAge,
      medicareAge,
      planToAge,
      annualMagi,
      benchmarkSlcspMonthly: effectiveBenchmarkMonthly,
      chosenPlanMonthly: effectiveChosenPlanMonthly,
      acaDeductible: effectiveAcaDeductible,
      acaOutOfPocketMax: effectiveAcaOopMax,
      acaOopUsage: oopUsageValue(acaUsage, acaCustomOop),
      acaInflation: percentToDecimal(acaInflationPercent),
      // CSR (reduced Silver OOP max) only applies when we know the tier is
      // Silver — i.e. in estimate mode. Exact mode uses the entered OOP max.
      acaMetalTier: isEstimateMode ? metalTier : undefined,
      medicareCoverage,
      medigapMonthly,
      medigapPlanLetter,
      partDMonthly,
      advantageMonthly,
      medicareOutOfPocketMax,
      medicareOopUsage: oopUsageValue(medicareUsage, medicareCustomOop),
      dentalVisionHearingAnnual: dentalVisionHearing,
      medicareInflation: percentToDecimal(medicareInflationPercent),
      generalInflation: percentToDecimal(generalInflationPercent),
      hsaBalance,
      hsaGrowth: percentToDecimal(hsaGrowthPercent),
      hsaStrategy,
      travelMode,
      daysAbroadPerYear,
      travelAnnualPremium
    }),
    [
      household,
      currentAge,
      fireAge,
      medicareAge,
      planToAge,
      annualMagi,
      effectiveBenchmarkMonthly,
      effectiveChosenPlanMonthly,
      effectiveAcaDeductible,
      effectiveAcaOopMax,
      acaUsage,
      acaCustomOop,
      acaInflationPercent,
      isEstimateMode,
      metalTier,
      medicareCoverage,
      medigapMonthly,
      medigapPlanLetter,
      partDMonthly,
      advantageMonthly,
      medicareOutOfPocketMax,
      medicareUsage,
      medicareCustomOop,
      dentalVisionHearing,
      medicareInflationPercent,
      generalInflationPercent,
      hsaBalance,
      hsaGrowthPercent,
      hsaStrategy,
      travelMode,
      daysAbroadPerYear,
      travelAnnualPremium
    ]
  );

  const gate = useCalculateGate(liveInput);
  const committedInput = gate.value;
  const result = useMemo(() => estimateHealthcareCosts(committedInput), [committedInput]);

  const usageOptions: Array<{ value: OopUsageLevel; label: string }> = [
    { value: "low", label: "Low (healthy year)" },
    { value: "moderate", label: "Moderate (typical)" },
    { value: "high", label: "High (heavy usage)" }
  ];

  // The headline is a present value in today's dollars by default. The toggle
  // switches the same lifetime figure to a labeled future (inflated)
  // cumulative total — clearly flagged as not comparable to published estimates,
  // which are quoted in today's dollars. The engine returns a single basis-
  // independent (future-dollar) series, so flipping the basis is a pure view
  // change: it re-renders instantly with no recompute and no Recalculate.
  const isToday = displayMode === "today_dollars";
  const totalYears = result.acaYears + result.medicareYears;
  const heroValue = isToday ? result.presentValueTotal : result.nominalLifetimeTotal;
  // Per-year rows in the selected basis: as-is for future dollars, or
  // each year's discounted present value for today's dollars. Summing the
  // today's-dollar rows reproduces the headline (presentValueTotal), so the
  // year-by-year breakdown visibly adds up to it.
  const displayRows = useMemo(
    () =>
      result.rows.map((row) => {
        const m = isToday ? row.presentValueDeflator : 1;
        return {
          ...row,
          premium: row.premium * m,
          subsidy: row.subsidy * m,
          // The displayed out-of-pocket folds in dental/vision/hearing (a real
          // 65+ cost the engine tracks separately to keep the per-plan medical
          // OOP honest). Folding it here makes the table's Net column and the
          // chart's stacked bars reconcile: premium + shown-OOP (+ travel) − HSA
          // = net, with no hidden DVH gap. The plan-picker preview above still
          // shows medical-only OOP for an apples-to-apples letter comparison.
          outOfPocket: (row.outOfPocket + row.dvh) * m,
          travelPremium: row.travelPremium * m,
          hsaDraw: row.hsaDraw * m,
          grossCost: row.grossCost * m,
          netPortfolioCost: row.netPortfolioCost * m
        };
      }),
    [result.rows, isToday]
  );
  // Reconciling totals for the breakdown footer, in the displayed basis:
  // net + HSA used = gross, and gross equals the hero headline.
  const displayGrossTotal = displayRows.reduce((sum, row) => sum + row.grossCost, 0);
  const displayHsaUsedTotal = displayRows.reduce((sum, row) => sum + row.hsaDraw, 0);
  const displayNetTotal = displayRows.reduce((sum, row) => sum + row.netPortfolioCost, 0);
  // Largest net-cost row, used to scale the inline bar behind each Net value so
  // the table reads as a shape, not just a column of numbers (REDESIGN §2).
  const displayMaxNet = displayRows.reduce((max, row) => Math.max(max, row.netPortfolioCost), 0);
  const medicareTransitionAge = committedInput.medicareAge || 65;
  // Average per year is derived from the displayed headline so that
  // avg × years ≈ headline in either basis.
  const avgPerYear = totalYears > 0 ? heroValue / totalYears : 0;
  // Phase splits stay on the same basis as the hero so the two cards add up to
  // it (PV split in today's mode; future-dollar split in future mode).
  const acaPhaseValue = isToday ? result.presentValueAcaCost : result.totalAcaCost;
  const medicarePhaseValue = isToday ? result.presentValueMedicareCost : result.totalMedicareCost;
  // Dental/vision/hearing slice of the lifetime total, in the displayed basis —
  // part of the Medicare total above, surfaced as its own labeled line.
  const dvhLifetime = isToday ? result.presentValueDvhCost : result.nominalDvhCost;
  const lowIncome = result.medicaidEligiblePre65 || result.medicareLowIncome;
  // FPL threshold dollars for the eligibility callouts, computed from the
  // committed household size (so the wording matches the result it explains) via
  // the single source of truth in healthcare-data.ts — no inline FPL numbers.
  const committedHouseholdSize = committedInput.household === "couple" ? 2 : 1;
  const cliffIncomeDollars = subsidyCliffIncome(committedHouseholdSize);
  const medicaidIncomeDollars = medicaidIncomeThreshold(committedHouseholdSize);
  // Plain-language explanation of the fixed 3% real discount rate, formatted
  // from the value the engine returns (never hardcoded in the copy).
  const discountRatePct = `${Math.round(result.realDiscountRate * 100)}%`;
  const todayDollarsExplainer = `Today's dollars = the lump sum you'd set aside now, assuming it grows about ${discountRatePct} a year faster than inflation until it's spent. It's a discounted present value, not just an inflation-adjusted sum. Future dollars show the actual amounts you'd pay in each future year, once prices have risen with inflation.`;

  // Mode-aware basis note shared by the three money-column tooltips. All three
  // columns follow the "Show amounts in" toggle and share one basis: today's
  // dollars = each year's discounted present value; future dollars = the actual
  // sticker price that year.
  const columnBasisNote = isToday
    ? ` These amounts follow the "Show amounts in" toggle. You're viewing today's dollars, so each figure is a present value — what that future year's cost is worth in today's money after discounting.`
    : ` These amounts follow the "Show amounts in" toggle. You're viewing future dollars, so each figure is the actual amount you'd pay that year, once prices have risen with inflation.`;
  const premiumColumnInfo = `The insurance premium for that year — an ACA marketplace plan before 65, or Medicare (Part B + Medigap + Part D) after 65 — after any subsidy is taken off.${columnBasisNote}`;
  const oopColumnInfo = `Out-of-pocket: what you expect to spend on care beyond premiums that year — deductibles, copays, and coinsurance — plus routine dental, vision & hearing in the Medicare years, which Original Medicare doesn't cover. Medicare Advantage caps the medical share at your plan's out-of-pocket maximum; Original Medicare + Medigap has no annual cap.${columnBasisNote}`;
  const netCostColumnInfo = `Net cost = premium + out-of-pocket (which includes dental/vision/hearing after 65) plus any travel/global premium for that year, minus any HSA funds applied. It's what actually comes out of pocket that year.${columnBasisNote}`;

  return (
    <ToolShell
      title="Retirement healthcare cost calculator"
      currentTool="healthcare"
      description="Estimate medical costs after you stop working — across the pre-Medicare ACA gap years and the Medicare years — including ACA subsidies, IRMAA surcharges, HSA drawdown, and travel/abroad coverage."
    >
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(320px,0.8fr)]">
        <Card className="grid gap-4 p-6 sm:p-7">
          <SelectField
            id="hc-household"
            label="Household"
            value={household}
            onChange={setHousehold}
            options={[
              { value: "single", label: "Single" },
              { value: "couple", label: "Couple (two people)" }
            ]}
            help="Couple doubles per-person Medicare premiums and uses the two-person Federal Poverty Level for ACA subsidies. A single age track is used for both members (staggered Medicare ages are not modeled)."
          />
          <NumberInput
            id="hc-current-age"
            label="Current age"
            value={currentAge}
            onChange={setCurrentAge}
            help="Used as the base year for inflating costs. Costs are projected from today to each future age."
            note="Starting example — set to your age."
          />
          <NumberInput
            id="hc-fire-age"
            label="FIRE / retirement age"
            value={fireAge}
            onChange={setFireAge}
            help="The age employer coverage ends and the ACA gap-year phase begins. If at or above the Medicare age, the ACA phase is skipped."
            note="Starting example — set to the age you'd stop working."
          />
          <NumberInput
            id="hc-medicare-age"
            label="Medicare age"
            value={medicareAge}
            onChange={setMedicareAge}
            help="The age Medicare begins — 65 for almost everyone. Editable only for rare edge cases."
            note="Default 65 — Medicare eligibility age (CMS). Leave as-is unless you have a special case."
          />
          <NumberInput
            id="hc-plan-to-age"
            label="Plan to age"
            value={planToAge}
            onChange={setPlanToAge}
            help="The final age in the projection (life expectancy)."
            note="Default 90 — a conservative longevity horizon (above the ~mid-80s U.S. life expectancy at 65, SSA)."
          />
          <NumberInput
            id="hc-magi"
            label="Annual retirement MAGI"
            value={annualMagi}
            onChange={setAnnualMagi}
            step={1000}
            help="Modified adjusted gross income in retirement (Roth conversions, dividends, capital gains, any earned income). Drives both the ACA subsidy and the Medicare IRMAA tier."
            note="Starting example — set to your planned retirement income. Drives both the ACA subsidy and the IRMAA tier."
          />
          <Section title="ACA gap years (pre-65)">
            <SelectField
              id="hc-aca-plan-mode"
              label="How to set plan costs"
              value={acaPlanMode}
              onChange={setAcaPlanMode}
              options={[
                { value: "estimate", label: "Estimate from typical plans (recommended)" },
                { value: "exact", label: "Use my exact plan from healthcare.gov" }
              ]}
              help="Estimate builds typical premiums from your age, area, and a plan tier — no lookup needed. Use exact mode once you've window-shopped real quotes on healthcare.gov."
            />
            {acaPlanMode === "estimate" ? (
              <>
                <SelectField
                  id="hc-metal-tier"
                  label="Plan tier"
                  value={metalTier}
                  onChange={setMetalTier}
                  options={[
                    { value: "bronze", label: "Bronze — lowest premium, highest deductible" },
                    { value: "silver", label: "Silver — balanced (most popular)" },
                    { value: "gold", label: "Gold — highest premium, lowest deductible" }
                  ]}
                  help="Marketplace plans come in metal tiers. Bronze ≈ 80% of the benchmark premium with a ~$7,500 deductible; Silver ≈ the benchmark with ~$5,000; Gold ≈ 120% with ~$1,500. Pick Silver if unsure."
                  note="Default Silver — the most-chosen tier and the one ACA subsidies are benchmarked to (KFF)."
                />
                <SelectField
                  id="hc-region-cost"
                  label="Area cost level"
                  value={regionCost}
                  onChange={setRegionCost}
                  options={[
                    { value: "low", label: "Lower-cost area (≈ −22%)" },
                    { value: "average", label: "Average US area" },
                    { value: "high", label: "Higher-cost area (≈ +25%)" }
                  ]}
                  help="Premiums vary by rating area. Large metro areas with hospital competition often run lower; rural areas and some states run higher. Pick Average if unsure."
                  note="Default Average — premiums vary roughly ±25% by rating area (KFF/CMS)."
                />
                <div className="rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm leading-relaxed text-gray-600">
                  <p className="font-medium text-gray-800">Estimated from your inputs</p>
                  <p className="mt-1">
                    Benchmark silver premium: {formatCurrency(estimatedBenchmarkMonthly)}/mo ·
                    Your {metalTier} plan: {formatCurrency(effectiveChosenPlanMonthly)}/mo ·
                    Deductible: {formatCurrency(effectiveAcaDeductible)} ·
                    Out-of-pocket max: {formatCurrency(displayAcaOopMax)}
                  </p>
                  {csrLiveOopMaxPerPerson !== null ? (
                    <p className="mt-1 text-xs font-medium text-[var(--primary-hover)]">
                      Cost-Sharing Reduction applied: at {Math.round(liveIncomePctFpl * 100)}% of the
                      Federal Poverty Level, a Silver plan&apos;s out-of-pocket max is reduced to{" "}
                      {formatCurrency(displayAcaOopMax)} (2026 CSR rule, Fed. Register 2025-11606).
                    </p>
                  ) : null}
                  <p className="mt-1 text-xs text-gray-500">
                    Based on age {acaPhaseStartAge} at FIRE{household === "couple" ? " (×2 adults)" : ""}, CMS
                    age rating, and national averages. Switch to exact mode to enter real quotes.
                  </p>
                </div>
              </>
            ) : (
              <>
                <p className="text-xs leading-relaxed text-gray-500">
                  Where to find these: healthcare.gov → &ldquo;See plans &amp; prices&rdquo; → enter
                  ZIP, ages, and income → the benchmark is the second-cheapest Silver plan&rsquo;s
                  full price; the other numbers are on the card of the plan you&rsquo;d pick.
                </p>
                <NumberInput
                  id="hc-benchmark"
                  label="Benchmark silver premium (monthly, household)"
                  value={benchmarkSlcspMonthly}
                  onChange={setBenchmarkSlcspMonthly}
                  step={10}
                  help="The full (unsubsidized) monthly price of the second-cheapest Silver plan for your household. This sets your subsidy size — it isn't necessarily the plan you buy."
                  note="Example only — look up your exact SLCSP on HealthCare.gov (it sets your subsidy size)."
                />
                <NumberInput
                  id="hc-chosen-premium"
                  label="Chosen plan premium (monthly, household)"
                  value={chosenPlanMonthly}
                  onChange={setChosenPlanMonthly}
                  step={10}
                  help="The full pre-subsidy monthly price of the plan you'd actually buy. Your subsidy is subtracted from this."
                  note="Example only — enter the full price of the plan you'd actually buy."
                />
                <NumberInput
                  id="hc-aca-deductible"
                  label="ACA plan deductible"
                  value={acaDeductible}
                  onChange={setAcaDeductible}
                  step={100}
                  help="What you pay for care each year before the plan starts paying. Shown for plan comparison — the cost estimate uses the out-of-pocket maximum below."
                  note="Example only — a mid-range Silver deductible; use your plan's figure."
                />
                <NumberInput
                  id="hc-aca-oop-max"
                  label="ACA out-of-pocket maximum"
                  value={acaOutOfPocketMax}
                  onChange={setAcaOutOfPocketMax}
                  step={100}
                  help="The legal cap on what you pay for covered care in a year. Your expected spend is estimated as a share of this."
                  note="Default $10,600 — the 2026 ACA cap for self-only coverage ($21,200 family); HHS revised limits. Lower it to your plan's max."
                />
              </>
            )}
            <SelectField
              id="hc-aca-usage"
              label="Expected care usage"
              value={acaUsage}
              onChange={setAcaUsage}
              options={usageOptions}
              help="How much care you expect in a typical year. Low ≈ 15% of the out-of-pocket max (rarely see a doctor), Moderate ≈ 30% (regular prescriptions, some visits — most people don't approach their max in a typical year), High ≈ 85% (chronic condition or planned procedures)."
            />
            <NumberInput
              id="hc-aca-custom-oop"
              label="Or explicit annual out-of-pocket (0 = use preset)"
              value={acaCustomOop}
              onChange={setAcaCustomOop}
              step={100}
              help="Know your actual yearly medical spend? Enter it here to replace the usage preset. Leave 0 to use the preset."
            />
            <NumberInput
              id="hc-aca-inflation"
              label="ACA medical inflation"
              value={acaInflationPercent}
              onChange={setAcaInflationPercent}
              suffix="%"
              step={0.1}
              help="How fast premiums and care costs grow per year. Marketplace premiums have averaged ~5–6%/yr; lower it to ~4% for a conservative-cost view."
              note="Default 5.5%/yr — recent marketplace premium trend (KFF). Lower to ~4% for a conservative view."
            />
          </Section>

          <Section title="Medicare years (65+)">
            <p className="rounded-xl border border-gray-200 bg-white px-4 py-3 text-xs leading-relaxed text-gray-600">
              <span className="font-medium text-gray-800">Part B is automatic and added for you.</span>{" "}
              Everyone pays the 2026 standard Part B premium of $202.90/mo per person (plus a $283
              annual deductible), per the CMS 2026 Parts A &amp; B fact sheet. Higher income adds an
              IRMAA surcharge — your tier is shown in the results. The fields below are the coverage you
              add on top of Part B.
            </p>
            <SelectField
              id="hc-coverage"
              label="Coverage type"
              value={medicareCoverage}
              onChange={setMedicareCoverage}
              options={[
                { value: "medigap", label: "Original Medicare + Medigap + Part D" },
                { value: "advantage", label: "Medicare Advantage" }
              ]}
              help="Medigap = higher fixed premium, low predictable out-of-pocket. Medicare Advantage = low premium, higher variable out-of-pocket capped at the plan maximum."
            />
            {medicareCoverage === "medigap" ? (
              <>
                <SelectField
                  id="hc-medigap-plan"
                  label="Medigap plan letter"
                  value={medigapPlanLetter}
                  onChange={setMedigapPlanLetter}
                  options={[
                    { value: "G", label: "Plan G — most popular (covers all but the Part B deductible)" },
                    { value: "N", label: "Plan N — lower premium, small office/ER copays" },
                    { value: "F", label: "Plan F — covers everything (closed to new enrollees)" }
                  ]}
                  help="Original Medicare + Medigap has NO out-of-pocket maximum, but the supplement caps your cost-sharing tightly. Plan G's only routine medical cost is the $283 Part B deductible; Plan N adds small copays; Plan F (older enrollees) covers even the deductible. This sets your expected out-of-pocket below."
                  note="Default Plan G — the most-chosen Medigap plan; its only routine cost is the 2026 $283 Part B deductible (CMS)."
                />
                {/* Live per-plan preview: effective premium (Plan-G base × the
                    letter's relativity) and the annual out-of-pocket at the
                    chosen usage. Updates instantly as the letter, premium, or
                    usage changes — so the trade-off (Plan N cheaper at low
                    usage, Plan G steadier at high usage) is visible up front. */}
                <div className="rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm leading-relaxed text-gray-600">
                  <p className="font-medium text-gray-800">
                    Plan {medigapPlanLetter} ≈ {formatCurrency(medigapPreviewMonthly)}/mo ·
                    ≈ {formatCurrency(medigapPreviewOop)}/yr out-of-pocket at your usage
                  </p>
                  <p className="mt-1 text-xs text-gray-500">
                    Per person, rounded. Premium = your Plan-G base ({formatCurrency(medigapMonthly)}/mo)
                    × the plan&apos;s relativity (G 1.00, N 0.80, F 1.12). Out-of-pocket = the Part B
                    deductible plus Plan N&apos;s office/ER copays and excess-charge allowance, plus a
                    shared Part D drug amount — at {medicareUsage} usage.
                  </p>
                  <p className="mt-1 text-xs text-gray-500">
                    Estimate — your actual premium varies by state, age, and carrier; edit the base
                    below to match a real quote.{" "}
                    {medigapPlanLetter === "N" ? (
                      <>
                        Plan N also exposes you to Part B &ldquo;excess charges&rdquo; (up to 15% above
                        the Medicare-approved amount from non-participating providers), which we only{" "}
                        <em>approximate</em> here.{" "}
                      </>
                    ) : null}
                    Relativity factors and copays are 2026 estimates (medicare.gov / KFF national
                    averages). Dental, vision &amp; hearing is added separately below. This is a
                    planning estimate, not a quote, and it excludes long-term care.
                  </p>
                </div>
                {/* Compact G/N/F comparison at the chosen usage, so the
                    premium-vs-out-of-pocket crossover is visible: Plan N is
                    cheapest at low/moderate usage, but its per-visit copays and
                    excess-charge exposure let Plan G catch up (or win) at high
                    usage. Premium + medical out-of-pocket only — Part B, Part D,
                    IRMAA and dental/vision/hearing are identical across letters. */}
                {/* Mobile (< sm): stacked cards so nothing overflows a ~375px
                    phone — each plan becomes a labeled card with the total
                    (Premium + OOP/yr), the decision-relevant figure, on its own
                    emphasized row. The wide table below takes over at sm+. */}
                <div className="space-y-2 sm:hidden">
                  {medigapPlanComparison.map((plan) => {
                    const isSelected = plan.letter === medigapPlanLetter;
                    const isLowest = plan.letter === cheapestPlanLetter;
                    return (
                      <div
                        key={plan.letter}
                        className={
                          isSelected
                            ? "rounded-xl border border-[var(--primary)] bg-[var(--green-50)] px-4 py-3"
                            : "rounded-xl border border-gray-200 bg-white px-4 py-3"
                        }
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-sm font-semibold text-gray-900">
                            Plan {plan.letter}
                            {isSelected ? (
                              <span className="ml-1.5 text-[11px] font-semibold text-[var(--primary-hover)]">
                                ● selected
                              </span>
                            ) : null}
                          </span>
                          {isLowest && !isSelected ? (
                            <span className="shrink-0 rounded-full bg-[var(--positive-bg)] px-1.5 py-0.5 text-[10px] font-semibold text-[var(--positive)]">
                              lowest here
                            </span>
                          ) : null}
                        </div>
                        <dl className="mt-2 space-y-1 text-sm">
                          <div className="flex items-center justify-between gap-2">
                            <dt className="text-gray-500">Premium/mo</dt>
                            <dd className="tabular-nums text-gray-700">
                              {formatCurrency(plan.monthly)}
                            </dd>
                          </div>
                          <div className="flex items-center justify-between gap-2">
                            <dt className="text-gray-500">Med. OOP/yr</dt>
                            <dd className="tabular-nums text-gray-700">
                              {formatCurrency(plan.oopYr)}
                            </dd>
                          </div>
                          <div className="flex items-center justify-between gap-2 border-t border-gray-100 pt-1.5">
                            <dt className="font-medium text-gray-700">Premium + OOP/yr</dt>
                            <dd
                              className={
                                isLowest
                                  ? "font-semibold tabular-nums text-[var(--positive)]"
                                  : "font-semibold tabular-nums text-gray-900"
                              }
                            >
                              {formatCurrency(plan.comparableYr)}
                            </dd>
                          </div>
                        </dl>
                      </div>
                    );
                  })}
                </div>
                <div className="hidden overflow-hidden rounded-xl border border-gray-200 bg-white sm:block">
                  <table
                    className="w-full text-sm"
                    aria-label="Medigap plan comparison at your usage"
                  >
                    <thead className="border-b border-gray-200 bg-gray-50 text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                      <tr>
                        <th className="px-3 py-2 text-left">Plan</th>
                        <th className="px-3 py-2 text-right">Premium/mo</th>
                        <th className="px-3 py-2 text-right">Med. OOP/yr</th>
                        <th className="px-3 py-2 text-right">Premium + OOP/yr</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {medigapPlanComparison.map((plan) => {
                        const isSelected = plan.letter === medigapPlanLetter;
                        return (
                          <tr
                            key={plan.letter}
                            className={isSelected ? "bg-[var(--green-50)]" : undefined}
                          >
                            <td className="px-3 py-2 text-left font-medium text-gray-900">
                              Plan {plan.letter}
                              {isSelected ? (
                                <span className="ml-1.5 text-[11px] font-semibold text-[var(--primary-hover)]">
                                  ● selected
                                </span>
                              ) : null}
                              {plan.letter === cheapestPlanLetter && !isSelected ? (
                                <span className="ml-1.5 rounded-full bg-[var(--positive-bg)] px-1.5 py-0.5 text-[10px] font-semibold text-[var(--positive)]">
                                  lowest here
                                </span>
                              ) : null}
                            </td>
                            <td className="px-3 py-2 text-right tabular-nums text-gray-700">
                              {formatCurrency(plan.monthly)}
                            </td>
                            <td className="px-3 py-2 text-right tabular-nums text-gray-700">
                              {formatCurrency(plan.oopYr)}
                            </td>
                            <td
                              className={
                                plan.letter === cheapestPlanLetter
                                  ? "px-3 py-2 text-right font-semibold tabular-nums text-[var(--positive)]"
                                  : "px-3 py-2 text-right font-semibold tabular-nums text-gray-900"
                              }
                            >
                              {formatCurrency(plan.comparableYr)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                <p className="text-xs leading-relaxed text-gray-500">
                  Premium + medical out-of-pocket only, at <b>{medicareUsage}</b> usage — Part B, Part
                  D, IRMAA, and dental/vision/hearing are the same across letters, so they&apos;re left
                  out here for an apples-to-apples plan choice. Plan N usually wins at low/moderate
                  usage; Plan G catches up at high usage as N&apos;s copays and excess charges add up.
                </p>
                <NumberInput
                  id="hc-medigap"
                  label="Medigap premium (monthly, per person) — Plan-G base"
                  value={medigapMonthly}
                  onChange={setMedigapMonthly}
                  step={10}
                  help="Enter this as the Plan G premium for your age and area — the most common benchmark. The calculator re-prices the other letters from it automatically (Plan N ≈ 0.80×, Plan F ≈ 1.12×), so you only enter one number."
                  note="Estimate — default ~$155/mo is the 2025 national-average Medigap Plan G base; your premium varies by state, age, and carrier. The selected letter is re-priced from it (see the line above). Edit to a real quote."
                />
                <NumberInput
                  id="hc-partd"
                  label="Part D premium (monthly, per person)"
                  value={partDMonthly}
                  onChange={setPartDMonthly}
                  step={5}
                  help="Standalone Part D drug plan premium per person (before any IRMAA surcharge)."
                  note="Default ~$40/mo — near the 2026 national base Part D premium ($38.99, CMS); plans range widely. Edit to yours."
                />
              </>
            ) : (
              <>
                <NumberInput
                  id="hc-advantage"
                  label="Medicare Advantage premium (monthly, per person)"
                  value={advantageMonthly}
                  onChange={setAdvantageMonthly}
                  step={5}
                  help="Monthly MA plan premium per person. Many MA plans are $0 premium but still require the Part B premium."
                  note="Default ~$15/mo — near the 2026 average MA premium (~$11, KFF/CMS). Many plans are $0; you still pay Part B."
                />
                <NumberInput
                  id="hc-medicare-oop-max"
                  label="Medicare out-of-pocket max (annual, per person)"
                  value={medicareOutOfPocketMax}
                  onChange={setMedicareOutOfPocketMax}
                  step={100}
                  help="Medicare Advantage plans have a real annual out-of-pocket maximum (Medigap does not). Your expected spend is estimated as a share of this ceiling."
                  note="Default $6,000 — about the 2026 average Medicare Advantage in-network out-of-pocket (~$5,400; legal cap $9,250, KFF). Set to your plan's max."
                />
              </>
            )}
            <SelectField
              id="hc-medicare-usage"
              label="Expected care usage"
              value={medicareUsage}
              onChange={setMedicareUsage}
              options={usageOptions}
              help={
                medicareCoverage === "medigap"
                  ? "How much care you expect. With Medigap your routine cost is the Part B deductible regardless; higher usage adds modest drug/copay cost-sharing on top. The levels map to typical visit counts — Low ≈ 4 office visits/yr, Moderate ≈ 8, High ≈ 16 plus an ER visit — which you can override with the explicit amount below."
                  : "Low ≈ 15%, Moderate ≈ 30%, High ≈ 85% of the per-person out-of-pocket maximum."
              }
              note={
                medicareCoverage === "medigap"
                  ? "Typical visit counts (≈ Medicare beneficiary averages); adjust to your situation, or set an explicit amount below."
                  : undefined
              }
            />
            <NumberInput
              id="hc-medicare-custom-oop"
              label="Or explicit annual out-of-pocket per person (0 = use preset)"
              value={medicareCustomOop}
              onChange={setMedicareCustomOop}
              step={100}
              help="If greater than 0, this exact per-person amount replaces the usage preset for the Medicare years."
            />
            <NumberInput
              id="hc-dental-vision-hearing"
              label="Dental, vision & hearing (not covered by Medicare)"
              value={dentalVisionHearing}
              onChange={setDentalVisionHearing}
              step={100}
              suffix="/yr"
              help="Routine dental, vision, and hearing care is not covered by Original Medicare or a Medigap supplement, so it's a real out-of-pocket cost in the Medicare years. This per-person annual amount is added to every 65+ year. Set to 0 if a Medicare Advantage or standalone plan covers it."
              note="Estimate — default $1,200/yr per person is a rough national average of typical retiree out-of-pocket for routine dental, vision & hearing (2026, KFF). Costs vary widely by individual; adjust to your situation."
            />
            <NumberInput
              id="hc-medicare-inflation"
              label="Medicare medical inflation"
              value={medicareInflationPercent}
              onChange={setMedicareInflationPercent}
              suffix="%"
              step={0.1}
              help="Annual growth of Medicare premiums and out-of-pocket costs."
              note="Default 5%/yr — long-run Medicare per-capita cost trend (CMS National Health Expenditure data)."
            />
            <NumberInput
              id="hc-general-inflation"
              label="General inflation"
              value={generalInflationPercent}
              onChange={setGeneralInflationPercent}
              suffix="%"
              step={0.1}
              help="Overall price inflation (~3%). Medical costs growing faster than this is why healthcare takes a bigger bite over time — the gap between the two is what today's-dollar mode shows."
              note="Default 3%/yr — roughly the long-run U.S. CPI and the Fed's ~2% target plus headroom."
            />
            <p className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-xs leading-relaxed text-gray-600">
              <span className="font-medium text-gray-800">Honest about the limits.</span> This is a
              planning estimate, not a quote — get real prices on medicare.gov before deciding. The
              Part B premium ($202.90/mo) and deductible ($283/yr) are the 2026 published figures
              (CMS); the Part D drug out-of-pocket is capped at the 2026 ~$2,000 ceiling (Inflation
              Reduction Act). Premiums, copays, dental/vision/hearing, and visit counts are estimates
              that vary by person. Plan N&apos;s Part B excess-charge risk is approximated, not
              itemized. Figures <span className="font-medium">exclude long-term care</span> (nursing
              home / in-home custodial care), which Medicare largely doesn&apos;t cover and which can
              dwarf these costs.
            </p>
          </Section>

          <Section title="HSA (optional)">
            <NumberInput
              id="hc-hsa-balance"
              label="HSA starting balance"
              value={hsaBalance}
              onChange={setHsaBalance}
              step={1000}
              help="Today's HSA balance. It's spent tax-free on qualified medical costs, so every dollar here reduces what your portfolio must fund."
            />
            <NumberInput
              id="hc-hsa-growth"
              label="HSA growth"
              value={hsaGrowthPercent}
              onChange={setHsaGrowthPercent}
              suffix="%"
              step={0.1}
              help="How fast the HSA grows until spent. Use your portfolio return (~5–7%) if it's invested, or ~0–2% if it sits in cash."
              note="Default 4%/yr — a conservative invested-HSA return. Use ~5–7% if fully invested, ~0–2% if held in cash."
            />
            <SelectField
              id="hc-hsa-strategy"
              label="HSA drawdown strategy"
              value={hsaStrategy}
              onChange={setHsaStrategy}
              options={[
                { value: "off", label: "Don't use HSA" },
                { value: "gap_first", label: "Spend in gap years first" },
                { value: "medicare_first", label: "Reserve for Medicare years" }
              ]}
              help="Spend-in-gap-years lowers your costs sooner; reserve-for-Medicare lets the balance compound longer and pay Part B/D premiums at 65+. Note: an HSA can never pay Medigap or marketplace premiums — only out-of-pocket costs and Medicare premiums."
            />
          </Section>

          <Section title="Travel / abroad (optional)">
            <SelectField
              id="hc-travel-mode"
              label="Travel coverage"
              value={travelMode}
              onChange={setTravelMode}
              options={[
                { value: "off", label: "US only (no travel coverage)" },
                { value: "supplement", label: "Supplement: add global premium" },
                { value: "replace", label: "Replace: rely on global/expat plan" }
              ]}
              help="US plans don't cover you abroad. Supplement keeps the US baseline and adds a travel/global premium; Replace drops the US baseline (you still pay Part B at 65+)."
            />
            <NumberInput
              id="hc-days-abroad"
              label="Days abroad per year"
              value={daysAbroadPerYear}
              onChange={setDaysAbroadPerYear}
              help="Only matters at 330+ days/year, where US ACA coverage isn't required and a global/expat plan can fully replace it. Below that, US coverage is still your baseline."
            />
            <NumberInput
              id="hc-travel-premium"
              label="Annual global/travel premium (household)"
              value={travelAnnualPremium}
              onChange={setTravelAnnualPremium}
              step={500}
              help="Annual premium for an expat/global or travel-medical plan (Cigna Global, Allianz, IMG, GeoBlue, etc.) for the household."
            />
          </Section>
        </Card>

        <div className="grid gap-5">
          <CalculateBar stale={gate.stale} onRecalculate={gate.recalculate} />

          {/* HERO — present-value headline (today's dollars) with the labeled
              future-dollars alternative. */}
          <div className="relative overflow-hidden rounded-2xl border border-gray-200 bg-white p-6 shadow-md before:absolute before:inset-y-0 before:left-0 before:w-[5px] before:bg-[var(--primary)] before:content-['']">
            <p className="max-w-[520px] text-[15px] font-semibold leading-snug text-gray-800">
              {isToday ? (
                <>
                  What to set aside today to cover a lifetime of healthcare
                  <span className="ml-1.5 inline-flex items-center gap-1 rounded-full bg-[var(--positive-bg)] px-2.5 py-0.5 align-middle text-[11px] font-semibold text-[var(--positive)]">
                    ● today&apos;s $
                  </span>
                  <span className="ml-1.5 align-middle text-[12px] font-normal text-gray-500">
                    with a {discountRatePct} discount rate
                  </span>
                </>
              ) : (
                "What you'd actually pay over the years, added up in future (inflated) dollars"
              )}
            </p>
            <p className="mt-2 text-[42px] font-extrabold leading-none tracking-tight text-gray-900 tabular-nums sm:text-[52px]">
              {formatCurrency(heroValue)}
            </p>

            {/* Today's / Future toggle */}
            <div className="mt-4">
              <div className="flex items-center gap-1.5 text-[13px] font-medium text-gray-700">
                <span>Show amounts in</span>
                <InfoPopover label="Dollar basis" content={todayDollarsExplainer} />
              </div>
              <div
                className="mt-2 inline-flex w-full gap-1 rounded-xl border border-gray-200 bg-gray-100 p-1"
                role="group"
                aria-label="Dollar basis"
              >
                {(
                  [
                    { value: "today_dollars", label: "Today's dollars" },
                    { value: "future_dollars", label: "Future dollars" }
                  ] as const
                ).map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setDisplayMode(opt.value)}
                    aria-pressed={displayMode === opt.value}
                    className={
                      displayMode === opt.value
                        ? "flex-1 rounded-lg bg-white px-3 py-2.5 text-[13px] font-semibold text-[var(--primary-hover)] shadow-sm"
                        : "flex-1 rounded-lg px-3 py-2.5 text-[13px] font-semibold text-gray-600"
                    }
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
              <div
                className={
                  isToday
                    ? "mt-3 flex items-start gap-2.5 rounded-xl border border-green-200 bg-[var(--positive-bg)] px-3.5 py-2.5 text-[12.5px] leading-relaxed text-[var(--positive)]"
                    : "mt-3 flex items-start gap-2.5 rounded-xl border border-[var(--gold-border)] bg-[var(--gold-bg)] px-3.5 py-2.5 text-[12.5px] leading-relaxed text-[var(--gold-text)]"
                }
              >
                <svg
                  width="15"
                  height="15"
                  viewBox="0 0 15 15"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="mt-0.5 flex-none"
                  aria-hidden="true"
                >
                  <circle cx="7.5" cy="7.5" r="6.5" />
                  <path d={isToday ? "M4.7 7.7l1.9 1.9 3.7-4.1" : "M7.5 4.2v4.6M7.5 10.8h.01"} />
                </svg>
                {isToday ? (
                  <span>
                    Built the same way as published estimates like Fidelity&apos;s — a{" "}
                    <b>present value in today&apos;s dollars</b>. (Ours also covers pre-65 years and
                    dental/vision, which Fidelity&apos;s leaves out.)
                  </span>
                ) : (
                  <span>
                    These are <b>future (inflated) dollars — not comparable to published estimates</b>{" "}
                    like Fidelity&apos;s, which are quoted in today&apos;s dollars. Switch back to{" "}
                    <b>Today&apos;s dollars</b> for the present-value figure (
                    {formatCurrency(result.presentValueTotal)}).
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Supporting KPI cards */}
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
            <ResultCard
              label={`Before 65 · ACA gap · ${result.acaYears} yrs`}
              value={formatCurrency(acaPhaseValue)}
              context={isToday ? "present value · pre-Medicare" : "pre-Medicare · future $"}
            />
            <ResultCard
              label={`Medicare years · 65+ · ${result.medicareYears} yrs`}
              value={formatCurrency(medicarePhaseValue)}
              context={isToday ? "present value · Part B/D + supplement" : "Part B/D + supplement · future $"}
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
            <ResultCard
              label="ACA subsidies captured"
              value={formatCurrency(result.totalSubsidy)}
              help="The ACA subsidy (premium tax credit) is federal money paid toward your monthly premium. The government caps your share of the benchmark Silver plan at a percentage of your income (MAGI) and credits the rest — lower income means a bigger credit. It drops to $0 once MAGI reaches 400% of the Federal Poverty Level."
            />
            <ResultCard label="HSA funds used" value={formatCurrency(result.totalHsaUsed)} />
          </div>

          {/* Dental/vision/hearing slice — uncovered by Original Medicare, so a
              real 65+ cost; part of the Medicare total above, surfaced here as
              its own labeled line in the displayed dollar basis. */}
          {result.medicareYears > 0 && dvhLifetime > 0 ? (
            <p className="text-[12.5px] leading-relaxed text-gray-500">
              Includes ≈ <b className="text-gray-700">{formatCurrency(dvhLifetime)}</b> for routine
              dental, vision &amp; hearing over the Medicare years — uncovered by Original Medicare,
              and counted in the totals above{isToday ? " (today's dollars)" : " (future dollars)"}.
            </p>
          ) : null}

          {/* Low-income public-coverage callout — Medicaid (pre-65) / MSP + Extra
              Help (65+). Shown only when income falls below the thresholds. */}
          {lowIncome ? (
            <div className="flex items-start gap-3 rounded-2xl border border-[var(--gold-border)] bg-[var(--gold-bg)] p-4 text-[13.5px] leading-relaxed text-[var(--gold-text)] shadow-sm">
              <span className="flex h-8 w-8 flex-none items-center justify-center rounded-[10px] border border-[var(--gold-border)] bg-white">
                <svg
                  width="17"
                  height="17"
                  viewBox="0 0 17 17"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M8.5 15s-5.5-3.6-5.5-8A3.2 3.2 0 0 1 8.5 4.6 3.2 3.2 0 0 1 14 7c0 4.4-5.5 8-5.5 8z" />
                </svg>
              </span>
              <div>
                <b>Low income?</b> At about {Math.round(result.incomePctFpl * 100)}% of the Federal
                Poverty Level, your household would likely qualify for{" "}
                {result.medicaidEligiblePre65 ? <b>Medicaid before 65 (near-free coverage)</b> : null}
                {result.medicaidEligiblePre65 && result.medicareLowIncome ? ", and " : null}
                {result.medicareLowIncome ? (
                  <b>Medicare Savings Programs + Extra Help after 65</b>
                ) : null}
                {" "}— so your real out-of-pocket cost would be far lower than the figure above (which
                is why it&apos;s shown near $0).
                {result.medicaidEligiblePre65 ? (
                  <>
                    {" "}Your income is below 138% of the Federal Poverty Level (
                    {formatCurrency(medicaidIncomeDollars)} for a household of{" "}
                    {committedHouseholdSize}), so you&apos;d likely qualify for Medicaid.
                  </>
                ) : null}
                <span className="mt-1.5 block text-[12px] text-gray-500">
                  Estimate only; eligibility and benefits vary by state (some states did not expand
                  Medicaid). Confirm on Medicaid.gov and Medicare.gov.
                </span>
              </div>
            </div>
          ) : null}

          {result.acaYears > 0 && !result.medicaidEligiblePre65 ? (
            result.aboveSubsidyCliff ? (
              <Callout tone="amber">
                Your income is at or above 400% of the Federal Poverty Level —{" "}
                {formatCurrency(cliffIncomeDollars)} for a household of {committedHouseholdSize}{" "}
                ({result.incomePctFpl >= 5
                  ? "well above the 400% cliff"
                  : `you're at ${Math.round(result.incomePctFpl * 100)}%`}
                ) — so you don&apos;t qualify for a premium subsidy and pay the full unsubsidized
                premium. Keeping income below the cliff can save thousands per year.
              </Callout>
            ) : (
              <Callout tone="gray">
                At {Math.round(result.incomePctFpl * 100)}% of the Federal Poverty Level, your ACA
                required contribution is about {(result.applicablePercent * 100).toFixed(2)}% of MAGI
                toward the benchmark plan, with the rest covered by the premium tax credit.
              </Callout>
            )
          ) : null}

          {result.medicareYears > 0 && !result.medicareLowIncome ? (
            <Callout tone={result.irmaaTierIndex > 0 ? "amber" : "gray"}>
              {result.irmaaTierIndex > 0
                ? `Your MAGI puts you in IRMAA tier ${result.irmaaTierIndex} — Part B rises to ${formatCurrency(result.partBMonthlyPerPerson, true)}/month per person plus a Part D surcharge.`
                : "At your MAGI there's no IRMAA surcharge, so each person pays the standard Part B premium noted in the Medicare inputs above."}
            </Callout>
          ) : null}

          {result.acaNotRequiredAbroad ? (
            <Callout tone="gray">
              At 330+ days abroad per year, ACA coverage isn&apos;t required. Remember US plans and
              Original Medicare cover little to nothing overseas — a global/expat plan is doing the
              real work.
            </Callout>
          ) : null}
        </div>
      </div>

      <HealthcareCostChart
        data={displayRows}
        medicareAge={committedInput.medicareAge || 65}
        caption={
          isToday
            ? "Today's dollars: each year's bar is its discounted present value, so the bars add up to the headline above."
            : "Future dollars: each bar is the actual (inflated) amount you'd pay that year."
        }
      />

      {/* Two-card summary — reconciles with the breakdown below: the Lifetime
          card equals the Net cost column plus HSA funds used across all rows
          (the gross lifetime total / headline), and the Average card spreads
          that lifetime over the projected years. Values render neutral (dark)
          to match the other site summary cards, and both follow the
          Today's/Future toggle instantly. */}
      <div className="grid grid-cols-2 gap-3">
        <SummaryCard
          label={isToday ? "Lifetime · today's $" : "Lifetime · future $"}
          value={formatCurrency(heroValue)}
          tone="neutral"
        />
        <SummaryCard label="Average / year" value={formatCurrency(avgPerYear)} tone="neutral" />
      </div>

      {/* TODO(save-image): a "Save image" button + wordmark would sit here to
          export this result card + table as a shareable PNG. The PNG export is
          intentionally deferred to a follow-up task. */}

      <details className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <summary className="cursor-pointer text-base font-semibold text-gray-900">
          Year-by-year breakdown
        </summary>
        <p className="mt-2 text-[12.5px] leading-relaxed text-gray-500">
          {isToday
            ? "Shown in today's dollars — each row is that year's discounted present value, so the Net cost column plus HSA funds used adds up to the headline."
            : "Shown in future dollars — the actual amounts you'd pay each year, once prices have risen with inflation."}
        </p>
        {/* Section label + right-aligned caption (REDESIGN §2). */}
        <div className="mt-4 flex items-baseline justify-between">
          <span className="text-[11px] font-semibold uppercase tracking-[0.06em] text-gray-500">
            By age
          </span>
          <span className="text-[11px] text-gray-400">net cost / year</span>
        </div>
        <div className="mt-2 max-h-96 overflow-auto rounded-xl border border-gray-200">
          <table className="w-full min-w-[640px] text-sm" aria-label="Healthcare cost projection">
            <thead className="sticky top-0 border-b border-gray-200 bg-white text-xs font-semibold uppercase tracking-wide text-gray-500">
              <tr>
                <th className="px-3 py-2.5 text-left">Year / Age</th>
                <th className="px-3 py-2.5 text-left">Phase</th>
                <th className="px-3 py-2.5 text-right">
                  <span className="inline-flex items-center justify-end gap-1">
                    Premium
                    <InfoPopover label="Premium" content={premiumColumnInfo} />
                  </span>
                </th>
                <th className="px-3 py-2.5 text-right">
                  <span className="inline-flex items-center justify-end gap-1">
                    Subsidy
                    <InfoPopover
                      label="Subsidy"
                      content="The premium tax credit: before 65 the government caps your share of the benchmark plan at a % of income and pays the rest to the insurer. Drops to $0 above 400% of the Federal Poverty Level."
                    />
                  </span>
                </th>
                <th className="px-3 py-2.5 text-right">
                  <span className="inline-flex items-center justify-end gap-1">
                    Out-of-pocket
                    <InfoPopover label="Out-of-pocket" content={oopColumnInfo} />
                  </span>
                </th>
                <th className="px-3 py-2.5 text-right">HSA draw</th>
                <th className="px-3 py-2.5 text-right">
                  <span className="inline-flex items-center justify-end gap-1">
                    Net cost
                    <InfoPopover label="Net cost" content={netCostColumnInfo} />
                  </span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {displayRows.map((row) => {
                // Soft green tint marks the Medicare-transition milestone (the
                // age coverage flips from an ACA plan to Medicare).
                const isMedicareStart = row.age === medicareTransitionAge;
                const netBarPct =
                  displayMaxNet > 0
                    ? Math.max(0, Math.min(100, (row.netPortfolioCost / displayMaxNet) * 100))
                    : 0;
                return (
                  <tr
                    key={row.age}
                    className={isMedicareStart ? "bg-[var(--green-50)]" : "hover:bg-gray-50"}
                  >
                    <td className="px-3 py-2.5 text-left font-medium text-gray-900 tabular-nums">
                      {row.year} / {row.age}
                    </td>
                    <td className="px-3 py-2.5 text-left">
                      <span
                        className={
                          row.phase === "aca"
                            ? "inline-flex rounded-full bg-blue-50 px-2 py-0.5 text-[11px] font-semibold text-blue-700"
                            : "inline-flex rounded-full bg-[var(--green-50)] px-2 py-0.5 text-[11px] font-semibold text-[var(--primary-hover)]"
                        }
                      >
                        {row.phase === "aca" ? "ACA" : "Medicare"}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-right tabular-nums text-[var(--negative)]">
                      {formatCurrency(row.premium)}
                    </td>
                    <td className="px-3 py-2.5 text-right tabular-nums text-[var(--positive)]">
                      {row.subsidy > 0 ? `-${formatCurrency(row.subsidy)}` : "—"}
                    </td>
                    <td className="px-3 py-2.5 text-right tabular-nums text-[var(--negative)]">
                      {formatCurrency(row.outOfPocket)}
                    </td>
                    <td className="px-3 py-2.5 text-right tabular-nums text-[var(--positive)]">
                      {row.hsaDraw > 0 ? `-${formatCurrency(row.hsaDraw)}` : "—"}
                    </td>
                    {/* Net cost carries the inline bar — width scaled to the
                        largest net-cost row, in a light red (cost) tint. */}
                    <td className="relative px-3 py-2.5 text-right font-semibold tabular-nums text-gray-900">
                      <span
                        aria-hidden="true"
                        className="pointer-events-none absolute inset-y-1.5 right-2 rounded-[3px] bg-[var(--negative-bg)]"
                        style={{ width: `${netBarPct}%`, maxWidth: "calc(100% - 1rem)" }}
                      />
                      <span className="relative">{formatCurrency(row.netPortfolioCost)}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot className="sticky bottom-0 border-t-2 border-gray-200 bg-white text-sm font-semibold text-gray-900">
              <tr>
                <td className="px-3 py-2.5 text-left" colSpan={4}>
                  Net cost (after HSA)
                </td>
                <td className="px-3 py-2.5 text-right tabular-nums text-[var(--positive)]">
                  {displayHsaUsedTotal > 0 ? `-${formatCurrency(displayHsaUsedTotal)}` : "—"}
                </td>
                <td className="px-3 py-2.5 text-right tabular-nums" colSpan={2}>
                  {formatCurrency(displayNetTotal)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
        <p className="mt-3 text-[12.5px] leading-relaxed text-gray-500">
          {displayHsaUsedTotal > 0 ? (
            <>
              Your costs total <b className="text-gray-700">{formatCurrency(displayGrossTotal)}</b> over all
              years (the lifetime total shown above); after{" "}
              <b className="text-gray-700">{formatCurrency(displayHsaUsedTotal)}</b> drawn from your HSA, you
              pay <b className="text-gray-700">{formatCurrency(displayNetTotal)}</b> out of pocket
              {isToday ? " (today's dollars)" : " (future dollars)"}.
            </>
          ) : (
            <>
              These yearly costs add up to <b className="text-gray-700">{formatCurrency(displayGrossTotal)}</b> —
              the lifetime total shown above{isToday ? " (today's dollars)" : " (future dollars)"}.
            </>
          )}
        </p>
      </details>
    </ToolShell>
  );
}
