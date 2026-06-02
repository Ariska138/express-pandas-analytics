# Express + Python Pandas Analisis

Proyek contoh **dual runtime** di Vercel: **Node.js (Express 5)** serve API dan frontend, **Python (pandas)** untuk analisis data. Semua data dummy — langsung jalan tanpa database.

## Fitur

- Data penjualan dummy 20 transaksi (Jan–Apr 2026)
- Analisis data dengan **Python pandas & numpy**
- Frontend dashboard + REST API + Python analysis
- Dual runtime: Node.js + Python dalam satu deploy Vercel

## Cara Kerja

```
Browser ──GET /──► Express serve public/index.html (frontend)
            │
            ├──GET /api/data──► Express ──► sales.js (Node.js)
            │
            └──GET /api/analisis──► Vercel routing────► api/analisis.py (Python)
                            vercel.json          │
                                                 └── pandas + numpy
```

Routing diatur di `vercel.json`:
- `/api/analisis*` → dialihkan ke Python Function
- Semua request lain (`/`, `/api/data`, `/style.css`, dll) → Express

## Prasyarat

Sebelum memulai, pastikan sudah menginstall:

1. **Node.js** (v18 atau lebih baru) — [download](https://nodejs.org/)
   - Cek: `node --version` (harus `v18.x.x` atau lebih)
2. **Git** — [download](https://git-scm.com/downloads)
   - Cek: `git --version`
3. **Akun Vercel** (gratis) — daftar di https://vercel.com
4. **Python 3** (opsional, hanya untuk test lokal pandas)
   - Cek: `python3 --version`

## Setup Lokal

### 1. Clone & masuk folder

```bash
git clone https://github.com/username/express-vercel.git
cd express-vercel
```

### 2. Install dependency Node.js

```bash
npm install
```

### 3. (Opsional) Install Python untuk test lokal

```bash
pip install -r requirements.txt
```

### 4. Jalankan server

```bash
npm run dev
```

Buka **http://localhost:3000** di browser.

> **Catatan penting:** Di lokal, endpoint `/api/analisis` hanya bisa diakses setelah
> deploy ke Vercel (karena Python dijalankan oleh Vercel, bukan Express).
> Semua fitur lain (dashboard, `/api/data`) berjalan normal di lokal.

## API Endpoints

| Method | Path | Runtime | Deskripsi |
|--------|------|---------|-----------|
| GET | `/` | Node.js | Frontend dashboard (HTML) |
| GET | `/api/info` | Node.js | Info API (JSON) |
| GET | `/api/data` | Node.js | Data mentah + ringkasan statistik |
| GET | `/api/analisis` | Python | Analisis pandas (lihat parameter di bawah) |

### GET `/`
Frontend dashboard — menampilkan data penjualan, grafik, dan analisis Python dalam satu halaman.

### GET `/api/info`
Info API dan daftar endpoint (JSON).

### GET `/api/data`
Semua data penjualan dan ringkasan statistik dari Node.js.

**Response:**
```json
{
  "success": true,
  "data": {
    "transactions": [ ... ],
    "summary": {
      "totalRevenue": 123456789,
      "totalTransactions": 20,
      "totalItems": 89,
      "averageTransactionValue": 6172839,
      "categoryBreakdown": { ... },
      "monthlyRevenue": { ... },
      "topProducts": [ ... ]
    }
  }
}
```

### GET `/api/analisis`
Analisis data penjualan dengan Python pandas. Hanya berfungsi setelah deploy ke Vercel.

**Query Parameters:**
| Parameter | Type   | Default | Deskripsi |
|-----------|--------|---------|-----------|
| `type` | string | semua | Filter jenis analisis: `statistics`, `category`, `monthly`, `products`, `payment`, `customers`, `correlation` |

**Contoh:**
```bash
# Semua analisis
curl https://namaproject.vercel.app/api/analisis

# Analisis per kategori
curl https://namaproject.vercel.app/api/analisis?type=category

# Korelasi price-quantity
curl https://namaproject.vercel.app/api/analisis?type=correlation
```

## Project Structure

```
├── api/
│   └── analisis.py       # Python Function — endpoint /api/analisis
├── public/
│   ├── index.html        # Frontend dashboard
│   ├── style.css         # Styling dashboard
│   └── app.js            # Frontend logic (fetch + render)
├── src/
│   ├── index.js          # Express entry point
│   └── data/
│       └── sales.js      # Dummy data 20 transaksi (satu-satunya sumber data)
├── requirements.txt      # pandas, numpy
├── vercel.json           # Routing dual runtime
├── AGENTS.md             # Panduan untuk AI coding assistant
└── package.json
```

## Deploy ke Vercel (Panduan Lengkap Pemula)

### Langkah 1 — Buat Repository GitHub

1. Buka https://github.com dan login
2. Klik tombol **New** (hijau, pojok kiri atas)
3. Isi **Repository name** (contoh: `express-vercel`)
4. Pilih **Public**
5. Klik **Create repository**
6. Jangan tutup halaman — kita akan push code dari terminal

### Langkah 2 — Push Code ke GitHub

Di terminal dalam folder proyek:

```bash
# Inisialisasi git (jika belum ada)
git init

# Tambah semua file
git add .

# Commit
git commit -m "Init: Express + Python pandas analisis"

# Hubungkan ke repo GitHub (ganti USERNAME dan REPO)
git remote add origin https://github.com/USERNAME/express-vercel.git

# Push ke GitHub
git push -u origin main
```

> Jika branch bernama `master`, ganti `main` dengan `master`.
> Cek dengan: `git branch`

### Langkah 3 — Import ke Vercel

1. Buka https://vercel.com dan login (bisa pakai akun GitHub)
2. Klik tombol **Add New...** → **Project**
3. Pilih repository `express-vercel`
4. **Jangan ubah pengaturan apapun** — Vercel otomatis akan mendeteksi:

   ```
   🔍 Node.js + Python detected
   📦 @vercel/node for src/index.js
   📦 @vercel/python for api/analisis.py
   ```

5. Klik tombol **Deploy** (tunggu 1–2 menit)

### Langkah 4 — Selesai! 🎉

Setelah deploy selesai, Vercel akan memberi URL seperti:

```
https://express-vercel.vercel.app
```

Buka URL tersebut di browser — dashboard akan tampil.

### Troubleshooting Deploy

| Masalah | Solusi |
|---------|--------|
| **Build gagal** | Pastikan `vercel.json` tidak error (JSON valid). Cek log di Vercel Dashboard → Deployments → inspect |
| **404 di `/api/analisis`** | Pastikan file `api/analisis.py` ada. Cek log Python Function di Vercel Dashboard |
| **Python Function timeout** | Analisis 20 transaksi dengan pandas seharusnya <1 detik. Jika lambat, cek di log |
| **Cold start lama (5-15 detik)** | Normal untuk Python + pandas. Request pertama lambat, request berikutnya cepat (sampai function idle) |
| **Frontend kosong / error** | Buka console browser (F12 → Console). Pastikan semua endpoint merespons |

### Tips Penting

- **Setiap push ke `main` akan auto-deploy** — Vercel otomatis redeploy
- **Log ada di Vercel Dashboard** → Deployments → klik deploy → Function Logs
- **Environment variables** bisa diatur di Vercel Dashboard → Project Settings → Environment Variables
- **Domain kustom** bisa diatur di Vercel Dashboard → Domains

## Vercel Python Runtime — Batasan

| Aspek | Hobby (Gratis) | Pro |
|-------|----------------|-----|
| **Cold start** | ⚠️ 5–15 detik (pandas/scipy berat) | ⚠️ Sama |
| **Memory** | 2 GB RAM, 1 vCPU | 2–4 GB RAM, 1–2 vCPU |
| **Max Duration** | 300 detik (5 menit) | 800 detik (~13 menit) |
| **Bundle Size** | 500 MB (uncompressed) | 500 MB |

### ❌ Tidak cocok untuk Vercel Python:

- **Training model / ML berat** — CPU/memory tidak mencukupi
- **Manipulasi dataset >100 MB** — memory < 4 GB
- **ETL / komputasi >10 menit** — kena timeout function
- **Background job / scheduler** — Vercel Function stateless & tidak persistent
- **WebSocket server** — tidak didukung di Vercel Functions

### ✅ Cocok untuk:

- **Lightweight inference API** — model ML kecil yang sudah di-train
- **Preprocessing / transformasi data ringan** — CSV kecil, JSON, cleaning
- **Simple REST API dengan pandas/numpy** — aggregate, filter, group by
- **Data analysis dashboard backend** — seperti proyek ini

## Informasi Penting untuk Developer

### Dual Runtime — Cara Routing

```
vercel.json
├── "builds"
│   ├── src/index.js   →  @vercel/node  (Express)
│   └── api/**/*.py    →  @vercel/python (pandas)
└── "routes"
    ├── /api/analisis*  →  api/analisis.py
    └── /*              →  src/index.js
```

Vercel mendeteksi dua runtime dalam satu proyek. Setiap builder menangani file-nya masing-masing. Routes menentukan request mana ke runtime mana.

### Kenapa Python Tidak Jalan di Lokal?

Vercel Python Function cuma berjalan di server Vercel, bukan di lokal. Express tidak bisa menjalankan file `.py`. Di lokal, semua request ditangani Express — jadi `/api/analisis` tidak akan merespon.

### Data Hanya di Satu File

Semua data penjualan ada di `src/data/sales.js`. Baik Express maupun Python membaca data yang sama (masing-masing punya copy sendiri). Jika ingin menambah/ubah data, cukup edit file ini.

Data di `api/analisis.py` adalah duplikat dari `sales.js` — karena Python tidak bisa membaca file JavaScript. Jika mengubah data di `sales.js`, duplikasi juga perubahannya ke `api/analisis.py`.

### Cold Start Python

Python Function di Vercel punya **cold start** (lambat di request pertama) karena harus:
1. Download pandas + numpy (paket besar)
2. Load semua dependency
3. Import modul
4. Jalankan handler

Setelah itu, function tetap "hangat" selama beberapa menit. Jika tidak ada request, function akan dimatikan dan cold start terjadi lagi.

## Authentication (Rencana Implementasi)

Auth belum diimplementasikan di kode. Berikut arsitektur yang direncanakan:

### Arsitektur JWT

```
Login ──► POST /api/auth/login ──► Express ──► JWT token
                                               │
Request ──► Authorization: Bearer <token> ──► Express (verify) ──► response
Request ──► Authorization: Bearer <token> ──► Python (verify pakai PyJWT) ──► response
```

### Cara Kerja

1. **Login** — user kirim username/password ke Express, validasi, balikin JWT
2. **Setiap request** — FE kirim token di header `Authorization: Bearer <token>`
3. **Express** — verifikasi JWT di middleware, lanjut ke route
4. **Python** — verifikasi JWT pakai library `PyJWT` dengan secret yang sama

### Stack yang Direncanakan

| Komponen | Library |
|----------|---------|
| Issue JWT | `jsonwebtoken` (npm) |
| Verify di Express | `jsonwebtoken` (npm) |
| Verify di Python | `PyJWT` (pip) |
| Secret | env var `JWT_SECRET` |

### Branch Terpisah

Implementasi auth akan dibuat di branch terpisah:
```bash
git checkout -b implementasi-auth
```

Tujuan: kode auth tidak bercampur dengan kode utama, memudahkan review & rollback.

## Perintah Berguna

```bash
npm run dev          # Jalankan Express lokal (dengan auto-restart)
npm start            # Jalankan Express lokal (tanpa auto-restart)
pip install -r requirements.txt  # Install Python deps
git status           # Cek perubahan file
git add .            # Stage semua perubahan
git commit -m "..."  # Commit perubahan
git push             # Push ke GitHub → auto-deploy ke Vercel
```

## Environment Variables

| Variabel | Default | Deskripsi |
|----------|---------|-----------|
| `PORT` | 3000 | Port server Express (lokal) |
| `NODE_ENV` | development | `production` untuk mode produksi |
