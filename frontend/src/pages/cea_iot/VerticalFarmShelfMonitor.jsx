import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getVerticalOptimization } from '../../api/ceaIotApi';

export default function VerticalFarmShelfMonitor() {
  const navigate = useNavigate();
  
  const [verticalData, setVerticalData] = useState(null);
  
  const [masterLightOn, setMasterLightOn] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncDone, setSyncDone] = useState(false);
  
  const [sliders, setSliders] = useState({
    1: 85,
    2: 60,
    3: 75,
  });

  const fetchData = async () => {
    try {
      const farmId = localStorage.getItem('farmId') || '00000000-0000-0000-0000-000000000000';
      const data = await getVerticalOptimization(farmId);
      setVerticalData(data);
    } catch (err) {
      console.error('Error fetching vertical optimization:', err);
      // Optional dummy fallback
      if (!verticalData) {
        setVerticalData({
          layers: [],
          recommendation: "Optimization requires configured facility constraints; showing observed values."
        });
      }
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 4000);
    return () => clearInterval(interval);
  }, []);

  const handleSync = () => {
    setIsSyncing(true);
    setSyncDone(false);
    setTimeout(() => {
      setSyncDone(true);
      setTimeout(() => {
        setIsSyncing(false);
        setSyncDone(false);
      }, 2000);
    }, 800);
  };

  return (
    <div className="min-h-screen bg-surface-container text-on-surface flex flex-col pt-safe pb-safe relative">
      <header className="fixed top-0 w-full z-50 bg-surface-container/90 backdrop-blur-xl border-b border-surface-container-high shadow-sm pt-safe">
        <div className="flex items-center justify-between h-14 px-margin">
          <div className="flex items-center gap-space-sm">
            <button onClick={() => navigate(-1)} className="w-10 h-10 flex items-center justify-center rounded-full text-on-surface active:bg-surface-container-high transition-colors" type="button">
              <span className="material-symbols-outlined text-[24px]">arrow_back</span>
            </button>
            <h1 className="font-headline-sm text-headline-sm font-bold text-on-surface truncate">Vertical Farm Shelf Monitor</h1>
          </div>
          <button className="w-10 h-10 flex items-center justify-center rounded-full text-on-surface active:bg-surface-container-high transition-colors" type="button">
            <span className="material-symbols-outlined text-[24px]">more_vert</span>
          </button>
        </div>
      </header>

      <main className="flex flex-col w-full pt-[64px] pb-24 flex-1">
        
        <section className="px-margin pt-space-sm pb-space-md mb-space-sm bg-surface-container-lowest rounded-b-2xl shadow-sm">
          <div className="flex items-center justify-between mb-space-xs">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-[22px]">dns</span>
              <h1 className="font-headline-sm text-headline-sm text-on-surface">Grow Rack #04</h1>
            </div>
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-primary-container text-on-primary-container font-label-sm text-label-sm">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
              Live Sync
            </div>
          </div>
          
          <div className="flex items-center gap-space-md py-space-xs">
            <div className="flex flex-col">
              <div className="flex items-center gap-1">
                <span className="material-symbols-outlined text-[18px] text-tertiary">timelapse</span>
                <span className="font-label-sm text-label-sm uppercase tracking-wide">Photoperiod</span>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="font-headline-md text-headline-md text-on-surface">16h</span>
                <span className="font-label-sm text-label-sm text-on-surface-variant">ON / 8h OFF</span>
              </div>
              <span className="font-label-sm text-label-sm text-tertiary font-semibold">Active: Day Cycle (9h in)</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-space-sm pt-space-xs">
            <div className="flex items-center justify-between p-space-xs pl-space-sm bg-surface-container rounded-lg min-h-[48px]">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[22px]">lightbulb</span>
                <span className="font-label-md text-label-md text-on-surface">Rack Master Light</span>
              </div>
              <button 
                onClick={() => setMasterLightOn(!masterLightOn)}
                aria-checked={masterLightOn} 
                className={`relative inline-flex h-7 w-12 items-center rounded-full p-0.5 transition-colors focus:outline-none ${masterLightOn ? 'bg-primary-container' : 'bg-surface-container-highest'}`} 
                role="switch" 
                type="button"
              >
                <span className={`inline-block h-6 w-6 rounded-full bg-on-primary shadow-sm transition-transform ${masterLightOn ? 'translate-x-5' : 'translate-x-1'}`}></span>
              </button>
            </div>
            <button className="min-h-[48px] px-space-md py-2 bg-secondary-fixed text-on-secondary-fixed rounded-lg font-label-md text-label-md flex items-center justify-center gap-2 hover:bg-secondary-fixed-dim transition-colors active:scale-95 shadow-sm" type="button">
              <span className="material-symbols-outlined text-secondary text-[20px]">electric_bolt</span>
              <span>Emergency Spectrum Boost</span>
            </button>
          </div>
        </section>

        <div className="px-margin flex flex-col gap-space-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-tertiary text-[20px]">shelves</span>
              <h2 className="font-headline-sm text-headline-sm text-on-surface">Shelf Telemetry &amp; Luminance</h2>
            </div>
            <span className="font-label-sm text-label-sm text-tertiary font-semibold uppercase tracking-wider">4 Active Tiers</span>
          </div>

          <div className="flex flex-col gap-space-md w-full">
            
            <article className="flex flex-col bg-surface-container-lowest rounded-xl shadow-sm overflow-hidden p-space-md gap-space-md">
              <div className="flex items-start gap-space-md">
                <div className="relative w-24 h-24 rounded-lg overflow-hidden shrink-0 bg-surface-container shadow-inner">
                  <img className="w-full h-full object-cover" alt="Genovese Basil" src="https://images.unsplash.com/photo-1598425126848-1db4b2565dd5?q=80&w=400&auto=format&fit=crop"/>
                  <div className="absolute bottom-1 left-1 right-1 bg-inverse-surface/85 backdrop-blur-xs rounded px-1 py-0.5 flex items-center justify-between">
                    <span className="font-label-sm text-label-sm text-inverse-on-surface scale-90 origin-left">Cam 1A</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-primary-fixed-dim animate-pulse"></span>
                  </div>
                </div>
                <div className="flex flex-col min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-1">
                    <span className="font-label-sm text-label-sm uppercase tracking-wide text-tertiary font-bold">Shelf 1 • Top Tier</span>
                    <span className="px-2 py-0.5 rounded-full bg-primary-fixed text-on-primary-fixed font-label-sm text-label-sm">Day 18/28</span>
                  </div>
                  <h3 className="font-headline-sm text-headline-sm text-on-surface truncate">Genovese Basil</h3>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">Vegetative Stage • High Biomass</p>
                  <div className="mt-2 flex items-center gap-1">
                    <span className="px-space-xs py-0.5 rounded bg-tertiary-fixed-dim text-on-tertiary-fixed-variant font-label-sm text-label-sm">Vegetative Boost</span>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-space-xs">
                <div className="flex flex-col p-space-xs rounded-lg bg-surface-container-low text-center">
                  <span className="font-label-sm text-label-sm text-on-surface-variant">Light PPFD</span>
                  <span className="font-label-lg text-label-lg text-on-surface font-bold">320</span>
                  <span className="font-label-sm text-label-sm text-outline">µmol/m²/s</span>
                </div>
                <div className="flex flex-col p-space-xs rounded-lg bg-surface-container-low text-center">
                  <span className="font-label-sm text-label-sm text-on-surface-variant">CO2 Sensor</span>
                  <span className="font-label-lg text-label-lg text-on-surface font-bold">850</span>
                  <span className="font-label-sm text-label-sm text-outline">ppm</span>
                </div>
                <div className="flex flex-col p-space-xs rounded-lg bg-surface-container-low text-center">
                  <span className="font-label-sm text-label-sm text-on-surface-variant">Canopy Temp</span>
                  <span className="font-label-lg text-label-lg text-on-surface font-bold">23.4°</span>
                  <span className="font-label-sm text-label-sm text-outline">Celsius</span>
                </div>
              </div>
              
              <div className="flex flex-col gap-space-xs pt-space-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-tertiary text-[18px]">tune</span>
                    <span className="font-label-md text-label-md text-on-surface">LED Array Power</span>
                  </div>
                  <span className="font-label-md text-label-md text-tertiary font-bold">{sliders[1]}% • Deep Red 660nm</span>
                </div>
                <div className="relative flex items-center w-full py-2">
                  <input 
                    className="w-full h-3 bg-surface-container rounded-lg appearance-none cursor-pointer accent-tertiary" 
                    max="100" min="0" type="range" 
                    value={sliders[1]}
                    onChange={(e) => setSliders({...sliders, 1: Number(e.target.value)})}
                  />
                </div>
              </div>
            </article>

            <article className="flex flex-col bg-surface-container-lowest rounded-xl shadow-sm overflow-hidden p-space-md gap-space-md">
              <div className="flex items-start gap-space-md">
                <div className="relative w-24 h-24 rounded-lg overflow-hidden shrink-0 bg-surface-container shadow-inner">
                  <img className="w-full h-full object-cover" alt="Red Ruby Microgreens" src="https://images.unsplash.com/photo-1615486511484-92e172a2b0e6?q=80&w=400&auto=format&fit=crop"/>
                  <div className="absolute bottom-1 left-1 right-1 bg-inverse-surface/85 backdrop-blur-xs rounded px-1 py-0.5 flex items-center justify-between">
                    <span className="font-label-sm text-label-sm text-inverse-on-surface scale-90 origin-left">Cam 2B</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-primary-fixed-dim animate-pulse"></span>
                  </div>
                </div>
                <div className="flex flex-col min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-1">
                    <span className="font-label-sm text-label-sm uppercase tracking-wide text-tertiary font-bold">Shelf 2 • Mid-Upper</span>
                    <span className="px-2 py-0.5 rounded-full bg-secondary-fixed text-on-secondary-fixed font-label-sm text-label-sm">Day 6/10</span>
                  </div>
                  <h3 className="font-headline-sm text-headline-sm text-on-surface truncate">Red Ruby Microgreens</h3>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">Cotyledon Stage • Dense Mesh</p>
                  <div className="mt-2 flex items-center gap-1">
                    <span className="px-space-xs py-0.5 rounded bg-surface-container-highest text-on-surface-variant font-label-sm text-label-sm">Blue Dominant</span>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-space-xs">
                <div className="flex flex-col p-space-xs rounded-lg bg-surface-container-low text-center">
                  <span className="font-label-sm text-label-sm text-on-surface-variant">Light PPFD</span>
                  <span className="font-label-lg text-label-lg text-on-surface font-bold">140</span>
                  <span className="font-label-sm text-label-sm text-outline">µmol/m²/s</span>
                </div>
                <div className="flex flex-col p-space-xs rounded-lg bg-surface-container-low text-center">
                  <span className="font-label-sm text-label-sm text-on-surface-variant">CO2 Sensor</span>
                  <span className="font-label-lg text-label-lg text-on-surface font-bold">420</span>
                  <span className="font-label-sm text-label-sm text-outline">ppm</span>
                </div>
                <div className="flex flex-col p-space-xs rounded-lg bg-surface-container-low text-center">
                  <span className="font-label-sm text-label-sm text-on-surface-variant">Canopy Temp</span>
                  <span className="font-label-lg text-label-lg text-on-surface font-bold">21.8°</span>
                  <span className="font-label-sm text-label-sm text-outline">Celsius</span>
                </div>
              </div>
              
              <div className="flex flex-col gap-space-xs pt-space-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-tertiary text-[18px]">tune</span>
                    <span className="font-label-md text-label-md text-on-surface">LED Array Power</span>
                  </div>
                  <span className="font-label-md text-label-md text-tertiary font-bold">{sliders[2]}% • Cool Blue 450nm</span>
                </div>
                <div className="relative flex items-center w-full py-2">
                  <input 
                    className="w-full h-3 bg-surface-container rounded-lg appearance-none cursor-pointer accent-tertiary" 
                    max="100" min="0" type="range" 
                    value={sliders[2]}
                    onChange={(e) => setSliders({...sliders, 2: Number(e.target.value)})}
                  />
                </div>
              </div>
            </article>

            <article className="flex flex-col bg-surface-container-lowest rounded-xl shadow-sm overflow-hidden p-space-md gap-space-md">
              <div className="flex items-start gap-space-md">
                <div className="relative w-24 h-24 rounded-lg overflow-hidden shrink-0 bg-surface-container shadow-inner">
                  <img className="w-full h-full object-cover" alt="Butterhead Lettuce" src="https://images.unsplash.com/photo-1622383563227-04401ab4e5ea?q=80&w=400&auto=format&fit=crop"/>
                  <div className="absolute bottom-1 left-1 right-1 bg-inverse-surface/85 backdrop-blur-xs rounded px-1 py-0.5 flex items-center justify-between">
                    <span className="font-label-sm text-label-sm text-inverse-on-surface scale-90 origin-left">Cam 3C</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-primary-fixed-dim animate-pulse"></span>
                  </div>
                </div>
                <div className="flex flex-col min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-1">
                    <span className="font-label-sm text-label-sm uppercase tracking-wide text-tertiary font-bold">Shelf 3 • Mid-Lower</span>
                    <span className="px-2 py-0.5 rounded-full bg-primary-fixed text-on-primary-fixed font-label-sm text-label-sm">Day 22/35</span>
                  </div>
                  <h3 className="font-headline-sm text-headline-sm text-on-surface truncate">Butterhead Lettuce</h3>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">Maturation Stage • Full Head</p>
                  <div className="mt-2 flex items-center gap-1">
                    <span className="px-space-xs py-0.5 rounded bg-surface-container-highest text-on-surface-variant font-label-sm text-label-sm">Full Spectrum</span>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-space-xs">
                <div className="flex flex-col p-space-xs rounded-lg bg-surface-container-low text-center">
                  <span className="font-label-sm text-label-sm text-on-surface-variant">Light PPFD</span>
                  <span className="font-label-lg text-label-lg text-on-surface font-bold">220</span>
                  <span className="font-label-sm text-label-sm text-outline">µmol/m²/s</span>
                </div>
                <div className="flex flex-col p-space-xs rounded-lg bg-surface-container-low text-center">
                  <span className="font-label-sm text-label-sm text-on-surface-variant">CO2 Sensor</span>
                  <span className="font-label-lg text-label-lg text-on-surface font-bold">600</span>
                  <span className="font-label-sm text-label-sm text-outline">ppm</span>
                </div>
                <div className="flex flex-col p-space-xs rounded-lg bg-surface-container-low text-center">
                  <span className="font-label-sm text-label-sm text-on-surface-variant">Canopy Temp</span>
                  <span className="font-label-lg text-label-lg text-on-surface font-bold">20.5°</span>
                  <span className="font-label-sm text-label-sm text-outline">Celsius</span>
                </div>
              </div>
              
              <div className="flex flex-col gap-space-xs pt-space-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-tertiary text-[18px]">tune</span>
                    <span className="font-label-md text-label-md text-on-surface">LED Array Power</span>
                  </div>
                  <span className="font-label-md text-label-md text-tertiary font-bold">{sliders[3]}% • Balanced Far Red</span>
                </div>
                <div className="relative flex items-center w-full py-2">
                  <input 
                    className="w-full h-3 bg-surface-container rounded-lg appearance-none cursor-pointer accent-tertiary" 
                    max="100" min="0" type="range" 
                    value={sliders[3]}
                    onChange={(e) => setSliders({...sliders, 3: Number(e.target.value)})}
                  />
                </div>
              </div>
            </article>

            <article className="flex flex-col bg-surface-container-lowest rounded-xl shadow-sm overflow-hidden p-space-md gap-space-md">
              <div className="flex items-start gap-space-md">
                <div className="relative w-24 h-24 rounded-lg overflow-hidden shrink-0 bg-surface-container-highest shadow-inner">
                  <img className="w-full h-full object-cover" alt="Seedling Germination" src="https://images.unsplash.com/photo-1599859549303-3112bdcf75ea?q=80&w=400&auto=format&fit=crop"/>
                  <div className="absolute bottom-1 left-1 right-1 bg-inverse-surface/85 backdrop-blur-xs rounded px-1 py-0.5 flex items-center justify-between">
                    <span className="font-label-sm text-label-sm text-inverse-on-surface scale-90 origin-left">Cam 4D</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-secondary-fixed-dim animate-pulse"></span>
                  </div>
                </div>
                <div className="flex flex-col min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-1">
                    <span className="font-label-sm text-label-sm uppercase tracking-wide text-tertiary font-bold">Shelf 4 • Base Tier</span>
                    <span className="px-2 py-0.5 rounded-full bg-surface-container-high text-on-surface-variant font-label-sm text-label-sm">Day 2/5</span>
                  </div>
                  <h3 className="font-headline-sm text-headline-sm text-on-surface truncate">Seedling Germination</h3>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">Dark Stage • High Moisture</p>
                  <div className="mt-2 flex items-center gap-1">
                    <span className="px-space-xs py-0.5 rounded bg-surface-container-highest text-on-surface-variant font-label-sm text-label-sm">Complete Darkness</span>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-space-xs">
                <div className="flex flex-col p-space-xs rounded-lg bg-surface-container-low text-center">
                  <span className="font-label-sm text-label-sm text-on-surface-variant">Light PPFD</span>
                  <span className="font-label-lg text-label-lg text-on-surface font-bold">0</span>
                  <span className="font-label-sm text-label-sm text-outline">Darkness</span>
                </div>
                <div className="flex flex-col p-space-xs rounded-lg bg-surface-container-low text-center">
                  <span className="font-label-sm text-label-sm text-on-surface-variant">Dome RH%</span>
                  <span className="font-label-lg text-label-lg text-on-surface font-bold">92%</span>
                  <span className="font-label-sm text-label-sm text-outline">Humidity</span>
                </div>
                <div className="flex flex-col p-space-xs rounded-lg bg-surface-container-low text-center">
                  <span className="font-label-sm text-label-sm text-on-surface-variant">Heat Mat</span>
                  <span className="font-label-lg text-label-lg text-on-surface font-bold">24.0°</span>
                  <span className="font-label-sm text-label-sm text-outline">Root Temp</span>
                </div>
              </div>
              
              <div className="flex items-center justify-between p-space-sm rounded-lg bg-surface-container-low">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-outline text-[20px]">nightlight</span>
                  <div className="flex flex-col">
                    <span className="font-label-sm text-label-sm text-on-surface font-semibold">Lights 0% (Dark Routine)</span>
                    <span className="font-label-sm text-label-sm text-on-surface-variant">Scheduled Ignition: Tomorrow 06:00 AM</span>
                  </div>
                </div>
                <span className="material-symbols-outlined text-outline text-[20px]">lock_clock</span>
              </div>
            </article>
          </div>

          <section className="flex flex-col gap-space-xs mt-space-sm pt-space-xs">
            <button 
              disabled={isSyncing}
              onClick={handleSync}
              className="min-h-[56px] w-full px-space-lg bg-secondary-container text-on-secondary-container rounded-xl font-headline-sm text-headline-sm flex items-center justify-center gap-space-sm shadow-md active:scale-98 transition-transform disabled:opacity-90" 
              type="button"
            >
              {isSyncing ? (
                <>
                  <span className="material-symbols-outlined text-[24px] animate-spin">refresh</span>
                  <span>Synchronizing DLI...</span>
                </>
              ) : syncDone ? (
                <>
                  <span className="material-symbols-outlined text-[24px]">check_circle</span>
                  <span>Shelves Synchronized (16 mol/m²/d)</span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[24px]">sync_alt</span>
                  <span>Synchronize All Shelves to DLI Target</span>
                </>
              )}
            </button>
            <div className="flex items-center justify-center gap-1.5 text-center text-on-surface-variant py-1">
              <span className="material-symbols-outlined text-tertiary text-[16px]">info</span>
              <span className="font-label-sm text-label-sm">Daily Light Integral Target: <strong className="text-tertiary">16.0 mol/m²/day</strong></span>
            </div>
          </section>
        </div>

      </main>

      <nav className="fixed bottom-0 w-full z-50 pb-safe bg-surface-container-lowest/90 backdrop-blur-xl shadow-[0_-2px_12px_rgba(0,59,113,0.06)]">
        <div className="flex justify-around items-center h-20 px-space-xs">
          <button onClick={() => navigate('/iot/dashboard')} className="flex flex-col items-center justify-center gap-1 min-w-[44px] min-h-[44px] px-space-xs py-1 text-on-surface-variant transition-colors hover:text-on-surface">
            <span className="material-symbols-outlined text-[24px]">sensors</span>
            <span className="font-label-sm text-label-sm">Sensors</span>
          </button>
          <button onClick={() => navigate('/iot/hydro-climate')} className="flex flex-col items-center justify-center gap-1 min-w-[44px] min-h-[44px] px-space-xs py-1 text-on-surface-variant transition-colors hover:text-on-surface">
            <span className="material-symbols-outlined text-[24px]">water_drop</span>
            <span className="font-label-sm text-label-sm">Hydro/Climate</span>
          </button>
          <button onClick={() => navigate('/iot/shelves')} className="flex flex-col items-center justify-center gap-1 min-w-[44px] min-h-[44px] px-space-xs py-1 transition-colors text-tertiary font-label-md">
            <span className="material-symbols-outlined text-[24px]">layers</span>
            <span className="font-label-sm text-label-sm">Shelves</span>
          </button>
          <button onClick={() => navigate('/iot/traceability')} className="flex flex-col items-center justify-center gap-1 min-w-[44px] min-h-[44px] px-space-xs py-1 text-on-surface-variant transition-colors hover:text-on-surface">
            <span className="material-symbols-outlined text-[24px]">bolt</span>
            <span className="font-label-sm text-label-sm">Trace & Power</span>
          </button>
        </div>
      </nav>
    </div>
  );
}
