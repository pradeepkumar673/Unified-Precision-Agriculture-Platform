import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createRotationPlan } from '../../api/planningApi';

export default function CropRotationSuggestion() {
  const navigate = useNavigate();
  const farmId = localStorage.getItem('farmId');
  const [toastOpen, setToastOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleAdopt = async () => {
    setLoading(true);
    try {
      await createRotationPlan({ farm_id: farmId, rotation_id: 'legume-rotation-1' });
      setToastOpen(true);
      setTimeout(() => {
        setToastOpen(false);
        navigate('/planning/season-timeline');
      }, 3200);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  const handleAlert = (msg) => alert(msg);

  return (
    <div className="min-h-screen bg-background flex flex-col relative">
      {/* Fixed Top Nav */}
      

      <main className="flex flex-col w-full pt-24 pb-28 px-margin bg-background flex-1 space-y-space-lg">
        {/* Plot Context Header */}
        <div className="flex flex-col gap-1">
          <h1 className="font-headline-md text-headline-md text-on-surface">Plot 1 Nitrogen Depletion Risk</h1>
          <p className="font-body-md text-body-md text-on-surface-variant">
            Current Wheat (Rabi) is a heavy feeder. Planting a legume next will fix atmospheric Nitrogen back into your soil.
          </p>
        </div>

        {/* Recommended Legume Card */}
        <div className="rounded-xl bg-surface-container-lowest shadow-md overflow-hidden border border-primary/20 relative">
          <div className="absolute top-0 right-0 px-3 py-1 bg-primary text-on-primary font-label-sm text-label-sm font-bold rounded-bl-lg z-10 shadow-sm">
            Top Recommendation
          </div>
          {/* Header section w/ Image background */}
          <div className="relative h-36 w-full">
            <img
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuA8gU6EBHIbRlLB4yi0RnFKTRImMrb_Wyd2llRD-2nJQy_li-v43hLj36wA1cX97qAfam6iNdyoikC7fEZhe57sQtjQg5tGMSodneFffKFL4Mum-Ah8hB9zXLae_aVAch-1BzQh-p2dKPQiefEqEtgd3717hMyYLMuQ3_0oK0BrsQ_Mz49BL4s6Wphp2q02IoYowZ8kF5ejQc8YMKWuh4179TmRrNJj2OiK2fXY1uGsvPPSTeFpbzfv"
              alt="Green Gram Field"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-surface-container-lowest via-surface-container-lowest/40 to-transparent"></div>
            <div className="absolute bottom-3 left-space-md right-space-md flex justify-between items-end">
              <div>
                <h2 className="font-headline-lg-mobile text-headline-lg-mobile text-on-surface drop-shadow-sm">Moong Dal</h2>
                <span className="font-label-md text-label-md text-on-surface-variant bg-surface/80 px-2 py-0.5 rounded backdrop-blur-sm">Variety: IPM-02-3</span>
              </div>
              <button
                onClick={() => handleAlert('Varietal details: IPM-02-3 is resistant to Mungbean Yellow Mosaic Virus (MYMV) and yields 12-14 Q/Ha under optimal moisture.')}
                className="w-8 h-8 rounded-full bg-surface/80 backdrop-blur-sm flex items-center justify-center text-primary"
                type="button"
              >
                <span className="material-symbols-outlined text-[20px]">info</span>
              </button>
            </div>
          </div>
          {/* Details below image */}
          <div className="p-space-md flex flex-col space-y-space-md">
            {/* Soil Health Rebound Widget */}
            <div className="flex flex-col gap-space-sm bg-surface-container-low p-space-sm rounded-xl">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>psychiatry</span>
                <span className="font-label-lg text-label-lg text-on-surface">Soil Nitrogen Rebound</span>
              </div>
              <div className="flex flex-col gap-1">
                <div className="flex justify-between items-baseline">
                  <span className="font-label-sm text-label-sm text-on-surface-variant">Pre-Harvest:</span>
                  <span className="font-body-sm text-body-sm text-secondary font-semibold">0.42% (Fair)</span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-surface-container-high overflow-hidden">
                  <div className="h-full bg-secondary rounded-full" style={{ width: '38%' }}></div>
                </div>
                <div className="flex justify-between items-baseline pt-1">
                  <span className="font-label-sm text-label-sm text-on-surface">After Moong:</span>
                  <span className="font-label-md text-label-md text-primary font-bold">0.68% (Rich Green)</span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-surface-container-high overflow-hidden">
                  <div className="h-full bg-primary-container rounded-full" style={{ width: '82%' }}></div>
                </div>
              </div>
            </div>
            {/* Agronomist Note Callout */}
            <div className="rounded-lg bg-surface-container p-space-sm flex items-start gap-space-sm">
              <div className="w-6 h-6 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="material-symbols-outlined text-[16px]">eco</span>
              </div>
              <p className="font-body-sm text-body-sm text-on-surface">
                <span className="font-label-md text-primary-container block mb-0.5">Agronomist Insight:</span> Roots form active rhizobia nodules, cutting fertilizer cost for your next Kharif crop by <strong className="text-primary font-label-md">₹13,200/Acre</strong>.
              </p>
            </div>
          </div>
        </div>

        {/* Projected Profit & Economics Card */}
        <div className="rounded-xl bg-surface-container-lowest p-space-md shadow-md flex flex-col gap-space-md">
          <div className="flex items-center justify-between">
            <div className="flex flex-col">
              <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">Economic Forecast</span>
              <h3 className="font-headline-sm text-headline-sm text-on-surface">Projected Harvest Profit</h3>
            </div>
            <div className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center text-primary">
              <span className="material-symbols-outlined text-[24px]">payments</span>
            </div>
          </div>
          {/* Highlighted Hero Stat */}
          <div className="bg-surface-container-low rounded-xl p-space-md flex flex-col items-center justify-center gap-1 text-center">
            <span className="font-label-sm text-label-sm text-on-surface-variant">Estimated Net Profit</span>
            <span className="font-headline-lg text-headline-lg text-primary font-bold tracking-tight">₹134,500 <span className="text-label-lg font-normal text-on-surface-variant">/ Acre</span></span>
            <div className="flex items-center gap-1 text-primary font-label-sm text-label-sm mt-1">
              <span className="material-symbols-outlined text-[16px]">trending_up</span>
              <span>Includes cost of seed, labor &amp; diesel</span>
            </div>
          </div>
          {/* Breakdown Details */}
          <div className="grid grid-cols-2 gap-space-sm">
            <div className="bg-surface-container-low rounded-lg p-space-sm flex flex-col gap-1">
              <span className="font-label-sm text-label-sm text-on-surface-variant">Market Target (MSP)</span>
              <span className="font-label-lg text-label-lg text-on-surface">₹8,200 <span className="font-body-sm text-body-sm text-on-surface-variant">/ Qtl</span></span>
              <span className="font-label-sm text-label-sm text-primary">APMC Assured</span>
            </div>
            <div className="bg-surface-container-low rounded-lg p-space-sm flex flex-col gap-1">
              <span className="font-label-sm text-label-sm text-on-surface-variant">Total Farm Return</span>
              <span className="font-label-lg text-label-lg text-primary">₹1,55,250</span>
              <span className="font-label-sm text-label-sm text-on-surface-variant">Calculated for 4.5 Ac</span>
            </div>
          </div>
        </div>

        {/* Action Bar & Alternates */}
        <div className="flex flex-col gap-space-sm pt-space-xs pb-space-sm">
          <button
            onClick={handleAdopt}
            disabled={loading}
            className="h-14 w-full rounded-xl bg-secondary-container text-on-secondary flex items-center justify-center gap-space-sm shadow-md active:scale-[0.98] transition-transform"
            type="button"
          >
            <span className="font-label-lg text-label-lg text-on-primary">
              {loading ? 'Saving...' : 'Adopt Rotation & Reserve Seeds'}
            </span>
            {!loading && <span className="material-symbols-outlined text-[22px] text-on-primary">arrow_forward</span>}
          </button>
          <button
            onClick={() => handleAlert('Switching rotation advisory to Black Gram (Urad - Type 9). Recalculating nodule benefits...')}
            className="h-12 w-full rounded-xl bg-surface-container-high text-primary flex items-center justify-center gap-space-xs active:bg-surface-variant transition-colors"
            type="button"
          >
            <span className="font-label-md text-label-md font-semibold">Explore Black Gram / Urad alternative</span>
            <span className="material-symbols-outlined text-[20px]">chevron_right</span>
          </button>
        </div>

        {/* Interactive toast confirmation overlay */}
        <div className={`fixed bottom-24 left-4 right-4 bg-inverse-surface text-inverse-on-surface p-space-md rounded-xl shadow-xl flex items-center gap-space-sm transition-all duration-300 z-40 ${toastOpen ? 'translate-y-0 opacity-100' : 'translate-y-32 opacity-0 pointer-events-none'}`}>
          <div className="w-8 h-8 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center flex-shrink-0">
            <span className="material-symbols-outlined text-[20px]">check</span>
          </div>
          <div className="flex flex-col flex-1">
            <span className="font-label-md text-label-md text-inverse-on-surface">Plan Saved to Notebook</span>
            <span className="font-body-sm text-body-sm text-surface-container-highest">Seeds allocation request dispatched to KVK depot.</span>
          </div>
        </div>
      </main>

      {/* Bottom nav */}
      
    </div>
  );
}
