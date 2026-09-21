import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { checkStress } from '../../api/visionForecastApi';

export default function SatelliteCropStress() {
  const navigate = useNavigate();
  const [stressData, setStressData] = useState(null);
  const [activeZone, setActiveZone] = useState({
    id: 'D',
    name: 'Gate Ridge Section',
    ndvi: '0.41 NDVI',
    statusLabel: 'Severe Water Deficit',
    description: 'Wilting risk imminent. Soil moisture probe reading 22%. Immediate drip activation advised.'
  });
  const [activeLayer, setActiveLayer] = useState('ndvi');
  const [voiceActive, setVoiceActive] = useState(false);
  const [valveTriggered, setValveTriggered] = useState(false);
  const [scoutSaved, setScoutSaved] = useState(false);
  const [zoom, setZoom] = useState(1);

  useEffect(() => {
    const checkFieldStress = async () => {
      try {
        const res = await checkStress({ farm_id: localStorage.getItem('farmId') || '00000000-0000-0000-0000-000000000000' });
        setStressData(res.data);
      } catch (err) {
        console.error(err);
      }
    };
    checkFieldStress();
  }, []);

  const selectZone = (id, name, ndvi, statusLabel, description) => {
    setActiveZone({ id, name, ndvi, statusLabel, description });
    document.getElementById('zoneDetailCard')?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  };

  const handleValveTrigger = () => {
    setValveTriggered(true);
    setTimeout(() => {
      // Simulate completed trigger
    }, 1400);
  };

  const handleScoutWalk = () => {
    setScoutSaved(true);
    setTimeout(() => {
      setScoutSaved(false);
    }, 2500);
  };

  const getZoneStyles = () => {
    if (activeZone.id === 'D') return { text: 'text-error', bg: 'bg-error-container', icon: 'error' };
    if (activeZone.id === 'C') return { text: 'text-secondary', bg: 'bg-secondary-fixed', icon: 'water_loss' };
    return { text: 'text-primary', bg: 'bg-primary-fixed', icon: 'eco' };
  };
  
  const zoneStyles = getZoneStyles();

  return (
    <div className="min-h-screen bg-surface text-on-surface flex flex-col relative">
      

      <main className="flex flex-col w-full pt-20 pb-28 px-margin bg-surface flex-1">
        <div className="pt-1 pb-3 flex items-center justify-between">
          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-1.5">
              <h1 className="font-headline-lg-mobile text-headline-lg-mobile text-primary tracking-tight">Crop Stress Map</h1>
              <span className="bg-primary-fixed text-on-primary-fixed font-label-sm text-label-sm px-2 py-0.5 rounded-full">Plot 1</span>
            </div>
            <p className="font-body-sm text-body-sm text-on-surface-variant truncate">Wheat Parcel • 4.5 Acres • Nashik (20.01°N, 73.79°E)</p>
          </div>
          <button 
            onClick={() => {
              setVoiceActive(!voiceActive);
              setTimeout(() => setVoiceActive(false), 5000);
            }} 
            className={`min-h-[48px] min-w-[48px] rounded-full flex items-center justify-center shadow-md active:scale-95 transition-transform ${voiceActive ? 'bg-secondary-container text-secondary' : 'bg-tertiary-container text-on-tertiary-container'}`}
          >
            <span className="material-symbols-outlined text-[24px]">volume_up</span>
          </button>
        </div>

        <div className="mb-4">
          <div className="bg-secondary-container text-on-secondary-container p-3.5 rounded-xl shadow-sm flex items-start gap-3 relative overflow-hidden">
            <div className="min-h-[40px] min-w-[40px] rounded-full bg-surface-container-lowest text-secondary flex items-center justify-center flex-shrink-0 shadow-sm mt-0.5">
              <span className="material-symbols-outlined text-[24px]">water_drop</span>
            </div>
            <div className="flex-1 min-w-0 pr-6">
              <div className="flex items-center gap-1.5">
                <span className="font-label-md text-label-md text-on-secondary-container font-bold">2 Zones Need Attention</span>
                <span className="w-2 h-2 rounded-full bg-error inline-block animate-pulse"></span>
              </div>
              <p className="font-body-sm text-body-sm text-on-secondary-container mt-0.5 leading-snug">
                South-West corner and Gate ridge show early moisture loss. Suggested: run micro-drip before root dry-out.
              </p>
            </div>
            <button className="absolute top-3 right-3 text-on-secondary-container hover:opacity-75">
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>
          </div>
        </div>

        <div className="mb-3">
          <div className="bg-surface-container-low rounded-xl shadow-md overflow-hidden relative">
            <div className="absolute top-3 inset-x-3 z-20 flex items-center justify-between pointer-events-none">
              <div className="pointer-events-auto flex items-center bg-surface-container-lowest/90 backdrop-blur-md p-1 rounded-full shadow-sm">
                <button onClick={() => setActiveLayer('ndvi')} className={`px-2.5 py-1 rounded-full text-label-sm font-label-sm transition-all shadow-sm ${activeLayer === 'ndvi' ? 'bg-primary text-on-primary font-bold' : 'text-on-surface-variant hover:text-on-surface'}`}>NDVI Stress</button>
                <button onClick={() => setActiveLayer('moist')} className={`px-2.5 py-1 rounded-full text-label-sm font-label-sm transition-all shadow-sm ${activeLayer === 'moist' ? 'bg-primary text-on-primary font-bold' : 'text-on-surface-variant hover:text-on-surface'}`}>Moisture NDWI</button>
                <button onClick={() => setActiveLayer('sat')} className={`px-2.5 py-1 rounded-full text-label-sm font-label-sm transition-all shadow-sm ${activeLayer === 'sat' ? 'bg-primary text-on-primary font-bold' : 'text-on-surface-variant hover:text-on-surface'}`}>True Color</button>
              </div>
              <div className="pointer-events-auto w-10 h-10 rounded-full bg-surface-container-lowest/90 backdrop-blur-md shadow-sm flex flex-col items-center justify-center">
                <span className="font-label-sm text-[10px] text-error leading-none font-bold">N</span>
                <span className="material-symbols-outlined text-[16px] text-on-surface -mt-0.5">navigation</span>
              </div>
            </div>

            <div className="relative w-full aspect-[4/3] bg-surface-container-highest overflow-hidden flex items-center justify-center select-none">
              <div className="absolute inset-0 opacity-25" style={{ backgroundImage: 'radial-gradient(#1b5e20 1px, transparent 1px), radial-gradient(#00450d 1px, #e5e2e1 1px)', backgroundSize: '20px 20px', backgroundPosition: '0 0, 10px 10px' }}></div>
              <svg className="w-full h-full transform transition-transform duration-300" style={{ transform: `scale(${zoom})` }} viewBox="0 0 400 300">
                <defs>
                  <linearGradient id="healthyGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#1b5e20" stopOpacity="0.9" />
                    <stop offset="100%" stopColor="#2a6b2c" stopOpacity="0.85" />
                  </linearGradient>
                  <linearGradient id="moderateGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#91d78a" stopOpacity="0.9" />
                    <stop offset="100%" stopColor="#acf4a4" stopOpacity="0.8" />
                  </linearGradient>
                  <linearGradient id="warningGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#fc6018" stopOpacity="0.85" />
                    <stop offset="100%" stopColor="#ffb59a" stopOpacity="0.9" />
                  </linearGradient>
                  <linearGradient id="severeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#ba1a1a" stopOpacity="0.92" />
                    <stop offset="100%" stopColor="#a83900" stopOpacity="0.88" />
                  </linearGradient>
                  <pattern id="gridDrip" width="12" height="12" patternUnits="userSpaceOnUse">
                    <path d="M 0 6 L 12 6" fill="none" stroke="#ffffff" strokeWidth="0.5" strokeDasharray="2,2" opacity="0.4" />
                  </pattern>
                </defs>
                <polygon points="45,30 355,42 375,250 240,275 35,225" fill="#f0eded" opacity="0.6" />
                <polygon points="45,30 355,42 330,135 155,140 40,110" fill="url(#healthyGradient)" className="cursor-pointer transition-opacity hover:opacity-90" onClick={() => selectZone('A', 'North Core', '0.78 NDVI', 'Optimal Vigour', 'Soil moisture at 38%. Canopy lush and transpiration optimal.')} />
                <polygon points="45,30 355,42 330,135 155,140 40,110" fill="url(#gridDrip)" pointerEvents="none" />
                <polygon points="330,135 355,42 375,250 255,200 195,145" fill="url(#moderateGradient)" className="cursor-pointer transition-opacity hover:opacity-90" onClick={() => selectZone('B', 'East Slope', '0.64 NDVI', 'Normal Canopy', 'Adequate growth. Slope run-off slightly faster.')} />
                <polygon points="40,110 155,140 195,145 150,240 35,225" fill="url(#warningGradient)" className="cursor-pointer transition-opacity hover:opacity-90" onClick={() => selectZone('C', 'South-West Plot', '0.51 NDVI', 'Early Stress', 'Moisture depletion detected in root zone (26%). Drip runtime check required.')} />
                <polygon points="150,240 195,145 255,200 240,275" fill="url(#severeGradient)" className="cursor-pointer transition-opacity hover:opacity-90" onClick={() => selectZone('D', 'Gate Ridge Section', '0.41 NDVI', 'Severe Water Deficit', 'Wilting risk imminent. Soil moisture probe reading 22%. Immediate drip activation advised.')} />
                <path d="M 60,38 L 340,48 M 55,75 L 348,82 M 50,115 L 358,125 M 48,155 L 362,170 M 42,195 L 368,212 M 40,225 L 245,268" fill="none" stroke="#ffffff" strokeWidth="1" strokeDasharray="4,4" opacity="0.45" />
                <polygon points="45,30 355,42 375,250 240,275 35,225" fill="none" stroke="#00450d" strokeWidth="2.5" strokeLinejoin="round" />
                <circle cx="50" cy="35" r="4" fill="#003b71" />
                <circle cx="240" cy="275" r="4" fill="#003b71" />
              </svg>
              
              <button onClick={() => selectZone('D', 'Gate Ridge Section', '0.41 NDVI', 'Severe Water Deficit', 'Wilting risk imminent. Soil moisture probe reading 22%. Immediate drip activation advised.')} className="absolute left-[54%] top-[65%] -translate-x-1/2 -translate-y-1/2 z-10 flex flex-col items-center group cursor-pointer">
                <span className="flex items-center gap-1 bg-surface-container-lowest px-2 py-0.5 rounded-full shadow-md text-error font-label-sm text-label-sm font-bold scale-90 group-hover:scale-100 transition-transform">
                  <span className="w-2 h-2 rounded-full bg-error animate-ping"></span>
                  Zone D • 22%
                </span>
                <span className="material-symbols-outlined text-error text-[28px] -mt-1 drop-shadow-md">location_on</span>
              </button>
              
              <button onClick={() => selectZone('C', 'South-West Plot', '0.51 NDVI', 'Early Stress', 'Moisture depletion detected in root zone (26%). Drip runtime check required.')} className="absolute left-[26%] top-[52%] -translate-x-1/2 -translate-y-1/2 z-10 flex flex-col items-center group cursor-pointer">
                <span className="flex items-center gap-1 bg-surface-container-lowest px-2 py-0.5 rounded-full shadow-md text-secondary font-label-sm text-label-sm font-bold scale-90 group-hover:scale-100 transition-transform">
                  Zone C
                </span>
                <span className="material-symbols-outlined text-secondary text-[24px] -mt-1 drop-shadow-md">warning</span>
              </button>
              
              <div className="absolute bottom-3 right-3 z-20 flex flex-col gap-1.5">
                <button onClick={() => setZoom(Math.min(zoom + 0.15, 1.4))} className="w-9 h-9 rounded-lg bg-surface-container-lowest/90 backdrop-blur-md text-on-surface shadow-md flex items-center justify-center active:bg-surface-container-high transition-colors">
                  <span className="material-symbols-outlined text-[20px]">add</span>
                </button>
                <button onClick={() => setZoom(Math.max(zoom - 0.15, 0.85))} className="w-9 h-9 rounded-lg bg-surface-container-lowest/90 backdrop-blur-md text-on-surface shadow-md flex items-center justify-center active:bg-surface-container-high transition-colors">
                  <span className="material-symbols-outlined text-[20px]">remove</span>
                </button>
                <button onClick={() => setZoom(1)} className="w-9 h-9 rounded-lg bg-surface-container-lowest/90 backdrop-blur-md text-primary shadow-md flex items-center justify-center active:bg-surface-container-high transition-colors">
                  <span className="material-symbols-outlined text-[18px]">filter_center_focus</span>
                </button>
              </div>

              <div className="absolute bottom-3 left-3 z-10 bg-surface-container-lowest/90 backdrop-blur-md px-2.5 py-1.5 rounded-lg shadow-sm">
                <div className="font-label-sm text-[11px] text-on-surface-variant leading-none">Plot Average</div>
                <div className="font-headline-sm text-headline-sm text-primary font-bold mt-0.5 leading-none">0.68 <span className="font-label-sm text-[11px] text-on-surface-variant font-normal">NDVI</span></div>
              </div>
            </div>

            <div className="bg-surface-container-lowest px-3.5 py-2.5">
              <div className="font-label-sm text-label-sm text-on-surface-variant mb-1.5 flex items-center justify-between">
                <span>Field Canopy Vigour Scale</span>
                <span className="font-normal text-[11px]">10m pixel mesh</span>
              </div>
              <div className="grid grid-cols-4 gap-1">
                <div className="flex flex-col items-center text-center p-1 rounded bg-surface-container-low">
                  <div className="flex items-center gap-1">
                    <span className="w-2.5 h-2.5 rounded-full bg-primary-container"></span>
                    <span className="font-label-sm text-[11px] font-bold text-on-surface">Optimal</span>
                  </div>
                  <span className="font-label-sm text-[10px] text-on-surface-variant mt-0.5">&gt;0.72</span>
                </div>
                <div className="flex flex-col items-center text-center p-1 rounded bg-surface-container-low">
                  <div className="flex items-center gap-1">
                    <span className="w-2.5 h-2.5 rounded-full bg-primary-fixed-dim"></span>
                    <span className="font-label-sm text-[11px] font-bold text-on-surface">Normal</span>
                  </div>
                  <span className="font-label-sm text-[10px] text-on-surface-variant mt-0.5">0.60–0.72</span>
                </div>
                <div className="flex flex-col items-center text-center p-1 rounded bg-surface-container-low">
                  <div className="flex items-center gap-1">
                    <span className="w-2.5 h-2.5 rounded-full bg-secondary-container"></span>
                    <span className="font-label-sm text-[11px] font-bold text-on-surface">Early</span>
                  </div>
                  <span className="font-label-sm text-[10px] text-on-surface-variant mt-0.5">0.48–0.59</span>
                </div>
                <div className="flex flex-col items-center text-center p-1 rounded bg-surface-container-low">
                  <div className="flex items-center gap-1">
                    <span className="w-2.5 h-2.5 rounded-full bg-error"></span>
                    <span className="font-label-sm text-[11px] font-bold text-on-surface">Severe</span>
                  </div>
                  <span className="font-label-sm text-[10px] text-on-surface-variant mt-0.5">&lt;0.48</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mb-4" id="zoneDetailCard">
          <div className="bg-surface-container-lowest rounded-xl p-4 shadow-md transition-all duration-200">
            <div className="flex items-start justify-between pb-3">
              <div className="flex items-center gap-2.5">
                <div className={`w-10 h-10 rounded-xl ${zoneStyles.bg} flex items-center justify-center`}>
                  <span className="material-symbols-outlined text-[22px]">{zoneStyles.icon}</span>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="font-headline-sm text-headline-sm text-on-surface">Zone {activeZone.id} ({activeZone.name})</h2>
                    <span className="bg-surface-container text-on-surface-variant text-label-sm font-label-sm px-2 py-0.5 rounded">0.4 Acre</span>
                  </div>
                  <p className={`font-label-sm text-label-sm ${zoneStyles.text} font-bold flex items-center gap-1 mt-0.5`}>
                    <span className="material-symbols-outlined text-[14px]">
                      {activeZone.id === 'D' ? 'warning' : (activeZone.id === 'C' ? 'info' : 'check_circle')}
                    </span> {activeZone.statusLabel} • {stressData ? stressData.ndvi_value.toFixed(2) + ' NDVI' : activeZone.ndvi}
                  </p>
                </div>
              </div>
              <button className="min-h-[44px] min-w-[44px] rounded-full bg-surface-container text-primary flex items-center justify-center hover:bg-surface-container-high transition-colors">
                <span className="material-symbols-outlined text-[20px]">volume_up</span>
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 p-2.5 bg-surface-container-low rounded-lg mb-3.5">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-surface-container-highest flex items-center justify-center text-primary">
                  <span className="material-symbols-outlined text-[18px]">humidity_percentage</span>
                </div>
                <div>
                  <span className="font-label-sm text-[11px] text-on-surface-variant block">Root Moisture</span>
                  <span className="font-label-md text-label-md text-error font-bold">22% Moisture</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-surface-container-highest flex items-center justify-center text-secondary">
                  <span className="material-symbols-outlined text-[18px]">hourglass_top</span>
                </div>
                <div>
                  <span className="font-label-sm text-[11px] text-on-surface-variant block">Wilting Margin</span>
                  <span className="font-label-md text-label-md text-on-surface font-bold">~ 14 hrs window</span>
                </div>
              </div>
            </div>

            <div className="space-y-2.5">
              <div className="font-label-md text-label-md text-on-surface font-bold flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[18px] text-primary">task_alt</span>
                Recommended Farm Interventions
              </div>
              <label className="flex items-start gap-3 p-2.5 bg-surface rounded-lg cursor-pointer transition-colors hover:bg-surface-container-low">
                <input defaultChecked className="mt-1 w-5 h-5 rounded accent-primary text-on-primary cursor-pointer flex-shrink-0" type="checkbox"/>
                <div className="min-w-0 flex-1">
                  <div className="font-label-md text-label-md text-on-surface font-semibold leading-tight">Run drip line emitter flush &amp; check</div>
                  <p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">High probability of sediment clogs on Line 4 due to slope silt accumulation.</p>
                </div>
              </label>
              <label className="flex items-start gap-3 p-2.5 bg-surface rounded-lg cursor-pointer transition-colors hover:bg-surface-container-low">
                <input className="mt-1 w-5 h-5 rounded accent-primary text-on-primary cursor-pointer flex-shrink-0" type="checkbox"/>
                <div className="min-w-0 flex-1">
                  <div className="font-label-md text-label-md text-on-surface font-semibold leading-tight">Apply 45 mins supplemental irrigation</div>
                  <p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">Estimated crop recovery time: 36 hrs post-irrigation to reach NDVI 0.65.</p>
                </div>
              </label>
            </div>
          </div>
        </div>

        <div className="mb-5">
          <div className="bg-surface-container-low rounded-xl p-3.5 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-tertiary text-[18px]">radar</span>
                <span className="font-label-sm text-label-sm text-on-surface-variant font-bold uppercase tracking-wider">Telemetry Diagnostics</span>
              </div>
              <span className="font-label-sm text-[11px] bg-surface-container-highest px-2 py-0.5 rounded text-on-surface-variant">ESA Copernicus</span>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center pt-1">
              <div className="bg-surface-container-lowest p-2 rounded-lg">
                <span className="material-symbols-outlined text-primary text-[18px]">grid_4x4</span>
                <span className="block font-label-sm text-[11px] text-on-surface-variant mt-0.5">Resolution</span>
                <span className="block font-label-md text-label-md font-bold text-on-surface">10m Multi</span>
              </div>
              <div className="bg-surface-container-lowest p-2 rounded-lg">
                <span className="material-symbols-outlined text-tertiary text-[18px]">schedule</span>
                <span className="block font-label-sm text-[11px] text-on-surface-variant mt-0.5">Next Pass</span>
                <span className="block font-label-md text-label-md font-bold text-on-surface">Tomorrow 11:15 AM</span>
              </div>
              <div className="bg-surface-container-lowest p-2 rounded-lg">
                <span className="material-symbols-outlined text-secondary text-[18px]">wb_sunny</span>
                <span className="block font-label-sm text-[11px] text-on-surface-variant mt-0.5">Cloud Cover</span>
                <span className="block font-label-md text-label-md font-bold text-primary">0% Clear</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-2.5">
          {activeZone.id === 'D' && (
            <button 
              onClick={handleValveTrigger}
              disabled={valveTriggered}
              className={`min-h-[56px] w-full rounded-xl font-label-lg text-label-lg font-bold flex items-center justify-center gap-2 shadow-md transition-all ${valveTriggered ? 'bg-primary text-on-primary' : 'bg-secondary text-on-secondary hover:opacity-95 active:scale-[0.99]'}`}
            >
              {valveTriggered ? (
                <>
                  <span className="material-symbols-outlined text-[24px]">check_circle</span>
                  <span>Valve Zone D OPEN (Flow: 14 LPM)</span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[24px]">power_settings_new</span>
                  <span>Turn On Zone D Drip Valve / Pump</span>
                  <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
                </>
              )}
            </button>
          )}

          {activeZone.id === 'C' && (
            <button className="min-h-[56px] w-full bg-secondary text-on-secondary rounded-xl font-label-lg text-label-lg font-bold flex items-center justify-center gap-2 shadow-md hover:opacity-95 active:scale-[0.99] transition-all">
              <span className="material-symbols-outlined text-[24px]">power_settings_new</span>
              <span>Turn On Zone C Drip Line</span>
              <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
            </button>
          )}

          {activeZone.id !== 'C' && activeZone.id !== 'D' && (
            <button className="min-h-[56px] w-full bg-primary text-on-primary rounded-xl font-label-lg text-label-lg font-bold flex items-center justify-center gap-2 shadow-md hover:opacity-95 active:scale-[0.99] transition-all">
              <span className="material-symbols-outlined text-[24px]">tune</span>
              <span>Adjust Zone {activeZone.id} Settings</span>
              <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
            </button>
          )}
          
          <button 
            onClick={handleScoutWalk}
            className="min-h-[52px] w-full bg-surface-container-lowest text-primary rounded-xl font-label-lg text-label-lg font-semibold flex items-center justify-center gap-2 shadow-sm hover:bg-surface-container-low active:scale-[0.99] transition-all"
          >
            {scoutSaved ? (
              <>
                <span className="material-symbols-outlined text-[20px] text-primary">bookmark_added</span>
                <span>Zone {activeZone.id} Saved to Offline Field Log</span>
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-[22px]">hiking</span>
                <span>Mark Zone for Field Scouting Walk</span>
              </>
            )}
          </button>
        </div>
      </main>

      
    </div>
  );
}
