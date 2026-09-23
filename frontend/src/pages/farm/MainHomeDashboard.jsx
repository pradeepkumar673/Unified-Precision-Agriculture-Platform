import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getFarmProfile, getFarmZones } from '../../api/farmApi';
import { getCreditProfile } from '../../api/financeApi';

const NAV_ITEMS = [
  { path: 'home', icon: 'home', label: 'Home', to: '/' },
  { path: 'plan', icon: 'calendar_month', label: 'Plan', to: '/planning/crop-plan' },
  { path: 'marketplace', icon: 'storefront', label: 'Market', to: '/marketplace/inputs' },
  { path: 'alerts', icon: 'warning', label: 'Alerts', to: '/community/alerts', badge: true },
  { path: 'profile', icon: 'account_circle', label: 'Profile', to: '/farm/profile' },
];

export default function MainHomeDashboard() {
  const navigate = useNavigate();
  const farmId = localStorage.getItem('farmId');
  const [farm, setFarm] = useState(null);
  const [zones, setZones] = useState([]);
  const [activeNav, setActiveNav] = useState('home');
  const [showModules, setShowModules] = useState(false);
  const [creditProfile, setCreditProfile] = useState(null);

  const [alerts, setAlerts] = useState([]);
  const [cropPlan, setCropPlan] = useState(null);

  useEffect(() => {
    if (!farmId) return;
    getFarmProfile(farmId).then(r => setFarm(r.data)).catch(() => {});
    getFarmZones(farmId).then(r => setZones(r.data || [])).catch(() => {});
    getCreditProfile(farmId).then(r => setCreditProfile(r.data)).catch(() => {});
    
    // Fetch real alerts and crop plan
    import('../../api/communityApi').then(api => {
      api.getAlerts(farmId).then(data => setAlerts(data || [])).catch(() => {});
    });
    import('../../api/planningApi').then(api => {
      api.getCropPlan(farmId).then(r => setCropPlan(r.data?.[0] || null)).catch(() => {});
    });
  }, [farmId]);

  const creditScore = creditProfile ? creditProfile.credit_score : '...';
  const maxLimit = creditProfile?.offers?.[0]?.max_amount || 0;
  const strokeDasharray = 100;
  const strokeDashoffset = creditProfile ? 100 - (100 * (Math.max(0, creditProfile.credit_score - 300) / 600)) : 100;

  const farmerName = farm?.owner_name || 'Farmer';
  // Use the latest crop plan's crop, fall back to farm.current_crop
  const activeCrop = cropPlan?.recommended_crop || farm?.current_crop || 'Crop';
  const plotLabel = farm?.name || 'Plot 1';
  const acresLabel = farm?.land_size_acres ? `${farm.land_size_acres} Ac` : '4.5 Ac';

  // Real agronomic activity counts per crop type
  const CROP_ACTIVITIES = {
    sugarcane:  ['Soil preparation', 'Planting setts', 'Irrigation #1', 'Basal fertilizer', 'Earthing up', 'Weeding', 'Nitrogen top-dress', 'Irrigation #2', 'Irrigation #3', 'Pest scouting', 'De-trashing', 'Harvesting'],
    wheat:      ['Soil tillage', 'Seed treatment', 'Sowing', 'Irrigation (CRI)', 'Basal fertilizer', 'Weeding', 'Nitrogen top-dress', 'Irrigation (tillering)', 'Irrigation (boot)', 'Pest spray', 'Harvesting'],
    rice:       ['Nursery prep', 'Transplanting', 'Irrigation', 'Basal fertilizer', 'Weeding', 'Nitrogen split', 'Pest scouting', 'Irrigation #2', 'Harvesting'],
    maize:      ['Soil prep', 'Sowing', 'Basal fertilizer', 'Irrigation', 'Weeding', 'Nitrogen top-dress', 'Pest spray', 'Harvesting'],
    cotton:     ['Land prep', 'Seed sowing', 'Gap filling', 'Irrigation', 'Fertilizer basal', 'Boll weevil spray', 'Nitrogen split', 'Irrigation #2', 'Defoliation', 'Picking'],
    soybean:    ['Land prep', 'Seed treatment', 'Sowing', 'Basal fertilizer', 'Weeding', 'Irrigation', 'Pest scouting', 'Harvesting'],
    default:    ['Land preparation', 'Sowing', 'Irrigation', 'Fertilizer application', 'Weeding', 'Pest management', 'Harvesting'],
  };
  const cropKey = activeCrop.toLowerCase();
  const activityList = CROP_ACTIVITIES[cropKey] || CROP_ACTIVITIES.default;
  const activityCount = activityList.length;


  return (
    <div className="bg-background flex flex-col" style={{ minHeight: 'max(884px, 100dvh)' }}>
      {/* Fixed Top App Bar */}
      

      <main className="flex flex-col w-full pt-32 pb-28 px-margin bg-background flex-1 space-y-space-lg">
        {/* Weather + Plot Context Strip */}
        <div className="flex items-center justify-between bg-surface-container-low px-space-md py-space-sm rounded-xl mt-4">
          <div className="flex items-center gap-space-xs min-w-0">
            <span className="material-symbols-outlined text-primary text-[20px] flex-shrink-0" style={{ fontVariationSettings: "'FILL' 1" }}>wb_sunny</span>
            <span className="font-label-md text-label-md text-on-surface truncate capitalize">
              {plotLabel} · {acresLabel} · {farm?.soil_type?.replace('_', ' ') || 'Soil Type'}
            </span>
          </div>
          <span className="font-label-sm text-label-sm bg-surface-container-highest text-on-surface-variant px-space-xs py-0.5 rounded-md flex-shrink-0">
            {new Date().getMonth() > 4 && new Date().getMonth() < 10 ? 'Kharif' : 'Rabi'} {new Date().getFullYear()}-{((new Date().getFullYear() + 1) % 100).toString().padStart(2, '0')}
          </span>
        </div>

        {/* Crop Stage Hero Card */}
        <section className="w-full rounded-xl bg-surface-container-lowest p-space-md shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="font-headline-sm text-headline-sm text-on-surface">Crop Stage</h2>
              <p className="font-body-sm text-body-sm text-on-surface-variant">Active season advisory</p>
            </div>
            <span className="px-2.5 py-1 rounded-full bg-primary-fixed text-primary font-label-sm text-label-sm font-bold capitalize">
              {farm?.crop_stage || 'Unknown'}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-full bg-primary-fixed/30 flex items-center justify-center flex-shrink-0">
              <span className="material-symbols-outlined text-[28px] text-primary">eco</span>
            </div>
            <div className="flex-1 min-w-0">
              {cropPlan ? (
                <p className="font-body-sm text-body-sm text-on-surface">
                  <strong className="text-primary capitalize">{activeCrop}</strong> is active. 
                  Your current plan has <strong>{activityCount}</strong> activities scheduled.
                </p>
              ) : (
                <p className="font-body-sm text-body-sm text-on-surface">
                  No active crop plan found. Tap below to generate one.
                </p>
              )}
            </div>
          </div>
          <button 
            className="w-full mt-3 py-2.5 rounded-lg bg-surface-container text-primary font-label-md text-label-md font-bold flex items-center justify-center gap-1 min-h-[48px]" 
            type="button"
            onClick={() => navigate('/planning/season-timeline')}
          >
            <span>View full crop calendar</span>
            <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
          </button>
        </section>

        {/* KCC Credit Score */}
        <section className="w-full rounded-xl bg-surface-container-lowest p-space-md shadow-sm flex flex-col space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <h3 className="font-headline-sm text-headline-sm text-on-surface">Farm Health &amp; Credit Score</h3>
              <button aria-label="Score info" className="min-h-[44px] min-w-[44px] flex items-center justify-center text-outline" type="button">
                <span className="material-symbols-outlined text-[18px]">info</span>
              </button>
            </div>
            <span className="px-2.5 py-1 rounded-full bg-primary-fixed text-primary font-label-sm text-label-sm font-bold">
              {creditScore >= 700 ? 'Green Tier' : 'Evaluating'}
            </span>
          </div>
          <div className="flex items-center gap-4 py-1">
            <div className="relative w-20 h-20 flex items-center justify-center flex-shrink-0">
              <svg className="w-20 h-20 transform -rotate-90" viewBox="0 0 36 36">
                <path className="text-surface-container-highest" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="3.5" />
                <path className="text-primary" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeDasharray={`${strokeDasharray}, 100`} strokeDashoffset={strokeDashoffset} strokeLinecap="round" strokeWidth="3.5" />
              </svg>
              <div className="absolute flex flex-col items-center justify-center text-center">
                <span className="font-headline-sm text-headline-sm text-on-surface leading-none font-bold">{creditScore}</span>
                <span className="font-label-sm text-[10px] text-outline">/ 900</span>
              </div>
            </div>
            <div className="flex flex-col min-w-0 justify-center">
              <p className="font-body-sm text-body-sm text-on-surface">
                {creditScore >= 700 ? 'Excellent management qualifies you for low-interest credit up to ' : 'Improve health metrics to unlock better rates up to '}
                <strong className="text-primary font-bold">₹{maxLimit.toLocaleString()}</strong>.
              </p>
            </div>
          </div>
          <button 
            className="flex items-center justify-between w-full pt-2 font-label-md text-label-md text-primary font-bold min-h-[48px]" 
            type="button"
            onClick={() => navigate('/finance/credit-insurance')}
          >
            <span>View detailed breakdown &amp; benefits</span>
            <span className="material-symbols-outlined text-[20px]">chevron_right</span>
          </button>
        </section>

        {/* Recent Alerts Feed */}
        <section className="w-full flex flex-col space-y-2.5">
          <div className="flex items-center justify-between">
            <h3 className="font-headline-sm text-headline-sm text-on-surface">Recent Alerts &amp; Tasks</h3>
            <button 
              className="font-label-md text-label-md text-primary font-bold min-h-[48px] flex items-center" 
              type="button"
              onClick={() => navigate('/community/alerts')}
            >
              <span>View all ({alerts.length})</span>
              <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
            </button>
          </div>
          
          {alerts.length === 0 ? (
            <div className="w-full rounded-xl bg-surface-container-lowest p-3.5 shadow-sm text-center text-on-surface-variant font-body-sm">
              No recent alerts for your farm.
            </div>
          ) : (
            alerts.slice(0, 3).map((alert) => {
              let style = { icon: 'notifications', bg: 'bg-surface-container', fg: 'text-on-surface-variant', title: 'Notification', path: '/community/alerts' };
              if (alert.type === 'irrigation') style = { icon: 'water', bg: 'bg-tertiary-fixed', fg: 'text-tertiary', title: 'Irrigation Required', path: '/water-soil/irrigation' };
              if (alert.type === 'pest') style = { icon: 'pest_control', bg: 'bg-error-container', fg: 'text-error', title: 'Pest Risk Alert', path: '/health/pest-risk' };
              if (alert.type === 'spray_window') style = { icon: 'air', bg: 'bg-primary-fixed', fg: 'text-primary', title: 'Spray Window Active', path: '/vision/drone-climate' };
              
              const dateStr = new Date(alert.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
              
              return (
                <div 
                  key={alert.id} 
                  className="w-full rounded-xl bg-surface-container-lowest p-3.5 shadow-sm flex items-start gap-3 cursor-pointer hover:bg-surface-container-low transition-colors active:scale-[0.98]"
                  onClick={() => navigate(style.path)}
                >
                  <div className={`w-10 h-10 rounded-full ${style.bg} ${style.fg} flex items-center justify-center flex-shrink-0 mt-0.5`}>
                    <span className="material-symbols-outlined text-[22px]">{style.icon}</span>
                  </div>
                  <div className="flex flex-col min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-1">
                      <h4 className="font-label-lg text-label-lg text-on-surface font-bold truncate">{style.title}</h4>
                      <span className="font-label-sm text-label-sm text-outline flex-shrink-0">{dateStr}</span>
                    </div>
                    <p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5 line-clamp-2">
                      {alert.message}
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </section>

        {/* Voice Bot Banner */}
        <section className="w-full pt-1">
          <div className="w-full rounded-xl bg-primary-container p-3.5 flex items-center justify-between shadow-md">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-on-primary-container text-primary flex items-center justify-center flex-shrink-0">
                <span className="material-symbols-outlined text-[22px]">mic</span>
              </div>
              <div className="flex flex-col">
                <span className="font-label-md text-label-md text-on-primary font-bold">KhetSaathi Bol (Voice Assist)</span>
                <span className="font-body-sm text-body-sm text-on-primary-container">Ask crop questions in Hindi or Marathi</span>
              </div>
            </div>
            <button 
              className="min-h-[48px] px-3 rounded-lg bg-secondary-container text-on-secondary font-label-md text-label-md font-bold flex items-center gap-1 active:scale-95 transition-transform flex-shrink-0" 
              type="button"
              onClick={() => navigate('/ai/assistant')}
            >
              <span>Speak</span>
              <span className="material-symbols-outlined text-[18px]">graphic_eq</span>
            </button>
          </div>
        </section>
      </main>

      {/* Bottom Nav */}
      
    </div>
  );
}
