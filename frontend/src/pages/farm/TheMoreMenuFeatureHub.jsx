import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function TheMoreMenuFeatureHub() {
  const [filter, setFilter] = useState('all');
  const navigate = useNavigate();

  const modules = [
    {
      id: 1,
      cat: 'ai',
      bgClass: 'bg-primary-fixed text-on-primary-fixed-variant',
      icon: 'health_and_safety',
      title: 'Crop Health',
      badge: 'AI Active',
      badgeClass: 'bg-primary text-on-primary',
      desc: 'AI camera leaf scanner, Yellow rust diagnosis, outbreak containment zone map',
      actionText: 'Launch Scanner',
      actionClass: 'text-primary',
      route: '/health/disease-scanner'
    },
    {
      id: 2,
      cat: 'field',
      bgClass: 'bg-tertiary-fixed text-on-tertiary-fixed-variant',
      icon: 'opacity',
      title: 'Irrigation & Soil',
      badge: 'Connected',
      badgeClass: 'bg-tertiary-container text-on-tertiary-container',
      desc: 'Smart water demand, automated solenoid valve timer, soil N-P-K heatmap telemetry',
      actionText: 'Manage 3 Valves',
      actionClass: 'text-tertiary',
      route: '/water-soil/irrigation'
    },
    {
      id: 3,
      cat: 'ai',
      bgClass: 'bg-secondary-fixed text-on-secondary-fixed-variant',
      icon: 'query_stats',
      title: 'Forecasts & Vision',
      badge: '4 Tools',
      badgeClass: 'bg-secondary-container text-on-secondary',
      desc: 'APMC mandi price predictor, yield estimator, NDVI satellite stress, drone counting',
      actionText: 'View Mandi Trends',
      actionClass: 'text-secondary',
      route: '/vision/price-forecast'
    },
    {
      id: 4,
      cat: 'finance',
      bgClass: 'bg-primary-fixed-dim text-on-primary-fixed',
      icon: 'payments',
      title: 'Finance & Credit',
      badge: '₹1.85L Eligible',
      badgeClass: 'bg-primary-container text-on-primary-container',
      desc: 'KCC digital credit line, wallet ledger, instant UPI checkout, PMFBY crop insurance claim',
      actionText: 'Instant Pre-approval',
      actionClass: 'text-primary',
      route: '/finance/credit-insurance'
    },
    {
      id: 5,
      cat: 'finance',
      bgClass: 'bg-surface-container-high text-on-surface',
      icon: 'account_balance',
      title: 'Govt Schemes',
      badge: '4 Matches',
      badgeClass: 'bg-tertiary text-on-tertiary',
      desc: 'Auto-matching subsidy finder, PM-Kisan DBT tracking, localized document vault OCR',
      actionText: 'Claim DBT Benefits',
      actionClass: 'text-tertiary',
      route: '/gov/schemes'
    },
    {
      id: 6,
      cat: 'field',
      bgClass: 'bg-secondary-fixed-dim text-on-secondary-fixed',
      icon: 'groups',
      title: 'Community & FPO',
      badge: 'Active Pool',
      badgeClass: 'bg-secondary text-on-secondary',
      desc: 'Digital Sakhi farm visits, SHG machinery rental slots, FPO cooperative bulk price bargaining',
      actionText: 'View Shared Harvester',
      actionClass: 'text-secondary',
      route: '/community/fpo-cooperative-suite'
    },
    {
      id: 7,
      cat: 'ai',
      bgClass: 'bg-tertiary-fixed text-tertiary',
      icon: 'record_voice_over',
      title: 'Voice Assistant',
      badge: 'Voice AI',
      badgeClass: 'bg-tertiary text-on-tertiary',
      desc: 'Hands-free conversational agronomist, dialect voice queries, natural speech farm logging',
      actionText: 'Speak in Hindi/Marathi',
      actionClass: 'text-tertiary',
      actionIcon: 'mic',
      route: '/ai/assistant'
    },
    {
      id: 8,
      cat: 'ai',
      bgClass: 'bg-primary-fixed text-on-primary-fixed',
      icon: 'science',
      title: 'What-If Simulator',
      badge: 'Predictive',
      badgeClass: 'bg-primary-container text-on-primary-container',
      desc: 'Counterfactual agronomic sandbox, test irrigation & hybrid seed shifts before capital outlay',
      actionText: 'Run Scenario Model',
      actionClass: 'text-primary',
      route: '/ai/causal-lab'
    },
    {
      id: 9,
      cat: 'field',
      bgClass: 'bg-surface-container-high text-primary',
      icon: 'sensors',
      title: 'CEA / IoT Polyhouse',
      badge: 'High-Tech',
      badgeClass: 'bg-surface-container-highest text-on-surface',
      desc: 'DWC/NFT hydroponics, vertical rack monitor, automated micro-climate vapor deficit control',
      actionText: 'Check Telemetry Feed',
      actionClass: 'text-primary',
      route: '/iot/hydro-climate'
    },
    {
      id: 10,
      cat: 'field',
      bgClass: 'bg-tertiary-fixed-dim text-on-tertiary-fixed',
      icon: 'share_location',
      title: 'GPS Mapping & VRA',
      badge: 'RTK Fix',
      badgeClass: 'bg-tertiary-container text-on-tertiary-container',
      desc: 'RTK perimeter boundary walk, k-means fertilizer management zones, tractor prescription export',
      actionText: 'Boundary Calibration',
      actionClass: 'text-tertiary',
      route: '/farm/boundary'
    },
    {
      id: 11,
      cat: 'field',
      bgClass: 'bg-secondary-fixed text-on-secondary-fixed-variant',
      icon: 'qr_code_2',
      title: 'Produce Passport',
      badge: 'Grade AAA',
      badgeClass: 'bg-secondary text-on-secondary',
      desc: 'Sensor batch lifecycle log, buyer transparency QR code label export for premium market realization',
      actionText: 'Print 120 QR Tags',
      actionClass: 'text-secondary',
      route: '/gov/traceability'
    }
  ];

  const filteredModules = filter === 'all' ? modules : modules.filter(m => m.cat === filter);

  return (
    <div className="flex flex-col w-full px-space-md pb-space-lg space-y-space-md">
      {/* Interactive Header Panel */}
      <div className="flex flex-col w-full bg-surface-container-low rounded-xl p-space-md shadow-sm mt-space-md">
        <div className="flex items-start justify-between gap-space-sm">
          <div className="flex flex-col">
            <div className="flex items-center gap-space-xs">
              <span className="font-label-sm text-label-sm uppercase tracking-wider text-primary font-bold">Modular Ecosystem</span>
              <span className="w-1.5 h-1.5 rounded-full bg-primary-container"></span>
              <span className="font-label-sm text-label-sm text-on-surface-variant">Live v4.2</span>
            </div>
            <h1 className="font-headline-lg-mobile text-headline-lg-mobile text-on-surface mt-0.5">More Agritech Tools</h1>
          </div>
          <button onClick={() => navigate('/')} aria-label="Close Hub" className="w-10 h-10 rounded-full bg-surface-container-highest flex items-center justify-center text-on-surface active:scale-95 transition-transform" type="button">
            <span className="material-symbols-outlined text-[22px]">close</span>
          </button>
        </div>
        <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">All 11 specialized modules and advanced farm services calibrated for Plot 1</p>
        
        {/* Quick Search & Filter Pills */}
        <div className="flex items-center gap-space-xs mt-space-sm overflow-x-auto pb-1">
            <button 
              onClick={() => setFilter('all')} 
              className={`px-space-md py-1 min-h-[44px] rounded-full font-label-md text-label-md shrink-0 transition-all active:scale-95 flex items-center justify-center ${filter === 'all' ? 'bg-primary text-on-primary shadow-sm' : 'bg-surface-container text-on-surface-variant'}`} 
              type="button"
            >
              All Modules
            </button>
            <button 
              onClick={() => setFilter('ai')} 
              className={`px-space-md py-1 min-h-[44px] rounded-full font-label-md text-label-md shrink-0 transition-all active:scale-95 flex items-center justify-center ${filter === 'ai' ? 'bg-primary text-on-primary shadow-sm' : 'bg-surface-container text-on-surface-variant'}`} 
              type="button"
            >
              AI & Automation
            </button>
            <button 
              onClick={() => setFilter('finance')} 
              className={`px-space-md py-1 min-h-[44px] rounded-full font-label-md text-label-md shrink-0 transition-all active:scale-95 flex items-center justify-center ${filter === 'finance' ? 'bg-primary text-on-primary shadow-sm' : 'bg-surface-container text-on-surface-variant'}`} 
              type="button"
            >
              Finance & Trace
            </button>
            <button 
              onClick={() => setFilter('field')} 
              className={`px-space-md py-1 min-h-[44px] rounded-full font-label-md text-label-md shrink-0 transition-all active:scale-95 flex items-center justify-center ${filter === 'field' ? 'bg-primary text-on-primary shadow-sm' : 'bg-surface-container text-on-surface-variant'}`} 
              type="button"
            >
              Field & Sensors
            </button>
        </div>
      </div>

      {/* Real-time Agro-IoT Mini Ticker */}
      <div className="flex items-center justify-between bg-primary-fixed text-on-primary-fixed p-space-sm rounded-lg shadow-sm">
        <div className="flex items-center gap-space-sm">
          <div className="w-8 h-8 rounded-full bg-primary text-on-primary flex items-center justify-center">
            <span className="material-symbols-outlined text-[18px]">satellite_alt</span>
          </div>
          <div className="flex flex-col">
            <span className="font-label-md text-label-md leading-tight">Sentinel-2 Sync: Healthy Canopy</span>
            <span className="font-label-sm text-label-sm opacity-80">NDVI 0.74 • Topsoil Moisture 28%</span>
          </div>
        </div>
        <span className="font-label-sm text-label-sm px-2 py-0.5 rounded-full bg-primary/20 font-bold uppercase">Optimal</span>
      </div>

      {/* Tactical Grid Feature Cards */}
      <div className="flex flex-col gap-space-sm">
        {filteredModules.map(mod => (
          <div key={mod.id} onClick={() => navigate(mod.route)} className="module-card group bg-surface-container-lowest rounded-xl p-space-md shadow-sm active:scale-[0.99] transition-all cursor-pointer">
            <div className="flex items-start gap-space-md">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 shadow-sm ${mod.bgClass}`}>
                <span className="material-symbols-outlined text-[28px]" style={{ fontVariationSettings: "'FILL' 1" }}>{mod.icon}</span>
              </div>
              <div className="flex flex-col flex-grow min-w-0">
                <div className="flex items-center justify-between gap-space-xs">
                  <span className="font-headline-sm text-headline-sm text-on-surface truncate">{mod.title}</span>
                  <span className={`font-label-sm text-label-sm px-space-xs py-0.5 rounded-full font-bold shrink-0 ${mod.badgeClass}`}>{mod.badge}</span>
                </div>
                <p className="font-body-sm text-body-sm text-on-surface-variant mt-1 line-clamp-2">{mod.desc}</p>
                <div className={`flex items-center gap-space-xs mt-2 font-label-md text-label-md ${mod.actionClass}`}>
                  <span>{mod.actionText}</span>
                  <span className="material-symbols-outlined text-[16px] group-hover:translate-x-1 transition-transform">{mod.actionIcon || 'arrow_forward'}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Agronomist Field Support Banner */}
      <div className="w-full bg-surface-container p-space-md rounded-xl flex items-center justify-between gap-space-md shadow-sm cursor-pointer active:scale-95 transition-transform" onClick={() => navigate('/community/digital-sakhi')}>
        <div className="flex items-center gap-space-sm min-w-0">
          <div className="relative w-12 h-12 rounded-full overflow-hidden shrink-0 bg-surface-container-highest">
            <img alt="Sunita Sakhi" className="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBHDoH-JULur46WjOFAWi6ZSLiM0FHg-EWI1QdsvicJkQyVxLpszvPOAtptYJ_d0To2G2kSVFGXCxKi9M1Aua6bafwx7ywjx__TiopIsZd1LF5P06y8ptnkBr3scm6092AQnbT3HpF9gqme9GNdMxDS-3VbZOmURxcEiNHJ0q39YJ_sJg2Diepxwj21KRAbeuEAELYWKFb1fz7VWhnUmDetyGCLORNiPNePHAj7_0-p8VlH2iH95_PD" />
            <span className="absolute bottom-0 right-0 w-3 h-3 bg-primary-container rounded-full ring-2 ring-surface-container-lowest"></span>
          </div>
          <div className="flex flex-col min-w-0">
            <span className="font-label-lg text-label-lg text-on-surface truncate">Need help navigating?</span>
            <span className="font-body-sm text-body-sm text-on-surface-variant truncate">Talk to Sunita Sakhi (Agronomist)</span>
          </div>
        </div>
        <button aria-label="Call Agronomist Sunita" className="h-12 px-space-md rounded-full bg-secondary text-on-secondary flex items-center justify-center gap-space-xs shrink-0 shadow-sm active:scale-95 transition-transform" type="button" onClick={(e) => { e.stopPropagation(); navigate('/community/digital-sakhi'); }}>
          <span className="material-symbols-outlined text-[20px]">call</span>
          <span className="font-label-md text-label-md font-bold">Call</span>
        </button>
      </div>
    </div>
  );
}
