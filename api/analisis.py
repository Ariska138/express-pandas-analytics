from http.server import BaseHTTPRequestHandler
import json
import pandas as pd
import numpy as np
from urllib.parse import urlparse, parse_qs
from pathlib import Path

data_path = Path(__file__).parent / "data.json"
with open(data_path) as f:
    sales_data = json.load(f)


class NpEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, (np.integer,)):
            return int(obj)
        if isinstance(obj, (np.floating,)):
            return float(obj)
        if isinstance(obj, (np.ndarray,)):
            return obj.tolist()
        return super().default(obj)


def analyze(analysis_type=None):
    df = pd.DataFrame(sales_data)
    df["total"] = df["price"] * df["quantity"]
    df["date"] = pd.to_datetime(df["date"])
    df["month"] = df["date"].dt.strftime("%Y-%m")

    result = {}

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
        result["categoryAnalysis"] = json.loads(json.dumps(cat.to_dict(orient="records"), cls=NpEncoder))

    if analysis_type in (None, "monthly"):
        monthly = (
            df.groupby("month")
            .agg(revenue=("total", "sum"), transactions=("id", "count"), items=("quantity", "sum"))
            .reset_index()
            .sort_values("month")
        )
        monthly["revenue"] = monthly["revenue"].astype(int)
        result["monthlyTrends"] = json.loads(json.dumps(monthly.to_dict(orient="records"), cls=NpEncoder))

    if analysis_type in (None, "products"):
        top = (
            df.groupby("product")
            .agg(totalRevenue=("total", "sum"), totalQuantity=("quantity", "sum"), transactionCount=("id", "count"))
            .reset_index()
            .sort_values("totalRevenue", ascending=False)
            .head(5)
        )
        top["totalRevenue"] = top["totalRevenue"].astype(int)
        result["topProducts"] = json.loads(json.dumps(top.to_dict(orient="records"), cls=NpEncoder))

    if analysis_type in (None, "payment"):
        pay = (
            df.groupby("paymentMethod")
            .agg(count=("id", "count"), revenue=("total", "sum"))
            .reset_index()
        )
        pay["revenue"] = pay["revenue"].astype(int)
        result["paymentMethodAnalysis"] = json.loads(json.dumps(pay.to_dict(orient="records"), cls=NpEncoder))

    if analysis_type in (None, "customers"):
        cust = (
            df.groupby("customer")
            .agg(totalSpent=("total", "sum"), transactionCount=("id", "count"))
            .reset_index()
            .sort_values("totalSpent", ascending=False)
            .head(5)
        )
        cust["totalSpent"] = cust["totalSpent"].astype(int)
        result["topCustomers"] = json.loads(json.dumps(cust.to_dict(orient="records"), cls=NpEncoder))

    if analysis_type in (None, "correlation"):
        corr = df[["quantity", "price", "total"]].corr().round(3)
        result["correlationMatrix"] = json.loads(json.dumps(corr.to_dict(orient="index"), cls=NpEncoder))

    return result


class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        parsed = urlparse(self.path)
        params = parse_qs(parsed.query)
        analysis_type = params.get("type", [None])[0]

        self.send_response(200)
        self.send_header("Content-type", "application/json")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.end_headers()

        try:
            data = analyze(analysis_type)
            response = {"success": True, "data": data}
            self.wfile.write(json.dumps(response, indent=2, cls=NpEncoder).encode("utf-8"))
        except Exception as e:
            self.wfile.write(
                json.dumps({"success": False, "error": str(e)}, indent=2).encode("utf-8")
            )

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()
