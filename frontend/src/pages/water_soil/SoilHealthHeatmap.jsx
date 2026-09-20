import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function SoilHealthHeatmap() {
  const navigate = useNavigate();
  const [activeMetric, setActiveMetric] = useState('Nitrogen (N)');
  const [activeCell, setActiveCell] = useState('B2');

  const metrics = [
    { name: 'Nitrogen (N)', icon: 'eco' },
    { name: 'Phosphorus (P)', icon: 'grain' },
    { name: 'Potassium (K)', icon: 'local_florist' },
    { name: 'Moisture', icon: 'water_drop' },
    { name: 'pH Level', icon: 'thermostat' },
  ];

  // Dummy 4x4 grid data matching HTML
  const gridData = [
    { zone: 'A1', val: 265, status: 'Optimal', color: 'bg-primary-container text-on-primary' },
    { zone: 'A2', val: 248, status: 'Optimal', color: 'bg-primary-container text-on-primary' },
    { zone: 'A3', val: 195, status: 'Adequate', color: 'bg-primary-fixed-dim text-on-primary-fixed-variant' },
    { zone: 'A4', val: 155, status: 'Moderate', color: 'bg-secondary-fixed text-on-secondary-fixed' },
    { zone: 'B1', val: 252, status: 'Optimal', color: 'bg-primary-container text-on-primary' },
    { zone: 'B2', val: 142, status: 'Deficient', color: 'bg-secondary text-on-secondary' }, // Target
    { zone: 'B3', val: 138, status: 'Deficient', color: 'bg-secondary text-on-secondary' },
    { zone: 'B4', val: 210, status: 'Adequate', color: 'bg-primary-fixed-dim text-on-primary-fixed-variant' },
    { zone: 'C1', val: 241, status: 'Optimal', color: 'bg-primary-container text-on-primary' },
    { zone: 'C2', val: 176, status: 'Moderate', color: 'bg-secondary-fixed text-on-secondary-fixed' },
    { zone: 'C3', val: 228, status: 'Adequate', color: 'bg-primary-fixed-dim text-on-primary-fixed-variant' },
    { zone: 'C4', val: 250, status: 'Optimal', color: 'bg-primary-container text-on-primary' },
    { zone: 'D1', val: 255, status: 'Optimal', color: 'bg-primary-container text-on-primary' },
    { zone: 'D2', val: 205, status: 'Adequate', color: 'bg-primary-fixed-dim text-on-primary-fixed-variant' },
    { zone: 'D3', val: 260, status: 'Optimal', color: 'bg-primary-container text-on-primary' },
    { zone: 'D4', val: 240, status: 'Optimal', color: 'bg-primary-container text-on-primary' },
  ];

  const activeCellData = gridData.find(c => c.zone === activeCell);

  return (
    <div className="min-h-screen bg-surface text-on-surface flex flex-col pt-safe pb-safe relative">
      <header className="fixed top-0 w-full z-50 bg-surface/95 backdrop-blur-xl shadow-[0_2px_12px_rgba(27,94,32,0.06)] pt-safe">
        <div className="h-28 px-gutter flex flex-col justify-between py-space-xs">
          <div className="flex items-center justify-between gap-space-xs">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-[28px]" style={{ fontVariationSettings: "'FILL' 1" }}>eco</span>
              <span className="font-headline-sm text-headline-sm text-primary font-bold tracking-tight">KhetSaathi</span>
            </div>
            <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-surface-container text-on-surface hover:bg-surface-container-high transition-colors min-h-[48px] max-w-[190px] border border-outline-variant/40" type="button">
              <span className="material-symbols-outlined text-[18px] text-primary shrink-0">psychiatry</span>
              <span className="font-label-md text-label-md truncate font-semibold text-primary">Plot 1 • Wheat (4.5 Ac)</span>
              <span className="material-symbols-outlined text-[18px] text-on-surface-variant shrink-0">arrow_drop_down</span>
            </button>
            <div className="flex items-center gap-1.5">
              <button className="min-h-[48px] min-w-[48px] px-2.5 rounded-full bg-surface-container text-primary flex items-center justify-center font-label-md text-label-md border border-outline-variant/50 hover:bg-surface-container-high transition-colors" type="button">
                EN
              </button>
              <button className="min-h-[48px] min-w-[48px] rounded-full bg-primary-container text-on-primary flex items-center justify-center shadow-sm active:scale-95 transition-transform" type="button">
                <span className="material-symbols-outlined text-[20px]">volume_up</span>
              </button>
            </div>
          </div>
          <div className="flex items-center justify-between pb-1">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-surface-container-low border border-outline-variant/30">
              <span className="w-2 h-2 rounded-full bg-[#2E7D32] animate-pulse"></span>
              <span className="font-label-sm text-label-sm text-on-surface-variant font-medium">Synced 1m ago • Offline Ready</span>
            </div>
          </div>
        </div>
      </header>

      <main className="flex flex-col relative w-full pt-28 pb-24 bg-surface flex-1">
        <div className="flex flex-col w-full px-gutter gap-space-md py-space-sm">
          {/* Header text */}
          <div className="flex flex-col gap-space-sm">
            <div className="flex items-center justify-between">
              <h1 className="font-headline-md text-headline-md text-on-surface tracking-tight">Soil Health Insights</h1>
              <span className="font-label-sm text-label-sm text-on-surface-variant bg-surface-container px-2 py-0.5 rounded-full">Plot 1 • 4.5 Ac</span>
            </div>
            
            {/* Horizontal scrolling tabs */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 -mx-gutter px-gutter no-scrollbar">
              {metrics.map(m => (
                <button
                  key={m.name}
                  onClick={() => setActiveMetric(m.name)}
                  className={`shrink-0 px-3.5 py-2 rounded-full font-label-md text-label-md flex items-center gap-1.5 transition-all ${
                    activeMetric === m.name ? 'bg-primary text-on-primary shadow-sm' : 'bg-surface-container text-on-surface-variant'
                  }`}
                  type="button"
                >
                  <span className="material-symbols-outlined text-[18px]">{m.icon}</span>
                  <span>{m.name}</span>
                </button>
              ))}
            </div>
            <p className="font-label-sm text-label-sm text-on-surface-variant">4.5 Acres divided into 16 micro-zones (4x4 grid) • Satellite multispectral calibrated</p>
          </div>

          {/* Heatmap Card */}
          <div className="bg-surface-container-lowest rounded-xl shadow-sm p-4 flex flex-col space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-headline-sm text-headline-sm text-on-surface leading-tight">Field Grid Heatmap</h2>
                <p className="font-label-sm text-label-sm text-on-surface-variant flex items-center gap-1 mt-0.5">
                  <span className="material-symbols-outlined text-[14px] text-primary">my_location</span>
                  <span>Nashik Sector 4 • 20.011° N, 73.790° E</span>
                </p>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-primary-fixed text-on-primary-fixed font-label-sm text-label-sm flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px]">tune</span>
                <span>Tap cell</span>
              </span>
            </div>

            {/* 4x4 Grid Container */}
            <div className="bg-surface-container-low rounded-xl p-2.5 flex flex-col gap-2">
              <div className="grid grid-cols-4 text-center font-label-sm text-label-sm text-on-surface-variant font-bold">
                <span>Col 1</span>
                <span>Col 2</span>
                <span>Col 3</span>
                <span>Col 4</span>
              </div>
              <div className="grid grid-cols-4 gap-2">
                {gridData.map(cell => (
                  <button
                    key={cell.zone}
                    onClick={() => setActiveCell(cell.zone)}
                    className={`aspect-square rounded-lg flex flex-col items-center justify-center relative p-1 shadow-sm transition-all ${
                      activeCell === cell.zone ? `${cell.color} scale-105 shadow-md` : `${cell.color} active:scale-95`
                    }`}
                    type="button"
                  >
                    <span className="font-label-md text-label-md font-bold">{cell.zone}</span>
                    <span className={`font-label-sm text-[10px] ${activeCell === cell.zone ? 'font-semibold' : 'opacity-90'}`}>{cell.val}</span>
                    {activeCell === cell.zone && (
                      <span className="absolute -top-1.5 -right-1.5 bg-surface-container-lowest text-secondary rounded-full w-5 h-5 flex items-center justify-center shadow-sm">
                        <span className="material-symbols-outlined text-[14px]">check</span>
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>
            
            {/* Active Cell Info */}
            {activeCellData && (
              <div className="flex items-center justify-between p-2.5 bg-surface-container rounded-xl mt-2">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-surface-container-lowest text-on-surface font-label-lg text-label-lg font-bold flex items-center justify-center shadow-sm">
                    {activeCellData.zone}
                  </div>
                  <div>
                    <span className="font-label-md text-label-md text-on-surface font-bold">Zone {activeCellData.zone} • 0.28 Acre</span>
                    <p className="font-body-sm text-body-sm text-on-surface-variant text-[12px] leading-tight mt-0.5">Red-Loam Soil</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className={`px-2.5 py-0.5 rounded-full font-label-sm text-label-sm font-bold flex items-center justify-end gap-1 ${
                    activeCellData.status === 'Optimal' || activeCellData.status === 'Adequate' ? 'bg-primary-fixed text-on-primary-fixed' : 'bg-secondary-container text-on-secondary'
                  }`}>
                    <span className="material-symbols-outlined text-[14px]">{activeCellData.status === 'Optimal' ? 'verified' : 'warning'}</span>
                    <span>{activeCellData.status}</span>
                  </span>
                  <span className={`font-label-md text-label-md font-bold block mt-1 ${activeCellData.status === 'Optimal' ? 'text-primary' : 'text-secondary'}`}>
                    {activeCellData.val} kg/ha
                  </span>
                </div>
              </div>
            )}
          </div>

          <div className="bg-surface-container-lowest rounded-xl shadow-sm p-4 flex flex-col space-y-3.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary-container text-[24px]">psychiatry</span>
                <span className="font-headline-sm text-headline-sm text-on-surface">Field Uniformity Index</span>
              </div>
              <span className="font-label-lg text-label-lg font-bold text-primary">78% Balanced</span>
            </div>
            <div className="w-full bg-surface-container-high rounded-full h-3 overflow-hidden flex">
              <div className="bg-primary h-full rounded-full transition-all duration-500" style={{ width: '78%' }}></div>
            </div>
            <div className="flex justify-between font-label-sm text-label-sm text-on-surface-variant">
              <span>12 Zones Optimal</span>
              <span>2 Moderate</span>
              <span className="text-secondary font-bold">2 Underfed</span>
            </div>
            <div className="bg-surface-container-low rounded-xl p-3 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary-fixed text-on-primary-fixed flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[22px]">savings</span>
              </div>
              <div className="flex flex-col">
                <span className="font-label-md text-label-md font-bold text-on-surface">Smart Variable-Rate Savings</span>
                <span className="font-body-sm text-body-sm text-on-surface-variant">Fertigate selectively to save <strong className="text-primary font-bold">₹11,400</strong> in fertilizer by bypassing optimal zones.</span>
              </div>
            </div>
            <button onClick={() => navigate('/water-soil/zone-management')} className="w-full min-h-[52px] px-4 py-3 rounded-xl bg-secondary-container text-on-primary font-label-lg text-label-lg flex items-center justify-center gap-2 shadow-sm active:scale-[0.98] transition-all" type="button">
              <span className="material-symbols-outlined text-[20px]">assignment</span>
              <span>Generate Variable Rate Fertilizer Guide</span>
              <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
            </button>
          </div>
        </div>
      </main>
      
      {/* Bottom Nav */}
      <nav className="fixed bottom-0 w-full z-50 pb-safe bg-surface/95 backdrop-blur-xl shadow-[0_-4px_14px_rgba(27,94,32,0.06)]">
        <div className="flex justify-around items-center h-16 px-1">
          {[
            { icon: 'home', label: 'Home', to: '/app' },
            { icon: 'calendar_month', label: 'Plan', to: '/planning/crop-plan' },
            { icon: 'water_drop', label: 'Water', to: '/water-soil/irrigation', active: true },
            { icon: 'storefront', label: 'Market', to: '/marketplace/inputs' },
            { icon: 'notifications', label: 'Alerts', to: '/community/alerts' },
            { icon: 'person', label: 'Profile', to: '/farm/profile' },
          ].map(({ icon, label, to, active }) => (
            <button key={label} onClick={() => navigate(to)} className={`flex flex-col items-center justify-center min-h-[48px] min-w-[48px] px-1 py-1 transition-colors ${active ? 'text-primary font-bold' : 'text-on-surface-variant'}`} type="button">
              <span className="material-symbols-outlined text-[24px]">{icon}</span>
              <span className="font-label-sm text-label-sm mt-0.5">{label}</span>
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
}
