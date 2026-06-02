# AGENTS.md — Panduan untuk AI Assistant

## Ringkasan Proyek

Express.js (Node.js) + Python pandas untuk analisis data penjualan, dual runtime di Vercel.

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
│   └── analisis.py       # Python Function — endpoint /api/analisis
├── public/
│   ├── index.html        # Frontend dashboard
│   ├── style.css         # Styling dashboard
│   └── app.js            # Frontend logic (fetch + render)
├── src/
│   ├── index.js          # Express entry point
│   └── data/
│       └── sales.js      # Dummy data 20 transaksi
├── requirements.txt      # pandas, numpy
├── vercel.json           # Routing dual runtime
├── AGENTS.md             # (file ini)
└── README.md             # Dokumentasi developer
```

## API Endpoints

| Method | Path | Runtime | Deskripsi |
|--------|------|---------|-----------|
| GET | `/` | Node.js | Frontend dashboard (HTML) |
| GET | `/api/info` | Node.js | Info API (JSON) |
| GET | `/api/data` | Node.js | Data mentah + ringkasan |
| GET | `/api/analisis` | Python | Analisis pandas (query: `?type=statistics\|category\|monthly\|products\|payment\|customers\|correlation`) |

## Perintah Berguna

```bash
npm run dev          # Jalankan Express lokal
node src/index.js    # Alternatif start
pip install -r requirements.txt  # Install Python deps lokal
```

## Catatan

- Data 20 transaksi dummy (Jan–Apr 2026) — kategori Electronics, Accessories, Components, Storage
- Jika deploy, Vercel handle routing otomatis berdasarkan `vercel.json`
- Tidak ada database — semua data in-memory
