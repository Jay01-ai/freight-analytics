# 🚂 SAIL Freight Analytics Dashboard

> A full-stack railway freight analytics platform built during my internship at **Steel Authority of India Ltd (SAIL)**, Summer 2026.

![Python](https://img.shields.io/badge/Python-3.11-blue?style=flat-square&logo=python)
![FastAPI](https://img.shields.io/badge/FastAPI-0.110-green?style=flat-square&logo=fastapi)
![React](https://img.shields.io/badge/React-18-61dafb?style=flat-square&logo=react)
![XGBoost](https://img.shields.io/badge/XGBoost-R²=0.9964-orange?style=flat-square)

---

## 📌 Overview

This project analyses **1,194 outward railway freight shipments** from SAIL's ADRA, ASN, and CKP divisions (April–May 2026). It includes a machine learning pipeline for freight cost prediction, anomaly detection, time-series forecasting, and an interactive React dashboard.

**Dataset:** 3,912 raw records → 1,194 clean records after removing 69% blank rows  
**Total Freight Value:** ₹332 Cr (incl. GST)  
**Date Range:** 07 Apr 2026 – 14 May 2026

---

## 🧠 Machine Learning Models

| Model | R² Score | MAE | Description |
|---|---|---|---|
| **XGBoost** | **0.9964** | **₹68,013** | Gradient boosting — best accuracy |
| Random Forest | 0.9923 | ₹79,636 | Ensemble of 200 decision trees |
| Linear Regression | 0.9785 | ₹2,42,265 | Baseline model |
| Isolation Forest | — | — | Anomaly detection (60 flagged) |
| Prophet | — | — | 30-day freight forecasting |
| KMeans | — | — | Consignor clustering (3 groups) |

**Top feature:** Rate per quintal drives **59%** of prediction importance.

---

## 🔑 Key Findings

- **SAIL** accounts for **71.1%** of total freight value
- **BSCS** is the dominant freight destination hub
- **60 anomalous shipments** detected by Isolation Forest (5% contamination rate)
- XGBoost achieves **99.64% accuracy** with MAE of just ₹68,013
- Rate × Weight product is the strongest predictor of freight cost

---

## 🗂️ Project Structure

```
sailll project/
│
├── main.py                  # FastAPI backend (13 REST endpoints)
├── train_models.py          # ML training script
├── featured_freight.csv     # Cleaned dataset with engineered features
│
├── models/
│   ├── freight_predictor.pkl    # Random Forest model
│   ├── xgb_predictor.pkl        # XGBoost model
│   ├── anomaly_detector.pkl     # Isolation Forest
│   ├── consignor_clusters.pkl   # KMeans
│   ├── encoders.pkl             # Label encoders
│   ├── metadata.pkl             # Training metadata
│   └── forecast.csv             # Prophet forecast output
│
├── freight-frontend/        # React dashboard
│   └── src/
│       └── App.js           # Main dashboard component
│
├── 03_Visualization.ipynb   # EDA charts
├── 04_eng.ipynb             # Feature engineering
├── 05_ML_Models.ipynb       # Model training notebook
│
└── .env                     # API keys (not committed)
```

---

## 🚀 Running the Project

### Prerequisites
```bash
pip install fastapi uvicorn pandas numpy scikit-learn xgboost prophet joblib groq python-dotenv
```

### 1. Set up environment variables
Create a `.env` file in the project root:
```
GROQ_API_KEY=your_groq_api_key_here
```

### 2. Train the models (first time only)
```bash
cd "sailll project"
python train_models.py
```

### 3. Start the FastAPI backend
```bash
cd "sailll project"
uvicorn main:app --reload
```
Backend runs at `http://127.0.0.1:8000`

### 4. Start the React frontend
```bash
cd freight-frontend
npm install
npm start
```
Dashboard opens at `http://localhost:3000`

---

## 🖥️ Dashboard Features

| Tab | Description |
|---|---|
| **Overview** | Total freight, GST, shipment stats, data pipeline summary |
| **Consignors** | Per-consignor breakdown with freight and GST analysis |
| **Routes** | Top 10 routes by freight value |
| **Forecast** | Prophet 30-day freight forecast with confidence intervals |
| **Anomalies** | 60 suspicious shipments flagged by Isolation Forest |
| **Predict** | Real-time freight cost prediction with XGBoost/RF selector |
| **Assistant** | NLP-powered data query assistant |
| **About** | Project summary and methodology |

**Additional features:** 5 color themes · Dark/Light mode · Collapsible sidebar · Input validation with training-range warnings · Live formula vs ML comparison · Prediction history

---

## 📡 API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| GET | `/stats` | Summary statistics |
| GET | `/consignors` | Per-consignor aggregates |
| GET | `/routes` | Top routes by freight |
| GET | `/forecast` | Prophet forecast data |
| GET | `/anomalies` | Flagged anomalous shipments |
| POST | `/predict` | ML freight cost prediction |
| GET | `/model-comparison` | Model performance metrics |
| POST | `/ai/chat` | NLP data query |
| GET | `/ai/insight/{topic}` | Auto-generated insights |
| POST | `/ai/explain-prediction` | Prediction explanation |
| GET | `/options` | Dropdown options |
| GET | `/feature-stats` | Training data ranges |
| GET | `/model-comparison` | Model benchmarks |

---

## 🛠️ Tech Stack

**Backend:** Python · FastAPI · Uvicorn · Scikit-learn · XGBoost · Prophet · Pandas · NumPy · Joblib  
**Frontend:** React 18 · Recharts · Axios  
**ML:** XGBoost · Random Forest · Isolation Forest · KMeans · Prophet  
**NLP:** Custom query engine via REST API

---

## 👤 Author

**Jay Taleja**  
Summer Intern — Steel Authority of India Ltd (SAIL)  
2026

---

> *Built to turn messy railway freight CSVs into actionable operational insights.*
