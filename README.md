# Msoka IoT Lab

Personal technology portfolio for **Alex Cosmas Msoka** — IoT developer & 3D designer based in Tanzania.

**Live site:** [msokaiotlab.com](https://msokaiotlab.com)

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Vanilla HTML, CSS, JavaScript (ES modules) |
| Backend / DB | [Supabase](https://supabase.com) (PostgreSQL + Auth) |
| Hosting | Static file host (Vercel / Netlify / GitHub Pages) |
| Fonts | Google Fonts — Orbitron, Space Grotesk |
| Video | Vimeo (hero) + local MP4 backgrounds |

---

## Project Structure

```
msokaiotlab/
├── index.html          # Main portfolio page
├── admin.html          # Login page (noindex)
├── dashboard.html      # Admin dashboard (noindex)
├── script.js           # Main page JS (ES module)
├── projects.js         # Dynamic project loader for index.html
├── dashboard.js        # Dashboard CRUD logic
├── admin.js            # Login + rate-limiting logic
├── supabase.js         # Supabase client  ← gitignored, see below
├── supabase.example.js # Template for supabase.js
├── style.css           # All styles (including dashboard)
├── images/             # Optimised WebP + JPG images
├── videos/             # Local MP4 background loops
└── assets/             # SVG favicons
```

---

## Local Setup

### 1. Clone and configure Supabase credentials

```bash
git clone https://github.com/alexcosmasmsoka/msokaiotlab.git
cd msokaiotlab
cp supabase.example.js supabase.js
# Edit supabase.js and paste your Project URL + Anon Key
```

Get your keys from **Supabase Dashboard → Project Settings → API**.

> **Security note:** `supabase.js` is listed in `.gitignore` — never commit it.  
> If credentials were previously committed, rotate them at  
> Supabase → Project Settings → API → Regenerate anon key.

### 2. Serve locally

Any static file server works. The easiest options:

```bash
# Python 3
python3 -m http.server 8000

# Node (npx)
npx serve .

# VS Code — Live Server extension
```

Then open `http://localhost:8000`.

---

## Supabase Database Setup

Run the following SQL in **Supabase → SQL Editor**:

```sql
-- Projects table
create table public.projects (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  description text not null,
  image_url   text not null,
  video_url   text,
  tags        text[],
  status      text not null default 'draft' check (status in ('draft', 'published')),
  created_at  timestamptz default now()
);

-- Messages table (contact form submissions)
create table public.messages (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  email      text not null,
  message    text not null,
  created_at timestamptz default now()
);

-- Enable Row Level Security
alter table public.projects enable row level security;
alter table public.messages enable row level security;

-- RLS: projects — public can read published; authenticated users have full access
create policy "Public read published projects"
  on public.projects for select
  to anon
  using (status = 'published');

create policy "Authenticated full access to projects"
  on public.projects for all
  to authenticated
  using (true) with check (true);

-- RLS: messages — public can insert; authenticated can read and delete
create policy "Public can submit messages"
  on public.messages for insert
  to anon
  with check (true);

create policy "Authenticated can read messages"
  on public.messages for select
  to authenticated
  using (true);

create policy "Authenticated can delete messages"
  on public.messages for delete
  to authenticated
  using (true);
```

---

## Admin Panel

| Page | URL | Notes |
|------|-----|-------|
| Login | `/admin.html` | Supabase email/password auth |
| Dashboard | `/dashboard.html` | Protected — redirects to login if unauthenticated |

**First-time admin setup:**  
Create your admin account in **Supabase → Authentication → Users → Invite user**.

Both admin pages are blocked from search indexing via `robots.txt` and `<meta name="robots" content="noindex, nofollow">`.

---

## Features

- **Dynamic featured projects** — Published projects are loaded from Supabase. Static fallback cards display when the DB is empty or unreachable.
- **Contact form** — Saves to the `messages` table in Supabase. Falls back to `mailto:` if Supabase is unavailable.
- **Admin dashboard** — Add, edit, publish/unpublish, and delete projects. View and delete messages.
- **Auth protection** — Dashboard redirects unauthenticated users; login locks out after 5 failed attempts.
- **XSS-safe rendering** — All dynamic content uses `textContent` / DOM API (no raw `innerHTML`).
- **Responsive** — Mobile-first, tested down to 320 px.
- **Accessible** — Skip link, `aria-*` labels, `prefers-reduced-motion` support.
- **SEO** — Open Graph, Twitter card, Schema.org JSON-LD, sitemap, canonical URL.
- **Performance** — WebP images with responsive `srcset`, viewport-driven video autoplay (IntersectionObserver).

---

## Deployment

The site is a **static bundle** — deploy by pushing the root directory to any static host:

```bash
# Vercel
npx vercel --prod

# Netlify
npx netlify deploy --prod --dir=.
```

Make sure `supabase.js` exists on the server. When using Vercel/Netlify, consider storing the Supabase URL and key as environment variables and injecting them at build time with a small build script.

---

## License

Personal portfolio — all rights reserved. Content and images © Alex Cosmas Msoka.
