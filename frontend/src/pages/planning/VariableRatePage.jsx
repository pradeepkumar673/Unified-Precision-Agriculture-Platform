import { useState, useEffect } from 'react';
import axios from 'axios';
import { Download, Map, List, FlaskConical, Bug, Sprout, Loader2 } from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

export default function VariableRatePage() {
  const [farmId, setFarmId] = useState('');
  const [crop, setCrop] = useState('wheat');
  const [zones, setZones] = useState([]);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleFetchZones = async () => {
    if (!farmId) return;
    try {
      const res = await axios.get(`${API_BASE}/api/v1/farm/${farmId}/zones`);
      setZones(res.data);
      setError('');
    } catch (err) {
      setZones([]);
      setError(err.response?.data?.detail || 'Unable to load farm zones.');
    }
  };

  const handleGenerate = async () => {
    if (!farmId || zones.length === 0) return;
    setLoading(true);
    setError('');
    
    try {
      const res = await axios.post(`${API_BASE}/api/v1/planning/variable-rate`, {
        farm_id: farmId,
        crop: crop,
        zones: zones
      });
      setResult(res.data);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to generate variable rate map');
    } finally {
      setLoading(false);
    }
  };

  const downloadGeoJson = async () => {
    try {
      const res = await axios.get(`${API_BASE}/api/v1/planning/variable-rate/${result.id}/export`, { responseType: 'blob' });
      const url = URL.createObjectURL(res.data);
      const a = document.createElement('a');
      a.href = url;
      a.download = `VRA_Prescription_${farmId}.geojson`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err.response?.data?.detail || 'Unable to export prescription.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-cyan-400">
            Variable Rate Application (VRA)
          </h1>
          <p className="text-slate-400 mt-1">Generate zone-specific input prescriptions for smart tractors</p>
        </div>
        {result && (
          <button 
            onClick={downloadGeoJson}
            className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-medium rounded-lg flex items-center gap-2 transition-colors shadow-lg shadow-emerald-500/20"
          >
            <Download className="w-4 h-4" /> Export GeoJSON
          </button>
        )}
      </div>

      <div className="bg-slate-800/40 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-4 flex flex-wrap gap-4 items-end">
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1">Farm ID</label>
          <input 
            value={farmId} onChange={e => setFarmId(e.target.value)} onBlur={handleFetchZones}
            className="bg-slate-900 border border-slate-700 rounded-md px-3 py-2 text-sm text-white focus:ring-1 focus:ring-emerald-500 outline-none w-48"
            placeholder="Farm ID..."
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1">Target Crop</label>
          <input 
            value={crop} onChange={e => setCrop(e.target.value)} 
            className="bg-slate-900 border border-slate-700 rounded-md px-3 py-2 text-sm text-white focus:ring-1 focus:ring-emerald-500 outline-none w-48"
          />
        </div>
        <button 
          onClick={handleGenerate}
          disabled={loading || zones.length === 0}
          className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white font-medium rounded-md flex items-center gap-2 transition-colors disabled:opacity-50"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Map className="w-4 h-4" />}
          Generate VRA Map
        </button>
      </div>

      {error && (
        <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg text-sm">
          {error}
        </div>
      )}

      {result ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {result.zone_prescriptions?.map((zp, i) => (
            <div key={i} className="bg-slate-800/60 border border-slate-700 rounded-xl overflow-hidden hover:border-emerald-500/50 transition-colors">
              <div className="bg-slate-900/80 px-4 py-3 border-b border-slate-700 flex justify-between items-center">
                <span className="font-bold text-white flex items-center gap-2">
                  <Map className="w-4 h-4 text-emerald-400" /> Zone {zp.zone_id}
                </span>
              </div>
              <div className="p-4 space-y-4">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2 text-slate-400 text-sm">
                    <Sprout className="w-4 h-4 text-emerald-400" /> Seed Rate
                  </div>
                  <span className="font-mono text-white bg-slate-900 px-2 py-1 rounded text-sm">
                    {zp.seed_rate_kg.toFixed(1)} kg/ha
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2 text-slate-400 text-sm">
                    <FlaskConical className="w-4 h-4 text-cyan-400" /> Fertilizer
                  </div>
                  <span className="font-mono text-white bg-slate-900 px-2 py-1 rounded text-sm">
                    {zp.fertilizer_kg.toFixed(1)} kg/ha
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2 text-slate-400 text-sm">
                    <Bug className="w-4 h-4 text-orange-400" /> Pesticide
                  </div>
                  <span className="font-mono text-white bg-slate-900 px-2 py-1 rounded text-sm">
                    {zp.pesticide_ml.toFixed(1)} ml/ha
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="h-64 flex flex-col items-center justify-center text-slate-500 border-2 border-dashed border-slate-700/50 rounded-2xl bg-slate-800/20 backdrop-blur-sm">
          <List className="w-12 h-12 mb-3 text-slate-600" />
          <p>No prescriptions generated yet.</p>
        </div>
      )}
    </div>
  );
}
