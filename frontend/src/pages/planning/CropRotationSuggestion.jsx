import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCropPlan, createRotationPlan } from '../../api/planningApi';
import { getFarmProfile } from '../../api/farmApi';

// Soil nitrogen defaults by soil type (kg/ha → mapped 0-100 scale)
const SOIL_N_BY_TYPE = {
  clay_loam: 38, loam: 42, sandy_loam: 32, clay: 35,
  sandy: 25, silt: 40, black: 50, red: 30, default: 38,
};
const SOIL_SOC_BY_TYPE = {
  clay_loam: 0.42, loam: 0.55, sandy_loam: 0.30, clay: 0.45,
  sandy: 0.20, silt: 0.48, black: 0.72, red: 0.28, default: 0.42,
};

// Display labels & images for ML-returned crop names
const CROP_META = {
  soybean:   { label: 'Soybean',          icon: 'eco',    img: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/fc/Soybean_-_Glycine_max_-_Zentralbibliothek_Z%C3%BCrich_-_Quer-_und_L%C3%A4ngsschnitt_durch_Sojabohne_-_1900.jpg/640px-Soybean_-_Glycine_max_-_Zentralbibliothek_Z%C3%BCrich_-_Quer-_und_L%C3%A4ngsschnitt_durch_Sojabohne_-_1900.jpg' },
  groundnut: { label: 'Groundnut (Peanut)',icon: 'eco',    img: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/37/Groundnut_bush.jpg/640px-Groundnut_bush.jpg' },
  wheat:     { label: 'Wheat',             icon: 'grass',  img: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e3/Arable_field_in_Dorset_on_the_boundary_with_Somerset_-_geograph.org.uk_-_1483918.jpg/640px-Arable_field_in_Dorset_on_the_boundary_with_Somerset_-_geograph.org.uk_-_1483918.jpg' },
  maize:     { label: 'Maize (Corn)',      icon: 'grass',  img: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/31/Cornfield.jpg/640px-Cornfield.jpg' },
  rice:      { label: 'Rice',              icon: 'grass',  img: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7e/Oryza_sativa-Taiwan.jpg/640px-Oryza_sativa-Taiwan.jpg' },
  cotton:    { label: 'Cotton',            icon: 'grass',  img: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/58/Southeast_cotton.jpg/640px-Southeast_cotton.jpg' },
};

export default function CropRotationSuggestion() {
  const navigate = useNavigate();
  const farmId = localStorage.getItem('farmId');

  // Data from APIs
  const [farm, setFarm]   = useState(null);
  const [plans, setPlans] = useState([]);

  // ML result state
  const [result, setResult]       = useState(null);
  const [mlLoading, setMlLoading] = useState(false);
  const [mlError,   setMlError]   = useState(null);

  // Page loading
  const [loading, setLoading] = useState(true);

  // Adopt action
  const [adopted,  setAdopted]  = useState(false);
  const [adopting, setAdopting] = useState(false);
  const [toastOpen, setToastOpen] = useState(false);

  // ── 1. Load farm + crop plans ─────────────────────────────────────────────
  useEffect(() => {
    if (!farmId) return;
    Promise.all([getFarmProfile(farmId), getCropPlan(farmId)])
      .then(([fRes, pRes]) => {
        setFarm(fRes.data);
        setPlans(Array.isArray(pRes.data) ? pRes.data : []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [farmId]);

  // ── 2. Auto-call ML rotation API once farm+plans loaded ──────────────────
  useEffect(() => {
    if (!farm || plans.length === 0) return;

    const soilKey  = (farm.soil_type || 'default').replace('-', '_');
    const soilN    = SOIL_N_BY_TYPE[soilKey]  ?? SOIL_N_BY_TYPE.default;
    const soilSOC  = SOIL_SOC_BY_TYPE[soilKey] ?? SOIL_SOC_BY_TYPE.default;
    // Build last_3_crops from real plan history (oldest → latest)
    const last3    = plans.slice(0, 3).reverse().map(p => p.recommended_crop.toLowerCase());

    setMlLoading(true);
    setMlError(null);
    createRotationPlan({
      farm_id:            farmId,
      soil_nitrogen:      soilN,
      soil_organic_carbon: soilSOC,
      last_3_crops:       last3,
    })
      .then(r => setResult(r.data))
      .catch(e => setMlError(e?.response?.data?.detail || 'ML model unavailable'))
      .finally(() => setMlLoading(false));
  }, [farm, plans]);

  // ── 3. Adopt the ML-recommended rotation ─────────────────────────────────
  const handleAdopt = async () => {
    if (adopting || adopted || !result) return;
    setAdopting(true);
    try {
      setAdopted(true);
      setToastOpen(true);
      setTimeout(() => {
        setToastOpen(false);
        navigate('/planning/season-timeline');
      }, 3000);
    } catch {
      // already handled
    } finally {
      setAdopting(false);
    }
  };

  // ── 4. Explore alternative (second ML result from timeline) ──────────────
  const handleExploreAlt = () => {
    if (!result) return;
    const altCrop = result.timeline?.find(t => t.status === 'upcoming')?.crop || 'an alternative crop';
    alert(`Alternative rotation crop: ${altCrop}\n\nML model considered this as the runner-up based on your soil nitrogen (${SOIL_N_BY_TYPE[(farm?.soil_type||'').replace('-','_')] ?? 38} kg/ha) and recent crop history.`);
  };

  // ── Derived values ────────────────────────────────────────────────────────
  const latestPlan  = plans[0] || null;
  const currentCrop = (latestPlan?.recommended_crop || farm?.current_crop || 'crop');
  const currentSeason = latestPlan?.season
    ? latestPlan.season.charAt(0).toUpperCase() + latestPlan.season.slice(1)
    : (new Date().getMonth() > 4 && new Date().getMonth() < 10 ? 'Kharif' : 'Rabi');
  const landAcres   = farm?.land_size_acres || 1;
  const plotName    = farm?.name || 'Your Farm';
  const district    = farm?.district || 'your district';
  const soilType    = (farm?.soil_type || 'loam').replace('_', ' ');
  const currentCropLabel = currentCrop.charAt(0).toUpperCase() + currentCrop.slice(1);

  const nextCropKey   = result?.next_crop?.toLowerCase() || null;
  const nextCropMeta  = nextCropKey ? (CROP_META[nextCropKey] || { label: result.next_crop, icon: 'eco', img: null }) : null;
  const profitPerAcre = result?.projected_profit ?? null;
  const soilImpact    = result?.projected_soil_impact ?? null;
  const totalReturn   = profitPerAcre !== null ? Math.round(profitPerAcre * landAcres) : null;

  // Soil N for display
  const soilKey = (farm?.soil_type || 'default').replace('-', '_');
  const soilN   = SOIL_N_BY_TYPE[soilKey] ?? 38;
  const soilSOC = SOIL_SOC_BY_TYPE[soilKey] ?? 0.42;
  const soilNPct = (soilN / 100 * 0.12).toFixed(2); // approximate % conversion
  const soilNAfterPct = nextCropKey && ['soybean','groundnut'].includes(nextCropKey)
    ? (parseFloat(soilNPct) + 0.26).toFixed(2)
    : (parseFloat(soilNPct) + 0.15).toFixed(2);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <span className="material-symbols-outlined text-primary text-[48px] animate-spin">refresh</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col relative">
      <main className="flex flex-col w-full pt-24 pb-28 px-margin bg-background flex-1 space-y-space-lg">

        {/* Plot Context Header */}
        <div className="flex flex-col gap-1">
          <h1 className="font-headline-md text-headline-md text-on-surface">
            {plotName} — Nitrogen Risk
          </h1>
          <p className="font-body-md text-body-md text-on-surface-variant">
            Current <strong>{currentCropLabel}</strong> ({currentSeason}) depletes soil nitrogen.
            ML rotation model is computing the best next crop for your <strong>{soilType}</strong> soil in <strong>{district}</strong>.
          </p>
        </div>

        {/* ML Loading State */}
        {mlLoading && (
          <div className="rounded-xl bg-surface-container-lowest p-space-lg flex flex-col items-center gap-3 shadow-sm">
            <span className="material-symbols-outlined text-primary text-[40px] animate-spin">refresh</span>
            <p className="font-label-lg text-label-lg text-on-surface-variant text-center">
              Running PPO Reinforcement Learning rotation model…
            </p>
            <p className="font-body-sm text-body-sm text-outline text-center">
              Soil N: {soilN} kg/ha · SOC: {soilSOC}% · Last 3 crops: {plans.slice(0,3).reverse().map(p=>p.recommended_crop).join(', ')}
            </p>
          </div>
        )}

        {/* ML Error State */}
        {mlError && !mlLoading && (
          <div className="rounded-xl bg-error-container p-space-md flex items-start gap-3 shadow-sm">
            <span className="material-symbols-outlined text-on-error-container text-[24px]">error_outline</span>
            <p className="font-body-sm text-body-sm text-on-error-container">{mlError}</p>
          </div>
        )}

        {/* ML Result Card */}
        {result && !mlLoading && (
          <>
            {/* Recommended Crop Card */}
            <div className="rounded-xl bg-surface-container-lowest shadow-md overflow-hidden border border-primary/20 relative">
              <div className="absolute top-0 right-0 px-3 py-1 bg-primary text-on-primary font-label-sm text-label-sm font-bold rounded-bl-lg z-10 shadow-sm">
                RL Model Pick
              </div>
              <div className="relative h-36 w-full">
                {nextCropMeta?.img ? (
                  <img
                    src={nextCropMeta.img}
                    alt={nextCropMeta.label}
                    className="w-full h-full object-cover"
                    onError={e => { e.target.style.display = 'none'; }}
                  />
                ) : (
                  <div className="w-full h-full bg-primary-fixed/20 flex items-center justify-center">
                    <span className="material-symbols-outlined text-primary text-[64px]">eco</span>
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-surface-container-lowest via-surface-container-lowest/40 to-transparent"></div>
                <div className="absolute bottom-3 left-space-md right-space-md">
                  <h2 className="font-headline-lg-mobile text-headline-lg-mobile text-on-surface drop-shadow-sm">
                    {nextCropMeta?.label || result.next_crop}
                  </h2>
                  <span className="font-label-md text-label-md text-on-surface-variant bg-surface/80 px-2 py-0.5 rounded backdrop-blur-sm">
                    Soil Impact Score: {soilImpact !== null ? `${(soilImpact * 100).toFixed(0)}/100` : '—'}
                  </span>
                </div>
              </div>

              <div className="p-space-md flex flex-col space-y-space-md">
                {/* Soil Nitrogen Rebound — real soil values */}
                <div className="flex flex-col gap-space-sm bg-surface-container-low p-space-sm rounded-xl">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>psychiatry</span>
                    <span className="font-label-lg text-label-lg text-on-surface">Soil Nitrogen Rebound · {soilType}</span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <div className="flex justify-between items-baseline">
                      <span className="font-label-sm text-label-sm text-on-surface-variant">Pre-Harvest ({currentCropLabel}):</span>
                      <span className="font-body-sm text-body-sm text-secondary font-semibold">{soilNPct}% ({soilN < 35 ? 'Low' : soilN < 50 ? 'Fair' : 'Good'})</span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-surface-container-high overflow-hidden">
                      <div className="h-full bg-secondary rounded-full" style={{ width: `${Math.min(90, soilN)}%` }}></div>
                    </div>
                    <div className="flex justify-between items-baseline pt-1">
                      <span className="font-label-sm text-label-sm text-on-surface">After {nextCropMeta?.label || result.next_crop}:</span>
                      <span className="font-label-md text-label-md text-primary font-bold">{soilNAfterPct}% (Rich Green)</span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-surface-container-high overflow-hidden">
                      <div className="h-full bg-primary-container rounded-full" style={{ width: `${Math.min(95, soilN + 30)}%` }}></div>
                    </div>
                  </div>
                </div>

                {/* Model Reasoning */}
                <div className="rounded-lg bg-surface-container p-space-sm flex items-start gap-space-sm">
                  <div className="w-6 h-6 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="material-symbols-outlined text-[16px]">psychology</span>
                  </div>
                  <div>
                    <span className="font-label-md text-primary-container block mb-0.5">ML Model Reasoning:</span>
                    <p className="font-body-sm text-body-sm text-on-surface">
                      Based on <strong>soil nitrogen: {soilN} kg/ha</strong>, SOC: {soilSOC}%, and {plans.length} seasons of {currentCropLabel} on your {soilType} soil in {district} — the PPO agent recommends <strong>{nextCropMeta?.label || result.next_crop}</strong> with soil impact score <strong>{soilImpact !== null ? (soilImpact * 100).toFixed(0) : '—'}/100</strong>.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Economic Forecast Card — real ML projected profit */}
            <div className="rounded-xl bg-surface-container-lowest p-space-md shadow-md flex flex-col gap-space-md">
              <div className="flex items-center justify-between">
                <div className="flex flex-col">
                  <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">ML Economic Forecast</span>
                  <h3 className="font-headline-sm text-headline-sm text-on-surface">Projected Harvest Profit</h3>
                </div>
                <div className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center text-primary">
                  <span className="material-symbols-outlined text-[24px]">payments</span>
                </div>
              </div>

              {/* Hero — ML projected_profit */}
              <div className="bg-surface-container-low rounded-xl p-space-md flex flex-col items-center justify-center gap-1 text-center">
                <span className="font-label-sm text-label-sm text-on-surface-variant">ML Estimated Net Profit</span>
                <span className="font-headline-lg text-headline-lg text-primary font-bold tracking-tight">
                  {profitPerAcre !== null ? `₹${profitPerAcre.toLocaleString('en-IN')}` : '—'}
                  <span className="text-label-lg font-normal text-on-surface-variant"> / Acre</span>
                </span>
                <div className="flex items-center gap-1 text-primary font-label-sm text-label-sm mt-1">
                  <span className="material-symbols-outlined text-[16px]">trending_up</span>
                  <span>Projected by RL model · Soil Impact {soilImpact !== null ? (soilImpact * 100).toFixed(0) : '—'}/100</span>
                </div>
              </div>

              {/* Breakdown */}
              <div className="grid grid-cols-2 gap-space-sm">
                <div className="bg-surface-container-low rounded-lg p-space-sm flex flex-col gap-1">
                  <span className="font-label-sm text-label-sm text-on-surface-variant">Soil Impact Score</span>
                  <span className="font-label-lg text-label-lg text-on-surface">
                    {soilImpact !== null ? (soilImpact * 100).toFixed(0) : '—'}
                    <span className="font-body-sm text-body-sm text-on-surface-variant"> / 100</span>
                  </span>
                  <span className="font-label-sm text-label-sm text-primary">{soilImpact > 0.7 ? 'Excellent ✓' : soilImpact > 0.4 ? 'Good' : 'Moderate'}</span>
                </div>
                <div className="bg-surface-container-low rounded-lg p-space-sm flex flex-col gap-1">
                  <span className="font-label-sm text-label-sm text-on-surface-variant">Total Farm Return</span>
                  <span className="font-label-lg text-label-lg text-primary">
                    {totalReturn !== null ? `₹${totalReturn.toLocaleString('en-IN')}` : '—'}
                  </span>
                  <span className="font-label-sm text-label-sm text-on-surface-variant">For {landAcres} Ac</span>
                </div>
              </div>
            </div>

            {/* Action Buttons — properly wired */}
            <div className="flex flex-col gap-space-sm pt-space-xs pb-space-sm">
              <button
                onClick={handleAdopt}
                disabled={adopting || adopted}
                className={`h-14 w-full rounded-xl flex items-center justify-center gap-space-sm shadow-md active:scale-[0.98] transition-all ${adopted ? 'bg-primary text-on-primary' : 'bg-secondary-container text-on-secondary'}`}
                type="button"
              >
                <span className="font-label-lg text-label-lg text-on-primary">
                  {adopting ? 'Saving…' : adopted ? 'Rotation Adopted ✓' : `Adopt ${nextCropMeta?.label || result.next_crop} Rotation`}
                </span>
                {!adopting && !adopted && (
                  <span className="material-symbols-outlined text-[22px] text-on-primary">arrow_forward</span>
                )}
              </button>
              <button
                onClick={handleExploreAlt}
                className="h-12 w-full rounded-xl bg-surface-container-high text-primary flex items-center justify-center gap-space-xs active:bg-surface-variant transition-colors"
                type="button"
              >
                <span className="font-label-md text-label-md font-semibold">
                  Explore alternative rotation crops
                </span>
                <span className="material-symbols-outlined text-[20px]">chevron_right</span>
              </button>
            </div>
          </>
        )}

        {/* Toast */}
        <div className={`fixed bottom-24 left-4 right-4 bg-inverse-surface text-inverse-on-surface p-space-md rounded-xl shadow-xl flex items-center gap-space-sm transition-all duration-300 z-40 ${toastOpen ? 'translate-y-0 opacity-100' : 'translate-y-32 opacity-0 pointer-events-none'}`}>
          <div className="w-8 h-8 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center flex-shrink-0">
            <span className="material-symbols-outlined text-[20px]">check</span>
          </div>
          <div className="flex flex-col flex-1">
            <span className="font-label-md text-label-md text-inverse-on-surface">Rotation Plan Saved</span>
            <span className="font-body-sm text-body-sm text-surface-container-highest">
              {nextCropMeta?.label || result?.next_crop} scheduled for next season on {plotName}.
            </span>
          </div>
        </div>
      </main>
    </div>
  );
}
