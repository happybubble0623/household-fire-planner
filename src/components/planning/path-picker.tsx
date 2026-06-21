"use client";

import { useState } from "react";
import Link from "next/link";
import { FIRE_STRATEGIES } from "@/lib/data/fire-strategies";

// "Help me choose" picker: a compact 3-question flow that recommends one of the
// four FIRE paths. The comparison cards stay server-rendered for SEO; this is
// the small interactive island that sits above them.

type View = "q1" | "q2" | "q3" | "income" | "preserve" | "coast" | "drawdown";

const byHref = (href: string) => FIRE_STRATEGIES.find((s) => s.href === href)!;

const RESULTS = {
  income: byHref("/app/fire-path/income-stream"),
  preserve: byHref("/app/fire-path/principal-preserving"),
  coast: byHref("/app/fire-path/coast-fire"),
  drawdown: byHref("/app/fire-path/withdrawal-rate")
} as const;

const CheckIcon = () => (
  <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="#15803d" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M5 12l5 5L20 6" />
  </svg>
);

const CrossIcon = () => (
  <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="#5c5b53" strokeWidth="3" strokeLinecap="round" aria-hidden="true">
    <path d="M6 6l12 12M18 6L6 18" />
  </svg>
);

function Result({
  which,
  onReset
}: {
  which: "income" | "preserve" | "coast" | "drawdown";
  onReset: () => void;
}) {
  const s = RESULTS[which];
  return (
    <div className="paths-result" role="status" aria-live="polite">
      <div className="paths-reslead">We suggest</div>
      <div className="paths-rescard">
        <span className="paths-rtag">{s.tag}</span>
        <h3>{s.navLabel}</h3>
        <p className="paths-why">{s.why}</p>
        <div className="paths-resactions">
          <Link href={s.href} className="paths-resbtn">
            Start {s.navLabel} →
          </Link>
          <button type="button" className="paths-seeall" onClick={onReset}>
            See all three again
          </button>
        </div>
      </div>
      <div className="paths-fallback">
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="#b07d00" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <circle cx="12" cy="12" r="10" />
          <path d="M12 16v-4M12 8h.01" />
        </svg>
        <span>
          Not sure? Most people start with <strong>Portfolio Drawdown FIRE</strong>.
        </span>
      </div>
    </div>
  );
}

export function PathPicker() {
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<View>("q1");

  const reset = () => setView("q1");
  const close = () => {
    setOpen(false);
    setView("q1");
  };

  return (
    <>
      <button
        type="button"
        className="paths-helpbtn"
        aria-expanded={open}
        onClick={() => {
          setOpen((prev) => !prev);
          setView("q1");
        }}
      >
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <circle cx="12" cy="12" r="10" />
          <path d="M9.1 9a3 3 0 0 1 5.8 1c0 2-3 2.5-3 4" />
          <line x1="12" y1="17" x2="12" y2="17" />
        </svg>
        Not sure which fits you? Help me choose →
      </button>

      {open ? (
        <div className="paths-picker" role="region" aria-label="Help me choose a FIRE path">
          <div className="paths-ptop">
            <div className="paths-lt">
              <span className="paths-pico">
                <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="#1c1b18" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M12 2v4M12 18v4M2 12h4M18 12h4M5 5l2 2M17 17l2 2M5 19l2-2M17 7l2-2" />
                </svg>
              </span>
              <div>
                <b>Help me choose</b>
                <small>Answer up to 3 quick questions</small>
              </div>
            </div>
            <button type="button" className="paths-closex" aria-label="Close" onClick={close}>
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                <path d="M6 6l12 12M18 6L6 18" />
              </svg>
            </button>
          </div>

          <div className="paths-pbody">
            {view === "q1" ? (
              <div className="paths-step">
                <div className="paths-stepno">Question 1 of 3</div>
                <div className="paths-q">
                  Will steady income — a pension, rental, or Social Security — cover most of your
                  retirement costs?
                </div>
                <div className="paths-opts">
                  <button type="button" className="paths-opt" onClick={() => setView("income")}>
                    <span className="paths-oy paths-oy-yes">
                      <CheckIcon />
                    </span>
                    Yes, most of them
                  </button>
                  <button type="button" className="paths-opt" onClick={() => setView("q2")}>
                    <span className="paths-oy paths-oy-no">
                      <CrossIcon />
                    </span>
                    No / not really
                  </button>
                </div>
                <div className="paths-progress" aria-hidden="true">
                  <span className="on" />
                  <span />
                  <span />
                </div>
              </div>
            ) : null}

            {view === "q2" ? (
              <div className="paths-step">
                <div className="paths-stepno">Question 2 of 3</div>
                <div className="paths-q">
                  Do you want to live off your investment income — without ever selling your
                  investments?
                </div>
                <div className="paths-opts">
                  <button type="button" className="paths-opt" onClick={() => setView("preserve")}>
                    <span className="paths-oy paths-oy-yes">
                      <CheckIcon />
                    </span>
                    Yes, keep it intact
                  </button>
                  <button type="button" className="paths-opt" onClick={() => setView("q3")}>
                    <span className="paths-oy paths-oy-no">
                      <CrossIcon />
                    </span>
                    No, spending it is fine
                  </button>
                </div>
                <button type="button" className="paths-backlink" onClick={() => setView("q1")}>
                  <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M15 18l-6-6 6-6" />
                  </svg>
                  Back
                </button>
                <div className="paths-progress" aria-hidden="true">
                  <span className="on" />
                  <span className="on" />
                  <span />
                </div>
              </div>
            ) : null}

            {view === "q3" ? (
              <div className="paths-step">
                <div className="paths-stepno">Question 3 of 3</div>
                <div className="paths-q">
                  Would you like to stop saving for retirement and let your current investments grow
                  on their own to a normal retirement age?
                </div>
                <div className="paths-opts">
                  <button type="button" className="paths-opt" onClick={() => setView("coast")}>
                    <span className="paths-oy paths-oy-yes">
                      <CheckIcon />
                    </span>
                    Yes, let it coast
                  </button>
                  <button type="button" className="paths-opt" onClick={() => setView("drawdown")}>
                    <span className="paths-oy paths-oy-no">
                      <CrossIcon />
                    </span>
                    No, I&rsquo;ll keep building
                  </button>
                </div>
                <button type="button" className="paths-backlink" onClick={() => setView("q2")}>
                  <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M15 18l-6-6 6-6" />
                  </svg>
                  Back
                </button>
                <div className="paths-progress" aria-hidden="true">
                  <span className="on" />
                  <span className="on" />
                  <span className="on" />
                </div>
              </div>
            ) : null}

            {view === "income" || view === "preserve" || view === "coast" || view === "drawdown" ? (
              <Result which={view} onReset={reset} />
            ) : null}
          </div>
        </div>
      ) : null}
    </>
  );
}
