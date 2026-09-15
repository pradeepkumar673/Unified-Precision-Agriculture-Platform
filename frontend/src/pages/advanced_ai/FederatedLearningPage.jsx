import { useState } from 'react';
import axios from 'axios';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Legend
} from 'recharts';
import { 
  Network, Shield, Play, CheckCircle, Database, RefreshCw
} from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

export default function FederatedLearningPage() {
  const [isSimulating, setIsSimulating] = useState(false);
  const [currentRound, setCurrentRound] = useState(0);
  const [data, setData] = useState([]);
  const [error, setError] = useState('');
  const [nodes] = useState(['Farm_A (Maharashtra)', 'Farm_B (Punjab)', 'Farm_C (MP)', 'Farm_D (Karnataka)']);

  const triggerRound = async () => {
    if (isSimulating) return;
    setIsSimulating(true);
    
    try {
      const res = await axios.post(`${API_BASE}/api/v1/advanced_ai/federated/trigger-round`);
      setCurrentRound(res.data.rounds_completed);
      setData(res.data.round_accuracies.map((accuracy, index) => ({
        round: index + 1,
        global_acc: accuracy,
      })));
      setError('');
    } catch (err) {
      setError(err.response?.data?.detail || 'Federated training failed.');
    } finally {
      setIsSimulating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-blue-500">
            Federated Learning (Flower FL)
          </h1>
          <p className="text-slate-400 mt-1">Train global disease models across edge farm nodes without sharing private data</p>
        </div>
        
        <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 px-3 py-1.5 rounded-full flex items-center gap-2 text-sm font-bold shadow-[0_0_15px_rgba(16,185,129,0.2)]">
          <Shield className="w-4 h-4" /> Zero-Trust Privacy Active
        </div>
      </div>

      {error && <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg text-sm">{error}</div>}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* Nodes Panel */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-slate-800/40 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-5 shadow-xl">
            <h2 className="text-white font-semibold flex items-center gap-2 mb-4">
              <Network className="w-5 h-5 text-blue-400" /> Edge Nodes
            </h2>
            <div className="space-y-3">
              {nodes.map((node, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-slate-900 rounded-lg border border-slate-700">
                  <div className="flex items-center gap-2">
                    <Database className="w-4 h-4 text-slate-500" />
                    <span className="text-sm text-slate-300">{node}</span>
                  </div>
                  {isSimulating ? (
                    <span className="w-2 h-2 rounded-full bg-blue-500 animate-ping"></span>
                  ) : currentRound > 0 ? (
                    <CheckCircle className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <span className="w-2 h-2 rounded-full bg-slate-600"></span>
                  )}
                </div>
              ))}
            </div>
          </div>
          
          <button 
            onClick={triggerRound} disabled={isSimulating || currentRound >= 5}
            className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold rounded-2xl shadow-lg transition-all flex justify-center items-center gap-2 disabled:opacity-50"
          >
            {isSimulating ? (
              <><RefreshCw className="w-5 h-5 animate-spin" /> Training Round {currentRound}/5</>
            ) : currentRound >= 5 ? (
              <><CheckCircle className="w-5 h-5" /> Global Model Synced</>
            ) : (
              <><Play className="w-5 h-5" /> Trigger FedAvg Epochs</>
            )}
          </button>
        </div>

        {/* Chart Panel */}
        <div className="lg:col-span-3 bg-slate-800/40 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6 shadow-xl flex flex-col">
           <div className="flex justify-between items-center mb-6">
             <h3 className="text-lg font-semibold text-white">Global Model Accuracy Progression</h3>
             {currentRound > 0 && (
               <div className="bg-slate-900 px-3 py-1 rounded text-sm text-slate-400 border border-slate-700">
                 Current Acc: <span className="text-emerald-400 font-bold font-mono">{(data[data.length-1].global_acc * 100).toFixed(1)}%</span>
               </div>
             )}
           </div>

           <div className="flex-1 min-h-[300px] w-full">
             <ResponsiveContainer width="100%" height="100%">
               <LineChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                 <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                 <XAxis dataKey="round" stroke="#94a3b8" tick={{fill: '#94a3b8'}} tickLine={false} axisLine={false} />
                 <YAxis stroke="#94a3b8" tick={{fill: '#94a3b8'}} tickLine={false} axisLine={false} domain={[0, 1]} tickFormatter={v => `${(v*100).toFixed(0)}%`} />
                 <RechartsTooltip 
                   contentStyle={{ backgroundColor: '#1e293b', borderColor: '#475569', borderRadius: '8px' }}
                   itemStyle={{ color: '#f8fafc' }}
                   formatter={(val) => `${(val*100).toFixed(1)}%`}
                 />
                 <Legend wrapperStyle={{ paddingTop: '20px' }} />
                 <Line type="monotone" dataKey="global_acc" name="Global Aggregated Accuracy" stroke="#10b981" strokeWidth={4} dot={{ r: 6, fill: '#10b981', strokeWidth: 2, stroke: '#1e293b' }} activeDot={{ r: 8 }} />
                 <Line type="monotone" dataKey="node1_loss" name="Node 1 Local Loss" stroke="#ef4444" strokeWidth={2} strokeDasharray="5 5" dot={false} />
                 <Line type="monotone" dataKey="node2_loss" name="Node 2 Local Loss" stroke="#f59e0b" strokeWidth={2} strokeDasharray="5 5" dot={false} />
               </LineChart>
             </ResponsiveContainer>
           </div>
        </div>
        
      </div>
    </div>
  );
}
