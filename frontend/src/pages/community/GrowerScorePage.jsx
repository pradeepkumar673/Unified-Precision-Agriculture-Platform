import { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  RadialBarChart, RadialBar, PolarAngleAxis, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Cell
} from 'recharts';
import { 
  Award, Trophy, Leaf, IndianRupee, RefreshCw, Bell, AlertTriangle, CloudRain, Bug
} from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

export default function GrowerScorePage() {
  const [farmId, setFarmId] = useState('FARM-001');
  const [scoreData, setScoreData] = useState(null);
  const [loading, setLoading] = useState(false);
  
  // Alerts Tray state
  const [alerts, setAlerts] = useState([]);
  const [isAlertsOpen, setIsAlertsOpen] = useState(false);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // 1. Fetch Grower Score
      // const scoreRes = await axios.get(`${API_BASE}/api/v1/community/grower-score/${farmId}`);
      
      // 2. Fetch Alerts
      // const alertRes = await axios.get(`${API_BASE}/api/v1/community/alerts/${farmId}`);

      // Mock
      setTimeout(() => {
        setScoreData({
          score: 84,
          district_percentile: 92,
          factors: [
            { name: 'Consistently High ROI', value: 95 },
            { name: 'Punctual Repayments', value: 88 },
            { name: 'Eco/Green Practices', value: 72 },
            { name: 'Community SHG Activity', value: 65 },
          ]
        });
        
        setAlerts([
          { id: 1, type: 'weather', severity: 'high', title: 'Heavy Rainfall Expected', desc: '75mm rain expected in next 48 hrs. Delay urea spraying.' },
          { id: 2, type: 'pest', severity: 'medium', title: 'Fall Armyworm Risk', desc: 'Reported in 3 neighboring farms. Preventative spray recommended.' }
        ]);
        
        setLoading(false);
      }, 1000);

    } catch (err) {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const gaugeData = scoreData ? [{ name: 'Score', value: scoreData.score, fill: '#f59e0b' }] : [];
  
  const getAlertIcon = (type, severity) => {
    if (type === 'weather') return <CloudRain className={`w-5 h-5 ${severity === 'high' ? 'text-blue-400' : 'text-slate-400'}`} />;
    if (type === 'pest') return <Bug className={`w-5 h-5 ${severity === 'high' ? 'text-red-400' : 'text-orange-400'}`} />;
    return <AlertTriangle className="w-5 h-5 text-yellow-400" />;
  };

  return (
    <div className="space-y-6 relative">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-amber-400 to-orange-500">
            Grower Reputation Score
          </h1>
          <p className="text-slate-400 mt-1">Gamified reputation system unlocking premium marketplace tiers and loan rates</p>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex items-center space-x-2 bg-slate-800/50 p-1.5 rounded-lg border border-slate-700/50">
             <span className="text-sm text-slate-400 px-2">Farm ID:</span>
             <input
               value={farmId} onChange={e => setFarmId(e.target.value)} onBlur={fetchDashboardData}
               className="bg-slate-900 border border-slate-700 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50 w-32 text-white font-mono"
             />
          </div>
          
          <button 
            onClick={() => setIsAlertsOpen(!isAlertsOpen)}
            className="relative p-2 bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-600 transition-colors"
          >
            <Bell className="w-6 h-6 text-slate-300" />
            {alerts.length > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                {alerts.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Floating Alerts Tray */}
      {isAlertsOpen && (
        <div className="absolute top-16 right-0 w-80 bg-slate-800 border border-slate-700 shadow-2xl rounded-2xl z-50 overflow-hidden animate-in slide-in-from-top-4">
          <div className="p-4 bg-slate-900/80 border-b border-slate-700 flex justify-between items-center">
            <h3 className="font-bold text-white flex items-center gap-2"><Bell className="w-4 h-4 text-amber-400"/> Smart Alerts</h3>
            <span className="text-xs text-slate-400">{alerts.length} unread</span>
          </div>
          <div className="max-h-96 overflow-y-auto">
            {alerts.length === 0 ? (
              <div className="p-8 text-center text-slate-500">No new alerts</div>
            ) : alerts.map(a => (
              <div key={a.id} className="p-4 border-b border-slate-700 hover:bg-slate-700/50 transition-colors flex gap-3 cursor-pointer">
                <div className="shrink-0 mt-0.5">{getAlertIcon(a.type, a.severity)}</div>
                <div>
                  <h4 className="text-sm font-bold text-white mb-1">{a.title}</h4>
                  <p className="text-xs text-slate-400">{a.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {loading || !scoreData ? (
        <div className="h-64 flex items-center justify-center text-slate-500 border-2 border-dashed border-slate-700/50 rounded-2xl">Calculating Score...</div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Main Dial */}
          <div className="bg-slate-800/40 backdrop-blur-xl border border-amber-500/30 rounded-2xl p-6 shadow-[0_0_20px_rgba(245,158,11,0.15)] flex flex-col items-center relative">
            <div className="absolute top-0 right-0 p-4">
               <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-bold">
                 <Trophy className="w-3.5 h-3.5"/> Top {100 - scoreData.district_percentile}% in District
               </span>
            </div>
            
            <h2 className="text-xl font-bold text-white mb-2 self-start flex items-center gap-2">
              <Award className="w-6 h-6 text-amber-400" /> Reputation Score
            </h2>
            
            <div className="h-64 w-full relative mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <RadialBarChart innerRadius="70%" outerRadius="100%" data={gaugeData} startAngle={180} endAngle={0}>
                  <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
                  <RadialBar minAngle={15} background={{ fill: '#1e293b' }} clockWise={true} dataKey="value" cornerRadius={10} />
                </RadialBarChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center mt-12">
                <span className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-br from-amber-300 to-orange-500">
                  {scoreData.score}
                </span>
                <span className="text-slate-400 font-medium uppercase tracking-widest text-sm mt-1">Excellent</span>
              </div>
            </div>
            
            <p className="text-center text-sm text-slate-300 mt-4 max-w-sm">
              Your high score unlocks <strong>Tier 1 pricing</strong> in the marketplace and prioritizes your produce in B2B Exchange matches.
            </p>
          </div>

          {/* Factor Breakdown */}
          <div className="bg-slate-800/40 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6 shadow-xl">
             <h3 className="text-lg font-semibold text-white mb-6">Score Composition</h3>
             <div className="space-y-6">
               {scoreData.factors.map((f, i) => (
                 <div key={i}>
                   <div className="flex justify-between text-sm mb-2">
                     <span className="text-slate-300 font-medium">{f.name}</span>
                     <span className="text-amber-400 font-bold">{f.value}/100</span>
                   </div>
                   <div className="w-full bg-slate-900 rounded-full h-3 border border-slate-700 overflow-hidden">
                     <div 
                       className="h-full bg-gradient-to-r from-amber-500 to-orange-400"
                       style={{ width: `${f.value}%` }}
                     ></div>
                   </div>
                 </div>
               ))}
             </div>
             
             <div className="mt-8 pt-6 border-t border-slate-700/50 grid grid-cols-2 gap-4">
                <div className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-xl flex items-center gap-3">
                  <div className="bg-emerald-500/20 p-2 rounded-lg text-emerald-400"><Leaf className="w-5 h-5"/></div>
                  <div>
                    <p className="text-xs text-slate-400">Eco-Bonus</p>
                    <p className="text-sm font-bold text-emerald-400">+5 pts this season</p>
                  </div>
                </div>
                <div className="bg-blue-500/10 border border-blue-500/20 p-4 rounded-xl flex items-center gap-3">
                  <div className="bg-blue-500/20 p-2 rounded-lg text-blue-400"><IndianRupee className="w-5 h-5"/></div>
                  <div>
                    <p className="text-xs text-slate-400">Loan Rate</p>
                    <p className="text-sm font-bold text-blue-400">0.5% Discount</p>
                  </div>
                </div>
             </div>
          </div>
          
        </div>
      )}
    </div>
  );
}
