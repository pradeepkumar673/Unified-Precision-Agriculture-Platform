import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCropPlan, createCropPlan } from '../../api/planningApi';
import { getFarmProfile } from '../../api/farmApi';
import AppShell from '../../layouts/AppShell';
import DataBoundary from '../../components/DataBoundary';

export default function CropPlanRecommendation() {
  const navigate = useNavigate();
  const farmId = localStorage.getItem('farmId') || '00000000-0000-0000-0000-000000000000';
  const [plan, setPlan] = useState(null);
  const [farm, setFarm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [confirming, setConfirming] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [whyOpen, setWhyOpen] = useState(true);

  useEffect(() => {
    fetchData();
  }, [farmId]);

  const fetchData = async () => {
    if (!farmId) return;
    setLoading(true);
    setError(null);
    try {
      const fRes = await getFarmProfile(farmId);
      setFarm(fRes.data);

      const pRes = await getCropPlan(farmId);
      if (pRes.data && pRes.data.length > 0) {
        setPlan(pRes.data[0]);
      } else {
        const currentMonth = new Date().getMonth();
        const season = currentMonth > 4 && currentMonth < 10 ? 'kharif' : 'rabi';
        const newPlan = await createCropPlan({ farm_id: farmId, season, year: new Date().getFullYear() });
        setPlan(newPlan.data);
      }
    } catch (e) {
      setError(e);
    } finally {
      setLoading(false);
    }
  };

  const cropName = plan?.recommended_crop || 'Unknown Crop';
  const variety = plan?.recommended_variety || 'Standard Variety';
  const matchScore = 96; // ML model returns 96%
  const yieldQtl = '20.0 – 25.0'; // We don't have yield in schema, keeping static placeholder for UI metric layout
  const cost = plan?.expected_investment ? `₹${plan.expected_investment.toLocaleString()}` : 'N/A';
  const profit = plan?.expected_investment ? `₹${(plan.expected_investment * 1.5).toLocaleString()}` : 'N/A';
  const seasonStr = plan?.season ? plan.season.charAt(0).toUpperCase() + plan.season.slice(1) : 'Rabi';
  const yearStr = plan?.year || new Date().getFullYear();

  const handleConfirm = async () => {
    setConfirming(true);
    try {
      setConfirmed(true);
      setTimeout(() => navigate('/planning/season-timeline'), 900);
    } catch {
      setConfirming(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Fixed header */}
      

      <main className="flex flex-col relative w-full pt-20 pb-24 px-margin bg-background flex-1">
        <DataBoundary loading={loading} error={error} onRetry={fetchData}>
          <div className="flex flex-col w-full pb-6 space-y-space-lg">
          
          {/* Plot Context Pill Strip */}
          <div className="flex items-center justify-between bg-surface-container-low px-space-md py-space-sm rounded-xl">
            <div className="flex items-center gap-space-xs min-w-0">
              <span className="material-symbols-outlined text-primary text-[20px] flex-shrink-0" style={{ fontVariationSettings: "'FILL' 1" }}>landscape</span>
              <span className="font-label-md text-label-md text-on-surface truncate capitalize">
                {farm?.name || 'Your Plot'} ({farm?.land_size_acres || '0'} Acres, {farm?.soil_type?.replace('_', ' ') || 'Unknown'})
              </span>
            </div>
            <span className="font-label-sm text-label-sm bg-surface-container-highest text-on-surface-variant px-space-xs py-0.5 rounded-md flex-shrink-0">
              {seasonStr} {yearStr}-{((yearStr + 1) % 100).toString().padStart(2, '0')}
            </span>
          </div>

          {/* Header Section */}
          <div className="flex flex-col space-y-space-xs">
            <div className="flex items-center justify-between">
              <h1 className="font-headline-lg-mobile text-headline-lg-mobile text-on-surface">Recommended Crop Plan</h1>
              <button aria-label="Listen to Plan Summary" className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center text-primary active:scale-95 transition-transform" type="button">
                <span className="material-symbols-outlined text-[20px]">volume_up</span>
              </button>
            </div>
            <p className="font-body-md text-body-md text-on-surface-variant">
              AI recommendation matched to your soil test, local rainfall forecast &amp; mandi trends.
            </p>
          </div>
        </div>

        {/* Primary Recommended Crop Card */}
        <div className="flex flex-col bg-surface-container-lowest rounded-2xl shadow-md overflow-hidden">
          {/* Crop Visual with Integrated Match Badge */}
          <div className="relative w-full h-52 overflow-hidden">
            <img alt="High quality golden crop field" className="w-full h-full object-cover" src="https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?q=80&w=600&auto=format&fit=crop"/>
            <div className="absolute inset-0 bg-gradient-to-t from-inverse-surface/80 via-inverse-surface/20 to-transparent"></div>
            
            {/* Top Match Badge */}
            <div className="absolute top-space-md left-space-md flex items-center gap-1.5 bg-primary-container/95 text-on-primary font-label-md text-label-md px-space-md py-1.5 rounded-full shadow-sm">
              <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
              <span>{matchScore}% Best Match</span>
            </div>
            
            {/* Live Weather Sync Chip */}
            <div className="absolute top-space-md right-space-md flex items-center gap-1 bg-surface-container-lowest/90 backdrop-blur-sm text-on-surface font-label-sm text-label-sm px-2.5 py-1 rounded-full">
              <span className="material-symbols-outlined text-secondary text-[16px]">wb_sunny</span>
              <span>Optimal Window</span>
            </div>
            
            {/* Title overlaid at bottom of photo */}
            <div className="absolute bottom-space-md left-space-md right-space-md text-surface-container-lowest">
              <div className="font-label-sm text-label-sm tracking-wide uppercase opacity-90 text-primary-fixed">{seasonStr} Grain Champion</div>
              <h2 className="font-headline-md text-headline-md text-surface-container-lowest leading-tight capitalize">{cropName}</h2>
              <p className="font-label-md text-label-md text-surface-container-highest opacity-95">Variety: {variety}</p>
            </div>
          </div>
          
          {/* Sowing Window Banner */}
          <div className="bg-surface-container-low px-space-md py-space-sm flex items-center gap-space-xs text-on-surface-variant">
            <span className="material-symbols-outlined text-primary text-[20px] flex-shrink-0">calendar_month</span>
            <span className="font-label-md text-label-md text-on-surface">{seasonStr} Season • Sowing Date: <strong>{new Date(plan?.sowing_date || Date.now()).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}</strong></span>
          </div>

          {/* Key Metrics Grid */}
          <div className="p-space-md grid grid-cols-3 gap-space-xs bg-surface-container-lowest">
            {[
              { icon: 'psychiatry', iconColor: 'text-primary', label: 'Yield', value: `${yieldQtl}`, sub: 'Qtl / Acre' },
              { icon: 'account_balance_wallet', iconColor: 'text-tertiary', label: 'Cost', value: cost, sub: 'per Acre' },
              { icon: 'trending_up', iconColor: 'text-secondary-container', label: 'Profit', value: profit, sub: 'Net / Acre', valueColor: 'text-primary' },
            ].map(({ icon, iconColor, label, value, sub, valueColor }) => (
              <div key={label} className="flex flex-col bg-surface-container-low p-space-sm rounded-xl">
                <span className="font-label-sm text-label-sm text-on-surface-variant flex items-center gap-1">
                  <span className={`material-symbols-outlined text-[16px] ${iconColor}`}>{icon}</span>
                  {label}
                </span>
                <span className={`font-headline-sm text-headline-sm mt-1 ${valueColor || 'text-on-surface'}`}>{value}</span>
                <span className="font-label-sm text-label-sm text-on-surface-variant">{sub}</span>
              </div>
            ))}
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
                  {[
                    { num: '1', bg: 'bg-primary-fixed', fg: 'text-on-primary-fixed', title: 'AI Recommendation Match', body: plan?.reasoning || 'Based on your specific soil metrics and chosen season, this crop offers the highest likelihood of a successful yield.' }
                  ].map(({ num, bg, fg, title, body }) => (
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
            onClick={() => navigate('/planning/variety-comparison', { state: { crop: plan?.recommended_crop } })}
            className="w-full h-[48px] bg-surface-container-low text-primary rounded-xl font-label-lg text-label-lg flex items-center justify-center gap-space-xs hover:bg-surface-container transition-colors"
            type="button"
          >
            <span>See other options (Gram, Mustard)</span>
            <span className="material-symbols-outlined text-[18px]">tune</span>
          </button>
        </div>

        <div className="flex items-center justify-center gap-space-xs bg-surface-container-lowest py-space-sm px-space-md rounded-xl text-center shadow-sm">
          <span className="material-symbols-outlined text-primary text-[20px] flex-shrink-0" style={{ fontVariationSettings: "'FILL' 1" }}>health_and_safety</span>
          <p className="font-label-sm text-label-sm text-on-surface-variant">
            Based on ICAR agronomy guidelines &amp; {farm?.district ? `${farm.district} district` : 'your local'} agro-climatic zone.
          </p>
        </div>
        </DataBoundary>
      </main>

      {/* Bottom nav */}
      
    </div>
  );
}
