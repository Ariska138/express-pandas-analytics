"""
  ============================================================
  PYTHON PANDAS ANALYSIS (analisis.py)
  ============================================================
  File ini adalah Vercel Python Function untuk endpoint /api/analisis.
  Vercel otomatis menjalankan file .py di folder api/ sebagai
  serverless function menggunakan @vercel/python.

  Yang dilakukan:
    1. Baca data penjualan dari api/data.json
    2. Analisis dengan pandas & numpy
    3. Return JSON response

  Endpoint: GET /api/analisis?type=<filter>
  Filter: statistics | category | monthly | products
          | payment | customers | correlation
  ============================================================
"""

import json
import pandas as pd
import numpy as np
from http.server import BaseHTTPRequestHandler
from urllib.parse import urlparse, parse_qs
from pathlib import Path

# -----------------------------------------------------------
# BACA DATA dari file JSON
# Path relatif terhadap lokasi file ini (api/analisis.py)
# -----------------------------------------------------------
data_path = Path(__file__).parent / "data.json"
with open(data_path) as f:
    sales_data = json.load(f)


class NpEncoder(json.JSONEncoder):
    """
    JSON Encoder custom untuk menangani tipe data numpy
    yang tidak bisa di-serialize oleh json.dumps() standar.

    np.integer  -> int
    np.floating -> float
    np.ndarray  -> list
    """
    def default(self, obj):
        if isinstance(obj, (np.integer,)):
            return int(obj)
        if isinstance(obj, (np.floating,)):
            return float(obj)
        if isinstance(obj, (np.ndarray,)):
            return obj.tolist()
        return super().default(obj)


def analyze(analysis_type=None):
    """
    Fungsi utama analisis menggunakan pandas.

    1. Konversi list of dict -> DataFrame
    2. Hitung kolom total (price * quantity)
    3. Parsing date -> datetime + extract month
    4. Filter berdasarkan analysis_type

    Parameter:
      analysis_type: str | None
        - None: return semua analisis
        - 'statistics', 'category', dll: return spesifik

    Return:
      dict dengan key sesuai jenis analisis
    """
    # Buat DataFrame dari data JSON
    df = pd.DataFrame(sales_data)
    df["total"] = df["price"] * df["quantity"]
    df["date"] = pd.to_datetime(df["date"])
    df["month"] = df["date"].dt.strftime("%Y-%m")

    result = {}

    # --- 1. STATISTICS: metrik dasar penjualan ---
    if analysis_type in (None, "statistics"):
        stats = {
            "totalRevenue": int(df["total"].sum()),
            "totalTransactions": len(df),
            "totalItems": int(df["quantity"].sum()),
            "averageTransactionValue": round(float(df["total"].mean()), 2),
            "medianTransactionValue": round(float(df["total"].median()), 2),
            "stdTransactionValue": round(float(df["total"].std()), 2),
            "minTransactionValue": int(df["total"].min()),
            "maxTransactionValue": int(df["total"].max()),
            "priceStats": {
                "meanPrice": round(float(df["price"].mean()), 2),
                "medianPrice": round(float(df["price"].median()), 2),
                "minPrice": int(df["price"].min()),
                "maxPrice": int(df["price"].max()),
            },
        }
        result["statistics"] = stats

    # --- 2. CATEGORY: breakdown per kategori ---
    if analysis_type in (None, "category"):
        cat = (
            df.groupby("category")
            .agg(
                transactionCount=("id", "count"),
                totalRevenue=("total", "sum"),
                totalItems=("quantity", "sum"),
                avgPrice=("price", "mean"),
            )
            .reset_index()
        )
        result["categoryAnalysis"] = json.loads(
            json.dumps(cat.to_dict(orient="records"), cls=NpEncoder)
        )

    # --- 3. MONTHLY: tren penjualan per bulan ---
    if analysis_type in (None, "monthly"):
        monthly = (
            df.groupby("month")
            .agg(
                revenue=("total", "sum"),
                transactions=("id", "count"),
                items=("quantity", "sum"),
            )
            .reset_index()
            .sort_values("month")
        )
        monthly["revenue"] = monthly["revenue"].astype(int)
        result["monthlyTrends"] = json.loads(
            json.dumps(monthly.to_dict(orient="records"), cls=NpEncoder)
        )

    # --- 4. PRODUCTS: top 5 produk by revenue ---
    if analysis_type in (None, "products"):
        top = (
            df.groupby("product")
            .agg(
                totalRevenue=("total", "sum"),
                totalQuantity=("quantity", "sum"),
                transactionCount=("id", "count"),
            )
            .reset_index()
            .sort_values("totalRevenue", ascending=False)
            .head(5)
        )
        top["totalRevenue"] = top["totalRevenue"].astype(int)
        result["topProducts"] = json.loads(
            json.dumps(top.to_dict(orient="records"), cls=NpEncoder)
        )

    # --- 5. PAYMENT: analisis metode pembayaran ---
    if analysis_type in (None, "payment"):
        pay = (
            df.groupby("paymentMethod")
            .agg(count=("id", "count"), revenue=("total", "sum"))
            .reset_index()
        )
        pay["revenue"] = pay["revenue"].astype(int)
        result["paymentMethodAnalysis"] = json.loads(
            json.dumps(pay.to_dict(orient="records"), cls=NpEncoder)
        )

    # --- 6. CUSTOMERS: top 5 pelanggan by total belanja ---
    if analysis_type in (None, "customers"):
        cust = (
            df.groupby("customer")
            .agg(
                totalSpent=("total", "sum"),
                transactionCount=("id", "count"),
            )
            .reset_index()
            .sort_values("totalSpent", ascending=False)
            .head(5)
        )
        cust["totalSpent"] = cust["totalSpent"].astype(int)
        result["topCustomers"] = json.loads(
            json.dumps(cust.to_dict(orient="records"), cls=NpEncoder)
        )

    # --- 7. CORRELATION: matriks korelasi quantity, price, total ---
    if analysis_type in (None, "correlation"):
        corr = df[["quantity", "price", "total"]].corr().round(3)
        result["correlationMatrix"] = json.loads(
            json.dumps(corr.to_dict(orient="index"), cls=NpEncoder)
        )

    return result


class handler(BaseHTTPRequestHandler):
    """
    Handler untuk Vercel Python Function.
    Vercel akan memanggil class ini untuk menangani HTTP request.

    Method:
      do_GET   : menangani request GET
      do_OPTIONS: menangani CORS preflight request
    """

    def do_GET(self):
        """
        Menangani GET /api/analisis
        Baca query parameter `type`, panggil analyze(), return JSON.
        """
        parsed = urlparse(self.path)
        params = parse_qs(parsed.query)
        analysis_type = params.get("type", [None])[0]

        # Set header response
        self.send_response(200)
        self.send_header("Content-type", "application/json")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.end_headers()

        try:
            data = analyze(analysis_type)
            response = {"success": True, "data": data}
            self.wfile.write(
                json.dumps(response, indent=2, cls=NpEncoder).encode("utf-8")
            )
        except Exception as e:
            self.wfile.write(
                json.dumps({"success": False, "error": str(e)}, indent=2).encode("utf-8")
            )

    def do_OPTIONS(self):
        """
        Menangani preflight CORS request (OPTIONS).
        Diperlukan agar frontend bisa fetch dari origin berbeda.
        """
        self.send_response(200)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()
