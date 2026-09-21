import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getClimateRisk } from '../../api/visionForecastApi';
import AppShell from '../../layouts/AppShell';

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

  const customHeader = (
    <div className="h-14 px-margin flex items-center justify-between gap-space-sm w-full">
      <div className="flex items-center gap-space-sm min-w-0 flex-1">
        <img alt="Brand logo." className="h-8 w-auto object-contain flex-shrink-0" src="https://lh3.googleusercontent.com/aida/AEtjO1UIQkciQWmlsTRY8f9Zy0F8V6Ui5SnL-bNI1XODjLR9sQNG4BHGAMrtvwAK-8Il7hBixSfzotAqt-1yzxZ1tS8lfeStHMZMcAAazASvjFxGLljEzJwhmT37IQLEv0u0wChglbOYjrW80Tbxp2N5Gci7RSN8sqPVnTp66_kG_QHJe8HBtzy0s7YivFGLy5OK6W6ahvWh_DtV3OjnAKUT1Zgj0Ae4r9TLabB2OQOypc-WO4bS3YHevJEUIf8"/>
        <div className="flex flex-col min-w-0">
          <div className="flex items-center gap-1">
            <span className="font-headline-sm text-headline-sm text-primary truncate leading-tight">KhetSaathi</span>
            <span className="font-label-sm text-label-sm text-on-surface-variant truncate hidden sm:inline">• Home</span>
          </div>
          <button className="flex items-center gap-1 text-left min-w-0 group">
            <span className="material-symbols-outlined text-[16px] text-secondary">location_on</span>
            <span className="font-label-sm text-label-sm text-on-surface-variant truncate group-hover:text-primary">Plot 1 • Wheat</span>
            <span className="material-symbols-outlined text-[14px] text-outline">arrow_drop_down</span>
          </button>
        </div>
      </div>
      <div className="flex items-center gap-space-xs flex-shrink-0">
        <div className="flex items-center gap-1 bg-surface-container-high px-space-xs py-0.5 rounded-full">
          <span className="w-2 h-2 rounded-full bg-primary-container inline-block"></span>
          <span className="font-label-sm text-label-sm text-on-surface-variant">Synced</span>
        </div>
        <button className="min-h-[44px] min-w-[44px] px-2 flex items-center justify-center gap-1 bg-surface-container rounded-full text-on-surface hover:bg-surface-container-high">
          <span className="font-label-sm text-label-sm font-bold">EN</span>
          <span className="material-symbols-outlined text-[16px] text-primary">volume_up</span>
        </button>
        <button className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-full text-on-surface hover:bg-surface-container">
          <span className="material-symbols-outlined text-[22px]">notifications</span>
        </button>
        <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
          <span className="material-symbols-outlined text-on-primary text-[18px]">person</span>
        </div>
      </div>
    </div>
  );

  return (
    <AppShell headerSlot={customHeader}>
      <div className="min-h-screen bg-surface text-on-surface flex flex-col relative">
        <main className="flex flex-col w-full pt-14 pb-20 bg-surface flex-1">
          <div className="flex flex-col w-full">
            {/* System Status Banner */}
            <div className="px-margin pt-space-sm pb-space-xs flex items-center justify-between">
              <div className="inline-flex items-center gap-1.5 bg-surface-container-high px-space-sm py-1 rounded-full">
                <span className="material-symbols-outlined text-[15px] text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>smart_toy</span>
                <span className="font-label-sm text-label-sm text-on-surface-variant">AI Vision Engine v2.4</span>
                <span className="w-1.5 h-1.5 rounded-full bg-primary-container"></span>
                <span className="font-label-sm text-label-sm text-primary">Offline Synced</span>
              </div>
              <div className="flex items-center gap-1 text-on-surface-variant">
                <span className="material-symbols-outlined text-[16px]">sensors</span>
                <span className="font-label-sm text-label-sm">DJI Agras T40</span>
              </div>
            </div>

            {/* Segmented Tab Switcher (Interactive) */}
            <div className="px-margin py-space-sm">
              <div className="grid grid-cols-2 p-1 bg-surface-container-high rounded-xl">
                <button 
                  className={`flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-lg transition-all duration-200 ${activeTab === 'plant' ? 'bg-surface text-primary shadow-sm' : 'text-on-surface-variant hover:text-on-surface'}`}
                  onClick={() => setActiveTab('plant')}
                >
                  <span className="material-symbols-outlined text-[18px]">nest_cam_stand</span>
                  <span className="font-label-md text-label-md">Plant Counting</span>
                  {activeTab === 'plant' && <span className="w-2 h-2 rounded-full bg-secondary-container"></span>}
                </button>
                <button 
                  className={`flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-lg transition-all duration-200 ${activeTab === 'climate' ? 'bg-surface text-primary shadow-sm' : 'text-on-surface-variant hover:text-on-surface'}`}
                  onClick={() => setActiveTab('climate')}
                >
                  <span className="material-symbols-outlined text-[18px]">thermostat</span>
                  <span className="font-label-md text-label-md">Climate Risk</span>
                  {activeTab === 'climate' && <span className="w-2 h-2 rounded-full bg-secondary-container"></span>}
                </button>
              </div>
            </div>

            {activeTab === 'plant' && (
              <div className="flex flex-col gap-space-md px-margin pb-space-xl">
                {/* Header Block with voice readout trigger */}
                <div className="flex items-center justify-between pt-1">
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="font-headline-sm text-headline-sm text-on-surface">AI Drone Sapling &amp; Stand Count</h2>
                    </div>
                    <span className="font-label-sm text-label-sm text-on-surface-variant">Plot 1 • Sharbati Gold Wheat</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-label-sm text-label-sm bg-primary-fixed text-on-primary-fixed px-2 py-1 rounded-full">Flight: 08:30 AM Today</span>
                    <button aria-label="Listen to advisory" className="w-9 h-9 rounded-full bg-tertiary-fixed flex items-center justify-center text-on-tertiary-fixed hover:bg-tertiary transition-colors shadow-sm">
                      <span className="material-symbols-outlined text-[18px]">volume_up</span>
                    </button>
                  </div>
                </div>

                {/* Hero Plant Count Result Card */}
                <div className="bg-surface-container-lowest rounded-xl p-space-md shadow-sm flex flex-col gap-space-sm">
                  <div className="flex items-start justify-between">
                    <div className="flex flex-col">
                      <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">Total Stand Census</span>
                      <div className="flex items-baseline gap-2 mt-0.5">
                        <span className="font-headline-lg-mobile text-headline-lg-mobile text-primary font-bold">1,42,800</span>
                        <span className="font-body-md text-body-md text-on-surface-variant">Plants</span>
                      </div>
                      <span className="font-label-md text-label-md text-secondary mt-0.5">31,730 plants / acre avg.</span>
                    </div>
                    <div className="flex flex-col items-end">
                      <div className="flex items-center gap-1 bg-primary-fixed px-2.5 py-1 rounded-full text-on-primary-fixed">
                        <span className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                        <span className="font-label-sm text-label-sm">94% Optimal</span>
                      </div>
                      <span className="font-label-sm text-label-sm text-on-surface-variant mt-1">High Emergence</span>
                    </div>
                  </div>
                  
                  {/* Target Benchmark Bar */}
                  <div className="bg-surface-container-low rounded-lg p-space-sm flex flex-col gap-1.5 mt-1">
                    <div className="flex justify-between items-center">
                      <span className="font-label-sm text-label-sm text-on-surface-variant">Benchmark Range</span>
                      <span className="font-label-sm text-label-sm text-primary font-semibold">30,000 – 33,000 / acre</span>
                    </div>
                    <div className="relative w-full h-3 bg-surface-container-highest rounded-full overflow-hidden">
                      <div className="absolute left-[20%] right-[15%] top-0 bottom-0 bg-primary-fixed-dim/60"></div>
                      <div className="h-full bg-primary-container rounded-full" style={{ width: '78%' }}></div>
                    </div>
                    <div className="flex justify-between text-on-surface-variant">
                      <span className="font-label-sm text-label-sm">Poor (&lt;24k)</span>
                      <span className="font-label-sm text-label-sm font-bold text-on-surface">Actual: 31.7k</span>
                      <span className="font-label-sm text-label-sm">Dense (&gt;35k)</span>
                    </div>
                  </div>
                </div>

            <div className="relative w-full rounded-xl overflow-hidden bg-surface-container-highest shadow-sm">
              <img className="w-full h-56 object-cover" data-alt="Top down aerial orthomosaic drone photography of lush geometric Indian wheat crop field rows in golden morning sunlight with subtle bright digital computer vision grid vectors, neon telemetry lines highlighting planting rows, and precision agricultural analysis overlay" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDjJ264l_91NDY2tHeQATbyPPgsXW3LVtSAHMsdCpVVErQlTEv-48_5eSmVW4YVLi71CzXN8ZEvViV9_zHDPU9NQJsfpLa5q3AO71DYySEN7jcJGOGKlIhDWRFx3ZvEkCgS_xxNbJ2wTzfD2grZ-C-VMsFy7iPS6GJGjxeL8JN-PhTjr7TWOFNoji2nqPmniL4j4gFMStWxp85taRkJu2VmwrmnRfy7EZMMDeJGPdfwh9ZInJhShCC5"/>
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
        </div>
      </main>

      <div className="sticky bottom-0 w-full z-40 bg-surface/95 backdrop-blur-md px-margin py-3 shadow-[0_-4px_12px_rgba(0,0,0,0.05)]">
        <button className="w-full min-h-[56px] bg-secondary-container hover:bg-secondary text-surface-container-lowest font-label-lg text-label-lg rounded-xl shadow-md flex items-center justify-center gap-2 px-4 transition-all active:scale-[0.99]">
          <span className="material-symbols-outlined text-[22px]">sync_saved_locally</span>
          <span>Sync Drone Telemetry &amp; Download Advisory</span>
          <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
        </button>
      </div>

      
    </div>
    </AppShell>
  );
}
