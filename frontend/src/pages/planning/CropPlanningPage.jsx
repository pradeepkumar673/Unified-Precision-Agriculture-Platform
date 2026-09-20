import { useState } from 'react';
import axios from 'axios';
import { Sprout, Calendar, Bot, IndianRupee, Info, CheckCircle, RefreshCw } from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

export default function CropPlanningPage() {
  const [formData, setFormData] = useState({
    farm_id: localStorage.getItem('farmId') || '',
    season: 'kharif',
    year: new Date().getFullYear()
  });
  
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const res = await axios.post(`${API_BASE}/api/v1/planning/crop-plan`, {
        ...formData,
        year: parseInt(formData.year)
      });
      setResult(res.data);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to generate crop plan');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white">Crop Planning</h1>
        <p className="mt-1 text-slate-300">Get recommendations based on soil, season, and farm conditions.</p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="h-fit rounded-2xl border border-slate-800 bg-slate-900/80 p-6 shadow-[0_10px_30px_rgba(2,6,23,0.35)]">
          <h2 className="mb-6 flex items-center gap-2 text-xl font-semibold text-white">
            <Sprout className="h-5 w-5 text-emerald-400" /> Plan Parameters
          </h2>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1">Farm ID</label>
              <input 
                name="farm_id" 
                value={formData.farm_id} 
                onChange={handleInputChange} 
                className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-4 py-2 focus:ring-2 focus:ring-emerald-500/50 outline-none text-white" 
                placeholder="Enter Farm ID"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1">Season</label>
              <select 
                name="season" 
                value={formData.season} 
                onChange={handleInputChange} 
                className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-4 py-2 focus:ring-2 focus:ring-emerald-500/50 outline-none text-white capitalize"
              >
                <option value="kharif">Kharif (Monsoon)</option>
                <option value="rabi">Rabi (Winter)</option>
                <option value="zaid">Zaid (Summer)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1">Year</label>
              <input 
                type="number" 
                name="year" 
                value={formData.year} 
                onChange={handleInputChange} 
                className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-4 py-2 focus:ring-2 focus:ring-emerald-500/50 outline-none text-white" 
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 font-medium text-emerald-300 transition hover:bg-emerald-500/15 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? <RefreshCw className="h-5 w-5 animate-spin" /> : <Bot className="h-5 w-5" />}
              Generate Plan
            </button>
          </form>

          {error && (
            <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg text-sm">
              {error}
            </div>
          )}
        </div>

        {/* Results Card */}
        <div className="lg:col-span-2">
          {!result ? (
            <div className="h-full min-h-[400px] flex flex-col items-center justify-center text-slate-500 border-2 border-dashed border-slate-700/50 rounded-2xl bg-slate-800/20 backdrop-blur-sm">
              <Bot className="w-16 h-16 mb-4 text-slate-600 opacity-50" />
              <p className="text-lg">Submit parameters to generate AI recommendation</p>
            </div>
          ) : (
            <div className="relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/80 p-6 shadow-[0_10px_30px_rgba(2,6,23,0.35)]">
              <div className="absolute right-0 top-0 p-4">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-mono">
                  <Bot className="w-3 h-3" />
                  {result.model_type || 'xgboost_planner'}
                </span>
              </div>

              <h2 className="text-2xl font-bold text-white mb-8 flex items-center gap-3">
                <CheckCircle className="w-6 h-6 text-emerald-400" />
                Recommendation Ready
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                <div>
                  <p className="text-slate-400 text-sm mb-1">Recommended Crop</p>
                  <p className="text-4xl font-bold text-white capitalize">{result.recommended_crop}</p>
                </div>
                
                <div className="flex items-center gap-4">
                  <div className="relative w-20 h-20">
                    <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                      <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#1e293b" strokeWidth="3" />
                      <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#34d399" strokeWidth="3" strokeDasharray={`${(result.confidence || 0.85) * 100}, 100`} />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center flex-col">
                      <span className="text-sm font-bold text-white">{Math.round((result.confidence || 0.85) * 100)}%</span>
                    </div>
                  </div>
                  <div>
                    <p className="text-slate-400 text-sm mb-1">AI Confidence</p>
                    <p className="text-emerald-400 font-medium">High Match</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-8 p-4 bg-slate-900/50 rounded-xl border border-slate-700">
                <div>
                  <p className="text-slate-400 text-sm flex items-center gap-1 mb-1">
                    <Calendar className="w-4 h-4" /> Est. Sowing Date
                  </p>
                  <p className="font-semibold text-white">{result.sowing_date || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-slate-400 text-sm flex items-center gap-1 mb-1">
                    <IndianRupee className="w-4 h-4" /> Expected Investment
                  </p>
                  <p className="font-semibold text-white">₹{result.expected_investment?.toLocaleString() || 'N/A'} / acre</p>
                </div>
              </div>

              <div className="border-t border-slate-700/50 pt-6 mt-6">
                <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                  <Info className="w-5 h-5 text-cyan-400" /> Agronomy Reasoning
                </h3>
                <div className="text-slate-300 text-sm leading-relaxed whitespace-pre-wrap bg-slate-900/30 p-4 rounded-lg border border-slate-700/30">
                  {result.reasoning}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


