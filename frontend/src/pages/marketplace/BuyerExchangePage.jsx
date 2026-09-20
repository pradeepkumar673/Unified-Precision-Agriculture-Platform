import { useState } from 'react';
import axios from 'axios';
import { 
  Building2, Users, Search, Target, Briefcase, RefreshCw, Handshake
} from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

export default function BuyerExchangePage() {
  const [buyerId, setBuyerId] = useState('BUY-999');
  const [formData, setFormData] = useState({
    crop: 'wheat',
    qty_needed_kg: 5000,
    quality_grade: 'A',
    price_offered: 2100
  });

  const [loading, setLoading] = useState(false);
  const [matchResult, setMatchResult] = useState(null);
  const [error, setError] = useState('');

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const submitRequirement = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const reqPayload = {
        buyer_id: buyerId,
        ...formData,
        qty_needed_kg: parseFloat(formData.qty_needed_kg),
        price_offered: parseFloat(formData.price_offered)
      };
      const reqRes = await axios.post(`${API_BASE}/api/v1/marketplace/buyer-requirement`, reqPayload);
      const matchRes = await axios.post(`${API_BASE}/api/v1/marketplace/exchange-match`, {
        buyer_requirement_id: reqRes.data.id
      });
      setMatchResult(matchRes.data);
      
    } catch (err) {
      setError('Failed to process buyer requirement match');
      setLoading(false);
    }
  };

  // Progress calculations
  const percentFilled = matchResult ? Math.min(100, (matchResult.aggregated_qty_kg / Number(formData.qty_needed_kg)) * 100) : 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-indigo-500">
            B2B Buyer Exchange
          </h1>
          <p className="text-slate-400 mt-1">Aggregating farmer supply to meet large-scale industrial demand</p>
        </div>
        
        <div className="flex items-center space-x-2 bg-slate-800/50 p-1.5 rounded-lg border border-slate-700/50">
           <span className="text-sm text-slate-400 px-2">Buyer ID:</span>
           <input
             value={buyerId} onChange={e => setBuyerId(e.target.value)}
             className="bg-slate-900 border border-slate-700 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 w-32 text-white font-mono"
           />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Post Requirement Form */}
        <div className="bg-slate-800/40 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6 shadow-xl h-fit">
          <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
            <Building2 className="w-5 h-5 text-blue-400" /> Post Demand
          </h2>
          
          <form onSubmit={submitRequirement} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1">Target Crop</label>
              <input 
                name="crop" value={formData.crop} onChange={handleInputChange} 
                className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500/50 outline-none text-white capitalize" 
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1">Required Quantity (kg)</label>
              <input 
                type="number" name="qty_needed_kg" value={formData.qty_needed_kg} onChange={handleInputChange} 
                className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500/50 outline-none text-white font-mono" 
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Quality</label>
                <select 
                  name="quality_grade" value={formData.quality_grade} onChange={handleInputChange} 
                  className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500/50 outline-none text-white"
                >
                  <option value="A">Grade A</option>
                  <option value="B">Grade B</option>
                  <option value="C">Grade C</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Price Offer (₹/qtl)</label>
                <input 
                  type="number" name="price_offered" value={formData.price_offered} onChange={handleInputChange} 
                  className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500/50 outline-none text-white font-mono" 
                />
              </div>
            </div>

            <button 
              type="submit" disabled={loading}
              className="w-full mt-4 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-400 hover:to-indigo-500 text-white font-semibold py-3 px-4 rounded-xl shadow-[0_0_15px_rgba(59,130,246,0.4)] transition-all flex justify-center items-center gap-2 disabled:opacity-50"
            >
              {loading ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Target className="w-5 h-5" />}
              Find Farmer Clusters
            </button>
          </form>
        </div>

        {/* Matching Results */}
        <div className="lg:col-span-2 space-y-6">
          {!matchResult ? (
             <div className="h-full min-h-[400px] flex flex-col items-center justify-center text-slate-500 border-2 border-dashed border-slate-700/50 rounded-2xl bg-slate-800/20 backdrop-blur-sm">
               <Briefcase className="w-16 h-16 mb-4 text-slate-600 opacity-50" />
               <p className="text-lg">Submit a requirement to run the Bipartite Matching algorithm</p>
             </div>
          ) : (
            <>
              {/* Aggregation Progress */}
              <div className="bg-slate-800/40 backdrop-blur-xl border border-indigo-500/30 rounded-2xl p-6 shadow-[0_0_30px_rgba(79,70,229,0.15)] relative">
                <div className="absolute top-0 right-0 p-4">
                  <span className="text-[10px] font-mono text-indigo-400 border border-indigo-500/30 rounded px-1.5 py-0.5 bg-indigo-500/10">
                    {matchResult.model_type}
                  </span>
                </div>
                
                <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                  <Handshake className="w-6 h-6 text-indigo-400" /> Match Results
                </h2>

                <div className="mb-6">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-slate-400">Aggregated Volume</span>
                    <span className="text-white font-bold">{matchResult.aggregated_qty_kg.toLocaleString()} / {formData.qty_needed_kg.toLocaleString()} kg</span>
                  </div>
                  <div className="w-full bg-slate-900 rounded-full h-4 border border-slate-700 relative overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 relative"
                      style={{ width: `${percentFilled}%` }}
                    >
                       <div className="absolute inset-0 bg-white/20" style={{ backgroundSize: '1rem 1rem', backgroundImage: 'linear-gradient(45deg,rgba(255,255,255,.15) 25%,transparent 25%,transparent 50%,rgba(255,255,255,.15) 50%,rgba(255,255,255,.15) 75%,transparent 75%,transparent)' }}></div>
                    </div>
                  </div>
                  <div className="flex justify-between text-xs mt-2">
                    <span className="text-indigo-400 font-medium">Match Score: {(matchResult.match_score * 100).toFixed(1)}%</span>
                    <span className={`font-bold ${matchResult.status === 'PARTIAL_FILL' ? 'text-amber-400' : 'text-emerald-400'}`}>
                      {matchResult.status}
                    </span>
                  </div>
                </div>

                {/* Clustered Farms */}
                <div className="mt-8">
                  <h3 className="text-slate-400 text-sm font-medium mb-3 flex items-center gap-2">
                    <Users className="w-4 h-4" /> Contributing Farm Clusters ({(matchResult.matched_farm_ids || matchResult.farm_ids || []).length})
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {(matchResult.matched_farm_ids || matchResult.farm_ids || []).map(id => (
                      <div key={id} className="bg-slate-900 border border-slate-700 px-3 py-1.5 rounded-lg flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                        <span className="text-sm font-mono text-slate-300">{id}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-8 pt-6 border-t border-slate-700/50 flex justify-end">
                  <button className="px-6 py-2 bg-indigo-500 hover:bg-indigo-600 text-white font-semibold rounded-xl shadow-lg transition-colors">
                    Execute Contract
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
