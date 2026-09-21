import { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer
} from 'recharts';
import { 
  FileSpreadsheet, TrendingUp, TrendingDown, RefreshCw, 
  Lightbulb, IndianRupee, Calendar
} from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

export default function SeasonReportPage() {
  const [farmId, setFarmId] = useState(localStorage.getItem('farmId') || '');
  const [season, setSeason] = useState('kharif');
  const [year, setYear] = useState('2023');
  
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchReport = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await axios.get(`${API_BASE}/api/v1/community/season-report/${farmId}?season=${season}&year=${year}`);
      setReport(res.data);
    } catch (err) {
      setReport(null);
      setError(err.response?.data?.detail || 'Unable to load the season report.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-teal-400 to-cyan-500">
            End-of-Season Report
          </h1>
          <p className="text-slate-400 mt-1">Financial scorecard, ROI metrics, and AI agronomic insights</p>
        </div>
        
        <div className="flex items-center space-x-2 bg-slate-800/50 p-1.5 rounded-lg border border-slate-700/50">
          <input value={farmId} onChange={e=>setFarmId(e.target.value)} className="bg-slate-900 border border-slate-700 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/50 w-28 text-white font-mono"/>
          <select value={season} onChange={e=>setSeason(e.target.value)} className="bg-slate-900 border border-slate-700 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/50 text-white capitalize">
            <option value="kharif">Kharif</option>
            <option value="rabi">Rabi</option>
            <option value="zaid">Zaid</option>
          </select>
          <select value={year} onChange={e=>setYear(e.target.value)} className="bg-slate-900 border border-slate-700 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/50 text-white">
            <option value="2023">2023</option>
            <option value="2022">2022</option>
          </select>
          <button 
            onClick={fetchReport} 
            disabled={loading}
            aria-label="Refresh data"
            className="w-11 h-11 flex items-center justify-center bg-teal-500/20 text-teal-400 rounded-md hover:bg-teal-500/30 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {!report ? (
        <div className="h-64 flex items-center justify-center text-slate-500 border-2 border-dashed border-slate-700/50 rounded-2xl">Generating Report...</div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          
          {/* KPI Cards */}
          <div className="xl:col-span-1 space-y-6">
            <div className="bg-slate-800/40 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6 shadow-xl flex flex-col justify-center h-full min-h-[300px] relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10">
                <FileSpreadsheet className="w-32 h-32 text-teal-400" />
              </div>
              
              <h2 className="text-xl font-bold text-white mb-6 relative z-10">Season Summary</h2>
              
              <div className="space-y-6 relative z-10">
                <div>
                  <p className="text-slate-400 text-sm">Total Income</p>
                  <p className="text-3xl font-bold text-emerald-400 flex items-center gap-1">
                    <IndianRupee className="w-6 h-6"/> {report.income.toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-slate-400 text-sm">Total Investment</p>
                  <p className="text-2xl font-bold text-orange-400 flex items-center gap-1">
                    <IndianRupee className="w-5 h-5"/> {report.investment.toLocaleString()}
                  </p>
                </div>
                <div className="pt-4 border-t border-slate-700/50">
                  <div className="flex justify-between items-end">
                    <div>
                      <p className="text-slate-400 text-sm">Net Profit</p>
                      <p className="text-3xl font-bold text-white flex items-center gap-1">
                        <IndianRupee className="w-6 h-6"/> {report.profit.toLocaleString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-lg text-sm font-bold ${report.roi_pct >= 0 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                        {report.roi_pct >= 0 ? <TrendingUp className="w-4 h-4"/> : <TrendingDown className="w-4 h-4"/>}
                        {report.roi_pct}% ROI
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Chart */}
          <div className="xl:col-span-2 bg-slate-800/40 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6 shadow-xl">
             <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
               <Calendar className="w-5 h-5 text-teal-400" /> Income vs Investment Timeline
             </h3>
             <div className="h-[250px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={report.timeline} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorInvest" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f97316" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                    <XAxis dataKey="month" stroke="#94a3b8" tick={{fill: '#94a3b8', fontSize: 12}} tickLine={false} axisLine={false} />
                    <YAxis stroke="#94a3b8" tick={{fill: '#94a3b8', fontSize: 12}} tickLine={false} axisLine={false} tickFormatter={v => `₹${v/1000}k`} />
                    <RechartsTooltip 
                      contentStyle={{ backgroundColor: '#1e293b', borderColor: '#475569', borderRadius: '8px' }}
                      itemStyle={{ color: '#f8fafc' }}
                      formatter={(val) => `₹${val.toLocaleString()}`}
                    />
                    <Area type="monotone" dataKey="investment" name="Investment" stroke="#f97316" strokeWidth={3} fillOpacity={1} fill="url(#colorInvest)" />
                    <Area type="monotone" dataKey="income" name="Income" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorIncome)" />
                  </AreaChart>
                </ResponsiveContainer>
             </div>
          </div>

          {/* AI Suggestions */}
          <div className="xl:col-span-3 bg-slate-800/40 backdrop-blur-xl border border-cyan-500/30 rounded-2xl p-6 shadow-[0_0_20px_rgba(6,182,212,0.1)]">
             <h3 className="text-xl font-semibold text-cyan-400 mb-6 flex items-center gap-2">
               <Lightbulb className="w-6 h-6" /> AI Agronomic & Financial Suggestions
             </h3>
             <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
               {report.suggestions.map((sug, i) => (
                 <div key={i} className="bg-slate-900/60 border border-slate-700 p-4 rounded-xl flex items-start gap-3">
                   <div className="bg-cyan-500/20 text-cyan-400 w-8 h-8 rounded-full flex items-center justify-center shrink-0 font-bold">{i+1}</div>
                   <p className="text-slate-300 text-sm leading-relaxed">{sug}</p>
                 </div>
               ))}
             </div>
          </div>

        </div>
      )}
    </div>
  );
}

