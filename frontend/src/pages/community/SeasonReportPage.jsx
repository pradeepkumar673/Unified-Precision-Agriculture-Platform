import { useState, useEffect } from "react";
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer
} from "recharts";
import { getSeasonReport } from "../../api/communityApi";
import { getFarmProfile } from "../../api/farmApi";
import AppShell from "../../layouts/AppShell";

export default function SeasonReportPage() {
  const farmId = localStorage.getItem("farmId") || "00000000-0000-0000-0000-000000000000";
  const [farmData, setFarmData] = useState(null);
  
  const [season, setSeason] = useState("kharif");
  const [year, setYear] = useState("2024"); // updated to 2024 to be more realistic
  
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchData = async () => {
    setLoading(true);
    setError("");
    try {
      const [farmRes, reportRes] = await Promise.allSettled([
        getFarmProfile(farmId),
        getSeasonReport(farmId, season, year)
      ]);
      
      if (farmRes.status === "fulfilled") setFarmData(farmRes.value.data);
      if (reportRes.status === "fulfilled") {
        setReport(reportRes.value);
      } else {
        setError("Unable to load the season report. Backend may not have data for this season/year.");
      }
    } catch (err) {
      setError("An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [season, year]);

  const farmName = farmData?.name || "Your Farm";

  return (
    <AppShell title="Season Report" showBackButton>
      <main className="flex flex-col w-full pt-20 pb-24 px-margin bg-surface flex-1 gap-space-md">
        
        {/* Header */}
        <div className="flex flex-col gap-3">
          <div>
            <h1 className="font-headline-md text-headline-md text-on-surface font-bold">End-of-Season Report</h1>
            <p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">
              {farmName} — Financial scorecard &amp; AI insights
            </p>
          </div>
          
          <div className="flex items-center gap-2 bg-surface-container rounded-xl p-2 w-max">
            <select value={season} onChange={e => setSeason(e.target.value)} 
              className="bg-transparent border-none font-label-md text-label-md text-on-surface focus:ring-0 cursor-pointer capitalize">
              <option value="kharif">Kharif</option>
              <option value="rabi">Rabi</option>
              <option value="zaid">Zaid</option>
            </select>
            <div className="w-px h-5 bg-surface-container-high mx-1"></div>
            <select value={year} onChange={e => setYear(e.target.value)} 
              className="bg-transparent border-none font-label-md text-label-md text-on-surface focus:ring-0 cursor-pointer">
              <option value="2024">2024</option>
              <option value="2023">2023</option>
              <option value="2022">2022</option>
            </select>
          </div>
        </div>

        {/* Loading / Error States */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <span className="material-symbols-outlined text-[40px] text-primary animate-spin">progress_activity</span>
            <p className="font-label-md text-label-md text-on-surface-variant">Generating season report...</p>
          </div>
        )}
        
        {!loading && error && (
          <div className="bg-error-container text-on-error-container p-4 rounded-2xl flex items-center gap-3">
            <span className="material-symbols-outlined text-[24px]">error</span>
            <span className="font-label-md text-label-md">{error}</span>
          </div>
        )}

        {/* Dashboard Content */}
        {!loading && report && (
          <>
            {/* KPI Summary Card */}
            <section className="bg-surface-container-lowest rounded-2xl shadow-sm border border-surface-container/30 overflow-hidden relative">
              <div className="absolute top-0 right-0 p-4 opacity-5">
                <span className="material-symbols-outlined text-[100px] text-primary">summarize</span>
              </div>
              <div className="p-space-md relative z-10 flex flex-col gap-4">
                <h2 className="font-headline-sm text-headline-sm text-on-surface font-bold">Season Summary</h2>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="font-label-sm text-label-sm text-on-surface-variant mb-0.5">Total Income</p>
                    <p className="font-headline-sm text-headline-sm text-primary font-bold">
                      Rs.{(report.income || 0).toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="font-label-sm text-label-sm text-on-surface-variant mb-0.5">Total Investment</p>
                    <p className="font-headline-sm text-headline-sm text-secondary font-bold">
                      Rs.{(report.investment || 0).toLocaleString()}
                    </p>
                  </div>
                </div>

                <div className="pt-4 border-t border-surface-container-high flex justify-between items-end">
                  <div>
                    <p className="font-label-sm text-label-sm text-on-surface-variant mb-0.5">Net Profit</p>
                    <p className="font-headline-md text-headline-md text-on-surface font-bold">
                      Rs.{(report.profit || 0).toLocaleString()}
                    </p>
                  </div>
                  <div className={`flex items-center gap-1 px-3 py-1.5 rounded-full font-label-md font-bold ${report.roi_pct >= 0 ? 'bg-primary-container text-on-primary-container' : 'bg-error-container text-on-error-container'}`}>
                    <span className="material-symbols-outlined text-[18px]">
                      {report.roi_pct >= 0 ? "trending_up" : "trending_down"}
                    </span>
                    <span>{report.roi_pct}% ROI</span>
                  </div>
                </div>
              </div>
            </section>

            {/* Timeline Chart */}
            <section className="bg-surface-container-lowest rounded-2xl p-space-md shadow-sm">
              <h2 className="font-headline-sm text-headline-sm text-on-surface font-bold mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[22px]">ssid_chart</span>
                Income vs Investment
              </h2>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={report.timeline || []} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--md-sys-color-primary)" stopOpacity={0.4}/>
                        <stop offset="95%" stopColor="var(--md-sys-color-primary)" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorInvest" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--md-sys-color-secondary)" stopOpacity={0.4}/>
                        <stop offset="95%" stopColor="var(--md-sys-color-secondary)" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--md-sys-color-surface-container-highest)" vertical={false} />
                    <XAxis dataKey="month" stroke="var(--md-sys-color-on-surface-variant)" tick={{fill: 'var(--md-sys-color-on-surface-variant)', fontSize: 12}} tickLine={false} axisLine={false} />
                    <YAxis stroke="var(--md-sys-color-on-surface-variant)" tick={{fill: 'var(--md-sys-color-on-surface-variant)', fontSize: 12}} tickLine={false} axisLine={false} tickFormatter={v => `Rs.${v/1000}k`} />
                    <RechartsTooltip 
                      contentStyle={{ backgroundColor: 'var(--md-sys-color-surface-container-highest)', borderColor: 'transparent', borderRadius: '12px', color: 'var(--md-sys-color-on-surface)' }}
                      itemStyle={{ color: 'var(--md-sys-color-on-surface)' }}
                      formatter={(val) => `Rs.${val.toLocaleString()}`}
                    />
                    <Area type="monotone" dataKey="investment" name="Investment" stroke="var(--md-sys-color-secondary)" strokeWidth={3} fillOpacity={1} fill="url(#colorInvest)" />
                    <Area type="monotone" dataKey="income" name="Income" stroke="var(--md-sys-color-primary)" strokeWidth={3} fillOpacity={1} fill="url(#colorIncome)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </section>

            {/* AI Suggestions */}
            <section className="bg-gradient-to-br from-primary-container via-surface-container-lowest to-surface-container-lowest border border-primary/20 rounded-2xl p-space-md shadow-sm">
              <h2 className="font-headline-sm text-headline-sm text-on-surface font-bold mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[22px]">lightbulb</span>
                AI Agronomic &amp; Financial Suggestions
              </h2>
              <div className="flex flex-col gap-3">
                {report.suggestions && report.suggestions.length > 0 ? (
                  report.suggestions.map((sug, i) => (
                    <div key={i} className="bg-surface-container rounded-xl p-3 flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center text-on-primary font-bold text-xs flex-shrink-0 mt-0.5">
                        {i + 1}
                      </div>
                      <p className="font-body-sm text-body-sm text-on-surface leading-relaxed">{sug}</p>
                    </div>
                  ))
                ) : (
                  <p className="font-body-sm text-body-sm text-on-surface-variant italic">No insights available for this season.</p>
                )}
              </div>
            </section>
          </>
        )}

      </main>
    </AppShell>
  );
}
