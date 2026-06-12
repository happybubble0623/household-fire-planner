"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { AccountNav } from "@/components/layout/account-nav";
import { PathPicker } from "@/components/planning/path-picker";
import type { Phase1PanelProps } from "@/components/planning/phase1-workspace";
import { FIRE_STRATEGIES, FIRE_STRATEGY_CARDS } from "@/lib/data/fire-strategies";
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
.aurora-home{--g700:#166534;--g600:#15803d;--g500:#16a34a;--g400:#34c77e;--g300:#6ee0a0;--g100:#d1fadf;--g50:#ecfdf3;--gold:#f5b301;--gold6:#b07d00;--gold50:#fff8e6;--gold100:#fdecbf;--n900:#101410;--n800:#2c2b27;--n700:#3c423b;--n600:#5c5b53;--n500:#6b7167;--n300:#cdd1c9;--n200:#e7e9e3;--surface:#ffffff;--shadow-sm:0 1px 2px rgba(28,27,24,.06),0 1px 3px rgba(28,27,24,.05);--shadow-md:0 6px 16px rgba(28,27,24,.08);--bg:#ffffff;--soft:#f7f8f5;position:relative;background:#fbfdfb;color:var(--n700);font-family:Inter,-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;font-feature-settings:"tnum" 1;-webkit-font-smoothing:antialiased;line-height:1.5;min-height:100vh;scroll-behavior:smooth}
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
.aurora-home .navright{display:flex;align-items:center;gap:6px}
.aurora-home .navdivider{width:1px;height:20px;background:var(--n200);margin:0 4px}
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

/* ---- "Which path fits you?" — three comparison cards + Help me choose ---- */
.aurora-home .paths-head{display:flex;align-items:flex-end;justify-content:space-between;gap:20px;flex-wrap:wrap;margin-top:0}
.aurora-home .paths-headtext{flex:1;min-width:260px}
.aurora-home .paths-head h2{font-size:34px;text-align:left;letter-spacing:-.02em}
.aurora-home .paths-sub{color:var(--n500);font-size:15px;margin:10px 0 0;max-width:560px;text-align:left}
.aurora-home .paths-helpbtn{display:inline-flex;align-items:center;gap:8px;flex:none;height:42px;padding:0 18px;border-radius:12px;background:var(--gold50);border:1px solid var(--gold100);color:var(--gold6);font-weight:600;font-size:14px;cursor:pointer;transition:.15s}
.aurora-home .paths-helpbtn:hover{background:var(--gold100)}

.aurora-home .paths-picker{flex-basis:100%;width:100%;order:3;margin-top:24px;background:var(--surface);border:1px solid var(--n200);border-radius:18px;box-shadow:var(--shadow-md);overflow:hidden;animation:pathsin .22s ease}
@keyframes pathsin{from{opacity:0;transform:translateY(-6px)}to{opacity:1;transform:none}}
.aurora-home .paths-ptop{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:16px 22px;background:linear-gradient(120deg,var(--g50),var(--gold50));border-bottom:1px solid var(--n200)}
.aurora-home .paths-lt{display:flex;align-items:center;gap:10px}
.aurora-home .paths-pico{width:30px;height:30px;border-radius:9px;background:var(--gold);display:flex;align-items:center;justify-content:center;flex:none}
.aurora-home .paths-ptop b{font-size:14.5px;font-weight:700;color:var(--n900)}
.aurora-home .paths-ptop small{display:block;font-size:12px;color:var(--n500);font-weight:500}
.aurora-home .paths-closex{border:none;background:transparent;cursor:pointer;color:var(--n500);width:30px;height:30px;border-radius:8px;display:flex;align-items:center;justify-content:center}
.aurora-home .paths-closex:hover{background:rgba(0,0,0,.05);color:var(--n800)}
.aurora-home .paths-pbody{padding:24px 22px 22px}
.aurora-home .paths-stepno{font-size:12px;font-weight:700;letter-spacing:.05em;text-transform:uppercase;color:var(--g700)}
.aurora-home .paths-q{font-size:18px;font-weight:600;color:var(--n900);letter-spacing:-.01em;margin:6px 0 18px;max-width:560px;line-height:1.3}
.aurora-home .paths-opts{display:flex;gap:12px;flex-wrap:wrap}
.aurora-home .paths-opt{flex:1;min-width:140px;display:flex;align-items:center;justify-content:center;gap:8px;height:50px;padding:0 18px;border-radius:13px;border:1.5px solid var(--n200);background:#fff;font-weight:600;font-size:15px;color:var(--n800);cursor:pointer;transition:.15s}
.aurora-home .paths-opt:hover{border-color:var(--g400);background:var(--g50);color:var(--g700)}
.aurora-home .paths-oy{width:20px;height:20px;border-radius:6px;display:flex;align-items:center;justify-content:center;flex:none}
.aurora-home .paths-oy-yes{background:var(--g100)}
.aurora-home .paths-oy-no{background:var(--n200)}
.aurora-home .paths-progress{display:flex;gap:6px;margin-top:20px}
.aurora-home .paths-progress span{height:4px;flex:1;border-radius:999px;background:var(--n200)}
.aurora-home .paths-progress span.on{background:var(--g500)}
.aurora-home .paths-backlink{display:inline-flex;align-items:center;gap:6px;margin-top:16px;padding:0;border:none;background:none;font:inherit;font-size:13px;font-weight:600;color:var(--n500);cursor:pointer}
.aurora-home .paths-backlink:hover{color:var(--g700)}
.aurora-home .paths-reslead{font-size:12px;font-weight:700;letter-spacing:.05em;text-transform:uppercase;color:var(--n500)}
.aurora-home .paths-rescard{margin-top:10px;border:1.5px solid var(--g300);background:var(--g50);border-radius:16px;padding:20px}
.aurora-home .paths-rtag{font-size:11.5px;font-weight:600;padding:4px 10px;border-radius:999px;background:#fff;color:var(--g700);display:inline-block;margin-bottom:10px}
.aurora-home .paths-rescard h3{font-size:24px;color:var(--g700);margin:0;letter-spacing:-.01em}
.aurora-home .paths-why{color:var(--n700);font-size:14.5px;line-height:1.5;margin:8px 0 18px;max-width:560px}
.aurora-home .paths-resactions{display:flex;align-items:center;gap:16px;flex-wrap:wrap}
.aurora-home .paths-resbtn{display:inline-flex;align-items:center;gap:8px;height:46px;padding:0 22px;border-radius:12px;background:var(--g600);color:#fff;font-weight:600;font-size:14.5px;border:none;cursor:pointer;box-shadow:var(--shadow-sm)}
.aurora-home .paths-resbtn:hover{background:var(--g700)}
.aurora-home .paths-seeall{font-size:13.5px;font-weight:600;color:var(--g700);background:none;border:none;padding:0;cursor:pointer}
.aurora-home .paths-seeall:hover{text-decoration:underline}
.aurora-home .paths-fallback{margin-top:16px;display:flex;align-items:center;gap:9px;font-size:13px;color:var(--n600);background:var(--gold50);border:1px solid var(--gold100);border-radius:11px;padding:11px 14px}

.aurora-home .paths-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:20px;align-items:stretch;margin-top:32px}
.aurora-home .paths-card{background:var(--surface);border:1px solid var(--n200);border-radius:18px;box-shadow:var(--shadow-sm);padding:24px 22px 22px;display:flex;flex-direction:column;position:relative;transition:.18s}
.aurora-home .paths-card:hover{box-shadow:var(--shadow-md);transform:translateY(-2px)}
.aurora-home .paths-card.featured{border-color:var(--gold);border-width:1.5px;box-shadow:0 0 0 4px var(--gold50),var(--shadow-md)}
.aurora-home .paths-badge{position:absolute;top:-13px;left:22px;background:var(--gold);color:var(--n900);font-size:11.5px;font-weight:700;padding:5px 12px;border-radius:999px;display:inline-flex;align-items:center;gap:5px;box-shadow:var(--shadow-sm);white-space:nowrap}
.aurora-home .paths-tag{display:inline-flex;align-self:flex-start;font-size:11.5px;font-weight:600;letter-spacing:.02em;padding:4px 10px;border-radius:999px;background:var(--g50);color:var(--g700);margin-bottom:14px}
.aurora-home .paths-card.featured .paths-tag{background:var(--gold50);color:var(--gold6)}
.aurora-home .paths-card h3{font-size:19px;font-weight:700;letter-spacing:-.01em;margin:0;color:var(--n900)}
.aurora-home .paths-idea{color:var(--n800);font-size:14px;line-height:1.45;margin:8px 0 16px}
.aurora-home .paths-feats{list-style:none;margin:0 0 18px;padding:0;display:flex;flex-direction:column;gap:7px}
.aurora-home .paths-feats li{display:flex;align-items:center;gap:8px;font-size:13px;line-height:1.25;color:var(--n800);font-weight:500}
.aurora-home .paths-feats li svg{flex:none}
.aurora-home .paths-btn{margin-top:auto;display:inline-flex;align-items:center;justify-content:center;gap:7px;height:44px;border-radius:12px;font-weight:600;font-size:14px;border:1px solid var(--n200);background:#fff;color:var(--n800);cursor:pointer;transition:.15s}
.aurora-home .paths-btn:hover{border-color:var(--g300);background:var(--g50);color:var(--g700)}
.aurora-home .paths-card.featured .paths-btn{background:var(--g600);border-color:var(--g600);color:#fff}
.aurora-home .paths-card.featured .paths-btn:hover{background:var(--g700)}
@media(max-width:880px){
.aurora-home .htitle{font-size:40px}
.aurora-home .navlinks{display:none}
.aurora-home .navdivider{display:none}
.aurora-home .grid3,.aurora-home .grid4,.aurora-home .stripe,.aurora-home .kpis{grid-template-columns:1fr}
.aurora-home .paths-grid{grid-template-columns:1fr;gap:16px}
.aurora-home .paths-head{flex-direction:column;align-items:stretch}
.aurora-home .paths-head h2{font-size:27px}
.aurora-home .paths-helpbtn{width:100%;justify-content:center}
.aurora-home .paths-opts{flex-direction:column}
.aurora-home .paths-opt{min-width:0;width:100%}
.aurora-home .paths-resactions{flex-direction:column;align-items:stretch}
.aurora-home .paths-resbtn{justify-content:center}
.aurora-home .paths-seeall{text-align:center}
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
            <div className="navright">
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
                <span aria-hidden="true" className="navdivider" />
              </div>
              <AccountNav variant="desktop" />
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
              New to <strong>FIRE</strong>? It just means{" "}
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

        <section className="sec paths" id="strategies">
          <div className="paths-head">
            <div className="paths-headtext">
              <h2>Three paths to reach early retirement</h2>
              <p className="paths-sub">
                Each path is a different way to fund the years after work. Pick the one that sounds
                like you — you can switch anytime.
              </p>
            </div>
            <PathPicker />
          </div>

          <div className="paths-grid">
            {FIRE_STRATEGY_CARDS.map((card) => (
              <div
                key={card.href}
                className={card.featured ? "paths-card featured" : "paths-card"}
              >
                {card.featured ? (
                  <div className="paths-badge">
                    <svg viewBox="0 0 24 24" width="13" height="13" fill="currentColor" aria-hidden="true">
                      <path d="M12 2l2.6 6.6L21 9.2l-5 4.6L17.4 21 12 17.3 6.6 21 8 13.8l-5-4.6 6.4-.6z" />
                    </svg>
                    Most popular · Start here
                  </div>
                ) : null}
                <span className="paths-tag">{card.tag}</span>
                <h3>{card.navLabel}</h3>
                <p className="paths-idea">{card.idea}</p>
                <ul className="paths-feats">
                  {card.bullets.map((bullet) => (
                    <li key={bullet}>
                      <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="#16a34a" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="M5 12l5 5L20 6" />
                      </svg>
                      {bullet}
                    </li>
                  ))}
                </ul>
                <Link
                  href={card.href}
                  target="_blank"
                  rel="noreferrer"
                  className="paths-btn"
                >
                  Start this path →
                </Link>
              </div>
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
