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

## 2. Environment variables (Vercel)

1. Vercel dashboard → your project → **Settings** → **Environment Variables**.
2. Add these three (apply to **Production**, **Preview**, and **Development**):

   | Name                        | Value                                    |
   |-----------------------------|------------------------------------------|
   | `SUPABASE_URL`              | Project URL from step 1                  |
   | `SUPABASE_SERVICE_ROLE_KEY` | service_role key from step 1             |
   | `ADMIN_PASSWORD`            | the password for signing in to `/admin`  |

3. **Redeploy** so the variables take effect: Vercel → **Deployments** → latest → "⋯" →
   **Redeploy**. (Or just push a commit — see below.)

---

## 3. Push the code

```bash
git add .
git commit -m "Update booking system"
git push origin main
```

Vercel auto-deploys and installs the dependency (`@supabase/supabase-js`).

---

## How it works once live

1. Customer picks a date → the form checks availability and greys out booked times
   (and shows "Fully booked" once 4 sessions are taken that day).
2. Customer submits → the slot is **held** and WhatsApp opens on their phone with the
   booking details already typed. They press send and it arrives in your chat.
3. You open `/admin` → **Confirm** or **Decline**. Either one opens WhatsApp with a reply
   to that customer ready to send, in English and Arabic.

To see all bookings any time: the `/admin` dashboard, or Supabase → **Table Editor** →
`bookings`.

**No email is involved anywhere.** The site used to send Gmail notifications; that was
removed in September 2026 because WhatsApp replaced it. If you ever want email back, it
would need a fresh mail provider — the old `GMAIL_USER`, `GMAIL_APP_PASSWORD` and
`MANAGER_EMAIL` variables can be deleted from Vercel.

## Update: Arabic language column (run once if you set up the table BEFORE Arabic support)

The booking table stores which language the customer used, so the WhatsApp messages come
in that language. If you already created the table earlier, add the new column once:

Supabase → **SQL Editor** → **New query** → paste → **Run**:

```sql
alter table public.bookings add column if not exists lang text not null default 'en';
```

(Fresh setups using the latest `supabase-setup.sql` already include this — no action needed.)

## Owner dashboard (`/admin`)

The dashboard at `https://makeupbysakhia.vercel.app/admin` shows every booking, lets you
confirm/decline them, message customers on WhatsApp, add bookings you took by hand, close
days you're away, and manage the home page gallery images.

**Two one-time steps:**

1. **Re-run `supabase-setup.sql`.** Supabase → SQL Editor → paste the whole file → Run.
   It adds the `blocked_slots` and `gallery` tables. Running it again is safe; nothing
   existing is deleted.
2. **Add one environment variable in Vercel** (Settings → Environment Variables), then redeploy:

   | Name             | Value                                        |
   |------------------|----------------------------------------------|
   | `ADMIN_PASSWORD` | the password for signing in to `/admin`      |

   Pick something long. Anyone with this password can see customer details and change
   bookings. Changing it later signs everyone out of the dashboard.

**Confirming or declining opens WhatsApp** with a message to that customer already written,
in both English and Arabic (their own language first). Press send in WhatsApp — the booking
status is already saved either way.

**Add it to your iPhone home screen:** open `/admin` in Safari → Share → *Add to Home
Screen*. It gets the ✦ icon and opens full screen like an app.

The Gallery tab also manages the **category cards** — the big tiles under “Explore by
Category”, which are the same thing as the gallery filter buttons. You can add a card,
rename it in English and Arabic, give it a photo, reorder it, or delete it. With no photo,
a card shows a colour gradient. A card can only be deleted once it holds no photos, so
nothing disappears from the gallery by accident.

Uploaded photos are stored in Supabase Storage in a bucket called `gallery`, which
is created automatically on the first upload. Photos are shrunk to 1600px in the browser
before uploading, so phone photos don't waste storage. The two images that ship with the
site (`images/…`) are listed in the gallery too and can be reordered, but deleting them
only removes them from the page — the files stay in the repo.

## Notes
- Times offered: 1–6 PM, max 4 bookings/day. To change these, edit `TIME_SLOTS` /
  `MAX_PER_DAY` in `api/_lib.js` and the matching `<option>`s in `index.html`.
