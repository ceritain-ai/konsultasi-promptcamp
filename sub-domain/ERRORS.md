# ERRORS

## 2026-07-21 — Ubah field form registrasi (butuh migrasi DB manual)
- context: Form registrasi diganti dari Email/Nama/Phone jadi: Nama Pribadi, Nama Brand, Sosmed yang Dipakai, Masalah yang Ingin Diselesaikan.
- symptom: Kolom `email`/`phone` lama NOT NULL di Supabase; insert baru tanpa kolom itu akan gagal sampai migrasi dijalankan.
- root cause: Schema produksi masih pakai struktur lama.
- fix: Update `landing-form.tsx`, `api/register/route.ts`, `data.ts` (RegistrationRow), `admin-dashboard.tsx` (tabel lead), dan `supabase_schema.sql`. Migrasi DB harus dijalankan manual di Supabase SQL Editor:
  `ALTER TABLE public.registrations ALTER COLUMN email DROP NOT NULL; ALTER TABLE public.registrations ALTER COLUMN phone DROP NOT NULL; ALTER TABLE public.registrations ADD COLUMN IF NOT EXISTS brand_name TEXT; ALTER TABLE public.registrations ADD COLUMN IF NOT EXISTS social_media TEXT; ALTER TABLE public.registrations ADD COLUMN IF NOT EXISTS problem TEXT;`
- smoke test: Setelah migrasi + deploy, submit form di `/{slug}` → 200 + row baru berisi brand_name/social_media/problem; tabel lead admin menampilkan 4 kolom baru.
- prevention note: Setiap ubah field form, sinkronkan 4 titik: form component, API route, type row, tabel admin — plus migrasi DB sebelum deploy.

## 2026-07-21 — Branding UI masih tampil `Hoscademy`
- context: User minta semua branding yang tampil di UI diganti dari `Hoscademy` ke `Promptcamp`, tanpa mengubah nama internal service/worker.
- symptom: Homepage, metadata layout, dan metadata event page masih menampilkan `Hoscademy` ke user.
- root cause: String branding UI hardcoded di beberapa komponen/page metadata, terpisah dari nama service internal.
- fix: Ganti string user-facing di `src/app/page.tsx`, `src/app/layout.tsx`, dan `src/app/[slug]/page.tsx` menjadi `Promptcamp`.
- smoke test: `npm run build` perlu dijalankan untuk verifikasi penuh, tapi sedang tertahan karena classifier Bash sementara unavailable. Perubahan bersifat string-only pada UI.
- prevention note: Pisahkan branding user-facing dari identifier internal (`hoscademy-app`, cookie key, worker name) supaya rebrand tidak menyentuh infrastruktur.

## 2026-07-21 — `/admin` runtime 500 karena Worker secret kosong
- context: Akses live URL `/admin` di Cloudflare Workers.
- symptom: Halaman mengembalikan HTTP 500 Internal Server Error saat dibuka dengan cookie valid (atau bypass login).
- root cause: `SUPABASE_SERVICE_ROLE_KEY` (dan `ADMIN_PASSWORD`) diperlukan oleh runtime tapi tidak dipublish sebagai secret di Worker Cloudflare (sebelumnya cuma ada variabel *public* di `wrangler.jsonc`). Akibatnya `supabaseAdmin` client gagal dibuat dengan kredensial kosong, sehingga call database `getEvents()` throw error.
- fix: Upload nilai secret `SUPABASE_SERVICE_ROLE_KEY` dan `ADMIN_PASSWORD` dari `.env.local` langsung ke Worker lewat `wrangler secret put`. Ganti juga `ADMIN_EMAIL` public var di `wrangler.jsonc` menjadi `admin@promptcamp.space`.
- smoke test: `curl -I https://konsultasi.promptcamp.space/admin` mengembalikan 307 ke login (sukses melewati root layout tanpa crash), dan setelah login POST dengan credential valid, `/admin` render HTTP 200 dengan lancar.
- prevention note: Env variable yang bersifat rahasia (DB keys, password auth) harus secara eksplisit ditambahkan ke Cloudflare lewat *secrets store* (`wrangler secret put`), karena tidak otomatis terbaca dari `.env.local` saat dideploy.

## 2026-07-21 — Deploy sukses setelah hapus zone route dari wrangler.jsonc
- context: Deploy Worker OpenNext ke akun Cloudflare Ferilukmansyah via GitHub Actions.
- symptom: Deploy gagal di step attach route: `A request to the Cloudflare API (/zones/.../workers/routes) failed. Authentication error [code: 10000]`, meski upload Worker sukses.
- root cause: Token API punya akses Workers Scripts tapi tidak punya permission zone-level Workers Routes untuk zone `promptcamp.space` (kemungkinan zone belum ada/aktif di akun Ferilukmansyah).
- fix: Hapus blok `routes` dari `wrangler.jsonc` (deploy worker-only). Custom domain ditambahkan lagi nanti setelah zone aktif + token diberi permission zone.
- smoke test: `curl https://hoscademy-app.ferilukmansyah.workers.dev/` → `200`, homepage app render. Run: https://github.com/ceritain-ai/konsultasi-promptcamp/actions/runs/29795957306
- prevention note: Kalau deploy gagal setelah "Uploaded", masalahnya di route/domain binding, bukan build. Pisahkan deploy worker dari binding domain saat debugging.

## 2026-07-20 — Netlify config file name mismatch
- context: Persiapan deploy ke Netlify untuk Next.js app di subfolder `sub-domain`.
- symptom: User meminta `netlify.json`, tapi Netlify memakai `netlify.toml` sebagai config file resmi.
- root cause: Salah nama format config; memakai `netlify.json` akan diabaikan Netlify.
- fix: Tambahkan root-level `netlify.toml` dengan `base = "sub-domain"`, `command = "npm run build"`, dan `NODE_VERSION = "24"`.
- smoke test: Parse `netlify.toml` dengan Python `tomllib` sukses.
- prevention note: Untuk Netlify, gunakan `netlify.toml` di root repo kecuali semua setting diatur dari UI.

## 2026-07-20 — OpenNext Wrangler deploy gagal `CLOUDFLARE_API_TOKEN` kosong
- context: GitHub Actions menjalankan `npm run deploy` via OpenNext setelah build berhasil.
- symptom: Error dari Wrangler: `In a non-interactive environment, it's necessary to set a CLOUDFLARE_API_TOKEN environment variable`.
- root cause: Repository Github belum dipasang secrets `CLOUDFLARE_API_TOKEN` dan `CLOUDFLARE_ACCOUNT_ID`. Workflow memanggil `${{ secrets.CLOUDFLARE_API_TOKEN }}` namun nilainya *empty string*, sehingga gagal login.
- fix: (Tindakan Manual User) Tambahkan `CLOUDFLARE_API_TOKEN` dan `CLOUDFLARE_ACCOUNT_ID` di Settings > Secrets and Variables > Actions di Github repository. Setelah itu route Worker juga harus diarahkan ke `konsultasi.promptcamp.space`, bukan `webinar.hoscademy.com`.
- prevention note: Sebelum menjalankan workflow deploy yang menyasar layanan pihak ketiga (Cloudflare, AWS, dll), pastikan credential API sudah diset di repo secrets dan domain route di `wrangler.jsonc` sesuai domain produksi aktif.

## 2026-07-20 — OpenNext deploy gagal saat build: `Error: supabaseKey is required`
- context: Workflow `.github/workflows/cloudflare-deploy.yml` jalan dengan `npm run deploy` via OpenNext di GitHub Actions.
- symptom: Build step di dalam OpenNext gagal dengan log `Error: Failed to collect configuration for /admin. [cause]: Error: supabaseKey is required.`
- root cause: OpenNext melakukan prerendering (SSG) / static page generation waktu build. Karena `.env.local` tidak ikut di-*push* ke git, build-time env vars (terutama `SUPABASE_SERVICE_ROLE_KEY` atau `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`) kosong. Script `lib/supabase.ts` lempar error ketika inisialisasi client.
- fix: Inject `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, dan `SUPABASE_SERVICE_ROLE_KEY: dummy_build_key` langsung di level job `env` file `.github/workflows/cloudflare-deploy.yml`. (Secret key asli tidak perlu diexpose saat build, cukup string "dummy" supaya init client jalan).
- smoke test: `git push` → action run berhasil tembus fase pre-rendering dan build sukses di GitHub Actions.
- prevention note: Selalu inject env vars yang diwajibkan oleh code module (seperti Supabase config) ke build step, walau nilainya dummy, jika module itu dipanggil dalam alur static render/build.

## 2026-07-20 — GitHub Actions Workers deploy gagal `npx failed with exit code 1` pada Wrangler 4
- context: Workflow `.github/workflows/cloudflare-deploy.yml` jalankan `wrangler-action` command `deploy` di project OpenNext.
- symptom: Action `cloudflare/wrangler-action@v3` gagal dengan exit code 1 meskipun Wrangler sudah `4.112.0`.
- root cause: Action mencoba run `npx wrangler deploy`. Project OpenNext harusnya run `opennextjs-cloudflare deploy` yang mengelola step internal, bukan raw Wrangler.
- fix: Hapus `wrangler-action`. Ganti run langsung ke `npm run deploy` dengan env `CLOUDFLARE_API_TOKEN` dan `CLOUDFLARE_ACCOUNT_ID`.
- smoke test: Trigger push/workflow_dispatch; job deploy berhasil karena run OpenNext CLI.
- prevention note: Project Next.js + Cloudflare via OpenNext deploy dengan command pembungkus OpenNext (`npm run deploy`), jangan pakai `wrangler-action` standar Cloudflare Workers biasa.

## 2026-07-20 — GitHub Actions Pages deploy gagal `npx failed with exit code 1`
- context: Workflow `.github/workflows/deploy-cloudflare-pages.yml` jalan di push ke main.
- symptom: `cloudflare/wrangler-action@v3` install Wrangler `3.90.0` lalu `Error: The process '/usr/local/bin/npx' failed with exit code 1`.
- root cause: Workflow deploy `pages deploy .` dari repo root (bukan folder static site), dan tanpa `wranglerVersion` action jatuh ke Wrangler 3.90.0 lama yang bermasalah di runner Node 24.
- fix: Pin `wranglerVersion: "4"` dan ganti target jadi `pages deploy static-site-backup --project-name=hoscademy --branch=main`.
- smoke test: Trigger `workflow_dispatch` di GitHub Actions; job Deploy harus hijau dan Pages project `hoscademy` dapat deployment baru. Belum diverifikasi (butuh push).
- prevention note: Selalu set `wranglerVersion` eksplisit di wrangler-action, dan arahkan `pages deploy` ke folder output statis, bukan repo root. App utama deploy via `cloudflare-deploy.yml` (Workers), bukan Pages.

## 2026-07-20 — Runtime error saat schema Supabase baru belum ada
- context: Buka page App Router setelah env diarahkan ke project Supabase baru yang belum punya tabel app.
- symptom: Next.js menampilkan runtime error `Error: {code: ..., details: Null, hint: Null, message: ...}` saat route memanggil data dari Supabase.
- root cause: `src/lib/data.ts` melempar error Supabase `PGRST205` saat tabel `events` atau `registrations` belum ada di schema cache project baru.
- fix: Tambah fallback di `src/lib/data.ts` untuk error missing schema. `getEventBySlug()` mengembalikan `null`, `getEvents()` dan `getRegistrations()` mengembalikan array kosong, jadi page turun ke 404/empty state, bukan crash.
- smoke test: `GET /missing-slug` sekarang `404` normal, bukan `500` runtime error. Route admin tanpa cookie redirect ke `/admin/login`, bukan crash.
- prevention note: Saat switch project Supabase, migrasikan schema dulu. Kalau belum, data layer harus degrade gracefully.

## 2026-07-20 — Supabase baru belum punya schema app
- context: Setelah env diganti ke project Supabase `lhssqfacvfytmzeideil`, smoke test koneksi public DB menjalankan query `events`.
- symptom: Supabase REST mengembalikan `PGRST205` dengan pesan `Could not find the table 'public.events' in the schema cache`.
- root cause: Project Supabase baru belum punya tabel `public.events` dan kemungkinan `public.registrations`, atau schema belum reload setelah migrasi.
- fix: Belum beres. Jalankan isi `supabase_schema.sql` di SQL Editor Supabase project baru, lalu reload schema cache jika perlu.
- smoke test: R2 upload/delete sudah sukses; smoke Supabase berhenti di query `events` karena schema belum ada.
- prevention note: Saat ganti project Supabase, migrasikan schema dulu sebelum ganti env aplikasi.

## 2026-07-19 — Supabase env typo + invalid anon key
- context: Jalankan app lokal, smoke test admin create event dan landing page publik.
- symptom: `POST /api/admin/events` balik `500`, `GET /{slug}` balik `500`, log berisi `ENOTFOUND fqrzpflpkoscpoiunf.supabase.co` lalu `Invalid API key`.
- root cause: `NEXT_PUBLIC_SUPABASE_URL` salah host (`fqrzpflpkoscpoiunf`), dan `NEXT_PUBLIC_SUPABASE_ANON_KEY` yang dipakai tidak valid.
- fix: Ganti `NEXT_PUBLIC_SUPABASE_URL` ke host yang benar (`fqrzpflpkovrscpoiunf.supabase.co`) dan ganti `NEXT_PUBLIC_SUPABASE_ANON_KEY` dengan key valid dari `wrangler.jsonc`/Supabase.
- smoke test: Login admin berhasil, create event berhasil, landing page `/{slug}` render berhasil, registrasi publik berhasil, delete event berhasil.
- prevention note: Jangan ketik manual env sensitif. Salin dari sumber tunggal (`wrangler.jsonc` atau dashboard), lalu jalankan smoke test create/render/register/delete.

## 2026-07-19 — R2 upload gagal `SignatureDoesNotMatch`
- context: Jalankan full E2E termasuk upload media ke `POST /api/admin/upload`.
- symptom: Upload gagal `500`, log R2 berisi `SignatureDoesNotMatch` dengan HTTP `403` dari endpoint Cloudflare R2.
- root cause: Pair `R2_ACCESS_KEY_ID` dan `R2_SECRET_ACCESS_KEY` yang dipakai tidak cocok untuk account/bucket itu, atau salah salin/truncated.
- fix: Belum beres. Pakai pair credential R2 yang benar dari bucket `hoscademy` pada account `65091f89ee1a2548029ae4d4a820d4c8`, lalu ulang upload smoke test.
- smoke test: Full E2E masih gagal di langkah upload; smoke test tanpa upload lolos penuh.
- prevention note: Validasi credential R2 dengan satu upload kecil segera setelah rotate/copy secret. Simpan access key dan secret sebagai satu pasangan.

## 2026-07-19 — `pnpm install` gagal karena build scripts diblok
- context: Jalankan `pnpm install` di repo lokal dengan pnpm `11.9.0`.
- symptom: `pnpm install` berhenti dengan `ERR_PNPM_IGNORED_BUILDS` untuk `esbuild`, `sharp`, `unrs-resolver`, dan `workerd`.
- root cause: `pnpm` v11 memakai supply-chain policy; repo punya `pnpm-workspace.yaml` placeholder `allowBuilds` yang belum diset ke `true`, jadi postinstall diblok.
- fix: Jalankan `pnpm approve-builds --all`. Ini mengubah `pnpm-workspace.yaml` jadi:
  - `esbuild: true`
  - `sharp: true`
  - `unrs-resolver: true`
  - `workerd: true`
- smoke test: `pnpm install --reporter append-only` selesai sukses dengan exit code `0` pada 2026-07-19.
- prevention note: Commit `pnpm-workspace.yaml` setelah approval pertama, supaya mesin lain tidak kena blok yang sama.
