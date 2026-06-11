"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import type { Phase1PanelProps } from "@/components/planning/phase1-workspace";
import { FIRE_STRATEGIES } from "@/lib/data/fire-strategies";
import { PLANNING_TOOLS, type PlanningTool } from "@/lib/data/planning-tools";

const strategyCards = FIRE_STRATEGIES;

const toolIcons: Record<PlanningTool, ReactNode> = {
  "social-security": (
    <svg width="18" height="18" fill="none" stroke="#15803d" strokeWidth="2" aria-hidden="true">
      <path d="M9 1v16M4 4h7a3 3 0 0 1 0 6H5a3 3 0 0 0 0 6h8" />
    </svg>
  ),
  healthcare: (
    <svg
      width="18"
      height="18"
      fill="none"
      stroke="#15803d"
      strokeWidth="2"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M9 16s-6-3.8-6-8.5A3.4 3.4 0 0 1 9 5a3.4 3.4 0 0 1 6 2.5C15 12.2 9 16 9 16z" />
    </svg>
  ),
  mortgage: (
    <svg
      width="18"
      height="18"
      fill="none"
      stroke="#15803d"
      strokeWidth="2"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M2 9l7-6 7 6v7H2z" />
    </svg>
  ),
  investment: (
    <svg width="18" height="18" fill="none" stroke="#15803d" strokeWidth="2" aria-hidden="true">
      <path d="M2 14l4-4 3 2 7-8" />
    </svg>
  )
};

const toolBlurbs: Record<PlanningTool, { label: string; blurb: string }> = {
  "social-security": { label: "Social Security", blurb: "Benefits at 62, FRA, and 70." },
  healthcare: { label: "Healthcare", blurb: "ACA gap years through Medicare." },
  mortgage: { label: "Mortgage", blurb: "Payment & payoff cost." },
  investment: { label: "Investment", blurb: "Growth from contributions." }
};

const auroraCss = `
.aurora-home{--g700:#166534;--g600:#15803d;--g500:#16a34a;--g400:#34c77e;--gold:#f5b301;--gold6:#b07d00;--n900:#101410;--n700:#3c423b;--n500:#6b7167;--n300:#cdd1c9;--n200:#e7e9e3;--bg:#ffffff;--soft:#f7f8f5;position:relative;background:#fbfdfb;color:var(--n700);font-family:Inter,-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;font-feature-settings:"tnum" 1;-webkit-font-smoothing:antialiased;line-height:1.5;min-height:100vh;scroll-behavior:smooth}
.aurora-home .tnum{font-variant-numeric:tabular-nums}
.aurora-home .wrap{max-width:1240px;margin:0 auto;padding:0 32px;position:relative;z-index:2}
.aurora-home h1,.aurora-home h2,.aurora-home h3{color:var(--n900);margin:0;letter-spacing:-.02em}
.aurora-home a{color:inherit;text-decoration:none}
.aurora-home .aurora{position:absolute;top:0;left:0;right:0;height:1150px;z-index:0;overflow:hidden;pointer-events:none;-webkit-mask-image:linear-gradient(to bottom,#000 0,#000 48%,transparent 90%);mask-image:linear-gradient(to bottom,#000 0,#000 48%,transparent 90%)}
.aurora-home .orb{position:absolute;border-radius:50%;filter:blur(8px)}
.aurora-home .o1{width:500px;height:500px;left:-120px;top:-130px;background:radial-gradient(circle,#62d690,transparent 72%);opacity:.85}
.aurora-home .o2{width:560px;height:560px;right:-150px;top:-160px;background:radial-gradient(circle,#82c4ff,transparent 72%);opacity:.78}
.aurora-home .o3{width:470px;height:470px;right:110px;top:330px;background:radial-gradient(circle,#ffce5c,transparent 74%);opacity:.75}
.aurora-home .o4{width:470px;height:470px;left:140px;top:420px;background:radial-gradient(circle,#23b56d,transparent 74%);opacity:.55}
.aurora-home .grain{position:absolute;inset:0;opacity:.05;background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")}
.aurora-home .hero{position:relative;z-index:2;background:transparent}
.aurora-home .veil{position:absolute;inset:0;z-index:0;background:radial-gradient(68% 78% at 50% 34%, rgba(255,255,255,.42), transparent 80%);pointer-events:none}
.aurora-home .nav{display:flex;align-items:center;justify-content:space-between;gap:16px;padding:20px 0;position:relative;z-index:5}
.aurora-home .brand{display:flex;align-items:center;gap:10px;font-weight:700;color:var(--n900)}
.aurora-home .logo{width:30px;height:30px;border-radius:9px;background:var(--g600);display:grid;place-items:center;flex:none}
.aurora-home .brandtext b{font-weight:700;color:var(--n900);font-size:15px;display:block;letter-spacing:-.01em}
.aurora-home .brandtext small{display:block;color:var(--n500);font-size:11px;font-weight:500}
.aurora-home .navlinks{display:flex;gap:6px;align-items:center;font-size:14px;font-weight:500;color:var(--n500)}
.aurora-home .navitem{position:relative}
.aurora-home .navtrigger{display:inline-flex;align-items:center;gap:5px;background:none;border:0;cursor:pointer;font:inherit;font-weight:500;color:var(--n500);padding:8px 11px;border-radius:8px;transition:.15s}
.aurora-home .navtrigger .chev{width:11px;height:11px;transition:transform .15s}
.aurora-home .navitem:hover .navtrigger,.aurora-home .navitem:focus-within .navtrigger{color:var(--n900);background:rgba(16,40,24,.05)}
.aurora-home .navitem:hover .navtrigger .chev,.aurora-home .navitem:focus-within .navtrigger .chev{transform:rotate(180deg)}
.aurora-home .navlink{display:inline-flex;align-items:center;padding:8px 11px;border-radius:8px;color:var(--n500);cursor:pointer;transition:.15s}
.aurora-home .navlink:hover{color:var(--n900);background:rgba(16,40,24,.05)}
.aurora-home .dropdown{position:absolute;top:100%;left:0;min-width:248px;background:#fff;border:1px solid var(--n200);border-radius:12px;box-shadow:0 18px 40px rgba(16,40,24,.14);padding:6px;opacity:0;visibility:hidden;transform:translateY(-4px);transition:opacity .15s,transform .15s,visibility .15s;z-index:30}
.aurora-home .navitem:hover .dropdown,.aurora-home .navitem:focus-within .dropdown{opacity:1;visibility:visible;transform:translateY(0)}
.aurora-home .dropdown a{display:block;padding:9px 11px;border-radius:8px;color:var(--n700);font-size:13.5px;font-weight:600;white-space:nowrap}
.aurora-home .dropdown a:hover{background:var(--soft);color:var(--n900)}
.aurora-home .dropdown a small{display:block;color:var(--n500);font-size:11.5px;font-weight:400;margin-top:2px;white-space:normal;max-width:230px}
.aurora-home .btn{display:inline-flex;align-items:center;gap:7px;height:42px;padding:0 18px;border-radius:10px;font-weight:600;font-size:14px;cursor:pointer;transition:.2s}
.aurora-home .btn.p{background:var(--g600);color:#fff}
.aurora-home .btn.p:hover{background:var(--g700)}
.aurora-home .btn.g{border:1px solid var(--n200);background:#fff;color:var(--n900)}
.aurora-home .btn.g:hover{border-color:var(--n300)}
.aurora-home .btn.lg{height:50px;padding:0 22px;font-size:15px}
.aurora-home .hcenter{text-align:center;padding:40px 0 56px;max-width:1000px;margin:0 auto}
.aurora-home .tag{display:inline-flex;align-items:center;gap:8px;background:rgba(255,255,255,.72);border:1px solid rgba(255,255,255,.9);backdrop-filter:blur(6px);padding:7px 15px;border-radius:999px;font-size:12.5px;font-weight:600;color:var(--g700);box-shadow:0 2px 10px rgba(16,40,24,.05)}
.aurora-home .htitle{font-size:62px;line-height:1.05;font-weight:800;color:var(--n900);margin:18px 0 0;letter-spacing:-.03em}
.aurora-home .htitle .gold{color:var(--gold6)}
.aurora-home .hsub{font-size:20px;line-height:1.55;color:var(--n500);margin:22px auto 0;max-width:720px}
.aurora-home .hgloss{font-size:20px;line-height:1.55;color:var(--n500);opacity:.78;margin:16px auto 0;max-width:680px}
.aurora-home .hgloss strong{color:var(--n700);font-weight:600}
.aurora-home .cta{display:flex;gap:12px;margin-top:28px;justify-content:center;flex-wrap:wrap}
.aurora-home .floatkpi{max-width:780px;margin:40px auto 0;padding:6px}
.aurora-home .glass{background:rgba(255,255,255,.72);backdrop-filter:blur(12px);border:1px solid rgba(255,255,255,.85);box-shadow:0 28px 56px rgba(16,40,24,.16);border-radius:20px}
.aurora-home .kpis{display:grid;grid-template-columns:repeat(3,1fr)}
.aurora-home .kpi{padding:18px 22px;border-right:1px solid var(--n200)}
.aurora-home .kpi:last-child{border:none}
.aurora-home .kpi .l{font-size:11px;font-weight:600;letter-spacing:.05em;text-transform:uppercase;color:var(--n500)}
.aurora-home .kpi .n{font-size:28px;font-weight:800;color:var(--n900);letter-spacing:-.02em;margin-top:5px}
.aurora-home .kpi .d{font-size:11.5px;color:var(--g600);font-weight:600;margin-top:3px}
.aurora-home .stripe{display:grid;grid-template-columns:repeat(4,1fr);gap:1px;background:var(--n200);border:1px solid var(--n200);border-radius:14px;overflow:hidden;margin-top:56px}
.aurora-home .stat{background:#fff;padding:20px 24px}
.aurora-home .stat .n{font-size:26px;font-weight:800;color:var(--n900)}
.aurora-home .stat .l{font-size:13px;color:var(--n500);margin-top:2px}
.aurora-home .sec{padding:60px 0;scroll-margin-top:24px}
.aurora-home .sec h2{font-size:34px;text-align:center}
.aurora-home .sec .sub{text-align:center;color:var(--n500);margin:12px auto 0;max-width:620px;font-size:16px}
.aurora-home .grid3{display:grid;grid-template-columns:repeat(3,1fr);gap:18px;margin-top:36px}
.aurora-home .card{border:1px solid var(--n200);border-radius:14px;padding:24px;background:#fff;transition:.2s;display:block}
.aurora-home .card:hover{border-color:var(--g600);box-shadow:0 8px 24px rgba(21,128,61,.07);transform:translateY(-2px)}
.aurora-home .card .k{font-size:11px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:var(--n500)}
.aurora-home .card h3{font-size:19px;margin:8px 0}
.aurora-home .card p{font-size:14px;color:var(--n500);margin:0}
.aurora-home .card .go{display:inline-block;margin-top:14px;font-size:13px;font-weight:600;color:var(--g700)}
.aurora-home .softsec{background:var(--soft);border-radius:20px}
.aurora-home .grid4{display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-top:32px}
.aurora-home .tool{border:1px solid var(--n200);border-radius:12px;padding:18px;background:#fff;transition:.2s;display:block}
.aurora-home .tool:hover{border-color:var(--g600);transform:translateY(-2px)}
.aurora-home .tool .ic{width:34px;height:34px;border-radius:9px;background:var(--soft);display:grid;place-items:center;margin-bottom:12px}
.aurora-home .tool h4{font-size:14.5px;color:var(--n900);margin:0;font-weight:600}
.aurora-home .tool p{font-size:12.5px;color:var(--n500);margin:5px 0 0}
.aurora-home .foot{border-top:1px solid var(--n200);padding:30px 0;color:var(--n500);font-size:13px;display:flex;justify-content:space-between;gap:16px;flex-wrap:wrap;margin-top:30px}
@media(max-width:880px){
.aurora-home .htitle{font-size:40px}
.aurora-home .navlinks{display:none}
.aurora-home .grid3,.aurora-home .grid4,.aurora-home .stripe,.aurora-home .kpis{grid-template-columns:1fr}
}
`;

export function PathToFirePanel({ status }: Phase1PanelProps) {
  const toolHref = (slug: PlanningTool) =>
    PLANNING_TOOLS.find((tool) => tool.slug === slug)?.href ?? "/app/fire-path";

  return (
    <div className="aurora-home">
      <style dangerouslySetInnerHTML={{ __html: auroraCss }} />

      <div className="aurora" aria-hidden="true">
        <span className="orb o1" />
        <span className="orb o2" />
        <span className="orb o3" />
        <span className="orb o4" />
        <div className="grain" />
      </div>

      <section className="hero">
        <div className="veil" aria-hidden="true" />
        <div className="wrap">
          <nav className="nav" aria-label="Primary navigation">
            <Link href="/app/fire-path" className="brand">
              <span className="logo">
                <svg viewBox="0 0 64 64" width="18" aria-hidden="true">
                  <path
                    d="M16 40 L32 18 L48 40"
                    fill="none"
                    stroke="#fff"
                    strokeWidth="6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
              <span className="brandtext">
                <b>
                  Household <span style={{ color: "var(--g600)" }}>FIRE</span> Planner
                </b>
                <small>Your private workspace for early retirement</small>
              </span>
            </Link>
            <div className="navlinks">
              <div className="navitem">
                <button type="button" className="navtrigger" aria-haspopup="true">
                  Strategies
                  <svg className="chev" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                    <path d="M3 4.5 6 7.5 9 4.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
                <div className="dropdown" role="menu">
                  {strategyCards.map((card) => (
                    <Link
                      key={card.href}
                      href={card.href}
                      target="_blank"
                      rel="noreferrer"
                      role="menuitem"
                    >
                      {card.navLabel}
                      <small>{card.eyebrow}</small>
                    </Link>
                  ))}
                </div>
              </div>
              <div className="navitem">
                <button type="button" className="navtrigger" aria-haspopup="true">
                  Calculators
                  <svg className="chev" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                    <path d="M3 4.5 6 7.5 9 4.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
                <div className="dropdown" role="menu">
                  {PLANNING_TOOLS.map((tool) => (
                    <Link
                      key={tool.slug}
                      href={tool.href}
                      target="_blank"
                      rel="noreferrer"
                      role="menuitem"
                    >
                      {tool.title}
                    </Link>
                  ))}
                </div>
              </div>
              <Link href="/app/portfolio-lab" className="navlink">
                Portfolio
              </Link>
              <Link href="/about" className="navlink">
                About
              </Link>
            </div>
          </nav>

          <div className="hcenter">
            <span className="tag">● Private, transparent planning — for households</span>
            <h1 className="htitle">
              Plan your path to <span className="gold">early retirement</span> — together, and
              privately
            </h1>
            <p className="hsub">
              Map every account, income, and assumption to one clear path to financial
              independence — privately, with no brokerage login required.
            </p>
            <p className="hgloss">
              New to FIRE? It just means{" "}
              <strong>Financial Independence, Retire Early</strong>.
            </p>
            <div className="cta">
              <a href="#strategies" className="btn p lg">
                Map your path →
              </a>
              <Link href="/app/portfolio-lab" className="btn g lg">
                Track your whole portfolio
              </Link>
            </div>
            <div className="glass floatkpi">
              <div className="kpis">
                <div className="kpi">
                  <div className="l">Projected FIRE age</div>
                  <div className="n tnum">52</div>
                  <div className="d">▲ 3 yrs earlier</div>
                </div>
                <div className="kpi">
                  <div className="l">Assets at FIRE</div>
                  <div className="n tnum">$3.95M</div>
                  <div className="d">94% survival</div>
                </div>
                <div className="kpi">
                  <div className="l">Safe withdrawal</div>
                  <div className="n tnum">6.1%</div>
                  <div className="d">first-year draw</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="wrap">
        <div className="stripe">
          <div className="stat">
            <div className="n tnum">$0</div>
            <div className="l">Free, no login</div>
          </div>
          <div className="stat">
            <div className="n tnum">4</div>
            <div className="l">Built-in calculators</div>
          </div>
          <div className="stat">
            <div className="n tnum">3</div>
            <div className="l">FIRE strategies</div>
          </div>
          <div className="stat">
            <div className="n tnum">100%</div>
            <div className="l">Local &amp; private</div>
          </div>
        </div>

        <section className="sec" id="strategies">
          <h2>Three paths to reach early retirement</h2>
          <p className="sub">
            Pick how you&rsquo;ll live off your money in early retirement — from most cautious to
            most flexible.
          </p>
          <div className="grid3">
            {strategyCards.map((card) => (
              <Link
                key={card.href}
                href={card.href}
                target="_blank"
                rel="noreferrer"
                className="card"
                style={card.featured ? { borderColor: "var(--g600)" } : undefined}
              >
                <div className="k" style={card.featured ? { color: "var(--g700)" } : undefined}>
                  {card.eyebrow}
                </div>
                <h3>{card.title}</h3>
                <p>{card.description}</p>
                <span className="go">Explore →</span>
              </Link>
            ))}
          </div>
        </section>

        <section className="sec softsec" id="calculators">
          <h2>Free calculators that sharpen every assumption</h2>
          <p className="sub">
            Estimate Social Security, health insurance through Medicare, mortgage, and investment
            growth — then feed each result straight back into your numbers.
          </p>
          <div className="grid4">
            {PLANNING_TOOLS.map((tool) => (
              <Link
                key={tool.slug}
                href={toolHref(tool.slug)}
                target="_blank"
                rel="noreferrer"
                className="tool"
              >
                <div className="ic">{toolIcons[tool.slug]}</div>
                <h4>{toolBlurbs[tool.slug].label}</h4>
                <p>{toolBlurbs[tool.slug].blurb}</p>
              </Link>
            ))}
          </div>
        </section>

        <div className="foot">
          <span>
            © 2026 Household FIRE Planner · Planning estimates only. Not financial advice.
          </span>
          <span>Local workbook: {status}</span>
        </div>
      </div>
    </div>
  );
}
