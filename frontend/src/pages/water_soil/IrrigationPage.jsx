import { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  RadialBarChart, RadialBar, PolarAngleAxis, ResponsiveContainer 
} from 'recharts';
import { 
  Droplets, CloudRain, Sun, CalendarClock, Activity, RefreshCw 
} from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

export default function IrrigationPage() {
  const [formData, setFormData] = useState({
    farm_id: localStorage.getItem('farmId') || '',
    crop: 'wheat',
    growth_stage: 'vegetative',
    current_moisture_pct: 45
  });
  
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);
  const [error, setError] = useState('');

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const fetchHistory = async () => {
    if (!formData.farm_id) return;
    try {
      const res = await axios.get(`${API_BASE}/api/v1/water_soil/irrigation-history/${formData.farm_id}`);
      setHistory(res.data);
    } catch (err) {
      console.error('Failed to load history:', err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const payload = {
        ...formData,
        current_moisture_pct: parseFloat(formData.current_moisture_pct)
      };

      const res = await axios.post(`${API_BASE}/api/v1/water_soil/irrigation-recommendation`, payload);
      setResult(res.data);
      fetchHistory();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to generate irrigation plan');
    } finally {
      setLoading(false);
    }
  };

  // Radial chart data for moisture
  const moistureData = [{ name: 'Moisture', value: formData.current_moisture_pct, fill: '#3b82f6' }];

  const scheduleDates = result ? [{
    date: new Date(result.next_irrigation_date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
    requiresWater: true,
    liters: result.recommended_liters_per_day,
  }] : [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-cyan-400">
          Smart Irrigation Planner
        </h1>
        <p className="text-slate-400 mt-1">Penman-Monteith ET0 based daily water requirement forecasting</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Form Controls */}
        <div className="bg-slate-800/40 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6 shadow-xl h-fit">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1">Farm ID</label>
              <input 
                name="farm_id" value={formData.farm_id} onChange={handleInputChange} onBlur={fetchHistory}
                className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500/50 outline-none text-white text-sm" 
                placeholder="Farm ID" required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1">Crop Type</label>
              <input 
                name="crop" value={formData.crop} onChange={handleInputChange} 
                className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500/50 outline-none text-white text-sm capitalize" 
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1">Growth Stage</label>
              <select 
                name="growth_stage" value={formData.growth_stage} onChange={handleInputChange} 
                className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500/50 outline-none text-white text-sm capitalize"
              >
                <option value="initial">Initial</option>
                <option value="vegetative">Vegetative</option>
                <option value="flowering">Flowering</option>
                <option value="maturity">Maturity</option>
              </select>
            </div>

            <div>
              <div className="flex justify-between mb-1">
                <label className="text-sm font-medium text-slate-400">Current Soil Moisture</label>
                <span className="text-sm text-blue-400">{formData.current_moisture_pct}%</span>
              </div>
              <input 
                type="range" name="current_moisture_pct" min="0" max="100" 
                value={formData.current_moisture_pct} onChange={handleInputChange} 
                className="w-full accent-blue-500"
              />
            </div>

            <button 
              type="submit" disabled={loading}
              className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-400 hover:to-cyan-400 text-white font-semibold py-3 px-4 rounded-xl shadow-[0_0_15px_rgba(59,130,246,0.4)] transition-all flex justify-center items-center gap-2 disabled:opacity-50"
            >
              {loading ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Droplets className="w-5 h-5" />}
              Calculate Requirement
            </button>
          </form>

          {error && (
            <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg text-sm">
              {error}
            </div>
          )}
        </div>

        {/* Dashboards */}
        <div className="lg:col-span-2 space-y-6">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Real-time status */}
            <div className="bg-slate-800/40 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6 shadow-xl flex flex-col items-center justify-center relative">
              <h3 className="text-slate-400 text-sm font-medium absolute top-4 left-4">Moisture Sensor</h3>
              
              <div className="h-40 w-40 mt-4 relative">
                <ResponsiveContainer width="100%" height="100%">
                  <RadialBarChart 
                    innerRadius="70%" outerRadius="100%" data={moistureData} 
                    startAngle={180} endAngle={0}
                  >
                    <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
                    <RadialBar minAngle={15} background={{ fill: '#1e293b' }} clockWise={true} dataKey="value" cornerRadius={10} />
                  </RadialBarChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center -mt-6">
                  <span className="text-4xl font-bold text-white">{formData.current_moisture_pct}%</span>
                </div>
              </div>
              <div className="text-center mt-2">
                {formData.current_moisture_pct < 30 ? (
                  <span className="text-orange-400 font-semibold flex items-center gap-1"><Activity className="w-4 h-4"/> Critical Low</span>
                ) : formData.current_moisture_pct > 80 ? (
                  <span className="text-cyan-400 font-semibold flex items-center gap-1"><Droplets className="w-4 h-4"/> Saturated</span>
                ) : (
                  <span className="text-emerald-400 font-semibold flex items-center gap-1"><CheckCircle className="w-4 h-4"/> Optimal Range</span>
                )}
              </div>
            </div>

            {/* Recommendation Result */}
            <div className="bg-slate-800/40 backdrop-blur-xl border border-blue-500/30 rounded-2xl p-6 shadow-[0_0_30px_rgba(59,130,246,0.1)] relative">
              <div className="absolute top-0 right-0 p-4">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-mono">
                  {result?.model_type || 'penman_monteith'}
                </span>
              </div>
              
              <h3 className="text-slate-400 text-sm font-medium mb-4">Daily Water Requirement</h3>
              
              {!result ? (
                <div className="h-24 flex items-center justify-center text-slate-500 italic text-sm">
                  Run calculation to view requirement
                </div>
              ) : (
                <>
                  <div className="flex items-baseline gap-2 mb-4">
                    <span className="text-5xl font-bold text-white">{result.recommended_liters_per_day.toFixed(1)}</span>
                    <span className="text-blue-400 font-medium">Liters / day</span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 mt-6">
                    <div className="bg-slate-900/50 p-3 rounded-xl border border-slate-700">
                      <p className="text-slate-400 text-xs mb-1 flex items-center gap-1"><Sun className="w-3.5 h-3.5"/> ET0 Value</p>
                      <p className="text-lg font-semibold text-cyan-400">{result.et0?.toFixed(2)} mm/day</p>
                    </div>
                    <div className="bg-slate-900/50 p-3 rounded-xl border border-slate-700">
                      <p className="text-slate-400 text-xs mb-1 flex items-center gap-1"><CalendarClock className="w-3.5 h-3.5"/> Next Irrigation</p>
                      <p className="text-lg font-semibold text-emerald-400">{result.next_irrigation_date}</p>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* 7-Day Schedule */}
          <div className="bg-slate-800/40 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <CloudRain className="w-5 h-5 text-blue-400" /> 7-Day Forecast & Schedule
            </h3>
            
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-3">
              {scheduleDates.map((day, i) => (
                <div key={i} className={`p-3 rounded-xl border flex flex-col items-center justify-center text-center transition-colors
                  ${day.requiresWater ? 'bg-blue-500/10 border-blue-500/30' : 'bg-slate-900/50 border-slate-700'}
                `}>
                  <span className="text-xs text-slate-400 mb-2">{day.date}</span>
                  {day.requiresWater ? (
                    <>
                      <Droplets className="w-6 h-6 text-blue-400 mb-1" />
                      <span className="text-xs font-bold text-white">{day.liters.toFixed(0)} L</span>
                    </>
                  ) : (
                    <>
                      <Sun className="w-6 h-6 text-slate-500 mb-1" />
                      <span className="text-xs font-medium text-slate-500">Skip</span>
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

function CheckCircle(props) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
      <polyline points="22 4 12 14.01 9 11.01"/>
    </svg>
  );
}


