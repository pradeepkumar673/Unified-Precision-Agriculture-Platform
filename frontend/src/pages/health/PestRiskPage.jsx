import { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer 
} from 'recharts';
import { Bug, AlertTriangle, ShieldAlert, Map, RefreshCw } from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

export default function PestRiskPage() {
  const [district, setDistrict] = useState('Pune');
  const [riskData, setRiskData] = useState([]);
  const [surveillanceData, setSurveillanceData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchData = async () => {
    if (!district) return;
    setLoading(true);
    setError('');
    
    try {
      const [riskRes, survRes] = await Promise.all([
        axios.get(`${API_BASE}/api/v1/health/pest-risk-map?district=${district}`),
        axios.get(`${API_BASE}/api/v1/health/surveillance-map?district=${district}`)
      ]);
      setRiskData(riskRes.data);
      setSurveillanceData(survRes.data);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to fetch pest surveillance data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [district]);

  // Format data for Radar Chart (Risk Scores)
  const radarData = riskData.map(d => ({
    village: d.village_name,
    risk: Math.round(d.risk_score * 100),
    fullMark: 100
  }));

  // Format data for Bar Chart (Surveillance Counts)
  const barData = surveillanceData.length > 0 
    ? surveillanceData.map(d => ({ name: d.village || d.village_name || 'Unknown', cases: d.case_count ?? d.count ?? 0 }))
    : riskData.map(d => ({ name: d.village_name, cases: d.contributing_reports_count }));

  const highRiskVillages = riskData.filter(d => d.risk_score >= 0.7);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-orange-400 to-red-500">
            Pest & Disease Surveillance
          </h1>
          <p className="text-slate-400 mt-1">Regional risk heatmaps and community reporting data</p>
        </div>
        <div className="flex items-center space-x-2 bg-slate-800/50 p-1.5 rounded-lg border border-slate-700/50">
          <input
            value={district}
            onChange={e => setDistrict(e.target.value)}
            className="bg-slate-900 border border-slate-700 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/50 w-48 text-white"
            placeholder="District Name"
          />
          <button 
            onClick={fetchData}
            aria-label="Refresh data"
            className="w-11 h-11 flex items-center justify-center bg-orange-500/20 text-orange-400 rounded-md hover:bg-orange-500/30 transition-colors"
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

      {/* Alert Banner */}
      {highRiskVillages.length > 0 && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 flex items-start gap-4">
          <div className="bg-red-500/20 p-2 rounded-full shrink-0">
            <AlertTriangle className="w-6 h-6 text-red-400" />
          </div>
          <div>
            <h3 className="text-red-400 font-bold text-lg">High Risk Alert</h3>
            <p className="text-slate-300 text-sm mt-1">
              Elevated pest activity detected in <span className="font-semibold text-white">{highRiskVillages.map(v => v.village_name).join(', ')}</span>. 
              Preventive spraying recommended.
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Radar Chart */}
        <div className="bg-slate-800/40 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6 shadow-xl">
          <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
            <Bug className="w-5 h-5 text-orange-400" /> Village Risk Radar
          </h2>
          <div className="h-[350px] w-full">
            {radarData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                  <PolarGrid stroke="#334155" />
                  <PolarAngleAxis dataKey="village" tick={{ fill: '#94a3b8', fontSize: 12 }} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: '#64748b' }} />
                  <Radar name="Risk Score" dataKey="risk" stroke="#f97316" fill="#f97316" fillOpacity={0.4} />
                  <RechartsTooltip contentStyle={{ backgroundColor: '#1e293b', borderColor: '#475569', color: '#f8fafc' }} />
                </RadarChart>
              </ResponsiveContainer>
            ) : (
              <div className="w-full h-full flex items-center justify-center text-slate-500">No data available</div>
            )}
          </div>
        </div>

        {/* Bar Chart */}
        <div className="bg-slate-800/40 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6 shadow-xl">
          <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-red-400" /> Community Surveillance Cases
          </h2>
          <div className="h-[350px] w-full">
            {barData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                  <XAxis dataKey="name" stroke="#94a3b8" tick={{fill: '#94a3b8'}} axisLine={false} tickLine={false} />
                  <YAxis stroke="#f87171" axisLine={false} tickLine={false} />
                  <RechartsTooltip 
                    contentStyle={{ backgroundColor: '#1e293b', borderColor: '#475569', color: '#f8fafc' }}
                    cursor={{fill: 'rgba(255,255,255,0.05)'}}
                  />
                  <Bar dataKey="cases" name="Reported Cases" fill="#ef4444" radius={[4, 4, 0, 0]} barSize={40} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="w-full h-full flex items-center justify-center text-slate-500">No data available</div>
            )}
          </div>
        </div>

        {/* Heatmap Table */}
        <div className="lg:col-span-2 bg-slate-800/40 backdrop-blur-xl border border-slate-700/50 rounded-2xl overflow-hidden shadow-xl">
          <div className="px-6 py-4 border-b border-slate-700/50 bg-slate-900/40 flex justify-between items-center">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <Map className="w-5 h-5 text-blue-400" /> District Heatmap Data
            </h2>
            {riskData.length > 0 && (
              <span className="text-xs font-mono bg-slate-800 px-2 py-1 rounded text-slate-400 border border-slate-700">
                Model: {riskData[0].model_type || 'heuristic'}
              </span>
            )}
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-slate-400 uppercase bg-slate-900/60 border-b border-slate-700">
                <tr>
                  <th className="px-6 py-3">Village</th>
                  <th className="px-6 py-3">District</th>
                  <th className="px-6 py-3">Week Of</th>
                  <th className="px-6 py-3">Community Reports</th>
                  <th className="px-6 py-3">Risk Score</th>
                  <th className="px-6 py-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {riskData.length === 0 ? (
                  <tr><td colSpan="6" className="px-6 py-4 text-center text-slate-500">No records found.</td></tr>
                ) : riskData.map((row, idx) => (
                  <tr key={idx} className="border-b border-slate-700/30 hover:bg-slate-700/20 transition-colors">
                    <td className="px-6 py-4 font-medium text-white">{row.village_name}</td>
                    <td className="px-6 py-4 text-slate-400">{row.district}</td>
                    <td className="px-6 py-4 text-slate-400">{row.week_of}</td>
                    <td className="px-6 py-4">
                      <span className="bg-slate-800 text-slate-300 py-1 px-2 rounded font-mono">{row.contributing_reports_count}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-full bg-slate-700 rounded-full h-1.5 max-w-[80px]">
                          <div 
                            className={`h-1.5 rounded-full ${row.risk_score >= 0.7 ? 'bg-red-500' : row.risk_score >= 0.4 ? 'bg-orange-500' : 'bg-emerald-500'}`} 
                            style={{ width: `${row.risk_score * 100}%` }}
                          ></div>
                        </div>
                        <span className="text-xs font-mono text-slate-300">{(row.risk_score).toFixed(2)}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {row.risk_score >= 0.7 ? (
                        <span className="px-2 py-1 bg-red-500/20 text-red-400 text-xs font-bold rounded uppercase">Critical</span>
                      ) : row.risk_score >= 0.4 ? (
                        <span className="px-2 py-1 bg-orange-500/20 text-orange-400 text-xs font-bold rounded uppercase">Monitor</span>
                      ) : (
                        <span className="px-2 py-1 bg-emerald-500/20 text-emerald-400 text-xs font-bold rounded uppercase">Safe</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}

