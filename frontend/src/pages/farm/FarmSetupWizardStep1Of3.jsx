import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createFarmProfile, updateFarmProfile } from '../../api/farmApi';

const SOIL_TYPES = [
  { key: 'clay_loam', icon: 'landscape', label: 'Clay Loam', desc: 'High water retention' },
  { key: 'black_cotton', icon: 'dark_mode', label: 'Black Cotton', desc: 'Regur, moisture-rich' },
  { key: 'sandy_loam', icon: 'filter_drama', label: 'Sandy Loam', desc: 'Light, well-drained' },
  { key: 'red_laterite', icon: 'water', label: 'Red Laterite', desc: 'Iron-rich, acidic' },
  { key: 'alluvial', icon: 'waves', label: 'Alluvial', desc: 'River valley, fertile' },
  { key: 'silt', icon: 'terrain', label: 'Silt', desc: 'Fine-grained, moist' },
];

const WATER_SOURCES = [
  { key: 'borewell', icon: 'water_pump', label: 'Borewell / Tubewell', sub: 'Submersible or open' },
  { key: 'canal', icon: 'alt_route', label: 'Canal System', sub: 'Scheduled release' },
  { key: 'rainfed', icon: 'rainy', label: 'Rainfed', sub: 'Monsoon reliant' },
  { key: 'pond', icon: 'waves', label: 'Farm Pond', sub: 'River or catchment' },
];

const PRESETS = [1.0, 2.5, 4.5, 7.0, 10.0];

export default function FarmSetupWizardStep1Of3() {
  const navigate = useNavigate();
  const [landSize, setLandSize] = useState(4.5);
  const [soil, setSoil] = useState('clay_loam');
  const [water, setWater] = useState('borewell');
  const [farmName, setFarmName] = useState('');
  const [nameError, setNameError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!farmName.trim()) {
      setNameError('Farm name is required');
      return;
    }
    setNameError('');
    setLoading(true);
    try {
      const farmId = localStorage.getItem('farmId');
      const payload = { name: farmName || 'My Farm', land_size_acres: landSize, soil_type: soil, water_source: water };
      if (farmId) {
        await updateFarmProfile(farmId, payload);
      } else {
        const res = await createFarmProfile(payload);
        localStorage.setItem('farmId', res.data.id);
      }
      navigate('/onboarding/field-mapping');
    } catch {
      setLoading(false);
    }
  };

  const stepLand = (delta) => setLandSize(v => Math.max(0.5, Math.min(50, Math.round((v + delta) * 10) / 10)));

  return (
    <div className="min-h-screen bg-background flex flex-col pt-safe pb-safe">
      {/* Header */}
      <header className="sticky top-16 w-full z-40 pt-safe bg-surface/90 backdrop-blur-xl shadow-[0_1px_8px_rgba(0,0,0,0.04)]">
        <div className="h-20 px-margin flex items-center justify-between gap-space-sm">
          <div className="flex items-center gap-space-sm min-w-0 flex-1">
            <button onClick={() => navigate(-1)} className="w-10 h-10 flex items-center justify-center text-on-surface rounded-full active:bg-surface-container flex-shrink-0" type="button">
              <span className="material-symbols-outlined text-[24px]">arrow_back</span>
            </button>
            <div className="flex flex-col min-w-0">
              <span className="font-label-sm text-label-sm text-on-surface-variant">Step 1 of 3</span>
              <span className="font-headline-sm text-headline-sm text-on-surface truncate">Farm Details</span>
            </div>
          </div>
          {/* Progress dots */}
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <span className="w-6 h-2 rounded-full bg-primary"></span>
            <span className="w-2 h-2 rounded-full bg-surface-container-highest"></span>
            <span className="w-2 h-2 rounded-full bg-surface-container-highest"></span>
          </div>
        </div>
      </header>

      <main className="flex flex-col w-full pt-20 pb-24 px-margin bg-background flex-1 gap-space-lg">
        {/* Farm Name */}
        <div className="flex flex-col gap-space-xs">
          <label className={`font-label-md text-label-md ${nameError ? 'text-error' : 'text-on-surface'}`} htmlFor="farmName">Farm / Plot Name <span className="text-error">*</span></label>
          <input
            id="farmName"
            type="text"
            value={farmName}
            onChange={e => {
              setFarmName(e.target.value);
              if (nameError) setNameError('');
            }}
            placeholder="e.g. Ramesh's North Plot"
            className={`h-14 w-full rounded-xl bg-surface-container-lowest shadow-sm px-space-md font-body-md text-body-md placeholder:text-outline focus:outline-none focus:ring-2 ${nameError ? 'border-2 border-error text-error focus:ring-error' : 'text-on-surface focus:ring-primary-container'}`}
          />
          {nameError && (
            <span className="font-label-sm text-label-sm text-error flex items-center gap-1 mt-1">
              <span className="material-symbols-outlined text-[14px]">error</span>
              {nameError}
            </span>
          )}
        </div>

        {/* Land Size Stepper */}
        <div className="flex flex-col gap-space-sm">
          <div className="flex items-center justify-between">
            <h2 className="font-headline-sm text-headline-sm text-on-surface">Land Size</h2>
            <div className="flex items-baseline gap-1">
              <span className="font-headline-lg-mobile text-headline-lg-mobile text-primary tracking-tight">{landSize.toFixed(1)}</span>
              <span className="font-label-lg text-label-lg text-on-surface-variant">Acres</span>
            </div>
          </div>
          <input
            type="range" min="0.5" max="50" step="0.5"
            value={landSize}
            onChange={e => setLandSize(parseFloat(e.target.value))}
            className="w-full h-2 accent-primary"
          />
          {/* Preset chips */}
          <div className={`grid grid-cols-${PRESETS.length} gap-2`}>
            {PRESETS.map(p => (
              <button
                key={p}
                onClick={() => setLandSize(p)}
                className={`h-11 rounded-lg font-label-md text-label-md flex items-center justify-center active:scale-95 transition-all ${landSize === p ? 'bg-primary text-on-primary' : 'bg-surface-container text-on-surface'}`}
                type="button"
              >
                {p}
              </button>
            ))}
          </div>
          {/* Increment / decrement */}
          <div className="flex items-center justify-center gap-4 mt-1">
            <button onClick={() => stepLand(-0.5)} className="w-11 h-11 rounded-full bg-surface-container flex items-center justify-center text-on-surface text-[22px] active:scale-95" type="button">
              <span className="material-symbols-outlined">remove</span>
            </button>
            <span className="font-label-md text-label-md text-on-surface-variant">{landSize.toFixed(1)} Acres</span>
            <button onClick={() => stepLand(0.5)} className="w-11 h-11 rounded-full bg-surface-container flex items-center justify-center text-on-surface text-[22px] active:scale-95" type="button">
              <span className="material-symbols-outlined">add</span>
            </button>
          </div>
        </div>

        {/* Soil Type */}
        <div className="flex flex-col gap-space-sm">
          <h2 className="font-headline-sm text-headline-sm text-on-surface">Soil Type</h2>
          <div className="grid grid-cols-2 gap-2">
            {SOIL_TYPES.map(({ key, icon, label, desc }) => (
              <button
                key={key}
                onClick={() => setSoil(key)}
                className={`text-left p-3 rounded-xl flex flex-col gap-2 relative shadow-sm active:scale-[0.98] transition-all ${
                  soil === key ? 'bg-primary-container text-on-primary-container' : 'bg-surface-container-lowest text-on-surface'
                }`}
                type="button"
              >
                <div className="flex items-center justify-between">
                  <span className="material-symbols-outlined text-[22px]">{icon}</span>
                  <span className={`material-symbols-outlined text-[18px] ${soil === key ? 'text-on-primary-container' : 'text-on-surface-variant opacity-30'}`}>
                    {soil === key ? 'check_circle' : 'radio_button_unchecked'}
                  </span>
                </div>
                <div>
                  <span className={`font-label-md text-label-md block leading-tight ${soil === key ? 'text-on-primary-container' : 'text-on-surface'}`}>{label}</span>
                  <span className={`font-label-sm text-label-sm line-clamp-1 mt-0.5 ${soil === key ? 'text-on-primary-container/80' : 'text-on-surface-variant'}`}>{desc}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Water Source */}
        <div className="flex flex-col gap-space-sm">
          <h2 className="font-headline-sm text-headline-sm text-on-surface">Primary Water Source</h2>
          <div className="grid grid-cols-2 gap-2">
            {WATER_SOURCES.map(({ key, icon, label, sub }) => (
              <button
                key={key}
                onClick={() => setWater(key)}
                className={`text-left p-3 rounded-xl flex flex-col justify-between h-24 shadow-sm active:scale-[0.98] transition-all ${
                  water === key ? 'bg-primary-container text-on-primary-container' : 'bg-surface-container-lowest text-on-surface'
                }`}
                type="button"
              >
                <div className="flex items-center justify-between">
                  <span className="material-symbols-outlined text-[24px]">{icon}</span>
                  <span className={`material-symbols-outlined text-[18px] ${water === key ? 'text-on-primary-container' : 'text-on-surface-variant opacity-30'}`}>
                    {water === key ? 'check_circle' : 'radio_button_unchecked'}
                  </span>
                </div>
                <div>
                  <span className={`font-label-md text-label-md block leading-tight ${water === key ? 'text-on-primary-container' : ''}`}>{label}</span>
                  <span className={`font-label-sm text-label-sm ${water === key ? 'text-on-primary-container/80' : 'text-on-surface-variant'}`}>{sub}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Offline assurance */}
        <div className="flex items-center gap-space-sm p-3 rounded-xl bg-surface-container text-on-surface-variant">
          <span className="material-symbols-outlined text-primary text-[20px] flex-shrink-0">offline_pin</span>
          <span className="font-label-sm text-label-sm leading-tight">Your farm baseline is cached locally. Next: Crop history & target yield.</span>
        </div>

        {/* Sticky CTA */}
        <div className="sticky bottom-0 pt-2 pb-2 bg-surface/95 backdrop-blur-md -mx-margin px-margin">
          <button
            onClick={handleSave}
            disabled={loading}
            className="w-full h-14 rounded-xl bg-primary-container text-on-primary font-headline-sm text-headline-sm flex items-center justify-center gap-2 shadow-md active:opacity-90 active:scale-[0.99] transition-all"
            type="button"
          >
            {loading ? (
              <><span className="material-symbols-outlined animate-spin text-[20px]">progress_activity</span><span>Saving Farm...</span></>
            ) : (
              <><span>Save & Continue to Step 2</span><span className="material-symbols-outlined text-[20px]">arrow_forward</span></>
            )}
          </button>
        </div>
      </main>
    </div>
  );
}
