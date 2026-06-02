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

import 'dotenv/config'
import express from 'express'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { readFileSync, existsSync } from 'fs'
import { salesData, getSalesSummary } from './data/sales.js'
import { findUser, validatePassword } from './data/users.js'
import { generateToken, verifyToken } from './middleware/auth.js'

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

// POST /api/auth/login — login user, balikin JWT token
app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body || {}
  if (!username || !password) {
    return res.status(400).json({ success: false, message: 'Username dan password wajib diisi' })
  }

  const user = findUser(username)
  if (!user || !validatePassword(password, user.password)) {
    return res.status(401).json({ success: false, message: 'Username atau password salah' })
  }

  const token = generateToken(user)
  res.json({ success: true, data: { token, username: user.username, role: user.role } })
})

// GET /api/auth/me — cek token, balikin info user
app.get('/api/auth/me', verifyToken, (req, res) => {
  res.json({ success: true, data: { user: req.user } })
})

// GET / — halaman depan (frontend dashboard)
// Kalau ada file index-auth.html, serve itu (biar gak ngerusak main)
app.get('/', (_req, res) => {
  const htmlPath = join(publicDir, 'index.html')
  if (existsSync(htmlPath)) {
    const html = readFileSync(htmlPath, 'utf-8')
    return res.type('html').send(html)
  }
  res.redirect('/api/info')
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
