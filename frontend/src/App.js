import { useState, useEffect, useRef } from "react";
import axios from "axios";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, AreaChart, Area, Legend,
} from "recharts";

const API = "http://127.0.0.1:8000";

const THEMES = {
  forest:  { accent: "#4ade80", dark: "#14532d", mid: "#166534", glow: "rgba(74,222,128,0.15)"  },
  ocean:   { accent: "#38bdf8", dark: "#0c4a6e", mid: "#0369a1", glow: "rgba(56,189,248,0.15)"  },
  saffron: { accent: "#fb923c", dark: "#7c2d12", mid: "#9a3412", glow: "rgba(251,146,60,0.15)"  },
  royal:   { accent: "#e9b84a", dark: "#713f12", mid: "#92400e", glow: "rgba(233,184,74,0.15)"  },
  mono:    { accent: "#cbd5e1", dark: "#1e293b", mid: "#334155", glow: "rgba(203,213,225,0.1)"  },
};

const DARK  = { bg: "#0c0c14", surface: "#12121f", card: "#16162a", border: "#1e1e35", text: "#e8eaf0", sub: "#5a6070", mid: "#8892a4", input: "#1a1a2e" };
const LIGHT = { bg: "#f0f2f8", surface: "#ffffff",  card: "#ffffff",  border: "#dde1ea", text: "#111827", sub: "#6b7280", mid: "#374151", input: "#f9fafb" };

const BARS = ["#4ade80","#38bdf8","#fb923c","#c084fc","#e9b84a","#f472b6","#34d399","#818cf8","#94a3b8","#f87171"];

const CONSIGNORS = ["BCCL","BCPL","BSLC","CCL","ECF","GUSH","JKKS","MLDM","MWF","NMD","ORMT","RINL","RSMM","SAIL","SBTC","SSP"];
const DIVISIONS  = ["ADRA","ASN","CKP"];
const ROUTES = [
  "BLSG → BSCS","BLSG → DSEY","BRMS → BSCS","BRMS → DSEY","BRMS → IISD",
  "BSCS → DSEY","BSPC → DSEY","BUA → BSCS","BWSB → BSCS","BWSB → DSEY",
  "BYFS → BSCS","BYFS → DSEY","BYFS → IISD","CBSP → BSCS","CCSP → BSCS",
  "CCSP → DSEY","CHRI → BSCS","DLO → BSCS","DLO → DSEY","DLO → IISD",
  "DPCB → BSCS","DPCB → DSEY","DPCB → IISD","DSEY → BSCS","FOS → BSCS",
  "FOS → NHSB","GUA → IISD","HDCB → BSCS","HDCB → DSEY","HDCB → IISD",
  "HDCG → BSCS","HDCG → DSEY","HLSR → BSCS","HLSR → NHSB","HSLD → BSCS",
  "HSLH → BSCS","HSLH → IISD","HSPG → BSCS","HSPG → DSEY","ISCG → BSCS",
  "ISCG → DSEY","ISCG → IISD","JDWS → BSCS","JDWS → DSEY","JDWS → IISD",
  "KLOD → IISD","KTWY → BSCS","KTWY → DSEY","MBWK → BSCS","MBWK → DSEY",
  "MGPV → BSCS","MOMG → BSCS","MOMG → IISD","MWSD → BSCS","MWSD → DSEY",
  "NMDM → BSCS","NMDM → DSEY","NNV → DSEY","PBSB → BSCS","PBSB → NHSB",
  "PMRN → BSCS","PMRN → IISD","PNWP → BSCS","PNWP → DSEY","PSBD → BSCS",
  "RWGR → BSCS","SCOB → BSCS","SCOB → DSEY","SCSC → BSCS","SCSC → DSEY",
  "SCW → BSCS","SCW → DSEY","SOBK → BSCS","SOBK → NHSB","SONU → BSCS",
  "SONU → DSEY","SONU → IISD","SSMK → BSCS","SSMK → NHSB","SSPL → BSCS",
  "SWKT → DSEY","VSPS → IISD"
];

function fmt(n) {
  if (!n || isNaN(n)) return "₹0";
  if (n >= 1e7) return "₹" + (n / 1e7).toFixed(2) + " Cr";
  if (n >= 1e5) return "₹" + (n / 1e5).toFixed(1) + " L";
  return "₹" + Math.round(n).toLocaleString("en-IN");
}

function Tip({ active, payload, label, C }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, padding: "9px 13px", fontSize: 12 }}>
      {label && <p style={{ margin: "0 0 5px", color: C.sub }}>{label}</p>}
      {payload.map((p, i) => (
        <p key={i} style={{ margin: "2px 0", color: p.color, fontWeight: 600 }}>
          {p.name}: {p.value > 10000 ? fmt(p.value) : p.value}
        </p>
      ))}
    </div>
  );
}

function Insight({ topic, C, T }) {
  const [text, setText] = useState("");
  const [open, setOpen] = useState(true);
  const [done, setDone] = useState(false);

  useEffect(() => {
    axios.get(`${API}/ai/insight/${topic}`)
      .then(r => { setText(r.data.insight); setDone(true); })
      .catch(() => { setText("Could not load AI analysis."); setDone(true); });
  }, [topic]);

  return (
    <div style={{ marginTop: 14, borderRadius: 10, overflow: "hidden", border: `1px solid ${T.accent}28` }}>
      <button onClick={() => setOpen(o => !o)} style={{
        width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center",
        padding: "9px 14px", background: T.dark + "30", border: "none", cursor: "pointer",
      }}>
        <span style={{ fontSize: 12, color: T.accent, fontWeight: 600 }}>⚡ AI ANALYSIS</span>
        <span style={{ color: T.accent, fontSize: 11 }}>{open ? "▲" : "▼"}</span>
      </button>
      {open && (
        <div style={{ padding: "11px 14px", background: T.dark + "18" }}>
          <p style={{ margin: 0, fontSize: 13, color: done ? C.mid : C.sub, lineHeight: 1.75 }}>
            {done ? text : "Analyzing data..."}
          </p>
        </div>
      )}
    </div>
  );
}

function Chat({ C, T }) {
  const [msgs, setMsgs] = useState([{
    role: "ai",
    text: "Hey Jay! I have full access to your SAIL freight data — 1,194 shipments, ₹332 Cr total. What do you want to know?"
  }]);
  const [input, setInput] = useState("");
  const [busy, setBusy]   = useState(false);
  const end = useRef(null);

  useEffect(() => { end.current?.scrollIntoView({ behavior: "smooth" }); }, [msgs]);

  const send = async (q) => {
    const question = q ?? input;
    if (!question.trim()) return;
    setInput("");
    setMsgs(m => [...m, { role: "user", text: question }]);
    setBusy(true);
    try {
      const r = await axios.post(`${API}/ai/chat`, { question });
      setMsgs(m => [...m, { role: "ai", text: r.data.answer }]);
    } catch {
      setMsgs(m => [...m, { role: "ai", text: "Connection issue — check that the API is running." }]);
    }
    setBusy(false);
  };

  const chips = [
    "Which consignor pays most GST?",
    "Explain how Random Forest works",
    "Which route generates most revenue?",
    "What does R² = 0.9885 mean?",
    "How were anomalies detected?",
  ];

  return (
    <div style={{ display: "flex", gap: 20, height: 560 }}>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", background: C.card, borderRadius: 12, border: `1px solid ${C.border}`, overflow: "hidden" }}>
        <div style={{ padding: "12px 16px", borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: T.accent, boxShadow: `0 0 6px ${T.accent}` }} />
          <span style={{ fontSize: 13, fontWeight: 600, color: C.text }}>Freight Assistant</span>
          <span style={{ fontSize: 11, color: C.sub, marginLeft: "auto" }}>Llama 3.3 · live</span>
        </div>
        <div style={{ flex: 1, overflowY: "auto", padding: "16px", display: "flex", flexDirection: "column", gap: 10 }}>
          {msgs.map((m, i) => (
            <div key={i} style={{ display: "flex", justifyContent: m.role === "user" ? "flex-end" : "flex-start", gap: 8, alignItems: "flex-end" }}>
              {m.role === "ai" && (
                <div style={{ width: 26, height: 26, borderRadius: "50%", background: T.dark, border: `1px solid ${T.accent}60`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, flexShrink: 0 }}>🤖</div>
              )}
              <div style={{
                maxWidth: "78%", padding: "9px 13px", borderRadius: 12, fontSize: 13, lineHeight: 1.65,
                background: m.role === "user" ? T.mid : C.input,
                color: m.role === "user" ? "#fff" : C.text,
                borderBottomRightRadius: m.role === "user" ? 3 : 12,
                borderBottomLeftRadius: m.role === "ai" ? 3 : 12,
                border: m.role === "ai" ? `1px solid ${C.border}` : "none",
              }}>{m.text}</div>
              {m.role === "user" && (
                <div style={{ width: 26, height: 26, borderRadius: "50%", background: T.mid, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: "#fff", flexShrink: 0 }}>J</div>
              )}
            </div>
          ))}
          {busy && (
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ width: 26, height: 26, borderRadius: "50%", background: T.dark, border: `1px solid ${T.accent}60`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12 }}>🤖</div>
              <div style={{ background: C.input, border: `1px solid ${C.border}`, borderRadius: 12, padding: "9px 14px", fontSize: 13, color: C.sub }}>thinking...</div>
            </div>
          )}
          <div ref={end} />
        </div>
        <div style={{ padding: "10px 12px", borderTop: `1px solid ${C.border}`, display: "flex", gap: 8 }}>
          <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === "Enter" && send()}
            placeholder="Ask anything about freight data or ML..."
            style={{ flex: 1, padding: "9px 13px", background: C.input, border: `1px solid ${C.border}`, borderRadius: 8, color: C.text, fontSize: 13, outline: "none" }}
          />
          <button onClick={() => send()} style={{ padding: "9px 18px", background: T.mid, border: "none", borderRadius: 8, color: "#fff", fontWeight: 600, cursor: "pointer", fontSize: 13 }}>↑</button>
        </div>
      </div>
      <div style={{ width: 200, display: "flex", flexDirection: "column", gap: 8 }}>
        <p style={{ margin: "0 0 4px", fontSize: 11, color: C.sub, textTransform: "uppercase", letterSpacing: "0.06em" }}>Quick Questions</p>
        {chips.map((c, i) => (
          <button key={i} onClick={() => send(c)} style={{
            padding: "10px 12px", background: C.card, border: `1px solid ${C.border}`,
            borderRadius: 8, color: C.mid, fontSize: 12, cursor: "pointer", textAlign: "left", lineHeight: 1.4,
          }}
            onMouseOver={e => { e.currentTarget.style.borderColor = T.accent; e.currentTarget.style.color = T.accent; }}
            onMouseOut={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.color = C.mid; }}
          >{c}</button>
        ))}
        <div style={{ marginTop: "auto", padding: "12px", background: C.card, border: `1px solid ${C.border}`, borderRadius: 8 }}>
          <p style={{ margin: "0 0 4px", fontSize: 11, color: C.sub }}>Model</p>
          <p style={{ margin: 0, fontSize: 12, color: T.accent, fontWeight: 600 }}>Llama 3.3 70B</p>
          <p style={{ margin: "6px 0 0", fontSize: 11, color: C.sub }}>via Groq API</p>
        </div>
      </div>
    </div>
  );
}

const TABS = [
  { id: "overview",   icon: "◈",  label: "Overview"   },
  { id: "consignors", icon: "⊞",  label: "Consignors" },
  { id: "routes",     icon: "⟶",  label: "Routes"     },
  { id: "forecast",   icon: "↗",  label: "Forecast"   },
  { id: "anomalies",  icon: "⚠",  label: "Anomalies"  },
  { id: "predict",    icon: "◎",  label: "Predict"    },
  { id: "chat",       icon: "◇",  label: "AI Chat"    },
  { id: "about",      icon: "∷",  label: "About"      },
];

const selectStyle = (C) => ({
  width: "100%", padding: "9px 12px",
  background: C.input, border: `1px solid ${C.border}`,
  borderRadius: 7, color: C.text, fontSize: 13,
  boxSizing: "border-box", outline: "none",
  fontFamily: "inherit", cursor: "pointer",
});

// Training data ranges for input validation
const TRAIN_RANGES = {
  chrg_wght:     { min: 63,   max: 4692,    label: "Charged Weight" },
  rate:          { min: 185,  max: 2718,    label: "Rate per Quintal" },
  other_charges: { min: 0,    max: 1097125, label: "Other Charges" },
};

function getWarnings(form) {
  const warnings = [];
  if (form.chrg_wght < TRAIN_RANGES.chrg_wght.min || form.chrg_wght > TRAIN_RANGES.chrg_wght.max)
    warnings.push(`Charged Weight ${form.chrg_wght}T is outside training range (${TRAIN_RANGES.chrg_wght.min}–${TRAIN_RANGES.chrg_wght.max}T)`);
  if (form.rate < TRAIN_RANGES.rate.min || form.rate > TRAIN_RANGES.rate.max)
    warnings.push(`Rate ₹${form.rate} is outside training range (₹${TRAIN_RANGES.rate.min}–₹${TRAIN_RANGES.rate.max})`);
  if (form.other_charges > TRAIN_RANGES.other_charges.max)
    warnings.push(`Other Charges ₹${form.other_charges.toLocaleString()} exceeds training max (₹${TRAIN_RANGES.other_charges.max.toLocaleString()})`);
  return warnings;
}

function manualCalc(form) {
  const basic   = form.chrg_wght * 10 * form.rate;
  const gst     = basic * 0.05;
  const demurr  = form.has_demurrage ? form.chrg_wght * 50 : 0;
  const total   = basic + gst + Number(form.other_charges) + demurr;
  return { basic, gst, demurr, total };
}

export default function App() {
  const [stats, setStats]           = useState(null);
  const [consignors, setConsignors] = useState([]);
  const [routes, setRoutes]         = useState([]);
  const [forecast, setForecast]     = useState([]);
  const [anomalies, setAnomalies]   = useState([]);
  const [tab, setTab]               = useState("overview");
  const [loading, setLoading]       = useState(true);
  const [dark, setDark]             = useState(true);
  const [theme, setTheme]           = useState("forest");
  const [collapsed, setCollapsed]   = useState(false);

  // CHANGE 1: added model: "xgb" to form state
  const [form, setForm] = useState({
    chrg_wght: 3336,
    actl_wght: 3336,
    rate: 648,
    consignor: "SAIL",
    division: "ADRA",
    route: "BLSG → BSCS",
    other_charges: 0,
    day_of_week: 0,
    has_demurrage: 0,
    model: "xgb",
  });
  const [prediction, setPrediction]   = useState(null);
  const [explanation, setExplanation] = useState("");
  const [predBusy, setPredBusy]       = useState(false);

  const C = dark ? DARK : LIGHT;
  const T = THEMES[theme];
  const TipC = (props) => <Tip {...props} C={C} />;

  useEffect(() => {
    Promise.all([
      axios.get(`${API}/stats`),
      axios.get(`${API}/consignors`),
      axios.get(`${API}/routes`),
      axios.get(`${API}/forecast?days=30`),
      axios.get(`${API}/anomalies`),
    ]).then(([s, c, r, f, a]) => {
      setStats(s.data);
      setConsignors(c.data.sort((x, y) => y.total_freight - x.total_freight).slice(0, 10));
      setRoutes(r.data.slice(0, 10));
      setForecast(f.data.map(d => ({ ...d, ds: d.ds.slice(5), yhat: Math.round(d.yhat), yhat_upper: Math.round(d.yhat_upper), yhat_lower: Math.round(d.yhat_lower) })));
      setAnomalies(Array.isArray(a.data) ? a.data : []);
      setLoading(false);
    });
  }, []);

  const predict = async () => {
    setPredBusy(true); setPrediction(null); setExplanation("");
    try {
      // CHANGE 3: pass model field explicitly
      const r = await axios.post(`${API}/predict`, {
        ...form,
        model: form.model,
      });
      setPrediction(r.data);
      const e = await axios.post(`${API}/ai/explain-prediction`, {
        ...form, predicted_freight: r.data.predicted_freight
      });
      setExplanation(e.data.explanation);
    } catch (err) {
      console.error(err);
    }
    setPredBusy(false);
  };

  if (loading) return (
    <div style={{ minHeight: "100vh", background: DARK.bg, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 12 }}>
      <div style={{ fontSize: 40 }}>🚂</div>
      <p style={{ color: "#e8eaf0", fontSize: 16, fontWeight: 600, margin: 0 }}>Loading freight data...</p>
      <p style={{ color: "#5a6070", fontSize: 13, margin: 0 }}>Connecting to FastAPI backend</p>
    </div>
  );

  const sw = collapsed ? 56 : 200;

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: C.bg, color: C.text, fontFamily: "'DM Sans','Segoe UI',sans-serif", transition: "background 0.25s" }}>

      {/* SIDEBAR */}
      <div style={{ width: sw, background: C.surface, borderRight: `1px solid ${C.border}`, display: "flex", flexDirection: "column", flexShrink: 0, transition: "width 0.25s", overflow: "hidden" }}>
        <div style={{ padding: "16px 12px", borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "center", gap: 10, minHeight: 58 }}>
          <span style={{ fontSize: 20, flexShrink: 0 }}>🚂</span>
          {!collapsed && <div>
            <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: C.text }}>FreightAI</p>
            <p style={{ margin: 0, fontSize: 10, color: T.accent }}>SAIL · 2026</p>
          </div>}
        </div>
        <nav style={{ flex: 1, padding: "8px 6px" }}>
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} title={t.label} style={{
              width: "100%", display: "flex", alignItems: "center", gap: 10,
              justifyContent: collapsed ? "center" : "flex-start",
              padding: collapsed ? "11px 0" : "9px 10px",
              borderRadius: 7, border: "none", cursor: "pointer", marginBottom: 1,
              background: tab === t.id ? T.glow : "transparent",
              color: tab === t.id ? T.accent : C.sub,
              fontSize: 13, fontWeight: tab === t.id ? 600 : 400,
              borderLeft: tab === t.id ? `3px solid ${T.accent}` : "3px solid transparent",
              transition: "all 0.15s",
            }}>
              <span style={{ fontSize: 15, fontFamily: "monospace", flexShrink: 0 }}>{t.icon}</span>
              {!collapsed && <span style={{ whiteSpace: "nowrap", fontSize: 13 }}>{t.label}</span>}
            </button>
          ))}
        </nav>
        <button onClick={() => setCollapsed(p => !p)} style={{
          margin: "8px 6px", padding: "7px", background: C.card,
          border: `1px solid ${C.border}`, borderRadius: 7,
          color: C.sub, cursor: "pointer", fontSize: 12,
        }}>{collapsed ? "▶" : "◀ Collapse"}</button>
      </div>

      {/* MAIN */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>

        {/* Topbar */}
        <div style={{ height: 56, padding: "0 24px", display: "flex", alignItems: "center", justifyContent: "space-between", background: C.surface, borderBottom: `1px solid ${C.border}`, position: "sticky", top: 0, zIndex: 10 }}>
          <div>
            <span style={{ fontSize: 15, fontWeight: 700, color: C.text }}>{TABS.find(t => t.id === tab)?.label}</span>
            <span style={{ fontSize: 11, color: C.sub, marginLeft: 10 }}>{stats?.date_from} → {stats?.date_to} · {stats?.total_shipments?.toLocaleString()} shipments</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ display: "flex", gap: 5, alignItems: "center" }}>
              {Object.entries(THEMES).map(([k, v]) => (
                <button key={k} onClick={() => setTheme(k)} title={k} style={{
                  width: theme === k ? 20 : 12, height: theme === k ? 20 : 12,
                  borderRadius: "50%", background: v.accent, padding: 0,
                  border: theme === k ? `2px solid ${C.text}` : "2px solid transparent",
                  cursor: "pointer", transition: "all 0.2s",
                }} />
              ))}
            </div>
            <button onClick={() => setDark(p => !p)} style={{
              padding: "5px 12px", borderRadius: 16, border: `1px solid ${C.border}`,
              background: C.card, color: C.mid, cursor: "pointer", fontSize: 12,
            }}>{dark ? "☀ Light" : "☾ Dark"}</button>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ textAlign: "right" }}>
                <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: C.text }}>Jay Taleja</p>
                <p style={{ margin: 0, fontSize: 10, color: T.accent }}>SAIL Internship</p>
              </div>
              <div style={{ width: 30, height: 30, borderRadius: "50%", background: T.mid, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 12, color: "#fff" }}>J</div>
            </div>
          </div>
        </div>

        {/* CONTENT */}
        <div style={{ flex: 1, padding: 22, overflowY: "auto" }}>

          {/* OVERVIEW */}
          {tab === "overview" && (
            <div>
              <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr", gap: 12, marginBottom: 16 }}>
                <div style={{ background: C.card, borderRadius: 12, padding: "22px 24px", border: `1px solid ${T.accent}40`, position: "relative", overflow: "hidden" }}>
                  <div style={{ position: "absolute", right: 0, top: 0, width: 120, height: "100%", background: `linear-gradient(135deg, transparent, ${T.glow})` }} />
                  <p style={{ margin: "0 0 6px", fontSize: 11, color: C.sub, textTransform: "uppercase", letterSpacing: "0.08em" }}>Total Freight</p>
                  <p style={{ margin: "0 0 2px", fontSize: 36, fontWeight: 800, color: T.accent, lineHeight: 1 }}>{fmt(stats.total_freight)}</p>
                  <p style={{ margin: 0, fontSize: 11, color: C.sub }}>incl. GST · Apr–May 2026</p>
                </div>
                <div style={{ background: C.card, borderRadius: 12, padding: "18px 16px", border: `1px solid ${C.border}` }}>
                  <p style={{ margin: "0 0 8px", fontSize: 11, color: C.sub, textTransform: "uppercase" }}>Total GST</p>
                  <p style={{ margin: 0, fontSize: 22, fontWeight: 700, color: "#38bdf8" }}>{fmt(stats.total_gst)}</p>
                </div>
                <div style={{ background: C.card, borderRadius: 12, padding: "18px 16px", border: `1px solid ${C.border}` }}>
                  <p style={{ margin: "0 0 8px", fontSize: 11, color: C.sub, textTransform: "uppercase" }}>Shipments</p>
                  <p style={{ margin: 0, fontSize: 22, fontWeight: 700, color: C.text }}>{stats.total_shipments?.toLocaleString()}</p>
                </div>
                <div style={{ background: C.card, borderRadius: 12, padding: "18px 16px", border: `1px solid #f9731630` }}>
                  <p style={{ margin: "0 0 8px", fontSize: 11, color: C.sub, textTransform: "uppercase" }}>Anomalies</p>
                  <p style={{ margin: "0 0 2px", fontSize: 22, fontWeight: 700, color: "#f97316" }}>{stats.anomalies_found}</p>
                  <p style={{ margin: 0, fontSize: 10, color: "#f97316", opacity: 0.7 }}>flagged by ML</p>
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10, marginBottom: 20 }}>
                {[
                  { label: "Consignors",   value: stats.unique_consignors },
                  { label: "Routes",       value: stats.unique_routes },
                  { label: "Avg/Shipment", value: fmt(stats.avg_freight) },
                  { label: "ML R²",        value: "0.9885", color: T.accent },
                ].map((s, i) => (
                  <div key={i} style={{ background: C.card, borderRadius: 9, padding: "12px 14px", border: `1px solid ${C.border}` }}>
                    <p style={{ margin: "0 0 4px", fontSize: 10, color: C.sub, textTransform: "uppercase" }}>{s.label}</p>
                    <p style={{ margin: 0, fontSize: 17, fontWeight: 700, color: s.color || C.text }}>{s.value}</p>
                  </div>
                ))}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "3fr 2fr", gap: 14, marginBottom: 14 }}>
                <div style={{ background: C.card, borderRadius: 12, padding: "18px 20px", border: `1px solid ${C.border}` }}>
                  <p style={{ margin: "0 0 3px", fontSize: 13, fontWeight: 600, color: C.text }}>Freight by Consignor</p>
                  <p style={{ margin: "0 0 14px", fontSize: 11, color: C.sub }}>SAIL dominates at 71.1% of total freight</p>
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={consignors} barCategoryGap="30%">
                      <CartesianGrid strokeDasharray="2 3" stroke={C.border} vertical={false} />
                      <XAxis dataKey="CNSR" tick={{ fill: C.sub, fontSize: 10 }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fill: C.sub, fontSize: 9 }} tickFormatter={v => (v/1e7).toFixed(0)+"Cr"} axisLine={false} tickLine={false} />
                      <Tooltip content={<TipC />} />
                      <Bar dataKey="total_freight" name="Freight" radius={[4,4,0,0]}>
                        {consignors.map((_, i) => <Cell key={i} fill={BARS[i % BARS.length]} />)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div style={{ background: C.card, borderRadius: 12, padding: "18px 20px", border: `1px solid ${C.border}` }}>
                  <p style={{ margin: "0 0 3px", fontSize: 13, fontWeight: 600, color: C.text }}>Quick Stats</p>
                  <p style={{ margin: "0 0 16px", fontSize: 11, color: C.sub }}>Key metrics at a glance</p>
                  {[
                    { label: "Avg Weight",    value: stats.avg_weight?.toFixed(0) + " T" },
                    { label: "Total TDS",     value: fmt(stats.total_tds) },
                    { label: "ML MAE",        value: "₹90,154" },
                    { label: "Data Range",    value: "38 days" },
                    { label: "Unique Routes", value: stats.unique_routes },
                    { label: "Consignors",    value: stats.unique_consignors },
                  ].map((s, i) => (
                    <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "9px 0", borderBottom: i < 5 ? `1px solid ${C.border}` : "none" }}>
                      <span style={{ fontSize: 12, color: C.sub }}>{s.label}</span>
                      <span style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{s.value}</span>
                    </div>
                  ))}
                </div>
              </div>
              <Insight topic="overview" C={C} T={T} />
            </div>
          )}

          {/* CONSIGNORS */}
          {tab === "consignors" && (
            <div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12, marginBottom: 16 }}>
                {consignors.slice(0, 3).map((c, i) => (
                  <div key={i} style={{ background: C.card, borderRadius: 12, padding: "16px 18px", border: `1px solid ${i === 0 ? T.accent + "50" : C.border}` }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                      <div style={{ width: 10, height: 10, borderRadius: "50%", background: BARS[i] }} />
                      <span style={{ fontSize: 13, fontWeight: 700, color: C.text }}>#{i+1} {c.CNSR}</span>
                      {i === 0 && <span style={{ marginLeft: "auto", fontSize: 10, color: T.accent, background: T.glow, padding: "2px 7px", borderRadius: 10 }}>DOMINANT</span>}
                    </div>
                    <p style={{ margin: "0 0 2px", fontSize: 20, fontWeight: 800, color: BARS[i] }}>{fmt(c.total_freight)}</p>
                    <p style={{ margin: 0, fontSize: 11, color: C.sub }}>{c.shipments} shipments · {c.avg_weight?.toFixed(0)}T avg</p>
                  </div>
                ))}
              </div>
              <div style={{ background: C.card, borderRadius: 12, border: `1px solid ${C.border}`, overflow: "hidden" }}>
                <div style={{ padding: "14px 18px", borderBottom: `1px solid ${C.border}` }}>
                  <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: C.text }}>All Consignors</p>
                </div>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                  <thead>
                    <tr style={{ background: C.surface }}>
                      {["#","Consignor","Total Freight","Avg/Shipment","Trips","Avg Weight","GST"].map(h => (
                        <th key={h} style={{ textAlign: "left", padding: "9px 14px", color: C.sub, fontSize: 11, fontWeight: 500, textTransform: "uppercase" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {consignors.map((c, i) => (
                      <tr key={i} style={{ borderTop: `1px solid ${C.border}` }}
                        onMouseOver={e => e.currentTarget.style.background = C.input}
                        onMouseOut={e => e.currentTarget.style.background = "transparent"}
                      >
                        <td style={{ padding: "10px 14px", color: C.sub, fontSize: 12 }}>{i+1}</td>
                        <td style={{ padding: "10px 14px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                            <div style={{ width: 7, height: 7, borderRadius: "50%", background: BARS[i % BARS.length] }} />
                            <span style={{ fontWeight: 600 }}>{c.CNSR}</span>
                          </div>
                        </td>
                        <td style={{ padding: "10px 14px", color: T.accent, fontWeight: 700 }}>{fmt(c.total_freight)}</td>
                        <td style={{ padding: "10px 14px" }}>{fmt(c.avg_freight)}</td>
                        <td style={{ padding: "10px 14px" }}>{c.shipments}</td>
                        <td style={{ padding: "10px 14px" }}>{c.avg_weight?.toFixed(1)} T</td>
                        <td style={{ padding: "10px 14px", color: "#38bdf8" }}>{fmt(c.total_gst)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <Insight topic="consignors" C={C} T={T} />
            </div>
          )}

          {/* ROUTES */}
          {tab === "routes" && (
            <div>
              <div style={{ background: C.card, borderRadius: 12, padding: "18px 20px", border: `1px solid ${C.border}`, marginBottom: 14 }}>
                <p style={{ margin: "0 0 3px", fontSize: 13, fontWeight: 600, color: C.text }}>Top 10 Routes by Freight</p>
                <p style={{ margin: "0 0 16px", fontSize: 11, color: C.sub }}>BSCS is the dominant destination hub</p>
                <ResponsiveContainer width="100%" height={360}>
                  <BarChart layout="vertical" data={routes} margin={{ left: 6, right: 50 }} barCategoryGap="25%">
                    <CartesianGrid strokeDasharray="2 3" stroke={C.border} vertical={true} horizontal={false} />
                    <XAxis type="number" tick={{ fill: C.sub, fontSize: 10 }} tickFormatter={v => (v/1e7).toFixed(0)+"Cr"} axisLine={false} tickLine={false} />
                    <YAxis type="category" dataKey="ROUTE" tick={{ fill: C.mid, fontSize: 11 }} width={125} axisLine={false} tickLine={false} />
                    <Tooltip content={<TipC />} />
                    <Bar dataKey="total_freight" name="Freight" radius={[0,5,5,0]}>
                      {routes.map((_, i) => <Cell key={i} fill={BARS[i % BARS.length]} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div style={{ background: C.card, borderRadius: 12, border: `1px solid ${C.border}`, overflow: "hidden" }}>
                <div style={{ padding: "12px 18px", borderBottom: `1px solid ${C.border}` }}>
                  <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: C.text }}>Route Summary</p>
                </div>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                  <thead>
                    <tr style={{ background: C.surface }}>
                      {["Route","Total Freight","Shipments","Avg/Shipment"].map(h => (
                        <th key={h} style={{ padding: "8px 14px", textAlign: "left", color: C.sub, fontSize: 11, textTransform: "uppercase" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {routes.map((r, i) => (
                      <tr key={i} style={{ borderTop: `1px solid ${C.border}` }}
                        onMouseOver={e => e.currentTarget.style.background = C.input}
                        onMouseOut={e => e.currentTarget.style.background = "transparent"}
                      >
                        <td style={{ padding: "9px 14px", fontWeight: 600 }}>{r.ROUTE}</td>
                        <td style={{ padding: "9px 14px", color: T.accent, fontWeight: 700 }}>{fmt(r.total_freight)}</td>
                        <td style={{ padding: "9px 14px" }}>{r.shipments}</td>
                        <td style={{ padding: "9px 14px", color: C.mid }}>{fmt(r.avg_freight)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <Insight topic="routes" C={C} T={T} />
            </div>
          )}

          {/* FORECAST */}
          {tab === "forecast" && (
            <div>
              <div style={{ background: C.card, borderRadius: 12, padding: "20px", border: `1px solid ${C.border}`, marginBottom: 14 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
                  <div>
                    <p style={{ margin: "0 0 3px", fontSize: 13, fontWeight: 600, color: C.text }}>30-Day Freight Forecast</p>
                    <p style={{ margin: 0, fontSize: 11, color: C.sub }}>Prophet time-series model · May 15 – Jun 13, 2026</p>
                  </div>
                </div>
                <ResponsiveContainer width="100%" height={320}>
                  <AreaChart data={forecast}>
                    <defs>
                      <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor={T.accent} stopOpacity={0.2} />
                        <stop offset="95%" stopColor={T.accent} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="2 4" stroke={C.border} />
                    <XAxis dataKey="ds" tick={{ fill: C.sub, fontSize: 10 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: C.sub, fontSize: 9 }} tickFormatter={v => (v/1e7).toFixed(0)+"Cr"} axisLine={false} tickLine={false} />
                    <Tooltip content={<TipC />} />
                    <Legend wrapperStyle={{ fontSize: 11, color: C.sub }} />
                    <Area type="monotone" dataKey="yhat_upper" name="Upper Bound" stroke="#38bdf8" strokeWidth={1} fill="transparent" strokeDasharray="5 3" dot={false} />
                    <Area type="monotone" dataKey="yhat"       name="Predicted"   stroke={T.accent} strokeWidth={2.5} fill="url(#grad)" dot={false} />
                    <Area type="monotone" dataKey="yhat_lower" name="Lower Bound" stroke="#f97316" strokeWidth={1} fill="transparent" strokeDasharray="5 3" dot={false} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              <Insight topic="forecast" C={C} T={T} />
            </div>
          )}

          {/* ANOMALIES */}
          {tab === "anomalies" && (
            <div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10, marginBottom: 16 }}>
                <div style={{ background: C.card, borderRadius: 10, padding: "14px 16px", border: `1px solid #f9731630` }}>
                  <p style={{ margin: "0 0 4px", fontSize: 10, color: C.sub, textTransform: "uppercase" }}>Total Flagged</p>
                  <p style={{ margin: 0, fontSize: 24, fontWeight: 800, color: "#f97316" }}>{anomalies.length}</p>
                </div>
                <div style={{ background: C.card, borderRadius: 10, padding: "14px 16px", border: `1px solid ${C.border}` }}>
                  <p style={{ margin: "0 0 4px", fontSize: 10, color: C.sub, textTransform: "uppercase" }}>Detection Method</p>
                  <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: C.text }}>Isolation Forest</p>
                </div>
                <div style={{ background: C.card, borderRadius: 10, padding: "14px 16px", border: `1px solid ${C.border}` }}>
                  <p style={{ margin: "0 0 4px", fontSize: 10, color: C.sub, textTransform: "uppercase" }}>Contamination Rate</p>
                  <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: C.text }}>5% of dataset</p>
                </div>
              </div>
              <div style={{ background: C.card, borderRadius: 12, border: `1px solid ${C.border}`, overflow: "hidden" }}>
                <div style={{ padding: "13px 18px", borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ color: "#f97316" }}>⚠</span>
                  <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: C.text }}>Suspicious Shipments</p>
                  <span style={{ marginLeft: "auto", fontSize: 11, color: C.sub }}>sorted by anomaly score</span>
                </div>
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                    <thead>
                      <tr style={{ background: C.surface }}>
                        {["Consignor","Route","Date","Weight T","₹/Tonne","Wt Diff %","Score"].map(h => (
                          <th key={h} style={{ padding: "9px 14px", textAlign: "left", color: C.sub, fontSize: 10, textTransform: "uppercase", whiteSpace: "nowrap" }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {anomalies.map((a, i) => (
                        <tr key={i} style={{ borderTop: `1px solid ${C.border}` }}
                          onMouseOver={e => e.currentTarget.style.background = C.input}
                          onMouseOut={e => e.currentTarget.style.background = "transparent"}
                        >
                          <td style={{ padding: "9px 14px", color: "#f97316", fontWeight: 700 }}>{a.CNSR}</td>
                          <td style={{ padding: "9px 14px", color: C.mid }}>{a.ROUTE}</td>
                          <td style={{ padding: "9px 14px", color: C.sub, whiteSpace: "nowrap" }}>{a["RR DATE"]?.slice(0,10)}</td>
                          <td style={{ padding: "9px 14px" }}>{a["CHRG WGHT"]?.toFixed(1)}</td>
                          <td style={{ padding: "9px 14px" }}>{a.FREIGHT_PER_TONNE?.toFixed(0)}</td>
                          <td style={{ padding: "9px 14px" }}>
                            <span style={{ color: a.WEIGHT_DIFF_PCT > 5 ? "#f97316" : T.accent, fontWeight: 700 }}>
                              {a.WEIGHT_DIFF_PCT?.toFixed(1)}%
                            </span>
                          </td>
                          <td style={{ padding: "9px 14px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                              <div style={{ width: 36, height: 3, borderRadius: 2, background: C.border }}>
                                <div style={{ width: `${Math.min(a.ANOMALY_SCORE * 100, 100)}%`, height: "100%", background: "#f97316", borderRadius: 2 }} />
                              </div>
                              <span style={{ fontSize: 11, color: C.sub }}>{a.ANOMALY_SCORE?.toFixed(2)}</span>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              <Insight topic="anomalies" C={C} T={T} />
            </div>
          )}

          {/* PREDICT */}
          {tab === "predict" && (
            <div style={{ display: "grid", gridTemplateColumns: "420px 1fr", gap: 20 }}>
              {/* Form */}
              <div style={{ background: C.card, borderRadius: 12, padding: "22px 24px", border: `1px solid ${C.border}` }}>
                <p style={{ margin: "0 0 2px", fontSize: 14, fontWeight: 700, color: C.text }}>Freight Cost Predictor</p>
                {/* CHANGE 2: dynamic model label in predict header */}
                <p style={{ margin: "0 0 20px", fontSize: 11, color: C.sub }}>
                  {form.model === "xgb"
                    ? "XGBoost · R² = 0.9938 · 1,194 training samples"
                    : "Random Forest · R² = 0.9885 · 1,194 training samples"}
                </p>

                {/* Charged Weight */}
                <div style={{ marginBottom: 13 }}>
                  <label style={{ fontSize: 10, color: C.sub, display: "block", marginBottom: 5, textTransform: "uppercase", letterSpacing: "0.06em" }}>Charged Weight (Tonnes)</label>
                  <input type="number" value={form.chrg_wght}
                    onChange={e => setForm({ ...form, chrg_wght: Number(e.target.value), actl_wght: Number(e.target.value) })}
                    style={selectStyle(C)}
                  />
                </div>

                {/* Rate */}
                <div style={{ marginBottom: 13 }}>
                  <label style={{ fontSize: 10, color: C.sub, display: "block", marginBottom: 5, textTransform: "uppercase", letterSpacing: "0.06em" }}>Rate per Quintal (₹)</label>
                  <input type="number" value={form.rate}
                    onChange={e => setForm({ ...form, rate: Number(e.target.value) })}
                    style={selectStyle(C)}
                  />
                </div>

                {/* Model selector */}
                <div style={{ marginBottom: 13 }}>
                  <label style={{ fontSize: 10, color: C.sub, display: "block", marginBottom: 5, textTransform: "uppercase", letterSpacing: "0.06em" }}>ML Model</label>
                  <div style={{ display: "flex", gap: 8 }}>
                    {[
                      { key: "xgb", label: "XGBoost", badge: "R² = 0.9938 ✓ Better" },
                      { key: "rf",  label: "Random Forest", badge: "R² = 0.9885" }
                    ].map(m => (
                      <button
                        type="button"
                        key={m.key}
                        onClick={() => setForm({ ...form, model: m.key })}
                        style={{
                          flex: 1, padding: "8px", borderRadius: 7,
                          border: `1px solid ${form.model === m.key ? T.accent : C.border}`,
                          background: form.model === m.key ? T.glow : "transparent",
                          color: form.model === m.key ? T.accent : C.sub,
                          cursor: "pointer", fontSize: 12,
                          fontWeight: form.model === m.key ? 700 : 400,
                          fontFamily: "inherit"
                        }}
                      >
                        <div>{m.label}</div>
                        <div style={{ fontSize: 10, marginTop: 2, opacity: 0.8 }}>{m.badge}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Consignor dropdown */}
                <div style={{ marginBottom: 13 }}>
                  <label style={{ fontSize: 10, color: C.sub, display: "block", marginBottom: 5, textTransform: "uppercase", letterSpacing: "0.06em" }}>Consignor</label>
                  <select value={form.consignor}
                    onChange={e => setForm({ ...form, consignor: e.target.value })}
                    style={selectStyle(C)}
                  >
                    {CONSIGNORS.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>

                {/* Division dropdown */}
                <div style={{ marginBottom: 13 }}>
                  <label style={{ fontSize: 10, color: C.sub, display: "block", marginBottom: 5, textTransform: "uppercase", letterSpacing: "0.06em" }}>Division</label>
                  <select value={form.division}
                    onChange={e => setForm({ ...form, division: e.target.value })}
                    style={selectStyle(C)}
                  >
                    {DIVISIONS.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>

                {/* Route dropdown */}
                <div style={{ marginBottom: 13 }}>
                  <label style={{ fontSize: 10, color: C.sub, display: "block", marginBottom: 5, textTransform: "uppercase", letterSpacing: "0.06em" }}>Route</label>
                  <select value={form.route}
                    onChange={e => setForm({ ...form, route: e.target.value })}
                    style={selectStyle(C)}
                  >
                    {ROUTES.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>

                {/* Other charges — actual ₹ amount, training mean = ₹62,309 */}
                <div style={{ marginBottom: 13 }}>
                  <label style={{ fontSize: 10, color: C.sub, display: "block", marginBottom: 5, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                    Other Charges (₹)
                    <span style={{ marginLeft: 6, fontSize: 9, color: C.sub, textTransform: "none", letterSpacing: 0 }}>
                      — enter 0 if none · avg in data: ₹62,309
                    </span>
                  </label>
                  <input
                    type="number"
                    value={form.other_charges}
                    min={0}
                    placeholder="0"
                    onChange={e => setForm({ ...form, other_charges: Number(e.target.value) })}
                    style={selectStyle(C)}
                  />
                </div>

                {/* Demurrage checkbox */}
                <div style={{ marginBottom: 18, display: "flex", alignItems: "center", gap: 8 }}>
                  <input type="checkbox" id="dem" checked={form.has_demurrage === 1}
                    onChange={e => setForm({ ...form, has_demurrage: e.target.checked ? 1 : 0 })}
                    style={{ cursor: "pointer" }}
                  />
                  <label htmlFor="dem" style={{ fontSize: 12, color: C.mid, cursor: "pointer" }}>Has Demurrage Charges</label>
                </div>

                {/* Input validation warnings */}
                {getWarnings(form).length > 0 && (
                  <div style={{ marginBottom: 14, borderRadius: 8, overflow: "hidden", border: "1px solid #f9731650" }}>
                    <div style={{ padding: "8px 12px", background: "#f9731615" }}>
                      <p style={{ margin: "0 0 4px", fontSize: 10, color: "#f97316", fontWeight: 700, textTransform: "uppercase" }}>⚠ Out-of-Range Warning</p>
                      {getWarnings(form).map((w, i) => (
                        <p key={i} style={{ margin: "2px 0 0", fontSize: 11, color: "#f97316" }}>• {w}</p>
                      ))}
                      <p style={{ margin: "6px 0 0", fontSize: 10, color: "#f9731699" }}>Prediction accuracy may be reduced for values outside training data.</p>
                    </div>
                  </div>
                )}

                {/* Manual estimate preview */}
                <div style={{ marginBottom: 14, borderRadius: 8, border: `1px solid ${C.border}`, overflow: "hidden" }}>
                  <div style={{ padding: "8px 12px", background: C.input, borderBottom: `1px solid ${C.border}` }}>
                    <p style={{ margin: 0, fontSize: 10, color: C.sub, fontWeight: 700, textTransform: "uppercase" }}>📐 Manual Estimate (Formula)</p>
                  </div>
                  <div style={{ padding: "10px 12px", background: C.input }}>
                    {[
                      { label: "Basic (wt × 10 × rate)", value: fmt(manualCalc(form).basic) },
                      { label: "GST 5%",                 value: fmt(manualCalc(form).gst) },
                      { label: "Other Charges",          value: fmt(Number(form.other_charges)) },
                      { label: "Demurrage est.",         value: form.has_demurrage ? fmt(manualCalc(form).demurr) : "—" },
                    ].map((row, i) => (
                      <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "3px 0", borderBottom: i < 3 ? `1px solid ${C.border}` : "none" }}>
                        <span style={{ fontSize: 11, color: C.sub }}>{row.label}</span>
                        <span style={{ fontSize: 11, color: C.mid, fontWeight: 600 }}>{row.value}</span>
                      </div>
                    ))}
                    <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6, paddingTop: 6, borderTop: `1px solid ${C.border}` }}>
                      <span style={{ fontSize: 12, color: C.text, fontWeight: 700 }}>Formula Total</span>
                      <span style={{ fontSize: 13, color: T.accent, fontWeight: 800 }}>{fmt(manualCalc(form).total)}</span>
                    </div>
                  </div>
                </div>

                <button onClick={predict} disabled={predBusy} style={{
                  width: "100%", padding: "11px",
                  background: predBusy ? C.input : T.mid,
                  border: "none", borderRadius: 8,
                  color: predBusy ? C.sub : "#fff",
                  fontSize: 14, fontWeight: 700,
                  cursor: predBusy ? "not-allowed" : "pointer",
                  fontFamily: "inherit",
                }}>
                  {predBusy ? "Predicting..." : "Predict Cost →"}
                </button>
              </div>

              {/* Result panel */}
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <div style={{ background: C.card, borderRadius: 12, padding: "22px 24px", border: `1px solid ${prediction ? T.accent + "40" : C.border}`, flex: prediction ? "none" : 1, display: "flex", flexDirection: "column", justifyContent: prediction ? "flex-start" : "center", alignItems: prediction ? "flex-start" : "center", minHeight: 160 }}>
                  {prediction ? (
                    <div style={{ width: "100%" }}>
                      <p style={{ margin: "0 0 4px", fontSize: 10, color: C.sub, textTransform: "uppercase" }}>ML Predicted Freight</p>
                      <p style={{ margin: "0 0 2px", fontSize: 44, fontWeight: 900, color: T.accent, lineHeight: 1 }}>{fmt(prediction.predicted_freight)}</p>
                      {/* CHANGE 4: dynamic accuracy label on result card */}
                      <p style={{ margin: "0 0 8px", fontSize: 11, color: C.sub }}>
                        {form.model === "xgb"
                          ? "XGBoost · 99.38% accuracy"
                          : "Random Forest · 98.85% accuracy"}
                      </p>

                      {/* ML vs Manual comparison */}
                      <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
                        <div style={{ flex: 1, padding: "8px 10px", borderRadius: 7, background: T.glow, border: `1px solid ${T.accent}40`, textAlign: "center" }}>
                          <p style={{ margin: "0 0 2px", fontSize: 9, color: T.accent, textTransform: "uppercase", letterSpacing: "0.05em" }}>ML Model</p>
                          <p style={{ margin: 0, fontSize: 14, fontWeight: 800, color: T.accent }}>{fmt(prediction.predicted_freight)}</p>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", fontSize: 16, color: C.sub }}>vs</div>
                        <div style={{ flex: 1, padding: "8px 10px", borderRadius: 7, background: C.input, border: `1px solid ${C.border}`, textAlign: "center" }}>
                          <p style={{ margin: "0 0 2px", fontSize: 9, color: C.sub, textTransform: "uppercase", letterSpacing: "0.05em" }}>Formula Est.</p>
                          <p style={{ margin: 0, fontSize: 14, fontWeight: 800, color: C.mid }}>{fmt(manualCalc(form).total)}</p>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", fontSize: 16, color: C.sub }}>vs</div>
                        <div style={{ flex: 1, padding: "8px 10px", borderRadius: 7, background: C.input, border: `1px solid ${C.border}`, textAlign: "center" }}>
                          <p style={{ margin: "0 0 2px", fontSize: 9, color: C.sub, textTransform: "uppercase", letterSpacing: "0.05em" }}>{prediction.other_model_name}</p>
                          <p style={{ margin: 0, fontSize: 14, fontWeight: 800, color: C.mid }}>{fmt(prediction.other_prediction)}</p>
                        </div>
                      </div>

                      {/* Deviation badge */}
                      {(() => {
                        const diff = Math.abs(prediction.predicted_freight - manualCalc(form).total);
                        const pct  = (diff / manualCalc(form).total * 100).toFixed(1);
                        const ok   = diff < 100000;
                        return (
                          <div style={{ marginBottom: 16, padding: "6px 12px", borderRadius: 6, background: ok ? "#4ade8015" : "#f9731615", border: `1px solid ${ok ? "#4ade8040" : "#f9731640"}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <span style={{ fontSize: 11, color: ok ? "#4ade80" : "#f97316" }}>
                              {ok ? "✓ ML & formula agree" : "⚠ Large deviation detected"}
                            </span>
                            <span style={{ fontSize: 12, fontWeight: 700, color: ok ? "#4ade80" : "#f97316" }}>
                              {fmt(diff)} ({pct}% diff)
                            </span>
                          </div>
                        );
                      })()}

                      {/* Cost breakdown */}
                      <div style={{ background: C.input, borderRadius: 8, padding: "12px 14px", marginBottom: 16, border: `1px solid ${C.border}` }}>
                        <p style={{ margin: "0 0 8px", fontSize: 10, color: C.sub, textTransform: "uppercase" }}>Estimate Breakdown</p>
                        {[
                          { label: "Basic Freight Est.", value: fmt(prediction.basic_freight_est), color: T.accent },
                          { label: "GST (5%)",           value: fmt(prediction.gst_estimate),      color: "#38bdf8" },
                          { label: "Manual Total Est.",  value: fmt(prediction.manual_estimate),   color: C.mid },
                        ].map((item, i) => (
                          <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", borderBottom: i < 2 ? `1px solid ${C.border}` : "none" }}>
                            <span style={{ fontSize: 12, color: C.sub }}>{item.label}</span>
                            <span style={{ fontSize: 13, fontWeight: 600, color: item.color }}>{item.value}</span>
                          </div>
                        ))}
                      </div>

                      {/* Feature importance */}
                      <p style={{ margin: "0 0 10px", fontSize: 10, color: C.sub, textTransform: "uppercase" }}>What drove this prediction</p>
                      {[
                        { label: "Rate per Quintal", pct: 73, color: BARS[0] },
                        { label: "Charged Weight",   pct: 25, color: BARS[1] },
                        { label: "Other factors",    pct: 2,  color: BARS[2] },
                      ].map((f, i) => (
                        <div key={i} style={{ marginBottom: 9 }}>
                          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                            <span style={{ fontSize: 12, color: C.mid }}>{f.label}</span>
                            <span style={{ fontSize: 12, color: f.color, fontWeight: 700 }}>{f.pct}%</span>
                          </div>
                          <div style={{ height: 3, background: C.border, borderRadius: 2 }}>
                            <div style={{ width: `${f.pct}%`, height: "100%", background: f.color, borderRadius: 2 }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div style={{ textAlign: "center", color: C.sub }}>
                      <p style={{ fontSize: 32, margin: "0 0 10px" }}>◎</p>
                      <p style={{ fontSize: 14, margin: "0 0 4px", color: C.mid }}>Select options and predict</p>
                      <p style={{ fontSize: 12, margin: 0 }}>The ML model will predict the freight cost</p>
                    </div>
                  )}
                </div>

                {/* CHANGE 5: dynamic "How the model works" steps */}
                <div style={{ background: C.card, borderRadius: 12, padding: "18px 20px", border: `1px solid ${C.border}` }}>
                  <p style={{ margin: "0 0 12px", fontSize: 12, fontWeight: 600, color: C.mid, textTransform: "uppercase", letterSpacing: "0.05em" }}>How the model works</p>
                  {[
                    { step: "1", text: "Takes your input: weight, rate, route, consignor" },
                    {
                      step: "2",
                      text: form.model === "xgb"
                        ? "Builds boosted trees sequentially to reduce errors"
                        : "Runs through 100 decision trees simultaneously"
                    },
                    {
                      step: "3",
                      text: form.model === "xgb"
                        ? "Each new tree learns from previous mistakes"
                        : "Each tree votes on a freight cost estimate"
                    },
                    {
                      step: "4",
                      text: form.model === "xgb"
                        ? "Combined boosted trees produce the final prediction"
                        : "Final prediction = average of all 100 votes"
                    },
                  ].map((s, i) => (
                    <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start", marginBottom: 8 }}>
                      <div style={{ width: 20, height: 20, borderRadius: "50%", background: T.glow, border: `1px solid ${T.accent}60`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, color: T.accent, flexShrink: 0, fontWeight: 700 }}>{s.step}</div>
                      <p style={{ margin: 0, fontSize: 12, color: C.sub, lineHeight: 1.5 }}>{s.text}</p>
                    </div>
                  ))}
                </div>

                {/* AI explanation */}
                {explanation && (
                  <div style={{ background: T.glow, borderRadius: 12, padding: "16px 18px", border: `1px solid ${T.accent}40` }}>
                    <p style={{ margin: "0 0 8px", fontSize: 10, color: T.accent, fontWeight: 700, textTransform: "uppercase" }}>⚡ AI Explanation</p>
                    <p style={{ margin: 0, fontSize: 13, color: C.mid, lineHeight: 1.7 }}>{explanation}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* AI CHAT */}
          {tab === "chat" && <Chat C={C} T={T} />}

          {/* ABOUT */}
          {tab === "about" && (
            <div style={{ maxWidth: 740 }}>
              <div style={{ marginBottom: 24 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 12 }}>
                  <div style={{ width: 48, height: 48, borderRadius: "50%", background: T.mid, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, fontWeight: 800, color: "#fff" }}>J</div>
                  <div>
                    <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: C.text }}>Jay Taleja</h1>
                    <p style={{ margin: 0, fontSize: 13, color: T.accent }}>SAIL Internship · Summer 2026</p>
                  </div>
                </div>
                <p style={{ fontSize: 14, color: C.sub, lineHeight: 1.8, margin: 0 }}>
                  Built this during my internship at SAIL to make sense of the outward railway freight data.
                  Started with messy CSV files, ended up with a full ML pipeline with forecasting, anomaly detection,
                  and an AI assistant. Learned a lot about data cleaning — 69% of raw rows were blank.
                </p>
              </div>

              <div style={{ background: C.card, borderRadius: 12, border: `1px solid ${C.border}`, overflow: "hidden", marginBottom: 16 }}>
                <div style={{ padding: "13px 18px", borderBottom: `1px solid ${C.border}` }}>
                  <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: C.text }}>What I built</p>
                </div>
                {[
                  { icon: "🧹", title: "Data Pipeline",    desc: "Cleaned 3,912 raw rows down to 1,194 usable records. Removed blank rows, deduped, fixed date formats, filled nulls." },
                  { icon: "📊", title: "EDA",              desc: "Found 69% of rows were blank, SAIL accounts for 71.1% of freight, BSCS is the dominant destination." },
                  { icon: "🤖", title: "ML Models",        desc: "Random Forest (R²=0.9885), XGBoost (R²=0.9938), Isolation Forest anomaly detection, KMeans clustering, Prophet 30-day forecasting." },
                  { icon: "🚀", title: "FastAPI Backend",  desc: "11 REST endpoints. Pre-trained models, predictions, AI insights via Groq API." },
                  { icon: "⚛️", title: "React Frontend",   desc: "This dashboard. 8 tabs, collapsible sidebar, 5 color themes, dark/light mode, AI chat, XGBoost/Random Forest model switcher." },
                ].map((item, i, arr) => (
                  <div key={i} style={{ display: "flex", gap: 14, padding: "14px 18px", borderBottom: i < arr.length - 1 ? `1px solid ${C.border}` : "none" }}>
                    <span style={{ fontSize: 18, flexShrink: 0, lineHeight: 1.4 }}>{item.icon}</span>
                    <div>
                      <p style={{ margin: "0 0 3px", fontSize: 13, fontWeight: 600, color: C.text }}>{item.title}</p>
                      <p style={{ margin: 0, fontSize: 12, color: C.sub, lineHeight: 1.6 }}>{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                <div style={{ background: C.card, borderRadius: 12, padding: "16px 18px", border: `1px solid ${C.border}` }}>
                  <p style={{ margin: "0 0 12px", fontSize: 13, fontWeight: 600, color: C.text }}>Tech Stack</p>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {["Python","Pandas","Scikit-learn","XGBoost","Prophet","FastAPI","React","Recharts","Groq","Llama 3.3"].map(t => (
                      <span key={t} style={{ padding: "3px 10px", background: C.input, border: `1px solid ${C.border}`, borderRadius: 14, fontSize: 11, color: C.mid }}>{t}</span>
                    ))}
                  </div>
                </div>
                <div style={{ background: C.card, borderRadius: 12, padding: "16px 18px", border: `1px solid ${C.border}` }}>
                  <p style={{ margin: "0 0 12px", fontSize: 13, fontWeight: 600, color: C.text }}>Key Findings</p>
                  {[
                    "SAIL = 71.1% of total freight",
                    "60 anomalous shipments flagged",
                    "Rate drives 73% of cost prediction",
                    "BSCS is the main freight destination",
                    "Model MAE: ₹90,154",
                  ].map((f, i) => (
                    <p key={i} style={{ margin: "0 0 6px", fontSize: 12, color: C.sub }}>
                      <span style={{ color: T.accent, marginRight: 6 }}>→</span>{f}
                    </p>
                  ))}
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div style={{ padding: "10px 24px", borderTop: `1px solid ${C.border}`, display: "flex", justifyContent: "space-between", background: C.surface }}>
          <p style={{ margin: 0, fontSize: 11, color: C.sub }}>Railway Freight Analytics · Jay Taleja · SAIL Internship 2026</p>
          <p style={{ margin: 0, fontSize: 11, color: C.sub }}>Python · FastAPI · React · Llama 3.3</p>
        </div>
      </div>
    </div>
  );
}