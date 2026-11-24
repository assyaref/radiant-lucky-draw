# Radiant Lucky Draw di Supabase

Sejak November 2026 seluruh backend berjalan di **Supabase**. Railway (Express + Postgres) tidak dipakai lagi.

```
Browser ──▶ Vercel (frontend React)
              │  /api/*  ──rewrite──▶  Supabase Edge Function `api`  ──▶  Supabase Postgres
              │                          (Express app dari server/src)
              └─ WebSocket ───────────▶  Supabase Realtime (channel `radiant`)
```

| Bagian | Dulu | Sekarang |
|---|---|---|
| API | Express di Railway | Express yang sama, dijalankan sebagai Edge Function `api` |
| Database | Postgres Railway + Prisma | Supabase Postgres + klien kompatibel-Prisma (`server/src/lib/prisma.ts`) |
| Realtime | Socket.IO | Supabase Realtime broadcast, channel `radiant`, nama event sama |
| State undian | memori server | tabel `draw_state` (kunci + waktu mulai) |
| Login admin | JWT sendiri | tetap sama (bcrypt + JWT); secret diturunkan dari service role key |

Project Supabase: **radiant-lucky-draw** (`emwmnghbxsoudfxxltna`, region Singapore).

## Struktur repo

```
server/src/                  kode backend (Express, service, repository)
server/src/edge.ts           entry Edge Function
server/src/lib/prisma.ts     pengganti Prisma Client (subset API yang dipakai) di atas postgres.js
server/src/lib/db-meta.ts    metadata model — DIGENERATE dari server/prisma/schema.prisma
server/scripts/build-edge.ts membundel server/src → supabase/functions/api/app.bundle.js
supabase/migrations/         skema database (sumber kebenaran)
supabase/functions/api/      Edge Function yang di-deploy
```

`server/prisma/schema.prisma` tetap menjadi deskripsi model untuk kode backend.
Perubahan skema dilakukan lewat file SQL di `supabase/migrations/`, lalu
`schema.prisma` disesuaikan dan `bun scripts/gen-db-meta.ts` dijalankan.

## Alur kerja development

```bash
npm install && npm run dev          # frontend; /api diproksikan ke Edge Function Supabase
```

Mengubah backend:

```bash
cd server
bun scripts/build-edge.ts           # regenerasi db-meta + bundle
supabase functions deploy api --no-verify-jwt --project-ref emwmnghbxsoudfxxltna
```

Menambah tabel/kolom:

```bash
supabase migration new nama_perubahan   # tulis SQL-nya
supabase db push --project-ref emwmnghbxsoudfxxltna
```

Setiap tabel baru **wajib** `ALTER TABLE ... ENABLE ROW LEVEL SECURITY;` (lihat Keamanan).

## Konfigurasi

Tidak ada secret yang wajib di-set: Supabase otomatis menyediakan `SUPABASE_URL`,
`SUPABASE_DB_URL`, dan `SUPABASE_SERVICE_ROLE_KEY` untuk Edge Function.
Opsional (Dashboard → Edge Functions → Secrets): `JWT_SECRET`, `JWT_REFRESH_SECRET`,
`JWT_EXPIRES_IN`, `RATE_LIMIT_MAX`, `CORS_ORIGIN`.

Frontend memakai URL dan anon key Supabase (nilai publik, sudah ada default di
`src/config/env.ts`; bisa ditimpa `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY`).

Akun admin awal dibuat otomatis: `admin@radiantgroup.com` / `Admin123!` — **segera ganti passwordnya.**

## Keamanan

- **RLS aktif di semua tabel tanpa policy** → API REST/GraphQL Supabase (anon key)
  tidak bisa membaca/menulis data apa pun. Semua akses data lewat Edge Function,
  yang terhubung sebagai role `postgres`.
- Anon key di frontend hanya dipakai untuk berlangganan broadcast Realtime.

## Fitur Spin Nama & mode Monitor

- `POST /api/name-spin` (login + `draw:execute`) menerima daftar nama, memilih pemenang
  dengan RNG kriptografis di server, lalu mem-broadcast `namespin:started`. Hasil spin
  tidak ditulis ke database.
- `GET /api/monitor/state` (publik) / `PUT /api/monitor/state` (login + `draw:execute`):
  mode tampilan Monitor — `event` (layar undian booth) atau `namespin` (roda nama) — plus
  data roda (sampel maks. 60 nama, judul, hadiah) di tabel `monitor_state`. Perubahan
  di-broadcast sebagai `monitor:state`.
- Dashboard → **Spin Nama**: pilih tampilan Monitor, tempel nama, SPIN. Roda berhenti
  tepat di irisan pemenang yang dipilih server.

## Catatan teknis

- **Timeline undian booth**: server hanya mem-broadcast `draw:started` (berisi
  `phaseOffsetsMs`); klien menjadwalkan `draw:spinning` (4 dtk), `draw:winner`
  (8 dtk), `draw:completed` (14 dtk). `GET /api/booth/draw-state` menghitung fase
  dari `draw_state.started_at`, dan Monitor tetap mem-polling-nya tiap 3 detik.
- **Kunci undian** (`draw_state.locked_until`) kedaluwarsa sendiri setelah 19 detik,
  jadi booth tidak bisa macet terkunci.
- **Region**: Vercel me-rewrite `/api/*` dengan `forceFunctionRegion=ap-southeast-1`,
  jadi Edge Function selalu jalan di Singapore, dekat database.
- **Rate limit** disimpan di memori per instance Edge Function (perkiraan, bukan global).
- Ekstensi `pg_net` aktif dan dipakai untuk smoke test HTTP dari SQL.
