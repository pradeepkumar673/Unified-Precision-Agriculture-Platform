import { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Legend
} from 'recharts';
import { 
  Network, Shield, Play, CheckCircle, Database, RefreshCw, BarChart2
} from 'lucide-react';
import { getFarmProfile } from '../../api/farmApi';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

export default function FederatedLearningPage() {
  const [isSimulating, setIsSimulating] = useState(false);
  const [currentRound, setCurrentRound] = useState(0);
  const [finalAccuracy, setFinalAccuracy] = useState(null);
  const [data, setData] = useState([]);
  const [participatingFarms, setParticipatingFarms] = useState([]);
  const [error, setError] = useState('');
  
  const [nodes, setNodes] = useState([
    'Farm_A (Maharashtra)', 
    'Farm_B (Punjab)', 
    'Farm_C (MP)', 
    'Farm_D (Karnataka)'
  ]);

  useEffect(() => {
    const farmId = localStorage.getItem('farmId');
    if (farmId) {
      getFarmProfile(farmId).then(res => {
        if (res.data && res.data.name) {
          const farmStr = `${res.data.name} (${res.data.state || 'Local'})`;
          setNodes([
            farmStr,
            'Shetkari Node (Maharashtra)',
            'Kisan Hub (Punjab)',
            'Agri Edge (Karnataka)'
          ]);
        }
      }).catch(err => console.error("Failed to fetch farm profile for FL nodes", err));
    }
  }, []);

  const triggerRound = async () => {
    if (isSimulating) return;
    setIsSimulating(true);
    setError('');
    
    try {
      const res = await axios.post(`${API_BASE}/api/v1/advanced_ai/federated/trigger-round`, {}, {
        timeout: 120000
      });
      const d = res.data;
      const roundAccuracies = d.round_accuracies || [];
      setCurrentRound(d.rounds_completed || roundAccuracies.length);
      setFinalAccuracy(d.aggregate_accuracy ?? (roundAccuracies[roundAccuracies.length - 1] ?? null));
      
      const count = d.participating_farm_count || 4;
      setParticipatingFarms(nodes.slice(0, count));
      
      setData(roundAccuracies.map((accuracy, index) => ({
        round: index + 1,
        global_acc: typeof accuracy === 'number' ? accuracy : 0,
      })));
    } catch (err) {
      setError(err.response?.data?.detail || err.message || 'Federated training failed.');
    } finally {
      setIsSimulating(false);
    }
  };

  const reset = () => {
    setCurrentRound(0);
    setFinalAccuracy(null);
    setData([]);
    setParticipatingFarms([]);
    setError('');
  };

  return (
    <div className="space-y-6 pb-28 px-margin pt-4">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="font-headline-md text-headline-md font-bold bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-blue-500">
            Federated Learning (Flower FL)
          </h1>
          <p className="font-body-md text-on-surface-variant mt-1">Train global disease models across edge farm nodes without sharing private data</p>
        </div>
        
        <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 px-4 py-2 rounded-full flex items-center gap-2 font-label-sm font-bold shadow-[0_0_15px_rgba(16,185,129,0.2)] self-start">
          <Shield className="w-4 h-4" /> Zero-Trust Privacy Active
        </div>
      </div>

      {error && <div className="p-4 bg-error-container text-on-error-container rounded-xl font-body-sm shadow-sm">{error}</div>}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-space-md">
        
        {/* Nodes Panel */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-surface-container-low border border-surface-container rounded-2xl p-space-md shadow-sm">
            <h2 className="text-on-surface font-title-md font-bold flex items-center gap-2 mb-4">
              <Network className="w-5 h-5 text-primary" /> Edge Nodes
            </h2>
            <div className="space-y-3">
              {(participatingFarms.length > 0 ? participatingFarms : nodes).map((node, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-surface rounded-xl border border-outline-variant">
                  <div className="flex items-center gap-2">
                    <Database className="w-4 h-4 text-on-surface-variant shrink-0" />
                    <span className="font-label-sm text-on-surface truncate max-w-[160px]" title={node}>{node}</span>
                  </div>
                  {isSimulating ? (
                    <span className="w-2.5 h-2.5 rounded-full bg-primary animate-ping"></span>
                  ) : currentRound > 0 ? (
                    <CheckCircle className="w-4 h-4 text-emerald-500" />
                  ) : (
                    <span className="w-2.5 h-2.5 rounded-full bg-surface-container-high"></span>
                  )}
                </div>
              ))}
            </div>
          </div>
          
          <button 
            onClick={triggerRound} disabled={isSimulating}
            className="w-full h-14 bg-primary text-on-primary font-label-lg font-bold rounded-2xl shadow-sm transition-all flex justify-center items-center gap-2 disabled:opacity-50 active:scale-95"
          >
            {isSimulating ? (
              <><RefreshCw className="w-5 h-5 animate-spin" /> Running {currentRound > 0 ? `Round ${currentRound}/5` : 'FedAvg...'}</>
            ) : currentRound >= 5 ? (
              <><CheckCircle className="w-5 h-5" /> Re-run FedAvg</>
            ) : (
              <><Play className="w-5 h-5 fill-current" /> Trigger FedAvg Epochs</>
            )}
          </button>
          {currentRound > 0 && !isSimulating && (
            <button
              onClick={reset}
              className="w-full h-12 bg-surface-container-high hover:bg-surface-container-highest text-on-surface font-label-md rounded-xl transition-colors active:scale-95"
            >
              Reset Simulation
            </button>
          )}
        </div>

        {/* Chart Panel */}
        <div className="lg:col-span-3 bg-surface-container-lowest border border-surface-container rounded-2xl p-space-md shadow-sm flex flex-col">
           <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
             <h3 className="font-title-lg font-bold text-on-surface">Global Model Accuracy Progression</h3>
             <div className="flex items-center gap-3">
               {isSimulating && (
                 <span className="font-label-sm text-primary bg-primary/10 border border-primary/20 px-3 py-1.5 rounded-full animate-pulse">
                   Training across {(participatingFarms.length || 4)} farms...
                 </span>
               )}
               {finalAccuracy !== null && (
                 <div className="bg-surface-container px-3 py-1.5 rounded-lg font-label-sm text-on-surface-variant border border-outline-variant">
                   Final Accuracy: <span className="text-emerald-500 font-bold font-mono">{(finalAccuracy * 100).toFixed(1)}%</span>
                 </div>
               )}
             </div>
           </div>

           <div className="flex-1 min-h-[350px] w-full flex items-center justify-center">
             {data.length === 0 && !isSimulating ? (
                <div className="flex flex-col items-center gap-3 text-on-surface-variant/50">
                  <BarChart2 className="w-16 h-16 opacity-30" />
                  <p className="font-label-md">Start FedAvg simulation to view training progression</p>
                </div>
             ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--md-sys-color-outline-variant)" vertical={false} opacity={0.5} />
                    <XAxis dataKey="round" stroke="var(--md-sys-color-on-surface-variant)" tick={{fill: 'var(--md-sys-color-on-surface-variant)'}} tickLine={false} axisLine={false} />
                    <YAxis stroke="var(--md-sys-color-on-surface-variant)" tick={{fill: 'var(--md-sys-color-on-surface-variant)'}} tickLine={false} axisLine={false} domain={[0, 1]} tickFormatter={v => `${(v*100).toFixed(0)}%`} />
                    <RechartsTooltip 
                      contentStyle={{ backgroundColor: 'var(--md-sys-color-surface-container-high)', borderColor: 'var(--md-sys-color-outline-variant)', borderRadius: '8px' }}
                      itemStyle={{ color: 'var(--md-sys-color-on-surface)', fontWeight: 'bold' }}
                      formatter={(val) => `${(val*100).toFixed(1)}%`}
                    />
                    <Legend wrapperStyle={{ paddingTop: '20px' }} />
                    <Line type="monotone" dataKey="global_acc" name="Global Aggregated Accuracy" stroke="var(--md-sys-color-primary)" strokeWidth={4} dot={{ r: 6, fill: 'var(--md-sys-color-primary)', strokeWidth: 2, stroke: 'var(--md-sys-color-surface)' }} activeDot={{ r: 8 }} />
                  </LineChart>
                </ResponsiveContainer>
             )}
           </div>
        </div>
        
      </div>
    </div>
  );
}
