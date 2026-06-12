// Shared types for the server-rendered "guide" content that wraps each
// calculator (the how-it-works, key-concepts, sourced-defaults, and
// cross-link sections). Framework-free so the per-tool data modules and the
// server component that renders them can both import these without pulling in
// any client runtime. The healthcare page predates this and stays as-is; the
// social-security, mortgage, and investment pages share this structure.

// One block of the "How it works / what it accounts for" explainer: a short
// subheading and one or more plain-language paragraphs grounded in the actual
// calculation the tool runs.
export type HowItWorksSection = { heading: string; paragraphs: string[] };

// A term defined in plain language (the "key concepts" glossary on the page).
export type KeyConcept = { term: string; definition: string };

// A prefilled default the calculator ships with, plus where the number comes
// from — mirrors the visible, sourced field notes in the interactive panel so
// crawlers (and users without JavaScript) still see the basis for each value.
export type SourcedDefault = { value: string; label: string; source: string };

// An internal link out to related on-site content (glossary, what-is-FIRE, a
// FIRE strategy page). `blurb` says why it's relevant so the link is useful,
// not just a bare anchor.
export type CrossLink = { href: string; label: string; blurb: string };
