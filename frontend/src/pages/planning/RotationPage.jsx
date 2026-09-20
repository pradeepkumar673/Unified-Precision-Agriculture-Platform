import { useState } from 'react';
import axios from 'axios';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, ReferenceLine 
} from 'recharts';
import { Activity, Bot, TrendingUp, AlertTriangle, RefreshCw } from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

export default function RotationPage() {
  const [formData, setFormData] = useState({
    farm_id: localStorage.getItem('farmId') || '',
    soil_nitrogen: 40,
    soil_organic_carbon: 1.5,
    last_3_crops: 'wheat, cotton, wheat'
  });
  
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const payload = {
        ...formData,
        soil_nitrogen: parseFloat(formData.soil_nitrogen),
        soil_organic_carbon: parseFloat(formData.soil_organic_carbon),
        last_3_crops: formData.last_3_crops.split(',').map(s => s.trim()).filter(Boolean)
      };

      const res = await axios.post(`${API_BASE}/api/v1/planning/rotation-plan`, payload);
      setResult(res.data);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to optimize rotation');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const chartData = result ? [
    { season: 'Recommended next season', profit: result.projected_profit, soilDelta: result.projected_soil_impact },
  ] : [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-cyan-400">
          RL Rotation Optimizer
        </h1>
        <p className="text-slate-400 mt-1">Reinforcement Learning agent for sustainable long-term yield</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Input Parameters */}
        <div className="bg-slate-800/40 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6 shadow-xl h-fit">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1">Farm ID</label>
              <input 
                name="farm_id" 
                value={formData.farm_id} 
                onChange={handleInputChange} 
                className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-4 py-2 focus:ring-2 focus:ring-emerald-500/50 outline-none text-white" 
                placeholder="Farm ID"
                required
              />
            </div>
            
            <div>
              <div className="flex justify-between mb-1">
                <label className="text-sm font-medium text-slate-400">Soil Nitrogen (N)</label>
                <span className="text-sm text-emerald-400">{formData.soil_nitrogen} kg/ha</span>
              </div>
              <input 
                type="range" name="soil_nitrogen" min="10" max="150" 
                value={formData.soil_nitrogen} onChange={handleInputChange} 
                className="w-full accent-emerald-500"
              />
            </div>

            <div>
              <div className="flex justify-between mb-1">
                <label className="text-sm font-medium text-slate-400">Soil Organic Carbon</label>
                <span className="text-sm text-cyan-400">{formData.soil_organic_carbon}%</span>
              </div>
              <input 
                type="range" name="soil_organic_carbon" min="0.1" max="3.0" step="0.1"
                value={formData.soil_organic_carbon} onChange={handleInputChange} 
                className="w-full accent-cyan-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1">Last 3 Crops (comma separated)</label>
              <input 
                name="last_3_crops" 
                value={formData.last_3_crops} 
                onChange={handleInputChange} 
                className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-4 py-2 focus:ring-2 focus:ring-emerald-500/50 outline-none text-white text-sm" 
              />
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-400 hover:to-indigo-400 text-white font-semibold py-3 px-4 rounded-xl shadow-[0_0_15px_rgba(59,130,246,0.4)] transition-all flex justify-center items-center gap-2 disabled:opacity-50"
            >
              {loading ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Activity className="w-5 h-5" />}
              Run RL Optimizer
            </button>
          </form>

          {error && (
            <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg text-sm">
              {error}
            </div>
          )}
        </div>

        {/* Results Area */}
        <div className="lg:col-span-2 space-y-6">
          {!result ? (
            <div className="h-full min-h-[400px] flex flex-col items-center justify-center text-slate-500 border-2 border-dashed border-slate-700/50 rounded-2xl bg-slate-800/20 backdrop-blur-sm">
              <TrendingUp className="w-16 h-16 mb-4 text-slate-600 opacity-50" />
              <p className="text-lg">Run the RL model to see 5-season projection</p>
            </div>
          ) : (
            <>
              {/* Highlight Card */}
              <div className="bg-slate-800/40 backdrop-blur-xl border border-blue-500/30 rounded-2xl p-6 shadow-[0_0_30px_rgba(59,130,246,0.1)] relative">
                <div className="absolute top-0 right-0 p-4">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-mono">
                    <Bot className="w-3 h-3" />
                    {result.model_type || 'ppo_agent'}
                  </span>
                </div>
                
                <h3 className="text-slate-400 text-sm mb-1 uppercase tracking-wider">Optimal Next Crop</h3>
                <div className="flex items-end gap-4 mb-4">
                  <span className="text-4xl font-bold text-white capitalize">{result.next_crop}</span>
                  {result.projected_soil_impact > 0 ? (
                    <span className="flex items-center text-emerald-400 text-sm font-medium mb-1">
                      <TrendingUp className="w-4 h-4 mr-1" /> Soil Recovery
                    </span>
                  ) : (
                    <span className="flex items-center text-orange-400 text-sm font-medium mb-1">
                      <AlertTriangle className="w-4 h-4 mr-1" /> High Extraction
                    </span>
                  )}
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-700">
                    <p className="text-slate-400 text-xs mb-1">Projected Profit</p>
                    <p className="text-xl font-semibold text-emerald-400">₹{Math.round(result.projected_profit).toLocaleString()}</p>
                  </div>
                  <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-700">
                    <p className="text-slate-400 text-xs mb-1">Soil Impact Score</p>
                    <p className={`text-xl font-semibold ${result.projected_soil_impact > 0 ? 'text-emerald-400' : 'text-orange-400'}`}>
                      {result.projected_soil_impact > 0 ? '+' : ''}{result.projected_soil_impact.toFixed(1)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Chart */}
              <div className="bg-slate-800/40 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6 shadow-xl h-[350px]">
                <h3 className="text-lg font-semibold text-white mb-6">5-Season Projection</h3>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                    <XAxis dataKey="season" stroke="#94a3b8" tick={{fill: '#94a3b8'}} axisLine={false} tickLine={false} />
                    <YAxis yAxisId="left" stroke="#34d399" tickFormatter={(v) => `₹${v/1000}k`} axisLine={false} tickLine={false} />
                    <YAxis yAxisId="right" orientation="right" stroke="#38bdf8" axisLine={false} tickLine={false} />
                    <RechartsTooltip 
                      contentStyle={{ backgroundColor: '#1e293b', borderColor: '#475569', color: '#f8fafc' }}
                      itemStyle={{ color: '#f8fafc' }}
                    />
                    <Bar yAxisId="left" dataKey="profit" name="Profit (₹)" fill="#34d399" radius={[4, 4, 0, 0]} barSize={30} />
                    <Bar yAxisId="right" dataKey="soilDelta" name="Soil Impact" fill="#38bdf8" radius={[4, 4, 0, 0]} barSize={20} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}


