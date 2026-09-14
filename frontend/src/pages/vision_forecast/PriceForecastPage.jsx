import { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceArea
} from 'recharts';
import { TrendingUp, RefreshCw, Calendar, IndianRupee } from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

export default function PriceForecastPage() {
  const [crop, setCrop] = useState('wheat');
  const [district, setDistrict] = useState('Pune');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const fetchForecast = async () => {
    if (!crop || !district) return;
    setLoading(true);
    setError('');
    
    try {
      const res = await axios.get(`${API_BASE}/api/v1/vision_forecast/price-forecast?crop=${crop}&district=${district}&weeks_ahead=4`);
      setResult(res.data);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to fetch price forecast');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchForecast();
  }, []);

  // Format data for Recharts
  // Prophet outputs a series. If backend just returns a basic list of dicts {date, price, lower, upper}
  // Let's ensure it maps correctly.
  const chartData = result?.forecast_series?.map(item => ({
    date: new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    price: Math.round(item.price),
    lower: Math.round(item.lower),
    upper: Math.round(item.upper),
    ciRange: [Math.round(item.lower), Math.round(item.upper)] // For Area chart filled range
  })) || [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-amber-400 to-orange-500">
            Mandi Price Forecast
          </h1>
          <p className="text-slate-400 mt-1">Prophet-based time-series forecasting for optimal selling dates</p>
        </div>
        
        <div className="flex items-center space-x-2 bg-slate-800/50 p-1.5 rounded-lg border border-slate-700/50">
          <input
            value={crop} onChange={e => setCrop(e.target.value)}
            className="bg-slate-900 border border-slate-700 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50 w-32 text-white capitalize"
            placeholder="Crop"
          />
          <input
            value={district} onChange={e => setDistrict(e.target.value)}
            className="bg-slate-900 border border-slate-700 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50 w-32 text-white capitalize"
            placeholder="District"
          />
          <button 
            onClick={fetchForecast}
            className="p-1.5 bg-amber-500/20 text-amber-400 rounded-md hover:bg-amber-500/30 transition-colors"
          >
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg text-sm">
          {error}
        </div>
      )}

      {result && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-slate-800/40 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6 shadow-xl relative">
              <div className="absolute top-0 right-0 p-3">
                <span className="text-[10px] font-mono text-slate-500 border border-slate-700 rounded px-1.5 py-0.5 bg-slate-900">
                  {result.model_type || 'prophet'}
                </span>
              </div>
              
              <h3 className="text-slate-400 text-sm font-medium mb-1">Expected Peak Price</h3>
              <div className="flex items-baseline gap-1 mb-4">
                <span className="text-4xl font-bold text-white flex items-center">
                  <IndianRupee className="w-8 h-8" />{Math.round(result.predicted_price)}
                </span>
                <span className="text-slate-400 text-sm">/ qtl</span>
              </div>

              <div className="space-y-4 pt-4 border-t border-slate-700/50">
                <div>
                  <p className="text-slate-400 text-xs mb-1">Confidence Interval (95%)</p>
                  <p className="text-amber-400 font-mono font-medium">₹{Math.round(result.low_ci)} - ₹{Math.round(result.high_ci)}</p>
                </div>
                <div>
                   <p className="text-slate-400 text-xs mb-1">Recommendation</p>
                   <p className="text-emerald-400 font-semibold text-sm flex items-center gap-1">
                     <TrendingUp className="w-4 h-4" /> Hold for 2 weeks
                   </p>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-3 bg-slate-800/40 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6 shadow-xl">
             <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
               <TrendingUp className="w-5 h-5 text-amber-500" /> 4-Week Price Trajectory
             </h3>
             <div className="h-[350px] w-full">
                {chartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="colorCi" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#94a3b8" stopOpacity={0.2}/>
                          <stop offset="95%" stopColor="#94a3b8" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                      <XAxis dataKey="date" stroke="#94a3b8" tick={{fill: '#94a3b8', fontSize: 12}} tickLine={false} axisLine={false} />
                      <YAxis stroke="#94a3b8" tick={{fill: '#94a3b8', fontSize: 12}} tickLine={false} axisLine={false} tickFormatter={v => `₹${v}`} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#1e293b', borderColor: '#475569', borderRadius: '8px' }}
                        itemStyle={{ color: '#f8fafc' }}
                      />
                      {/* CI Area */}
                      <Area type="monotone" dataKey="ciRange" stroke="none" fill="url(#colorCi)" />
                      {/* Main Line */}
                      <Area type="monotone" dataKey="price" stroke="#f59e0b" strokeWidth={3} fillOpacity={1} fill="url(#colorPrice)" />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-500">Not enough data to graph</div>
                )}
             </div>
          </div>
        </div>
      )}
    </div>
  );
}
