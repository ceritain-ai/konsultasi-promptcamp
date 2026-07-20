# Konteks Utama — Hoscademy Event Form

## Ringkasan Proyek

Aplikasi **event landing page builder** untuk Hoscademy.  
Admin membuat event via dashboard, setiap event otomatis punya landing page publik di `/{slug}`.  
Pengunjung isi form → data lead masuk Supabase → redirect ke WhatsApp group.

**Domain produksi:** `webinar.hoscademy.com` (Cloudflare Workers via OpenNext)

---

## Tech Stack

| Layer | Teknologi |
|---|---|
| Framework | Next.js 16.2.10 (App Router, RSC) |
| Runtime produksi | Cloudflare Workers (`@opennextjs/cloudflare`) |
| Database | Supabase (PostgreSQL + RLS) |
| File storage | Cloudflare R2 (via `@aws-sdk/client-s3`) |
| Styling | Tailwind CSS v4 + `@tailwindcss/postcss` |
| Font | Geist + Geist Mono (next/font) |
| Tracking | Meta Pixel (per-event, via `pixel_id`) |
| Language | TypeScript strict mode |

---

## Struktur Direktori (sub-domain/)

```
src/
├── app/
│   ├── page.tsx                     # Homepage — link ke /admin
│   ├── layout.tsx                   # Root layout (Geist font, lang=id)
│   ├── globals.css                  # Tailwind v4, custom scrollbar
│   ├── [slug]/page.tsx              # Landing page publik per event (SSR)
│   ├── admin/
│   │   ├── page.tsx                 # Dashboard admin (requireAdmin guard)
│   │   └── login/page.tsx           # Login page
│   └── api/
│       ├── register/route.ts        # POST: simpan lead → return WA link
│       ├── admin/
│       │   ├── login/route.ts       # POST: auth cookie session
│       │   ├── events/route.ts      # GET: list events, POST: upsert event
│       │   ├── events/[slug]/route.ts  # DELETE: hapus event
│       │   └── upload/route.ts      # POST: upload file ke R2
├── components/
│   ├── landing-form.tsx             # Form registrasi publik (email, nama, phone)
│   ├── admin-dashboard.tsx          # SPA dashboard: list event, form event, tabel lead
│   ├── rich-text-editor.tsx         # contentEditable WYSIWYG ringan
│   └── meta-pixel.tsx               # Script inject Meta Pixel
├── lib/
│   ├── auth.ts                      # Cookie-based admin auth (env: ADMIN_EMAIL, ADMIN_PASSWORD)
│   ├── data.ts                      # Supabase queries: getEventBySlug, getEvents, getRegistrations
│   ├── r2.ts                        # R2 S3Client setup + r2PublicUrl helper
│   └── supabase.ts                  # supabase (anon) + supabaseAdmin (service_role)

supabase_schema.sql                  # DDL: tabel events + registrations + RLS policies
wrangler.jsonc                       # Cloudflare Workers config + env vars
test-e2e.js                         # E2E script: login → upload → CRUD event → register → delete
```

---

## Database Schema

### Tabel `events`
| Kolom | Tipe | Keterangan |
|---|---|---|
| id | UUID PK | auto gen |
| slug | TEXT UNIQUE | URL path |
| title | TEXT | judul event |
| description | TEXT | HTML rich text |
| poster_url | TEXT | URL gambar poster (R2) |
| bg_color | TEXT | default `#111827` |
| bg_image_url | TEXT | background image URL |
| button_text | TEXT | default `SAYA MAU` |
| whatsapp_link | TEXT | redirect setelah registrasi |
| pixel_id | TEXT | Meta Pixel ID per event |
| created_at | TIMESTAMPTZ | auto |

### Tabel `registrations`
| Kolom | Tipe | Keterangan |
|---|---|---|
| id | UUID PK | auto gen |
| event_slug | TEXT FK → events.slug | CASCADE delete |
| email | TEXT | |
| name | TEXT | |
| phone | TEXT | format: `{phoneCode}{phone}` |
| created_at | TIMESTAMPTZ | auto |

**RLS:** events public read, registrations public insert, service_role full access.

---

## Alur Bisnis Utama

### 1. Admin Flow
1. Login di `/admin/login` → POST `/api/admin/login` → set cookie `hoscademy_admin=1` (7 hari)
2. Dashboard `/admin` → server guard `requireAdmin()` → fetch events + registrations dari Supabase
3. Buat/edit event: isi slug, title, description (rich text), poster, bg, CTA, WA link, pixel ID
4. Upload media: file → R2 bucket `hoscademy` → return public URL
5. Simpan event: POST `/api/admin/events` → upsert on `slug`
6. Hapus event: DELETE `/api/admin/events/{slug}`
7. Lihat lead terkait event di tabel bawah form

### 2. Public Flow
1. Visitor buka `/{slug}` → SSR render landing page dari data Supabase
2. Meta Pixel auto-inject jika `pixel_id` ada
3. Visitor isi form (email, nama, phone) → submit
4. Client-side: fire fbq events (WhatsAppClick, Lead, CompleteRegistration)
5. POST `/api/register` → insert ke `registrations` → return `whatsapp_link`
6. Redirect visitor ke WhatsApp group

---

## Environment Variables (dari wrangler.jsonc)

| Var | Nilai / Keterangan |
|---|---|
| NEXT_PUBLIC_SUPABASE_URL | `https://lhssqfacvfytmzeideil.supabase.co` |
| NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY | Supabase publishable key |
| SUPABASE_SERVICE_ROLE_KEY | *secret* (tidak di wrangler, di env Workers) |
| ADMIN_EMAIL | `admhoscademy@mail.com` |
| ADMIN_PASSWORD | *env var* (test: `hscdmy26`) |
| R2_ACCOUNT_ID | `78b14406c7501c11528094ec439a7e7f` |
| R2_ACCESS_KEY_ID | `4a7a7584b006afe2a17ac23a4b6b944a` |
| R2_SECRET_ACCESS_KEY | *secret* |
| R2_BUCKET_NAME | `konsultasi-promptcamp` |
| R2_PUBLIC_URL | `https://pub-aa3550fcaddf41e29bf4e36fb3e2726f.r2.dev` |

---

## Deployment

- **Build:** `next build` → `opennextjs-cloudflare build`
- **Deploy:** `opennextjs-cloudflare deploy` (Cloudflare Workers)
- **Custom domain:** `webinar.hoscademy.com`
- **Static backup:** folder `static-site-backup/` berisi versi HTML statis (framer export) sebagai referensi visual

---

## Catatan Penting

1. **Auth sederhana:** Single admin, cookie value `1`, tidak pakai JWT/session token. Cocok untuk internal tool, bukan multi-tenant.
2. **Tidak ada CSRF protection** pada form admin.
3. **Upload route** pakai `requireAdmin()` guard, tapi **events route** (`GET`/`POST`/`DELETE`) TIDAK pakai auth guard di API level — bergantung pada cookie check di page level saja.
4. **`dangerouslySetInnerHTML`** dipakai untuk render description di landing page. Input hanya dari admin, tapi perlu hati-hati jika admin access dibuka lebih luas.
5. **Rich text editor** pakai `document.execCommand` (deprecated API, tapi masih bekerja di browser modern).
6. **E2E test** tersedia di `test-e2e.js` — jalankan dengan `node test-e2e.js` saat dev server aktif.
7. **AGENTS.md lokal** mengingatkan bahwa Next.js versi ini mungkin punya breaking changes — selalu baca docs di `node_modules/next/dist/docs/`.

---

## Perintah Development

```bash
cd sub-domain
npm install
npm run dev          # localhost:3000
npm run build        # next build
npm run preview      # cloudflare preview
npm run deploy       # cloudflare deploy
node test-e2e.js     # E2E test (dev server harus jalan)
```
