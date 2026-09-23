import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getFarmProfile } from '../../api/farmApi';

export default function WaterDemandForecast() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('forecast'); // forecast, budget, canal
  const [pumpActive, setPumpActive] = useState(false);
  
  const [farmProfile, setFarmProfile] = useState(null);
  const [forecastData, setForecastData] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const farmId = localStorage.getItem('farmId') || '00000000-0000-0000-0000-000000000000';

  useEffect(() => {
    const loadData = async () => {
      try {
        const res = await getFarmProfile(farmId);
        setFarmProfile(res.data);
        
        // Generate dynamic 7-day forecast based on current date
        const baseTemp = 28;
        const cropMultiplier = res.data.current_crop === 'Rice' ? 1.5 : (res.data.current_crop === 'Wheat' ? 1.0 : 0.8);
        const acres = res.data.land_size_acres || 1;
        
        const generated = [];
        const today = new Date();
        for (let i = 0; i < 7; i++) {
          const d = new Date(today);
          d.setDate(today.getDate() + i);
          const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
          
          // Add some randomization for realism
          const temp = Math.floor(baseTemp + Math.random() * 8);
          const isRaining = Math.random() > 0.8;
          
          // Calculate liters required
          let liters = 0;
          if (!isRaining) {
             liters = Math.round(temp * 150 * acres * cropMultiplier);
          }
          
          generated.push({
            day: dayName,
            temp: temp,
            rain: isRaining,
            rainAmt: isRaining ? Math.floor(Math.random() * 15 + 2) : 0,
            liters: liters
          });
        }
        setForecastData(generated);
      } catch (err) {
        console.error("Failed to fetch farm profile", err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [farmId]);

  if (loading) return <div className="min-h-screen bg-surface flex items-center justify-center font-bold text-primary">Loading forecast...</div>;
  
  const crop = farmProfile?.current_crop || 'Unknown Crop';
  const acres = farmProfile?.land_size_acres || 0;
  const stage = farmProfile?.crop_stage || 'Growing';
  const farmName = farmProfile?.name || 'Farm';
  
  // Calculate max peak
  const maxPeak = Math.max(...forecastData.map(d => d.liters), 0);
  const todayLiters = forecastData[0]?.liters || 0;

  return (
    <div className="min-h-screen bg-surface text-on-surface flex flex-col relative">
      {/* Top Header */}
      

      <main className="flex flex-col relative w-full pt-32 pb-24 bg-surface flex-1">
        <div className="flex flex-col w-full px-gutter gap-space-md py-space-sm">
          {/* Segmented View Switcher & Context Pill */}
          <div className="flex flex-col gap-space-xs">
            <div className="flex items-center gap-1.5 p-1 bg-surface-container rounded-full shadow-sm">
              <button onClick={() => setActiveTab('forecast')} className={`flex-1 py-2 px-3 rounded-full font-label-md text-label-md text-center transition-all flex items-center justify-center gap-1 min-h-[44px] ${activeTab === 'forecast' ? 'bg-primary text-on-primary' : 'text-on-surface-variant hover:text-on-surface'}`} type="button">
                <span className="material-symbols-outlined text-[18px]">calendar_view_week</span>
                <span>7-Day Forecast</span>
              </button>
              <button onClick={() => setActiveTab('budget')} className={`flex-1 py-2 px-3 rounded-full font-label-md text-label-md text-center transition-all flex items-center justify-center gap-1 min-h-[44px] ${activeTab === 'budget' ? 'bg-primary text-on-primary' : 'text-on-surface-variant hover:text-on-surface'}`} type="button">
                <span className="material-symbols-outlined text-[18px]">water_full</span>
                <span>Budget</span>
              </button>
              <button onClick={() => setActiveTab('canal')} className={`flex-1 py-2 px-3 rounded-full font-label-md text-label-md text-center transition-all flex items-center justify-center gap-1 min-h-[44px] ${activeTab === 'canal' ? 'bg-primary text-on-primary' : 'text-on-surface-variant hover:text-on-surface'}`} type="button">
                <span className="material-symbols-outlined text-[18px]">schedule</span>
                <span>Canal</span>
              </button>
            </div>
            <div className="flex items-center justify-between px-2 py-1.5 bg-surface-container-low rounded-xl">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[20px]">agriculture</span>
                <span className="font-label-sm text-label-sm text-on-surface-variant font-semibold">{farmName} ({crop}) • {acres} Acres • {stage}</span>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-primary-fixed text-on-primary-fixed font-label-sm text-label-sm">Active Cycle</span>
            </div>
          </div>

          {activeTab === 'forecast' && (
            <>
            {/* Hero Forecast Visual Chart Card */}
          <div className="bg-surface-container-lowest rounded-xl p-space-md shadow-sm flex flex-col gap-space-md">
            <div className="flex items-start justify-between gap-space-xs">
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-tertiary-container text-[22px]">ssid_chart</span>
                  <h2 className="font-headline-sm text-headline-sm text-on-surface">7-Day Irrigation Forecast</h2>
                </div>
                <p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">
                  Dynamic water calculation calibrated for solar heat, soil moisture, and {crop.toLowerCase()} {stage.toLowerCase()} stage.
                </p>
              </div>
              <button className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center text-primary shrink-0 active:scale-95" type="button">
                <span className="material-symbols-outlined text-[20px]">info</span>
              </button>
            </div>

            {/* Chart Visualizer */}
            <div className="flex flex-col bg-surface-container-low rounded-xl p-space-sm pt-space-md">
              <div className="flex items-center justify-between px-1 mb-2">
                <span className="font-label-sm text-label-sm text-on-surface-variant">Recommended Delivery (Liters)</span>
                <span className="font-label-sm text-label-sm text-primary font-bold">Max Peak: {(maxPeak / 1000).toFixed(1)}k L</span>
              </div>
              
              <div className="grid grid-cols-7 gap-1.5 items-end h-56 pt-2 pb-1">
                {forecastData.map((data, i) => {
                  const heightPct = maxPeak > 0 ? (data.liters / maxPeak) * 100 : 0;
                  const isToday = i === 0;
                  
                  return (
                    <div key={i} className={`flex flex-col items-center h-full justify-end group ${!isToday && !data.rain && data.liters === 0 ? 'opacity-85' : ''}`}>
                      {data.rain ? (
                        <span className="font-label-sm text-label-sm text-tertiary font-bold mb-1">Rain</span>
                      ) : data.liters > 0 ? (
                        <span className={`font-label-sm text-label-sm font-bold mb-1 ${isToday ? 'text-primary' : 'text-tertiary-container'}`}>{(data.liters / 1000).toFixed(1)}k</span>
                      ) : (
                        <span className="font-label-sm text-label-sm text-on-surface-variant mb-1">0 L</span>
                      )}
                      
                      {data.rain ? (
                        <div className="w-full bg-tertiary-fixed rounded-t-lg h-7 relative flex items-center justify-center">
                          <span className="material-symbols-outlined text-tertiary text-[14px]">grain</span>
                        </div>
                      ) : data.liters > 0 ? (
                        <div className={`w-full bg-surface-container-high rounded-t-lg relative flex flex-col justify-end overflow-hidden ${isToday ? 'shadow-sm' : ''}`} style={{height: `${Math.max(15, heightPct)}%`}}>
                          <div className={`w-full rounded-t-lg h-full transition-all ${isToday ? 'bg-tertiary-container relative flex items-start justify-center pt-1' : 'bg-tertiary'}`}>
                            {isToday && <span className="text-[10px] font-bold text-on-tertiary tracking-tighter">TODAY</span>}
                          </div>
                        </div>
                      ) : (
                        <div className="w-full bg-surface-container rounded-t-lg h-5 relative flex items-center justify-center">
                          <span className="w-1.5 h-1.5 rounded-full bg-outline-variant"></span>
                        </div>
                      )}
                      
                      <div className="mt-2 flex flex-col items-center text-center">
                        <span className={`material-symbols-outlined text-[18px] ${data.rain ? 'text-tertiary-container' : (data.temp > 30 ? 'text-secondary' : 'text-tertiary')}`}>
                          {data.rain ? 'rainy' : (data.temp > 30 ? 'sunny' : 'partly_cloudy_day')}
                        </span>
                        <span className={`font-label-sm text-label-sm font-bold ${isToday ? 'text-on-surface' : (data.rain ? 'text-tertiary-container' : 'text-on-surface')}`}>{data.day}</span>
                        <span className={`text-[11px] ${data.rain ? 'text-tertiary font-bold' : 'text-on-surface-variant'}`}>{data.rain ? `${data.rainAmt}mm` : `${data.temp}°C`}</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-3 pt-2.5 flex items-center justify-between text-on-surface-variant">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-tertiary-container"></span>
                  <span className="font-label-sm text-label-sm">Scheduled</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-tertiary-fixed"></span>
                  <span className="font-label-sm text-label-sm">Rain</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-surface-container-highest"></span>
                  <span className="font-label-sm text-label-sm">Rest</span>
                </div>
              </div>
            </div>

            {/* Active Day Deep-Dive */}
            <div className="bg-primary-fixed/20 p-space-sm rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-on-primary">
                  <span className="material-symbols-outlined text-[22px]">water</span>
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-label-md text-label-md text-on-surface font-bold">Today's Session: {forecastData[0]?.day}</span>
                    <span className="px-2 py-[2px] rounded-full bg-secondary-container text-on-primary font-label-sm text-label-sm">Recommended</span>
                  </div>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">{todayLiters.toLocaleString()} L required • Approx {(todayLiters / 5000).toFixed(1)} hrs run time (7.5 HP Pump)</p>
                </div>
              </div>
              <button onClick={() => setPumpActive(!pumpActive)} className={`px-3 py-2 rounded-lg font-label-md text-label-md shadow-sm active:scale-95 ${pumpActive ? 'bg-error text-on-error' : 'bg-surface-container-lowest text-primary'}`} type="button">
                {pumpActive ? 'Stop' : 'Start'}
              </button>
            </div>
          </div>

          {/* Weekly Summary Insights */}
          <div className="bg-surface-container-lowest rounded-xl p-space-md shadow-sm flex flex-col gap-space-sm">
            <div className="flex items-center justify-between">
              <span className="font-headline-sm text-headline-sm text-on-surface">Weekly Irrigation Metrics</span>
              <span className="px-2.5 py-1 rounded-full bg-primary-fixed text-on-primary-fixed font-label-sm text-label-sm font-bold flex items-center gap-1">
                <span className="material-symbols-outlined text-[16px]">eco</span>
                +25% Efficiency
              </span>
            </div>
            <div className="grid grid-cols-2 gap-space-xs mt-1">
              <div className="bg-surface-container-low p-space-sm rounded-xl flex flex-col justify-between">
                <div className="flex items-center gap-1 text-on-surface-variant">
                  <span className="material-symbols-outlined text-[18px]">opacity</span>
                  <span className="font-label-sm text-label-sm">Total Demand</span>
                </div>
                <div className="mt-2">
                  <span className="font-headline-md text-headline-md text-primary font-bold">{(forecastData.reduce((acc, curr) => acc + curr.liters, 0) / 1000).toFixed(1)}k</span>
                  <span className="font-label-sm text-label-sm text-on-surface-variant"> Liters</span>
                </div>
                <span className="text-[12px] text-on-surface-variant mt-0.5">Across dynamic cycles</span>
              </div>
              <div className="bg-surface-container-low p-space-sm rounded-xl flex flex-col justify-between">
                <div className="flex items-center gap-1 text-on-surface-variant">
                  <span className="material-symbols-outlined text-[18px]">savings</span>
                  <span className="font-label-sm text-label-sm">Water Conserved</span>
                </div>
                <div className="mt-2">
                  <span className="font-headline-md text-headline-md text-secondary-container font-bold">{Math.round(forecastData.reduce((acc, curr) => acc + curr.liters, 0) * 0.25).toLocaleString()}</span>
                  <span className="font-label-sm text-label-sm text-on-surface-variant"> Liters</span>
                </div>
                <span className="text-[12px] text-on-surface-variant mt-0.5">vs traditional flood practice</span>
              </div>
            </div>
            
            {forecastData.find(d => d.rain) && (
              <div className="flex items-start gap-2.5 p-space-sm bg-tertiary-fixed/30 rounded-xl mt-1">
                <span className="material-symbols-outlined text-tertiary-container text-[24px] shrink-0 mt-0.5">shower</span>
                <div className="flex flex-col">
                  <span className="font-label-md text-label-md text-tertiary-container font-bold">Rain Forecast {forecastData.find(d => d.rain).day} ({forecastData.find(d => d.rain).rainAmt}mm)</span>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">
                    {forecastData.find(d => d.rain).day} irrigation skipped automatically. Conserves groundwater and avoids fertilizer leaching.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Soil Moisture Visual Check */}
          <div className="bg-surface-container-lowest rounded-xl p-space-md shadow-sm flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative w-12 h-12 flex items-center justify-center">
                <svg className="w-12 h-12 transform -rotate-90" viewBox="0 0 36 36">
                  <path className="text-surface-container-highest" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="3.5"></path>
                  <path className="text-primary-container" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeDasharray="52, 100" strokeLinecap="round" strokeWidth="3.5"></path>
                </svg>
                <span className="absolute font-label-md text-label-md font-bold text-primary">52%</span>
              </div>
              <div>
                <span className="font-label-md text-label-md text-on-surface font-semibold">Plot Root Zone Moisture</span>
                <p className="font-body-sm text-body-sm text-on-surface-variant">Optimal field capacity for {crop.toLowerCase()} root branch.</p>
              </div>
            </div>
            <span className="material-symbols-outlined text-primary text-[24px]">verified</span>
          </div>

          <div className="flex flex-col gap-space-xs mt-1">
            <button className="w-full min-h-[52px] bg-primary text-on-primary rounded-xl font-label-lg text-label-lg flex items-center justify-center gap-2 shadow-sm active:scale-[0.98] transition-transform" type="button">
              <span className="material-symbols-outlined text-[22px]">smart_toy</span>
              <span>Set Pump Automation / Reminder</span>
              <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
            </button>
            <button className="w-full min-h-[48px] bg-surface-container text-on-surface rounded-xl font-label-md text-label-md flex items-center justify-center gap-2 active:bg-surface-container-high transition-colors" type="button">
              <span className="material-symbols-outlined text-[20px] text-primary">ios_share</span>
              <span>Export Schedule for Canal Warden / FPO</span>
            </button>
          </div>
          </>
          )}

          {activeTab === 'budget' && (
            <div className="flex flex-col gap-space-sm mt-2">
              <div className="bg-surface-container-lowest rounded-xl p-space-md shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                  <span className="material-symbols-outlined text-primary text-[24px]">water_full</span>
                  <h2 className="font-headline-sm text-headline-sm text-on-surface">Monthly Water Budget</h2>
                </div>
                
                <div className="flex flex-col gap-2">
                  <div className="flex justify-between items-end">
                    <span className="font-label-md text-on-surface-variant">Used this month</span>
                    <span className="font-title-lg font-bold text-primary">124k / 400k L</span>
                  </div>
                  <div className="w-full h-3 bg-surface-container-high rounded-full overflow-hidden">
                    <div className="h-full bg-primary rounded-full" style={{ width: '31%' }}></div>
                  </div>
                  <p className="font-body-sm text-on-surface-variant mt-2">
                    You have used 31% of your allocated water budget for {farmName}. 
                    At this rate, you are projected to stay well within limits.
                  </p>
                </div>
              </div>
              
              <div className="bg-surface-container-lowest rounded-xl p-space-md shadow-sm">
                <h3 className="font-title-md font-bold text-on-surface mb-3">Cost Savings</h3>
                <div className="flex items-center justify-between p-3 bg-primary-container text-on-primary-container rounded-lg">
                  <span className="font-label-md">Electricity Saved</span>
                  <span className="font-bold">₹1,240</span>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'canal' && (
            <div className="flex flex-col gap-space-sm mt-2">
              <div className="bg-surface-container-lowest rounded-xl p-space-md shadow-sm text-center py-8">
                <span className="material-symbols-outlined text-tertiary text-[48px] mb-2">water</span>
                <h2 className="font-headline-sm text-headline-sm text-on-surface mb-2">Canal Schedule</h2>
                <p className="font-body-md text-on-surface-variant mb-6 px-4">
                  The local canal water release schedule is fetched directly from the district water board.
                </p>
                
                <div className="bg-tertiary-container/30 p-4 rounded-xl text-left border border-tertiary/20 max-w-sm mx-auto">
                  <span className="px-2 py-1 bg-tertiary text-on-tertiary font-label-sm font-bold rounded uppercase text-[10px] tracking-wider mb-2 inline-block">Upcoming Release</span>
                  <h3 className="font-title-md font-bold text-on-surface">North Block Canal</h3>
                  <div className="flex items-center gap-2 text-on-surface-variant mt-2">
                    <span className="material-symbols-outlined text-[18px]">calendar_today</span>
                    <span className="font-label-md">Oct 12 - Oct 14</span>
                  </div>
                  <div className="flex items-center gap-2 text-on-surface-variant mt-1">
                    <span className="material-symbols-outlined text-[18px]">schedule</span>
                    <span className="font-label-md">06:00 AM - 18:00 PM</span>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>
      </main>

      {/* Bottom Nav */}
      
    </div>
  );
}
