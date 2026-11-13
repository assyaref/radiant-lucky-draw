# Migrasi Database ke Supabase

Mulai sekarang database Radiant Lucky Draw (development & production) berjalan di
**Supabase Postgres**. Backend Express + Prisma, auth JWT, dan Socket.IO **tidak berubah** —
yang berubah hanya lokasi database.

```
Vercel (frontend) ──/api, /socket.io──▶ Railway (Express + Prisma) ──▶ Supabase Postgres
```

## 1. Ringkasan perubahan kode

| File | Perubahan |
|---|---|
| `server/prisma/schema.prisma` | `directUrl = env("DIRECT_URL")` — migrasi lewat koneksi session, query runtime lewat pooler |
| `server/prisma/migrations/20261113000000_supabase_enable_rls` | Mengaktifkan **Row Level Security** di semua tabel `public` (lihat §5) |
| `server/Dockerfile` | `DIRECT_URL` otomatis = `DATABASE_URL` jika tidak di-set |
| `server/src/config/env.ts` | Mengenali `DIRECT_URL` |
| `.env.example` | Default ke connection string Supabase |
| `docker-compose.yml` | Postgres lokal tetap ada sebagai opsi offline, ditambah `DIRECT_URL` |
| `scripts/migrate-railway-to-supabase.sh` | Skrip pindah data Railway → Supabase dengan verifikasi jumlah baris |

## 2. Siapkan project Supabase

Buat **dua project**: `radiant-lucky-draw-dev` dan `radiant-lucky-draw-prod`
(pilih region terdekat, mis. *Southeast Asia (Singapore)*). Simpan password database.

Ambil connection string: **Dashboard → Connect → ORMs → Prisma**.

| Variabel | Dipakai untuk | Bentuk |
|---|---|---|
| `DATABASE_URL` | Query runtime | Transaction pooler, port **6543**, `?pgbouncer=true&connection_limit=5` |
| `DIRECT_URL` | `prisma migrate` | Session pooler, port **5432** |

```env
DATABASE_URL="postgresql://postgres.[REF]:[PWD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=5"
DIRECT_URL="postgresql://postgres.[REF]:[PWD]@aws-0-[REGION].pooler.supabase.com:5432/postgres"
```

> Pakai pooler (bukan `db.[REF].supabase.co`) karena koneksi direct Supabase hanya IPv6,
> sedangkan Railway keluar lewat IPv4. Jika password mengandung karakter khusus, URL-encode dulu.

## 3. Development sehari-hari

```bash
cp .env.example .env          # isi DATABASE_URL & DIRECT_URL project DEV
cd server
npm install
npx prisma migrate deploy     # terapkan migrasi ke Supabase dev
npm run dev
```

Membuat perubahan skema baru:

```bash
npx prisma migrate dev --name nama_perubahan   # jalankan terhadap project DEV, jangan PROD
```

Setiap **tabel baru** wajib ditambah `ALTER TABLE "nama_tabel" ENABLE ROW LEVEL SECURITY;`
di file migration-nya (lihat §5).

Kalau butuh kerja offline, Postgres lokal via `docker compose up postgres` masih bisa dipakai —
ganti `DATABASE_URL`/`DIRECT_URL` ke baris lokal yang dikomentari di `.env.example`.

## 4. Pindah production (Railway DB → Supabase)

Butuh `pg_dump`/`psql` dengan versi ≥ versi Postgres Railway, dan `npm install` di `server/`.

1. **Maintenance**: hentikan undian/registrasi sementara agar tidak ada data baru masuk.
2. **Jalankan skrip** (dari root repo):
   ```bash
   SOURCE_DATABASE_URL="<DATABASE_URL Railway lama>" \
   SUPABASE_DIRECT_URL="<DIRECT_URL Supabase PROD>" \
   ./scripts/migrate-railway-to-supabase.sh
   ```
   Skrip akan: cek Railway sudah di migrasi terbaru → `prisma migrate deploy` ke Supabase →
   menolak jalan jika tabel Supabase sudah berisi → dump data saja → restore dalam satu
   transaksi → membandingkan jumlah baris per tabel.
3. **Ganti env di Railway** (service backend): set `DATABASE_URL` dan `DIRECT_URL` ke URL
   Supabase PROD, lalu redeploy. Saat start, container menjalankan `prisma migrate deploy`
   (no-op karena sudah up to date).
4. **Verifikasi**: `GET /api/health`, login admin, cek data peserta/hadiah/pemenang di app.
5. **Simpan service Postgres Railway** beberapa hari sebagai cadangan sebelum dihapus.

**Rollback**: kembalikan `DATABASE_URL` Railway ke URL Postgres Railway lama dan redeploy
(data baru yang masuk ke Supabase setelah cutover tidak ikut kembali).

## 5. Keamanan: Row Level Security

Supabase otomatis membuka schema `public` lewat REST/GraphQL API dengan *anon key*. Tanpa RLS,
siapa pun yang memegang anon key bisa membaca tabel `users` (hash password) dan `sessions`
(refresh token). Migration `20261113000000_supabase_enable_rls` mengaktifkan RLS **tanpa policy**
di semua tabel, sehingga akses lewat API Supabase ditolak total. Backend tetap normal karena
Prisma terhubung sebagai role `postgres` (pemilik tabel, BYPASSRLS).

Jangan bagikan connection string / password database; frontend tidak membutuhkan
anon key Supabase karena semua akses data tetap lewat backend.
