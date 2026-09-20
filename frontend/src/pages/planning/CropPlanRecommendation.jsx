import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCropPlan, createCropPlan } from '../../api/planningApi';

const WHY_REASONS = [
  {
    num: '1', bg: 'bg-primary-fixed', fg: 'text-on-primary-fixed',
    title: 'Soil Compatibility Match',
    body: 'High potassium and clay loam in Plot 1 naturally retains root moisture ideal for HD-2967 deep tillering.',
  },
  {
    num: '2', bg: 'bg-tertiary-fixed', fg: 'text-on-tertiary-fixed',
    title: 'Canal Water Synchronization',
    body: 'Crown root initiation stage matches the scheduled Nov 15 Palkhed canal irrigation release.',
  },
  {
    num: '3', bg: 'bg-secondary-fixed', fg: 'text-on-secondary-fixed',
    title: 'Mandi Price Surge Outlook',
    body: 'High commercial flour mill demand projected at Lasalgaon APMC during early March arrivals.',
  },
];

export default function CropPlanRecommendation() {
  const navigate = useNavigate();
  const farmId = localStorage.getItem('farmId');
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [confirming, setConfirming] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [whyOpen, setWhyOpen] = useState(true);

  useEffect(() => {
    if (!farmId) return;
    getCropPlan(farmId)
      .then(r => setPlan(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [farmId]);

  const cropName = plan?.crop_name || 'Sharbati Gold Wheat (HD-2967)';
  const matchScore = plan?.match_score ?? 96;
  const yieldQtl = plan?.yield_qtl ?? '21.4 – 24.0';
  const cost = plan?.cost_per_acre ?? '₹1,18,500';
  const profit = plan?.profit_per_acre ?? '₹1,42,000';

  const handleConfirm = async () => {
    setConfirming(true);
    try {
      await createCropPlan({ farm_id: farmId, crop: cropName, confirmed: true });
      setConfirmed(true);
      setTimeout(() => navigate('/planning/season-timeline'), 900);
    } catch {
      setConfirming(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col pt-safe pb-safe">
      {/* Fixed header */}
      <header className="fixed top-0 w-full z-50 pt-safe bg-surface/90 backdrop-blur-xl shadow-[0_1px_8px_rgba(0,0,0,0.04)]">
        <div className="h-20 px-margin flex items-center justify-between gap-space-sm">
          <div className="flex items-center gap-space-sm min-w-0 flex-1">
            <button onClick={() => navigate(-1)} className="w-10 h-10 flex items-center justify-center text-on-surface rounded-full active:bg-surface-container flex-shrink-0" type="button">
              <span className="material-symbols-outlined text-[24px]">arrow_back</span>
            </button>
            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-space-xs">
                <span className="font-label-sm text-label-sm text-primary-container flex items-center">🌱</span>
                <span className="font-label-sm text-label-sm text-on-surface-variant truncate">Synced 1m ago · Offline Ready</span>
              </div>
              <span className="font-headline-sm text-headline-sm text-on-surface truncate">Plan</span>
            </div>
          </div>
          <div className="flex items-center gap-space-xs flex-shrink-0">
            <button className="h-11 px-space-sm bg-surface-container rounded-full flex items-center justify-center gap-space-xs text-on-surface hover:bg-surface-container-high transition-colors" type="button">
              <span className="font-label-md text-label-md font-bold text-primary">EN</span>
            </button>
            <button className="w-11 h-11 bg-surface-container rounded-full flex items-center justify-center text-primary hover:bg-surface-container-high transition-colors" type="button">
              <span className="material-symbols-outlined text-[20px]">volume_up</span>
            </button>
          </div>
        </div>
      </header>

      <main className="flex flex-col w-full pt-20 pb-28 px-margin bg-background flex-1 space-y-space-lg">
        {/* Plot context pill */}
        <div className="flex items-center justify-between bg-surface-container-low px-space-md py-space-sm rounded-xl mt-2">
          <div className="flex items-center gap-space-xs min-w-0">
            <span className="material-symbols-outlined text-primary text-[20px] flex-shrink-0" style={{ fontVariationSettings: "'FILL' 1" }}>landscape</span>
            <span className="font-label-md text-label-md text-on-surface truncate">Plot 1 (4.5 Acres, Clay Loam)</span>
          </div>
          <span className="font-label-sm text-label-sm bg-surface-container-highest text-on-surface-variant px-space-xs py-0.5 rounded-md flex-shrink-0">Rabi 2024-25</span>
        </div>

        {/* Headline */}
        <div className="flex items-center justify-between">
          <h1 className="font-headline-lg-mobile text-headline-lg-mobile text-on-surface">Recommended Crop Plan</h1>
          <button className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center text-primary active:scale-95 transition-transform" type="button">
            <span className="material-symbols-outlined text-[20px]">volume_up</span>
          </button>
        </div>
        <p className="font-body-md text-body-md text-on-surface-variant -mt-2">
          AI recommendation matched to your soil test, local rainfall forecast &amp; mandi trends.
        </p>

        {/* Hero crop card */}
        <div className="rounded-xl bg-surface-container-lowest shadow-md overflow-hidden">
          {/* Colour accent strip */}
          <div className="h-2 bg-gradient-to-r from-primary-container to-primary"></div>
          <div className="p-space-md flex flex-col space-y-space-md">
            <div className="flex items-start gap-space-md">
              <div className="w-16 h-16 rounded-xl bg-primary-fixed/30 flex items-center justify-center flex-shrink-0">
                <span className="material-symbols-outlined text-[36px] text-primary">grass</span>
              </div>
              <div className="flex flex-col min-w-0 flex-1">
                <div className="flex items-center gap-space-xs flex-wrap">
                  <span className="font-headline-sm text-headline-sm text-on-surface">{cropName}</span>
                  <span className="px-2 py-0.5 rounded-full bg-primary-fixed text-primary font-label-sm text-label-sm font-bold">{matchScore}% Match</span>
                </div>
                <span className="font-label-sm text-label-sm text-on-surface-variant">Rabi Sowing · Oct 25 – Nov 10</span>
              </div>
            </div>

            {/* 3-metric grid */}
            <div className="grid grid-cols-3 gap-space-sm">
              {[
                { icon: 'grain', iconColor: 'text-primary', label: 'Expected Yield', value: `${yieldQtl} Qtl/Ac` },
                { icon: 'account_balance_wallet', iconColor: 'text-tertiary', label: 'Cost', value: cost, sub: 'per Acre' },
                { icon: 'trending_up', iconColor: 'text-secondary-container', label: 'Profit', value: profit, sub: 'Net / Acre', valueColor: 'text-primary' },
              ].map(({ icon, iconColor, label, value, sub, valueColor }) => (
                <div key={label} className="flex flex-col bg-surface-container-low p-space-sm rounded-xl">
                  <span className="font-label-sm text-label-sm text-on-surface-variant flex items-center gap-1">
                    <span className={`material-symbols-outlined text-[16px] ${iconColor}`}>{icon}</span>
                    {label}
                  </span>
                  <span className={`font-headline-sm text-headline-sm mt-1 ${valueColor || 'text-on-surface'}`}>{value}</span>
                  {sub && <span className="font-label-sm text-label-sm text-on-surface-variant">{sub}</span>}
                </div>
              ))}
            </div>
          </div>

          {/* Why this crop collapsible */}
          <div className="px-space-md pb-space-md">
            <div className="bg-surface-container rounded-xl overflow-hidden">
              <button
                aria-expanded={whyOpen}
                onClick={() => setWhyOpen(v => !v)}
                className="w-full px-space-md py-space-sm flex items-center justify-between text-left active:bg-surface-container-high transition-colors"
                type="button"
              >
                <div className="flex items-center gap-space-xs">
                  <span className="material-symbols-outlined text-primary-container text-[20px]">psychology</span>
                  <span className="font-label-lg text-label-lg text-on-surface">Why this crop for your land?</span>
                </div>
                <span className={`material-symbols-outlined text-on-surface-variant transform transition-transform duration-200 text-[20px] ${whyOpen ? 'rotate-180' : ''}`}>
                  expand_more
                </span>
              </button>
              {whyOpen && (
                <div className="px-space-md pb-space-md flex flex-col space-y-space-sm">
                  {WHY_REASONS.map(({ num, bg, fg, title, body }) => (
                    <div key={num} className="flex items-start gap-space-sm bg-surface-container-lowest p-space-sm rounded-lg">
                      <div className={`w-6 h-6 rounded-full ${bg} flex items-center justify-center flex-shrink-0 mt-0.5`}>
                        <span className={`font-label-sm text-label-sm ${fg}`}>{num}</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="font-label-md text-label-md text-on-surface">{title}</span>
                        <p className="font-body-md text-body-md text-on-surface-variant mt-0.5">{body}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* CTAs */}
        <div className="flex flex-col space-y-space-sm pt-space-xs">
          <button
            onClick={handleConfirm}
            disabled={confirming || confirmed}
            className="w-full h-[52px] bg-primary-container text-on-primary rounded-xl font-label-lg text-label-lg flex items-center justify-center gap-space-xs shadow-md active:opacity-90 transition-opacity"
            type="button"
          >
            {confirmed ? (
              <><span className="material-symbols-outlined text-[20px]">check_circle</span><span>Plan Saved! Opening Calendar...</span></>
            ) : confirming ? (
              <><span className="material-symbols-outlined text-[20px] animate-spin">progress_activity</span><span>Generating your 120-day plan...</span></>
            ) : (
              <><span>Confirm this Plan &amp; Get Task Calendar</span><span className="material-symbols-outlined text-[20px]">arrow_forward</span></>
            )}
          </button>
          <button
            onClick={() => navigate('/planning/variety-comparison')}
            className="w-full h-[48px] bg-surface-container-low text-primary rounded-xl font-label-lg text-label-lg flex items-center justify-center gap-space-xs hover:bg-surface-container transition-colors"
            type="button"
          >
            <span>See other options (Gram, Mustard)</span>
            <span className="material-symbols-outlined text-[18px]">tune</span>
          </button>
        </div>

        {/* Trust badge */}
        <div className="flex items-center justify-center gap-space-xs bg-surface-container-lowest py-space-sm px-space-md rounded-xl text-center shadow-sm">
          <span className="material-symbols-outlined text-primary text-[20px] flex-shrink-0" style={{ fontVariationSettings: "'FILL' 1" }}>health_and_safety</span>
          <p className="font-label-sm text-label-sm text-on-surface-variant">
            Based on ICAR agronomy guidelines &amp; Nashik district agro-climatic zone.
          </p>
        </div>
      </main>

      {/* Bottom nav */}
      <nav className="fixed bottom-0 w-full z-50 pb-safe bg-surface/90 backdrop-blur-xl shadow-[0_-2px_10px_rgba(0,0,0,0.05)]">
        <div className="flex justify-around items-center h-16 px-space-xs">
          {[
            { icon: 'home', label: 'Home', to: '/app' },
            { icon: 'calendar_month', label: 'Plan', to: '/planning/crop-plan', active: true },
            { icon: 'storefront', label: 'Market', to: '/marketplace/inputs' },
            { icon: 'notifications', label: 'Alerts', to: '/community/alerts' },
            { icon: 'account_circle', label: 'Profile', to: '/farm/profile' },
          ].map(({ icon, label, to, active }) => (
            <button key={label} onClick={() => navigate(to)} className={`flex flex-col items-center justify-center min-w-[56px] h-12 transition-colors ${active ? 'text-primary-container font-semibold' : 'text-on-surface-variant hover:text-on-surface'}`} type="button">
              <span className="material-symbols-outlined text-[22px]">{icon}</span>
              <span className="font-label-sm text-label-sm">{label}</span>
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
}
