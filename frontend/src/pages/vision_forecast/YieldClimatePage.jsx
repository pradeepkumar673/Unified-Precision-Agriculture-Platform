import { useState } from 'react';
import axios from 'axios';
import { 
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Cell
} from 'recharts';
import { CloudLightning, TrendingUp, ThermometerSun, Waves, RefreshCw } from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

export default function YieldClimatePage() {
  const [farmId, setFarmId] = useState(localStorage.getItem('farmId') || '');
  const [crop, setCrop] = useState('wheat');
  const [loading, setLoading] = useState(false);
  
  const [yieldResult, setYieldResult] = useState(null);
  const [climateResult, setClimateResult] = useState(null);
  const [error, setError] = useState('');

  const fetchForecasts = async () => {
    if (!farmId) return;
    setLoading(true);
    setError('');
    
    try {
      const [yieldRes, climateRes] = await Promise.all([
        axios.post(`${API_BASE}/api/v1/vision_forecast/yield-forecast`, { farm_id: farmId, crop }),
        axios.get(`${API_BASE}/api/v1/vision_forecast/climate-risk/${farmId}`)
      ]);
      setYieldResult(yieldRes.data);
      setClimateResult(climateRes.data);
    } catch (err) {
      setError('Failed to fetch forecasts. Ensure both Yield and Climate endpoints are running.');
    } finally {
      setLoading(false);
    }
  };

  const radarData = climateResult ? [
    { metric: 'Drought', value: Math.round((climateResult.drought_risk || 0) * 100) },
    { metric: 'Flood', value: Math.round((climateResult.flood_risk || 0) * 100) },
    { metric: 'Heatwave', value: Math.round((climateResult.heat_risk || 0) * 100) },
    { metric: 'Overall', value: Math.round(((climateResult.drought_risk + climateResult.flood_risk + climateResult.heat_risk) / 3) * 100) },
  ] : [];

  const yieldData = yieldResult ? [
    { name: 'Low (P10)', value: yieldResult.low_kg, fill: '#ef4444' },
    { name: 'Median (P50)', value: yieldResult.median_kg, fill: '#f59e0b' },
    { name: 'High (P90)', value: yieldResult.high_kg, fill: '#10b981' }
  ] : [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-teal-400 to-emerald-500">
            Yield & Climate Risk
          </h1>
          <p className="text-slate-400 mt-1">Quantile yield predictions and macro-climate hazard assessment</p>
        </div>
        
        <div className="flex items-center space-x-2 bg-slate-800/50 p-1.5 rounded-lg border border-slate-700/50">
          <input
            value={farmId} onChange={e => setFarmId(e.target.value)}
            className="bg-slate-900 border border-slate-700 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/50 w-40 text-white"
            placeholder="Farm ID..."
          />
          <input
            value={crop} onChange={e => setCrop(e.target.value)}
            className="bg-slate-900 border border-slate-700 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/50 w-32 text-white capitalize"
            placeholder="Crop"
          />
          <button 
            onClick={fetchForecasts} disabled={loading}
            className="p-1.5 bg-teal-500/20 text-teal-400 rounded-md hover:bg-teal-500/30 transition-colors disabled:opacity-50"
          >
            {loading ? <RefreshCw className="w-5 h-5 animate-spin" /> : <RefreshCw className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg text-sm">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Yield Quantiles */}
        <div className="bg-slate-800/40 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6 shadow-xl relative">
          <div className="absolute top-0 right-0 p-4">
            <span className="text-[10px] font-mono text-slate-500 border border-slate-700 rounded px-1.5 py-0.5 bg-slate-900">
              {yieldResult?.model_type || 'quantile_regressor'}
            </span>
          </div>
          
          <h2 className="text-xl font-semibold text-white mb-2 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-emerald-400" /> Yield Forecast Range
          </h2>
          <p className="text-slate-400 text-sm mb-6">Probabilistic estimates in kg based on historical and current inputs</p>

          {!yieldResult ? (
            <div className="h-64 flex items-center justify-center text-slate-500 border-2 border-dashed border-slate-700/50 rounded-xl">
              Enter details and run forecast
            </div>
          ) : (
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={yieldData} layout="vertical" margin={{ top: 0, right: 30, left: 20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" horizontal={false} />
                  <XAxis type="number" stroke="#94a3b8" tick={{fill: '#94a3b8'}} axisLine={false} tickLine={false} />
                  <YAxis type="category" dataKey="name" stroke="#cbd5e1" tick={{fill: '#cbd5e1', fontSize: 13}} axisLine={false} tickLine={false} />
                  <RechartsTooltip 
                    contentStyle={{ backgroundColor: '#1e293b', borderColor: '#475569', borderRadius: '8px' }}
                    itemStyle={{ color: '#f8fafc' }}
                    cursor={{fill: 'rgba(255,255,255,0.05)'}}
                  />
                  <Bar dataKey="value" name="Yield (kg)" radius={[0, 4, 4, 0]} barSize={30}>
                    {yieldData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Climate Risk Radar */}
        <div className="bg-slate-800/40 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6 shadow-xl relative">
          <div className="absolute top-0 right-0 p-4">
            <span className="text-[10px] font-mono text-slate-500 border border-slate-700 rounded px-1.5 py-0.5 bg-slate-900">
              {climateResult?.model_type || 'climate_ensemble'}
            </span>
          </div>

          <h2 className="text-xl font-semibold text-white mb-2 flex items-center gap-2">
            <CloudLightning className="w-5 h-5 text-teal-400" /> Climate Hazard Risk
          </h2>
          <p className="text-slate-400 text-sm mb-6">Probability of extreme weather events impacting the season</p>

          {!climateResult ? (
            <div className="h-64 flex items-center justify-center text-slate-500 border-2 border-dashed border-slate-700/50 rounded-xl">
              Enter details and run forecast
            </div>
          ) : (
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                  <PolarGrid stroke="#334155" />
                  <PolarAngleAxis dataKey="metric" tick={{ fill: '#e2e8f0', fontSize: 12 }} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: '#64748b' }} />
                  <Radar name="Risk %" dataKey="value" stroke="#14b8a6" fill="#14b8a6" fillOpacity={0.4} />
                  <RechartsTooltip contentStyle={{ backgroundColor: '#1e293b', borderColor: '#475569', color: '#f8fafc' }} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

