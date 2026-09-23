import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { getVarietyRecommendation } from '../../api/planningApi';
import { getFarmProfile } from '../../api/farmApi';
import { getCropPlan } from '../../api/planningApi';

const FILTERS = [
  { id: 'all',    label: 'All Varieties' },
  { id: 'drought',label: 'Drought Tolerant' },
  { id: 'yield',  label: 'High Yield' },
  { id: 'early',  label: 'Early Maturing' },
];

// Clean garbled trait text and return proper emoji + label
function cleanTrait(text = '') {
  // Strip all non-ASCII and non-printable characters, then extract meaningful words
  const clean = text.replace(/[^\x20-\x7E\u00A0-\uFFFF]/g, '').replace(/\s+/g, ' ').trim();
  // Map known trait keywords to proper display
  if (/sugar/i.test(clean))        return { emoji: '🍬', label: 'High Sugar Content' };
  if (/mosaic/i.test(clean))       return { emoji: '🛡️', label: 'Mosaic Resistant' };
  if (/drought/i.test(clean))      return { emoji: '☀️', label: 'Drought Tolerant' };
  if (/early.matur/i.test(clean))  return { emoji: '⏱️', label: 'Early Maturity' };
  if (/steady|yield/i.test(clean)) return { emoji: '📈', label: 'Steady Yield' };
  if (/regrowth/i.test(clean))     return { emoji: '🌱', label: 'Good Regrowth' };
  if (/leaf.spot/i.test(clean))    return { emoji: '🛡️', label: 'Leaf Spot Resistant' };
  if (/water/i.test(clean))        return { emoji: '💧', label: 'Moderate Water Need' };
  if (/sugar.recov/i.test(clean))  return { emoji: '🍯', label: 'Good Sugar Recovery' };
  if (/premium/i.test(clean))      return { emoji: '⭐', label: 'Premium Rate' };
  if (/protein/i.test(clean))      return { emoji: '💪', label: 'High Protein' };
  // Fallback — just use cleaned text without garbled prefix
  return { emoji: '✓', label: clean.replace(/^[^a-zA-Z]+/, '').trim() || 'Special Trait' };
}

// Fix garbled rupee symbol in cost string
function fixCost(cost = '') {
  return cost.replace(/[^\x20-\x7Ex20-\uFFFF]|\?+/g, '').replace(/^\s*/, '₹').trim()
    || cost.replace(/[^0-9,]/g, '') && `₹${cost.replace(/[^0-9,]/g, '')}`;
}

export default function VarietyComparison() {
  const navigate  = useNavigate();
  const location  = useLocation();

  const farmId = localStorage.getItem('farmId') || '00000000-0000-0000-0000-000000000000';
  const [filter,        setFilter]        = useState('all');
  const [toastData,     setToastData]     = useState(null);
  const [farm,          setFarm]          = useState(null);
  const [plans,         setPlans]         = useState([]);
  const [varietiesData, setVarietiesData] = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [error,         setError]         = useState(null);

  // Derive crop from route state → or from real latest crop plan
  const cropFromState = location.state?.crop || null;

  useEffect(() => {
    if (!farmId) { setLoading(false); return; }

    Promise.all([
      getFarmProfile(farmId),
      getCropPlan(farmId),
    ]).then(([fRes, pRes]) => {
      setFarm(fRes.data);
      setPlans(Array.isArray(pRes.data) ? pRes.data : []);
    }).catch(() => {});
  }, [farmId]);

  // Once farm+plans loaded, call variety recommendation
  useEffect(() => {
    if (!farm) return;
    const cropToUse = cropFromState || farm.current_crop || (plans[0]?.recommended_crop) || 'wheat';

    setLoading(true);
    setError(null);
    getVarietyRecommendation({ farm_id: farmId, crop: cropToUse })
      .then(res => {
        const varieties = res.data?.recommended_varieties || [];
        setVarietiesData(varieties);
      })
      .catch(e => {
        setError(e?.response?.data?.detail || 'Could not load varieties');
      })
      .finally(() => setLoading(false));
  }, [farm, plans]);

  const handleSelect = (vId, vName) => {
    setToastData({ code: vId, name: vName });
    setTimeout(() => setToastData(null), 4000);
  };

  const handleFindDealers = () => {
    const d = farm?.district || 'your district';
    navigate('/marketplace/inputs');
  };

  // Derived display values
  const district  = farm?.district  || 'your region';
  const soil      = (farm?.soil_type || 'loam').replace('_', ' ');
  const plotName  = farm?.name      || 'Your Farm';
  const activeCrop = cropFromState || farm?.current_crop || plans[0]?.recommended_crop || 'crop';
  const cropLabel  = activeCrop.charAt(0).toUpperCase() + activeCrop.slice(1);

  // Filter: 'all' shows everything, others filter by types array
  const visibleVarieties = filter === 'all'
    ? varietiesData
    : varietiesData.filter(v => Array.isArray(v.types) && v.types.includes(filter));

  return (
    <div className="min-h-screen bg-background flex flex-col relative">

      {/* Sticky Filter Bar */}
      <div className="fixed top-[calc(5rem+env(safe-area-inset-top))] w-full z-40 bg-background/95 backdrop-blur-md py-space-sm border-b border-surface-container shadow-sm">
        <div className="px-margin flex gap-space-sm overflow-x-auto no-scrollbar pb-1">
          {FILTERS.map(f => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={`flex-shrink-0 px-4 py-2 rounded-full font-label-md text-label-md transition-colors ${
                filter === f.id ? 'bg-primary text-on-primary' : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'
              }`}
              type="button"
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <main className="flex flex-col w-full pt-[calc(5rem+4.5rem)] pb-28 px-margin bg-background flex-1">
        {/* Context Header */}
        <div className="py-space-sm mb-space-sm">
          <p className="font-label-sm text-label-sm text-on-surface-variant">
            Showing AI-recommended <strong className="text-on-surface">{cropLabel}</strong> varieties for{' '}
            <strong className="text-primary">{plotName}</strong> · {soil} soil · {district}
          </p>
        </div>

        <div className="flex flex-col space-y-space-md">
          {/* Loading */}
          {loading && (
            <div className="flex flex-col items-center justify-center py-10 space-y-4">
              <span className="material-symbols-outlined text-[32px] text-primary animate-spin">progress_activity</span>
              <p className="font-body-md text-on-surface-variant">Finding best {cropLabel} varieties for {district}…</p>
            </div>
          )}

          {/* Error */}
          {error && !loading && (
            <div className="rounded-xl bg-error-container p-space-md text-on-error-container font-body-sm">
              {error}
            </div>
          )}

          {/* No results after filter */}
          {!loading && !error && visibleVarieties.length === 0 && (
            <div className="flex flex-col items-center justify-center py-10 space-y-4 text-center">
              <span className="material-symbols-outlined text-[32px] text-on-surface-variant">search_off</span>
              <p className="font-body-md text-on-surface-variant">No {cropLabel} varieties match this filter.</p>
              <button onClick={() => setFilter('all')} className="px-4 py-2 bg-primary text-on-primary rounded-full font-label-md" type="button">
                Show All
              </button>
            </div>
          )}

          {/* Variety Cards */}
          {!loading && !error && visibleVarieties.map((v, idx) => {
            const isTopPick = v.match >= 90;
            const costDisplay = `₹${String(v.cost).replace(/[^0-9]/g, '')}`;
            const yieldUnit = activeCrop.toLowerCase() === 'sugarcane' ? 'T/Ac' : 'Qtl/Ac';
            const daysUnit  = activeCrop.toLowerCase() === 'sugarcane' ? 'Months' : 'Days';

            return (
              <article key={v.id} className="rounded-xl bg-surface-container-lowest p-space-md shadow-sm border border-surface-container relative">
                {/* Best Match badge — uses real farm name */}
                {isTopPick && (
                  <div className="absolute -top-3 -right-2 px-3 py-1 bg-primary text-on-primary font-label-sm text-label-sm font-bold rounded-lg shadow-md transform rotate-2">
                    Best Match for {plotName}
                  </div>
                )}

                {/* Header */}
                <div className="flex items-start justify-between mb-space-sm">
                  <div className="flex flex-col">
                    <h2 className="font-headline-md text-headline-md text-on-surface">{v.id}</h2>
                    <span className="font-label-md text-label-md text-on-surface-variant">{v.name !== v.id ? v.name : cropLabel + ' Variety'}</span>
                  </div>
                  {/* Match score ring */}
                  <div className={`w-12 h-12 rounded-full border-[4px] flex items-center justify-center bg-surface-container-lowest shadow-inner flex-shrink-0 ${
                    v.match >= 90 ? 'border-primary' : v.match >= 80 ? 'border-secondary' : 'border-outline'
                  }`}>
                    <span className={`font-label-md text-label-md font-bold ${v.match >= 90 ? 'text-primary' : 'text-on-surface'}`}>
                      {v.match}%
                    </span>
                  </div>
                </div>

                {/* Description — comes from ML, mentions real district & soil */}
                <p className="font-body-md text-body-md text-on-surface-variant mb-space-md">{v.desc}</p>

                {/* 3 Metric Grid — real data from API */}
                <div className="grid grid-cols-3 gap-space-sm mb-space-sm">
                  <div className="bg-surface-container-low rounded-lg p-space-sm flex flex-col items-center text-center">
                    <span className="material-symbols-outlined text-on-surface-variant text-[18px] mb-0.5">timer</span>
                    <span className="font-label-sm text-label-sm text-on-surface-variant">Duration</span>
                    <span className="font-label-lg text-label-lg text-on-surface font-bold mt-0.5">{v.days}</span>
                    <span className="font-label-sm text-label-sm text-on-surface-variant">{daysUnit}</span>
                  </div>
                  <div className="bg-surface-container-low rounded-lg p-space-sm flex flex-col items-center text-center">
                    <span className="material-symbols-outlined text-primary text-[18px] mb-0.5">military_tech</span>
                    <span className="font-label-sm text-label-sm text-on-surface-variant">Yield</span>
                    <span className="font-label-lg text-label-lg text-primary font-bold mt-0.5">{v.yield}</span>
                    <span className="font-label-sm text-label-sm text-primary font-semibold">{yieldUnit}</span>
                  </div>
                  <div className="bg-surface-container-low rounded-lg p-space-sm flex flex-col items-center text-center">
                    <span className="material-symbols-outlined text-on-surface-variant text-[18px] mb-0.5">payments</span>
                    <span className="font-label-sm text-label-sm text-on-surface-variant">Seed Cost</span>
                    <span className="font-label-lg text-label-lg text-on-surface font-bold mt-0.5">{costDisplay}</span>
                    <span className="font-label-sm text-label-sm text-on-surface-variant">per bag</span>
                  </div>
                </div>

                {/* Trait Tags — cleaned from API response */}
                <div className="flex flex-wrap gap-space-xs mb-space-lg">
                  {(v.traits || []).map((t, i) => {
                    const { emoji, label } = cleanTrait(t.text);
                    return (
                      <span
                        key={i}
                        className={`inline-flex items-center gap-1 px-space-sm py-1 rounded-full font-label-md text-label-md font-semibold ${t.color}`}
                      >
                        {emoji} {label}
                      </span>
                    );
                  })}
                </div>

                {/* Select Button */}
                <button
                  onClick={() => handleSelect(v.id, v.name !== v.id ? v.name : v.id)}
                  className={`w-full h-14 rounded-lg font-label-lg text-label-lg flex items-center justify-center gap-space-sm active:scale-[0.99] transition-transform ${
                    isTopPick ? 'bg-primary text-on-primary' : 'bg-surface-container-high text-primary'
                  }`}
                  type="button"
                >
                  <span>Select {v.id}</span>
                  <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
                </button>
              </article>
            );
          })}
        </div>

        {/* Bottom Sourcing Section — uses real district */}
        {!loading && varietiesData.length > 0 && (
          <section className="mt-space-lg rounded-xl bg-surface-container-high p-space-md shadow-sm">
            <div className="flex items-start gap-space-sm">
              <div className="w-10 h-10 rounded-full bg-secondary-container text-on-secondary flex items-center justify-center flex-shrink-0">
                <span className="material-symbols-outlined text-[22px]">store</span>
              </div>
              <div className="flex flex-col flex-1">
                <span className="font-label-lg text-label-lg text-on-background">Need seed source?</span>
                <p className="font-body-md text-body-md text-on-surface-variant mt-0.5">
                  Find certified FPO &amp; KVK seed hubs near <strong>{district}</strong> on the marketplace.
                </p>
              </div>
            </div>
            <button
              onClick={handleFindDealers}
              className="mt-space-md w-full h-14 rounded-lg bg-secondary text-on-secondary font-label-lg text-label-lg flex items-center justify-center gap-space-sm shadow-md active:scale-[0.99] transition-transform"
              type="button"
            >
              <span>Find Certified Seed Dealers Near {district}</span>
              <span className="material-symbols-outlined text-[22px]">arrow_forward</span>
            </button>
          </section>
        )}
      </main>

      {/* Toast Notification */}
      <div className={`fixed bottom-24 left-margin right-margin bg-inverse-surface text-inverse-on-surface p-space-md rounded-xl shadow-xl flex items-center justify-between gap-space-sm transform transition-all duration-300 z-40 ${toastData ? 'translate-y-0 opacity-100 pointer-events-auto' : 'translate-y-32 opacity-0 pointer-events-none'}`}>
        <div className="flex items-center gap-space-sm min-w-0">
          <span className="material-symbols-outlined text-primary-fixed-dim text-[24px]">task_alt</span>
          <div className="flex flex-col min-w-0">
            <span className="font-label-md text-label-md font-bold truncate">
              {toastData ? `${toastData.name} (${toastData.code})` : 'Variety Selected!'}
            </span>
            <span className="font-body-sm text-body-sm text-inverse-on-surface/80 truncate">Saved to {plotName} Sowing Plan</span>
          </div>
        </div>
        <button
          onClick={() => { setToastData(null); navigate('/planning/crop-plan'); }}
          className="font-label-md text-label-md text-primary-fixed underline flex-shrink-0"
          type="button"
        >
          View Plan
        </button>
      </div>
    </div>
  );
}
