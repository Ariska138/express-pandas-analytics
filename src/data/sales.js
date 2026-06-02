export const salesData = [
  {
    id: 1,
    product: "Laptop ASUS ROG",
    category: "Electronics",
    quantity: 2,
    price: 15000000,
    date: "2026-01-15",
    customer: "Budi Santoso",
    paymentMethod: "Credit Card"
  },
  {
    id: 2,
    product: "Mouse Logitech MX",
    category: "Accessories",
    quantity: 5,
    price: 850000,
    date: "2026-01-16",
    customer: "Siti Rahayu",
    paymentMethod: "Bank Transfer"
  },
  {
    id: 3,
    product: "Keyboard Mechanical",
    category: "Accessories",
    quantity: 3,
    price: 1200000,
    date: "2026-01-18",
    customer: "Ahmad Wijaya",
    paymentMethod: "E-Wallet"
  },
  {
    id: 4,
    product: "Monitor Samsung 27\"",
    category: "Electronics",
    quantity: 1,
    price: 4500000,
    date: "2026-01-20",
    customer: "Dewi Lestari",
    paymentMethod: "Credit Card"
  },
  {
    id: 5,
    product: "Headset Gaming HyperX",
    category: "Accessories",
    quantity: 4,
    price: 950000,
    date: "2026-01-22",
    customer: "Rudi Hermawan",
    paymentMethod: "COD"
  },
  {
    id: 6,
    product: "SSD NVMe 1TB",
    category: "Components",
    quantity: 6,
    price: 1350000,
    date: "2026-02-01",
    customer: "Maya Putri",
    paymentMethod: "Bank Transfer"
  },
  {
    id: 7,
    product: "RAM DDR5 32GB",
    category: "Components",
    quantity: 4,
    price: 1800000,
    date: "2026-02-05",
    customer: "Fajar Nugroho",
    paymentMethod: "Credit Card"
  },
  {
    id: 8,
    product: "Laptop MacBook Air M3",
    category: "Electronics",
    quantity: 1,
    price: 22000000,
    date: "2026-02-10",
    customer: "Linda Susanti",
    paymentMethod: "Credit Card"
  },
  {
    id: 9,
    product: "Webcam Logitech C920",
    category: "Accessories",
    quantity: 3,
    price: 1100000,
    date: "2026-02-12",
    customer: "Hendra Kurniawan",
    paymentMethod: "E-Wallet"
  },
  {
    id: 10,
    product: "Printer Epson L3250",
    category: "Electronics",
    quantity: 2,
    price: 3200000,
    date: "2026-02-15",
    customer: "Rina Marlina",
    paymentMethod: "Bank Transfer"
  },
  {
    id: 11,
    product: "Mousepad Gaming XL",
    category: "Accessories",
    quantity: 10,
    price: 250000,
    date: "2026-02-18",
    customer: "Yoga Pratama",
    paymentMethod: "E-Wallet"
  },
  {
    id: 12,
    product: "Processor AMD Ryzen 7",
    category: "Components",
    quantity: 2,
    price: 4500000,
    date: "2026-03-01",
    customer: "Agus Setiawan",
    paymentMethod: "Credit Card"
  },
  {
    id: 13,
    product: "Casing PC NZXT",
    category: "Components",
    quantity: 3,
    price: 1650000,
    date: "2026-03-05",
    customer: "Dian Purnama",
    paymentMethod: "Bank Transfer"
  },
  {
    id: 14,
    product: "Power Supply 750W",
    category: "Components",
    quantity: 4,
    price: 1400000,
    date: "2026-03-08",
    customer: "Teguh Widodo",
    paymentMethod: "COD"
  },
  {
    id: 15,
    product: "Laptop Lenovo ThinkPad",
    category: "Electronics",
    quantity: 2,
    price: 18500000,
    date: "2026-03-12",
    customer: "Nita Anggraini",
    paymentMethod: "Credit Card"
  },
  {
    id: 16,
    product: "USB Hub 7-in-1",
    category: "Accessories",
    quantity: 8,
    price: 350000,
    date: "2026-03-15",
    customer: "Bambang Sutrisno",
    paymentMethod: "E-Wallet"
  },
  {
    id: 17,
    product: "Speaker Bluetooth JBL",
    category: "Electronics",
    quantity: 5,
    price: 1250000,
    date: "2026-03-18",
    customer: "Sari Dewi",
    paymentMethod: "Bank Transfer"
  },
  {
    id: 18,
    product: "Cooling Fan RGB",
    category: "Components",
    quantity: 7,
    price: 280000,
    date: "2026-03-20",
    customer: "Irfan Hakim",
    paymentMethod: "COD"
  },
  {
    id: 19,
    product: "External HDD 2TB",
    category: "Storage",
    quantity: 3,
    price: 950000,
    date: "2026-04-01",
    customer: "Putri Handayani",
    paymentMethod: "E-Wallet"
  },
  {
    id: 20,
    product: "Flash Drive 128GB",
    category: "Storage",
    quantity: 15,
    price: 180000,
    date: "2026-04-05",
    customer: "Roni Saputra",
    paymentMethod: "COD"
  }
]

export const getSalesSummary = () => {
  const totalRevenue = salesData.reduce((sum, sale) => sum + (sale.price * sale.quantity), 0)
  const totalTransactions = salesData.length
  const totalItems = salesData.reduce((sum, sale) => sum + sale.quantity, 0)
  
  const categoryBreakdown = {}
  salesData.forEach(sale => {
    if (!categoryBreakdown[sale.category]) {
      categoryBreakdown[sale.category] = { count: 0, revenue: 0 }
    }
    categoryBreakdown[sale.category].count += 1
    categoryBreakdown[sale.category].revenue += sale.price * sale.quantity
  })

  const monthlyRevenue = {}
  salesData.forEach(sale => {
    const month = sale.date.substring(0, 7)
    if (!monthlyRevenue[month]) {
      monthlyRevenue[month] = 0
    }
    monthlyRevenue[month] += sale.price * sale.quantity
  })

  const topProducts = [...salesData]
    .map(sale => ({ ...sale, total: sale.price * sale.quantity }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 5)

  return {
    totalRevenue,
    totalTransactions,
    totalItems,
    averageTransactionValue: totalRevenue / totalTransactions,
    categoryBreakdown,
    monthlyRevenue,
    topProducts
  }
}
