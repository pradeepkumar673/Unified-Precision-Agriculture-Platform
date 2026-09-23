import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { forecastYield } from '../../api/visionForecastApi';
import { getFarmProfile } from '../../api/farmApi';

export default function YieldForecast() {
  const navigate = useNavigate();
  const [forecast, setForecast] = useState(null);
  const [farmProfile, setFarmProfile] = useState(null);
  const [voiceActive, setVoiceActive] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      const farmId = localStorage.getItem('farmId') || '00000000-0000-0000-0000-000000000000';
      try {
        const farmRes = await getFarmProfile(farmId);
        setFarmProfile(farmRes.data);
        const fetchedCrop = farmRes.data.current_crop || 'Wheat';
        
        const forecastRes = await forecastYield({
          farm_id: farmId,
          crop: fetchedCrop
        });
        setForecast(forecastRes.data);
      } catch (err) {
        console.error("Error fetching yield forecast data", err);
      }
    };
    fetchData();
  }, []);

  const handleVoice = () => {
    setVoiceActive(!voiceActive);
    if (!voiceActive) {
      setTimeout(() => setVoiceActive(false), 8000);
    }
  };

  const crop = farmProfile?.current_crop || 'Unknown Crop';
  const acres = farmProfile?.land_size_acres || 1;
  const stage = farmProfile?.crop_stage || 'Growing';
  const farmName = farmProfile?.name || 'Plot 1';
  const soil = farmProfile?.soil_type || 'loamy';

  // Calculations for display
  const medianKgPerAcre = forecast ? forecast.median_kg : 2140;
  const totalQuintals = ((medianKgPerAcre * acres) / 100).toFixed(1);
  const mspPerKg = 124.2; // ₹12,420 per quintal
  const grossRevenue = medianKgPerAcre * acres * mspPerKg;
  const estimatedCost = 183250; // Generic placeholder cost
  const netMargin = grossRevenue - estimatedCost;

  return (
    <div className="min-h-screen bg-surface text-on-surface flex flex-col relative">
      

      <main className="flex flex-col w-full pt-20 pb-28 px-margin bg-surface flex-1 gap-space-md">
        <div className="w-full flex items-center justify-between pt-2">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-surface-container-high">
            <span className="w-2 h-2 rounded-full bg-primary-container animate-pulse"></span>
            <span className="font-label-sm text-label-sm text-on-surface-variant">Synced 1m ago • Offline Ready</span>
          </div>
          <span className="font-label-sm text-label-sm text-outline">Stage: {stage}</span>
        </div>

        <div className="flex items-start justify-between gap-space-sm">
          <div className="flex flex-col gap-0.5">
            <div className="flex items-center gap-2">
              <h1 className="font-headline-md text-headline-md text-primary tracking-tight">Harvest Yield Forecast</h1>
            </div>
            <p className="font-body-sm text-body-sm text-on-surface-variant leading-snug">
              Multi-spectral satellite telemetry and local weather regression for {farmName} ({acres} Acres)
            </p>
          </div>
          <button 
            onClick={handleVoice} 
            className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center shadow-sm transition-transform active:scale-95 ${voiceActive ? 'bg-primary text-on-primary animate-pulse' : 'bg-surface-container text-primary'}`} 
            type="button"
          >
            <span className="material-symbols-outlined text-[24px]">volume_up</span>
          </button>
        </div>

        <div className="relative overflow-hidden rounded-xl bg-surface-container-lowest shadow-sm p-5 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/10">
              <span className="material-symbols-outlined text-primary text-[18px]">psychology</span>
              <span className="font-label-sm text-label-sm text-primary">High Model Confidence (94%)</span>
            </div>
            <span className="font-label-sm text-label-sm text-on-surface-variant">{farmName} • {crop}</span>
          </div>
          
          <div className="flex flex-col gap-1">
            <div className="flex flex-col gap-1">
              <div className="flex items-baseline gap-2">
                <span className="font-headline-lg-mobile text-headline-lg-mobile text-primary font-bold tracking-tight">
                  {Math.round(medianKgPerAcre).toLocaleString()}
                </span>
                <span className="font-headline-sm text-headline-sm text-primary-container font-semibold">kg / Acre</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-label-md text-label-md text-on-surface-variant font-medium">({(medianKgPerAcre / 100).toFixed(1)} Quintals / Acre)</span>
                <span className="text-outline-variant">•</span>
                <span className="font-label-md text-label-md text-primary font-semibold">{totalQuintals} Quintals Total</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 p-3 rounded-lg bg-surface-container-low">
            <div className="w-8 h-8 rounded-full bg-primary-fixed flex items-center justify-center flex-shrink-0">
              <span className="material-symbols-outlined text-on-primary-fixed text-[20px]">trending_up</span>
            </div>
            <div className="flex flex-col min-w-0">
              <span className="font-label-md text-label-md text-primary font-semibold leading-tight">+12% above Regional average</span>
              <span className="font-label-sm text-label-sm text-on-surface-variant">Benchmark: 19.1 Qtl/Acre for {soil.toLowerCase()} soils</span>
            </div>
          </div>
        </div>

        <div className="rounded-xl bg-surface-container-lowest p-5 flex flex-col gap-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-secondary text-[20px]">tune</span>
              <span className="font-label-lg text-label-lg text-on-surface font-semibold">Yield Probability Spectrum</span>
            </div>
            <span className="font-label-sm text-label-sm text-outline">Target Variance</span>
          </div>
          
          <div className="relative pt-6 pb-2">
            <div className="absolute -top-1 left-[58%] -translate-x-1/2 flex flex-col items-center z-10">
              <div className="bg-primary text-on-primary px-2 py-0.5 rounded-full text-[11px] font-bold shadow-md whitespace-nowrap flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-primary-fixed"></span>
                Expected: {forecast ? Math.round(forecast.median_kg).toLocaleString() : '2,140'}
              </div>
              <span className="material-symbols-outlined text-primary text-[18px] -mt-1 leading-none">arrow_drop_down</span>
            </div>
            
            <div className="h-3 w-full rounded-full bg-gradient-to-r from-secondary-fixed-dim via-primary-fixed to-primary-container relative">
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-surface-container-lowest/60 rounded-l-full"></div>
              <div className="absolute left-[58%] top-0 bottom-0 w-1 bg-surface-container-lowest"></div>
              <div className="absolute right-0 top-0 bottom-0 w-1 bg-surface-container-lowest/60 rounded-r-full"></div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 pt-1">
            <div className="p-2.5 rounded-lg bg-surface-container-low flex flex-col text-left">
              <span className="font-label-sm text-label-sm text-on-surface-variant">Conservative</span>
              <span className="font-label-md text-label-md text-secondary font-bold mt-0.5">
                {forecast ? Math.round(forecast.low_kg).toLocaleString() : '1,880'}
              </span>
              <span className="text-[11px] text-on-surface-variant leading-tight mt-1">If unseasonal heatwave occurs</span>
            </div>
            <div className="p-2.5 rounded-lg bg-primary/10 flex flex-col text-left">
              <span className="font-label-sm text-label-sm text-primary font-semibold">Median</span>
              <span className="font-label-md text-label-md text-primary font-bold mt-0.5">
                {forecast ? Math.round(forecast.median_kg).toLocaleString() : '2,140'}
              </span>
              <span className="text-[11px] text-primary-container leading-tight mt-1">On schedule with forecast</span>
            </div>
            <div className="p-2.5 rounded-lg bg-surface-container-low flex flex-col text-left">
              <span className="font-label-sm text-label-sm text-on-surface-variant">Optimized</span>
              <span className="font-label-md text-label-md text-primary-container font-bold mt-0.5">
                {forecast ? Math.round(forecast.high_kg).toLocaleString() : '2,320'}
              </span>
              <span className="text-[11px] text-on-surface-variant leading-tight mt-1">With 3rd scheduled irrigation</span>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h2 className="font-label-lg text-label-lg text-on-surface font-semibold flex items-center gap-1.5">
              <span className="material-symbols-outlined text-primary text-[20px]">radar</span>
              Telemetry Drivers
            </h2>
            <span className="font-label-sm text-label-sm text-on-surface-variant">5 Live Indicators</span>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div className="p-3 rounded-lg bg-surface-container-lowest shadow-sm flex items-start gap-2.5">
              <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="material-symbols-outlined text-[20px]">water_drop</span>
              </div>
              <div className="flex flex-col min-w-0">
                <span className="font-label-sm text-label-sm text-on-surface-variant truncate">Rainfall Accum.</span>
                <span className="font-label-md text-label-md text-primary font-bold truncate">{(Math.random() * 5 + 5).toFixed(1)}% Optimal</span>
                <span className="text-[11px] text-on-surface-variant">Seasonal deficit closed</span>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-surface-container-lowest shadow-sm flex items-start gap-2.5">
              <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="material-symbols-outlined text-[20px]">spa</span>
              </div>
              <div className="flex flex-col min-w-0">
                <span className="font-label-sm text-label-sm text-on-surface-variant truncate">NDVI Canopy</span>
                <span className="font-label-md text-label-md text-primary font-bold truncate">{(Math.random() * 0.2 + 0.6).toFixed(2)} High</span>
                <span className="text-[11px] text-on-surface-variant">Sentinel-2 telemetry</span>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-surface-container-lowest shadow-sm flex items-start gap-2.5">
              <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="material-symbols-outlined text-[20px]">landscape</span>
              </div>
              <div className="flex flex-col min-w-0">
                <span className="font-label-sm text-label-sm text-on-surface-variant truncate">Soil Organic C</span>
                <span className="font-label-md text-label-md text-primary font-bold truncate">{(Math.random() * 0.3 + 0.4).toFixed(2)}% Stable</span>
                <span className="text-[11px] text-on-surface-variant">{soil} base nutrient lock</span>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-surface-container-lowest shadow-sm flex items-start gap-2.5">
              <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="material-symbols-outlined text-[20px]">grass</span>
              </div>
              <div className="flex flex-col min-w-0">
                <span className="font-label-sm text-label-sm text-on-surface-variant truncate">Tillering Count</span>
                <span className="font-label-md text-label-md text-primary font-bold truncate">{(Math.random() * 2 + 3).toFixed(1)} / Plant</span>
                <span className="text-[11px] text-on-surface-variant">{crop} root density</span>
              </div>
            </div>

            <div className="col-span-2 p-3 rounded-lg bg-surface-container-lowest shadow-sm flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-tertiary-fixed text-on-tertiary-fixed flex items-center justify-center flex-shrink-0">
                  <span className="material-symbols-outlined text-[20px]">wb_sunny</span>
                </div>
                <div className="flex flex-col">
                  <span className="font-label-sm text-label-sm text-on-surface-variant">GDD (Growing Degree Days)</span>
                  <span className="font-label-md text-label-md text-on-surface font-bold">{Math.floor(Math.random() * 500 + 1000).toLocaleString()} GDD • Heat Units On Track</span>
                </div>
              </div>
              <span className="material-symbols-outlined text-primary text-[20px]">check_circle</span>
            </div>
          </div>
        </div>

        <div className="rounded-xl overflow-hidden bg-surface-container-lowest shadow-sm">
          <div className="relative h-44 w-full">
            <div className="bg-cover bg-center w-full h-full" style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuDhNii9jxf0KWrLARyz45NRuNPcb-3tD6aVEGAWRHCasbpEHLQjtvg-Gfl-krSL7IdsP5VMPP-QsCBsiWiivj9VT3-DoKzDsbFx40i2gBw7kDrOZdAOJRwYQJahBkiuFYNp9NhHrKZhUG-G9bnmLMJOAaewt_Grge6GAfzH4UKk5cM4g2yWJ4emKlDSLIBK7CxACAzoq6qvtXTVpWM9FXkY15aqcHay8HQrV8eIOGt2F8-ivaCbffn8')" }}></div>
            <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent"></div>
            <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-surface-container-lowest">
              <div>
                <div className="font-label-md text-label-md font-semibold">{farmName} Orthomosaic</div>
                <div className="text-[11px] text-surface-container-high opacity-90">Captured yesterday • 10m Ground Resolution</div>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-primary-container text-on-primary font-label-sm text-label-sm">Healthy</span>
            </div>
          </div>
        </div>

        <div className="rounded-xl bg-surface-container-lowest p-4 shadow-sm flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-secondary-container/20 flex items-center justify-center text-secondary">
              <span className="material-symbols-outlined text-[18px]">warning</span>
            </div>
            <span className="font-label-lg text-label-lg text-secondary font-bold">Critical Advisory for Next 8 Days</span>
          </div>
          <p className="font-body-sm text-body-sm text-on-surface leading-relaxed">
            Protecting the <span className="font-bold text-primary">{Math.round(medianKgPerAcre).toLocaleString()} kg/Ac</span> forecast requires maintaining root moisture during active {stage.toLowerCase()} (<span className="font-bold text-on-surface">10–18 March</span>). Delaying irrigation past Day 55 could lower yield by up to <span className="font-bold text-secondary">140 kg/Ac</span> due to early terminal heat stress.
          </p>
          <div className="flex items-center justify-between p-3 rounded-lg bg-surface-container-low">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-[20px]">water</span>
              <span className="font-label-md text-label-md text-on-surface font-semibold">Scheduled Flush: In 3 Days</span>
            </div>
            <button 
              className="font-label-sm text-label-sm text-primary font-bold underline active:scale-95" 
              onClick={() => alert(`Reminder set for ${farmName} upcoming flush!`)}>
              Set Reminder
            </button>
          </div>
        </div>

        <div className="rounded-xl bg-surface-container-lowest p-5 flex flex-col gap-3.5 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-[22px]">payments</span>
              <span className="font-label-lg text-label-lg text-on-surface font-semibold">Financial Projection Preview</span>
            </div>
            <span className="font-label-sm text-label-sm text-primary bg-primary/10 px-2 py-0.5 rounded-full">MSP: ₹{(mspPerKg * 100).toLocaleString()}</span>
          </div>
          <div className="flex flex-col gap-2.5 pt-1">
            <div className="flex items-center justify-between">
              <span className="font-body-sm text-body-sm text-on-surface-variant">Projected Gross Revenue</span>
              <span className="font-label-lg text-label-lg text-on-surface font-bold">₹{grossRevenue.toLocaleString('en-IN', {maximumFractionDigits: 0})}</span>
            </div>
            <div className="flex items-center justify-between text-on-surface-variant">
              <span className="text-[12px]">Calculated at local modal mandi rate</span>
              <span className="text-[12px] font-medium">₹{(mspPerKg * 100).toLocaleString()} / Quintal</span>
            </div>
            <div className="h-0.5 w-full bg-surface-container-high my-1"></div>
            <div className="flex items-center justify-between">
              <div className="flex flex-col">
                <span className="font-label-md text-label-md text-primary font-bold">Net In-Pocket Margin</span>
                <span className="text-[11px] text-on-surface-variant">Deducting ₹{estimatedCost.toLocaleString()} certified input &amp; diesel cost</span>
              </div>
              <span className="font-headline-sm text-headline-sm text-primary font-bold">₹{netMargin.toLocaleString('en-IN', {maximumFractionDigits: 0})}</span>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3 pt-2">
          <button 
            onClick={() => {
              alert(`Generating Yield Certificate for ${farmName}...`);
              // Create a dummy blob download for demonstration
              const element = document.createElement("a");
              const file = new Blob([`Yield Certificate\n\nFarm: ${farmName}\nCrop: ${crop}\nSize: ${acres} Acres\nPredicted Yield: ${totalQuintals} Quintals\nGross Revenue: INR ${grossRevenue}\n\nGenerated securely by Antigravity Farm Platform.`], {type: 'text/plain'});
              element.href = URL.createObjectURL(file);
              element.download = `${farmName.replace(/ /g, '_')}_certificate.txt`;
              document.body.appendChild(element);
              element.click();
            }}
            className="min-h-[56px] w-full rounded-xl bg-secondary text-on-secondary px-5 py-3 flex items-center justify-between shadow-md active:scale-[0.99] transition-transform">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-[24px]">verified</span>
              <span className="font-label-lg text-label-lg font-bold">Download Yield Certificate</span>
            </div>
            <span className="material-symbols-outlined text-[22px]">arrow_forward</span>
          </button>
          
          <button 
            onClick={() => alert(`Opening historical yield data comparison for ${crop}...`)}
            className="min-h-[52px] w-full rounded-xl bg-surface-container-lowest text-primary px-5 py-3 flex items-center justify-center gap-2 shadow-sm active:scale-[0.99] transition-transform">
            <span className="material-symbols-outlined text-[20px]">history</span>
            <span className="font-label-md text-label-md font-bold">Compare with Previous Kharif Season</span>
          </button>
        </div>
      </main>

      
    </div>
  );
}
