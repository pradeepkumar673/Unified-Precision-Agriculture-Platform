import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function CommunityDiseaseOutbreakMap() {
  const navigate = useNavigate();
  const [activeView, setActiveView] = useState('map'); // map or list
  const [activeFilter, setActiveFilter] = useState('All');

  const filters = [
    { label: 'All', icon: '', count: null },
    { label: 'Yellow Rust', icon: 'yard', count: 12, dotClass: 'bg-primary' },
    { label: 'Fall Armyworm', icon: '', count: 4, dotClass: 'bg-secondary' },
    { label: 'Within 10 km', icon: 'near_me', count: null }
  ];

  return (
    <div className="min-h-screen bg-surface-container-lowest text-on-surface flex flex-col pt-safe pb-safe relative">
      <header className="fixed top-0 w-full z-50 bg-surface-container-lowest/90 backdrop-blur-xl border-b border-surface-container shadow-sm pt-safe">
        <div className="flex items-center justify-between h-14 px-margin">
          <div className="flex items-center gap-space-sm">
            <button onClick={() => navigate(-1)} className="w-10 h-10 flex items-center justify-center rounded-full text-on-surface active:bg-surface-container-high transition-colors" type="button">
              <span className="material-symbols-outlined text-[24px]">arrow_back</span>
            </button>
            <h1 className="font-headline-sm text-headline-sm font-bold text-on-surface truncate">Community Pest Radar</h1>
          </div>
          <button className="w-10 h-10 flex items-center justify-center rounded-full text-on-surface active:bg-surface-container-high transition-colors" type="button">
            <span className="material-symbols-outlined text-[24px]">search</span>
          </button>
        </div>
      </header>

      <main className="flex flex-col w-full pt-[56px] pb-24 bg-surface-container-lowest flex-1">
        
        <section className="px-gutter pt-space-md pb-space-xs">
          <div className="flex items-start justify-between">
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-primary text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>rss_feed</span>
                <span className="font-label-sm text-label-sm text-primary uppercase tracking-wider">Live Radar Sync</span>
              </div>
              <h2 className="font-headline-md text-headline-md text-on-surface tracking-tight">Niphad Block Outbreaks</h2>
              <p className="font-label-md text-label-md text-on-surface-variant">Monitoring 1,420 neighboring farms</p>
            </div>
            
            <div className="flex bg-surface-container-highest p-1 rounded-lg shadow-inner">
              <button 
                onClick={() => setActiveView('map')}
                className={`w-11 h-9 rounded-md flex items-center justify-center transition-all ${activeView === 'map' ? 'bg-surface-container-lowest text-primary shadow-sm' : 'text-on-surface-variant hover:text-on-surface'}`} 
                type="button" 
                title="Map View"
              >
                <span className="material-symbols-outlined text-[20px]">map</span>
              </button>
              <button 
                onClick={() => setActiveView('list')}
                className={`w-11 h-9 rounded-md flex items-center justify-center transition-all ${activeView === 'list' ? 'bg-surface-container-lowest text-primary shadow-sm' : 'text-on-surface-variant hover:text-on-surface'}`} 
                type="button" 
                title="List View"
              >
                <span className="material-symbols-outlined text-[20px]">view_agenda</span>
              </button>
            </div>
          </div>
          
          <div className="flex gap-2 overflow-x-auto py-3 -mx-gutter px-gutter hide-scrollbar">
            {filters.map((filter) => (
              <button 
                key={filter.label}
                onClick={() => setActiveFilter(filter.label)}
                className={`filter-chip flex items-center gap-1 px-3 py-2 rounded-full font-label-md text-label-md shrink-0 active:scale-95 transition-transform ${activeFilter === filter.label ? 'bg-primary text-on-primary shadow-sm' : 'bg-surface-container text-on-surface'}`}
              >
                {filter.dotClass && <span className={`w-2 h-2 rounded-full ${filter.dotClass}`}></span>}
                {filter.icon && <span className={`material-symbols-outlined text-[16px] ${activeFilter === filter.label ? 'text-on-primary' : 'text-primary'}`}>{filter.icon}</span>}
                <span>{filter.label}</span>
                {filter.count !== null && <span className={activeFilter === filter.label ? 'font-label-sm text-label-sm' : 'text-on-surface-variant font-label-sm text-label-sm'}>{filter.count}</span>}
              </button>
            ))}
          </div>
        </section>

        {activeView === 'map' && (
          <section className="px-gutter pt-space-xs pb-space-sm">
            <div className="relative w-full h-80 rounded-xl overflow-hidden shadow-sm bg-surface-container-high">
              <img alt="Agricultural district cadastral pest outbreak map" className="w-full h-full object-cover object-center" src="https://images.unsplash.com/photo-1524661135-423995f22d0b?q=80&w=1000&auto=format&fit=crop" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20 pointer-events-none"></div>
              
              <div className="absolute top-[48%] left-[46%] -translate-x-1/2 -translate-y-1/2 flex items-center justify-center pointer-events-none">
                <span className="absolute w-24 h-24 rounded-full bg-primary-fixed/30 animate-ping"></span>
                <span className="absolute w-14 h-14 rounded-full bg-primary-container/40"></span>
                <span className="relative flex items-center justify-center w-7 h-7 rounded-full bg-primary text-on-primary shadow-md">
                  <span className="material-symbols-outlined text-[16px]">yard</span>
                </span>
              </div>
              <div className="absolute top-[58%] left-[46%] -translate-x-1/2 bg-surface-container-lowest/95 backdrop-blur-md px-2.5 py-1 rounded-full shadow-md flex items-center gap-1.5 pointer-events-none">
                <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
                <span className="font-label-sm text-label-sm text-primary font-bold truncate max-w-[130px]">Green Valley Farm</span>
              </div>
              
              <div className="absolute top-4 left-4 max-w-[210px] bg-surface-container-lowest/95 backdrop-blur-md rounded-lg p-2.5 shadow-md flex flex-col gap-1">
                <div className="flex items-center gap-1 text-error">
                  <span className="material-symbols-outlined text-[18px]">warning</span>
                  <span className="font-label-sm text-label-sm text-error uppercase tracking-wider">High Risk</span>
                </div>
                <div className="font-label-md text-label-md text-on-surface font-bold leading-tight">Wheat Yellow Rust</div>
                <div className="font-label-sm text-label-sm text-on-surface-variant flex items-center gap-1">
                  <span className="material-symbols-outlined text-[14px]">distance</span>
                  <span>2.4 km northeast</span>
                </div>
              </div>
              
              <div className="absolute bottom-12 right-4 bg-surface-container-lowest/95 backdrop-blur-md rounded-lg p-2 shadow-md flex items-center gap-2">
                <span className="flex items-center justify-center w-7 h-7 rounded-full bg-secondary-fixed text-on-secondary-fixed">
                  <span className="material-symbols-outlined text-[16px]">pest_control</span>
                </span>
                <div className="flex flex-col">
                  <span className="font-label-sm text-label-sm font-bold text-on-surface">Fall Armyworm</span>
                  <span className="font-label-sm text-label-sm text-on-surface-variant">5.8 km • Contained</span>
                </div>
              </div>
              
              <div className="absolute right-3 top-3 flex flex-col gap-1.5">
                <button aria-label="Recenter Map" className="w-9 h-9 rounded-lg bg-surface-container-lowest/95 text-on-surface flex items-center justify-center shadow-md active:bg-surface-container-high transition-colors" type="button">
                  <span className="material-symbols-outlined text-[20px] text-primary">my_location</span>
                </button>
                <button aria-label="Toggle Layers" className="w-9 h-9 rounded-lg bg-surface-container-lowest/95 text-on-surface flex items-center justify-center shadow-md active:bg-surface-container-high transition-colors" type="button">
                  <span className="material-symbols-outlined text-[20px]">layers</span>
                </button>
              </div>
              
              <div className="absolute bottom-2 left-3 right-3 flex items-center justify-between text-on-primary font-label-sm text-label-sm">
                <span className="flex items-center gap-1 bg-inverse-surface/80 backdrop-blur-md px-2 py-0.5 rounded-md">
                  <span className="material-symbols-outlined text-[14px] text-secondary-container">radar</span>
                  <span>Proximity Radius: 10 km</span>
                </span>
                <span className="bg-inverse-surface/80 backdrop-blur-md px-2 py-0.5 rounded-md text-[11px]">Updated 12m ago</span>
              </div>
            </div>
          </section>
        )}

        <section className="px-gutter pt-space-sm pb-1 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-error text-[22px]">crisis_alert</span>
            <h2 className="font-headline-sm text-headline-sm text-on-surface">Nearby Threat Feed</h2>
          </div>
          <span className="font-label-sm text-label-sm px-2.5 py-1 rounded-full bg-error-container text-on-error-container font-bold">3 Urgent Nearby</span>
        </section>

        <section className="px-gutter py-space-xs flex flex-col gap-space-md">
          
          <article className="bg-surface-container-lowest rounded-xl p-space-md shadow-sm flex flex-col gap-space-sm relative overflow-hidden transition-all hover:shadow-md">
            <div className="absolute top-0 left-0 bottom-0 w-1.5 bg-error"></div>
            
            <div className="flex items-center justify-between pl-1.5">
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-error-container text-on-error-container">
                <span className="material-symbols-outlined text-[16px] text-error animate-pulse">warning</span>
                <span className="font-label-sm text-label-sm font-bold">High Risk for Plot 1 (Wheat)</span>
              </div>
              <button aria-label="Listen to voice advisory" className="w-10 h-10 rounded-full bg-tertiary-fixed text-on-tertiary-fixed flex items-center justify-center active:scale-90 transition-transform" type="button">
                <span className="material-symbols-outlined text-[20px]">volume_up</span>
              </button>
            </div>
            
            <div className="flex items-start gap-space-sm pl-1.5">
              <div className="w-14 h-14 rounded-lg bg-surface-container-high flex items-center justify-center shrink-0 overflow-hidden">
                <img className="w-full h-full object-cover" src="https://images.unsplash.com/photo-1582213782179-e0d53f98f2ca?q=80&w=200&auto=format&fit=crop" alt="Wheat Rust" />
              </div>
              <div className="flex flex-col min-w-0 flex-1">
                <div className="flex items-baseline justify-between gap-1">
                  <h3 className="font-headline-sm text-headline-sm text-on-surface truncate">Yellow Rust</h3>
                  <span className="font-label-sm text-label-sm text-error font-bold whitespace-nowrap">Moderate Spread</span>
                </div>
                <p className="font-body-sm text-body-sm text-on-surface-variant truncate">Crop: Wheat (HD-2967)</p>
                <div className="flex items-center gap-1.5 mt-1 text-on-surface-variant font-label-sm text-label-sm">
                  <span className="material-symbols-outlined text-[15px] text-error">near_me</span>
                  <span className="font-bold text-on-surface">2.4 km away</span>
                  <span>•</span>
                  <span>1 day ago</span>
                </div>
              </div>
            </div>
            
            <div className="pl-1.5 flex flex-col gap-2">
              <div className="flex items-center justify-between p-2 rounded-lg bg-error-container/20 text-on-surface border border-error/10">
                <div className="flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[18px] text-on-surface-variant">location_on</span>
                  <span className="font-label-md text-label-md">Pimpalgaon APMC Belt</span>
                </div>
                <span className="font-label-sm text-label-sm text-on-surface-variant">Wind heading SW (towards you)</span>
              </div>
              
              <div className="flex items-center gap-2 pt-1">
                <button className="flex-1 min-h-[48px] px-3 rounded-lg bg-secondary-container text-on-secondary font-label-md text-label-md flex items-center justify-center gap-1.5 shadow-sm active:opacity-90" type="button">
                  <span className="material-symbols-outlined text-[18px]">science</span>
                  <span>Get Spray Recipe</span>
                </button>
                <button className="min-h-[48px] px-4 bg-surface-container text-on-surface font-label-md text-label-md rounded-lg flex items-center justify-center gap-1 active:bg-surface-container-high transition-colors" type="button">
                  <span className="material-symbols-outlined text-[18px]">share</span>
                  <span>Share</span>
                </button>
              </div>
            </div>
          </article>

          <article className="bg-surface-container-lowest rounded-xl p-space-md shadow-sm flex flex-col gap-space-sm relative overflow-hidden transition-all hover:shadow-md opacity-90">
            <div className="absolute top-0 left-0 bottom-0 w-1.5 bg-surface-container-highest"></div>
            
            <div className="flex items-center justify-between pl-1.5">
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-surface-container-high text-on-surface-variant">
                <span className="material-symbols-outlined text-[16px]">info</span>
                <span className="font-label-sm text-label-sm font-bold">No Match (Tomato Only)</span>
              </div>
              <button aria-label="Listen to voice advisory" className="w-10 h-10 rounded-full bg-surface-container text-on-surface-variant flex items-center justify-center active:scale-90 transition-transform" type="button">
                <span className="material-symbols-outlined text-[20px]">volume_up</span>
              </button>
            </div>
            
            <div className="flex items-start gap-space-sm pl-1.5">
              <div className="w-14 h-14 rounded-lg bg-surface-container-high flex items-center justify-center shrink-0 overflow-hidden">
                <img className="w-full h-full object-cover" src="https://images.unsplash.com/photo-1593361841381-897b7b13df13?q=80&w=200&auto=format&fit=crop" alt="Tomato Leaf Spots" />
              </div>
              <div className="flex flex-col min-w-0 flex-1">
                <div className="flex items-baseline justify-between gap-1">
                  <h3 className="font-headline-sm text-headline-sm text-on-surface truncate">Early Blight</h3>
                  <span className="font-label-sm text-label-sm text-on-surface-variant font-bold whitespace-nowrap">Isolated</span>
                </div>
                <p className="font-body-sm text-body-sm text-on-surface-variant truncate">Crop: Tomato &amp; Chilli</p>
                <div className="flex items-center gap-1.5 mt-1 text-on-surface-variant font-label-sm text-label-sm">
                  <span className="material-symbols-outlined text-[15px] text-primary">near_me</span>
                  <span className="font-bold text-on-surface">8.1 km away</span>
                  <span>•</span>
                  <span>4 days ago</span>
                </div>
              </div>
            </div>
            
            <div className="pl-1.5 flex flex-col gap-2">
              <div className="flex items-center justify-between p-2 rounded-lg bg-surface-container-low text-on-surface">
                <div className="flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[18px] text-on-surface-variant">location_on</span>
                  <span className="font-label-md text-label-md">Dindori Belt</span>
                </div>
                <span className="font-label-sm text-label-sm text-on-surface-variant">Weather: Favorable for spores</span>
              </div>
              <div className="flex items-center gap-2 pt-1">
                <button className="flex-1 min-h-[48px] px-3 rounded-lg bg-surface-container text-on-surface font-label-md text-label-md flex items-center justify-center gap-1.5 active:bg-surface-container-high transition-colors" type="button">
                  <span className="material-symbols-outlined text-[18px]">info</span>
                  <span>Inspect Preventative Checklist</span>
                </button>
              </div>
            </div>
          </article>
        </section>

        <section className="px-gutter pt-space-md pb-space-lg">
          <div className="bg-gradient-to-br from-primary-container to-primary text-on-primary rounded-xl p-space-md shadow-md flex flex-col gap-space-sm relative overflow-hidden">
            <div className="absolute -right-8 -bottom-8 w-36 h-36 rounded-full bg-primary-fixed/10 pointer-events-none"></div>
            <div className="flex items-start gap-space-sm">
              <div className="w-12 h-12 rounded-full bg-primary-fixed/20 flex items-center justify-center shrink-0 text-primary-fixed">
                <span className="material-symbols-outlined text-[28px]">photo_camera</span>
              </div>
              <div className="flex flex-col">
                <h3 className="font-headline-sm text-headline-sm text-on-primary">Protect Your Neighbors</h3>
                <p className="font-body-sm text-body-sm text-primary-fixed-dim mt-0.5">Noticed unusual spots, wilted stems, or bugs on your crop today?</p>
              </div>
            </div>
            <div className="pt-1">
              <button 
                className="w-full min-h-[56px] rounded-lg bg-secondary-container text-on-secondary font-label-lg text-label-lg flex items-center justify-center gap-2 shadow-md active:scale-98 transition-transform" 
                type="button"
                onClick={(e) => {
                  e.currentTarget.classList.add('opacity-80');
                  setTimeout(() => e.currentTarget.classList.remove('opacity-80'), 300);
                }}
              >
                <span className="material-symbols-outlined text-[24px]">center_focus_strong</span>
                <span>Scan Leaf &amp; Report Outbreak</span>
                <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
              </button>
            </div>
            <div className="flex items-center justify-center gap-1.5 text-primary-fixed-dim font-label-sm text-label-sm pt-0.5">
              <span className="material-symbols-outlined text-[14px]">volunteer_activism</span>
              <span>Every report alerts 300+ farmers in Niphad block</span>
            </div>
          </div>
        </section>

      </main>

      <nav className="fixed bottom-0 w-full z-50 pb-safe bg-surface/90 backdrop-blur-xl shadow-[0_-2px_10px_rgba(0,0,0,0.04)]">
        <div className="flex justify-around items-center h-20 px-space-xs">
          {[
            { icon: 'home', label: 'Home', path: '/app' },
            { icon: 'calendar_month', label: 'Plan', path: '/planning/crop-plan' },
            { icon: 'storefront', label: 'Market', path: '/marketplace/inputs' },
            { icon: 'warning', label: 'Alerts', path: '/community/alerts', active: true, hasBadge: true },
            { icon: 'account_circle', label: 'Profile', path: '/profile/settings' },
          ].map(nav => (
            <button key={nav.label} onClick={() => navigate(nav.path)} className={`flex flex-col items-center justify-center min-h-[48px] min-w-[48px] px-2 py-1 transition-colors group relative ${nav.active ? 'text-primary font-bold' : 'text-on-surface-variant hover:text-on-surface'}`} type="button">
              <span className="material-symbols-outlined text-[24px]">{nav.icon}</span>
              <span className="font-label-sm text-label-sm mt-0.5">{nav.label}</span>
              {nav.hasBadge && !nav.active && <span className="absolute top-1 right-2.5 w-2 h-2 rounded-full bg-secondary-container"></span>}
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
}
