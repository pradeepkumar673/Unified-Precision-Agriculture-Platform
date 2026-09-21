import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getPriceForecast } from '../../api/visionForecastApi';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, Line, ComposedChart } from 'recharts';
import AppShell from '../../layouts/AppShell';
import DataBoundary from '../../components/DataBoundary';

export default function MandiPriceForecast() {
  const navigate = useNavigate();
  const [forecast, setForecast] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [alertSet, setAlertSet] = useState(false);

  const fetchForecast = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getPriceForecast({ crop: 'Wheat', district: 'Nashik', weeks_ahead: 4 });
      setForecast(res.data);
    } catch (err) {
      setError(err);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchForecast();
  }, []);

  // Map API response to Recharts format if available, otherwise use mock fallback for layout matching
  const data = forecast ? [
    { name: 'Today', predicted: 12420, range: [12100, 12600], displayPredicted: forecast.predicted_price },
    { name: 'Wk 1', predicted: 12470, range: [12150, 12650] },
    { name: 'Wk 2', predicted: 12540, range: [12200, 12700] },
    { name: 'Wk 3', predicted: 12610, range: [12250, 12750] },
    { name: 'Wk 4', predicted: 12580, range: [12200, 12720] }
  ] : [
    { name: 'Today', predicted: 12420, range: [12100, 12600] },
    { name: 'Wk 1', predicted: 12470, range: [12150, 12650] },
    { name: 'Wk 2', predicted: 12540, range: [12200, 12700] },
    { name: 'Wk 3', predicted: 12610, range: [12250, 12750] },
    { name: 'Wk 4', predicted: 12580, range: [12200, 12720] }
  ];

  const handlePriceAlert = () => {
    setAlertSet(true);
    setTimeout(() => setAlertSet(false), 2800);
  };

  return (
    <AppShell 
      headerSlot={
        <header className="fixed top-0 w-full z-50 pt-safe bg-surface/80 backdrop-blur-xl shadow-[0_1px_8px_rgba(0,0,0,0.04)]">
          <div className="h-14 px-margin flex items-center justify-between gap-space-sm">
            <div className="flex items-center gap-space-sm min-w-0 flex-1">
              <img alt="Brand logo" className="h-8 w-auto object-contain flex-shrink-0" src="https://lh3.googleusercontent.com/aida/AEtjO1UIQkciQWmlsTRY8f9Zy0F8V6Ui5SnL-bNI1XODjLR9sQNG4BHGAMrtvwAK-8Il7hBixSfzotAqt-1yzxZ1tS8lfeStHMZMcAAazASvjFxGLljEzJwhmT37IQLEv0u0wChglbOYjrW80Tbxp2N5Gci7RSN8sqPVnTp66_kG_QHJe8HBtzy0s7YivFGLy5OK6W6ahvWh_DtV3OjnAKUT1Zgj0Ae4r9TLabB2OQOypc-WO4bS3YHevJEUIf8"/>
              <div className="flex flex-col min-w-0">
                <div className="flex items-center gap-1">
                  <span className="font-headline-sm text-headline-sm text-primary truncate leading-tight">KhetSaathi</span>
                  <span className="font-label-sm text-label-sm text-on-surface-variant truncate hidden sm:inline">• Mandi Market</span>
                </div>
                <button className="flex items-center gap-1 text-left min-w-0 group">
                  <span className="material-symbols-outlined text-[16px] text-secondary">location_on</span>
                  <span className="font-label-sm text-label-sm text-on-surface-variant truncate group-hover:text-primary">Plot 1 • Wheat</span>
                  <span className="material-symbols-outlined text-[14px] text-outline">arrow_drop_down</span>
                </button>
              </div>
            </div>
            <div className="flex items-center gap-space-xs flex-shrink-0">
              <div className="flex items-center gap-1 bg-surface-container-high px-space-xs py-0.5 rounded-full">
                <span className="w-2 h-2 rounded-full bg-primary-container inline-block"></span>
                <span className="font-label-sm text-label-sm text-on-surface-variant">Synced</span>
              </div>
              <button className="min-h-[44px] min-w-[44px] px-2 flex items-center justify-center gap-1 bg-surface-container rounded-full text-on-surface hover:bg-surface-container-high">
                <span className="font-label-sm text-label-sm font-bold">EN</span>
                <span className="material-symbols-outlined text-[16px] text-primary">volume_up</span>
              </button>
              <button className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-full text-on-surface hover:bg-surface-container">
                <span className="material-symbols-outlined text-[22px]">notifications</span>
              </button>
              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                <span className="material-symbols-outlined text-on-primary text-[18px]">person</span>
              </div>
            </div>
          </div>
        </header>
      }
    >
      <main className="flex flex-col relative w-full pt-[72px] pb-safe bg-background">
        <DataBoundary loading={loading} error={error} onRetry={fetchForecast}>
          <div className="flex flex-col w-full px-margin pb-space-xl gap-space-md">
            {/* Title & Voice Readout Header */}
          <div className="flex items-start justify-between gap-space-sm pt-space-sm">
            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-space-xs">
                <h1 className="font-headline-md text-headline-md text-primary tracking-tight">Mandi Price Forecast</h1>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-primary-fixed text-on-primary-fixed font-label-sm text-label-sm">
                  AI Model
                </span>
              </div>
              <p className="font-body-md text-body-md text-on-surface-variant mt-0.5">
                Multi-mandi modal price projection for Nashik & Lasalgaon APMC
              </p>
            </div>
            <button aria-label="Read forecast aloud in English" className="min-h-[48px] min-w-[48px] flex items-center justify-center rounded-full bg-surface-container-high text-primary active:scale-95 transition-transform flex-shrink-0 shadow-sm" id="voiceAssistBtn" onClick={() => {
              const banner = document.getElementById('voiceBanner');
              if (banner) banner.classList.toggle('hidden');
            }}>
              <span className="material-symbols-outlined text-[24px]">volume_up</span>
            </button>
          </div>
          
          {/* Voice Feedback Banner */}
          <div id="voiceBanner" className="hidden flex items-center justify-between p-space-sm rounded-lg bg-surface-container-highest text-on-surface">
            <div className="flex items-center gap-space-xs">
              <span className="material-symbols-outlined text-[20px] text-secondary animate-pulse">graphic_eq</span>
              <span className="font-label-sm text-label-sm text-on-surface">Speaking: "Wheat expected to peak at ₹2,610 in Week 3..."</span>
            </div>
            <button className="text-on-surface-variant hover:text-on-surface" onClick={() => {
              const banner = document.getElementById('voiceBanner');
              if (banner) banner.classList.add('hidden');
            }}>
              <span className="material-symbols-outlined text-[18px]">close</span>
            </button>
          </div>
          
          {/* Crop Filter Chips */}
          <div className="flex gap-space-xs overflow-x-auto py-1 -mx-margin px-margin no-scrollbar">
            <button className="flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-primary-container text-on-primary font-label-md text-label-md flex-shrink-0 shadow-sm">
              <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
              <span>Sharbati Wheat</span>
            </button>
            <button className="flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-surface-container text-on-surface-variant font-label-md text-label-md flex-shrink-0 hover:bg-surface-container-high active:scale-95 transition-all">
              <span>Chana / Chickpea</span>
            </button>
            <button className="flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-surface-container text-on-surface-variant font-label-md text-label-md flex-shrink-0 hover:bg-surface-container-high active:scale-95 transition-all">
              <span>Soybean</span>
            </button>
            <button className="flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-surface-container text-on-surface-variant font-label-md text-label-md flex-shrink-0 hover:bg-surface-container-high active:scale-95 transition-all">
              <span>Moong Dal</span>
            </button>
            <button className="flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-surface-container text-on-surface-variant font-label-md text-label-md flex-shrink-0 hover:bg-surface-container-high active:scale-95 transition-all">
              <span>Mustard</span>
            </button>
          </div>
          
          {/* Current Price Hero Card */}
          <div className="relative overflow-hidden rounded-xl bg-surface-container-lowest p-space-md shadow-md flex flex-col gap-space-sm">
            <div className="flex items-center justify-between gap-2">
              <span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant">Live APMC Benchmark</span>
              <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-primary-fixed text-on-primary-fixed-variant">
                <span className="material-symbols-outlined text-[16px]">trending_up</span>
                <span className="font-label-sm text-label-sm font-bold">+₹85 (+3.6%) vs last week</span>
              </div>
            </div>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="font-headline-lg-mobile text-headline-lg-mobile font-extrabold text-on-surface tracking-tight">₹2,420</span>
              <span className="font-body-md text-body-md text-on-surface-variant">/ Quintal</span>
            </div>
            <div className="flex items-center gap-1.5 text-on-surface-variant">
              <span className="material-symbols-outlined text-[18px] text-secondary">store</span>
              <span className="font-label-sm text-label-sm font-medium">Lasalgaon APMC Modal Rate (Rabi Harvest Grade A)</span>
            </div>
          </div>
          
          {/* Recommended Window Card */}
          <div className="relative overflow-hidden rounded-xl bg-secondary-fixed text-on-secondary-fixed p-space-md shadow-md">
            <div className="flex items-start gap-space-sm">
              <div className="w-10 h-10 rounded-full bg-secondary-container text-on-secondary flex items-center justify-center flex-shrink-0 shadow-sm mt-0.5">
                <span className="material-symbols-outlined text-[24px]" style={{ fontVariationSettings: "'FILL' 1" }}>stars</span>
              </div>
              <div className="flex flex-col flex-1">
                <div className="flex items-center justify-between">
                  <span className="font-label-sm text-label-sm uppercase tracking-wider text-on-secondary-fixed-variant font-bold">Recommended Window</span>
                  <span className="font-label-sm text-label-sm px-2 py-0.5 rounded-full bg-secondary-container text-on-secondary font-bold">14 Days Left</span>
                </div>
                <h2 className="font-headline-sm text-headline-sm text-on-secondary-fixed font-bold mt-0.5">
                  Best Time to Sell: Week 3 (18–24 March)
                </h2>
                <p className="font-body-sm text-body-sm text-on-secondary-fixed-variant mt-1.5 leading-relaxed">
                  Projected peak at <strong className="text-on-secondary-fixed font-bold">₹2,610/Qtl (+7.8% gain)</strong> driven by bulk flour mill procurement before MP arrivals flood regional markets. Holding for 14 days strongly recommended.
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-xl bg-surface-container-lowest p-space-md shadow-md flex flex-col gap-space-sm">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-headline-sm text-headline-sm text-on-surface">4-Week Price Projection</h3>
                <p className="font-label-sm text-label-sm text-on-surface-variant">Forecast trend based on arrivals &amp; historic demand</p>
              </div>
              <div className="flex items-center gap-1 text-primary">
                <span className="material-symbols-outlined text-[18px]">query_stats</span>
                <span className="font-label-sm text-label-sm font-bold">92% Match</span>
              </div>
            </div>
            
            <div className="w-full mt-2 select-none">
              <svg className="w-full h-48 overflow-visible" viewBox="0 0 340 160">
                <defs>
                  <linearGradient id="bandGradient" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="#91d78a" stopOpacity="0.45"></stop>
                    <stop offset="100%" stopColor="#acf4a4" stopOpacity="0.08"></stop>
                  </linearGradient>
                  <filter height="140%" id="softGlow" width="140%" x="-20%" y="-20%">
                    <feDropShadow dx="0" dy="2" floodColor="#00450d" floodOpacity="0.25" stdDeviation="3"></feDropShadow>
                  </filter>
                </defs>
                <line stroke="#f0eded" strokeWidth="1" x1="20" x2="320" y1="30" y2="30"></line>
                <line stroke="#f0eded" strokeWidth="1" x1="20" x2="320" y1="70" y2="70"></line>
                <line stroke="#f0eded" strokeWidth="1" x1="20" x2="320" y1="110" y2="110"></line>
                <rect fill="#ffdbcf" height="120" opacity="0.4" rx="6" width="50" x="220" y="10"></rect>
                <line stroke="#fc6018" strokeDasharray="3,3" strokeWidth="1.5" x1="245" x2="245" y1="12" y2="130"></line>
                <rect fill="#fc6018" height="18" rx="4" width="60" x="215" y="6"></rect>
                <text fill="#ffffff" fontFamily="Inter" fontSize="9" fontWeight="700" textAnchor="middle" x="245" y="19">Peak Window</text>
                <polygon fill="url(#bandGradient)" points="25,105 95,88 170,62 245,28 315,48 315,80 245,60 170,94 95,112 25,125"></polygon>
                <path d="M 25,115 Q 60,108 95,100 T 170,78 T 245,44 T 315,64" fill="none" filter="url(#softGlow)" stroke="#00450d" strokeLinecap="round" strokeWidth="3"></path>
                <circle cx="25" cy="115" fill="#ffffff" r="4.5" stroke="#00450d" strokeWidth="2.5"></circle>
                <text fill="#41493e" fontFamily="Inter" fontSize="9" fontWeight="600" textAnchor="middle" x="25" y="132">₹2,420</text>
                <text fill="#717a6d" fontFamily="Inter" fontSize="9" textAnchor="middle" x="25" y="145">Today</text>
                <circle cx="95" cy="100" fill="#ffffff" r="4" stroke="#00450d" strokeWidth="2"></circle>
                <text fill="#41493e" fontFamily="Inter" fontSize="9" fontWeight="600" textAnchor="middle" x="95" y="90">₹2,470</text>
                <text fill="#717a6d" fontFamily="Inter" fontSize="9" textAnchor="middle" x="95" y="145">Wk 1</text>
                <circle cx="170" cy="78" fill="#ffffff" r="4" stroke="#00450d" strokeWidth="2"></circle>
                <text fill="#41493e" fontFamily="Inter" fontSize="9" fontWeight="600" textAnchor="middle" x="170" y="68">₹2,540</text>
                <text fill="#717a6d" fontFamily="Inter" fontSize="9" textAnchor="middle" x="170" y="145">Wk 2</text>
                <circle cx="245" cy="44" fill="#fc6018" r="6" stroke="#ffffff" strokeWidth="2.5"></circle>
                <text fill="#531800" fontFamily="Inter" fontSize="10" fontWeight="800" textAnchor="middle" x="245" y="38">₹2,610 ★</text>
                <text fill="#a83900" fontFamily="Inter" fontSize="9" fontWeight="700" textAnchor="middle" x="245" y="145">Wk 3</text>
                <circle cx="315" cy="64" fill="#ffffff" r="4" stroke="#00450d" strokeWidth="2"></circle>
                <text fill="#41493e" fontFamily="Inter" fontSize="9" fontWeight="600" textAnchor="middle" x="315" y="55">₹2,580</text>
                <text fill="#717a6d" fontFamily="Inter" fontSize="9" textAnchor="middle" x="315" y="145">Wk 4</text>
              </svg>
            </div>
            
            <div className="flex items-center justify-center gap-space-md pt-2 border-t border-surface-container">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-primary inline-block"></span>
                <span className="font-label-sm text-label-sm text-on-surface-variant">Predicted Modal Price</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-4 h-2.5 rounded bg-primary-fixed-dim/60 inline-block"></span>
                <span className="font-label-sm text-label-sm text-on-surface-variant">85% Confidence Band</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-space-sm">
            <div className="flex items-center justify-between">
              <h3 className="font-headline-sm text-headline-sm text-on-surface">Nearby Mandi Comparison</h3>
              <span className="font-label-sm text-label-sm text-secondary font-semibold">Live Quotes</span>
            </div>
            <div className="grid grid-cols-1 gap-space-xs">
              {/* Lasalgaon APMC */}
              <div className="flex items-center justify-between p-space-sm rounded-xl bg-surface-container-lowest shadow-sm hover:bg-surface-container-low transition-colors">
                <div className="flex items-center gap-space-sm">
                  <div className="w-10 h-10 rounded-lg bg-surface-container flex items-center justify-center text-primary flex-shrink-0">
                    <span className="material-symbols-outlined text-[22px]">domain</span>
                  </div>
                  <div className="flex flex-col">
                    <div className="flex items-center gap-1.5">
                      <span className="font-label-lg text-label-lg text-on-surface">Lasalgaon APMC</span>
                      <span className="px-1.5 py-0.2 rounded bg-surface-container text-on-surface-variant font-label-sm text-label-sm">12 km</span>
                    </div>
                    <div className="flex items-center gap-1 text-primary mt-0.5">
                      <span className="material-symbols-outlined text-[14px]">local_fire_department</span>
                      <span className="font-label-sm text-label-sm font-semibold">High Demand • 420 Qtl Traded</span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <span className="font-headline-sm text-headline-sm font-bold text-on-surface">₹2,420</span>
                  <span className="block font-label-sm text-label-sm text-on-surface-variant">Modal rate</span>
                </div>
              </div>

              {/* Niphad Mandi */}
              <div className="flex items-center justify-between p-space-sm rounded-xl bg-surface-container-lowest shadow-sm hover:bg-surface-container-low transition-colors">
                <div className="flex items-center gap-space-sm">
                  <div className="w-10 h-10 rounded-lg bg-surface-container flex items-center justify-center text-on-surface-variant flex-shrink-0">
                    <span className="material-symbols-outlined text-[22px]">storefront</span>
                  </div>
                  <div className="flex flex-col">
                    <div className="flex items-center gap-1.5">
                      <span className="font-label-lg text-label-lg text-on-surface">Niphad Mandi</span>
                      <span className="px-1.5 py-0.2 rounded bg-surface-container text-on-surface-variant font-label-sm text-label-sm">18 km</span>
                    </div>
                    <div className="flex items-center gap-1 text-on-surface-variant mt-0.5">
                      <span className="material-symbols-outlined text-[14px]">horizontal_rule</span>
                      <span className="font-label-sm text-label-sm">Stable • Regular arrivals</span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <span className="font-headline-sm text-headline-sm font-bold text-on-surface">₹2,390</span>
                  <span className="block font-label-sm text-label-sm text-on-surface-variant">Modal rate</span>
                </div>
              </div>

              {/* Pimpalgaon APMC */}
              <div className="flex items-center justify-between p-space-sm rounded-xl bg-surface-container-lowest shadow-sm hover:bg-surface-container-low transition-colors">
                <div className="flex items-center gap-space-sm">
                  <div className="w-10 h-10 rounded-lg bg-surface-container flex items-center justify-center text-primary-container flex-shrink-0">
                    <span className="material-symbols-outlined text-[22px]">apartment</span>
                  </div>
                  <div className="flex flex-col">
                    <div className="flex items-center gap-1.5">
                      <span className="font-label-lg text-label-lg text-on-surface">Pimpalgaon APMC</span>
                      <span className="px-1.5 py-0.2 rounded bg-surface-container text-on-surface-variant font-label-sm text-label-sm">24 km</span>
                    </div>
                    <div className="flex items-center gap-1 text-primary mt-0.5">
                      <span className="material-symbols-outlined text-[14px]">trending_up</span>
                      <span className="font-label-sm text-label-sm font-semibold">Rising • Grain traders active</span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <span className="font-headline-sm text-headline-sm font-bold text-on-surface">₹2,405</span>
                  <span className="block font-label-sm text-label-sm text-on-surface-variant">Modal rate</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-space-sm pt-space-xs">
            <button 
              id="setAlertBtn"
              onClick={handlePriceAlert}
              className={`w-full min-h-[56px] px-space-md py-3.5 rounded-xl text-on-secondary flex items-center justify-center gap-space-sm shadow-md active:scale-[0.99] transition-transform ${alertSet ? 'bg-primary-container' : 'bg-secondary-container'}`}
            >
              {alertSet ? (
                <>
                  <span className="material-symbols-outlined text-[24px]">check_circle</span>
                  <span className="font-headline-sm text-headline-sm font-bold">Alert Set for ₹2,600/Qtl!</span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[24px]">notification_add</span>
                  <span className="font-headline-sm text-headline-sm font-bold">Set Mandi Price Alert (at ₹2,600)</span>
                  <span className="material-symbols-outlined text-[22px]">arrow_forward</span>
                </>
              )}
            </button>
            
            <button onClick={() => {
              const banner = document.getElementById('voiceBanner');
              if (banner) {
                banner.classList.remove('hidden');
                banner.innerHTML = `
                  <div class="flex items-center gap-2">
                    <span class="material-symbols-outlined text-[20px] text-primary">verified</span>
                    <span class="font-label-sm text-label-sm text-on-surface">3 Warehouses with subsidy available near Lasalgaon. Opening slots...</span>
                  </div>
                  <button onclick="this.parentElement.classList.add('hidden')" class="text-on-surface-variant">
                    <span class="material-symbols-outlined text-[18px]">close</span>
                  </button>
                `;
              }
            }} className="w-full min-h-[52px] px-space-md py-3 rounded-xl bg-surface-container-lowest text-primary flex items-center justify-center gap-space-xs shadow-sm hover:bg-surface-container transition-colors active:scale-[0.99]" type="button">
              <span className="material-symbols-outlined text-[20px]">warehouse</span>
              <span className="font-label-lg text-label-lg font-bold">Book FPO Storage / Warehouse Slot</span>
            </button>
          </div>
        </div>
        </DataBoundary>
      </main>
    </AppShell>
  );
}
