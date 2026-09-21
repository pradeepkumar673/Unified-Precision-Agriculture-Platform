import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCeaDashboard } from '../../api/ceaIotApi';

export default function LiveSensorDashboard() {
  const navigate = useNavigate();
  
  const [dashboardData, setDashboardData] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState('Just now');

  const fetchData = async () => {
    try {
      const farmId = localStorage.getItem('farmId') || '00000000-0000-0000-0000-000000000000';
      const data = await getCeaDashboard(farmId);
      setDashboardData(data);
      setLastUpdated('Just now');
    } catch (err) {
      console.error('Error fetching sensor data:', err);
      // Mock data for UI testing if API fails
      if (!dashboardData) {
        setDashboardData({
          latest_reading: {
            data: {
              substrate_moisture: 78.4,
              solution_ph: 6.2,
              ambient_temp: 24.6,
              humidity: 68,
              nutrient_ec: 2.1,
              co2_ambient: 820
            }
          }
        });
      }
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000); // Poll every 5s
    
    const timeInterval = setInterval(() => {
      setLastUpdated(prev => {
        if (prev === 'Just now') return 'Updated 5s ago';
        if (prev.includes('s ago')) {
          const secs = parseInt(prev.match(/\d+/)[0]) + 1;
          return `Updated ${secs}s ago`;
        }
        return prev;
      });
    }, 1000);

    return () => {
      clearInterval(interval);
      clearInterval(timeInterval);
    };
  }, []);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchData();
    setTimeout(() => setIsRefreshing(false), 500);
  };

  const readings = dashboardData?.latest_reading?.data || {};

  return (
    <div className="min-h-screen bg-surface-container text-on-surface flex flex-col relative">
      

      <main className="flex flex-col w-full pt-[64px] pb-24 px-margin flex-1 gap-space-sm">
        
        <div className="flex flex-col gap-3 pt-space-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-primary animate-ping"></span>
              <span className="font-label-md text-label-md text-primary font-bold uppercase tracking-wider">Live Sync</span>
              <span className="text-on-surface-variant font-label-sm text-label-sm">• {lastUpdated}</span>
            </div>
            <button 
              onClick={handleRefresh}
              aria-label="Manual refresh telemetry" 
              className={`min-h-[36px] min-w-[36px] rounded-full bg-surface-container flex items-center justify-center text-on-surface hover:bg-surface-container-high transition-transform duration-300 ${isRefreshing ? 'rotate-180' : ''}`}
            >
              <span className="material-symbols-outlined text-[18px]">sync</span>
            </button>
          </div>
          
          <div className="relative w-full">
            <div className="flex items-center justify-between bg-surface-container-low rounded-lg px-space-sm py-1.5 min-h-[44px]">
              <div className="flex items-center gap-2 min-w-0">
                <span className="material-symbols-outlined text-tertiary text-[20px] shrink-0">warehouse</span>
                <span className="font-label-md text-label-md text-on-surface font-semibold truncate">Unit 2: Climate Polyhouse (Nashik)</span>
              </div>
              <span className="material-symbols-outlined text-outline text-[20px] shrink-0">expand_more</span>
            </div>
          </div>
        </div>

        <div className="bg-surface-container-lowest rounded-xl p-space-md shadow-sm flex items-center justify-between gap-space-sm">
          <div className="flex items-center gap-space-sm min-w-0">
            <div className="w-12 h-12 rounded-xl bg-primary-fixed flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-on-primary-fixed text-[26px]">eco</span>
            </div>
            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="font-label-sm text-label-sm text-tertiary uppercase tracking-wider font-bold">Facility Health</span>
                <span className="px-1.5 py-0.5 rounded-full bg-primary text-on-primary font-label-sm text-label-sm font-bold">98/100</span>
              </div>
              <p className="font-label-sm text-label-sm text-on-surface-variant truncate">All Vital Bounds Normal</p>
            </div>
          </div>
          <button className="min-h-[44px] px-space-sm py-1 rounded-lg bg-surface-container-high hover:bg-surface-container-highest text-tertiary font-label-sm text-label-sm font-bold flex items-center gap-1 shrink-0 transition-colors shadow-sm" type="button">
            <span className="material-symbols-outlined text-[18px]">tune</span>
            <span>Calibrate</span>
          </button>
        </div>

        <div className="grid grid-cols-2 gap-space-sm">
          <div className="bg-surface-container-lowest rounded-xl p-space-sm shadow-sm flex flex-col justify-between h-32">
            <div className="flex items-center justify-between gap-1">
              <span className="font-label-sm text-label-sm text-on-surface-variant font-medium truncate">Substrate Moisture</span>
              <span className="flex h-2 w-2 rounded-full bg-primary-container shrink-0" title="Optimal: 70-85%"></span>
            </div>
            <div className="my-space-xs">
              <div className="font-headline-lg-mobile text-headline-lg-mobile text-on-surface font-bold tracking-tight">
                {readings.substrate_moisture || 78.4}<span className="font-label-sm text-label-sm font-normal text-on-surface-variant ml-0.5">%</span>
              </div>
            </div>
            <div className="w-full h-8 my-0.5">
              <svg className="w-full h-full text-primary" fill="none" preserveAspectRatio="none" viewBox="0 0 100 28">
                <path d="M0,20 Q15,22 30,15 T60,11 T85,8 T100,10" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5"></path>
                <path d="M0,20 Q15,22 30,15 T60,11 T85,8 T100,10 L100,28 L0,28 Z" fill="currentColor" fillOpacity="0.12"></path>
              </svg>
            </div>
            <div className="pt-space-xs flex flex-col gap-0.5">
              <span className="font-label-sm text-label-sm text-primary font-semibold">Target 75%</span>
              <span className="font-label-sm text-label-sm text-outline truncate">Sensor #SM-04</span>
            </div>
          </div>

          <div className="bg-surface-container-lowest rounded-xl p-space-sm shadow-sm flex flex-col justify-between h-32">
            <div className="flex items-center justify-between gap-1">
              <span className="font-label-sm text-label-sm text-on-surface-variant font-medium truncate">Substrate pH</span>
              <span className="flex h-2 w-2 rounded-full bg-primary-container shrink-0" title="Target: 5.8 - 6.5"></span>
            </div>
            <div className="my-space-xs">
              <div className="font-headline-lg-mobile text-headline-lg-mobile text-on-surface font-bold tracking-tight">
                {readings.solution_ph || 6.2}<span className="font-label-sm text-label-sm font-normal text-on-surface-variant ml-0.5">pH</span>
              </div>
            </div>
            <div className="w-full h-8 my-0.5">
              <svg className="w-full h-full text-tertiary" fill="none" preserveAspectRatio="none" viewBox="0 0 100 28">
                <path d="M0,12 Q20,12 40,22 T65,14 T85,13 T100,13" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5"></path>
                <path d="M0,12 Q20,12 40,22 T65,14 T85,13 T100,13 L100,28 L0,28 Z" fill="currentColor" fillOpacity="0.1"></path>
              </svg>
            </div>
            <div className="pt-space-xs flex flex-col gap-0.5">
              <span className="font-label-sm text-label-sm text-tertiary font-semibold">Auto-balanced</span>
              <span className="font-label-sm text-label-sm text-outline truncate">Sensor #PH-02</span>
            </div>
          </div>

          <div className="bg-surface-container-lowest rounded-xl p-space-sm shadow-sm flex flex-col justify-between h-32">
            <div className="flex items-center justify-between gap-1">
              <span className="font-label-sm text-label-sm text-on-surface-variant font-medium truncate">Ambient Temp</span>
              <span className="flex h-2 w-2 rounded-full bg-primary-container shrink-0" title="Target: 22 - 26 °C"></span>
            </div>
            <div className="my-space-xs">
              <div className="font-headline-lg-mobile text-headline-lg-mobile text-on-surface font-bold tracking-tight">
                {readings.ambient_temp || 24.6}<span className="font-label-sm text-label-sm font-normal text-on-surface-variant ml-0.5">°C</span>
              </div>
            </div>
            <div className="w-full h-8 my-0.5">
              <svg className="w-full h-full text-primary" fill="none" preserveAspectRatio="none" viewBox="0 0 100 28">
                <path d="M0,16 Q25,9 50,14 T75,19 T100,12" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5"></path>
                <path d="M0,16 Q25,9 50,14 T75,19 T100,12 L100,28 L0,28 Z" fill="currentColor" fillOpacity="0.1"></path>
              </svg>
            </div>
            <div className="pt-space-xs flex flex-col gap-0.5">
              <span className="font-label-sm text-label-sm text-on-surface-variant font-medium">Exhaust fan active</span>
              <span className="font-label-sm text-label-sm text-outline truncate">Sensor #TH-01</span>
            </div>
          </div>

          <div className="bg-surface-container-lowest rounded-xl p-space-sm shadow-sm flex flex-col justify-between h-32">
            <div className="flex items-center justify-between gap-1">
              <span className="font-label-sm text-label-sm text-on-surface-variant font-medium truncate">Humidity (RH)</span>
              <span className="flex h-2.5 w-2.5 rounded-full bg-secondary-container shrink-0" title="Elevated humidity"></span>
            </div>
            <div className="my-space-xs">
              <div className="font-headline-lg-mobile text-headline-lg-mobile text-secondary font-bold tracking-tight">
                {readings.humidity || 68}<span className="font-label-sm text-label-sm font-normal text-on-surface-variant ml-0.5">%</span>
              </div>
            </div>
            <div className="w-full h-8 my-0.5">
              <svg className="w-full h-full text-secondary" fill="none" preserveAspectRatio="none" viewBox="0 0 100 28">
                <path d="M0,8 Q20,7 45,9 T75,6 T100,7" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5"></path>
                <path d="M0,8 Q20,7 45,9 T75,6 T100,7 L100,28 L0,28 Z" fill="currentColor" fillOpacity="0.12"></path>
              </svg>
            </div>
            <div className="pt-space-xs flex flex-col gap-0.5">
              <span className="font-label-sm text-label-sm text-secondary font-semibold">Elevated (Max 65%)</span>
              <span className="font-label-sm text-label-sm text-outline truncate">Misting paused</span>
            </div>
          </div>

          <div className="bg-surface-container-lowest rounded-xl p-space-sm shadow-sm flex flex-col justify-between h-32">
            <div className="flex items-center justify-between gap-1">
              <span className="font-label-sm text-label-sm text-on-surface-variant font-medium truncate">Nutrient (EC)</span>
              <span className="flex h-2 w-2 rounded-full bg-primary-container shrink-0" title="Optimal EC"></span>
            </div>
            <div className="my-space-xs">
              <div className="font-headline-lg-mobile text-headline-lg-mobile text-on-surface font-bold tracking-tight">
                {readings.nutrient_ec || 2.1}<span className="font-label-sm text-label-sm font-normal text-on-surface-variant ml-0.5">mS</span>
              </div>
            </div>
            <div className="w-full h-8 my-0.5">
              <svg className="w-full h-full text-primary" fill="none" preserveAspectRatio="none" viewBox="0 0 100 28">
                <path d="M0,18 Q30,19 50,15 T80,12 T100,14" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5"></path>
                <path d="M0,18 Q30,19 50,15 T80,12 T100,14 L100,28 L0,28 Z" fill="currentColor" fillOpacity="0.1"></path>
              </svg>
            </div>
            <div className="pt-space-xs flex flex-col gap-0.5">
              <span className="font-label-sm text-label-sm text-primary font-semibold truncate">N:180 P:50 K:210</span>
              <span className="font-label-sm text-label-sm text-outline truncate">Target 1.8 - 2.4</span>
            </div>
          </div>

          <div className="bg-surface-container-lowest rounded-xl p-space-sm shadow-sm flex flex-col justify-between h-32">
            <div className="flex items-center justify-between gap-1">
              <span className="font-label-sm text-label-sm text-on-surface-variant font-medium truncate">CO2 Ambient</span>
              <span className="flex h-2 w-2 rounded-full bg-primary-container shrink-0" title="Photosynthesis Peak"></span>
            </div>
            <div className="my-space-xs">
              <div className="font-headline-lg-mobile text-headline-lg-mobile text-on-surface font-bold tracking-tight">
                {readings.co2_ambient || 820}<span className="font-label-sm text-label-sm font-normal text-on-surface-variant ml-0.5">ppm</span>
              </div>
            </div>
            <div className="w-full h-8 my-0.5">
              <svg className="w-full h-full text-tertiary" fill="none" preserveAspectRatio="none" viewBox="0 0 100 28">
                <path d="M0,23 Q25,22 45,15 T70,6 T85,9 T100,8" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5"></path>
                <path d="M0,23 Q25,22 45,15 T70,6 T85,9 T100,8 L100,28 L0,28 Z" fill="currentColor" fillOpacity="0.1"></path>
              </svg>
            </div>
            <div className="pt-space-xs flex flex-col gap-0.5">
              <span className="font-label-sm text-label-sm text-tertiary font-semibold">Burner Active</span>
              <span className="font-label-sm text-label-sm text-outline truncate">Optimal canopy assim.</span>
            </div>
          </div>
        </div>

        <div className="bg-surface-container-lowest rounded-xl p-space-sm shadow-sm flex items-center gap-space-sm">
          <div className="relative w-20 h-20 rounded-lg overflow-hidden shrink-0 bg-surface-container">
            <img className="w-full h-full object-cover" alt="Hydroponic Block" src="https://images.unsplash.com/photo-1551865910-cb10d656af01?q=80&w=400&auto=format&fit=crop"/>
          </div>
          <div className="flex flex-col min-w-0 flex-1">
            <div className="flex items-center gap-1">
              <span className="material-symbols-outlined text-primary text-[16px]">verified</span>
              <span className="font-label-sm text-label-sm font-bold text-primary uppercase tracking-wide">Hydroponic Block 2A</span>
            </div>
            <span className="font-label-md text-label-md text-on-surface font-semibold truncate">Butterhead & Cherry Tomato</span>
            <p className="font-label-sm text-label-sm text-on-surface-variant">Vegetative phase • Day 34 of 48</p>
          </div>
        </div>

        <div className="bg-surface-container-lowest rounded-xl p-space-md shadow-sm flex flex-col gap-space-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-tertiary text-[20px]">hub</span>
              <span className="font-label-md text-label-md text-on-surface font-bold">Mesh Node Topology</span>
            </div>
            <span className="font-label-sm text-label-sm text-outline font-medium">915MHz LoRaWAN</span>
          </div>
          <div className="grid grid-cols-4 gap-space-xs">
            <div className="bg-surface-container-low rounded-lg p-space-xs flex flex-col items-center text-center">
              <span className="material-symbols-outlined text-primary text-[20px]">battery_5_bar</span>
              <span className="font-label-sm text-label-sm font-bold text-on-surface mt-0.5">94%</span>
              <span className="font-label-sm text-label-sm text-on-surface-variant">Node A</span>
            </div>
            <div className="bg-surface-container-low rounded-lg p-space-xs flex flex-col items-center text-center">
              <span className="material-symbols-outlined text-primary text-[20px]">battery_5_bar</span>
              <span className="font-label-sm text-label-sm font-bold text-on-surface mt-0.5">88%</span>
              <span className="font-label-sm text-label-sm text-on-surface-variant">Node B</span>
            </div>
            <div className="bg-surface-container-low rounded-lg p-space-xs flex flex-col items-center text-center">
              <span className="material-symbols-outlined text-primary text-[20px]">battery_6_bar</span>
              <span className="font-label-sm text-label-sm font-bold text-on-surface mt-0.5">91%</span>
              <span className="font-label-sm text-label-sm text-on-surface-variant">Node C</span>
            </div>
            <div className="bg-surface-container-low rounded-lg p-space-xs flex flex-col items-center text-center">
              <span className="material-symbols-outlined text-tertiary text-[20px]">power</span>
              <span className="font-label-sm text-label-sm font-bold text-on-surface mt-0.5">Mains</span>
              <span className="font-label-sm text-label-sm text-on-surface-variant">Node D</span>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-space-sm pt-space-xs pb-space-sm">
          <button className="w-full min-h-[56px] rounded-xl bg-secondary-container text-on-secondary-container hover:opacity-95 active:scale-[0.99] font-label-lg text-label-lg font-bold flex items-center justify-center gap-2 shadow-md transition-all" type="button">
            <span className="material-symbols-outlined text-[24px]">cyclone</span>
            <span>Trigger Automated Sensor Purge / Flush</span>
          </button>
          <button className="w-full min-h-[52px] rounded-xl bg-surface-container hover:bg-surface-container-high text-tertiary font-label-md text-label-md font-semibold flex items-center justify-center gap-2 transition-colors" type="button">
            <span className="material-symbols-outlined text-[20px]">download</span>
            <span>Download 24h Telemetry Log (CSV)</span>
          </button>
        </div>

      </main>

      
    </div>
  );
}
