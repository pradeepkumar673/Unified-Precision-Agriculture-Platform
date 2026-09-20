import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function ZoneManagementVariableRate() {
  const navigate = useNavigate();
  const [activeZone, setActiveZone] = useState('C');
  
  const zones = [
    { id: 'A', name: 'Zone A', size: '1.65 Acres', share: '36.5%', desc: 'High Vigour', color: 'bg-primary-container', activeClass: 'bg-primary-container/15 text-primary', dot: 'bg-primary-container' },
    { id: 'B', name: 'Zone B', size: '1.40 Acres', share: '31.0%', desc: 'Optimum Balance', color: 'bg-lime-600', activeClass: 'bg-lime-600/15 text-lime-700', dot: 'bg-lime-600' },
    { id: 'C', name: 'Zone C', size: '0.95 Ac', share: 'Moisture Stress', desc: 'Moisture Stress', color: 'bg-secondary-container', activeClass: 'bg-secondary-container/15 text-secondary', dot: 'bg-secondary-container', isStress: true },
    { id: 'D', name: 'Zone D', size: '0.52 Acres', share: '11.5%', desc: 'Hardpan / Silt', color: 'bg-error', activeClass: 'bg-error-container text-error', dot: 'bg-error' },
  ];

  return (
    <div className="min-h-screen bg-surface text-on-surface flex flex-col pt-safe pb-safe relative">
      {/* Top Header */}
      <header className="fixed top-0 w-full z-50 bg-surface/95 backdrop-blur-xl shadow-[0_2px_12px_rgba(27,94,32,0.06)] pt-safe">
        <div className="h-16 px-gutter flex items-center justify-between">
          <button onClick={() => navigate(-1)} className="w-10 h-10 flex items-center justify-center rounded-full text-on-surface hover:bg-surface-container active:scale-95 transition-all" type="button">
            <span className="material-symbols-outlined text-[24px]">arrow_back</span>
          </button>
          <div className="flex flex-col items-center">
            <h1 className="font-headline-sm text-headline-sm text-on-surface font-bold">Field Zones &amp; Prescription</h1>
            <span className="font-label-sm text-label-sm text-on-surface-variant font-medium">Plot 1 (Wheat) • 4.5 Ac</span>
          </div>
          <button className="w-10 h-10 flex items-center justify-center rounded-full text-primary hover:bg-surface-container active:scale-95 transition-all" type="button">
            <span className="material-symbols-outlined text-[24px]">share</span>
          </button>
        </div>
      </header>

      <main className="flex flex-col relative w-full pt-16 pb-36 bg-surface flex-1">
        {/* Interactive VRA Map Canvas */}
        <section className="w-full relative h-[260px] bg-surface-container-low overflow-hidden shadow-inner flex items-center justify-center">
          <img
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuBCqR6Q-7dnh2v3FwJ0wJ-tD9Fj5D35y9w2z0pXQ8tL_D9Zl2vXb30e_ZcQc9OaI63eZc_4gN9bH-Rj1lF73Z2-sK_P30k-qU8j36v9y83V4t7wF-3z7_bO8uQ_eC4p8eZ-Q_gB390d4WfO5w9bA80Z43tC7R8-hX-eQ_XnE9Xb0h4"
            alt="Field background"
            className="absolute inset-0 w-full h-full object-cover opacity-60"
          />
          <svg className="absolute inset-0 w-full h-full drop-shadow-lg" viewBox="0 0 375 260">
            {/* Zone A */}
            <path d="M 20 40 L 140 20 L 180 120 L 40 150 Z" fill="#acf4a4" fillOpacity="0.6" stroke="#1b5e20" strokeWidth="2"></path>
            <path d="M 140 20 L 280 30 L 320 160 L 180 120 Z" fill="#c0ca33" fillOpacity="0.6" stroke="#827717" strokeWidth="2"></path>
            <path d="M 180 120 L 320 160 L 290 230 L 150 190 Z" fill="#ffdbcf" fillOpacity="0.8" stroke="#a83900" strokeDasharray="4 4" strokeWidth="3"></path>
            <path d="M 40 150 L 180 120 L 150 190 L 20 220 Z" fill="#ffdad6" fillOpacity="0.6" stroke="#ba1a1a" strokeWidth="2"></path>

            {/* Labels */}
            <g className="pointer-events-none" transform="translate(90, 85)">
              <rect fill="#1b5e20" fillOpacity="0.9" height="24" rx="12" width="80" x="-40" y="-12"></rect>
              <text fill="#ffffff" fontFamily="Inter" fontSize="11" fontWeight="700" textAnchor="middle" x="0" y="4">Zone A • 1.65Ac</text>
            </g>
            <g className="pointer-events-none" transform="translate(230, 95)">
              <rect fill="#827717" fillOpacity="0.9" height="24" rx="12" width="80" x="-40" y="-12"></rect>
              <text fill="#ffffff" fontFamily="Inter" fontSize="11" fontWeight="700" textAnchor="middle" x="0" y="4">Zone B • 1.40Ac</text>
            </g>
            <g className="pointer-events-none" transform="translate(85, 195)">
              <rect fill="#b91c1c" fillOpacity="0.9" height="24" rx="12" width="80" x="-40" y="-12"></rect>
              <text fill="#ffffff" fontFamily="Inter" fontSize="11" fontWeight="700" textAnchor="middle" x="0" y="4">Zone D • 0.52Ac</text>
            </g>
            <g className="pointer-events-none" transform="translate(265, 205)">
              <circle className="animate-ping" cx="0" cy="0" fill="#fc6018" fillOpacity="0.3" r="14"></circle>
              <circle cx="0" cy="0" fill="#ffffff" r="7"></circle>
              <circle cx="0" cy="0" fill="#fc6018" r="4"></circle>
              <rect fill="#fc6018" height="22" rx="11" width="96" x="-48" y="10"></rect>
              <text fill="#ffffff" fontFamily="Inter" fontSize="11" fontWeight="700" textAnchor="middle" x="0" y="25">Zone C Selected</text>
            </g>
          </svg>

          {/* Floating Map Utilities */}
          <div className="absolute top-2.5 right-2.5 flex flex-col gap-1.5 z-10">
            <button className="w-9 h-9 bg-surface-container-lowest/90 backdrop-blur-md text-on-surface rounded-xl flex items-center justify-center shadow-md" type="button">
              <span className="material-symbols-outlined text-[19px]">layers</span>
            </button>
            <button className="w-9 h-9 bg-surface-container-lowest/90 backdrop-blur-md text-on-surface rounded-xl flex items-center justify-center shadow-md" type="button">
              <span className="material-symbols-outlined text-[19px]">add</span>
            </button>
            <button className="w-9 h-9 bg-surface-container-lowest/90 backdrop-blur-md text-on-surface rounded-xl flex items-center justify-center shadow-md" type="button">
              <span className="material-symbols-outlined text-[19px]">remove</span>
            </button>
          </div>
          
          <div className="absolute bottom-2.5 left-2.5 flex items-center gap-1.5 bg-surface-container-lowest/90 backdrop-blur-md px-2.5 py-1 rounded-full shadow-sm z-10">
            <span className="material-symbols-outlined text-primary text-[15px]">explore</span>
            <span className="font-label-sm text-label-sm text-on-surface">N • 1:2500</span>
          </div>
          <div className="absolute bottom-2.5 right-2.5 flex items-center gap-1.5 bg-surface-container-lowest/90 backdrop-blur-md px-2.5 py-1 rounded-full shadow-sm z-10">
            <span className="w-2 h-2 rounded-full bg-secondary-container"></span>
            <span className="font-label-sm text-label-sm text-on-surface font-medium">NDVI: 0.44 avg</span>
          </div>
        </section>

        {/* Agronomic Zone Horizontal Selection Strip */}
        <section className="px-margin pt-space-sm pb-space-xs flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <span className="font-label-md text-label-md text-on-surface font-semibold">Management Zones (4 Detected)</span>
            <span className="font-label-sm text-label-sm text-on-surface-variant">Tap parcel to inspect</span>
          </div>
          <div className="flex gap-2.5 overflow-x-auto pb-1 -mx-margin px-margin no-scrollbar">
            {zones.map((zone) => (
              <button
                key={zone.id}
                onClick={() => setActiveZone(zone.id)}
                className={`min-w-[130px] p-2.5 rounded-xl text-left flex flex-col gap-1 transition-all shrink-0 relative ${
                  activeZone === zone.id ? `${zone.activeClass} shadow-md` : 'bg-surface-container-low shadow-sm active:scale-95'
                }`}
                type="button"
              >
                {activeZone === zone.id && (
                  <div className={`absolute top-2 right-2 w-4 h-4 rounded-full flex items-center justify-center ${zone.dot}`}>
                    <span className="material-symbols-outlined text-surface-container-lowest text-[12px]">check</span>
                  </div>
                )}
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-1.5">
                    <span className={`w-2.5 h-2.5 rounded-full ${zone.dot}`}></span>
                    <span className={`font-label-md text-label-md font-bold ${activeZone === zone.id ? '' : 'text-on-surface'}`}>{zone.name}</span>
                  </div>
                  {activeZone !== zone.id && !zone.isStress && (
                    <span className="font-label-sm text-label-sm text-on-surface-variant font-semibold">{zone.share}</span>
                  )}
                </div>
                <p className={`font-body-sm text-body-sm text-[12px] leading-none ${activeZone === zone.id ? 'font-medium' : 'text-on-surface-variant'}`}>{zone.desc}</p>
                <div className="flex items-center justify-between mt-1">
                  <span className={`font-label-sm text-label-sm font-semibold ${activeZone === zone.id ? '' : 'text-on-surface-variant mt-1'}`}>{zone.size}</span>
                  {activeZone === zone.id && (
                    <span className={`font-label-sm text-label-sm px-1.5 py-0.5 rounded-full ${zone.dot} text-white`}>Selected</span>
                  )}
                </div>
              </button>
            ))}
          </div>
        </section>

        {/* Variable-Rate Prescription (VRA) Spec Sheet */}
        <section className="mt-space-sm mx-margin p-space-md bg-surface-container-lowest rounded-2xl shadow-sm flex flex-col gap-space-sm">
          <div className="w-full flex flex-col items-center gap-1.5">
            <div className="w-10 h-1 bg-surface-container-highest rounded-full"></div>
            <div className="w-full flex items-start justify-between gap-space-xs mt-1">
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="px-2 py-0.5 rounded-full bg-secondary-fixed text-on-secondary-fixed font-label-sm text-label-sm font-bold">
                    Zone C VRA
                  </span>
                  <span className="font-label-sm text-label-sm text-on-surface-variant">0.95 Acres (NE Furrow)</span>
                </div>
                <h3 className="font-headline-sm text-headline-sm text-on-surface mt-1">Nitrogen Deficit &amp; Compaction</h3>
              </div>
              <div className="w-10 h-10 rounded-full bg-secondary-fixed/50 flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-secondary text-[22px]">auto_fix_high</span>
              </div>
            </div>
          </div>

          <div className="w-full p-space-sm bg-surface-container-low rounded-xl flex items-center justify-between text-[13px]">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-secondary text-[18px]">water_drop</span>
              <span className="font-label-md text-label-md text-on-surface">Soil Moisture: <strong>21% (Low)</strong></span>
            </div>
            <span className="font-label-sm text-label-sm text-error font-semibold">NDVI: 0.38 vs 0.71 Ref</span>
          </div>

          <div className="flex flex-col gap-space-xs">
            {/* 1. Seed Rate */}
            <div className="p-space-sm bg-surface-container rounded-xl flex items-center justify-between gap-space-sm">
              <div className="flex items-center gap-space-sm">
                <div className="w-10 h-10 rounded-lg bg-surface-container-lowest flex items-center justify-center text-primary-container shadow-sm shrink-0">
                  <span className="material-symbols-outlined text-[22px]">grain</span>
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <p className="font-label-md text-label-md text-on-surface font-bold">Seed Rate Dosage</p>
                    <span className="text-[11px] font-bold px-1.5 py-[2px] bg-primary-fixed text-on-primary-fixed rounded">↑ +10%</span>
                  </div>
                  <p className="font-body-sm text-body-sm text-on-surface-variant text-[13px]">Compensates for low tillering</p>
                </div>
              </div>
              <div className="text-right shrink-0">
                <span className="font-headline-sm text-headline-sm text-on-surface font-bold block">42 kg</span>
                <span className="font-label-sm text-label-sm text-on-surface-variant">per Acre</span>
              </div>
            </div>
            
            {/* 2. Fertilizer */}
            <div className="p-space-sm bg-surface-container rounded-xl flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-space-sm">
                  <div className="w-10 h-10 rounded-lg bg-surface-container-lowest flex items-center justify-center text-secondary shadow-sm shrink-0">
                    <span className="material-symbols-outlined text-[22px]">science</span>
                  </div>
                  <div>
                    <p className="font-label-md text-label-md text-on-surface font-bold">Fertilizer Micro-Dosing</p>
                    <p className="font-body-sm text-body-sm text-on-surface-variant text-[13px]">Boosts biomass &amp; active rooting</p>
                  </div>
                </div>
                <span className="font-label-sm text-label-sm text-tertiary font-bold bg-surface-container-lowest px-2 py-1 rounded-md">VRA</span>
              </div>
              <div className="grid grid-cols-3 gap-1.5 pt-1">
                <div className="bg-surface-container-lowest p-2 rounded-lg text-center shadow-sm">
                  <span className="font-label-sm text-label-sm text-on-surface-variant block">Urea (N)</span>
                  <span className="font-label-md text-label-md text-on-surface font-bold">35 kg</span>
                </div>
                <div className="bg-surface-container-lowest p-2 rounded-lg text-center shadow-sm">
                  <span className="font-label-sm text-label-sm text-on-surface-variant block">DAP (P)</span>
                  <span className="font-label-md text-label-md text-on-surface font-bold">22 kg</span>
                </div>
                <div className="bg-surface-container-lowest p-2 rounded-lg text-center shadow-sm">
                  <span className="font-label-sm text-label-sm text-on-surface-variant block">Nano Zinc</span>
                  <span className="font-label-md text-label-md text-on-surface font-bold">250 ml</span>
                </div>
              </div>
            </div>

            {/* 3. Pesticide */}
            <div className="p-space-sm bg-surface-container rounded-xl flex items-center justify-between gap-space-sm">
              <div className="flex items-center gap-space-sm">
                <div className="w-10 h-10 rounded-lg bg-surface-container-lowest flex items-center justify-center text-tertiary shadow-sm shrink-0">
                  <span className="material-symbols-outlined text-[22px]">sanitizer</span>
                </div>
                <div>
                  <p className="font-label-md text-label-md text-on-surface font-bold">Propiconazole 25% EC</p>
                  <p className="font-body-sm text-body-sm text-on-surface-variant text-[13px]">Low-volume canopy spray</p>
                </div>
              </div>
              <div className="text-right shrink-0">
                <span className="font-headline-sm text-headline-sm text-on-surface font-bold block">200 ml</span>
                <span className="font-label-sm text-label-sm text-on-surface-variant">total tank</span>
              </div>
            </div>
          </div>

          <div className="p-space-sm bg-primary-fixed/30 rounded-xl flex items-start gap-space-xs">
            <span className="material-symbols-outlined text-primary-container text-[20px] shrink-0 mt-0.5">savings</span>
            <p className="font-body-sm text-body-sm text-on-primary-fixed-variant text-[13.5px] leading-snug">
              <strong>VRA Economic Gain:</strong> Saves <strong>₹11,850</strong> and eliminates <strong>14 kg fertilizer runoff</strong> compared to uniform blanket broadcasting.
            </p>
          </div>

          <div className="flex items-center justify-between px-space-sm py-2 bg-surface-container-high rounded-xl">
            <div className="flex items-center gap-2 min-w-0">
              <span className="material-symbols-outlined text-on-surface-variant text-[18px]">precision_manufacturing</span>
              <span className="font-label-sm text-label-sm text-on-surface truncate">ISO-11783 XML &amp; ESRI Shapefile Ready</span>
            </div>
            <span className="material-symbols-outlined text-primary-container text-[18px]">verified_user</span>
          </div>
        </section>

        {/* Agronomist Verification */}
        <section className="px-margin py-space-sm">
          <div className="p-space-sm bg-surface-container-lowest rounded-2xl shadow-sm flex items-center justify-between gap-space-sm">
            <div className="flex items-center gap-space-xs">
              <img className="w-10 h-10 rounded-full object-cover shrink-0" alt="Agronomist" src="https://lh3.googleusercontent.com/aida-public/AB6AXuA2DecSk5_nYiJg0rU1zMV08vg5QV2Dn8TdRBBIjGm3TLKMn7b5mjtyDFDQdtkOvNRS1aMdv66zEhCUMKs61Nb03w7JqFPwuQwCK_nfEjcjt0NB5Sp2_GMK3zYtqSm0T188U2Wfa_8XGXcZbwDyF-SdjvLTY8eemjaQBB-Yf5Kos9CxLTD-OSmSgTY8qjDVQuIQ74C2unRQPrFKLGlpFwZbcrV1k_GPeJP7aepHLBI-PkZF_nURY4Q-" />
              <div>
                <p className="font-label-md text-label-md text-on-surface font-bold">Dr. V. Ramanathan</p>
                <p className="font-label-sm text-label-sm text-on-surface-variant">ICAR-IARI Agronomy Fellow • Approved</p>
              </div>
            </div>
            <button className="px-3 py-1.5 bg-surface-container text-on-surface rounded-lg font-label-sm text-label-sm font-semibold active:scale-95 transition-transform" type="button">
              Notes
            </button>
          </div>
        </section>

        {/* Sticky Action Footer Dock */}
        <footer className="fixed bottom-0 w-full p-margin bg-surface-container-lowest/95 backdrop-blur-md shadow-xl flex flex-col gap-2 z-30 pb-safe">
          <button className="w-full h-14 bg-secondary-container hover:bg-secondary text-surface-container-lowest rounded-xl font-label-lg text-label-lg flex items-center justify-center gap-space-xs shadow-md active:scale-[0.98] transition-all" type="button">
            <span>Export Prescription Map (ISO-XML)</span>
            <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
          </button>
          <button className="w-full h-12 bg-surface-container text-primary-container hover:bg-surface-container-high rounded-xl font-label-md text-label-md flex items-center justify-center gap-2 active:scale-[0.98] transition-all" type="button">
            <span className="material-symbols-outlined text-[18px]">flight_takeoff</span>
            <span>Send to Custom Hiring Drone Operator</span>
          </button>
        </footer>
      </main>
    </div>
  );
}
