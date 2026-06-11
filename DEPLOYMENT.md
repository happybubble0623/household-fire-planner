# Deployment Guide — Household FIRE Planner

Step-by-step checklist to take the app live. Estimated time: 30–45 minutes the first time.
Recommended host: **Vercel** (built by the Next.js team, free Hobby tier, zero server config).

---

## 1. Before you deploy (one-time, local)

- [ ] Run the checks on your Mac and make sure all pass:

  ```bash
  npm test -- --run
  npm run lint
  npm run build
  ```

- [ ] Push the project to a GitHub repository (private is fine). Vercel deploys from GitHub.
  If the project isn't a git repo yet:

  ```bash
  git init
  git add .
  git commit -m "Initial deploy"
  # create an empty repo on github.com, then:
  git remote add origin https://github.com/<your-username>/<repo-name>.git
  git push -u origin main
  ```

  ⚠️ Confirm `.env.local` is in `.gitignore` before pushing — your API keys must never be committed.

## 2. Supabase (one-time)

- [ ] In the Supabase dashboard → **SQL Editor**, run the full `supabase/schema.sql`.
  If you ran it before, at minimum run the new `feedback_messages` block at the bottom
  (this powers the Contact page; without it the form shows an error).
- [ ] To read feedback later: dashboard → **Table Editor** → `feedback_messages`.
  (Visitors can only insert; nothing can be read through the public API.)

## 3. Create the Vercel project

- [ ] Sign up at vercel.com with your GitHub account.
- [ ] **Add New → Project** → import your repo. Vercel auto-detects Next.js — keep the
  default build settings (build command `next build`, no changes needed).
- [ ] Before clicking Deploy, open **Environment Variables** and add these five
  (copy values from your local `.env.local`):

  | Name | Value | Notes |
  |---|---|---|
  | `NEXT_PUBLIC_SUPABASE_URL` | your Supabase project URL | from Supabase → Settings → API |
  | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | your anon/public key | same page; the *anon* key, never the service-role key |
  | `EODHD_API_KEY` | your EODHD key | market-price refresh |
  | `MARKET_DATA_PROVIDER` | `eodhd` | |
  | `NEXT_PUBLIC_SITE_URL` | your final URL, e.g. `https://www.yourdomain.com` | drives sitemap.xml, robots.txt, canonical/OpenGraph URLs — no trailing slash |

  If you don't have a custom domain yet, set `NEXT_PUBLIC_SITE_URL` to the
  `https://<project>.vercel.app` URL for now and update it in step 4.

- [ ] Click **Deploy** and wait for the green checkmark.

## 4. Custom domain (optional but recommended for SEO)

- [ ] Vercel project → **Settings → Domains** → add `yourdomain.com` (buy one at
  Namecheap/Cloudflare/Google Domains if needed, ~$10–15/yr).
- [ ] Follow Vercel's DNS instructions (usually one A record + one CNAME). HTTPS is automatic.
- [ ] Update `NEXT_PUBLIC_SITE_URL` to the real domain (Settings → Environment Variables),
  then **Deployments → ⋯ → Redeploy** so the sitemap picks it up.
  ⚠️ `NEXT_PUBLIC_*` variables are baked in at build time — changing one always requires a redeploy.

## 5. Verify the live site (5 minutes)

Open these and check each works:

- [ ] `https://yourdomain.com` → redirects to the planner
- [ ] `https://yourdomain.com/robots.txt` → shows rules + sitemap line with your domain
- [ ] `https://yourdomain.com/sitemap.xml` → lists all pages with your domain (not localhost)
- [ ] `https://yourdomain.com/contact` → submit a test message, then confirm it appears in
  Supabase → Table Editor → `feedback_messages`
- [ ] A calculator page on your phone (mobile layout, tooltips, tables scroll properly)
- [ ] Sign up / log in, save a plan, reload — confirms Supabase env vars are correct

## 6. Get indexed by Google (the SEO payoff)

- [ ] Go to **Google Search Console** (search.google.com/search-console) → Add property →
  Domain → verify via the DNS record it gives you (add it where your DNS lives).
- [ ] In Search Console → **Sitemaps** → submit `sitemap.xml`.
- [ ] Optional: do the same at **Bing Webmaster Tools** (can import from Search Console).
- [ ] Expect first indexing in days; meaningful impressions take weeks. Check
  Search Console → Pages to see what's indexed and any mobile/crawl issues.

## 7. Ongoing

- Every `git push` to `main` auto-deploys to production; pushes to other branches get
  preview URLs.
- Feedback emails: new contact-form messages are emailed to you automatically once you
  complete the "Email notifications for feedback" section below.
- Yearly: refresh the 2026 healthcare constants in `src/lib/calculations/healthcare-data.ts`
  and Social Security figures when new numbers are published.

## Email notifications for feedback (one-time, ~15 minutes)

Sends every new contact-form message to your inbox via a Supabase Edge Function
(`supabase/functions/notify-feedback/index.ts`) and Resend (free email API).

### A. Resend account

- [ ] Sign up at resend.com **using zhchong0623@gmail.com** (important: the free
  no-domain-verification mode only delivers to your own account email).
- [ ] Dashboard → **API Keys** → Create API key (name: `fire-planner`, permission:
  Sending access). Copy the key (starts with `re_`) — shown only once.

### B. Deploy the function (Supabase CLI, run on your Mac)

```bash
# one-time install + login
brew install supabase/tap/supabase
supabase login                       # opens browser

cd "/Users/chongzha/Desktop/CODEX CLI/Obsidian101/Projects/Vibe Coding/Freedom Path"
supabase link --project-ref <YOUR_PROJECT_REF>   # ref = the part before .supabase.co in your project URL

# set the secrets the function needs
supabase secrets set RESEND_API_KEY=re_xxxxxxxxxxxx
supabase secrets set FEEDBACK_WEBHOOK_SECRET=$(openssl rand -hex 24)
# print the secret you just generated — you'll paste it into the webhook in step C:
supabase secrets list

# deploy (no JWT check; the function enforces its own shared secret instead)
supabase functions deploy notify-feedback --no-verify-jwt
```

### C. Database webhook (Supabase dashboard)

- [ ] Dashboard → **Database → Webhooks** → Enable webhooks (if asked) → **Create webhook**:
  - Name: `notify-feedback`
  - Table: `feedback_messages` · Events: check **Insert** only
  - Type: **Supabase Edge Function** → pick `notify-feedback`
    (or HTTP Request to `https://<YOUR_PROJECT_REF>.functions.supabase.co/notify-feedback`)
  - HTTP Headers → add: `x-webhook-secret` = the FEEDBACK_WEBHOOK_SECRET value from step B
- [ ] Save.

### D. Test

- [ ] Submit a test message at `/contact` (locally or on the live site).
- [ ] You should get an email at zhchong0623@gmail.com within seconds; replying goes
  straight to the visitor (reply-to is set to their address).
- [ ] If no email: Dashboard → **Edge Functions → notify-feedback → Logs** shows the error
  (401 = secret header mismatch; 502 = Resend rejected — check the API key).

Later, if you verify your own domain in Resend, set a nicer sender with:
`supabase secrets set FEEDBACK_FROM_EMAIL=feedback@yourdomain.com` and redeploy.

## Troubleshooting

| Symptom | Likely cause / fix |
|---|---|
| Contact form: "feedback service isn't configured" | `NEXT_PUBLIC_SUPABASE_*` vars missing on Vercel → add, redeploy |
| Contact form: "Something went wrong sending" | `feedback_messages` table/policy not created → run the SQL block (step 2) |
| Sitemap shows `localhost:3000` | `NEXT_PUBLIC_SITE_URL` not set at build time → set it, redeploy |
| Price refresh fails in production | `EODHD_API_KEY` / `MARKET_DATA_PROVIDER` missing on Vercel |
| Build fails on Vercel but works locally | Check the Vercel build log; usually a lint/type error — run `npm run build` locally first |
