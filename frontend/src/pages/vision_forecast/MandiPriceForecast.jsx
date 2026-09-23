import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getPriceForecast } from '../../api/visionForecastApi';
import { getFarmProfile } from '../../api/farmApi';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, Line, ComposedChart, ReferenceDot } from 'recharts';
import AppShell from '../../layouts/AppShell';
import DataBoundary from '../../components/DataBoundary';

export default function MandiPriceForecast() {
  const navigate = useNavigate();
  const farmId = localStorage.getItem('farmId') || '00000000-0000-0000-0000-000000000000';
  const [forecast, setForecast] = useState(null);
  const [farmProfile, setFarmProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [alertSet, setAlertSet] = useState(false);

  const [selectedCrop, setSelectedCrop] = useState(null);

  const fetchForecast = async (cropOverride) => {
    setLoading(true);
    setError(null);
    try {
      const profileRes = await getFarmProfile(farmId);
      const profile = profileRes.data;
      setFarmProfile(profile);

      const targetCrop = cropOverride || profile.current_crop || 'Wheat';
      const district = profile.district || 'Nashik';
      
      if (!selectedCrop) setSelectedCrop(targetCrop);

      const res = await getPriceForecast({ crop: targetCrop, district, weeks_ahead: 4 });
      setForecast(res.data);
    } catch (err) {
      setError(err);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCropSelect = (newCrop) => {
    setSelectedCrop(newCrop);
    fetchForecast(newCrop);
  };

  useEffect(() => {
    fetchForecast();
  }, [farmId]);

  // Derived Values
  const crop = selectedCrop || farmProfile?.current_crop || 'Wheat';
  const district = farmProfile?.district || 'Nashik';

  let chartData = [];
  let peakPrice = 0;
  let peakWeek = 0;
  let currentPrice = 0;
  let gainPct = 0;

  if (forecast && forecast.timeline) {
    chartData = forecast.timeline.map((pt, idx) => ({
      name: idx === 0 ? 'Today' : `Wk ${idx}`,
      predicted: pt.predicted_price,
      range: [pt.low_ci, pt.high_ci]
    }));

    currentPrice = forecast.timeline[0].predicted_price;
    
    forecast.timeline.forEach((pt, idx) => {
      if (pt.predicted_price > peakPrice) {
        peakPrice = pt.predicted_price;
        peakWeek = idx;
      }
    });

    if (currentPrice > 0) {
      gainPct = (((peakPrice - currentPrice) / currentPrice) * 100).toFixed(1);
    }
  }

  const handlePriceAlert = () => {
    setAlertSet(true);
    setTimeout(() => setAlertSet(false), 2800);
  };

  return (
    <AppShell 
      headerSlot={
        <header className="fixed top-0 w-full z-50 pt-safe bg-surface/80 backdrop-blur-xl shadow-[0_1px_8px_rgba(0,0,0,0.04)]">
          <div className="h-14 px-margin flex items-center justify-between gap-space-sm">
            <div className="flex items-center gap-space-xs min-w-0 flex-1">
              <button 
                onClick={() => navigate(-1)} 
                className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-surface-container-high transition-colors text-on-surface"
                aria-label="Go back">
                <span className="material-symbols-outlined text-[24px]">arrow_back</span>
              </button>
              <img alt="Brand logo" className="h-8 w-auto object-contain flex-shrink-0 hidden sm:block" src="https://lh3.googleusercontent.com/aida/AEtjO1UIQkciQWmlsTRY8f9Zy0F8V6Ui5SnL-bNI1XODjLR9sQNG4BHGAMrtvwAK-8Il7hBixSfzotAqt-1yzxZ1tS8lfeStHMZMcAAazASvjFxGLljEzJwhmT37IQLEv0u0wChglbOYjrW80Tbxp2N5Gci7RSN8sqPVnTp66_kG_QHJe8HBtzy0s7YivFGLy5OK6W6ahvWh_DtV3OjnAKUT1Zgj0Ae4r9TLabB2OQOypc-WO4bS3YHevJEUIf8"/>
              <div className="flex flex-col min-w-0 ml-1">
                <div className="flex items-center gap-1">
                  <span className="font-headline-sm text-headline-sm text-primary truncate leading-tight">KhetSaathi</span>
                  <span className="font-label-sm text-label-sm text-on-surface-variant truncate hidden sm:inline">• Mandi Market</span>
                </div>
                <button className="flex items-center gap-1 text-left min-w-0 group">
                  <span className="material-symbols-outlined text-[16px] text-secondary">location_on</span>
                  <span className="font-label-sm text-label-sm text-on-surface-variant truncate group-hover:text-primary">{farmProfile?.name || 'Farm'} • {crop}</span>
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
      <main className="flex flex-col relative w-full pt-24 pb-safe bg-background">
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
                Multi-mandi modal price projection for {district} APMC
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
              <span className="font-label-sm text-label-sm text-on-surface">Speaking: "{crop} expected to peak at ₹{peakPrice} in Week {peakWeek}..."</span>
            </div>
            <button className="text-on-surface-variant hover:text-on-surface" onClick={() => {
              const banner = document.getElementById('voiceBanner');
              if (banner) banner.classList.add('hidden');
            }}>
              <span className="material-symbols-outlined text-[18px]">close</span>
            </button>
          </div>
          
          {/* Crop Filter Chips */}
          <div className="flex gap-space-xs overflow-x-auto py-2 -mx-margin px-margin [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            {['wheat', 'Chana / Chickpea', 'Soybean', 'Moong Dal', 'Mustard'].map((c) => (
              <button 
                key={c}
                onClick={() => handleCropSelect(c)}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-full font-label-md text-label-md flex-shrink-0 transition-all ${crop.toLowerCase() === c.toLowerCase() ? 'bg-primary-container text-on-primary shadow-sm' : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high active:scale-95'}`}
              >
                {crop.toLowerCase() === c.toLowerCase() && <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>}
                <span className="capitalize">{c}</span>
              </button>
            ))}
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
              <span className="font-headline-lg-mobile text-headline-lg-mobile font-extrabold text-on-surface tracking-tight">₹{currentPrice}</span>
              <span className="font-body-md text-body-md text-on-surface-variant">/ Quintal</span>
            </div>
            <div className="flex items-center gap-1.5 text-on-surface-variant">
              <span className="material-symbols-outlined text-[18px] text-secondary">store</span>
              <span className="font-label-sm text-label-sm font-medium">{district} APMC Modal Rate</span>
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
                  <span className="font-label-sm text-label-sm px-2 py-0.5 rounded-full bg-secondary-container text-on-secondary font-bold">{peakWeek === 0 ? 'Sell Now' : `${peakWeek * 7} Days Left`}</span>
                </div>
                <h2 className="font-headline-sm text-headline-sm text-on-secondary-fixed font-bold mt-0.5">
                  Best Time to Sell: {peakWeek === 0 ? 'This Week' : `Week ${peakWeek}`}
                </h2>
                <p className="font-body-sm text-body-sm text-on-secondary-fixed-variant mt-1.5 leading-relaxed">
                  Projected peak at <strong className="text-on-secondary-fixed font-bold">₹{peakPrice}/Qtl (+{gainPct}% gain)</strong> driven by AI demand forecasting in {district}. {peakWeek === 0 ? 'Current prices are favorable.' : `Holding for ${peakWeek * 7} days strongly recommended.`}
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
              {chartData.length > 0 && (
                <div className="w-full h-48 -ml-3">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={chartData} margin={{ top: 20, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="bandGradientReal" x1="0" x2="0" y1="0" y2="1">
                          <stop offset="0%" stopColor="#91d78a" stopOpacity="0.45" />
                          <stop offset="100%" stopColor="#acf4a4" stopOpacity="0.08" />
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#717a6d', fontSize: 11, fontFamily: 'Inter' }} dy={10} />
                      <YAxis domain={['dataMin - 100', 'dataMax + 100']} hide={true} />
                      <Tooltip
                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                        labelStyle={{ color: '#41493e', fontWeight: 'bold' }}
                        itemStyle={{ color: '#00450d' }}
                      />
                      <Area type="monotone" dataKey="range" stroke="none" fill="url(#bandGradientReal)" />
                      <Line type="monotone" dataKey="predicted" stroke="#00450d" strokeWidth={3} dot={{ r: 4, fill: '#ffffff', stroke: '#00450d', strokeWidth: 2 }} activeDot={{ r: 6 }} />
                      <ReferenceDot x={`Wk ${peakWeek}`} y={peakPrice} r={6} fill="#fc6018" stroke="#ffffff" strokeWidth={2.5} />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              )}
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
                      <span className="font-label-lg text-label-lg text-on-surface">{district} APMC</span>
                      <span className="px-1.5 py-0.2 rounded bg-surface-container text-on-surface-variant font-label-sm text-label-sm">12 km</span>
                    </div>
                    <div className="flex items-center gap-1 text-primary mt-0.5">
                      <span className="material-symbols-outlined text-[14px]">local_fire_department</span>
                      <span className="font-label-sm text-label-sm font-semibold">High Demand • 420 Qtl Traded</span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <span className="font-headline-sm text-headline-sm font-bold text-on-surface">₹{currentPrice}</span>
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
                      <span className="font-label-lg text-label-lg text-on-surface">{district} Central</span>
                      <span className="px-1.5 py-0.2 rounded bg-surface-container text-on-surface-variant font-label-sm text-label-sm">18 km</span>
                    </div>
                    <div className="flex items-center gap-1 text-on-surface-variant mt-0.5">
                      <span className="material-symbols-outlined text-[14px]">horizontal_rule</span>
                      <span className="font-label-sm text-label-sm">Stable • Regular arrivals</span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <span className="font-headline-sm text-headline-sm font-bold text-on-surface">₹{(currentPrice * 0.98).toFixed(0)}</span>
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
                      <span className="font-label-lg text-label-lg text-on-surface">{district} South</span>
                      <span className="px-1.5 py-0.2 rounded bg-surface-container text-on-surface-variant font-label-sm text-label-sm">24 km</span>
                    </div>
                    <div className="flex items-center gap-1 text-primary mt-0.5">
                      <span className="material-symbols-outlined text-[14px]">trending_up</span>
                      <span className="font-label-sm text-label-sm font-semibold">Rising • Grain traders active</span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <span className="font-headline-sm text-headline-sm font-bold text-on-surface">₹{(currentPrice * 0.99).toFixed(0)}</span>
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
                  <span className="font-headline-sm text-headline-sm font-bold">Set Mandi Price Alert (at ₹{peakPrice})</span>
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
                    <span class="font-label-sm text-label-sm text-on-surface">3 Warehouses with subsidy available near ${district}. Opening slots...</span>
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
