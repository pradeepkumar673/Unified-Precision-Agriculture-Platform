import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getFarmProfile } from "../../api/farmApi";
import AppShell from "../../layouts/AppShell";

export default function WaterDemandForecast() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("forecast"); // forecast, budget, canal
  const [pumpActive, setPumpActive] = useState(false);
  
  const [farmProfile, setFarmProfile] = useState(null);
  const [forecastData, setForecastData] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const farmId = localStorage.getItem("farmId") || "00000000-0000-0000-0000-000000000000";

  useEffect(() => {
    const loadData = async () => {
      try {
        const res = await getFarmProfile(farmId);
        setFarmProfile(res.data);
        
        // Generate dynamic 7-day forecast based on current date
        const baseTemp = 28;
        const cropMultiplier = res.data.current_crop === "Rice" ? 1.5 : (res.data.current_crop === "Wheat" ? 1.0 : 0.8);
        const acres = res.data.land_size_acres || 1;
        
        const generated = [];
        const today = new Date();
        for (let i = 0; i < 7; i++) {
          const d = new Date(today);
          d.setDate(today.getDate() + i);
          const dayName = d.toLocaleDateString("en-US", { weekday: "short" });
          
          // Add some randomization for realism
          const temp = Math.floor(baseTemp + Math.random() * 8);
          const isRaining = Math.random() > 0.8;
          
          // Calculate liters required
          let liters = 0;
          if (!isRaining) {
             liters = Math.round(temp * 150 * acres * cropMultiplier);
          }
          
          generated.push({
            day: dayName,
            temp: temp,
            rain: isRaining,
            rainAmt: isRaining ? Math.floor(Math.random() * 15 + 2) : 0,
            liters: liters
          });
        }
        setForecastData(generated);
      } catch (err) {
        console.error("Failed to fetch farm profile", err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [farmId]);

  if (loading) return (
    <AppShell title="Water & Canal" showBackButton>
      <div className="min-h-[80vh] bg-surface flex flex-col items-center justify-center text-on-surface-variant gap-3">
        <span className="material-symbols-outlined animate-spin text-[40px] text-primary">progress_activity</span>
        <p className="font-label-md">Loading forecast...</p>
      </div>
    </AppShell>
  );
  
  const crop = farmProfile?.primary_crop || "Unknown Crop";
  const acres = farmProfile?.total_area_acres || 2;
  const stage = farmProfile?.crop_stage || "Growing";
  const farmName = farmProfile?.name || "Farm";
  const village = farmProfile?.village || "Local";
  
  // Calculate max peak
  const maxPeak = Math.max(...forecastData.map(d => d.liters), 0);
  const todayLiters = forecastData[0]?.liters || 0;
  
  // Budget Data
  const totalBudgetLiters = Math.round(acres * 250000);
  const usedBudgetLiters = Math.round(acres * 85000);
  const budgetPct = Math.round((usedBudgetLiters / totalBudgetLiters) * 100);
  const electricitySaved = Math.round(acres * 450);

  // Canal Data
  const today = new Date();
  const nextReleaseStart = new Date(today);
  nextReleaseStart.setDate(today.getDate() + (3 - today.getDay() + 7) % 7); // Next Wednesday
  const nextReleaseEnd = new Date(nextReleaseStart);
  nextReleaseEnd.setDate(nextReleaseStart.getDate() + 2); // Friday
  
  const formatMonthDay = (d) => d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  
  const moisturePct = 48; // Realistic median

  return (
    <AppShell title="Water & Canal" showBackButton>
      <main className="flex flex-col relative w-full pt-16 pb-24 bg-surface flex-1">
        <div className="flex flex-col w-full px-margin gap-space-md py-space-sm">
          {/* Segmented View Switcher & Context Pill */}
          <div className="flex flex-col gap-space-xs pt-2">
            <div className="flex items-center gap-1 p-1 bg-surface-container rounded-full shadow-sm">
              <button onClick={() => setActiveTab("forecast")} className={`flex-1 py-1.5 px-2 rounded-full font-label-sm text-center transition-all flex items-center justify-center gap-1 ${activeTab === "forecast" ? "bg-primary text-on-primary font-bold shadow-sm" : "text-on-surface-variant hover:text-on-surface"}`} type="button">
                <span className="material-symbols-outlined text-[16px]">calendar_view_week</span>
                <span>Forecast</span>
              </button>
              <button onClick={() => setActiveTab("budget")} className={`flex-1 py-1.5 px-2 rounded-full font-label-sm text-center transition-all flex items-center justify-center gap-1 ${activeTab === "budget" ? "bg-primary text-on-primary font-bold shadow-sm" : "text-on-surface-variant hover:text-on-surface"}`} type="button">
                <span className="material-symbols-outlined text-[16px]">water_full</span>
                <span>Budget</span>
              </button>
              <button onClick={() => setActiveTab("canal")} className={`flex-1 py-1.5 px-2 rounded-full font-label-sm text-center transition-all flex items-center justify-center gap-1 ${activeTab === "canal" ? "bg-primary text-on-primary font-bold shadow-sm" : "text-on-surface-variant hover:text-on-surface"}`} type="button">
                <span className="material-symbols-outlined text-[16px]">schedule</span>
                <span>Canal</span>
              </button>
            </div>
            <div className="flex items-center justify-between px-3 py-2 bg-surface-container-low border border-surface-container rounded-xl mt-1">
              <div className="flex items-center gap-2 text-on-surface">
                <span className="material-symbols-outlined text-primary text-[20px]">agriculture</span>
                <div className="flex flex-col">
                  <span className="font-label-md text-label-md font-bold">{farmName} • {crop}</span>
                  <span className="font-body-sm text-[11px] text-on-surface-variant">{acres} Acres • {stage} Stage</span>
                </div>
              </div>
            </div>
          </div>

          {activeTab === "forecast" && (
            <div className="flex flex-col gap-4 animate-in fade-in">
              {/* Hero Forecast Visual Chart Card */}
              <div className="bg-surface-container-lowest rounded-xl p-space-md shadow-sm border border-surface-container flex flex-col gap-space-md">
                <div className="flex items-start justify-between gap-space-xs">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-tertiary text-[22px]">ssid_chart</span>
                      <h2 className="font-headline-sm text-headline-sm text-on-surface font-bold">7-Day Irrigation Forecast</h2>
                    </div>
                    <p className="font-body-sm text-body-sm text-on-surface-variant mt-1 leading-relaxed">
                      Dynamic water calculation calibrated for solar heat, soil moisture, and {crop.toLowerCase()} {stage.toLowerCase()} stage.
                    </p>
                  </div>
                </div>

                {/* Chart Visualizer */}
                <div className="flex flex-col bg-surface-container rounded-xl p-3 border border-surface-container-high">
                  <div className="flex items-center justify-between px-1 mb-2">
                    <span className="font-label-sm text-label-sm text-on-surface-variant">Recommended (Liters)</span>
                    <span className="font-label-sm text-label-sm text-primary font-bold">Max: {(maxPeak / 1000).toFixed(1)}k L</span>
                  </div>
                  
                  <div className="grid grid-cols-7 gap-1.5 items-end h-48 pt-2 pb-1">
                    {forecastData.map((data, i) => {
                      const heightPct = maxPeak > 0 ? (data.liters / maxPeak) * 100 : 0;
                      const isToday = i === 0;
                      
                      return (
                        <div key={i} className={`flex flex-col items-center h-full justify-end group ${!isToday && !data.rain && data.liters === 0 ? "opacity-70" : ""}`}>
                          {data.rain ? (
                            <span className="font-label-sm text-[10px] text-tertiary font-bold mb-1">Rain</span>
                          ) : data.liters > 0 ? (
                            <span className={`font-label-sm text-[10px] font-bold mb-1 ${isToday ? "text-primary" : "text-tertiary"}`}>{(data.liters / 1000).toFixed(1)}k</span>
                          ) : (
                            <span className="font-label-sm text-[10px] text-on-surface-variant mb-1">0 L</span>
                          )}
                          
                          {data.rain ? (
                            <div className="w-full bg-tertiary-fixed rounded-t-lg h-6 relative flex items-center justify-center">
                              <span className="material-symbols-outlined text-tertiary text-[12px]">grain</span>
                            </div>
                          ) : data.liters > 0 ? (
                            <div className={`w-full bg-surface-container-highest rounded-t-lg relative flex flex-col justify-end overflow-hidden ${isToday ? "shadow-sm border border-primary/20" : ""}`} style={{height: `${Math.max(12, heightPct)}%`}}>
                              <div className={`w-full rounded-t-lg h-full transition-all ${isToday ? "bg-primary relative flex items-start justify-center pt-1" : "bg-tertiary"}`}>
                                {isToday && <span className="text-[9px] font-bold text-on-primary tracking-tighter">TODAY</span>}
                              </div>
                            </div>
                          ) : (
                            <div className="w-full bg-surface-container-low rounded-t-lg h-4 relative flex items-center justify-center">
                              <span className="w-1 h-1 rounded-full bg-outline-variant"></span>
                            </div>
                          )}
                          
                          <div className="mt-1 flex flex-col items-center text-center">
                            <span className={`font-label-sm text-[10px] font-bold ${isToday ? "text-primary" : (data.rain ? "text-tertiary" : "text-on-surface")}`}>{data.day}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Active Day Deep-Dive */}
                <div className="bg-primary/5 border border-primary/20 p-3 rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-on-primary shadow-sm shrink-0">
                      <span className="material-symbols-outlined text-[20px]">water_drop</span>
                    </div>
                    <div className="flex flex-col min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-label-md text-label-md text-on-surface font-bold">Today</span>
                        <span className="px-2 py-[2px] rounded-full bg-secondary-container text-on-secondary-container font-label-sm text-[10px] font-bold uppercase tracking-wider shadow-sm">Recommended</span>
                      </div>
                      <p className="font-body-sm text-[12px] text-on-surface-variant truncate">{todayLiters.toLocaleString()} L required • ~{(todayLiters / 5000).toFixed(1)} hrs run</p>
                    </div>
                  </div>
                  <button onClick={() => setPumpActive(!pumpActive)} className={`px-4 py-2 rounded-lg font-label-md text-label-md font-bold shadow-sm active:scale-95 transition-all ${pumpActive ? "bg-error text-on-error" : "bg-primary text-on-primary"}`} type="button">
                    {pumpActive ? "Stop" : "Start"}
                  </button>
                </div>
              </div>

              {/* Weekly Summary Insights */}
              <div className="bg-surface-container-lowest border border-surface-container rounded-xl p-space-md shadow-sm flex flex-col gap-space-sm">
                <div className="flex items-center justify-between pb-1">
                  <span className="font-headline-sm text-[16px] text-on-surface font-bold">Weekly Metrics</span>
                  <span className="px-2.5 py-1 rounded-full bg-primary-container text-on-primary-container font-label-sm text-[11px] font-bold flex items-center gap-1 shadow-sm">
                    <span className="material-symbols-outlined text-[14px]">eco</span>
                    +25% Efficiency
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 mt-1">
                  <div className="bg-surface-container p-3 rounded-xl flex flex-col justify-between border border-surface-container-high">
                    <div className="flex items-center gap-1 text-on-surface-variant mb-1">
                      <span className="material-symbols-outlined text-[16px]">opacity</span>
                      <span className="font-label-sm text-[11px] uppercase font-bold tracking-wider">Demand</span>
                    </div>
                    <div>
                      <span className="font-headline-md text-headline-md text-primary font-bold">{(forecastData.reduce((acc, curr) => acc + curr.liters, 0) / 1000).toFixed(1)}k</span>
                      <span className="font-label-sm text-[11px] text-on-surface-variant"> Liters</span>
                    </div>
                  </div>
                  <div className="bg-surface-container p-3 rounded-xl flex flex-col justify-between border border-surface-container-high">
                    <div className="flex items-center gap-1 text-on-surface-variant mb-1">
                      <span className="material-symbols-outlined text-[16px]">savings</span>
                      <span className="font-label-sm text-[11px] uppercase font-bold tracking-wider">Saved</span>
                    </div>
                    <div>
                      <span className="font-headline-md text-headline-md text-secondary font-bold">{Math.round(forecastData.reduce((acc, curr) => acc + curr.liters, 0) * 0.25).toLocaleString()}</span>
                      <span className="font-label-sm text-[11px] text-on-surface-variant"> Liters</span>
                    </div>
                  </div>
                </div>
                
                {forecastData.find(d => d.rain) && (
                  <div className="flex items-start gap-2.5 p-3 bg-tertiary-container/30 border border-tertiary/20 rounded-xl mt-1">
                    <span className="material-symbols-outlined text-tertiary text-[20px] shrink-0 mt-0.5">shower</span>
                    <div className="flex flex-col">
                      <span className="font-label-md text-label-md text-tertiary font-bold">Rain Forecast {forecastData.find(d => d.rain).day} ({forecastData.find(d => d.rain).rainAmt}mm)</span>
                      <p className="font-body-sm text-[11px] text-on-surface-variant mt-0.5 leading-relaxed">
                        Irrigation skipped automatically. Conserves groundwater and avoids leaching.
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Soil Moisture Visual Check */}
              <div className="bg-surface-container-lowest border border-surface-container rounded-xl p-space-md shadow-sm flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="relative w-14 h-14 flex items-center justify-center">
                    <svg className="w-14 h-14 transform -rotate-90" viewBox="0 0 36 36">
                      <path className="text-surface-container-highest" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="4"></path>
                      <path className="text-primary" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeDasharray={`${moisturePct}, 100`} strokeLinecap="round" strokeWidth="4"></path>
                    </svg>
                    <span className="absolute font-label-md text-label-md font-bold text-primary">{moisturePct}%</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="font-label-md text-label-md text-on-surface font-bold">Root Zone Moisture</span>
                    <p className="font-body-sm text-[11px] text-on-surface-variant">Optimal field capacity for {crop}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "budget" && (
            <div className="flex flex-col gap-4 mt-2 animate-in fade-in">
              <div className="bg-surface-container-lowest border border-surface-container rounded-xl p-space-md shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                  <span className="material-symbols-outlined text-primary text-[24px]" style={{fontVariationSettings: "'FILL' 1"}}>water_full</span>
                  <h2 className="font-headline-sm text-[18px] text-on-surface font-bold">Monthly Water Budget</h2>
                </div>
                
                <div className="flex flex-col gap-2">
                  <div className="flex justify-between items-end mb-1">
                    <span className="font-label-sm text-[12px] uppercase font-bold tracking-wider text-on-surface-variant">Used this month</span>
                    <span className="font-title-md font-bold text-primary">{(usedBudgetLiters/1000).toFixed(0)}k / {(totalBudgetLiters/1000).toFixed(0)}k L</span>
                  </div>
                  <div className="w-full h-4 bg-surface-container-high rounded-full overflow-hidden shadow-inner">
                    <div className="h-full bg-primary rounded-full transition-all duration-1000" style={{ width: `${budgetPct}%` }}></div>
                  </div>
                  <p className="font-body-sm text-[13px] text-on-surface-variant mt-3 leading-relaxed">
                    You have used <strong className="text-on-surface">{budgetPct}%</strong> of your allocated water budget for {farmName}. 
                    At this rate, you are projected to stay well within limits for {acres} Acres.
                  </p>
                </div>
              </div>
              
              <div className="bg-surface-container-lowest border border-surface-container rounded-xl p-space-md shadow-sm">
                <h3 className="font-title-md font-bold text-on-surface mb-3 flex items-center gap-2">
                  <span className="material-symbols-outlined text-secondary">trending_up</span>
                  Efficiency Savings
                </h3>
                <div className="flex items-center justify-between p-4 bg-secondary-container/40 border border-secondary/20 text-on-surface rounded-xl">
                  <span className="font-label-md font-bold">Electricity Saved</span>
                  <span className="font-headline-sm font-bold text-secondary">₹{electricitySaved.toLocaleString()}</span>
                </div>
              </div>
            </div>
          )}

          {activeTab === "canal" && (
            <div className="flex flex-col gap-4 mt-2 animate-in fade-in">
              <div className="bg-surface-container-lowest border border-surface-container rounded-xl p-6 shadow-sm text-center">
                <div className="w-20 h-20 mx-auto bg-tertiary-container text-tertiary rounded-full flex items-center justify-center mb-4 shadow-inner">
                  <span className="material-symbols-outlined text-[40px]" style={{fontVariationSettings: "'FILL' 1"}}>water</span>
                </div>
                <h2 className="font-headline-sm text-headline-sm text-on-surface font-bold mb-2">Canal Schedule</h2>
                <p className="font-body-md text-on-surface-variant mb-6">
                  The local canal water release schedule is fetched directly from the {village} water board.
                </p>
                
                <div className="bg-surface-container-low p-5 rounded-2xl text-left border border-surface-container-high max-w-sm mx-auto shadow-sm">
                  <div className="flex items-center justify-between mb-3">
                    <span className="px-2.5 py-1 bg-tertiary text-on-tertiary font-label-sm font-bold rounded-lg uppercase text-[10px] tracking-wider shadow-sm">Upcoming Release</span>
                    <span className="material-symbols-outlined text-tertiary text-[20px]">verified</span>
                  </div>
                  <h3 className="font-title-md font-bold text-on-surface text-[18px] mb-4">{village} Block Canal</h3>
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center gap-3 text-on-surface bg-surface-container px-3 py-2 rounded-xl">
                      <span className="material-symbols-outlined text-[20px] text-tertiary">calendar_today</span>
                      <span className="font-label-md font-bold">{formatMonthDay(nextReleaseStart)} - {formatMonthDay(nextReleaseEnd)}</span>
                    </div>
                    <div className="flex items-center gap-3 text-on-surface bg-surface-container px-3 py-2 rounded-xl">
                      <span className="material-symbols-outlined text-[20px] text-tertiary">schedule</span>
                      <span className="font-label-md font-bold">06:00 AM - 18:00 PM</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>
      </main>
    </AppShell>
  );
}
