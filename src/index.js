/*
  ============================================================
  EXPRESS SERVER (index.js)
  ============================================================
  Entry point utama aplikasi Node.js.
  Tugas:
    1. Serve frontend (static files dari folder public/)
    2. REST API endpoint: /api/info, /api/data
    3. Middleware JSON parser

  Di Vercel: file ini di-build dengan @vercel/node.
  Ekspor default `app` untuk Vercel Serverless Function.

  Di lokal: jalan sebagai server mandiri di port 3000.
  ============================================================
*/

import 'dotenv/config'                   // Baca .env file
import express from 'express'             // Framework web
import { fileURLToPath } from 'url'       // Utk __dirname di ES Module
import { dirname, join } from 'path'      // Manipulasi path file
import { readFileSync } from 'fs'         // Baca file HTML
import { salesData, getSalesSummary } from './data/sales.js'

// __dirname tidak tersedia di ES Module, dibuat manual dari import.meta.url
// Contoh: file:///Users/.../src/index.js -> /Users/.../src/
const __dirname = dirname(fileURLToPath(import.meta.url))

// Folder public/ relatif terhadap src/
const publicDir = join(__dirname, '..', 'public')

const app = express()

// ============================================================
// MIDDLEWARE
// ============================================================

// express.json() — parsing body request jadi JSON (untuk POST)
app.use(express.json())

// express.static() — serve file statis dari folder public/
// Contoh: /style.css -> public/style.css, /app.js -> public/app.js
app.use(express.static(publicDir))

// ============================================================
// ROUTES
// ============================================================

// GET / — halaman depan (frontend dashboard)
// Baca file index.html langsung (agar path pasti benar di Vercel)
// Fallback: kalau gagal, redirect ke /api/info
app.get('/', (_req, res) => {
  try {
    const html = readFileSync(join(publicDir, 'index.html'), 'utf-8')
    res.type('html').send(html)
  } catch {
    res.redirect('/api/info')
  }
})

// GET /api/info — informasi API (JSON)
app.get('/api/info', (_req, res) => {
  res.json({
    message: 'Express + Python Pandas Analisis',
    endpoints: {
      'GET /': 'Frontend dashboard',
      'GET /api/analisis': 'Python-based sales analysis with pandas',
      'GET /api/data': 'Raw sales data and summary statistics'
    }
  })
})

// GET /api/data — data penjualan + ringkasan (dari sales.js)
app.get('/api/data', (_req, res) => {
  res.json({
    success: true,
    data: {
      transactions: salesData,   // Seluruh array transaksi
      summary: getSalesSummary() // Hasil hitung ringkasan
    }
  })
})

// ============================================================
// LOCAL DEVELOPMENT
// ============================================================
// Hanya jalan kalau NODE_ENV bukan 'production'.
// Di Vercel, NODE_ENV='production' -> block ini tidak jalan.
// Vercel menggunakan export default app sebagai handler.
// ============================================================
const PORT = process.env.PORT || 3000
if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`)
  })
}

export default app
