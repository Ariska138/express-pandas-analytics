/*
  ============================================================
  FRONTEND LOGIC (app.js)
  ============================================================
  Tugas:
    1. Fetch data dari /api/data (Node.js) dan /api/analisis (Python)
    2. Render stats cards, grafik batang, dan tabel
    3. Handle tab switching untuk Python analysis

  Alur:
    inisialisasi → fetchJSON('/api/data') → render statis Node
                ↓
          fetchJSON('/api/analisis') → render tab Python
  ============================================================
*/

// BASE URL — kosong karena frontend di-serve dari origin yang sama
const BASE = ''

// Formatter angka ke format Indonesia (rupiah)
// Contoh: 15000000 -> "15.000.000"
const formatter = new Intl.NumberFormat('id-ID')

// ============================================================
// Utility: fetchJSON — fetch URL dan parse JSON
// ============================================================
async function fetchJSON(url) {
  const res = await fetch(BASE + url)
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
async function init() {
  try {
    // --------------------------------------------------
    // 1. LOAD DATA DARI NODE.JS (Express)
    //    Endpoint: GET /api/data
    //    Berisi: transaksi[] + summary (total, kategori, dll)
    // --------------------------------------------------
    const nodeData = await fetchJSON('/api/data')
    const summary = nodeData.data.summary

    // Render 4 kartu statistik
    renderStats(summary)

    // Render kategori (dari categoryBreakdown object)
    const catEntries = Object.entries(summary.categoryBreakdown).map(([k, v]) => ({
      category: k, totalRevenue: v.revenue, transactionCount: v.count
    }))
    renderCategory(catEntries)

    // Render bulanan (dari monthlyRevenue object)
    const monthlyEntries = Object.entries(summary.monthlyRevenue).map(([k, v]) => ({
      month: k, revenue: v, transactions: 0, items: 0
    }))
    renderMonthly(monthlyEntries)

    // Render tabel top 5 produk
    renderTable('topProducts', summary.topProducts, [
      { key: 'product' },
      { key: 'total', align: 'right', fn: v => formatRupiah(v) },
      { key: 'quantity', align: 'right' }
    ])

    // Hitung metode pembayaran dari raw transaksi
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
    // 2. LOAD DATA DARI PYTHON (pandas)
    //    Endpoint: GET /api/analisis
    //    Berisi: statistics, categoryAnalysis, monthlyTrends,
    //            topProducts, paymentMethodAnalysis,
    //            topCustomers, correlationMatrix
    // --------------------------------------------------
    const pyData = await fetchJSON('/api/analisis')
    const analysis = pyData.data

    // Mapping: data-type tab → key di response API
    // Karena key Python beda dengan nama tab di HTML
    const tabKey = {
      statistics: 'statistics',
      category: 'categoryAnalysis',
      monthly: 'monthlyTrends',
      products: 'topProducts',
      payment: 'paymentMethodAnalysis',
      customers: 'topCustomers',
      correlation: 'correlationMatrix'
    }

    // Pasang event listener ke setiap tab
    const tabs = document.querySelectorAll('.tab')
    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        tabs.forEach(t => t.classList.remove('active'))
        tab.classList.add('active')
        renderAnalysis(tab.dataset.type, analysis[tabKey[tab.dataset.type]])
      })
    })

    // Render tab pertama (statistics) secara default
    renderAnalysis('statistics', analysis.statistics)

  } catch (err) {
    // --------------------------------------------------
    // ERROR HANDLING — kalau fetch gagal
    // --------------------------------------------------
    document.getElementById('analysisContent').innerHTML =
      `<p class="text-muted">Gagal memuat data: ${err.message}</p>`
    document.getElementById('stats').innerHTML =
      `<div class="stat-card" style="grid-column:1/-1;text-align:center;color:#dc2626">
        ❌ Gagal terhubung ke server. Pastikan server berjalan.
      </div>`
  }
}

// Jalankan init saat halaman siap
init()
