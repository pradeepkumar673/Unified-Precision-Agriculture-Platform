import { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Map, Activity, AlertTriangle, Layers, Droplets, RefreshCw
} from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

export default function SoilHealthPage() {
  const [farmId, setFarmId] = useState('');
  const [activeLayer, setActiveLayer] = useState('n'); // n, p, k, ph
  const [gridData, setGridData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleGenerate = async () => {
    if (!farmId) return;
    setLoading(true);
    setError('');
    
    try {
      // Create some sparse readings for the backend interpolation
      const sparse_readings = [
        { lat: 18.52, lng: 73.85, n: 40, p: 20, k: 30, ph: 6.5 },
        { lat: 18.53, lng: 73.86, n: 20, p: 10, k: 40, ph: 7.2 },
        { lat: 18.51, lng: 73.84, n: 60, p: 30, k: 25, ph: 5.8 },
      ];

      const res = await axios.post(`${API_BASE}/api/v1/water_soil/soil-map`, {
        farm_id: farmId,
        sparse_readings
      });
      setGridData(res.data.grid_data || []);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to generate soil map');
    } finally {
      setLoading(false);
    }
  };

  const loadLatest = async () => {
    if (!farmId) return;
    setLoading(true);
    setError('');
    try {
      const res = await axios.get(`${API_BASE}/api/v1/water_soil/soil-map/${farmId}`);
      if(res.data && res.data.grid_data) {
        setGridData(res.data.grid_data);
      }
    } catch (err) {
      // Ignore 404, just let user generate
      if (err.response?.status !== 404) {
        setError(err.response?.data?.detail || 'Failed to load soil map');
      }
    } finally {
      setLoading(false);
    }
  };

  // Helper to determine cell color based on layer and value
  const getCellColor = (val, layer) => {
    // These thresholds are arbitrary for the visual demo
    if (layer === 'n') { // Nitrogen 0-100
      if (val < 25) return 'bg-orange-500/80';
      if (val < 50) return 'bg-yellow-500/80';
      if (val < 75) return 'bg-emerald-500/80';
      return 'bg-green-600/80';
    }
    if (layer === 'p') { // Phosphorus 0-50
      if (val < 15) return 'bg-red-500/80';
      if (val < 30) return 'bg-purple-400/80';
      return 'bg-purple-600/80';
    }
    if (layer === 'k') { // Potassium 0-100
      if (val < 30) return 'bg-rose-500/80';
      if (val < 60) return 'bg-pink-400/80';
      return 'bg-pink-600/80';
    }
    if (layer === 'ph') { // pH 0-14
      if (val < 5.5) return 'bg-orange-600/80'; // Acidic
      if (val > 8.0) return 'bg-blue-600/80'; // Alkaline
      return 'bg-teal-500/80'; // Optimal
    }
    return 'bg-slate-700';
  };

  // Calculate averages to show alerts
  let avgN = 0, avgP = 0, avgK = 0, avgPh = 0;
  if (gridData.length > 0) {
    gridData.forEach(cell => {
      avgN += cell.n; avgP += cell.p; avgK += cell.k; avgPh += cell.ph;
    });
    avgN /= gridData.length;
    avgP /= gridData.length;
    avgK /= gridData.length;
    avgPh /= gridData.length;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-green-500">
            Soil Health Grid
          </h1>
          <p className="text-slate-400 mt-1">20x20 interpolated NPK and pH spatial heatmap</p>
        </div>
        
        <div className="flex items-center space-x-2 bg-slate-800/50 p-1.5 rounded-lg border border-slate-700/50">
          <input
            value={farmId} onChange={e => setFarmId(e.target.value)} onBlur={loadLatest}
            className="bg-slate-900 border border-slate-700 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 w-48 text-white"
            placeholder="Farm ID..."
          />
          <button 
            onClick={handleGenerate} disabled={loading || !farmId}
            className="px-4 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-md text-sm font-medium transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Map className="w-4 h-4" />}
            Generate
          </button>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg text-sm">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* Sidebar Controls & Alerts */}
        <div className="lg:col-span-1 space-y-6">
          
          <div className="bg-slate-800/40 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-5 shadow-xl">
            <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
              <Layers className="w-4 h-4 text-slate-400" /> Active Layer
            </h3>
            <div className="space-y-2">
              {[
                { id: 'n', name: 'Nitrogen (N)', color: 'text-emerald-400', bg: 'bg-emerald-500/20 border-emerald-500/50' },
                { id: 'p', name: 'Phosphorus (P)', color: 'text-purple-400', bg: 'bg-purple-500/20 border-purple-500/50' },
                { id: 'k', name: 'Potassium (K)', color: 'text-pink-400', bg: 'bg-pink-500/20 border-pink-500/50' },
                { id: 'ph', name: 'Soil pH', color: 'text-teal-400', bg: 'bg-teal-500/20 border-teal-500/50' },
              ].map(layer => (
                <button
                  key={layer.id}
                  onClick={() => setActiveLayer(layer.id)}
                  className={`w-full text-left px-4 py-3 rounded-xl border transition-all ${activeLayer === layer.id ? layer.bg : 'bg-slate-900/50 border-slate-700 hover:border-slate-500'}`}
                >
                  <span className={`font-medium ${activeLayer === layer.id ? layer.color : 'text-slate-300'}`}>
                    {layer.name}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {gridData.length > 0 && (
            <div className="bg-slate-800/40 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-5 shadow-xl space-y-4">
              <h3 className="text-white font-semibold flex items-center gap-2">
                <Activity className="w-4 h-4 text-orange-400" /> Field Insights
              </h3>
              
              {avgN < 30 && (
                <div className="p-3 bg-orange-500/10 border border-orange-500/20 rounded-lg flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-orange-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-orange-400">Low Nitrogen</p>
                    <p className="text-xs text-slate-400 mt-1">Average N is {avgN.toFixed(1)}. Top dressing recommended in Zone 2.</p>
                  </div>
                </div>
              )}

              {avgPh < 6.0 && (
                <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg flex items-start gap-2">
                  <Droplets className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-blue-400">Acidic Soil Detected</p>
                    <p className="text-xs text-slate-400 mt-1">Average pH is {avgPh.toFixed(1)}. Lime application needed.</p>
                  </div>
                </div>
              )}

              {avgN >= 30 && avgPh >= 6.0 && (
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
                  <p className="text-sm font-semibold text-emerald-400">Optimal Baseline</p>
                  <p className="text-xs text-slate-400 mt-1">Overall field conditions are stable across key metrics.</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Heatmap Grid */}
        <div className="lg:col-span-3">
          <div className="bg-slate-800/40 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6 shadow-xl h-full min-h-[500px] flex flex-col">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-white capitalize">
                {activeLayer === 'ph' ? 'Soil pH' : `${activeLayer} Layer`} Map
              </h2>
              {gridData.length > 0 && (
                <span className="text-xs font-mono bg-slate-900 px-3 py-1 rounded-full border border-slate-700 text-emerald-400">
                  GaussianProcessRegressor
                </span>
              )}
            </div>

            {!gridData || gridData.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-slate-500 border-2 border-dashed border-slate-700/50 rounded-xl bg-slate-900/30">
                <Map className="w-16 h-16 mb-4 text-slate-600 opacity-50" />
                <p className="text-lg">Click Generate to interpolate sparse soil samples</p>
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center bg-slate-900/50 rounded-xl border border-slate-700 p-4">
                <div 
                  className="grid gap-0.5 w-full aspect-square max-w-[600px] max-h-[600px]" 
                  style={{ gridTemplateColumns: 'repeat(20, minmax(0, 1fr))', gridTemplateRows: 'repeat(20, minmax(0, 1fr))' }}
                >
                  {gridData.map((cell, idx) => {
                    const val = cell[activeLayer];
                    const colorClass = getCellColor(val, activeLayer);
                    return (
                      <div 
                        key={idx} 
                        className={`${colorClass} rounded-sm cursor-pointer transition-colors hover:brightness-125 relative group`}
                      >
                        {/* Tooltip on hover */}
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-10 w-max bg-slate-900 text-white text-xs py-1 px-2 rounded shadow-xl border border-slate-700 pointer-events-none">
                          <span className="uppercase text-slate-400">{activeLayer}:</span> <span className="font-bold">{val.toFixed(2)}</span>
                          <br/>
                          <span className="text-[9px] text-slate-500">({cell.lat.toFixed(4)}, {cell.lng.toFixed(4)})</span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
            
            {/* Legend */}
            {gridData.length > 0 && (
              <div className="mt-6 flex items-center justify-center gap-4 text-xs font-medium text-slate-400">
                <span>Low</span>
                <div className="h-2 w-48 rounded-full bg-gradient-to-r from-orange-500 via-yellow-500 to-green-600" />
                <span>High / Optimal</span>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
