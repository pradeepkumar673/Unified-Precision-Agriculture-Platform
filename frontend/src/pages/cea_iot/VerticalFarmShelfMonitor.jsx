import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getVerticalOptimization, updateSetpoints } from '../../api/ceaIotApi';
import AppShell from '../../layouts/AppShell';

const SHELF_CONFIGS = [
  {
    id: 'shelf_1',
    name: 'Genovese Basil',
    tier: 'Top Tier',
    stage: 'Vegetative Stage • High Biomass',
    tag: 'Vegetative Boost',
    img: 'https://images.unsplash.com/photo-1598425126848-1db4b2565dd5?q=80&w=400&auto=format&fit=crop',
    cam: 'Cam 1A',
    day: 'Day 18/28',
    defaultPpfd: 320,
    defaultCo2: 850,
    defaultTemp: 23.4,
    colorName: 'Deep Red 660nm',
    defaultSlider: 85
  },
  {
    id: 'shelf_2',
    name: 'Red Ruby Microgreens',
    tier: 'Mid-Upper',
    stage: 'Cotyledon Stage • Dense Mesh',
    tag: 'Blue Dominant',
    img: 'https://images.unsplash.com/photo-1615486511484-92e172a2b0e6?q=80&w=400&auto=format&fit=crop',
    cam: 'Cam 2B',
    day: 'Day 6/10',
    defaultPpfd: 140,
    defaultCo2: 420,
    defaultTemp: 21.8,
    colorName: 'Cool Blue 450nm',
    defaultSlider: 60
  },
  {
    id: 'shelf_3',
    name: 'Butterhead Lettuce',
    tier: 'Mid-Lower',
    stage: 'Maturation Stage • Full Head',
    tag: 'Full Spectrum',
    img: 'https://images.unsplash.com/photo-1622383563227-04401ab4e5ea?q=80&w=400&auto=format&fit=crop',
    cam: 'Cam 3C',
    day: 'Day 22/35',
    defaultPpfd: 220,
    defaultCo2: 600,
    defaultTemp: 20.5,
    colorName: 'Balanced Far Red',
    defaultSlider: 75
  },
  {
    id: 'shelf_4',
    name: 'Seedling Germination',
    tier: 'Base Tier',
    stage: 'Dark Stage • High Moisture',
    tag: 'Complete Darkness',
    img: 'https://images.unsplash.com/photo-1599859549303-3112bdcf75ea?q=80&w=400&auto=format&fit=crop',
    cam: 'Cam 4D',
    day: 'Day 2/5',
    defaultPpfd: 0,
    defaultCo2: 400, // Not explicitly shown but good for data structure
    defaultTemp: 24.0,
    colorName: 'Dark Routine',
    defaultSlider: 0,
    isDark: true
  }
];

export default function VerticalFarmShelfMonitor() {
  const navigate = useNavigate();
  const farmId = localStorage.getItem('farmId') || '00000000-0000-0000-0000-000000000000';
  
  const [layers, setLayers] = useState([]);
  const [sliders, setSliders] = useState({});
  const [masterLightOn, setMasterLightOn] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncDone, setSyncDone] = useState(false);

  const fetchData = async () => {
    try {
      const data = await getVerticalOptimization(farmId);
      if (data && data.layers && data.layers.length > 0) {
        setLayers(data.layers);
      } else {
        // Fallback dummy for UI if no data
        setLayers(SHELF_CONFIGS.map(c => ({
          layer: c.id,
          light_intensity: c.defaultPpfd,
          temp: c.defaultTemp
        })));
      }
    } catch (err) {
      console.error('Error fetching vertical optimization:', err);
      // Fallback dummy for UI
      if (layers.length === 0) {
        setLayers(SHELF_CONFIGS.map(c => ({
          layer: c.id,
          light_intensity: c.defaultPpfd,
          temp: c.defaultTemp
        })));
      }
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 8000);
    
    const initSliders = {};
    SHELF_CONFIGS.forEach(c => initSliders[c.id] = c.defaultSlider);
    setSliders(initSliders);
    
    return () => clearInterval(interval);
  }, []);

  const handleSync = async () => {
    setIsSyncing(true);
    setSyncDone(false);
    try {
      // Create setpoints payload using current sliders
      const setpoints = {};
      Object.keys(sliders).forEach(key => {
        setpoints[`${key}_led_power`] = sliders[key];
      });
      setpoints['dli_target'] = 16.0;
      setpoints['master_light'] = masterLightOn ? 1.0 : 0.0;
      
      await updateSetpoints(farmId, setpoints);
      
      setSyncDone(true);
      setTimeout(() => {
        setSyncDone(false);
      }, 3000);
    } catch (err) {
      alert("Failed to synchronize with PLC. " + (err.response?.data?.detail || ""));
    } finally {
      setIsSyncing(false);
    }
  };

  const getLayerData = (id) => layers.find(l => l.layer === id || l.layer === id.replace('shelf_', ''));

  return (
    <div className="min-h-screen bg-surface-container text-on-surface flex flex-col relative">
      <AppShell variant="detail" title="Vertical Farm Shelf Monitor">
        <main className="flex flex-col w-full pb-24 flex-1">
          
          <section className="px-margin pt-space-sm pb-space-md mb-space-sm bg-surface-container-lowest rounded-b-2xl shadow-sm border-b border-outline-variant/20">
            <div className="flex items-center justify-between mb-space-xs">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[22px]">dns</span>
                <h1 className="font-headline-sm text-headline-sm text-on-surface font-bold">Grow Rack #04</h1>
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
                  <span className="font-headline-md text-headline-md text-on-surface font-bold">16h</span>
                  <span className="font-label-sm text-label-sm text-on-surface-variant">ON / 8h OFF</span>
                </div>
                <span className="font-label-sm text-label-sm text-tertiary font-semibold">Active: Day Cycle (9h in)</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-space-sm pt-space-xs">
              <div className="flex items-center justify-between p-space-xs pl-space-sm bg-surface-container rounded-lg min-h-[48px] border border-outline-variant/30">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-[22px]">lightbulb</span>
                  <span className="font-label-md text-label-md text-on-surface font-bold">Rack Master Light</span>
                </div>
                <button 
                  onClick={() => setMasterLightOn(!masterLightOn)}
                  aria-checked={masterLightOn} 
                  className={`relative inline-flex h-7 w-12 items-center rounded-full p-0.5 transition-colors focus:outline-none ${masterLightOn ? 'bg-primary' : 'bg-surface-container-highest'}`} 
                  role="switch" 
                  type="button"
                >
                  <span className={`inline-block h-6 w-6 rounded-full bg-surface shadow-sm transition-transform ${masterLightOn ? 'translate-x-5' : 'translate-x-1'}`}></span>
                </button>
              </div>
              <button 
                className="min-h-[48px] px-space-md py-2 bg-error-container text-on-error-container rounded-lg font-label-md text-label-md font-bold flex items-center justify-center gap-2 active:scale-95 shadow-sm" 
                type="button"
                onClick={() => alert("Emergency Spectrum Boost activated! Check chiller capacity.")}
              >
                <span className="material-symbols-outlined text-error text-[20px]">electric_bolt</span>
                <span>Emergency Spectrum Boost</span>
              </button>
            </div>
          </section>

          <div className="px-margin flex flex-col gap-space-sm mt-space-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-tertiary text-[20px]">shelves</span>
                <h2 className="font-headline-sm text-headline-sm text-on-surface font-bold">Shelf Telemetry &amp; Luminance</h2>
              </div>
              <span className="font-label-sm text-label-sm text-tertiary font-semibold uppercase tracking-wider">{SHELF_CONFIGS.length} Active Tiers</span>
            </div>

            <div className="flex flex-col gap-space-md w-full">
              {SHELF_CONFIGS.map((config, index) => {
                const liveData = getLayerData(config.id);
                // Dynamic rendering using live telemetry if available, fallback to defaults otherwise
                const ppfd = liveData && liveData.light_intensity != null ? liveData.light_intensity : config.defaultPpfd;
                const temp = liveData && liveData.temp != null ? liveData.temp : config.defaultTemp;
                
                return (
                  <article key={config.id} className="flex flex-col bg-surface-container-lowest rounded-xl shadow-sm overflow-hidden p-space-md gap-space-md border border-outline-variant/30">
                    <div className="flex items-start gap-space-md">
                      <div className="relative w-24 h-24 rounded-lg overflow-hidden shrink-0 bg-surface-container shadow-inner">
                        <img className="w-full h-full object-cover" alt={config.name} src={config.img}/>
                        <div className="absolute bottom-1 left-1 right-1 bg-inverse-surface/85 backdrop-blur-xs rounded px-1 py-0.5 flex items-center justify-between">
                          <span className="font-label-sm text-label-sm text-inverse-on-surface scale-90 origin-left">{config.cam}</span>
                          <span className={`w-1.5 h-1.5 rounded-full ${config.isDark ? 'bg-secondary-fixed-dim' : 'bg-primary-fixed-dim animate-pulse'}`}></span>
                        </div>
                      </div>
                      <div className="flex flex-col min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-1">
                          <span className="font-label-sm text-label-sm uppercase tracking-wide text-tertiary font-bold">Shelf {index + 1} • {config.tier}</span>
                          <span className={`px-2 py-0.5 rounded-full font-label-sm text-label-sm ${config.isDark ? 'bg-surface-container-high text-on-surface-variant' : (index % 2 === 0 ? 'bg-primary-fixed text-on-primary-fixed' : 'bg-secondary-fixed text-on-secondary-fixed')}`}>{config.day}</span>
                        </div>
                        <h3 className="font-headline-sm text-headline-sm text-on-surface font-bold truncate">{config.name}</h3>
                        <p className="font-body-sm text-body-sm text-on-surface-variant">{config.stage}</p>
                        <div className="mt-2 flex items-center gap-1">
                          <span className="px-space-xs py-0.5 rounded bg-surface-container-highest text-on-surface-variant font-label-sm text-label-sm">{config.tag}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-space-xs">
                      <div className="flex flex-col p-space-xs rounded-lg bg-surface-container-low text-center border border-outline-variant/20">
                        <span className="font-label-sm text-label-sm text-on-surface-variant">Light PPFD</span>
                        <span className="font-label-lg text-label-lg text-on-surface font-bold">{ppfd}</span>
                        <span className="font-label-sm text-label-sm text-outline">{config.isDark ? 'Darkness' : 'µmol/m²/s'}</span>
                      </div>
                      <div className="flex flex-col p-space-xs rounded-lg bg-surface-container-low text-center border border-outline-variant/20">
                        <span className="font-label-sm text-label-sm text-on-surface-variant">{config.isDark ? 'Dome RH%' : 'CO2 Sensor'}</span>
                        <span className="font-label-lg text-label-lg text-on-surface font-bold">{config.isDark ? '92%' : config.defaultCo2}</span>
                        <span className="font-label-sm text-label-sm text-outline">{config.isDark ? 'Humidity' : 'ppm'}</span>
                      </div>
                      <div className="flex flex-col p-space-xs rounded-lg bg-surface-container-low text-center border border-outline-variant/20">
                        <span className="font-label-sm text-label-sm text-on-surface-variant">{config.isDark ? 'Heat Mat' : 'Canopy Temp'}</span>
                        <span className="font-label-lg text-label-lg text-on-surface font-bold">{temp.toFixed(1)}°</span>
                        <span className="font-label-sm text-label-sm text-outline">{config.isDark ? 'Root Temp' : 'Celsius'}</span>
                      </div>
                    </div>
                    
                    {config.isDark ? (
                      <div className="flex items-center justify-between p-space-sm rounded-lg bg-surface-container-low border border-outline-variant/30">
                        <div className="flex items-center gap-2">
                          <span className="material-symbols-outlined text-outline text-[20px]">nightlight</span>
                          <div className="flex flex-col">
                            <span className="font-label-sm text-label-sm text-on-surface font-semibold">Lights 0% ({config.colorName})</span>
                            <span className="font-label-sm text-label-sm text-on-surface-variant">Scheduled Ignition: Tomorrow 06:00 AM</span>
                          </div>
                        </div>
                        <span className="material-symbols-outlined text-outline text-[20px]">lock_clock</span>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-space-xs pt-space-xs">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            <span className="material-symbols-outlined text-tertiary text-[18px]">tune</span>
                            <span className="font-label-md text-label-md text-on-surface font-bold">LED Array Power</span>
                          </div>
                          <span className="font-label-md text-label-md text-tertiary font-bold">{sliders[config.id]}% • {config.colorName}</span>
                        </div>
                        <div className="relative flex items-center w-full py-2">
                          <input 
                            className="w-full h-3 bg-surface-container rounded-lg appearance-none cursor-pointer accent-tertiary" 
                            max="100" min="0" type="range" 
                            value={sliders[config.id] || 0}
                            onChange={(e) => setSliders({...sliders, [config.id]: Number(e.target.value)})}
                          />
                        </div>
                      </div>
                    )}
                  </article>
                );
              })}
            </div>

            <section className="flex flex-col gap-space-xs mt-space-sm pt-space-xs">
              <button 
                disabled={isSyncing}
                onClick={handleSync}
                className={`min-h-[56px] w-full px-space-lg rounded-xl font-label-lg text-label-lg flex items-center justify-center gap-space-sm shadow-md active:scale-[0.98] transition-transform ${isSyncing || syncDone ? 'bg-secondary text-on-secondary' : 'bg-primary text-on-primary'}`} 
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
              <div className="flex items-center justify-center gap-1.5 text-center text-on-surface-variant py-1 mt-1">
                <span className="material-symbols-outlined text-tertiary text-[16px]">info</span>
                <span className="font-label-sm text-label-sm">Daily Light Integral Target: <strong className="text-tertiary">16.0 mol/m²/day</strong></span>
              </div>
            </section>
          </div>

        </main>
      </AppShell>
    </div>
  );
}
