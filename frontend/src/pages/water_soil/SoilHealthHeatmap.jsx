import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getSoilAnalysis } from '../../api/farmApi';

// Classify a value into status + color based on metric thresholds
function classify(metric, val) {
  const thresholds = {
    'Nitrogen (N)':   { optimal: 220, adequate: 170, moderate: 130 },
    'Phosphorus (P)': { optimal: 25,  adequate: 16,  moderate: 10  },
    'Potassium (K)':  { optimal: 150, adequate: 110, moderate: 80  },
    'Moisture':       { optimal: 65,  adequate: 50,  moderate: 35  },
    'pH Level':       { optimal: 7.2, adequate: 6.2, moderate: 5.5 },
  };
  const t = thresholds[metric];
  if (val >= t.optimal) return { status: 'Optimal',   color: 'bg-[#1b5e20] text-white' };
  if (val >= t.adequate) return { status: 'Adequate',  color: 'bg-[#388e3c] text-white' };
  if (val >= t.moderate) return { status: 'Moderate',  color: 'bg-[#f57f17] text-white' };
  return                       { status: 'Deficient', color: 'bg-[#b71c1c] text-white' };
}

const METRIC_KEY = {
  'Nitrogen (N)': 'nitrogen', 'Phosphorus (P)': 'phosphorus',
  'Potassium (K)': 'potassium', 'Moisture': 'moisture', 'pH Level': 'ph',
};
const UNIT = {
  'Nitrogen (N)': 'kg/ha', 'Phosphorus (P)': 'kg/ha',
  'Potassium (K)': 'kg/ha', 'Moisture': '%', 'pH Level': 'pH',
};

export default function SoilHealthHeatmap() {
  const navigate = useNavigate();
  const [activeMetric, setActiveMetric] = useState('Nitrogen (N)');
  const [activeCell, setActiveCell] = useState('B2');
  const [rawGrid, setRawGrid] = useState(null);   // API data
  const [dataSource, setDataSource] = useState(null);
  const [fetchedAt, setFetchedAt] = useState(null);
  const [loading, setLoading] = useState(true);

  const farmId = localStorage.getItem('farmId');

  useEffect(() => {
    if (!farmId) { setLoading(false); return; }
    getSoilAnalysis(farmId)
      .then(r => {
        setRawGrid(r.data.grid);
        setDataSource(r.data.source);
        setFetchedAt(r.data.fetched_at);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [farmId]);

  const metrics = [
    { name: 'Nitrogen (N)', icon: 'eco' },
    { name: 'Phosphorus (P)', icon: 'grain' },
    { name: 'Potassium (K)', icon: 'local_florist' },
    { name: 'Moisture', icon: 'water_drop' },
    { name: 'pH Level', icon: 'thermostat' },
  ];

  // Build display grid from API data
  const gridData = rawGrid
    ? rawGrid.map(z => ({
        zone: z.zone,
        val: z[METRIC_KEY[activeMetric]],
        ...classify(activeMetric, z[METRIC_KEY[activeMetric]]),
      }))
    : [];

  const activeCellData = gridData.find(c => c.zone === activeCell);
  const unit = UNIT[activeMetric];

  const optimal   = gridData.filter(c => c.status === 'Optimal').length;
  const adequate  = gridData.filter(c => c.status === 'Adequate').length;
  const moderate  = gridData.filter(c => c.status === 'Moderate').length;
  const deficient = gridData.filter(c => c.status === 'Deficient').length;
  const uniformityPct = gridData.length ? Math.round(((optimal + adequate) / 16) * 100) : 0;

  return (
    <div className="min-h-screen bg-surface text-on-surface flex flex-col relative">

      <main className="flex flex-col relative w-full pt-20 pb-24 bg-surface flex-1">
        {loading ? (
          <div className="flex flex-col items-center justify-center flex-1 gap-space-md pt-20">
            <span className="material-symbols-outlined text-[48px] text-primary animate-spin">progress_activity</span>
            <p className="font-body-md text-body-md text-on-surface-variant">Fetching satellite data...</p>
          </div>
        ) : (
        <div className="flex flex-col w-full px-gutter gap-space-md py-space-sm">
          {/* Header text */}
          <div className="flex flex-col gap-space-sm">
            <div className="flex items-center justify-between">
              <h1 className="font-headline-md text-headline-md text-on-surface tracking-tight">Soil Health Insights</h1>
              {/* Live data source badge */}
              {dataSource === 'open-meteo' ? (
                <span className="font-label-sm text-label-sm text-white bg-[#1b5e20] px-2 py-0.5 rounded-full flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-300 animate-pulse inline-block"></span>
                  Live · Open-Meteo
                </span>
              ) : (
                <span className="font-label-sm text-label-sm text-on-surface-variant bg-surface-container px-2 py-0.5 rounded-full">
                  Synthetic data
                </span>
              )}
            </div>
            {fetchedAt && (
              <p className="font-label-sm text-label-sm text-on-surface-variant">
                Last updated: {new Date(fetchedAt).toLocaleTimeString()} · Moisture anchored to real satellite reading
              </p>
            )}
            
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
                    {activeCellData.val} {unit}
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
              <span className="font-label-lg text-label-lg font-bold text-primary">{uniformityPct}% Balanced</span>
            </div>
            <div className="w-full bg-surface-container-high rounded-full h-3 overflow-hidden flex">
              <div className="bg-primary h-full rounded-full transition-all duration-500" style={{ width: `${uniformityPct}%` }}></div>
            </div>
            <div className="flex justify-between font-label-sm text-label-sm text-on-surface-variant">
              <span>{optimal} Zones Optimal</span>
              <span>{adequate} Adequate</span>
              <span className="text-secondary font-bold">{moderate + deficient} Need Attention</span>
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
        )} {/* end loading ternary */}
      </main>

    </div>
  );
}
