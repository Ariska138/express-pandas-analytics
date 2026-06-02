import 'dotenv/config'
import express from 'express'
import { salesData, getSalesSummary } from './data/sales.js'

const app = express()

// Middleware
app.use(express.json())
app.use(express.static('public'))

// Routes
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

app.get('/api/data', (_req, res) => {
  res.json({
    success: true,
    data: {
      transactions: salesData,
      summary: getSalesSummary()
    }
  })
})

// Local development
const PORT = process.env.PORT || 3000
if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`)
  })
}

export default app
