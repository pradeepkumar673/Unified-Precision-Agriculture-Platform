import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { getFarmProfile } from "../../api/farmApi";
import AppShell from "../../layouts/AppShell";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

export default function GrowerScorePage() {
  const navigate = useNavigate();
  const farmId = localStorage.getItem("farmId") || "";
  const [scoreData, setScoreData] = useState(null);
  const [farmData, setFarmData] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isAlertsOpen, setIsAlertsOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const fetchAll = async (showRefresh = false) => {
    if (showRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);
    try {
      const [farmRes, scoreRes, alertRes] = await Promise.allSettled([
        getFarmProfile(farmId),
        axios.get(`${API_BASE}/api/v1/community/grower-score/${farmId}`),
        axios.get(`${API_BASE}/api/v1/community/alerts/${farmId}`),
      ]);

      if (farmRes.status === "fulfilled") setFarmData(farmRes.value.data);

      if (scoreRes.status === "fulfilled") {
        const raw = scoreRes.value.data;
        const rawScore = raw.score ?? 0;
        // Normalise score 0-100 for display bars
        const norm = (v) => Math.min(100, Math.max(0, v));
        setScoreData({
          score: rawScore,
          district_percentile: raw.district_percentile ?? 50,
          factors: raw.factors
            ? Object.entries(raw.factors).map(([name, value]) => ({ name, value: norm(value) }))
            : [
                { name: "Market ROI", value: norm(rawScore) },
                { name: "Loan Repayments", value: norm(rawScore - 5 < 0 ? rawScore : rawScore - 5) },
                { name: "Eco Practices", value: norm(rawScore - 15 < 0 ? rawScore : rawScore - 15) },
                { name: "SHG Activity", value: norm(rawScore - 25 < 0 ? rawScore : rawScore - 25) },
              ],
        });
      } else {
        setError("Could not load Grower Score. Make sure your Farm ID is correct.");
      }

      if (alertRes.status === "fulfilled") {
        const data = Array.isArray(alertRes.value.data) ? alertRes.value.data : [];
        setAlerts(
          data.slice(0, 5).map((a) => ({
            id: a.id,
            type: a.type || "info",
            severity: a.severity || "medium",
            title: a.title || a.message?.substring(0, 50) || "Alert",
            desc: a.description || a.message || "",
          }))
        );
      }
    } catch (err) {
      setError("Failed to load data. Please try again.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchAll(); }, []);

  // Score tier label
  const getTier = (score) => {
    if (score >= 90) return { label: "Platinum", color: "text-purple-400", tier: 1 };
    if (score >= 75) return { label: "Gold", color: "text-amber-400", tier: 1 };
    if (score >= 60) return { label: "Silver", color: "text-slate-300", tier: 2 };
    if (score >= 40) return { label: "Bronze", color: "text-orange-600", tier: 3 };
    return { label: "Starter", color: "text-on-surface-variant", tier: 4 };
  };

  const getAlertColor = (severity) => {
    if (severity === "high") return "text-error bg-error/10";
    if (severity === "medium") return "text-secondary bg-secondary/10";
    return "text-primary bg-primary/10";
  };

  const getAlertIcon = (type) => {
    const icons = { weather: "thunderstorm", pest: "bug_report", disease: "coronavirus", price: "trending_down" };
    return icons[type] || "notifications";
  };

  // Compute SVG semi-circle arc for gauge
  const calcArc = (score) => {
    const capped = Math.min(100, Math.max(0, score));
    const pct = capped / 100;
    const startX = 20, endX = 180, cy = 100;
    const r = 80;
    const angle = Math.PI * pct; // 0 to PI (left to right)
    const x = 100 - r * Math.cos(angle);
    const y = cy - r * Math.sin(angle);
    return `M ${startX} ${cy} A ${r} ${r} 0 ${pct > 0.5 ? 1 : 0} 1 ${x.toFixed(1)} ${y.toFixed(1)}`;
  };

  const ecoBonus = scoreData ? (scoreData.score >= 70 ? 8 : scoreData.score >= 50 ? 5 : 2) : 0;
  const loanDiscount = scoreData ? (scoreData.score >= 90 ? 1.0 : scoreData.score >= 75 ? 0.75 : scoreData.score >= 60 ? 0.5 : 0.25) : 0;
  const tier = scoreData ? getTier(scoreData.score) : null;
  const topPct = scoreData ? Math.round(100 - scoreData.district_percentile) : 0;

  return (
    <AppShell title="Grower Score" showBackButton>
      <main className="flex flex-col w-full pt-20 pb-24 px-margin bg-surface flex-1 gap-space-md">

        {/* Header summary */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="font-headline-md text-headline-md text-on-surface font-bold">Grower Reputation Score</h1>
            <p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">
              {farmData?.name || "Your Farm"} — unlocks premium tiers &amp; loan rates
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => fetchAll(true)}
              disabled={refreshing}
              type="button"
              className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center text-primary shadow-sm active:scale-95 transition-transform"
            >
              <span className={`material-symbols-outlined text-[20px] ${refreshing ? "animate-spin" : ""}`}>
                {refreshing ? "progress_activity" : "refresh"}
              </span>
            </button>
            <button
              onClick={() => setIsAlertsOpen(!isAlertsOpen)}
              type="button"
              className="relative w-10 h-10 rounded-full bg-surface-container flex items-center justify-center shadow-sm active:scale-95 transition-transform"
            >
              <span className="material-symbols-outlined text-[20px] text-on-surface-variant">notifications</span>
              {alerts.length > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-error text-on-error text-[10px] font-bold rounded-full flex items-center justify-center">
                  {alerts.length}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Alerts tray */}
        {isAlertsOpen && (
          <div className="bg-surface-container-lowest rounded-xl shadow-lg overflow-hidden">
            <div className="p-3 bg-surface-container flex justify-between items-center">
              <span className="font-label-md text-label-md text-on-surface font-bold flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[18px] text-primary">notifications_active</span>
                Smart Alerts
              </span>
              <button onClick={() => setIsAlertsOpen(false)} type="button" className="material-symbols-outlined text-[20px] text-on-surface-variant">close</button>
            </div>
            {alerts.length === 0 ? (
              <div className="p-8 text-center text-on-surface-variant font-body-sm">No new alerts</div>
            ) : alerts.map((a) => (
              <div key={a.id} className="p-3 border-b border-surface-container flex gap-3 items-start">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${getAlertColor(a.severity)}`}>
                  <span className="material-symbols-outlined text-[18px]">{getAlertIcon(a.type)}</span>
                </div>
                <div>
                  <p className="font-label-md text-label-md text-on-surface font-semibold">{a.title}</p>
                  {a.desc && <p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">{a.desc}</p>}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="flex flex-col items-center justify-center gap-3 py-16">
            <span className="material-symbols-outlined text-[48px] text-primary animate-spin">progress_activity</span>
            <p className="font-label-md text-label-md text-on-surface-variant">Calculating your Grower Score...</p>
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div className="bg-error-container text-on-error-container rounded-xl p-4 flex items-center gap-3">
            <span className="material-symbols-outlined text-[24px]">error</span>
            <div>
              <p className="font-label-md text-label-md font-semibold">Could not load score</p>
              <p className="font-body-sm text-body-sm">{error}</p>
            </div>
          </div>
        )}

        {/* Score gauge */}
        {!loading && scoreData && (
          <>
            <div className="bg-surface-container-lowest rounded-2xl shadow-sm overflow-hidden">
              {/* Gradient header band */}
              <div className="bg-gradient-to-br from-amber-500/20 via-orange-400/10 to-transparent p-space-md flex flex-col items-center relative">
                <div className="absolute top-3 right-3">
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-600 font-label-sm text-label-sm font-bold">
                    <span className="material-symbols-outlined text-[14px]">emoji_events</span>
                    Top {topPct}% in District
                  </span>
                </div>
                <h2 className="self-start font-headline-sm text-headline-sm text-on-surface font-bold flex items-center gap-2 mb-2">
                  <span className="material-symbols-outlined text-[22px] text-amber-500">military_tech</span>
                  Reputation Score
                </h2>

                {/* SVG Semi-Circle Gauge */}
                <svg viewBox="0 0 200 110" className="w-52 h-28 mt-2">
                  {/* Track */}
                  <path d="M 20 100 A 80 80 0 0 1 180 100" stroke="#e5e7eb" strokeWidth="14" fill="none" strokeLinecap="round" />
                  {/* Fill */}
                  <path
                    d={calcArc(scoreData.score)}
                    stroke="url(#scoreGrad)"
                    strokeWidth="14"
                    fill="none"
                    strokeLinecap="round"
                    style={{ transition: "d 1s ease" }}
                  />
                  <defs>
                    <linearGradient id="scoreGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#f59e0b" />
                      <stop offset="100%" stopColor="#f97316" />
                    </linearGradient>
                  </defs>
                  {/* Score number */}
                  <text x="100" y="95" textAnchor="middle" fontSize="28" fontWeight="900" fill="#f59e0b">{scoreData.score}</text>
                  <text x="100" y="110" textAnchor="middle" fontSize="10" fill="#9ca3af">/100</text>
                </svg>

                {/* Tier badge */}
                <span className={`font-label-lg text-label-lg font-extrabold mt-1 uppercase tracking-widest ${tier?.color}`}>
                  {tier?.label} Tier {tier?.tier}
                </span>

                <p className="text-center font-body-sm text-body-sm text-on-surface-variant mt-3 max-w-xs">
                  {scoreData.score >= 75
                    ? <>Your score unlocks <strong className="text-on-surface">Tier 1 pricing</strong> in the marketplace and prioritizes your produce in B2B Exchange matches.</>
                    : scoreData.score >= 50
                    ? <>Improve to 75+ to unlock <strong className="text-on-surface">Tier 1 pricing</strong> and B2B Exchange priority.</>
                    : <>Build your score by making on-time repayments and participating in community activities.</>
                  }
                </p>
              </div>

              {/* Perks strip */}
              <div className="grid grid-cols-2 divide-x divide-surface-container-high border-t border-surface-container-high">
                <div className="p-3 flex items-center gap-2">
                  <span className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-600 flex-shrink-0">
                    <span className="material-symbols-outlined text-[18px]">eco</span>
                  </span>
                  <div>
                    <p className="font-label-sm text-label-sm text-on-surface-variant">Eco-Bonus</p>
                    <p className="font-label-md text-label-md text-emerald-600 font-bold">+{ecoBonus} pts</p>
                  </div>
                </div>
                <div className="p-3 flex items-center gap-2">
                  <span className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-600 flex-shrink-0">
                    <span className="material-symbols-outlined text-[18px]">percent</span>
                  </span>
                  <div>
                    <p className="font-label-sm text-label-sm text-on-surface-variant">Loan Rate</p>
                    <p className="font-label-md text-label-md text-blue-600 font-bold">{loanDiscount}% Discount</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Score composition */}
            <div className="bg-surface-container-lowest rounded-2xl shadow-sm p-space-md">
              <h3 className="font-headline-sm text-headline-sm text-on-surface font-bold mb-space-md">Score Composition</h3>
              <div className="flex flex-col gap-4">
                {scoreData.factors.map((f, i) => (
                  <div key={i}>
                    <div className="flex justify-between items-baseline mb-1.5">
                      <span className="font-label-md text-label-md text-on-surface">{f.name}</span>
                      <span className="font-label-sm text-label-sm font-bold text-amber-600">{f.value}/100</span>
                    </div>
                    <div className="w-full bg-surface-container rounded-full h-2.5 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-amber-400 to-orange-500 transition-all duration-700"
                        style={{ width: `${f.value}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Improvement tips */}
            <div className="bg-surface-container-lowest rounded-2xl shadow-sm p-space-md">
              <h3 className="font-headline-sm text-headline-sm text-on-surface font-bold mb-space-sm flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[20px]">tips_and_updates</span>
                How to Improve
              </h3>
              <div className="flex flex-col gap-2">
                {[
                  { icon: "payments", label: "Repay loans on time", action: () => navigate("/finance/credit-insurance"), cta: "View Loans" },
                  { icon: "storefront", label: "Make more marketplace transactions", action: () => navigate("/marketplace/harvest"), cta: "Go to Market" },
                  { icon: "group", label: "Join or contribute to your SHG", action: () => navigate("/community/shg-bookings"), cta: "View SHG" },
                  { icon: "eco", label: "Use certified organic/eco inputs", action: () => navigate("/marketplace/inputs"), cta: "Shop Inputs" },
                ].map((tip, i) => (
                  <div key={i} className="flex items-center justify-between bg-surface-container rounded-xl p-3">
                    <div className="flex items-center gap-3">
                      <span className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                        <span className="material-symbols-outlined text-primary text-[18px]">{tip.icon}</span>
                      </span>
                      <span className="font-body-sm text-body-sm text-on-surface">{tip.label}</span>
                    </div>
                    <button onClick={tip.action} type="button"
                      className="font-label-sm text-label-sm text-primary font-semibold shrink-0 hover:underline">
                      {tip.cta}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </main>
    </AppShell>
  );
}
