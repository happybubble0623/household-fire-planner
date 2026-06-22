"use client";

import { useMemo, useState } from "react";

// Homepage hero quick-calc — deliberately simple and FIXED (7% real return, 4%
// rule, Coast-style progress). Replaces the static "Sample" card so a visitor
// gets a real, editable result in the first seconds. The full Coast FIRE
// strategy page is where the return and the rule become editable.

const REAL_RETURN = 0.07;
const WITHDRAWAL_RULE = 0.04;

const usd = (n: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0
  }).format(Math.max(0, Math.round(n)));

const num = (v: string) => {
  const parsed = Number(v.replace(/[^0-9.]/g, ""));
  return Number.isFinite(parsed) ? parsed : 0;
};

const PencilIcon = () => (
  <svg
    viewBox="0 0 24 24"
    width="13"
    height="13"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M12 20h9" />
    <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z" />
  </svg>
);

export function HeroQuickCalc() {
  const [age, setAge] = useState("35");
  const [spending, setSpending] = useState("60000");
  const [investments, setInvestments] = useState("200000");
  const [savings, setSavings] = useState("30000");
  const [focused, setFocused] = useState<string | null>(null);

  const out = useMemo(() => {
    const a = num(age);
    const spend = num(spending);
    const invest = num(investments);
    const save = num(savings);
    const fireNumber = spend * (1 / WITHDRAWAL_RULE);

    let n = 0;
    let balance = invest;
    if (fireNumber > 0) {
      while (balance < fireNumber && n < 60) {
        n += 1;
        balance =
          invest * Math.pow(1 + REAL_RETURN, n) +
          save * ((Math.pow(1 + REAL_RETURN, n) - 1) / REAL_RETURN);
      }
    }
    const fireAge = fireNumber <= 0 ? null : n >= 60 ? "60+" : a + n;
    const coasted = invest * Math.pow(1 + REAL_RETURN, n);
    const progress = fireNumber > 0 ? Math.min(100, Math.round((coasted / fireNumber) * 100)) : 0;

    return { fireNumber, fireAge, progress };
  }, [age, spending, investments, savings]);

  const labelStyle: React.CSSProperties = {
    display: "block",
    fontSize: 11,
    fontWeight: 600,
    color: "#3c423b",
    marginBottom: 4
  };

  const field = (id: string, label: string, value: string, set: (v: string) => void) => {
    const isFocused = focused === id;
    return (
      <div>
        <label htmlFor={id} style={labelStyle}>
          {label}
        </label>
        <div style={{ position: "relative" }}>
          <input
            id={id}
            type="text"
            inputMode="numeric"
            value={value}
            onChange={(e) => set(e.target.value)}
            onFocus={() => setFocused(id)}
            onBlur={() => setFocused(null)}
            style={{
              width: "100%",
              height: 38,
              border: `1.5px solid ${isFocused ? "#15803d" : "#bcc6bc"}`,
              borderRadius: 9,
              padding: "0 28px 0 10px",
              fontSize: 14,
              fontWeight: 600,
              color: "#101410",
              background: "#fff",
              boxShadow: isFocused
                ? "0 0 0 3px rgba(110,224,160,0.45)"
                : "inset 0 1px 2px rgba(16,40,24,0.06)",
              outline: "none",
              cursor: "text"
            }}
          />
          <span style={{ position: "absolute", right: 9, top: 12, color: "#9aa29a" }}>
            <PencilIcon />
          </span>
        </div>
      </div>
    );
  };

  return (
    <div className="glass floatkpi" style={{ textAlign: "left" }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 8,
          padding: "12px 14px 0"
        }}
      >
        <span style={{ fontSize: 12.5, fontWeight: 700, color: "#101410" }}>
          Get your quick FIRE number
        </span>
        <span
          aria-label="Assumes a 7%/yr real (after-inflation) return, the 4% rule (FIRE number = 25x expenses), and credits your current savings' compounding to your FIRE age."
          title="Assumes a 7%/yr real (after-inflation) return, the 4% rule (FIRE number = 25x expenses), and credits your current savings' compounding to your FIRE age."
          style={{
            display: "inline-flex",
            width: 18,
            height: 18,
            borderRadius: "50%",
            border: "1px solid #cdd1c9",
            color: "#6b7167",
            fontSize: 11,
            fontWeight: 700,
            alignItems: "center",
            justifyContent: "center",
            cursor: "help",
            flex: "none"
          }}
        >
          i
        </span>
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          padding: "6px 14px 0",
          fontSize: 12,
          fontWeight: 600,
          color: "#15803d"
        }}
      >
        <PencilIcon />
        Sample numbers — edit any field to make it yours.
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))",
          gap: 10,
          padding: "10px 14px 0"
        }}
      >
        {field("qc-age", "Your age", age, setAge)}
        {field("qc-spend", "Annual spending ($)", spending, setSpending)}
        {field("qc-invest", "Investments ($)", investments, setInvestments)}
        {field("qc-save", "Saved / year ($)", savings, setSavings)}
      </div>

      <div className="kpis" style={{ marginTop: 12 }}>
        <div className="kpi">
          <div className="l">Your FIRE number</div>
          <div className="n tnum">{usd(out.fireNumber)}</div>
        </div>
        <div className="kpi">
          <div className="l">Projected FIRE age</div>
          <div className="n tnum" style={{ color: "#15803d" }}>
            {out.fireAge ?? "—"}
          </div>
        </div>
        <div className="kpi">
          <div className="l">You&rsquo;re this far</div>
          <div className="n tnum">{out.progress}%</div>
        </div>
      </div>

      <p style={{ fontSize: 11, color: "#6b7167", padding: "10px 14px 12px", margin: 0 }}>
        Assumes 7%/yr real return · 4% rule · current savings compounded to your FIRE age.
      </p>
    </div>
  );
}
