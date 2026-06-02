# AGENTS.md — Panduan untuk AI Assistant

## Ringkasan Proyek

Express.js (Node.js) + Python pandas untuk analisis data penjualan, dual runtime di Vercel.
Dirancang untuk kolaborasi 3 tim: **FE** (frontend), **BE** (backend API), **AI/DS** (data analysis).

## Stack

- **Runtime 1:** Node.js (Express 5) — serve API utama, data endpoint
- **Runtime 2:** Python 3 — Vercel Function dengan pandas & numpy untuk analisis data
- **Deploy:** Vercel (otomatis deteksi dual runtime via `vercel.json`)

## Struktur Penting

```
api/analisis.py        # Python Function — endpoint /api/analisis
src/index.js           # Express entry point
src/data/sales.js      # Dummy data 20 transaksi (satu-satunya sumber data)
vercel.json            # Routing: /api/analisis -> Python, sisanya -> Node.js
requirements.txt       # pandas, numpy
```

## Role & Boundaries

| Role | Area | Tanggung Jawab |
|------|------|----------------|
| **FE** | `public/` | HTML, CSS, JS — tampilan dashboard, fetch API, login UI |
| **BE** | `src/` + `vercel.json` | Express routes, auth, data flow, config deployment |
| **AI/DS** | `api/` + `requirements.txt` | Python pandas analysis, data processing |

### Aturan Per Role

**FE:**
- Bebas ubah file di `public/` tanpa koordinasi
- Cukup tahu endpoint API (`/api/data`, `/api/analisis`)
- Tidak perlu paham Express atau Python

**BE:**
- Handle semua routing di `src/index.js`
- Jangan ubah `api/analisis.py` tanpa koordinasi dengan AI/DS
- Pastikan endpoint stabil — FE tergantung pada response format

**AI/DS:**
- Fokus di `api/analisis.py` dan `requirements.txt`
- Data di `api/data.json` — sinkronisasi manual dengan `src/data/sales.js`
- Jangan ubah routing Express tanpa koordinasi BE

## Arsitektur Kolaborasi

```
FE (public/)
  │  fetch('/api/data')
  ├──► BE (src/index.js) ── sales.js ──► Data
  │
  │  fetch('/api/analisis')
  └──► AI/DS (api/analisis.py) ── data.json ──► Data
```

Setiap tim bekerja di foldernya masing-masing. FE hanya perlu tahu URL endpoint.
BE dan AI/DS tidak perlu paham HTML/CSS/JS.

## Branch Strategy

```
main ─── staging ─── feat/fe-dashboard
                  └── feat/be-auth
                  └── feat/ds-analisis-baru
```

- Setiap fitur dikerjakan di branch sendiri
- PR di-review oleh tim terkait sebelum di-merge ke `staging`
- `staging` di-test dulu sebelum di-merge ke `main`

## Aturan Koding

1. **Data penjualan** hanya di `src/data/sales.js` — jika butuh data baru, ubah di sini
2. **Python** hanya di `api/analisis.py` — tidak ada Python lain di proyek ini
3. **Jangan tambah dependency** tanpa diskusi — proyek ini minimalis
4. **Routes Express** hanya di `src/index.js` — tidak pakai folder routes terpisah
5. **Frontend** di `public/` — HTML, CSS, JS statis. Express serve via `express.static('public')`
6. **Halaman depan (`/`)** adalah dashboard frontend, bukan JSON

## Vercel Python — Batasan Kritis

- Cold start: 5–15 detik (pandas berat)
- Memory: max 4 GB, CPU: max 2 vCPU
- Timeout: 300s (Hobby) / 800s (Pro)
- Bundle size: max 500 MB
- Tidak support: training ML, dataset >100 MB, ETL >10 menit, WebSocket, background job

## Struktur Lengkap

```
├── api/
│   ├── analisis.py       # Python Function — endpoint /api/analisis [AI/DS]
│   └── data.json         # Data penjualan (JSON) [AI/DS]
├── public/
│   ├── index.html        # Frontend dashboard [FE]
│   ├── style.css         # Styling dashboard [FE]
│   └── app.js            # Frontend logic (fetch + render) [FE]
├── src/
│   ├── index.js          # Express entry point [BE]
│   ├── data/
│   │   ├── sales.js      # Dummy data 20 transaksi [BE]
│   │   └── users.js      # User store untuk auth [BE]
│   └── middleware/
│       └── auth.js       # JWT middleware [BE]
├── requirements.txt      # pandas, PyJWT [AI/DS]
├── vercel.json           # Routing dual runtime [BE]
├── AGENTS.md             # (file ini)
└── README.md             # Dokumentasi developer
```

## API Endpoints

| Method | Path | Runtime | Role | Deskripsi |
|--------|------|---------|------|-----------|
| GET | `/` | Node.js | All | Frontend dashboard (HTML) |
| POST | `/api/auth/login` | Node.js | BE | Login user, return JWT |
| GET | `/api/auth/me` | Node.js | BE | Cek token user |
| GET | `/api/info` | Node.js | BE | Info API (JSON) |
| GET | `/api/data` | Node.js | BE | Data mentah + ringkasan |
| GET | `/api/analisis` | Python | AI/DS | Analisis pandas (query: `?type=statistics`) |

## Perintah Berguna

```bash
npm run dev          # Jalankan Express lokal
node src/index.js    # Alternatif start
pip install -r requirements.txt  # Install Python deps lokal
npm run lint         # Cek kode (jika ada)
```

## Catatan

- Data 20 transaksi dummy (Jan–Apr 2026) — kategori Electronics, Accessories, Components, Storage
- Jika deploy, Vercel handle routing otomatis berdasarkan `vercel.json`
- Tidak ada database — semua data in-memory
- Untuk development lokal, Python endpoint `/api/analisis` hanya jalan setelah deploy ke Vercel
