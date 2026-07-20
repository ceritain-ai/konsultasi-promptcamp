# ERRORS

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
