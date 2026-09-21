import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function ProduceTraceabilityEnergy() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('trace');
  const [toastMessage, setToastMessage] = useState(null);
  const [actuators, setActuators] = useState({
    led: 'Auto-Eco',
    pump: 'Running',
    chiller: 'Scheduled',
    misting: 'Active Pulse'
  });

  const showToast = (message) => {
    setToastMessage(message);
    setTimeout(() => {
      setToastMessage(null);
    }, 2800);
  };

  const toggleActuator = (key) => {
    setActuators(prev => {
      const current = prev[key];
      const isAuto = current.includes('Auto-Eco') || current.includes('Scheduled') || current.includes('Off');
      const newState = isAuto ? 'Active (Manual)' : 'Auto-Eco';
      
      if (isAuto) {
        showToast('Actuator override engaged');
      } else {
        showToast('Returned to tariff-optimized schedule');
      }
      
      return { ...prev, [key]: newState };
    });
  };

  return (
    <div className="min-h-screen bg-surface-container-lowest text-on-surface flex flex-col relative">
      

      <div className="fixed top-[56px] w-full z-40 bg-surface-container-lowest px-margin py-2 border-b border-surface-container shadow-sm">
        <div className="flex p-1 bg-surface-container rounded-xl gap-1">
          <button 
            onClick={() => setActiveTab('trace')}
            className={`flex-1 py-2.5 px-space-xs rounded-lg font-label-md text-label-md flex items-center justify-center gap-1.5 transition-all duration-200 ${activeTab === 'trace' ? 'bg-surface-container-lowest text-primary shadow-sm' : 'text-on-surface-variant relative'}`}
          >
            <span className="material-symbols-outlined text-[18px]">qr_code_scanner</span>
            <span>Traceability</span>
          </button>
          <button 
            onClick={() => setActiveTab('energy')}
            className={`flex-1 py-2.5 px-space-xs rounded-lg font-label-md text-label-md flex items-center justify-center gap-1.5 transition-all duration-200 ${activeTab === 'energy' ? 'bg-surface-container-lowest text-primary shadow-sm relative' : 'text-on-surface-variant'}`}
          >
            <span className="material-symbols-outlined text-[18px]">bolt</span>
            <span>Grid &amp; Actuators</span>
            {activeTab !== 'energy' && <span className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full bg-error"></span>}
          </button>
        </div>
      </div>

      <main className="flex flex-col w-full pt-[132px] pb-24 px-margin bg-surface-container flex-1 gap-space-md">
        
        {activeTab === 'trace' && (
          <div className="flex flex-col gap-space-md animate-fade-in" id="panel-traceability">
            
            <div className="relative overflow-hidden rounded-xl bg-surface-container-lowest p-space-md shadow-sm">
              <div className="flex items-start justify-between gap-space-xs mb-space-sm">
                <div className="flex flex-col">
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="px-2 py-0.5 rounded-full bg-primary-fixed text-on-primary-fixed font-label-sm text-label-sm tracking-wider uppercase">Verified Batch</span>
                    <span className="px-2 py-0.5 rounded-full bg-surface-container text-tertiary font-label-sm text-label-sm">NFT Tier 2</span>
                  </div>
                  <h2 className="font-headline-md text-headline-md text-on-surface tracking-tight">Hydroponic Sweet Cherry Tomatoes</h2>
                  <p className="font-label-md text-label-md text-tertiary mt-0.5">BATCH #CEA-TMT-2025-08</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <span className="material-symbols-outlined text-primary text-[28px]" style={{ fontVariationSettings: "'FILL' 1" }}>eco</span>
                </div>
              </div>
              
              <div className="relative rounded-lg overflow-hidden h-36 w-full mb-space-sm">
                <img className="w-full h-full object-cover" src="https://images.unsplash.com/photo-1518977676601-b53f82aba655?q=80&w=1000&auto=format&fit=crop" alt="Cherry tomatoes" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent flex items-end p-space-sm">
                  <div className="flex items-center justify-between w-full text-white">
                    <div className="flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[16px] text-primary-fixed">verified</span>
                      <span className="font-label-sm text-label-sm font-medium">100% Certified Residue-Free</span>
                    </div>
                    <span className="font-label-sm text-label-sm bg-black/40 px-2 py-0.5 rounded backdrop-blur-sm">Grade AAA</span>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-space-xs pt-1">
                <div className="p-2.5 rounded-lg bg-surface-container-low flex flex-col">
                  <span className="font-label-sm text-label-sm text-on-surface-variant flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px]">event</span>
                    Harvest Window
                  </span>
                  <span className="font-body-sm text-body-sm text-on-surface font-semibold mt-1">22–24 Mar 2025</span>
                  <span className="font-label-sm text-label-sm text-primary">Yield: 1,200 kg</span>
                </div>
                <div className="p-2.5 rounded-lg bg-surface-container-low flex flex-col">
                  <span className="font-label-sm text-label-sm text-on-surface-variant flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px]">location_on</span>
                    Facility
                  </span>
                  <span className="font-body-sm text-body-sm text-on-surface font-semibold mt-1 truncate">Polyhouse 2, Nashik</span>
                  <span className="font-label-sm text-label-sm text-outline truncate">Zone C • Bay 4</span>
                </div>
              </div>
            </div>

            <div className="rounded-xl bg-surface-container-lowest p-space-md shadow-sm flex flex-col items-center text-center">
              <div className="flex items-center gap-2 mb-space-sm">
                <span className="material-symbols-outlined text-primary text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>shield</span>
                <span className="font-label-md text-label-md text-on-surface font-bold tracking-tight">Blockchain &amp; Sensor Logged Digital Passport</span>
              </div>
              
              <div className="p-4 rounded-2xl bg-surface-container-low shadow-inner mb-space-sm flex flex-col items-center relative group">
                <div className="w-48 h-48 bg-white p-2.5 rounded-xl shadow-sm flex flex-col items-center justify-center relative">
                  <svg className="w-full h-full text-on-surface" fill="currentColor" viewBox="0 0 100 100">
                    <rect fill="#1b5e20" height="28" rx="4" width="28" x="5" y="5"></rect>
                    <rect fill="white" height="20" rx="2" width="20" x="9" y="9"></rect>
                    <rect fill="#1b5e20" height="12" rx="1" width="12" x="13" y="13"></rect>
                    <rect fill="#1b5e20" height="28" rx="4" width="28" x="67" y="5"></rect>
                    <rect fill="white" height="20" rx="2" width="20" x="71" y="9"></rect>
                    <rect fill="#1b5e20" height="12" rx="1" width="12" x="75" y="13"></rect>
                    <rect fill="#1b5e20" height="28" rx="4" width="28" x="5" y="67"></rect>
                    <rect fill="white" height="20" rx="2" width="20" x="9" y="71"></rect>
                    <rect fill="#1b5e20" height="12" rx="1" width="12" x="13" y="75"></rect>
                    <rect height="6" rx="1" width="6" x="37" y="7"></rect>
                    <rect height="6" rx="1" width="6" x="47" y="7"></rect>
                    <rect height="6" rx="1" width="6" x="57" y="13"></rect>
                    <rect height="6" rx="1" width="6" x="37" y="17"></rect>
                    <rect height="6" rx="1" width="6" x="47" y="23"></rect>
                    <rect height="6" rx="1" width="6" x="57" y="27"></rect>
                    <rect height="6" rx="1" width="6" x="9" y="39"></rect>
                    <rect height="6" rx="1" width="6" x="19" y="47"></rect>
                    <rect height="6" rx="1" width="6" x="27" y="39"></rect>
                    <circle cx="50" cy="50" fill="#fcf9f8" r="11"></circle>
                    <path d="M50 42 C 45 42, 43 47, 50 51 C 57 47, 55 42, 50 42 Z" fill="#2a6b2c"></path>
                    <path d="M50 51 L 50 58" stroke="#2a6b2c" strokeLinecap="round" strokeWidth="2"></path>
                    <rect height="6" rx="1" width="6" x="37" y="67"></rect>
                    <rect height="6" rx="1" width="6" x="47" y="77"></rect>
                    <rect height="6" rx="1" width="6" x="57" y="67"></rect>
                    <rect height="6" rx="1" width="6" x="67" y="77"></rect>
                    <rect height="6" rx="1" width="6" x="77" y="67"></rect>
                    <rect height="6" rx="1" width="6" x="87" y="77"></rect>
                    <rect height="6" rx="1" width="6" x="77" y="87"></rect>
                    <rect height="6" rx="1" width="6" x="67" y="45"></rect>
                    <rect height="6" rx="1" width="6" x="77" y="37"></rect>
                    <rect height="6" rx="1" width="6" x="87" y="47"></rect>
                  </svg>
                </div>
                <div className="mt-2.5 flex items-center gap-1.5 text-tertiary font-label-sm text-label-sm">
                  <span className="w-2 h-2 rounded-full bg-primary-fixed-dim"></span>
                  <span>Hash: 0x8a92...f04c • Synced Immutable</span>
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row w-full gap-space-xs">
                <button 
                  onClick={() => showToast('Passport link copied to clipboard!')}
                  className="w-full h-14 rounded-lg bg-secondary-container text-on-primary font-headline-sm text-headline-sm flex items-center justify-center gap-2 shadow-sm active:scale-[0.99] transition-transform" type="button"
                >
                  <span className="material-symbols-outlined text-[20px]">share</span>
                  <span>Share Passport Link</span>
                </button>
                <button 
                  onClick={() => showToast('Generating printable 300 DPI batch label PDF...')}
                  className="w-full h-12 rounded-lg bg-surface-container-high text-primary font-label-lg text-label-lg flex items-center justify-center gap-2 shadow-sm active:scale-[0.99] transition-transform" type="button"
                >
                  <span className="material-symbols-outlined text-[20px]">print</span>
                  <span>Download QR Label (300 DPI)</span>
                </button>
              </div>
            </div>

            <div className="rounded-xl bg-surface-container-lowest p-space-md shadow-sm">
              <div className="flex items-center justify-between mb-space-md">
                <div>
                  <h3 className="font-headline-sm text-headline-sm text-on-surface">Crop Lifecycle Provenance</h3>
                  <p className="font-label-sm text-label-sm text-on-surface-variant">Continuous IoT audit trail for B2B buyer compliance</p>
                </div>
                <span className="px-2 py-1 rounded bg-tertiary-fixed text-on-tertiary-fixed font-label-sm text-label-sm font-bold">5 Stages</span>
              </div>
              <div className="relative flex flex-col gap-6 pl-2">
                <div className="absolute left-6 top-3 bottom-6 w-0.5 bg-surface-container-highest"></div>
                
                <div className="relative flex items-start gap-3.5">
                  <div className="w-8 h-8 rounded-full bg-primary text-on-primary flex items-center justify-center flex-shrink-0 z-10 shadow-sm">
                    <span className="material-symbols-outlined text-[16px]">check</span>
                  </div>
                  <div className="flex-1 p-space-sm rounded-lg bg-surface-container-low">
                    <div className="flex items-center justify-between gap-1 flex-wrap mb-1">
                      <span className="font-label-md text-label-md text-on-surface font-semibold">1. Seed Germination &amp; Rooting</span>
                      <span className="font-label-sm text-label-sm text-on-surface-variant">02 Feb • 09:30 AM</span>
                    </div>
                    <p className="font-body-sm text-body-sm text-on-surface-variant">
                      Rockwool cube seated, RO water EC 0.6 mS/cm. 100% germination rate confirmed by Vision Cam 4B.
                    </p>
                    <div className="mt-2 flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded bg-surface-container text-tertiary font-label-sm text-label-sm">Telemetry #0182</span>
                      <span className="px-2 py-0.5 rounded bg-surface-container text-primary font-label-sm text-label-sm">EC 0.6 mS/cm</span>
                    </div>
                  </div>
                </div>
                
                <div className="relative flex items-start gap-3.5">
                  <div className="w-8 h-8 rounded-full bg-primary text-on-primary flex items-center justify-center flex-shrink-0 z-10 shadow-sm">
                    <span className="material-symbols-outlined text-[16px]">check</span>
                  </div>
                  <div className="flex-1 p-space-sm rounded-lg bg-surface-container-low">
                    <div className="flex items-center justify-between gap-1 flex-wrap mb-1">
                      <span className="font-label-md text-label-md text-on-surface font-semibold">2. Transplanted to NFT Gullies</span>
                      <span className="font-label-sm text-label-sm text-on-surface-variant">12 Feb • 11:15 AM</span>
                    </div>
                    <p className="font-body-sm text-body-sm text-on-surface-variant">
                      EC stepped to 1.8 mS/cm, automated pH lock 6.0, root zone temperature maintained at 20.5°C throughout vegetative surge.
                    </p>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      <span className="px-2 py-0.5 rounded bg-surface-container text-primary font-label-sm text-label-sm">pH 6.0 Constant</span>
                      <span className="px-2 py-0.5 rounded bg-surface-container text-tertiary font-label-sm text-label-sm">Root: 20.5°C</span>
                    </div>
                  </div>
                </div>
                
                <div className="relative flex items-start gap-3.5">
                  <div className="w-8 h-8 rounded-full bg-primary text-on-primary flex items-center justify-center flex-shrink-0 z-10 shadow-sm">
                    <span className="material-symbols-outlined text-[16px]">check</span>
                  </div>
                  <div className="flex-1 p-space-sm rounded-lg bg-surface-container-low">
                    <div className="flex items-center justify-between gap-1 flex-wrap mb-1">
                      <span className="font-label-md text-label-md text-on-surface font-semibold">3. Flowering &amp; Fruit Set</span>
                      <span className="font-label-sm text-label-sm text-on-surface-variant">28 Feb • 03:40 PM</span>
                    </div>
                    <p className="font-body-sm text-body-sm text-on-surface-variant">
                      Automated Potassium booster dosing, Bumblebee hive bio-pollination active, enriched atmosphere at 850 ppm CO2.
                    </p>
                    <div className="mt-2 flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded bg-primary-fixed text-on-primary-fixed font-label-sm text-label-sm">CO2 850 ppm</span>
                      <span className="px-2 py-0.5 rounded bg-surface-container text-tertiary font-label-sm text-label-sm">Bio-Pollinated</span>
                    </div>
                  </div>
                </div>
                
                <div className="relative flex items-start gap-3.5">
                  <div className="w-8 h-8 rounded-full bg-secondary text-on-secondary flex items-center justify-center flex-shrink-0 z-10 shadow-md">
                    <span className="material-symbols-outlined text-[16px] animate-spin">sync</span>
                  </div>
                  <div className="flex-1 p-space-sm rounded-lg bg-secondary-fixed/20 shadow-sm">
                    <div className="flex items-center justify-between gap-1 flex-wrap mb-1">
                      <div className="flex items-center gap-1.5">
                        <span className="font-label-md text-label-md text-on-surface font-bold">4. Ripening &amp; Sugar Accumulation</span>
                        <span className="px-1.5 py-0.2 rounded bg-secondary text-on-secondary font-label-sm text-label-sm">Active</span>
                      </div>
                      <span className="font-label-sm text-label-sm text-secondary font-semibold">14 Mar • Live</span>
                    </div>
                    <p className="font-body-sm text-body-sm text-on-surface font-medium">
                      Brix sugar reading: <span className="text-secondary font-bold">9.2° Brix</span> (Grade AAA Premium Sweetness). Zero synthetic chemical pesticides applied.
                    </p>
                    <div className="mt-2.5 p-2 rounded bg-surface-container-lowest flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-secondary text-[16px]">bar_chart</span>
                        <span className="font-label-sm text-label-sm text-on-surface font-medium">Refractometer Check</span>
                      </div>
                      <span className="font-label-md text-label-md text-secondary font-bold">9.2° / 8.5° target</span>
                    </div>
                  </div>
                </div>
                
                <div className="relative flex items-start gap-3.5">
                  <div className="w-8 h-8 rounded-full bg-surface-container-highest text-outline flex items-center justify-center flex-shrink-0 z-10">
                    <span className="material-symbols-outlined text-[16px]">hourglass_top</span>
                  </div>
                  <div className="flex-1 p-space-sm rounded-lg bg-surface-container-low opacity-90">
                    <div className="flex items-center justify-between gap-1 flex-wrap mb-1">
                      <span className="font-label-md text-label-md text-on-surface-variant font-medium">5. Scheduled Harvest &amp; Cold Chain Dispatch</span>
                      <span className="font-label-sm text-label-sm text-outline">22 Mar • Pending</span>
                    </div>
                    <p className="font-body-sm text-body-sm text-on-surface-variant">
                      Pre-cooling cold bay reserved at 10°C. Temperature-monitored refrigerated transport line confirmed to Nature's Basket retail distribution.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'energy' && (
          <div className="flex flex-col gap-space-md animate-fade-in" id="panel-energy">
            
            <div className="rounded-xl bg-surface-container-lowest p-space-md shadow-sm border border-error/20 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-error/5 rounded-full -translate-y-1/2 translate-x-1/3"></div>
              <div className="flex items-start gap-3">
                <span className="material-symbols-outlined text-error text-[28px] mt-1">warning</span>
                <div className="flex flex-col">
                  <h3 className="font-headline-sm text-headline-sm text-error font-bold">Peak Tariff Alert</h3>
                  <p className="font-body-sm text-body-sm text-on-surface mt-1">
                    Grid electricity tariff has surged to ₹8.50/kWh (Time-of-Use Peak). KhetSaathi automated load shedding has paused non-critical HVAC chillers to save 12% on today's OPEX.
                  </p>
                  <button className="w-full mt-3 h-10 rounded bg-error/10 text-error font-label-md text-label-md font-bold flex items-center justify-center transition-colors hover:bg-error/20" type="button">
                    View Tariff Curve
                  </button>
                </div>
              </div>
            </div>

            <div className="rounded-xl bg-surface-container-lowest p-space-md shadow-sm">
              <div className="flex flex-col mb-space-sm">
                <h3 className="font-headline-sm text-headline-sm text-on-surface">Actuator Overrides</h3>
                <p className="font-label-sm text-label-sm text-on-surface-variant">Tap status to manually override schedules</p>
              </div>
              <div className="space-y-space-xs">
                
                <div className="p-space-sm rounded-lg bg-surface-container-low flex items-center justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary text-on-primary flex items-center justify-center">
                      <span className="material-symbols-outlined text-[20px]">lightbulb</span>
                    </div>
                    <div>
                      <p className="font-label-md text-label-md text-on-surface font-bold">Grow Lights LED Array</p>
                      <p className="font-label-sm text-label-sm text-on-surface-variant">Set: 70% dimming • 14.8 DLI cumulative</p>
                    </div>
                  </div>
                  <button 
                    className={`px-3 py-1.5 rounded-full font-label-sm text-label-sm font-semibold transition-colors ${actuators.led.includes('Auto-Eco') || actuators.led.includes('Scheduled') ? 'bg-surface-container text-on-surface-variant' : 'bg-primary-fixed text-on-primary-fixed'}`}
                    onClick={() => toggleActuator('led')} 
                    type="button"
                  >
                    {actuators.led}
                  </button>
                </div>
                
                <div className="p-space-sm rounded-lg bg-surface-container-low flex items-center justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-tertiary text-on-tertiary flex items-center justify-center">
                      <span className="material-symbols-outlined text-[20px]">water_pump</span>
                    </div>
                    <div>
                      <p className="font-label-md text-label-md text-on-surface font-bold">NFT Delivery Pump 01</p>
                      <p className="font-label-sm text-label-sm text-on-surface-variant">Continuous duty cycle • 185 Watts</p>
                    </div>
                  </div>
                  <span className="px-3 py-1.5 rounded-full bg-surface-container-high text-tertiary font-label-sm text-label-sm font-semibold">Running</span>
                </div>
                
                <div className="p-space-sm rounded-lg bg-surface-container-low flex items-center justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-surface-container text-outline flex items-center justify-center">
                      <span className="material-symbols-outlined text-[20px]">ac_unit</span>
                    </div>
                    <div>
                      <p className="font-label-md text-label-md text-on-surface font-bold">Chiller Compressor</p>
                      <p className="font-label-sm text-label-sm text-secondary font-medium">Peak tariff paused • Next run 02:00 AM</p>
                    </div>
                  </div>
                  <button 
                    className={`px-3 py-1.5 rounded-full font-label-sm text-label-sm font-medium transition-colors ${actuators.chiller.includes('Auto-Eco') || actuators.chiller.includes('Scheduled') ? 'bg-surface-container text-on-surface-variant' : 'bg-primary-fixed text-on-primary-fixed'}`}
                    onClick={() => toggleActuator('chiller')} 
                    type="button"
                  >
                    {actuators.chiller}
                  </button>
                </div>
                
                <div className="p-space-sm rounded-lg bg-surface-container-low flex items-center justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary-container text-on-primary-container flex items-center justify-center">
                      <span className="material-symbols-outlined text-[20px]">dew_point</span>
                    </div>
                    <div>
                      <p className="font-label-md text-label-md text-on-surface font-bold">Foggers &amp; Misting Lines</p>
                      <p className="font-label-sm text-label-sm text-on-surface-variant">VPD Trigger: Pulse 15s every 8 min</p>
                    </div>
                  </div>
                  <span className="px-3 py-1.5 rounded-full bg-primary-fixed text-on-primary-fixed font-label-sm text-label-sm font-semibold">Active Pulse</span>
                </div>
              </div>
            </div>

            <div className="rounded-xl bg-surface-container-lowest p-space-md shadow-sm">
              <div className="flex items-center justify-between mb-space-sm">
                <h3 className="font-headline-sm text-headline-sm text-on-surface">Microgrid &amp; Solar Battery</h3>
                <span className="font-label-sm text-label-sm text-primary font-bold">Grid Feed Stable</span>
              </div>
              <div className="grid grid-cols-2 gap-space-sm">
                <div className="p-space-sm rounded-lg bg-surface-container-low flex flex-col">
                  <span className="font-label-sm text-label-sm text-on-surface-variant">Rooftop Solar Array</span>
                  <span className="font-headline-sm text-headline-sm text-primary font-bold mt-1">4.6 kW</span>
                  <span className="font-label-sm text-label-sm text-on-surface-variant mt-0.5">82% of current demand</span>
                </div>
                <div className="p-space-sm rounded-lg bg-surface-container-low flex flex-col">
                  <span className="font-label-sm text-label-sm text-on-surface-variant">LiFePO4 Storage</span>
                  <span className="font-headline-sm text-headline-sm text-tertiary font-bold mt-1">94%</span>
                  <span className="font-label-sm text-label-sm text-primary mt-0.5">Ready for 18:00 Peak</span>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {toastMessage && (
          <div className="fixed bottom-24 left-1/2 -translate-x-1/2 px-4 py-2.5 rounded-full bg-inverse-surface text-inverse-on-surface font-label-md text-label-md shadow-xl transition-all duration-300 z-40 flex items-center gap-2 animate-fade-in">
            <span className="material-symbols-outlined text-[18px] text-primary-fixed">check_circle</span>
            <span>{toastMessage}</span>
          </div>
        )}
      </main>

      
    </div>
  );
}
