import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getClimateRisk } from '../../api/visionForecastApi';

export default function DronePlantCountingClimateRisk() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('plant');
  const [climateRisk, setClimateRisk] = useState(null);

  useEffect(() => {
    if (activeTab === 'climate') {
      const fetchRisk = async () => {
        try {
          const res = await getClimateRisk(localStorage.getItem('farmId') || '00000000-0000-0000-0000-000000000000', { horizon_years: 10 });
          setClimateRisk(res.data);
        } catch (err) {
          console.error(err);
        }
      };
      fetchRisk();
    }
  }, [activeTab]);

  return (
    <div className="min-h-screen bg-surface text-on-surface flex flex-col pt-safe pb-safe relative">
      <header className="fixed top-0 w-full z-50 bg-surface/90 backdrop-blur-xl border-b border-surface-container/50 shadow-sm pt-safe">
        <div className="flex items-center justify-between h-16 px-margin">
          <div className="flex items-center gap-space-sm">
            <button onClick={() => navigate(-1)} className="w-10 h-10 flex items-center justify-center rounded-full text-on-surface active:bg-surface-container-high transition-colors" type="button">
              <span className="material-symbols-outlined text-[24px]">arrow_back</span>
            </button>
            <h1 className="font-headline-sm text-headline-sm font-bold text-on-surface truncate">Advanced Insights</h1>
          </div>
          <div className="flex items-center gap-1.5">
            <button className="w-10 h-10 flex items-center justify-center rounded-full text-on-surface-variant active:bg-surface-container-high transition-colors" type="button">
              <span className="material-symbols-outlined text-[24px]">more_vert</span>
            </button>
          </div>
        </div>
        
        {/* Module Segmented Tab Controller */}
        <div className="px-margin pb-3 pt-1">
          <div className="bg-surface-container p-1 rounded-xl flex items-center justify-between w-full shadow-inner">
            <button 
              onClick={() => setActiveTab('plant')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-lg transition-all duration-200 ${activeTab === 'plant' ? 'bg-surface text-primary shadow-sm' : 'text-on-surface-variant hover:text-on-surface'}`} 
              type="button"
            >
              <span className="material-symbols-outlined text-[18px]">camera</span>
              <span className="font-label-md text-label-md font-semibold">Plant Count</span>
            </button>
            <button 
              onClick={() => setActiveTab('climate')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-lg transition-all duration-200 ${activeTab === 'climate' ? 'bg-surface text-primary shadow-sm' : 'text-on-surface-variant hover:text-on-surface'}`} 
              type="button"
            >
              <span className="material-symbols-outlined text-[18px]">thermostat</span>
              <span className="font-label-md text-label-md font-semibold">Climate Risk</span>
            </button>
          </div>
        </div>
      </header>

      <main className="flex flex-col w-full pt-32 pb-24 bg-surface flex-1">
        {activeTab === 'plant' && (
          <div className="flex flex-col gap-space-md px-margin pb-space-xl">
            <div className="flex items-center justify-between pt-1">
              <div>
                <h2 className="font-headline-sm text-headline-sm text-on-surface">Drone AI Stand Density</h2>
                <span className="font-label-sm text-label-sm text-on-surface-variant">Flight: 08-Jan-25 • RGB 4K</span>
              </div>
              <span className="font-label-sm text-label-sm bg-primary-fixed text-on-primary-fixed px-2.5 py-1 rounded-full font-bold">Processed</span>
            </div>

            <div className="relative w-full aspect-square rounded-xl overflow-hidden shadow-md bg-surface-container-highest">
              <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1593928136263-88339c0faae9?q=80&w=600&auto=format&fit=crop')" }}></div>
              <div className="absolute inset-0 bg-gradient-to-t from-inverse-surface/90 via-transparent to-inverse-surface/40 pointer-events-none"></div>
              
              <div className="absolute top-2.5 left-2.5 right-2.5 flex justify-between items-center pointer-events-none">
                <div className="bg-inverse-surface/85 backdrop-blur-md px-2.5 py-1 rounded-md text-inverse-on-surface flex items-center gap-1.5 shadow">
                  <span className="material-symbols-outlined text-[15px] text-primary-fixed">crop_free</span>
                  <span className="font-label-sm text-label-sm">Sample: 4,500 plants/frame</span>
                </div>
                <div className="bg-inverse-surface/85 backdrop-blur-md px-2.5 py-1 rounded-md text-inverse-on-surface flex items-center gap-1.5 shadow">
                  <span className="material-symbols-outlined text-[15px] text-secondary-fixed">space_dashboard</span>
                  <span className="font-label-sm text-label-sm">Gap: 2.1% (Minimal)</span>
                </div>
              </div>
              
              <div className="absolute bottom-2.5 left-2.5 right-2.5 flex justify-between items-end pointer-events-none">
                <div className="bg-inverse-surface/90 backdrop-blur-md p-2 rounded-lg text-inverse-on-surface flex flex-col gap-0.5">
                  <span className="font-label-sm text-label-sm text-outline-variant">VISION PIPELINE</span>
                  <span className="font-body-sm text-body-sm text-inverse-on-surface font-semibold flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-primary-fixed inline-block animate-pulse"></span>
                    YOLOv9-Agri • 98.4% Confidence
                  </span>
                </div>
                <button className="pointer-events-auto bg-surface/90 backdrop-blur-md text-on-surface px-3 py-1.5 rounded-lg flex items-center gap-1 shadow hover:bg-surface transition-colors">
                  <span className="material-symbols-outlined text-[16px] text-primary">zoom_in</span>
                  <span className="font-label-sm text-label-sm">Inspect 4K</span>
                </button>
              </div>
            </div>

            <div className="bg-surface-container-lowest rounded-xl p-space-md shadow-sm flex flex-col gap-space-sm">
              <div className="flex items-center justify-between">
                <span className="font-headline-sm text-headline-sm text-on-surface">Stand Composition</span>
                <span className="font-label-sm text-label-sm text-on-surface-variant">Survey Area: 4.5 Acres</span>
              </div>
              
              <div className="grid grid-cols-3 gap-2 pt-1">
                <div className="bg-surface-container-low rounded-lg p-2.5 flex flex-col items-center text-center">
                  <span className="material-symbols-outlined text-primary text-[22px]" style={{ fontVariationSettings: "'FILL' 1" }}>spa</span>
                  <span className="font-headline-md text-headline-md text-primary font-bold mt-1">91%</span>
                  <span className="font-label-sm text-label-sm text-on-surface font-semibold">Healthy Stand</span>
                  <span className="font-label-sm text-label-sm text-on-surface-variant mt-0.5">Uniform vigour</span>
                </div>
                <div className="bg-surface-container-low rounded-lg p-2.5 flex flex-col items-center text-center">
                  <span className="material-symbols-outlined text-secondary text-[22px]">warning</span>
                  <span className="font-headline-md text-headline-md text-secondary font-bold mt-1">6%</span>
                  <span className="font-label-sm text-label-sm text-on-surface font-semibold">Sparse / Gaps</span>
                  <span className="font-label-sm text-label-sm text-on-surface-variant mt-0.5">North furrow</span>
                </div>
                <div className="bg-surface-container-low rounded-lg p-2.5 flex flex-col items-center text-center">
                  <span className="material-symbols-outlined text-error text-[22px]">yard</span>
                  <span className="font-headline-md text-headline-md text-error font-bold mt-1">3%</span>
                  <span className="font-label-sm text-label-sm text-on-surface font-semibold">Weed Patches</span>
                  <span className="font-label-sm text-label-sm text-on-surface-variant mt-0.5">Bathua / Phalaris</span>
                </div>
              </div>

              <div className="bg-surface-container rounded-lg p-3 flex items-start gap-2.5 mt-1">
                <span className="material-symbols-outlined text-secondary text-[20px] flex-shrink-0 mt-0.5">info</span>
                <div className="flex flex-col">
                  <span className="font-label-md text-label-md text-on-surface">Re-seeding Recommendation</span>
                  <span className="font-body-sm text-body-sm text-on-surface-variant">North furrow patch (Row 14-19) indicates shallow seed placement. Spot dibbling advised before crown root initiation.</span>
                </div>
              </div>
            </div>

            <button className="w-full bg-surface-container-lowest hover:bg-surface-container text-primary font-label-lg text-label-lg py-3.5 px-4 rounded-xl shadow-sm flex items-center justify-center gap-2 transition-colors">
              <span className="material-symbols-outlined text-[20px]">picture_as_pdf</span>
              <span>Export Plant Stand Density Report (PDF)</span>
              <span className="material-symbols-outlined text-[18px]">download</span>
            </button>
          </div>
        )}

        {activeTab === 'climate' && (
          <div className="flex flex-col gap-space-md px-margin pb-space-xl">
            <div className="flex items-center justify-between pt-1">
              <div>
                <h2 className="font-headline-sm text-headline-sm text-on-surface">Season Climate Risk Forecast</h2>
                <span className="font-label-sm text-label-sm text-on-surface-variant">Station: Malwa Agro-Met (4.2 km)</span>
              </div>
              <span className="font-label-sm text-label-sm bg-tertiary-fixed text-on-tertiary-fixed px-2.5 py-1 rounded-full font-bold">Rabi 2024-25 Outlook</span>
            </div>

            <div className="bg-surface-container-lowest rounded-xl p-space-md shadow-sm flex flex-col gap-space-sm">
              <div className="flex items-center justify-between">
                <div className="flex flex-col">
                  <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">Overall Composite Index</span>
                  <div className="flex items-baseline gap-2 mt-0.5">
                    <span className="font-headline-lg-mobile text-headline-lg-mobile text-primary font-bold">28<span className="font-headline-sm text-headline-sm text-on-surface-variant font-normal">/100</span></span>
                    <span className="font-label-lg text-label-lg text-primary font-semibold">Low to Moderate</span>
                  </div>
                  <span className="font-label-sm text-label-sm text-on-surface-variant">Lower score denotes safer crop window</span>
                </div>
                
                <div className="relative w-20 h-20 flex-shrink-0 flex items-center justify-center">
                  <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                    <circle className="text-surface-container-highest" cx="18" cy="18" fill="none" r="15.915" stroke="currentColor" strokeWidth="3"></circle>
                    <circle className="text-primary" cx="18" cy="18" fill="none" r="15.915" stroke="currentColor" strokeDasharray="28, 100" strokeLinecap="round" strokeWidth="3"></circle>
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                    <span className="material-symbols-outlined text-[20px] text-primary">verified_user</span>
                  </div>
                </div>
              </div>

              <div className="bg-surface-container-low rounded-lg p-space-sm flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[20px] flex-shrink-0">wb_sunny</span>
                <span className="font-body-sm text-body-sm text-on-surface">Favorable temperature window through February. Guard against sudden March heat spikes.</span>
              </div>
            </div>

            <div className="bg-surface-container-lowest rounded-xl p-space-md shadow-sm flex flex-col gap-space-sm">
              <span className="font-headline-sm text-headline-sm text-on-surface">Specific Climate Vulnerabilities</span>
              
              <div className="flex flex-col gap-1 bg-surface-container-low p-3 rounded-lg">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary text-[20px]">water_loss</span>
                    <span className="font-label-md text-label-md text-on-surface">Drought Risk</span>
                  </div>
                  <span className="font-label-sm text-label-sm bg-primary-fixed text-on-primary-fixed px-2 py-0.5 rounded-full">
                    {climateRisk ? Math.round(climateRisk.drought_risk * 100) : 18}% • Low
                  </span>
                </div>
                <div className="w-full h-2 bg-surface-container-highest rounded-full overflow-hidden mt-1">
                  <div className="h-full bg-primary rounded-full" style={{ width: `${climateRisk ? Math.round(climateRisk.drought_risk * 100) : 18}%` }}></div>
                </div>
                <span className="font-label-sm text-label-sm text-on-surface-variant mt-0.5">Water storage &amp; canal allocation sufficient for 3 more irrigation cycles.</span>
              </div>

              <div className="flex flex-col gap-1 bg-surface-container-low p-3 rounded-lg">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-tertiary text-[20px]">cloud_sync</span>
                    <span className="font-label-md text-label-md text-on-surface">Flood / Hail Risk</span>
                  </div>
                  <span className="font-label-sm text-label-sm bg-tertiary-fixed text-on-tertiary-fixed px-2 py-0.5 rounded-full">
                    {climateRisk ? Math.round(climateRisk.flood_risk * 100) : 12}% • Minimal
                  </span>
                </div>
                <div className="w-full h-2 bg-surface-container-highest rounded-full overflow-hidden mt-1">
                  <div className="h-full bg-tertiary rounded-full" style={{ width: `${climateRisk ? Math.round(climateRisk.flood_risk * 100) : 12}%` }}></div>
                </div>
                <span className="font-label-sm text-label-sm text-on-surface-variant mt-0.5">Dry weather pattern, 0 hail events predicted across 30-day forecast.</span>
              </div>

              <div className="flex flex-col gap-1 bg-surface-container-low p-3 rounded-lg">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-secondary text-[20px]">heat</span>
                    <span className="font-label-md text-label-md text-on-surface">Heat Stress Risk</span>
                  </div>
                  <span className="font-label-sm text-label-sm bg-secondary-fixed text-on-secondary-fixed px-2 py-0.5 rounded-full">
                    {climateRisk ? Math.round(climateRisk.heat_risk * 100) : 42}% • Moderate
                  </span>
                </div>
                <div className="w-full h-2 bg-surface-container-highest rounded-full overflow-hidden mt-1">
                  <div className="h-full bg-secondary-container rounded-full" style={{ width: `${climateRisk ? Math.round(climateRisk.heat_risk * 100) : 42}%` }}></div>
                </div>
                <span className="font-label-sm text-label-sm text-on-surface-variant mt-0.5">Terminal heat risk expected during late grain filling in 3rd week of March.</span>
              </div>
            </div>

            <div className="bg-surface-container-lowest rounded-xl p-space-md shadow-sm flex flex-col gap-space-sm">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-secondary text-[22px]">energy_savings_leaf</span>
                <span className="font-headline-sm text-headline-sm text-on-surface">Adaptive Agronomy Protocols</span>
              </div>
              <div className="flex flex-col gap-2.5">
                <div className="flex items-start gap-3 p-3 bg-surface-container-low rounded-lg">
                  <div className="w-6 h-6 rounded-full bg-secondary-fixed text-on-secondary-fixed flex items-center justify-center font-label-sm text-label-sm flex-shrink-0 mt-0.5">1</div>
                  <div className="flex flex-col">
                    <span className="font-label-md text-label-md text-on-surface">Night Misting Setup</span>
                    <span className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">Prepare light night-sprinkler misting if temperature exceeds 34°C during grain fill to prevent forced maturity.</span>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 bg-surface-container-low rounded-lg">
                  <div className="w-6 h-6 rounded-full bg-primary-fixed text-on-primary-fixed flex items-center justify-center font-label-sm text-label-sm flex-shrink-0 mt-0.5">2</div>
                  <div className="flex flex-col">
                    <span className="font-label-md text-label-md text-on-surface">Conserve Root Moisture</span>
                    <span className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">Maintain soil mulch to conserve root zone moisture and avoid afternoon transpiration losses.</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      <div className="fixed bottom-[80px] w-full z-40 bg-surface/95 backdrop-blur-md px-margin py-3 shadow-[0_-4px_12px_rgba(0,0,0,0.05)]">
        <button className="w-full min-h-[56px] bg-secondary-container hover:bg-secondary text-surface-container-lowest font-label-lg text-label-lg rounded-xl shadow-md flex items-center justify-center gap-2 px-4 transition-all active:scale-[0.99]">
          <span className="material-symbols-outlined text-[22px]">sync_saved_locally</span>
          <span>Sync Drone Telemetry &amp; Download Advisory</span>
          <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
        </button>
      </div>

      <nav className="fixed bottom-0 w-full z-50 pb-safe bg-surface/90 backdrop-blur-xl shadow-[0_-4px_12px_rgba(0,0,0,0.05)]">
        <div className="flex justify-around items-center h-20 px-space-xs max-w-lg mx-auto">
          {[
            { icon: 'home', label: 'Home', to: '/app', active: true },
            { icon: 'calendar_month', label: 'Plan', to: '/planning/crop-plan' },
            { icon: 'water_drop', label: 'Water', to: '/water-soil/irrigation' },
            { icon: 'storefront', label: 'Market', to: '/vision/price-forecast' },
            { icon: 'crisis_alert', label: 'Alerts', to: '/community/alerts' },
          ].map(({ icon, label, to, active }) => (
            <button key={label} onClick={() => navigate(to)} className={`flex flex-col items-center justify-center min-w-[48px] min-h-[48px] py-1 px-2 transition-colors ${active ? 'text-primary font-bold' : 'text-on-surface-variant hover:text-on-surface'}`} type="button">
              <span className="material-symbols-outlined text-[24px]">{icon}</span>
              <span className="font-label-sm text-label-sm mt-0.5">{label}</span>
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
}
