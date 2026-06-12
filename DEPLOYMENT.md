# Deployment Guide — Household FIRE Planner

Step-by-step checklist to take the app live on **Vercel**, with a **Cloudflare** domain,
**Supabase** backend, and **Resend** for transactional email. Estimated time: 45–60 minutes
the first time. Tackle the sections in order — each builds on the previous one.

Stack at a glance:
- **Vercel** — hosts the Next.js app, auto-deploys on every push to `main`.
- **Cloudflare** — registrar / DNS for your domain (points the domain at Vercel; holds the email DNS records).
- **Supabase** — auth (email OTP / magic code) + cloud sync + feedback storage.
- **Resend** — sends auth OTP emails and feedback notifications from your domain.

---

## 0. Pre-flight (local, one-time)

- [ ] Confirm the three checks pass on your machine:

  ```bash
  npm test       # vitest, all green
  npm run lint   # eslint, no errors
  npm run build  # production build, no errors/warnings
  ```

- [ ] Confirm secrets are not tracked by git (should print **nothing**):

  ```bash
  git ls-files | grep -i env
  ```

  `.gitignore` already excludes `.env`, `.env.*`, `node_modules/`, and `.next/`.
  Your real secrets live only in `.env.local` (gitignored). `.env.example` (committed)
  documents the variable names with placeholder values.

---

## (a) Push to GitHub

- [ ] Create an empty repo on github.com (private is fine — Vercel can still deploy it).
- [ ] From the project root:

  ```bash
  git add .
  git commit -m "Production-ready: deployment config + docs"
  git remote add origin https://github.com/<your-username>/<repo-name>.git
  git push -u origin main
  ```

  ⚠️ Double-check `.env.local` is **not** in the push (it's gitignored — verify with
  `git ls-files | grep -i env` returning nothing).

---

## (b) Import to Vercel + set environment variables

- [ ] Sign in at **vercel.com** with your GitHub account.
- [ ] **Add New → Project** → import your repo. Vercel auto-detects Next.js; keep the
  default build settings (build command `next build`, output handled automatically).
- [ ] Before clicking **Deploy**, open **Environment Variables** and add the following
  (names must match `.env.example` exactly; copy values from your local `.env.local`).
  Set each for **Production** (and Preview, if you want preview deploys to work):

  | Name | Example value | Notes |
  |---|---|---|
  | `NEXT_PUBLIC_SUPABASE_URL` | `https://abcd.supabase.co` | Supabase → Settings → API |
  | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJhbGci…` | the **anon/public** key — never the service-role key |
  | `NEXT_PUBLIC_SITE_URL` | `https://www.yourdomain.com` | your final domain, **no trailing slash**; drives sitemap/robots/canonical/OG |
  | `EODHD_API_KEY` | `xxxxxxxx` | market-price + symbol search API |
  | `MARKET_DATA_PROVIDER` | `eodhd` | leave as `eodhd` |

  If your custom domain isn't wired up yet, temporarily set `NEXT_PUBLIC_SITE_URL` to the
  `https://<project>.vercel.app` URL and update it after section (c).

  ⚠️ `NEXT_PUBLIC_*` vars are inlined at **build time** — after changing any of them you
  must **redeploy** (Deployments → ⋯ → Redeploy) for the change to take effect.

- [ ] Click **Deploy** and wait for the green checkmark. Note the `*.vercel.app` URL.

---

## (c) Add the Cloudflare domain to Vercel + DNS

You'll keep DNS at Cloudflare and point it at Vercel.

- [ ] In **Vercel → Project → Settings → Domains**, add both `yourdomain.com` and
  `www.yourdomain.com`. Pick one as primary (e.g. `www`) and let Vercel redirect the other.
  Vercel will show the exact DNS records it wants.
- [ ] In the **Cloudflare dashboard → your domain → DNS → Records**, add what Vercel asked for:

  | Type | Name | Value | Proxy |
  |---|---|---|---|
  | `A` | `@` (apex) | `76.76.21.21` | **DNS only (grey cloud)** |
  | `CNAME` | `www` | `cname.vercel-dns.com` | **DNS only (grey cloud)** |

  Use the exact targets Vercel shows you — they occasionally change.
  Set these records to **DNS only / grey cloud**, not proxied (orange cloud): Vercel
  terminates TLS and issues the certificate itself, and Cloudflare proxying on top can
  cause redirect loops or cert-validation failures.
- [ ] Back in Vercel → Domains, wait for both domains to show **Valid Configuration**
  (DNS can take a few minutes to a couple of hours). HTTPS is issued automatically.
- [ ] Once the domain is live, set `NEXT_PUBLIC_SITE_URL` to the real domain in Vercel and
  **redeploy** so sitemap/robots/canonical URLs use it.

---

## (d) Supabase production config

The app uses **email OTP (one-time code)** auth — the user receives a numeric code and
types it back, so there is **no email link to redirect to**.

- [ ] **Supabase → Authentication → URL Configuration → Site URL**: set to your production
  domain, `https://www.yourdomain.com` (no trailing slash). This is used as the default base
  for the project and email templates.
- [ ] **Redirect URLs**: the OTP/code flow does **not** use redirect URLs, so you do **not**
  need to add any `…/auth/callback` entries for login to work. (Only add redirect URLs if you
  later switch to magic-**link** or OAuth providers.)
- [ ] **Database schema** — in **SQL Editor**, run the full `supabase/schema.sql` (idempotent).
  If you've run it before, at minimum run the `feedback_messages` block at the bottom — it
  powers the Contact/feedback form. Visitors can only INSERT; nothing is publicly readable.
- [ ] Read feedback later via **Table Editor → `feedback_messages`**.

---

## (e) Resend: verify your domain + Supabase custom SMTP

By default Supabase Auth sends OTP emails from a shared address with tight rate limits and
poor deliverability. For production, verify your domain in Resend and route Supabase auth
email through it.

### e1. Verify the domain in Resend (DNS lives in Cloudflare)

- [ ] **resend.com → Domains → Add Domain** → enter `yourdomain.com`.
- [ ] Resend shows a set of DNS records. In **Cloudflare → DNS → Records**, add them exactly
  as given. You'll typically add (use Resend's exact hostnames/values — these are illustrative):

  | Type | Name | Value | Purpose |
  |---|---|---|---|
  | `TXT` | `send` (or `@`) | `v=spf1 include:amazonses.com ~all` | **SPF** — authorizes the sender |
  | `TXT`/`CNAME` | `resend._domainkey` | (long key Resend provides) | **DKIM** — signs the mail |
  | `MX` | `send` | `feedback-smtp.<region>.amazonses.com` (prio 10) | return-path |
  | `TXT` | `_dmarc` | `v=DMARC1; p=none; rua=mailto:dmarc@yourdomain.com` | **DMARC** — reporting/policy |

  Set these to **DNS only (grey cloud)** in Cloudflare. Start DMARC at `p=none` (monitor),
  then tighten to `quarantine`/`reject` once SPF+DKIM pass cleanly for a week or two.
- [ ] Back in Resend, click **Verify** until the domain shows **Verified** (DNS propagation
  can take minutes to a few hours).
- [ ] **Resend → API Keys → Create API Key** (Sending access). Copy it (starts with `re_`) —
  shown only once.

### e2. Point Supabase Auth SMTP at Resend

- [ ] **Supabase → Project Settings → Authentication → SMTP Settings → Enable custom SMTP**:

  | Field | Value |
  |---|---|
  | Host | `smtp.resend.com` |
  | Port | `465` (SSL) or `587` (STARTTLS) |
  | Username | `resend` |
  | Password | your Resend API key (`re_…`) |
  | Sender email | `noreply@yourdomain.com` |
  | Sender name | `Household FIRE Planner` |

- [ ] Save. Send yourself a test login OTP from the live site and confirm it arrives **from
  `noreply@yourdomain.com`** (not the Supabase default sender), lands in the inbox (not spam),
  and the code logs you in.

### e3. (Optional) Feedback-notification email

The Contact form stores messages in `feedback_messages` and a Supabase **Edge Function**
(`supabase/functions/notify-feedback/index.ts`) emails them to you via Resend.

```bash
# one-time: install + login
brew install supabase/tap/supabase
supabase login

cd "/Users/chongzha/Desktop/CODEX CLI/Obsidian101/Projects/Vibe Coding/Freedom Path"
supabase link --project-ref <YOUR_PROJECT_REF>   # the part before .supabase.co in your URL

# secrets the function needs (NOT Vercel env vars — these are Supabase secrets)
supabase secrets set RESEND_API_KEY=re_xxxxxxxxxxxx
supabase secrets set FEEDBACK_FROM_EMAIL=noreply@yourdomain.com   # now that the domain is verified
supabase secrets set FEEDBACK_WEBHOOK_SECRET=$(openssl rand -hex 24)
supabase secrets list                              # copy the webhook secret for the next step

supabase functions deploy notify-feedback --no-verify-jwt
```

- [ ] **Supabase → Database → Webhooks → Create webhook**: table `feedback_messages`, event
  **Insert** only, type **Supabase Edge Function → notify-feedback**, and add HTTP header
  `x-webhook-secret` = the `FEEDBACK_WEBHOOK_SECRET` from above. Save.
- [ ] Submit a test message at `/about` (feedback form) and confirm the email arrives.
  Logs: **Edge Functions → notify-feedback → Logs** (401 = secret mismatch; 502 = Resend rejected).

---

## (f) Post-deploy checks

Open each on the live domain and confirm:

- [ ] `https://www.yourdomain.com` → loads the planner over HTTPS, no console errors.
- [ ] `https://www.yourdomain.com/robots.txt` → rules + a `Sitemap:` line pointing at **your domain** (not localhost).
- [ ] `https://www.yourdomain.com/sitemap.xml` → lists all pages with **your domain**.
- [ ] **Auth**: sign up / log in with a real email → OTP arrives from `noreply@yourdomain.com`,
  code logs you in, save a plan, reload → data persists (confirms Supabase env + SMTP).
- [ ] **Contact form** (`/about`) → submit a message → row appears in Supabase `feedback_messages`
  and (if e3 is set up) the notification email arrives.
- [ ] **Price refresh** → a portfolio page refreshes prices without error (confirms `EODHD_API_KEY`).
- [ ] **Mobile** → open a calculator on a phone: layout, tooltips, and table scrolling work.
- [ ] **SEO**: in **Google Search Console**, add the domain property, verify via DNS (Cloudflare),
  and submit `sitemap.xml`.

---

## Ongoing

- Every `git push` to `main` auto-deploys to production; other branches get preview URLs.
- Changing any `NEXT_PUBLIC_*` value requires a **redeploy** (build-time inlining).
- Yearly: refresh the healthcare constants in `src/lib/calculations/healthcare-data.ts` and
  Social Security figures when new numbers publish.

## Troubleshooting

| Symptom | Likely cause / fix |
|---|---|
| Sitemap/robots show `localhost:3000` | `NEXT_PUBLIC_SITE_URL` not set at build time → set it in Vercel, **redeploy** |
| Domain stuck "Invalid Configuration" in Vercel | Cloudflare record proxied (orange cloud) → switch to **DNS only**, or wrong A/CNAME target |
| Auth OTP email never arrives / goes to spam | Custom SMTP not enabled, or Resend domain not verified → finish section (e) |
| OTP email comes from Supabase default sender | Custom SMTP not saved in Supabase → re-check SMTP settings (e2) |
| Contact form: "feedback service isn't configured" | `NEXT_PUBLIC_SUPABASE_*` missing on Vercel → add, redeploy |
| Contact form: "Something went wrong sending" | `feedback_messages` table/policy not created → run the SQL block (d) |
| Price refresh fails in production | `EODHD_API_KEY` / `MARKET_DATA_PROVIDER` missing on Vercel |
| Build passes locally, fails on Vercel | Read the Vercel build log — usually a lint/type error; reproduce with `npm run build` |
