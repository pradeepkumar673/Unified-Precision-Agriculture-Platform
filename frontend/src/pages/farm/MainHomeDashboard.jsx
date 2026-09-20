import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getFarmProfile, getFarmZones } from '../../api/farmApi';

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

  useEffect(() => {
    if (!farmId) return;
    getFarmProfile(farmId).then(r => setFarm(r.data)).catch(() => {});
    getFarmZones(farmId).then(r => setZones(r.data || [])).catch(() => {});
  }, [farmId]);

  const farmerName = farm?.owner_name || 'Ramesh Patil';
  const cropLabel = farm?.current_crop || 'Wheat (Sharbati Gold)';
  const plotLabel = farm?.name || 'Plot 1';
  const acresLabel = farm?.land_size_acres ? `${farm.land_size_acres} Ac` : '4.5 Ac';

  return (
    <div className="min-h-screen bg-background flex flex-col pt-safe">
      {/* Fixed Top App Bar */}
      <header className="fixed top-0 inset-x-0 z-50 pt-safe bg-surface/90 backdrop-blur-xl shadow-[0_1px_8px_rgba(0,0,0,0.04)]">
        <div className="h-20 px-margin flex items-center justify-between gap-space-sm">
          <div className="flex items-center gap-space-sm min-w-0 flex-1">
            <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-on-primary flex-shrink-0">
              <span className="material-symbols-outlined text-[22px]">person</span>
            </div>
            <div className="min-w-0">
              <p className="font-label-sm text-label-sm text-on-surface-variant truncate">नमस्ते, {farmerName}</p>
              <p className="font-label-lg text-label-lg text-on-surface font-bold truncate">{plotLabel} · {cropLabel}</p>
            </div>
          </div>
          <div className="flex items-center gap-space-xs flex-shrink-0">
            <button className="w-11 h-11 rounded-full bg-surface-container flex items-center justify-center text-on-surface relative" type="button">
              <span className="material-symbols-outlined text-[22px]">notifications</span>
              <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-secondary-container"></span>
            </button>
            <button onClick={() => navigate('/farm/profile')} className="w-11 h-11 rounded-full bg-primary-fixed flex items-center justify-center text-primary font-bold font-label-lg text-label-lg" type="button">
              {farmerName.charAt(0)}
            </button>
          </div>
        </div>
      </header>

      <main className="flex flex-col w-full pt-20 pb-28 px-margin bg-background flex-1 space-y-space-lg">
        {/* Weather + Plot Context Strip */}
        <div className="flex items-center justify-between bg-surface-container-low px-space-md py-space-sm rounded-xl mt-4">
          <div className="flex items-center gap-space-xs min-w-0">
            <span className="material-symbols-outlined text-primary text-[20px] flex-shrink-0" style={{ fontVariationSettings: "'FILL' 1" }}>wb_sunny</span>
            <span className="font-label-md text-label-md text-on-surface truncate">{plotLabel} · {acresLabel} · Clay Loam</span>
          </div>
          <span className="font-label-sm text-label-sm bg-surface-container-highest text-on-surface-variant px-space-xs py-0.5 rounded-md flex-shrink-0">
            Rabi 2024-25
          </span>
        </div>

        {/* Crop Stage Hero Card */}
        <section className="w-full rounded-xl bg-surface-container-lowest p-space-md shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="font-headline-sm text-headline-sm text-on-surface">Crop Stage</h2>
              <p className="font-body-sm text-body-sm text-on-surface-variant">Active season advisory</p>
            </div>
            <span className="px-2.5 py-1 rounded-full bg-primary-fixed text-primary font-label-sm text-label-sm font-bold">Tillering</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-full bg-primary-fixed/30 flex items-center justify-center flex-shrink-0">
              <span className="material-symbols-outlined text-[28px] text-primary">eco</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-body-sm text-body-sm text-on-surface">Wheat in <strong className="text-primary">Day 42</strong> — Tillering active. Apply 2nd split of Urea (65 kg/Ac) within 5 days.</p>
            </div>
          </div>
          <button className="w-full mt-3 py-2.5 rounded-lg bg-surface-container text-primary font-label-md text-label-md font-bold flex items-center justify-center gap-1 min-h-[48px]" type="button">
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
            <span className="px-2.5 py-1 rounded-full bg-primary-fixed text-primary font-label-sm text-label-sm font-bold">Green Tier</span>
          </div>
          <div className="flex items-center gap-4 py-1">
            <div className="relative w-20 h-20 flex items-center justify-center flex-shrink-0">
              <svg className="w-20 h-20 transform -rotate-90" viewBox="0 0 36 36">
                <path className="text-surface-container-highest" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="3.5" />
                <path className="text-primary" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeDasharray="85, 100" strokeLinecap="round" strokeWidth="3.5" />
              </svg>
              <div className="absolute flex flex-col items-center justify-center text-center">
                <span className="font-headline-sm text-headline-sm text-on-surface leading-none font-bold">765</span>
                <span className="font-label-sm text-[10px] text-outline">/ 900</span>
              </div>
            </div>
            <div className="flex flex-col min-w-0 justify-center">
              <p className="font-body-sm text-body-sm text-on-surface">
                Timely irrigation and verified bio-fertilizers qualify you for low-interest KCC credit up to <strong className="text-primary font-bold">₹11,50,000</strong>.
              </p>
            </div>
          </div>
          <button className="flex items-center justify-between w-full pt-2 font-label-md text-label-md text-primary font-bold min-h-[48px]" type="button">
            <span>View detailed breakdown &amp; benefits</span>
            <span className="material-symbols-outlined text-[20px]">chevron_right</span>
          </button>
        </section>

        {/* Recent Alerts Feed */}
        <section className="w-full flex flex-col space-y-2.5">
          <div className="flex items-center justify-between">
            <h3 className="font-headline-sm text-headline-sm text-on-surface">Recent Alerts &amp; Tasks</h3>
            <button className="font-label-md text-label-md text-primary font-bold min-h-[48px] flex items-center" type="button">
              <span>View all (7)</span>
              <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
            </button>
          </div>
          {[
            { icon: 'pest_control', bg: 'bg-error-container', fg: 'text-error', title: 'Yellow Rust Alert in Nashik', time: '2h ago', body: 'Inspect leaf underside today for orange-yellow pustules.' },
            { icon: 'water', bg: 'bg-tertiary-fixed', fg: 'text-tertiary', title: 'Canal Water Release', time: '4h ago', body: 'Sub-canal Slot 3 scheduled for Tomorrow at 6:00 AM.' },
            { icon: 'trending_up', bg: 'bg-primary-fixed', fg: 'text-primary', title: 'Wheat Mandi Rate Up +₹185', time: 'Yesterday', body: 'Lasalgaon APMC auction closed at ₹12,420 / Quintal.' },
          ].map(({ icon, bg, fg, title, time, body }) => (
            <div key={title} className="w-full rounded-xl bg-surface-container-lowest p-3.5 shadow-sm flex items-start gap-3">
              <div className={`w-10 h-10 rounded-full ${bg} ${fg} flex items-center justify-center flex-shrink-0 mt-0.5`}>
                <span className="material-symbols-outlined text-[22px]">{icon}</span>
              </div>
              <div className="flex flex-col min-w-0 flex-1">
                <div className="flex items-center justify-between gap-1">
                  <h4 className="font-label-lg text-label-lg text-on-surface font-bold truncate">{title}</h4>
                  <span className="font-label-sm text-label-sm text-outline flex-shrink-0">{time}</span>
                </div>
                <p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">{body}</p>
              </div>
            </div>
          ))}
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
            <button className="min-h-[48px] px-3 rounded-lg bg-secondary-container text-on-secondary font-label-md text-label-md font-bold flex items-center gap-1 active:scale-95 transition-transform flex-shrink-0" type="button">
              <span>Speak</span>
              <span className="material-symbols-outlined text-[18px]">graphic_eq</span>
            </button>
          </div>
        </section>
      </main>

      {/* Bottom Nav */}
      <nav className="fixed bottom-0 inset-x-0 z-50 pb-safe bg-surface/90 backdrop-blur-xl shadow-[0_-2px_10px_rgba(0,0,0,0.04)]">
        <div className="flex justify-around items-center h-20 px-space-xs">
          {NAV_ITEMS.map(({ path, icon, label, to, badge }) => (
            <button
              key={path}
              onClick={() => { setActiveNav(path); navigate(to); }}
              className={`flex flex-col items-center justify-center min-h-[48px] min-w-[48px] px-2 py-1 transition-colors relative ${activeNav === path ? 'text-primary font-bold' : 'text-on-surface-variant'}`}
              type="button"
            >
              <span className="material-symbols-outlined text-[24px]">{icon}</span>
              <span className="font-label-sm text-label-sm mt-0.5">{label}</span>
              {badge && <span className="absolute top-1 right-2.5 w-2 h-2 rounded-full bg-secondary-container"></span>}
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
}
