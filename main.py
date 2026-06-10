from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import pandas as pd
import numpy as np
import joblib
import os
from groq import Groq

app = FastAPI(title="Freight Analytics API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Load all saved models ──────────────────────────────
rf        = joblib.load("models/freight_predictor.pkl")
xgb_model = joblib.load("models/xgb_predictor.pkl")
iso       = joblib.load("models/anomaly_detector.pkl")
encoders  = joblib.load("models/encoders.pkl")
forecast  = pd.read_csv("models/forecast.csv")
df        = pd.read_csv("featured_freight.csv")
df["RR DATE"] = pd.to_datetime(df["RR DATE"])

# ── Configure Groq AI ──────────────────────────────────
client = Groq(api_key=os.getenv("GROQ_API_KEY"))

# ── XGBoost expects these 13 features in this exact order ─
XGB_FEATURES = [
    "CHRG WGHT", "ACTL WGHT", "RATE(Q)",
    "BASIC_FREIGHT_CALC", "GST_AMT_CALC", "WEIGHT_RATIO",
    "CNSR_ENC", "ROUTE_ENC", "DVSN_ENC",
    "HAS_DEMURRAGE", "OTHR CHRG AMNT", "DAY_OF_WEEK", "MONTH"
]

# ── Random Forest expects these 9 features ─────────────
RF_FEATURES = [
    "CHRG WGHT", "ACTL WGHT", "RATE(Q)",
    "CNSR_ENC", "ROUTE_ENC", "DVSN_ENC",
    "HAS_DEMURRAGE", "OTHR CHRG AMNT", "DAY_OF_WEEK"
]

def ask_ai(prompt: str) -> str:
    response = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[{"role": "user", "content": prompt}],
        max_tokens=300,
    )
    return response.choices[0].message.content

def get_data_context() -> str:
    top_consignors = df.groupby("CNSR")["TOTL FRGT(INCLUDE GST)"].sum().sort_values(ascending=False).head(5)
    top_routes     = df.groupby("ROUTE")["TOTL FRGT(INCLUDE GST)"].sum().sort_values(ascending=False).head(5)
    sail_pct       = (top_consignors.iloc[0] / top_consignors.sum() * 100)
    return f"""
    You are an AI assistant for a Railway Freight Analytics dashboard
    built with Python, FastAPI, XGBoost & Random Forest ML, and React.

    Dataset summary:
    - Total shipments: {len(df)}
    - Total freight: Rs{df['TOTL FRGT(INCLUDE GST)'].sum():,.0f}
    - Total GST: Rs{df['TOTL GST'].sum():,.0f}
    - Unique consignors: {df['CNSR'].nunique()}
    - Unique routes: {df['ROUTE'].nunique()}
    - Date range: {df['RR DATE'].min().date()} to {df['RR DATE'].max().date()}
    - Avg freight per shipment: Rs{df['TOTL FRGT(INCLUDE GST)'].mean():,.0f}
    - Avg charged weight: {df['CHRG WGHT'].mean():,.1f} tonnes
    - SAIL dominates with {sail_pct:.1f}% of total freight
    - Anomalies detected: {int(df['IS_ANOMALY'].sum()) if 'IS_ANOMALY' in df.columns else 0}
    - Best ML Model: XGBoost R2=0.9964, MAE=Rs75,195
    - Random Forest: R2=0.9923, MAE=Rs90,154

    Top consignors: {top_consignors.to_dict()}
    Top routes: {top_routes.to_dict()}

    Be concise, use Rs for currency, explain ML simply when asked.
    """

# ── Route 1: Health check ──────────────────────────────
@app.get("/")
def home():
    return {"message": "Freight Analytics API is running!"}

# ── Route 2: Summary stats ─────────────────────────────
@app.get("/stats")
def get_stats():
    return {
        "total_shipments"   : int(len(df)),
        "total_freight"     : float(df["TOTL FRGT(INCLUDE GST)"].sum()),
        "total_gst"         : float(df["TOTL GST"].sum()),
        "total_tds"         : float(df["TOTL TDS"].sum()),
        "unique_consignors" : int(df["CNSR"].nunique()),
        "unique_routes"     : int(df["ROUTE"].nunique()),
        "avg_freight"       : float(df["TOTL FRGT(INCLUDE GST)"].mean()),
        "avg_weight"        : float(df["CHRG WGHT"].mean()),
        "anomalies_found"   : int(df["IS_ANOMALY"].sum()) if "IS_ANOMALY" in df.columns else 0,
        "date_from"         : str(df["RR DATE"].min().date()),
        "date_to"           : str(df["RR DATE"].max().date()),
    }

# ── Route 3: Predict freight cost ─────────────────────
@app.post("/predict")
def predict_freight(data: dict):
    try:
        def safe_encode(le, val):
            val = str(val).strip()
            if val in le.classes_:
                return int(le.transform([val])[0])
            for c in le.classes_:
                if val.upper() == c.upper():
                    return int(le.transform([c])[0])
            return 0

        chrg_wght      = float(data.get("chrg_wght", 3336))
        actl_wght      = float(data.get("actl_wght", chrg_wght))
        rate           = float(data.get("rate", 648))
        othr_chrg_amnt = float(data.get("other_charges", 0))
        has_demurrage  = int(data.get("has_demurrage", 0))
        day_of_week    = int(data.get("day_of_week", 0))
        month          = int(data.get("month", 4))
        model_choice   = data.get("model", "xgb")

        cnsr_enc  = safe_encode(encoders["cnsr"],  data.get("consignor", "SAIL"))
        route_enc = safe_encode(encoders["route"], data.get("route", ""))
        dvsn_enc  = safe_encode(encoders["dvsn"],  data.get("division", "ADRA"))

        # Derived features required by XGBoost
        basic_freight_calc = chrg_wght * 10 * rate
        gst_amt_calc       = basic_freight_calc * 0.05
        weight_ratio       = chrg_wght / actl_wght if actl_wght > 0 else 1.0

        # Build feature DataFrames with correct column names
        xgb_df = pd.DataFrame([[
            chrg_wght, actl_wght, rate,
            basic_freight_calc, gst_amt_calc, weight_ratio,
            cnsr_enc, route_enc, dvsn_enc,
            has_demurrage, othr_chrg_amnt, day_of_week, month,
        ]], columns=XGB_FEATURES)

        rf_df = pd.DataFrame([[
            chrg_wght, actl_wght, rate,
            cnsr_enc, route_enc, dvsn_enc,
            has_demurrage, othr_chrg_amnt, day_of_week,
        ]], columns=RF_FEATURES)

        # Run selected model
        if model_choice == "rf":
            prediction = float(rf.predict(rf_df)[0])
            other_pred = float(xgb_model.predict(xgb_df)[0])
            other_name = "XGBoost"
            model_name = "Random Forest"
            model_r2   = "0.9923"
            model_mae  = "Rs90,154"
        else:
            prediction = float(xgb_model.predict(xgb_df)[0])
            other_pred = float(rf.predict(rf_df)[0])
            other_name = "Random Forest"
            model_name = "XGBoost"
            model_r2   = "0.9964"
            model_mae  = "Rs75,195"

        # Correct manual cross-check formula
        basic_est  = (chrg_wght * rate) / 100
        gst_est    = basic_est * 0.05
        manual_est = basic_est + gst_est + othr_chrg_amnt

        return {
            "predicted_freight" : round(prediction, 2),
            "other_prediction"  : round(other_pred, 2),
            "other_model_name"  : other_name,
            "manual_estimate"   : round(manual_est, 2),
            "basic_freight_est" : round(basic_est, 2),
            "gst_estimate"      : round(gst_est, 2),
            "model_used"        : f"{model_name} (R2={model_r2}, MAE={model_mae})",
            "model_name"        : model_name,
            "model_r2"          : model_r2,
            "model_mae"         : model_mae,
            "message"           : f"{model_name} Prediction: Rs{round(prediction):,}",
        }
    except Exception as e:
        print(f"PREDICT ERROR: {str(e)}")
        return {"error": str(e)}

# ── Route 4: Forecast ──────────────────────────────────
@app.get("/forecast")
def get_forecast(days: int = 30):
    df_fc = forecast[["ds", "yhat", "yhat_lower", "yhat_upper"]].tail(days)
    return df_fc.to_dict(orient="records")

# ── Route 5: Anomalies ─────────────────────────────────
@app.get("/anomalies")
def get_anomalies():
    if "IS_ANOMALY" not in df.columns:
        return {"error": "Run anomaly detection first"}
    anomalies = df[df["IS_ANOMALY"] == 1][
        ["CNSR", "ROUTE", "RR DATE", "CHRG WGHT",
         "FREIGHT_PER_TONNE", "WEIGHT_DIFF_PCT", "ANOMALY_SCORE"]
    ].sort_values("ANOMALY_SCORE", ascending=False)
    result = anomalies.head(20).copy()
    result["RR DATE"] = result["RR DATE"].astype(str)
    return result.to_dict(orient="records")

# ── Route 6: Consignors ────────────────────────────────
@app.get("/consignors")
def get_consignors():
    summary = df.groupby("CNSR").agg(
        total_freight = ("TOTL FRGT(INCLUDE GST)", "sum"),
        avg_freight   = ("TOTL FRGT(INCLUDE GST)", "mean"),
        shipments     = ("RR NO.", "count"),
        avg_weight    = ("CHRG WGHT", "mean"),
        total_gst     = ("TOTL GST", "sum"),
    ).reset_index()
    return summary.to_dict(orient="records")

# ── Route 7: Routes ────────────────────────────────────
@app.get("/routes")
def get_routes():
    routes = df.groupby("ROUTE").agg(
        total_freight = ("TOTL FRGT(INCLUDE GST)", "sum"),
        shipments     = ("RR NO.", "count"),
        avg_freight   = ("TOTL FRGT(INCLUDE GST)", "mean"),
    ).reset_index().sort_values("total_freight", ascending=False)
    return routes.head(20).to_dict(orient="records")

# ── Route 8: AI Chatbox ────────────────────────────────
@app.post("/ai/chat")
async def ai_chat(body: dict):
    try:
        question = body.get("question", "")
        prompt   = get_data_context() + f"\n\nUser question: {question}\nAnswer in 3-4 sentences max."
        answer   = ask_ai(prompt)
        return {"answer": answer}
    except Exception as e:
        return {"answer": f"AI error: {str(e)}"}

# ── Route 9: AI insight for charts ────────────────────
@app.get("/ai/insight/{topic}")
async def ai_insight(topic: str):
    try:
        top_consignors = df.groupby("CNSR")["TOTL FRGT(INCLUDE GST)"].sum().sort_values(ascending=False)
        top_routes     = df.groupby("ROUTE")["TOTL FRGT(INCLUDE GST)"].sum().sort_values(ascending=False).head(5)
        sail_pct       = (top_consignors.iloc[0] / top_consignors.sum() * 100)

        prompts = {
            "consignors": f"Railway freight data: SAIL has {sail_pct:.1f}% of total freight. Top consignors: {top_consignors.head(5).to_dict()}. Give 2-3 key business insights in 3 sentences.",
            "routes"    : f"Top railway freight routes: {top_routes.to_dict()}. Give 2-3 insights about route patterns in 3 sentences.",
            "forecast"  : f"Railway freight data from {df['RR DATE'].min().date()} to {df['RR DATE'].max().date()}, total Rs{df['TOTL FRGT(INCLUDE GST)'].sum():,.0f}. Give a 2-sentence business outlook.",
            "anomalies" : f"Isolation Forest ML detected {int(df['IS_ANOMALY'].sum()) if 'IS_ANOMALY' in df.columns else 0} anomalies out of {len(df)} shipments. Explain what this means for railway operations in 2 sentences.",
            "overview"  : f"Railway dashboard: {len(df)} shipments worth Rs{df['TOTL FRGT(INCLUDE GST)'].sum():,.0f}, {df['CNSR'].nunique()} consignors, SAIL dominates at {sail_pct:.1f}%. Give 2 executive insights.",
        }

        prompt  = prompts.get(topic, "Give a 2-sentence insight about railway freight analytics.")
        insight = ask_ai(prompt)
        return {"insight": insight, "topic": topic}
    except Exception as e:
        return {"insight": f"AI error: {str(e)}", "topic": topic}

# ── Route 10: AI explain ML prediction ────────────────
@app.post("/ai/explain-prediction")
async def explain_prediction(body: dict):
    try:
        predicted     = body.get("predicted_freight", 0)
        weight        = body.get("chrg_wght", 0)
        rate          = body.get("rate", 0)
        consignor     = body.get("consignor", "")
        route         = body.get("route", "")
        other_charges = body.get("other_charges", 0)
        model_choice  = body.get("model", "xgb")
        model_name    = "XGBoost" if model_choice == "xgb" else "Random Forest"
        avg_freight   = float(df["TOTL FRGT(INCLUDE GST)"].mean())
        avg_weight    = float(df["CHRG WGHT"].mean())
        diff_pct      = ((predicted - avg_freight) / avg_freight * 100)

        prompt = f"""
        A {model_name} ML model predicted freight cost of Rs{predicted:,.0f} for:
        - Consignor: {consignor}
        - Route: {route}
        - Charged Weight: {weight} tonnes (dataset avg: {avg_weight:.0f} tonnes)
        - Rate per quintal: Rs{rate} (valid range: Rs185 to Rs2,718)
        - Other charges: Rs{other_charges:,.0f}
        - This is {abs(diff_pct):.1f}% {'above' if diff_pct > 0 else 'below'} dataset average (Rs{avg_freight:,.0f})
        - Top model features: Rate per quintal (73%), Charged Weight (25%), others (2%)

        Explain in 4 simple sentences:
        1. What drives this prediction
        2. How it compares to the dataset average
        3. Whether this seems normal or unusual
        4. One practical tip for this shipment
        Use Rs for currency. Keep it simple.
        """
        explanation = ask_ai(prompt)
        return {"explanation": explanation}
    except Exception as e:
        return {"explanation": f"AI error: {str(e)}"}

# ── Route 11: Get dropdown options ────────────────────
@app.get("/options")
def get_options():
    return {
        "consignors": sorted(df["CNSR"].dropna().unique().tolist()),
        "divisions":  sorted(df["DVSN"].dropna().unique().tolist()),
        "routes":     sorted(df["ROUTE"].dropna().unique().tolist()),
    }

# ── Route 12: Model comparison ────────────────────────
@app.get("/model-comparison")
def model_comparison():
    return {
        "models": [
            { "name": "Linear Regression", "r2": 0.9461, "mae": 361707, "description": "Simple baseline model" },
            { "name": "Random Forest",     "r2": 0.9923, "mae": 90154,  "description": "Ensemble of 100 decision trees" },
            { "name": "XGBoost",           "r2": 0.9964, "mae": 75195,  "description": "Gradient boosting — best accuracy" },
        ]
    }

# ── Route 13: Feature stats ────────────────────────────
@app.get("/feature-stats")
def feature_stats():
    return {
        "chrg_wght"     : { "mean": round(float(df["CHRG WGHT"].mean())),      "min": round(float(df["CHRG WGHT"].min())),      "max": round(float(df["CHRG WGHT"].max()))      },
        "rate"          : { "mean": round(float(df["RATE(Q)"].mean())),         "min": round(float(df["RATE(Q)"].min())),         "max": round(float(df["RATE(Q)"].max()))         },
        "other_charges" : { "mean": round(float(df["OTHR CHRG AMNT"].mean())),  "min": 0, "max": round(float(df["OTHR CHRG AMNT"].max())) },
    }