const BASE = ''

const formatter = new Intl.NumberFormat('id-ID')

async function fetchJSON(url) {
  const res = await fetch(BASE + url)
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

// Render stats cards
function renderStats(summary) {
  document.getElementById('totalRevenue').textContent = 'Rp ' + formatter.format(summary.totalRevenue)
  document.getElementById('totalTransactions').textContent = summary.totalTransactions
  document.getElementById('totalItems').textContent = summary.totalItems
  document.getElementById('avgTransaction').textContent = 'Rp ' + formatter.format(summary.averageTransactionValue)
}

// Render bar chart
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

// Render table
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

function formatRupiah(v) {
  return 'Rp' + formatter.format(v)
}

// Render category breakdown
function renderCategory(cat) {
  const labelMap = { Electronics: 'Elektronik', Accessories: 'Aksesoris', Components: 'Komponen', Storage: 'Penyimpanan' }
  const colored = ['blue','green','purple','orange']
  const el = document.getElementById('categoryChart')
  const max = Math.max(...cat.map(c => c.totalRevenue))
  el.innerHTML = cat.map((c, i) => `
    <div class="bar-item">
      <span class="bar-label">${labelMap[c.category] || c.category}</span>
      <div class="bar-track">
        <div class="bar-fill ${colored[i]}" style="width:${(c.totalRevenue/max*100)}%">
          ${formatRupiah(c.totalRevenue)}
        </div>
      </div>
    </div>`).join('')
}

// Render monthly trends
function renderMonthly(monthly) {
  const el = document.getElementById('monthlyChart')
  const max = Math.max(...monthly.map(m => m.revenue))
  el.innerHTML = monthly.map(m => `
    <div class="bar-item">
      <span class="bar-label">${m.month}</span>
      <div class="bar-track">
        <div class="bar-fill teal" style="width:${(m.revenue/max*100)}%">
          ${formatRupiah(m.revenue)}
        </div>
      </div>
    </div>`).join('')
}

// Render analysis content
function renderAnalysis(type, data) {
  const el = document.getElementById('analysisContent')

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
  } else if (type === 'category') {
    const labelMap = { Electronics: 'Elektronik', Accessories: 'Aksesoris', Components: 'Komponen', Storage: 'Penyimpanan' }
    const colored = ['blue','green','purple','orange']
    const max = Math.max(...data.map(c => c.totalRevenue))
    el.innerHTML = data.map((c, i) => `
      <div class="bar-item">
        <span class="bar-label">${labelMap[c.category] || c.category}</span>
        <div class="bar-track">
          <div class="bar-fill ${colored[i]}" style="width:${(c.totalRevenue/max*100)}%">
            ${formatRupiah(c.totalRevenue)}
          </div>
        </div>
      </div>`).join('')
  } else if (type === 'monthly') {
    const max = Math.max(...data.map(m => m.revenue))
    el.innerHTML = data.map(m => `
      <div class="bar-item">
        <span class="bar-label">${m.month}</span>
        <div class="bar-track">
          <div class="bar-fill teal" style="width:${(m.revenue/max*100)}%">
            ${formatRupiah(m.revenue)} (${m.transactions} tx)
          </div>
        </div>
      </div>`).join('')
  } else if (type === 'products') {
    el.innerHTML = `<table>
      <thead><tr><th>Produk</th><th class="number">Revenue</th><th class="number">Terjual</th></tr></thead>
      <tbody>${data.map(p => `<tr><td>${p.product}</td><td class="number">${formatRupiah(p.totalRevenue)}</td><td class="number">${p.totalQuantity}</td></tr>`).join('')}</tbody>
    </table>`
  } else if (type === 'payment') {
    const labelMap = { 'Credit Card': '💳 Kartu Kredit', 'Bank Transfer': '🏦 Transfer Bank', 'E-Wallet': '📱 E-Wallet', 'COD': '💵 COD' }
    const colored = ['purple','blue','green','orange']
    const max = Math.max(...data.map(p => p.revenue))
    el.innerHTML = data.map((p, i) => `
      <div class="bar-item">
        <span class="bar-label">${labelMap[p.paymentMethod] || p.paymentMethod}</span>
        <div class="bar-track">
          <div class="bar-fill ${colored[i]}" style="width:${(p.revenue/max*100)}%">
            ${formatRupiah(p.revenue)}
          </div>
        </div>
      </div>`).join('')
  } else if (type === 'customers') {
    el.innerHTML = `<table>
      <thead><tr><th>Pelanggan</th><th class="number">Total Belanja</th><th class="number">Transaksi</th></tr></thead>
      <tbody>${data.map(c => `<tr><td>${c.customer}</td><td class="number">${formatRupiah(c.totalSpent)}</td><td class="number">${c.transactionCount}</td></tr>`).join('')}</tbody>
    </table>`
  } else if (type === 'correlation') {
    const vars = ['quantity', 'price', 'total']
    el.innerHTML = `<table>
      <thead><tr><th></th>${vars.map(v => `<th class="number">${v}</th>`).join('')}</tr></thead>
      <tbody>${vars.map(row => `
        <tr><td><strong>${row}</strong></td>
        ${vars.map(col => {
          const val = data[row]?.[col]
          const color = val > 0.5 ? 'color:#059669' : val < -0.5 ? 'color:#dc2626' : 'color:#6b7280'
          return `<td class="number" style="${color}">${val ?? '-'}</td>`
        }).join('')}
      </tr>`).join('')}</tbody>
    </table>`
  }
}

// Initialize
async function init() {
  try {
    // Load Node.js data
    const nodeData = await fetchJSON('/api/data')
    const summary = nodeData.data.summary

    renderStats(summary)

    // Category
    const catEntries = Object.entries(summary.categoryBreakdown).map(([k, v]) => ({
      category: k, totalRevenue: v.revenue, transactionCount: v.count
    }))
    renderCategory(catEntries)

    // Monthly
    const monthlyEntries = Object.entries(summary.monthlyRevenue).map(([k, v]) => ({
      month: k, revenue: v, transactions: 0, items: 0
    }))
    renderMonthly(monthlyEntries)

    // Top products
    renderTable('topProducts', summary.topProducts, [
      { key: 'product' },
      { key: 'total', align: 'right', fn: v => formatRupiah(v) },
      { key: 'quantity', align: 'right' }
    ])

    // Payment methods - compute from raw data
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

    // Load Python analysis
    const pyData = await fetchJSON('/api/analisis')
    const analysis = pyData.data

    // Tab switching
    const tabs = document.querySelectorAll('.tab')
    let activeTab = 'statistics'

    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        tabs.forEach(t => t.classList.remove('active'))
        tab.classList.add('active')
        activeTab = tab.dataset.type
        renderAnalysis(activeTab, analysis[activeTab])
      })
    })

    renderAnalysis('statistics', analysis.statistics)

  } catch (err) {
    document.getElementById('analysisContent').innerHTML =
      `<p class="text-muted">Gagal memuat data: ${err.message}</p>`
    document.getElementById('stats').innerHTML =
      `<div class="stat-card" style="grid-column:1/-1;text-align:center;color:#dc2626">
        ❌ Gagal terhubung ke server. Pastikan server berjalan.
      </div>`
  }
}

init()
