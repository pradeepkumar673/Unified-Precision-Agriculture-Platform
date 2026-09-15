import { useState } from 'react';
import axios from 'axios';
import { 
  RadialBarChart, RadialBar, PolarAngleAxis, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Cell
} from 'recharts';
import { 
  BadgeIndianRupee, Activity, CheckCircle, AlertTriangle, 
  FileText, Landmark, RefreshCw
} from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

export default function CreditLoanPage() {
  const [farmId, setFarmId] = useState('FARM-001');
  const [amount, setAmount] = useState(50000);
  
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const handleApply = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const res = await axios.post(`${API_BASE}/api/v1/finance/loan/apply`, {
        farm_id: farmId,
        amount: parseFloat(amount)
      });
      setResult(res.data);
    } catch (err) {
      setError(err.response?.data?.detail || 'Loan application failed.');
    } finally {
      setLoading(false);
    }
  };

  // Credit Score Gauge Data (Max 900)
  const scoreData = result ? [{ 
    name: 'Score', 
    value: result.credit_score, 
    fill: result.credit_score > 700 ? '#10b981' : result.credit_score > 550 ? '#f59e0b' : '#ef4444' 
  }] : [];

  // Format SHAP factors for Recharts
  const factorData = result?.top_factors?.map(f => ({
    name: f.feature,
    impact: f.impact,
    fill: f.impact > 0 ? '#10b981' : '#ef4444'
  })) || [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-teal-500">
            AI Credit Scoring & Micro-Loans
          </h1>
          <p className="text-slate-400 mt-1">Instant loan approval based on farm health and alternative data</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Application Form */}
        <div className="bg-slate-800/40 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6 shadow-xl h-fit">
          <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
            <Landmark className="w-5 h-5 text-emerald-400" /> Loan Application
          </h2>
          
          <form onSubmit={handleApply} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1">Farm ID</label>
              <input 
                value={farmId} onChange={e => setFarmId(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 focus:ring-2 focus:ring-emerald-500/50 outline-none text-white font-mono" 
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1">Requested Amount (₹)</label>
              <div className="relative">
                <BadgeIndianRupee className="w-5 h-5 absolute left-3 top-2.5 text-slate-500" />
                <input 
                  type="number" value={amount} onChange={e => setAmount(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-10 pr-4 py-2 focus:ring-2 focus:ring-emerald-500/50 outline-none text-white text-lg font-bold" 
                />
              </div>
            </div>

            <button 
              type="submit" disabled={loading}
              className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white font-semibold py-3 px-4 rounded-xl shadow-[0_0_15px_rgba(16,185,129,0.4)] transition-all flex justify-center items-center gap-2 disabled:opacity-50"
            >
              {loading ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Activity className="w-5 h-5" />}
              Assess Credit Risk
            </button>
          </form>

          {error && (
            <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg text-sm">
              {error}
            </div>
          )}
        </div>

        {/* Results */}
        <div className="lg:col-span-2 space-y-6">
          {!result ? (
            <div className="h-full min-h-[400px] flex flex-col items-center justify-center text-slate-500 border-2 border-dashed border-slate-700/50 rounded-2xl bg-slate-800/20 backdrop-blur-sm">
              <Activity className="w-16 h-16 mb-4 text-slate-600 opacity-50" />
              <p className="text-lg">Submit an application to run the XGBoost Credit Model</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Gauge */}
                <div className="bg-slate-800/40 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6 shadow-xl relative flex flex-col items-center">
                  <div className="absolute top-0 left-0 p-4">
                    <span className="text-[10px] font-mono text-slate-500 border border-slate-700 rounded px-1.5 py-0.5 bg-slate-900">
                      {result.model_type}
                    </span>
                  </div>
                  
                  <h3 className="text-slate-400 text-sm font-medium mb-2 w-full text-right">Agri Credit Score</h3>
                  
                  <div className="h-48 w-full relative -mt-4">
                    <ResponsiveContainer width="100%" height="100%">
                      <RadialBarChart 
                        innerRadius="70%" outerRadius="100%" data={scoreData} 
                        startAngle={180} endAngle={0}
                      >
                        <PolarAngleAxis type="number" domain={[300, 900]} angleAxisId={0} tick={false} />
                        <RadialBar minAngle={15} background={{ fill: '#1e293b' }} clockWise={true} dataKey="value" cornerRadius={10} />
                      </RadialBarChart>
                    </ResponsiveContainer>
                    <div className="absolute inset-0 flex flex-col items-center justify-center mt-8">
                      <span className="text-5xl font-bold text-white">{result.credit_score}</span>
                      <span className="text-slate-500 text-xs mt-1">Scale: 300-900</span>
                    </div>
                  </div>
                  
                  <div className={`mt-2 px-4 py-2 rounded-lg flex items-center gap-2 border w-full justify-center
                    ${result.approved ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-red-500/10 border-red-500/30 text-red-400'}
                  `}>
                    {result.approved ? <CheckCircle className="w-5 h-5"/> : <AlertTriangle className="w-5 h-5"/>}
                    <span className="font-bold text-lg">{result.approved ? 'Loan Approved' : 'Application Rejected'}</span>
                  </div>
                </div>

                {/* Terms Breakdown */}
                {result.approved && (
                  <div className="bg-slate-800/40 backdrop-blur-xl border border-teal-500/30 rounded-2xl p-6 shadow-[0_0_20px_rgba(20,184,166,0.1)]">
                    <h3 className="text-teal-400 font-semibold mb-4 flex items-center gap-2">
                      <FileText className="w-5 h-5" /> Terms Sheet
                    </h3>
                    
                    <div className="space-y-4">
                      <div className="flex justify-between items-center border-b border-slate-700/50 pb-2">
                        <span className="text-slate-400">Principal</span>
                        <span className="text-white font-bold text-lg">₹{amount.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between items-center border-b border-slate-700/50 pb-2">
                        <span className="text-slate-400">Interest Rate (p.a.)</span>
                        <span className="text-emerald-400 font-bold">{result.terms.interest_rate}%</span>
                      </div>
                      <div className="flex justify-between items-center border-b border-slate-700/50 pb-2">
                        <span className="text-slate-400">Tenure</span>
                        <span className="text-white font-bold">{result.terms.tenure_months} Months</span>
                      </div>
                      <div className="flex justify-between items-center pt-2">
                        <span className="text-slate-300 font-semibold">Monthly EMI</span>
                        <span className="text-teal-400 font-bold text-2xl">₹{result.terms.emi.toLocaleString()}</span>
                      </div>
                      <button className="w-full mt-4 py-2 bg-teal-500/20 text-teal-400 hover:bg-teal-500/30 font-medium rounded-lg transition-colors border border-teal-500/30">
                        Accept & Disburse
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* SHAP Explainer Chart */}
              <div className="bg-slate-800/40 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6 shadow-xl">
                <h3 className="text-slate-300 font-semibold mb-1">Decision Explainer (SHAP Values)</h3>
                <p className="text-slate-500 text-xs mb-4">Top factors positively/negatively driving your credit score</p>
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={factorData} layout="vertical" margin={{ top: 0, right: 30, left: 150, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" horizontal={false} />
                      <XAxis type="number" stroke="#94a3b8" tick={{fill: '#94a3b8'}} axisLine={false} tickLine={false} />
                      <YAxis type="category" dataKey="name" stroke="#cbd5e1" tick={{fill: '#cbd5e1', fontSize: 12}} axisLine={false} tickLine={false} />
                      <RechartsTooltip 
                        contentStyle={{ backgroundColor: '#1e293b', borderColor: '#475569', borderRadius: '8px' }}
                        itemStyle={{ color: '#f8fafc' }}
                        cursor={{fill: 'rgba(255,255,255,0.05)'}}
                      />
                      <Bar dataKey="impact" name="SHAP Impact" barSize={16} radius={4}>
                        {factorData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
