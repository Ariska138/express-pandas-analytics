/*
  ============================================================
  FRONTEND LOGIC (app.js)
  ============================================================
  Tugas:
    1. Login/logout flow dengan JWT
    2. Fetch data dari /api/data (Node.js) dan /api/analisis (Python)
    3. Render stats cards, grafik batang, dan tabel
    4. Handle tab switching untuk Python analysis

  Alur:
    cek token → kalau tidak ada → tampilkan modal login
              → kalau ada → fetch data → render
  ============================================================
*/

const BASE = ''
const TOKEN_KEY = 'auth_token'

const formatter = new Intl.NumberFormat('id-ID')

// ============================================================
// Token helpers
// ============================================================
function getToken() { return localStorage.getItem(TOKEN_KEY) }
function setToken(t) { localStorage.setItem(TOKEN_KEY, t) }
function clearToken() { localStorage.removeItem(TOKEN_KEY) }

function authHeaders() {
  const t = getToken()
  return t ? { Authorization: `Bearer ${t}` } : {}
}

// ============================================================
// fetchJSON — fetch dengan JWT header otomatis
// ============================================================
async function fetchJSON(url) {
  const res = await fetch(BASE + url, { headers: { ...authHeaders() } })
  if (res.status === 401) {
    clearToken()
    showLogin()
    throw new Error('Sesi habis, silakan login ulang')
  }
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

// ============================================================
// renderStats — isi 4 kartu statistik
// ============================================================
function renderStats(summary) {
  document.getElementById('totalRevenue').textContent = 'Rp ' + formatter.format(summary.totalRevenue)
  document.getElementById('totalTransactions').textContent = summary.totalTransactions
  document.getElementById('totalItems').textContent = summary.totalItems
  document.getElementById('avgTransaction').textContent = 'Rp ' + formatter.format(Math.round(summary.averageTransactionValue))
}

// ============================================================
// renderBars — render grafik batang dari object/array
// ============================================================
function renderBars(containerId, data, labelKey, valueKey, colorClass, formatFn) {
  const el = document.getElementById(containerId)
  const max = Math.max(...Object.values(data).map(v => typeof v === 'object' ? v[valueKey] : v))
  el.innerHTML = Object.entries(data).map(([key, val]) => {
    const v = typeof val === 'object' ? val[valueKey] : val
    const pct = max > 0 ? (v / max * 100) : 0
    return `
      <div class="bar-item">
        <span class="bar-label">${key}</span>
        <div class="bar-track">
          <div class="bar-fill ${colorClass}" style="width:${pct}%">
            ${formatFn ? formatFn(v) : v}
          </div>
        </div>
      </div>`
  }).join('')
}

// ============================================================
// renderTable — render tabel HTML dari array of objects
// ============================================================
function renderTable(tableId, data, columns) {
  const tbody = document.querySelector(`#${tableId} tbody`)
  tbody.innerHTML = data.map(row => {
    const cells = columns.map(col => {
      const val = row[col.key]
      const cls = col.align === 'right' ? ' class="number"' : ''
      const display = col.fn ? col.fn(val, row) : (col.prefix || '') + (typeof val === 'number' ? formatter.format(val) : val)
      return `<td${cls}>${display}</td>`
    }).join('')
    return `<tr>${cells}</tr>`
  }).join('')
}

// Helper: format angka ke Rupiah
function formatRupiah(v) {
  return 'Rp' + formatter.format(v)
}

// ============================================================
// renderCategory — grafik kategori (dari data Node.js)
// ============================================================
function renderCategory(cat) {
  const labelMap = { Electronics: 'Elektronik', Accessories: 'Aksesoris', Components: 'Komponen', Storage: 'Penyimpanan' }
  const colored = ['blue', 'green', 'purple', 'orange']
  const el = document.getElementById('categoryChart')
  const max = Math.max(...cat.map(c => c.totalRevenue))
  el.innerHTML = cat.map((c, i) => `
    <div class="bar-item">
      <span class="bar-label">${labelMap[c.category] || c.category}</span>
      <div class="bar-track">
        <div class="bar-fill ${colored[i]}" style="width:${(c.totalRevenue / max * 100)}%">
          ${formatRupiah(c.totalRevenue)}
        </div>
      </div>
    </div>`).join('')
}

// ============================================================
// renderMonthly — grafik tren bulanan (dari data Node.js)
// ============================================================
function renderMonthly(monthly) {
  const el = document.getElementById('monthlyChart')
  const max = Math.max(...monthly.map(m => m.revenue))
  el.innerHTML = monthly.map(m => `
    <div class="bar-item">
      <span class="bar-label">${m.month}</span>
      <div class="bar-track">
        <div class="bar-fill teal" style="width:${(m.revenue / max * 100)}%">
          ${formatRupiah(m.revenue)}
        </div>
      </div>
    </div>`).join('')
}

// ============================================================
// renderAnalysis — render konten tab Python analysis
// Menerima type (string) dan data (dari API Python)
// Setiap type punya format render berbeda
// ============================================================
function renderAnalysis(type, data) {
  const el = document.getElementById('analysisContent')

  // Kalau data null/undefined — tampilkan pesan
  if (!data) {
    el.innerHTML = '<p class="text-muted">Data tidak tersedia untuk analisis ini.</p>'
    return
  }

  // --- STATISTICS: tabel 2 kolom (metrik, nilai) ---
  if (type === 'statistics') {
    const s = data
    el.innerHTML = `
      <table>
        <tr><td>Total Revenue</td><td class="number"><strong>${formatRupiah(s.totalRevenue)}</strong></td></tr>
        <tr><td>Total Transaksi</td><td class="number">${s.totalTransactions}</td></tr>
        <tr><td>Total Item Terjual</td><td class="number">${s.totalItems}</td></tr>
        <tr><td>Rata-rata per Transaksi</td><td class="number">${formatRupiah(s.averageTransactionValue)}</td></tr>
        <tr><td>Median per Transaksi</td><td class="number">${formatRupiah(s.medianTransactionValue)}</td></tr>
        <tr><td>Std Dev Transaksi</td><td class="number">${s.stdTransactionValue}</td></tr>
        <tr><td>Transaksi Min</td><td class="number">${formatRupiah(s.minTransactionValue)}</td></tr>
        <tr><td>Transaksi Max</td><td class="number">${formatRupiah(s.maxTransactionValue)}</td></tr>
        <tr><td colspan="2"><hr></td></tr>
        <tr><td>Rata-rata Harga Item</td><td class="number">${formatRupiah(s.priceStats.meanPrice)}</td></tr>
        <tr><td>Median Harga Item</td><td class="number">${formatRupiah(s.priceStats.medianPrice)}</td></tr>
      </table>`

  // --- CATEGORY: grafik batang ---
  } else if (type === 'category') {
    const labelMap = { Electronics: 'Elektronik', Accessories: 'Aksesoris', Components: 'Komponen', Storage: 'Penyimpanan' }
    const colored = ['blue', 'green', 'purple', 'orange']
    const max = Math.max(...data.map(c => c.totalRevenue))
    el.innerHTML = data.map((c, i) => `
      <div class="bar-item">
        <span class="bar-label">${labelMap[c.category] || c.category}</span>
        <div class="bar-track">
          <div class="bar-fill ${colored[i]}" style="width:${(c.totalRevenue / max * 100)}%">
            ${formatRupiah(c.totalRevenue)}
          </div>
        </div>
      </div>`).join('')

  // --- MONTHLY: grafik batang tren ---
  } else if (type === 'monthly') {
    const max = Math.max(...data.map(m => m.revenue))
    el.innerHTML = data.map(m => `
      <div class="bar-item">
        <span class="bar-label">${m.month}</span>
        <div class="bar-track">
          <div class="bar-fill teal" style="width:${(m.revenue / max * 100)}%">
            ${formatRupiah(m.revenue)} (${m.transactions} tx)
          </div>
        </div>
      </div>`).join('')

  // --- PRODUCTS: tabel top produk ---
  } else if (type === 'products') {
    el.innerHTML = `<table>
      <thead><tr><th>Produk</th><th class="number">Revenue</th><th class="number">Terjual</th></tr></thead>
      <tbody>${data.map(p => `<tr><td>${p.product}</td><td class="number">${formatRupiah(p.totalRevenue)}</td><td class="number">${p.totalQuantity}</td></tr>`).join('')}</tbody>
    </table>`

  // --- PAYMENT: grafik batang metode bayar ---
  } else if (type === 'payment') {
    const labelMap = { 'Credit Card': ' Kartu Kredit', 'Bank Transfer': ' Transfer Bank', 'E-Wallet': ' E-Wallet', 'COD': ' COD' }
    const colored = ['purple', 'blue', 'green', 'orange']
    const max = Math.max(...data.map(p => p.revenue))
    el.innerHTML = data.map((p, i) => `
      <div class="bar-item">
        <span class="bar-label">${labelMap[p.paymentMethod] || p.paymentMethod}</span>
        <div class="bar-track">
          <div class="bar-fill ${colored[i]}" style="width:${(p.revenue / max * 100)}%">
            ${formatRupiah(p.revenue)}
          </div>
        </div>
      </div>`).join('')

  // --- CUSTOMERS: tabel top pelanggan ---
  } else if (type === 'customers') {
    el.innerHTML = `<table>
      <thead><tr><th>Pelanggan</th><th class="number">Total Belanja</th><th class="number">Transaksi</th></tr></thead>
      <tbody>${data.map(c => `<tr><td>${c.customer}</td><td class="number">${formatRupiah(c.totalSpent)}</td><td class="number">${c.transactionCount}</td></tr>`).join('')}</tbody>
    </table>`

  // --- CORRELATION: matriks korelasi pandas ---
  } else if (type === 'correlation') {
    const vars = ['quantity', 'price', 'total']
    el.innerHTML = `<table>
      <thead><tr><th></th>${vars.map(v => `<th class="number">${v}</th>`).join('')}</tr></thead>
      <tbody>${vars.map(row => `
        <tr><td><strong>${row}</strong></td>
        ${vars.map(col => {
          const val = data[row]?.[col]
          // Warna: hijau (positif kuat), merah (negatif kuat), abu (lemah)
          const color = val > 0.5 ? 'color:#059669' : val < -0.5 ? 'color:#dc2626' : 'color:#6b7280'
          return `<td class="number" style="${color}">${val ?? '-'}</td>`
        }).join('')}
      </tr>`).join('')}</tbody>
    </table>`
  }
}

// ============================================================
// INIT — fungsi utama, jalan pas halaman selesai dimuat
// ============================================================
// ============================================================
// LOGIN / LOGOUT
// ============================================================

function showLogin() {
  document.getElementById('loginModal').style.display = 'flex'
  document.getElementById('navUser').style.display = 'none'
  document.getElementById('btnLogout').style.display = 'none'
}

function hideLogin() {
  document.getElementById('loginModal').style.display = 'none'
}

function showAuthed(username) {
  hideLogin()
  document.getElementById('navUser').textContent = `👤 ${username}`
  document.getElementById('navUser').style.display = 'inline'
  document.getElementById('btnLogout').style.display = 'inline'
}

async function doLogin(username, password) {
  const res = await fetch(BASE + '/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  })
  const json = await res.json()
  if (!json.success) throw new Error(json.message)
  return json.data
}

// Event listeners login
document.getElementById('btnLogin').addEventListener('click', async () => {
  const username = document.getElementById('loginUsername').value.trim()
  const password = document.getElementById('loginPassword').value
  const errEl = document.getElementById('loginError')
  errEl.textContent = ''
  try {
    const data = await doLogin(username, password)
    setToken(data.token)
    showAuthed(data.username)
    init()
  } catch (e) {
    errEl.textContent = e.message
  }
})

// Enter key on password field
document.getElementById('loginPassword').addEventListener('keydown', (e) => {
  if (e.key === 'Enter') document.getElementById('btnLogin').click()
})

document.getElementById('btnLogout').addEventListener('click', () => {
  clearToken()
  showLogin()
  document.getElementById('stats').innerHTML = ''
  document.getElementById('categoryChart').innerHTML = ''
  document.getElementById('monthlyChart').innerHTML = ''
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'))
  document.querySelector('.tab')?.classList.add('active')
  document.getElementById('analysisContent').innerHTML =
    '<p class="text-muted">Silakan login untuk melihat data.</p>'
})

// ============================================================
// INIT — jalankan setelah login sukses atau token tersimpan
// ============================================================
async function init() {
  try {
    const token = getToken()
    if (!token) return showLogin()

    // Cek token masih valid
    const me = await fetchJSON('/api/auth/me')
    showAuthed(me.data.user.username)

    // --------------------------------------------------
    // 1. LOAD DATA DARI NODE.JS (Express)
    // --------------------------------------------------
    const nodeData = await fetchJSON('/api/data')
    const summary = nodeData.data.summary
    renderStats(summary)

    const catEntries = Object.entries(summary.categoryBreakdown).map(([k, v]) => ({
      category: k, totalRevenue: v.revenue, transactionCount: v.count
    }))
    renderCategory(catEntries)

    const monthlyEntries = Object.entries(summary.monthlyRevenue).map(([k, v]) => ({
      month: k, revenue: v, transactions: 0, items: 0
    }))
    renderMonthly(monthlyEntries)

    renderTable('topProducts', summary.topProducts, [
      { key: 'product' },
      { key: 'total', align: 'right', fn: v => formatRupiah(v) },
      { key: 'quantity', align: 'right' }
    ])

    const payMap = {}
    nodeData.data.transactions.forEach(t => {
      const total = t.price * t.quantity
      if (!payMap[t.paymentMethod]) payMap[t.paymentMethod] = { count: 0, revenue: 0 }
      payMap[t.paymentMethod].count++
      payMap[t.paymentMethod].revenue += total
    })
    const payData = Object.entries(payMap).map(([k, v]) => ({ paymentMethod: k, ...v }))
    renderTable('paymentMethods', payData, [
      { key: 'paymentMethod' },
      { key: 'count', align: 'right' },
      { key: 'revenue', align: 'right', fn: v => formatRupiah(v) }
    ])

    // --------------------------------------------------
    // 2. LOAD DATA DARI PYTHON (pandas) — butuh token
    // --------------------------------------------------
    const pyData = await fetchJSON('/api/analisis')
    const analysis = pyData.data

    const tabKey = {
      statistics: 'statistics',
      category: 'categoryAnalysis',
      monthly: 'monthlyTrends',
      products: 'topProducts',
      payment: 'paymentMethodAnalysis',
      customers: 'topCustomers',
      correlation: 'correlationMatrix'
    }

    const tabs = document.querySelectorAll('.tab')
    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        tabs.forEach(t => t.classList.remove('active'))
        tab.classList.add('active')
        renderAnalysis(tab.dataset.type, analysis[tabKey[tab.dataset.type]])
      })
    })

    renderAnalysis('statistics', analysis.statistics)

  } catch (err) {
    document.getElementById('analysisContent').innerHTML =
      `<p class="text-muted">Gagal memuat data: ${err.message}</p>`
    document.getElementById('stats').innerHTML =
      `<div class="stat-card" style="grid-column:1/-1;text-align:center;color:#dc2626">
        ❌ ${err.message}
      </div>`
  }
}

// Mulai
init()
