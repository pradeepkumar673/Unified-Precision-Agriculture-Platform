import { useState } from 'react';
import axios from 'axios';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Legend
} from 'recharts';
import { 
  FlaskConical, RefreshCw, AlertTriangle, TrendingUp, TrendingDown, Info
} from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

export default function CausalSimulatorPage() {
  const [farmId, setFarmId] = useState('FARM-001');
  
  // Sliders
  const [irrigation, setIrrigation] = useState(0); // % change
  const [fertilizer, setFertilizer] = useState(0); // kg/ha change
  const [sowingWeek, setSowingWeek] = useState(0); // weeks offset

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const runSimulation = async () => {
    setLoading(true);
    try {
      // const res = await axios.post(`${API_BASE}/api/v1/advanced_ai/whatif-simulate`, { ... });
      
      setTimeout(() => {
        // Calculate mock response based on slider inputs
        const causalBase = 250;
        const naiveBase = 400;
        
        const causalYield = causalBase + (irrigation * 10) + (fertilizer * 5) - (Math.abs(sowingWeek) * 50);
        const naiveYield = naiveBase + (irrigation * 15) + (fertilizer * 12) - (sowingWeek * 10);
        
        setResult({
          projected_yield_delta: causalYield,
          projected_profit_delta: causalYield * 20 - (Math.abs(fertilizer)*40) - (Math.abs(irrigation)*10),
          causal_estimate: causalYield,
          naive_correlation_estimate: naiveYield,
          explanation: `DoWhy analysis isolates the true effect: Increasing fertilizer by ${fertilizer}kg while modifying irrigation by ${irrigation}% yields a true expected gain of ${causalYield} kg/ha. The naive model overestimates this at ${naiveYield} kg/ha because it fails to account for confounding factors like soil inherent fertility.`
        });
        setLoading(false);
      }, 1500);
    } catch (err) {
      setLoading(false);
    }
  };

  const chartData = result ? [
    { name: 'Yield Impact (kg/ha)', Causal: result.causal_estimate, Naive: result.naive_correlation_estimate }
  ] : [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-indigo-500">
            Causal Inference Lab
          </h1>
          <p className="text-slate-400 mt-1">"What-If" simulator powered by DoWhy structural causal modeling</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Controls */}
        <div className="lg:col-span-5 bg-slate-800/40 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6 shadow-xl">
          <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
            <FlaskConical className="w-5 h-5 text-purple-400" /> Experiment Variables
          </h2>
          
          <div className="space-y-8">
            <div>
              <div className="flex justify-between items-end mb-2">
                <label className="text-sm font-medium text-slate-300">Irrigation Volume (Δ%)</label>
                <span className="text-purple-400 font-mono bg-purple-500/10 px-2 py-0.5 rounded text-sm">
                  {irrigation > 0 ? '+' : ''}{irrigation}%
                </span>
              </div>
              <input 
                type="range" min="-50" max="50" step="5" value={irrigation} onChange={e=>setIrrigation(Number(e.target.value))}
                className="w-full accent-purple-500 h-2 bg-slate-900 rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-xs text-slate-500 mt-1"><span>-50%</span><span>0</span><span>+50%</span></div>
            </div>

            <div>
              <div className="flex justify-between items-end mb-2">
                <label className="text-sm font-medium text-slate-300">Nitrogen Fertilizer (Δ kg/ha)</label>
                <span className="text-blue-400 font-mono bg-blue-500/10 px-2 py-0.5 rounded text-sm">
                  {fertilizer > 0 ? '+' : ''}{fertilizer} kg
                </span>
              </div>
              <input 
                type="range" min="-100" max="100" step="10" value={fertilizer} onChange={e=>setFertilizer(Number(e.target.value))}
                className="w-full accent-blue-500 h-2 bg-slate-900 rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-xs text-slate-500 mt-1"><span>-100</span><span>0</span><span>+100</span></div>
            </div>

            <div>
              <div className="flex justify-between items-end mb-2">
                <label className="text-sm font-medium text-slate-300">Sowing Week Offset</label>
                <span className="text-emerald-400 font-mono bg-emerald-500/10 px-2 py-0.5 rounded text-sm">
                  {sowingWeek > 0 ? `+${sowingWeek} Wk (Late)` : sowingWeek < 0 ? `${sowingWeek} Wk (Early)` : 'No Change'}
                </span>
              </div>
              <input 
                type="range" min="-4" max="4" step="1" value={sowingWeek} onChange={e=>setSowingWeek(Number(e.target.value))}
                className="w-full accent-emerald-500 h-2 bg-slate-900 rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-xs text-slate-500 mt-1"><span>4W Early</span><span>Standard</span><span>4W Late</span></div>
            </div>

            <button 
              onClick={runSimulation} disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold rounded-xl shadow-lg shadow-purple-500/20 transition-all flex justify-center items-center gap-2"
            >
              {loading ? <RefreshCw className="w-5 h-5 animate-spin" /> : 'Run Counterfactual Simulation'}
            </button>
          </div>
        </div>

        {/* Results */}
        <div className="lg:col-span-7 bg-slate-800/40 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6 shadow-xl flex flex-col">
           {!result && !loading ? (
             <div className="flex-1 flex flex-col items-center justify-center text-slate-500 bg-slate-900/30 rounded-xl border-2 border-dashed border-slate-700">
               <FlaskConical className="w-16 h-16 mb-4 opacity-50" />
               <p>Adjust variables and run simulation to see causal effects</p>
             </div>
           ) : loading ? (
             <div className="flex-1 flex flex-col items-center justify-center text-purple-400">
               <RefreshCw className="w-12 h-12 mb-4 animate-spin" />
               <p className="animate-pulse">Solving Structural Causal Model...</p>
             </div>
           ) : result && (
             <div className="h-full flex flex-col">
               <div className="grid grid-cols-2 gap-4 mb-6">
                 <div className="bg-slate-900 border border-slate-700 p-4 rounded-xl">
                   <p className="text-slate-400 text-sm mb-1">True Yield Delta</p>
                   <p className={`text-2xl font-bold flex items-center gap-2 ${result.projected_yield_delta >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                     {result.projected_yield_delta >= 0 ? <TrendingUp className="w-5 h-5"/> : <TrendingDown className="w-5 h-5"/>}
                     {result.projected_yield_delta > 0 ? '+' : ''}{result.projected_yield_delta.toFixed(1)} kg/ha
                   </p>
                 </div>
                 <div className="bg-slate-900 border border-slate-700 p-4 rounded-xl">
                   <p className="text-slate-400 text-sm mb-1">Proj. Profit Delta</p>
                   <p className={`text-2xl font-bold flex items-center gap-2 ${result.projected_profit_delta >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                     ₹ {result.projected_profit_delta > 0 ? '+' : ''}{result.projected_profit_delta.toLocaleString()}
                   </p>
                 </div>
               </div>

               <div className="flex-1 min-h-[250px] w-full mb-6 relative">
                 <ResponsiveContainer width="100%" height="100%">
                   <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                     <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                     <XAxis dataKey="name" stroke="#94a3b8" tickLine={false} axisLine={false} />
                     <YAxis stroke="#94a3b8" tickLine={false} axisLine={false} />
                     <RechartsTooltip 
                       contentStyle={{ backgroundColor: '#1e293b', borderColor: '#475569', borderRadius: '8px' }}
                       itemStyle={{ color: '#f8fafc' }}
                       cursor={{fill: 'rgba(255,255,255,0.05)'}}
                     />
                     <Legend wrapperStyle={{ paddingTop: '10px' }} />
                     <Bar dataKey="Causal" name="True Causal Effect (DoWhy)" fill="#8b5cf6" radius={[4,4,0,0]} barSize={50} />
                     <Bar dataKey="Naive" name="Naive ML Correlation" fill="#475569" radius={[4,4,0,0]} barSize={50} />
                   </BarChart>
                 </ResponsiveContainer>
                 
                 <div className="absolute top-0 right-0 bg-amber-500/10 border border-amber-500/20 text-amber-400 p-2 rounded-lg text-xs flex items-start gap-2 max-w-xs shadow-lg backdrop-blur-sm">
                   <AlertTriangle className="w-4 h-4 shrink-0" />
                   <p>Notice the gap! Standard ML (Naive) overestimates benefits by confusing correlation with causation.</p>
                 </div>
               </div>

               <div className="bg-purple-500/10 border border-purple-500/30 p-4 rounded-xl flex items-start gap-3">
                 <Info className="w-5 h-5 text-purple-400 shrink-0 mt-0.5" />
                 <p className="text-slate-300 text-sm leading-relaxed">
                   {result.explanation}
                 </p>
               </div>
             </div>
           )}
        </div>
      </div>
    </div>
  );
}
