# Booking system setup — one-time steps

The code is done. To make it work live, complete these 3 setup steps, then push.
Everything here is free.

---

## 1. Database (Supabase)

1. Go to https://supabase.com → sign up (free) → **New project**.
   - Give it a name, set a database password (save it somewhere), pick a region near Oman.
2. Wait ~2 min for it to spin up.
3. Left sidebar → **SQL Editor** → **New query**.
4. Open the file `supabase-setup.sql` from this project, copy ALL of it, paste, click **Run**.
   You should see "Success".
5. Left sidebar → **Project Settings** (gear) → **API**. Copy two values:
   - **Project URL**  → this is `SUPABASE_URL`
   - **service_role** secret key (under "Project API keys", click reveal) → this is
     `SUPABASE_SERVICE_ROLE_KEY`. ⚠️ Keep this secret — never put it in the website code.

---

## 2. Email (Gmail App Password)

Emails are sent from the business Gmail. Google requires an "App Password" for this.

1. The Gmail account must have **2-Step Verification ON**:
   https://myaccount.google.com/security → "2-Step Verification" → turn on.
2. Then go to https://myaccount.google.com/apppasswords
   - App name: type `makeupbysakhia` → **Create**.
   - Google shows a 16-character password like `abcd efgh ijkl mnop`.
   - Copy it and **remove the spaces** → this is `GMAIL_APP_PASSWORD`.
3. Note the Gmail address itself → this is `GMAIL_USER` (e.g. `sakiaalhinai@gmail.com`).

---

## 3. Environment variables (Vercel)

1. Vercel dashboard → your project → **Settings** → **Environment Variables**.
2. Add these five (apply to **Production**, **Preview**, and **Development**):

   | Name                        | Value                                  |
   |-----------------------------|----------------------------------------|
   | `SUPABASE_URL`              | Project URL from step 1                |
   | `SUPABASE_SERVICE_ROLE_KEY` | service_role key from step 1           |
   | `GMAIL_USER`                | the business Gmail address             |
   | `GMAIL_APP_PASSWORD`        | 16-char app password (no spaces)       |
   | `MANAGER_EMAIL`             | where booking alerts go (the Gmail)    |

3. **Redeploy** so the variables take effect: Vercel → **Deployments** → latest → "⋯" →
   **Redeploy**. (Or just push a commit — see below.)

---

## 4. Push the code

```bash
git add .
git commit -m "Add booking system: availability, manager confirm, customer email"
git push origin main
```

Vercel auto-deploys and installs the new dependencies (`@supabase/supabase-js`, `nodemailer`).

---

## How it works once live

1. Customer picks a date → the form checks availability and greys out booked times
   (and shows "Fully booked" once 4 sessions are taken that day).
2. Customer submits → the slot is **held** and you (manager) get an email with
   **Confirm** / **Decline** buttons.
3. You tap **Confirm** → the customer automatically gets a "Booking confirmed" email.
   You tap **Decline** → the slot reopens for someone else.

To see all bookings any time: Supabase → **Table Editor** → `bookings`.

## Update: Arabic language column (run once if you set up the table BEFORE Arabic support)

The booking table now stores which language the customer used, so their email comes
in that language. If you already created the table earlier, add the new column once:

Supabase → **SQL Editor** → **New query** → paste → **Run**:

```sql
alter table public.bookings add column if not exists lang text not null default 'en';
```

(Fresh setups using the latest `supabase-setup.sql` already include this — no action needed.)

## Notes
- The old `RESEND_API_KEY` is no longer used — you can delete it from Vercel if you added it.
- Times offered: 1–6 PM, max 4 bookings/day. To change these, edit `TIME_SLOTS` /
  `MAX_PER_DAY` in `api/_lib.js` and the matching `<option>`s in `index.html`.
