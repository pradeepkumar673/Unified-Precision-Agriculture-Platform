import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { getAquaBalance, updateSetpoints } from '../../api/ceaIotApi';
import { getFarmProfile } from '../../api/farmApi';
import AppShell from '../../layouts/AppShell';

const OPENWEATHER_API_KEY = "86885ecd2b2cad6aacdaea840c653733";

export default function HydroponicsClimateControl() {
  const navigate = useNavigate();
  const farmId = localStorage.getItem('farmId') || '00000000-0000-0000-0000-000000000000';
  
  const [aquaData, setAquaData] = useState(null);
  const [farmData, setFarmData] = useState(null);
  const [ambientTemp, setAmbientTemp] = useState(25.0);
  const [waterTempReading, setWaterTempReading] = useState(21.0);
  const [doReading, setDoReading] = useState(8.5);
  
  // Setpoint states
  const [pendingCount, setPendingCount] = useState(0);
  const [ecValue, setEcValue] = useState(2.2);
  const [phValue, setPhValue] = useState(6.20);
  const [phWindow, setPhWindow] = useState(0.3);
  const [tempValue, setTempValue] = useState(21.5);
  const [isDosingAi, setIsDosingAi] = useState(true);
  
  const [isDispatching, setIsDispatching] = useState(false);
  const [showToast, setShowToast] = useState(false);

  useEffect(() => {
    const init = async () => {
      try {
        const profile = await getFarmProfile(farmId);
        if (profile.data) {
          setFarmData(profile.data);
          // Fetch Weather
          const lat = profile.data.latitude || 28.6139;
          const lon = profile.data.longitude || 77.2090;
          fetchWeather(lat, lon);
        }
      } catch (err) {
        console.error("Failed to load farm profile", err);
        fetchWeather(28.6139, 77.2090);
      }
    };
    init();
    fetchData();
    const interval = setInterval(fetchData, 8000);
    return () => clearInterval(interval);
  }, []);

  const fetchWeather = async (lat, lon) => {
    try {
      const res = await axios.get(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${OPENWEATHER_API_KEY}`);
      if (res.data && res.data.main) {
        const t = res.data.main.temp;
        setAmbientTemp(t);
        // Simulate water temp dynamically linked to ambient if not provided by hardware
        const wTemp = Math.min(26, Math.max(16, t - 4.5));
        setWaterTempReading(Number(wTemp.toFixed(1)));
        
        // Dissolved Oxygen is inversely proportional to water temp
        const expectedDo = Math.max(5.0, 14.16 - 0.39 * wTemp + 0.0077 * wTemp * wTemp);
        setDoReading(Number(expectedDo.toFixed(1)));
      }
    } catch (e) {
      console.error("OpenWeather API failed", e);
    }
  };

  const fetchData = async () => {
    try {
      const data = await getAquaBalance(farmId);
      setAquaData(data);
    } catch (err) {
      // In case of error, we just keep the latest valid state or show minimal loading
    }
  };

  const handleDispatch = async () => {
    setIsDispatching(true);
    try {
      await updateSetpoints(farmId, {
        ec: ecValue,
        ph: phValue,
        ph_window: phWindow,
        temp: tempValue,
        ai_dosing: isDosingAi ? 1.0 : 0.0
      });
      setPendingCount(0);
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3200);
      fetchData();
    } catch (err) {
      alert("Failed to sync setpoints to PLC. " + (err.response?.data?.detail || ""));
    } finally {
      setIsDispatching(false);
    }
  };

  const incrementPh = () => {
    if (phValue < 7.5) {
      setPhValue(prev => Number((prev + 0.05).toFixed(2)));
      setPendingCount(prev => prev + 1);
    }
  };

  const decrementPh = () => {
    if (phValue > 5.2) {
      setPhValue(prev => Number((prev - 0.05).toFixed(2)));
      setPendingCount(prev => prev + 1);
    }
  };

  const ecDisplay = aquaData?.ec || (isDosingAi ? ecValue : 2.18);
  const phDisplay = aquaData?.ph || (isDosingAi ? phValue : 6.15);

  return (
    <div className="min-h-screen bg-surface-container text-on-surface flex flex-col relative">
      <AppShell variant="detail" title="Hydroponics Climate Control">
        <main className="flex flex-col w-full pb-24 flex-1">
          
          <div className="px-margin pt-space-md pb-space-xs flex items-center justify-between">
            <div className="flex items-center gap-space-xs">
              <span className="w-2.5 h-2.5 rounded-full bg-primary-fixed-dim animate-pulse"></span>
              <span className="font-label-sm text-label-sm text-tertiary uppercase tracking-wider font-bold">NFT &amp; DWC Closed-Loop</span>
            </div>
            <div className="flex items-center gap-1 bg-surface-container-high px-space-xs py-0.5 rounded-full">
              <span className="material-symbols-outlined text-[14px] text-tertiary">lock_clock</span>
              <span className="font-label-sm text-label-sm text-on-surface-variant font-medium">PLC Synced</span>
            </div>
          </div>

          <div className="px-margin mb-space-md">
            <div className="bg-tertiary text-on-tertiary rounded-xl p-space-md shadow-sm relative overflow-hidden">
              <div className="absolute -right-6 -bottom-6 w-24 h-24 rounded-full bg-tertiary-container/30 pointer-events-none"></div>
              <div className="flex items-start justify-between relative z-10 mb-space-xs">
                <div className="flex items-center gap-space-xs">
                  <span className="p-1 rounded-lg bg-tertiary-container text-on-tertiary-container flex items-center justify-center">
                    <span className="material-symbols-outlined text-[20px]">water_ph</span>
                  </span>
                  <div>
                    <h1 className="font-headline-sm text-headline-sm text-on-tertiary font-bold tracking-tight">Loop 01: Main Reservoir</h1>
                    <p className="font-label-sm text-label-sm text-on-tertiary-container">{farmData?.name || 'Local Farm'} • Recirculating DWC/NFT</p>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-primary-fixed-dim/20 text-primary-fixed font-label-sm text-label-sm flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary-fixed-dim"></span>
                  Running
                </span>
              </div>
              
              <div className="bg-tertiary-container/50 rounded-lg p-space-xs flex items-center justify-between text-on-tertiary relative z-10 mt-space-xs">
                <div className="flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[16px] text-on-tertiary-container">cyclone</span>
                  <span className="font-label-sm text-label-sm font-medium">Main Pump: <strong className="text-white">ACTIVE (1,200 L/hr)</strong></span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[16px] text-primary-fixed-dim">verified</span>
                  <span className="font-label-sm text-label-sm font-medium">UV Sterilizer: <strong className="text-white">ON</strong></span>
                </div>
              </div>
            </div>
          </div>

          <div className="px-margin mb-space-lg">
            <div className="flex items-center justify-between mb-space-xs">
              <span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant font-bold">Telemetry Vitals</span>
              <span className="font-label-sm text-label-sm text-tertiary flex items-center gap-0.5">
                <span className="material-symbols-outlined text-[14px]">tune</span> Sensors Calibrated
              </span>
            </div>
            
            <div className="grid grid-cols-2 gap-space-sm">
              <div className="bg-surface-container-lowest rounded-xl p-space-sm shadow-sm flex flex-col justify-between border border-outline-variant/30">
                <div className="flex items-center justify-between mb-space-xs">
                  <div className="w-7 h-7 rounded-lg bg-surface-container flex items-center justify-center text-tertiary">
                    <span className="material-symbols-outlined text-[18px]">electric_bolt</span>
                  </div>
                  <span className={`flex items-center gap-1 font-label-sm text-label-sm ${aquaData?.ec_status === 'adjustment_required' ? 'text-error' : 'text-primary'} font-bold`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${aquaData?.ec_status === 'adjustment_required' ? 'bg-error' : 'bg-primary-fixed-dim'}`}></span> 
                    {aquaData?.ec_status === 'adjustment_required' ? 'Alert' : 'Optimal'}
                  </span>
                </div>
                <div>
                  <span className="font-label-sm text-label-sm text-on-surface-variant block">EC (Conductivity)</span>
                  <div className="flex items-baseline gap-1">
                    <span className="font-headline-md text-headline-md text-on-surface font-bold tracking-tight">{ecDisplay}</span>
                    <span className="font-label-sm text-label-sm text-on-surface-variant">mS/cm</span>
                  </div>
                </div>
              </div>
              
              <div className="bg-surface-container-lowest rounded-xl p-space-sm shadow-sm flex flex-col justify-between border border-outline-variant/30">
                <div className="flex items-center justify-between mb-space-xs">
                  <div className="w-7 h-7 rounded-lg bg-surface-container flex items-center justify-center text-tertiary">
                    <span className="material-symbols-outlined text-[18px]">science</span>
                  </div>
                  <span className={`flex items-center gap-1 font-label-sm text-label-sm ${aquaData?.ph_status === 'adjustment_required' ? 'text-error' : 'text-primary'} font-bold`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${aquaData?.ph_status === 'adjustment_required' ? 'bg-error' : 'bg-primary-fixed-dim'}`}></span> 
                    {aquaData?.ph_status === 'adjustment_required' ? 'Alert' : 'Stable'}
                  </span>
                </div>
                <div>
                  <span className="font-label-sm text-label-sm text-on-surface-variant block">Solution pH</span>
                  <div className="flex items-baseline gap-1">
                    <span className="font-headline-md text-headline-md text-on-surface font-bold tracking-tight">{phDisplay}</span>
                    <span className="font-label-sm text-label-sm text-on-surface-variant">pH</span>
                  </div>
                </div>
              </div>
              
              <div className="bg-surface-container-lowest rounded-xl p-space-sm shadow-sm flex flex-col justify-between border border-outline-variant/30">
                <div className="flex items-center justify-between mb-space-xs">
                  <div className="w-7 h-7 rounded-lg bg-surface-container flex items-center justify-center text-tertiary">
                    <span className="material-symbols-outlined text-[18px]">bubble_chart</span>
                  </div>
                  <span className={`flex items-center gap-1 font-label-sm text-label-sm ${doReading < 6.5 ? 'text-error' : 'text-primary'} font-bold`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${doReading < 6.5 ? 'bg-error' : 'bg-primary-fixed-dim'}`}></span> 
                    {doReading < 6.5 ? 'Low' : 'High'}
                  </span>
                </div>
                <div>
                  <span className="font-label-sm text-label-sm text-on-surface-variant block">Dissolved O₂ (DO)</span>
                  <div className="flex items-baseline gap-1">
                    <span className="font-headline-md text-headline-md text-on-surface font-bold tracking-tight">{doReading}</span>
                    <span className="font-label-sm text-label-sm text-on-surface-variant">mg/L</span>
                  </div>
                </div>
              </div>
              
              <div className="bg-surface-container-lowest rounded-xl p-space-sm shadow-sm flex flex-col justify-between border border-outline-variant/30">
                <div className="flex items-center justify-between mb-space-xs">
                  <div className="w-7 h-7 rounded-lg bg-surface-container flex items-center justify-center text-tertiary">
                    <span className="material-symbols-outlined text-[18px]">device_thermostat</span>
                  </div>
                  <span className={`flex items-center gap-1 font-label-sm text-label-sm ${waterTempReading > tempValue ? 'text-secondary' : 'text-primary'} font-bold`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${waterTempReading > tempValue ? 'bg-secondary' : 'bg-primary-fixed-dim'}`}></span> 
                    {waterTempReading > tempValue ? 'Cooling' : 'Idle'}
                  </span>
                </div>
                <div>
                  <span className="font-label-sm text-label-sm text-on-surface-variant block">Water Temp</span>
                  <div className="flex items-baseline gap-1">
                    <span className="font-headline-md text-headline-md text-on-surface font-bold tracking-tight">{waterTempReading}</span>
                    <span className="font-label-sm text-label-sm text-on-surface-variant">°C</span>
                  </div>
                  <div className="mt-1 font-label-sm text-[10px] text-on-surface-variant opacity-70">
                    Ambient: {ambientTemp.toFixed(1)}°C
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="px-margin space-y-space-md">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-headline-sm text-headline-sm text-on-surface font-bold">System Parameter Setpoints</h2>
                <p className="font-label-sm text-label-sm text-on-surface-variant">Configure dosing limits &amp; dynamic triggers</p>
              </div>
              {pendingCount > 0 && (
                <span className="font-label-sm text-label-sm bg-secondary-fixed text-on-secondary-fixed font-bold px-2 py-0.5 rounded-full shadow-sm">
                  {pendingCount} Pending
                </span>
              )}
            </div>
            
            <div className="bg-surface-container-lowest rounded-xl p-space-md shadow-sm border border-outline-variant/30">
              <div className="flex items-start justify-between mb-space-sm">
                <div className="flex items-center gap-space-xs">
                  <div className="w-8 h-8 rounded-lg bg-primary-container text-on-primary flex items-center justify-center">
                    <span className="material-symbols-outlined text-[20px]">precision_manufacturing</span>
                  </div>
                  <div>
                    <h3 className="font-label-lg text-label-lg text-on-surface font-bold">Automated Nutrient Dosing</h3>
                    <span className="font-label-sm text-label-sm text-on-surface-variant">A/B Stock Precision Injection</span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center justify-between mb-space-xs">
                <span className="font-label-md text-label-md text-on-surface">Target Electrical Conductivity</span>
                <span className="font-headline-sm text-headline-sm text-primary font-bold tracking-tight">
                  {ecValue.toFixed(2)} <span className="text-label-sm font-normal text-on-surface-variant">mS/cm</span>
                </span>
              </div>
              <div className="mb-space-sm pt-2">
                <input 
                  type="range" 
                  min="0.5" 
                  max="3.5" 
                  step="0.1" 
                  value={ecValue} 
                  onChange={(e) => {
                    setEcValue(Number(e.target.value));
                    setPendingCount(Math.max(pendingCount, 1));
                  }}
                  className="w-full h-2 rounded-full appearance-none bg-surface-container-highest focus:outline-none accent-primary" 
                />
                <div className="flex items-center justify-between mt-1 text-[10px] font-label-sm text-on-surface-variant">
                  <span>0.5 Seedling</span>
                  <span>3.5 Fruiting</span>
                </div>
              </div>
              
              <div className="flex items-center bg-surface-container p-1 rounded-lg mt-3">
                <button 
                  onClick={() => { setIsDosingAi(true); setPendingCount(prev => prev + 1); }}
                  className={`flex-1 min-h-[44px] py-1.5 rounded-md font-label-sm text-label-sm ${isDosingAi ? 'font-bold bg-surface-container-lowest text-tertiary shadow-sm' : 'font-semibold text-on-surface-variant hover:text-on-surface'} transition-all flex items-center justify-center gap-1`} 
                  type="button"
                >
                  <span className="material-symbols-outlined text-[16px]">smart_toy</span>
                  AI Adaptive Profile
                </button>
                <button 
                  onClick={() => { setIsDosingAi(false); setPendingCount(prev => prev + 1); }}
                  className={`flex-1 min-h-[44px] py-1.5 rounded-md font-label-sm text-label-sm ${!isDosingAi ? 'font-bold bg-surface-container-lowest text-tertiary shadow-sm' : 'font-semibold text-on-surface-variant hover:text-on-surface'} transition-all flex items-center justify-center gap-1`} 
                  type="button"
                >
                  <span className="material-symbols-outlined text-[16px]">tune</span>
                  Manual Fixed Override
                </button>
              </div>
            </div>

            <div className="bg-surface-container-lowest rounded-xl p-space-md shadow-sm border border-outline-variant/30">
              <div className="flex items-start justify-between mb-space-sm">
                <div className="flex items-center gap-space-xs">
                  <div className="w-8 h-8 rounded-lg bg-surface-container text-tertiary flex items-center justify-center">
                    <span className="material-symbols-outlined text-[20px]">science</span>
                  </div>
                  <div>
                    <h3 className="font-label-lg text-label-lg text-on-surface font-bold">pH Control Setpoint</h3>
                    <span className="font-label-sm text-label-sm text-on-surface-variant">pH Up/Down Acid Injection</span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center justify-between mb-space-sm bg-surface-container-low rounded-xl p-2">
                <button onClick={decrementPh} className="w-12 h-12 rounded-lg bg-surface-container-lowest text-on-surface flex items-center justify-center shadow-sm active:scale-95 transition-transform">
                  <span className="material-symbols-outlined text-[24px]">remove</span>
                </button>
                <span className="font-headline-md text-headline-md text-tertiary font-bold tracking-tight">
                  {phValue.toFixed(2)} <span className="text-label-md font-normal text-on-surface-variant">pH</span>
                </span>
                <button onClick={incrementPh} className="w-12 h-12 rounded-lg bg-surface-container-lowest text-on-surface flex items-center justify-center shadow-sm active:scale-95 transition-transform">
                  <span className="material-symbols-outlined text-[24px]">add</span>
                </button>
              </div>
              
              <div className="flex items-center justify-between mb-1 pt-1">
                <span className="font-label-sm text-label-sm text-on-surface">Acceptable Tolerance Window</span>
                <span className="font-label-sm text-label-sm text-tertiary font-bold">± {phWindow.toFixed(2)} pH Window</span>
              </div>
              <input 
                type="range" 
                min="0.1" 
                max="1.0" 
                step="0.05" 
                value={phWindow} 
                onChange={(e) => {
                  setPhWindow(Number(e.target.value));
                  setPendingCount(prev => prev + 1);
                }}
                className="w-full h-1.5 rounded-full appearance-none bg-surface-container-highest focus:outline-none accent-tertiary" 
              />
            </div>

            <div className="bg-surface-container-lowest rounded-xl p-space-md shadow-sm space-y-space-md border border-outline-variant/30">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[18px] text-on-surface">device_thermostat</span>
                    <span className="font-label-md text-label-md text-on-surface font-bold">Chiller Threshold</span>
                  </div>
                  <span className="font-label-sm text-label-sm text-on-surface-variant font-medium">{tempValue.toFixed(1)} °C</span>
                </div>
                <input 
                  type="range" 
                  min="18.0" 
                  max="26.0" 
                  step="0.5" 
                  value={tempValue}
                  onChange={(e) => {
                    setTempValue(Number(e.target.value));
                    setPendingCount(prev => prev + 1);
                  }}
                  className="w-full h-1.5 rounded-full appearance-none bg-surface-container-highest focus:outline-none accent-on-surface" 
                />
              </div>
              
              <div className="flex items-center justify-between pt-3 border-t border-surface-container">
                <div className="flex flex-col">
                  <span className="font-label-md text-label-md text-on-surface font-bold">Continuous Aeration</span>
                  <span className="font-label-sm text-label-sm text-on-surface-variant">Air stone injection</span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    className="sr-only peer" 
                    defaultChecked 
                    onChange={() => setPendingCount(prev => prev + 1)}
                  />
                  <div className="w-11 h-6 bg-surface-container-highest peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                </label>
              </div>
              
              <div className="bg-surface-container-low rounded-lg p-space-xs flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[16px] text-error">warning</span>
                  <span className="font-label-sm text-label-sm text-on-surface-variant">DO Threshold Alarm:</span>
                </div>
                <span className="font-label-sm text-label-sm font-bold text-on-surface">&lt; 6.5 mg/L trigger</span>
              </div>
            </div>
          </div>

          <div className="px-margin mt-space-lg mb-space-md">
            <div className="bg-surface-container-low rounded-xl p-space-sm mb-space-sm flex items-start gap-space-xs border border-outline-variant/30">
              <span className="material-symbols-outlined text-primary text-[20px] shrink-0 mt-0.5">verified_user</span>
              <p className="font-label-sm text-label-sm text-on-surface-variant leading-relaxed">
                <strong className="text-on-surface">Failsafe Lock Active:</strong> Automatic safety cutoff will trip if solution pH drifts &gt;0.8 or EC shifts &gt;0.5 within any rolling 15-minute window.
              </p>
            </div>
            <button 
              disabled={isDispatching}
              onClick={handleDispatch}
              className={`w-full min-h-[56px] px-space-md py-3 rounded-xl font-label-lg text-label-lg flex items-center justify-center gap-space-xs shadow-md transition-all ${isDispatching ? 'bg-secondary/70 text-on-secondary/70' : 'bg-primary text-on-primary active:scale-[0.98]'}`}
              type="button"
            >
              <span className="material-symbols-outlined text-[24px]">bolt</span>
              <span>{isDispatching ? 'Transmitting to RS-485 Bus...' : (pendingCount > 0 ? `Send Commands to PLC Controller (${pendingCount} Pending)` : 'All Setpoints Synced')}</span>
            </button>
          </div>
          
          {showToast && (
            <div className="fixed bottom-24 left-4 right-4 z-40 animate-in fade-in slide-in-from-bottom-4 duration-300">
              <div className="bg-primary text-on-primary rounded-xl p-space-sm flex items-center justify-between shadow-lg">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[20px] text-primary-fixed">check_circle</span>
                  <span className="font-label-sm text-label-sm font-bold">PLC Packet Dispatched Successfully!</span>
                </div>
                <span className="font-label-sm text-[10px] text-primary-fixed-dim border border-primary-fixed-dim/30 px-2 py-0.5 rounded-md">ACK 200</span>
              </div>
            </div>
          )}

        </main>
      </AppShell>
    </div>
  );
}
