import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function WaterDemandForecast() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('forecast'); // forecast, budget, canal
  const [pumpActive, setPumpActive] = useState(false);

  return (
    <div className="min-h-screen bg-surface text-on-surface flex flex-col pt-safe pb-safe relative">
      {/* Top Header */}
      <header className="fixed top-0 w-full z-50 bg-surface/95 backdrop-blur-xl shadow-[0_2px_12px_rgba(27,94,32,0.06)] pt-safe">
        <div className="h-28 px-gutter flex flex-col justify-between py-space-xs">
          <div className="flex items-center justify-between gap-space-xs">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-[28px]" style={{ fontVariationSettings: "'FILL' 1" }}>eco</span>
              <span className="font-headline-sm text-headline-sm text-primary font-bold tracking-tight">KhetSaathi</span>
            </div>
            <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-surface-container text-on-surface hover:bg-surface-container-high transition-colors min-h-[48px] max-w-[190px] border border-outline-variant/40" type="button">
              <span className="material-symbols-outlined text-[18px] text-primary shrink-0">psychiatry</span>
              <span className="font-label-md text-label-md truncate font-semibold text-primary">Plot 1 • Wheat (4.5 Ac)</span>
              <span className="material-symbols-outlined text-[18px] text-on-surface-variant shrink-0">arrow_drop_down</span>
            </button>
            <div className="flex items-center gap-1.5">
              <button className="min-h-[48px] min-w-[48px] px-2.5 rounded-full bg-surface-container text-primary flex items-center justify-center font-label-md text-label-md border border-outline-variant/50 hover:bg-surface-container-high transition-colors" type="button">
                EN
              </button>
              <button className="min-h-[48px] min-w-[48px] rounded-full bg-primary-container text-on-primary flex items-center justify-center shadow-sm active:scale-95 transition-transform" type="button">
                <span className="material-symbols-outlined text-[20px]">volume_up</span>
              </button>
            </div>
          </div>
          <div className="flex items-center justify-between pb-1">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-surface-container-low border border-outline-variant/30">
              <span className="w-2 h-2 rounded-full bg-[#2E7D32] animate-pulse"></span>
              <span className="font-label-sm text-label-sm text-on-surface-variant font-medium">Synced 1m ago • Offline Ready</span>
            </div>
            <h1 className="font-label-lg text-label-lg text-primary truncate pr-1">Irrigation Water Management</h1>
          </div>
        </div>
      </header>

      <main className="flex flex-col relative w-full pt-32 pb-24 bg-surface flex-1">
        <div className="flex flex-col w-full px-gutter gap-space-md py-space-sm">
          {/* Segmented View Switcher & Context Pill */}
          <div className="flex flex-col gap-space-xs">
            <div className="flex items-center gap-1.5 p-1 bg-surface-container rounded-full shadow-sm">
              <button onClick={() => setActiveTab('forecast')} className={`flex-1 py-2 px-3 rounded-full font-label-md text-label-md text-center transition-all flex items-center justify-center gap-1 min-h-[44px] ${activeTab === 'forecast' ? 'bg-primary text-on-primary' : 'text-on-surface-variant hover:text-on-surface'}`} type="button">
                <span className="material-symbols-outlined text-[18px]">calendar_view_week</span>
                <span>7-Day Forecast</span>
              </button>
              <button onClick={() => setActiveTab('budget')} className={`flex-1 py-2 px-3 rounded-full font-label-md text-label-md text-center transition-all flex items-center justify-center gap-1 min-h-[44px] ${activeTab === 'budget' ? 'bg-primary text-on-primary' : 'text-on-surface-variant hover:text-on-surface'}`} type="button">
                <span className="material-symbols-outlined text-[18px]">water_full</span>
                <span>Budget</span>
              </button>
              <button onClick={() => setActiveTab('canal')} className={`flex-1 py-2 px-3 rounded-full font-label-md text-label-md text-center transition-all flex items-center justify-center gap-1 min-h-[44px] ${activeTab === 'canal' ? 'bg-primary text-on-primary' : 'text-on-surface-variant hover:text-on-surface'}`} type="button">
                <span className="material-symbols-outlined text-[18px]">schedule</span>
                <span>Canal</span>
              </button>
            </div>
            <div className="flex items-center justify-between px-2 py-1.5 bg-surface-container-low rounded-xl">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[20px]">agriculture</span>
                <span className="font-label-sm text-label-sm text-on-surface-variant font-semibold">Plot 1 (Wheat) • 4.5 Acres • Day 42 (Tillering)</span>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-primary-fixed text-on-primary-fixed font-label-sm text-label-sm">Active Cycle</span>
            </div>
          </div>

          {/* Hero Forecast Visual Chart Card */}
          <div className="bg-surface-container-lowest rounded-xl p-space-md shadow-sm flex flex-col gap-space-md">
            <div className="flex items-start justify-between gap-space-xs">
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-tertiary-container text-[22px]">ssid_chart</span>
                  <h2 className="font-headline-sm text-headline-sm text-on-surface">7-Day Irrigation Forecast</h2>
                </div>
                <p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">
                  Dynamic water calculation calibrated for solar heat, soil moisture, and wheat crown root stage.
                </p>
              </div>
              <button className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center text-primary shrink-0 active:scale-95" type="button">
                <span className="material-symbols-outlined text-[20px]">info</span>
              </button>
            </div>

            {/* Chart Visualizer */}
            <div className="flex flex-col bg-surface-container-low rounded-xl p-space-sm pt-space-md">
              <div className="flex items-center justify-between px-1 mb-2">
                <span className="font-label-sm text-label-sm text-on-surface-variant">Recommended Delivery (Liters)</span>
                <span className="font-label-sm text-label-sm text-primary font-bold">Max Peak: 18,500 L</span>
              </div>
              
              <div className="grid grid-cols-7 gap-1.5 items-end h-56 pt-2 pb-1">
                {/* Mon */}
                <div className="flex flex-col items-center h-full justify-end group">
                  <span className="font-label-sm text-label-sm text-primary font-bold mb-1">18.5k</span>
                  <div className="w-full bg-surface-container-high rounded-t-lg h-36 relative flex flex-col justify-end overflow-hidden shadow-sm">
                    <div className="w-full bg-tertiary-container h-full rounded-t-lg transition-all relative flex items-start justify-center pt-1">
                      <span className="text-[10px] font-bold text-on-tertiary tracking-tighter">TODAY</span>
                    </div>
                  </div>
                  <div className="mt-2 flex flex-col items-center text-center">
                    <span className="material-symbols-outlined text-secondary text-[18px]">sunny</span>
                    <span className="font-label-sm text-label-sm font-bold text-on-surface">Mon</span>
                    <span className="text-[11px] text-on-surface-variant">32°C</span>
                  </div>
                </div>
                {/* Tue */}
                <div className="flex flex-col items-center h-full justify-end group opacity-85">
                  <span className="font-label-sm text-label-sm text-on-surface-variant mb-1">0 L</span>
                  <div className="w-full bg-surface-container rounded-t-lg h-5 relative flex items-center justify-center">
                    <span className="w-1.5 h-1.5 rounded-full bg-outline-variant"></span>
                  </div>
                  <div className="mt-2 flex flex-col items-center text-center">
                    <span className="material-symbols-outlined text-secondary text-[18px]">sunny</span>
                    <span className="font-label-sm text-label-sm font-medium text-on-surface">Tue</span>
                    <span className="text-[11px] text-on-surface-variant">31°C</span>
                  </div>
                </div>
                {/* Wed */}
                <div className="flex flex-col items-center h-full justify-end group opacity-85">
                  <span className="font-label-sm text-label-sm text-on-surface-variant mb-1">0 L</span>
                  <div className="w-full bg-surface-container rounded-t-lg h-5 relative flex items-center justify-center">
                    <span className="w-1.5 h-1.5 rounded-full bg-outline-variant"></span>
                  </div>
                  <div className="mt-2 flex flex-col items-center text-center">
                    <span className="material-symbols-outlined text-tertiary text-[18px]">partly_cloudy_day</span>
                    <span className="font-label-sm text-label-sm font-medium text-on-surface">Wed</span>
                    <span className="text-[11px] text-on-surface-variant">29°C</span>
                  </div>
                </div>
                {/* Thu */}
                <div className="flex flex-col items-center h-full justify-end group">
                  <span className="font-label-sm text-label-sm text-tertiary-container font-semibold mb-1">14k</span>
                  <div className="w-full bg-surface-container-high rounded-t-lg h-28 relative flex flex-col justify-end overflow-hidden">
                    <div className="w-full bg-tertiary rounded-t-lg h-full transition-all"></div>
                  </div>
                  <div className="mt-2 flex flex-col items-center text-center">
                    <span className="material-symbols-outlined text-secondary text-[18px]">sunny</span>
                    <span className="font-label-sm text-label-sm font-semibold text-on-surface">Thu</span>
                    <span className="text-[11px] text-on-surface-variant">33°C</span>
                  </div>
                </div>
                {/* Fri */}
                <div className="flex flex-col items-center h-full justify-end group">
                  <span className="font-label-sm text-label-sm text-tertiary font-bold mb-1">Rain</span>
                  <div className="w-full bg-tertiary-fixed rounded-t-lg h-7 relative flex items-center justify-center">
                    <span className="material-symbols-outlined text-tertiary text-[14px]">grain</span>
                  </div>
                  <div className="mt-2 flex flex-col items-center text-center">
                    <span className="material-symbols-outlined text-tertiary-container text-[18px]">rainy</span>
                    <span className="font-label-sm text-label-sm font-semibold text-tertiary-container">Fri</span>
                    <span className="text-[11px] text-tertiary font-bold">4mm</span>
                  </div>
                </div>
                {/* Sat */}
                <div className="flex flex-col items-center h-full justify-end group opacity-85">
                  <span className="font-label-sm text-label-sm text-on-surface-variant mb-1">0 L</span>
                  <div className="w-full bg-surface-container rounded-t-lg h-5 relative flex items-center justify-center">
                    <span className="w-1.5 h-1.5 rounded-full bg-outline-variant"></span>
                  </div>
                  <div className="mt-2 flex flex-col items-center text-center">
                    <span className="material-symbols-outlined text-tertiary text-[18px]">cloud</span>
                    <span className="font-label-sm text-label-sm font-medium text-on-surface">Sat</span>
                    <span className="text-[11px] text-on-surface-variant">29°C</span>
                  </div>
                </div>
                {/* Sun */}
                <div className="flex flex-col items-center h-full justify-end group">
                  <span className="font-label-sm text-label-sm text-tertiary-container font-semibold mb-1">16.5k</span>
                  <div className="w-full bg-surface-container-high rounded-t-lg h-32 relative flex flex-col justify-end overflow-hidden">
                    <div className="w-full bg-tertiary rounded-t-lg h-full transition-all"></div>
                  </div>
                  <div className="mt-2 flex flex-col items-center text-center">
                    <span className="material-symbols-outlined text-secondary text-[18px]">sunny</span>
                    <span className="font-label-sm text-label-sm font-semibold text-on-surface">Sun</span>
                    <span className="text-[11px] text-on-surface-variant">32°C</span>
                  </div>
                </div>
              </div>

              <div className="mt-3 pt-2.5 flex items-center justify-between text-on-surface-variant">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-tertiary-container"></span>
                  <span className="font-label-sm text-label-sm">Scheduled</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-tertiary-fixed"></span>
                  <span className="font-label-sm text-label-sm">Rain</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-surface-container-highest"></span>
                  <span className="font-label-sm text-label-sm">Rest</span>
                </div>
              </div>
            </div>

            {/* Active Day Deep-Dive */}
            <div className="bg-primary-fixed/20 p-space-sm rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-on-primary">
                  <span className="material-symbols-outlined text-[22px]">water</span>
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-label-md text-label-md text-on-surface font-bold">Today's Session: Mon</span>
                    <span className="px-2 py-[2px] rounded-full bg-secondary-container text-on-primary font-label-sm text-label-sm">Recommended</span>
                  </div>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">18,500 L required • Approx 3.5 hrs run time (7.5 HP Pump)</p>
                </div>
              </div>
              <button onClick={() => setPumpActive(true)} className="px-3 py-2 rounded-lg bg-surface-container-lowest text-primary font-label-md text-label-md shadow-sm active:scale-95" type="button">
                {pumpActive ? 'Active' : 'Start'}
              </button>
            </div>
          </div>

          {/* Weekly Summary Insights */}
          <div className="bg-surface-container-lowest rounded-xl p-space-md shadow-sm flex flex-col gap-space-sm">
            <div className="flex items-center justify-between">
              <span className="font-headline-sm text-headline-sm text-on-surface">Weekly Irrigation Metrics</span>
              <span className="px-2.5 py-1 rounded-full bg-primary-fixed text-on-primary-fixed font-label-sm text-label-sm font-bold flex items-center gap-1">
                <span className="material-symbols-outlined text-[16px]">eco</span>
                +20% Efficiency
              </span>
            </div>
            <div className="grid grid-cols-2 gap-space-xs mt-1">
              <div className="bg-surface-container-low p-space-sm rounded-xl flex flex-col justify-between">
                <div className="flex items-center gap-1 text-on-surface-variant">
                  <span className="material-symbols-outlined text-[18px]">opacity</span>
                  <span className="font-label-sm text-label-sm">Total Demand</span>
                </div>
                <div className="mt-2">
                  <span className="font-headline-md text-headline-md text-primary font-bold">49,000</span>
                  <span className="font-label-sm text-label-sm text-on-surface-variant"> Liters</span>
                </div>
                <span className="text-[12px] text-on-surface-variant mt-0.5">Across 3 irrigation cycles</span>
              </div>
              <div className="bg-surface-container-low p-space-sm rounded-xl flex flex-col justify-between">
                <div className="flex items-center gap-1 text-on-surface-variant">
                  <span className="material-symbols-outlined text-[18px]">savings</span>
                  <span className="font-label-sm text-label-sm">Water Conserved</span>
                </div>
                <div className="mt-2">
                  <span className="font-headline-md text-headline-md text-secondary-container font-bold">12,500</span>
                  <span className="font-label-sm text-label-sm text-on-surface-variant"> Liters</span>
                </div>
                <span className="text-[12px] text-on-surface-variant mt-0.5">vs traditional flood practice</span>
              </div>
            </div>
            <div className="flex items-start gap-2.5 p-space-sm bg-tertiary-fixed/30 rounded-xl mt-1">
              <span className="material-symbols-outlined text-tertiary-container text-[24px] shrink-0 mt-0.5">shower</span>
              <div className="flex flex-col">
                <span className="font-label-md text-label-md text-tertiary-container font-bold">Rain Forecast Friday (4mm)</span>
                <p className="font-body-sm text-body-sm text-on-surface-variant">
                  Friday irrigation skipped automatically. Conserves roughly 11,000 L of groundwater and avoids fertilizer leaching.
                </p>
              </div>
            </div>
          </div>

          {/* Soil Moisture Visual Check */}
          <div className="bg-surface-container-lowest rounded-xl p-space-md shadow-sm flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative w-12 h-12 flex items-center justify-center">
                <svg className="w-12 h-12 transform -rotate-90" viewBox="0 0 36 36">
                  <path className="text-surface-container-highest" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="3.5"></path>
                  <path className="text-primary-container" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeDasharray="52, 100" strokeLinecap="round" strokeWidth="3.5"></path>
                </svg>
                <span className="absolute font-label-md text-label-md font-bold text-primary">52%</span>
              </div>
              <div>
                <span className="font-label-md text-label-md text-on-surface font-semibold">Plot Root Zone Moisture</span>
                <p className="font-body-sm text-body-sm text-on-surface-variant">Optimal field capacity for wheat root branch.</p>
              </div>
            </div>
            <span className="material-symbols-outlined text-primary text-[24px]">verified</span>
          </div>

          <div className="flex flex-col gap-space-xs mt-1">
            <button className="w-full min-h-[52px] bg-primary text-on-primary rounded-xl font-label-lg text-label-lg flex items-center justify-center gap-2 shadow-sm active:scale-[0.98] transition-transform" type="button">
              <span className="material-symbols-outlined text-[22px]">smart_toy</span>
              <span>Set Pump Automation / Reminder</span>
              <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
            </button>
            <button className="w-full min-h-[48px] bg-surface-container text-on-surface rounded-xl font-label-md text-label-md flex items-center justify-center gap-2 active:bg-surface-container-high transition-colors" type="button">
              <span className="material-symbols-outlined text-[20px] text-primary">ios_share</span>
              <span>Export Schedule for Canal Warden / FPO</span>
            </button>
          </div>
        </div>
      </main>

      {/* Bottom Nav */}
      <nav className="fixed bottom-0 w-full z-50 pb-safe bg-surface/95 backdrop-blur-xl shadow-[0_-4px_14px_rgba(27,94,32,0.06)]">
        <div className="flex justify-around items-center h-16 px-1">
          {[
            { icon: 'home', label: 'Home', to: '/app' },
            { icon: 'calendar_month', label: 'Plan', to: '/planning/crop-plan' },
            { icon: 'water_drop', label: 'Water', to: '/water-soil/irrigation', active: true },
            { icon: 'storefront', label: 'Market', to: '/marketplace/inputs' },
            { icon: 'notifications', label: 'Alerts', to: '/community/alerts' },
            { icon: 'person', label: 'Profile', to: '/farm/profile' },
          ].map(({ icon, label, to, active }) => (
            <button key={label} onClick={() => navigate(to)} className={`flex flex-col items-center justify-center min-h-[48px] min-w-[48px] px-1 py-1 transition-colors ${active ? 'text-primary font-bold' : 'text-on-surface-variant'}`} type="button">
              <span className="material-symbols-outlined text-[24px]">{icon}</span>
              <span className="font-label-sm text-label-sm mt-0.5">{label}</span>
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
}
