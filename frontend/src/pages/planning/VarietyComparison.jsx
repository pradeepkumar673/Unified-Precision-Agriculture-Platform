import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getVarietyRecommendation } from '../../api/planningApi';

const FILTERS = [
  { id: 'all', label: 'All Varieties' },
  { id: 'drought', label: 'Drought Tolerant' },
  { id: 'yield', label: 'High Yield' },
  { id: 'early', label: 'Early Maturing' },
];

const VARIETIES = [
  {
    id: 'HD-2967',
    name: 'Sharbati Gold',
    match: 96,
    types: ['all', 'yield'],
    desc: 'Top choice for Clay Loam in Nashik. High market premium and excellent tillering capacity.',
    days: '120-125',
    yield: '21-24',
    cost: '₹1,250',
    traits: [
      { text: '⭐ Premium mandi rate (Sharbati)', color: 'bg-primary-container text-on-primary-container' },
      { text: '💧 Mod. water requirement', color: 'bg-surface-container-high text-on-surface-variant' },
      { text: '🛡️ Rust resistant', color: 'bg-surface-container-high text-on-surface-variant' },
    ],
  },
  {
    id: 'Lok-1',
    name: 'Lok-1',
    match: 84,
    types: ['all', 'early', 'drought'],
    desc: 'Best for late sowing scenarios or if canal water release is delayed. Heat tolerant.',
    days: '105-110',
    yield: '17-19',
    cost: '₹950',
    traits: [
      { text: '⏱️ Escapes terminal heat', color: 'bg-secondary-container text-on-secondary-container' },
      { text: '🌡️ High temp tolerance', color: 'bg-surface-container-high text-on-surface-variant' },
    ],
  },
  {
    id: 'PBW-550',
    name: 'PBW-550 High Grain',
    match: 78,
    types: ['all', 'yield'],
    desc: 'Requires assured irrigation. Very high yield potential but susceptible to lodging if over-fertilized.',
    days: '130-135',
    yield: '24-26',
    cost: '₹1,950',
    traits: [
      { text: '⚖️ Heavy 1000-grain weight', color: 'bg-surface-container-high text-on-surface-variant' },
      { text: '🌾 Resistant to Lodging (strong stem)', color: 'bg-surface-container-high text-on-surface-variant' },
      { text: '⚠️ Requires 5 timely irrigations', color: 'bg-error-container text-on-error-container' },
    ],
  },
];

export default function VarietyComparison() {
  const navigate = useNavigate();
  const [filter, setFilter] = useState('all');
  const [toastData, setToastData] = useState(null);

  const handleSelect = async (vCode, vName) => {
    // API call could happen here
    setToastData({ code: vCode, name: vName });
    setTimeout(() => setToastData(null), 4000);
  };

  const handleVoice = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(
        'Comparing 3 wheat varieties. Sharbati Gold HD-2967 has a 96% match for your clay loam soil with high market premium. Lok-1 gives early harvest in 105 days. Tap any card to select.'
      );
      u.rate = 0.95;
      window.speechSynthesis.speak(u);
    }
  };

  const visibleVarieties = VARIETIES.filter(v => v.types.includes(filter));

  return (
    <div className="min-h-screen bg-background flex flex-col pt-safe pb-safe relative">
      {/* Fixed Header */}
      <header className="fixed top-0 w-full z-50 pt-safe bg-surface/90 backdrop-blur-xl shadow-[0_1px_8px_rgba(0,0,0,0.04)]">
        <div className="h-20 px-margin flex items-center justify-between gap-space-sm">
          <div className="flex items-center gap-space-sm min-w-0 flex-1">
            <button onClick={() => navigate(-1)} className="w-10 h-10 flex items-center justify-center text-on-surface rounded-full active:bg-surface-container flex-shrink-0" type="button">
              <span className="material-symbols-outlined text-[24px]">arrow_back</span>
            </button>
            <div className="flex flex-col min-w-0">
              <span className="font-label-sm text-label-sm text-on-surface-variant truncate">Rabi Wheat</span>
              <h1 className="font-headline-sm text-headline-sm text-on-surface truncate">Compare Varieties</h1>
            </div>
          </div>
          <button onClick={handleVoice} className="w-11 h-11 bg-surface-container rounded-full flex items-center justify-center text-primary active:bg-surface-container-high" type="button">
            <span className="material-symbols-outlined text-[20px]">volume_up</span>
          </button>
        </div>
      </header>

      {/* Sticky Filter Bar */}
      <div className="fixed top-[calc(5rem+env(safe-area-inset-top))] w-full z-40 bg-background/95 backdrop-blur-md py-space-sm border-b border-surface-container shadow-sm">
        <div className="px-margin flex gap-space-sm overflow-x-auto no-scrollbar pb-1">
          {FILTERS.map(f => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={`flex-shrink-0 px-4 py-2 rounded-full font-label-md text-label-md transition-colors ${
                filter === f.id ? 'bg-primary text-on-primary' : 'bg-surface-container text-on-surface-variant'
              }`}
              type="button"
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <main className="flex flex-col w-full pt-[calc(5rem+4.5rem)] pb-28 px-margin bg-background flex-1">
        <div className="flex flex-col space-y-space-md">
          {visibleVarieties.map((v) => (
            <article key={v.id} className="rounded-xl bg-surface-container-lowest p-space-md shadow-sm border border-surface-container relative">
              {v.match >= 90 && (
                <div className="absolute -top-3 -right-2 px-3 py-1 bg-primary text-on-primary font-label-sm text-label-sm font-bold rounded-lg shadow-md transform rotate-2">
                  Best Match for Plot 1
                </div>
              )}
              {/* Header */}
              <div className="flex items-start justify-between mb-space-sm">
                <div className="flex flex-col">
                  <h2 className="font-headline-md text-headline-md text-on-surface">{v.id}</h2>
                  <span className="font-label-md text-label-md text-on-surface-variant">{v.name}</span>
                </div>
                <div className="w-12 h-12 rounded-full border-[4px] border-surface-container flex items-center justify-center bg-surface-container-lowest shadow-inner flex-shrink-0">
                  <span className="font-label-md text-label-md text-primary font-bold">{v.match}%</span>
                </div>
              </div>
              <p className="font-body-md text-body-md text-on-surface-variant mb-space-md">{v.desc}</p>
              
              {/* 3 Metric Grid */}
              <div className="grid grid-cols-3 gap-space-sm mb-space-sm">
                <div className="bg-surface-container-low rounded-lg p-space-sm flex flex-col items-center text-center">
                  <span className="material-symbols-outlined text-on-surface-variant text-[18px] mb-0.5">timer</span>
                  <span className="font-label-sm text-label-sm text-on-surface-variant">Duration</span>
                  <span className="font-label-lg text-label-lg text-on-surface font-bold mt-0.5">{v.days}</span>
                  <span className="font-label-sm text-label-sm text-on-surface-variant">Days</span>
                </div>
                <div className="bg-surface-container-low rounded-lg p-space-sm flex flex-col items-center text-center">
                  <span className="material-symbols-outlined text-primary text-[18px] mb-0.5">military_tech</span>
                  <span className="font-label-sm text-label-sm text-on-surface-variant">Yield</span>
                  <span className="font-label-lg text-label-lg text-primary font-bold mt-0.5">{v.yield}</span>
                  <span className="font-label-sm text-label-sm text-primary font-semibold">Max Yield</span>
                </div>
                <div className="bg-surface-container-low rounded-lg p-space-sm flex flex-col items-center text-center">
                  <span className="material-symbols-outlined text-on-surface-variant text-[18px] mb-0.5">payments</span>
                  <span className="font-label-sm text-label-sm text-on-surface-variant">Seed Cost</span>
                  <span className="font-label-lg text-label-lg text-on-surface font-bold mt-0.5">{v.cost}</span>
                  <span className="font-label-sm text-label-sm text-on-surface-variant">40kg Bag</span>
                </div>
              </div>

              {/* Trait Tags */}
              <div className="flex flex-wrap gap-space-xs mb-space-lg">
                {v.traits.map(t => (
                  <span key={t.text} className={`inline-flex items-center gap-1 px-space-sm py-1 rounded-full font-label-md text-label-md font-semibold ${t.color}`}>
                    {t.text}
                  </span>
                ))}
              </div>

              {/* Secondary Action */}
              <button
                onClick={() => handleSelect(v.id, v.name)}
                className={`w-full h-14 rounded-lg font-label-lg text-label-lg flex items-center justify-center gap-space-sm active:scale-[0.99] transition-transform ${
                  v.match >= 90 ? 'bg-primary-container text-on-primary' : 'bg-surface-container-high text-primary'
                }`}
                type="button"
              >
                <span>Select {v.id}</span>
                <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
              </button>
            </article>
          ))}
        </div>

        {/* Bottom Sourcing Container */}
        <section className="mt-space-lg rounded-xl bg-surface-container-high p-space-md shadow-sm">
          <div className="flex items-start gap-space-sm">
            <div className="w-10 h-10 rounded-full bg-secondary-container text-on-secondary flex items-center justify-center flex-shrink-0">
              <span className="material-symbols-outlined text-[22px]">store</span>
            </div>
            <div className="flex flex-col flex-1">
              <span className="font-label-lg text-label-lg text-on-background">Need seed source?</span>
              <p className="font-body-md text-body-md text-on-surface-variant mt-0.5">
                Verified FPO &amp; KVK seed availability near Nashik (4 hubs in 18 km).
              </p>
            </div>
          </div>
          <button
            onClick={() => alert('Locating verified Krishi Vigyan Kendra & Seed FPOs within 25 km of Nashik...')}
            className="mt-space-md w-full h-14 rounded-lg bg-secondary text-on-secondary font-label-lg text-label-lg flex items-center justify-center gap-space-sm shadow-md active:scale-[0.99] transition-transform"
            type="button"
          >
            <span>Find Certified Seed Dealers Near Me</span>
            <span className="material-symbols-outlined text-[22px]">arrow_forward</span>
          </button>
        </section>
      </main>

      {/* Toast Notification */}
      <div className={`fixed bottom-24 left-margin right-margin bg-inverse-surface text-inverse-on-surface p-space-md rounded-xl shadow-xl flex items-center justify-between gap-space-sm transform transition-all duration-300 z-50 ${toastData ? 'translate-y-0 opacity-100 pointer-events-auto' : 'translate-y-32 opacity-0 pointer-events-none'}`}>
        <div className="flex items-center gap-space-sm min-w-0">
          <span className="material-symbols-outlined text-primary-fixed-dim text-[24px]">task_alt</span>
          <div className="flex flex-col min-w-0">
            <span className="font-label-md text-label-md font-bold truncate">
              {toastData ? `${toastData.name} (${toastData.code})` : 'Variety Selected!'}
            </span>
            <span className="font-body-sm text-body-sm text-inverse-on-surface/80 truncate">Saved to Sowing Plan</span>
          </div>
        </div>
        <button onClick={() => setToastData(null)} className="font-label-md text-label-md text-primary-fixed underline flex-shrink-0" type="button">
          View Plan
        </button>
      </div>

      {/* Bottom Nav */}
      <nav className="fixed bottom-0 w-full z-50 pb-safe bg-surface/90 backdrop-blur-xl shadow-[0_-2px_10px_rgba(0,0,0,0.05)]">
        <div className="flex justify-around items-center h-16 px-space-xs">
          {[
            { icon: 'home', label: 'Home', to: '/app' },
            { icon: 'calendar_month', label: 'Plan', to: '/planning/crop-plan', active: true },
            { icon: 'storefront', label: 'Market', to: '/marketplace/inputs' },
            { icon: 'notifications', label: 'Alerts', to: '/community/alerts' },
            { icon: 'account_circle', label: 'Profile', to: '/farm/profile' },
          ].map(({ icon, label, to, active }) => (
            <button key={label} onClick={() => navigate(to)} className={`flex flex-col items-center justify-center min-w-[56px] h-12 transition-colors ${active ? 'text-primary-container font-semibold' : 'text-on-surface-variant hover:text-on-surface'}`} type="button">
              <span className="material-symbols-outlined text-[22px]">{icon}</span>
              <span className="font-label-sm text-label-sm">{label}</span>
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
}
