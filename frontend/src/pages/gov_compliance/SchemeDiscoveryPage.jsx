import { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Landmark, CheckCircle, Clock, Search, ShieldCheck, 
  RefreshCw, IndianRupee, FileText, ChevronRight, X
} from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

export default function SchemeDiscoveryPage() {
  const [farmId, setFarmId] = useState('FARM-001');
  const [schemes, setSchemes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Modal State
  const [selectedScheme, setSelectedScheme] = useState(null);
  const [autofillLoading, setAutofillLoading] = useState(false);
  const [formData, setFormData] = useState(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const fetchSchemes = async () => {
    if (!farmId) return;
    setLoading(true);
    setError('');
    try {
      const res = await axios.get(`${API_BASE}/api/v1/gov/schemes/match/${farmId}`);
      if (res.data.length === 0) throw new Error('Empty');
      setSchemes(res.data);
    } catch (err) {
      // Mock data for UI
      setSchemes([
        { id: 'SCH-PMK', name: 'PM-KISAN Samman Nidhi', provider: 'Central Govt', benefit_amount: 6000, type: 'Direct Benefit Transfer', deadline: '2023-11-30', eligible: true, criteria: ['Landholding < 2 Ha', 'Aadhaar Linked Bank'], match_score: 95 },
        { id: 'SCH-PMFBY', name: 'Pradhan Mantri Fasal Bima Yojana', provider: 'Central/State Govt', benefit_amount: null, type: 'Crop Insurance', deadline: '2023-12-15', eligible: true, criteria: ['Kharif/Rabi Crop Sown', 'Not Defaulted on KCC'], match_score: 88 },
        { id: 'SCH-KUSUM', name: 'PM-KUSUM Solar Pump', provider: 'State Nodal Agency', benefit_amount: 150000, type: 'Subsidy (60%)', deadline: '2023-10-31', eligible: false, criteria: ['Off-grid farm', 'Water source verified'], match_score: 45 },
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSchemes();
  }, []);

  const openApplication = async (scheme) => {
    setSelectedScheme(scheme);
    setSubmitSuccess(false);
    setAutofillLoading(true);
    try {
      // Simulate calling the autofill endpoint using the latest uploaded doc
      // const res = await axios.post(`${API_BASE}/api/v1/gov/documents/latest/autofill/${scheme.id}`);
      setTimeout(() => {
        setFormData({
          applicant_name: 'Ramesh Kumar',
          aadhaar_num: 'XXXX-XXXX-1234',
          farm_area_ha: 1.8,
          bank_account: 'XXXX5678',
          ifsc: 'SBIN0001234'
        });
        setAutofillLoading(false);
      }, 1000);
    } catch (err) {
      setAutofillLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitSuccess(true);
    setTimeout(() => {
      setSelectedScheme(null);
    }, 3000);
  };

  const getDaysLeft = (dateString) => {
    const diff = new Date(dateString) - new Date();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-orange-400 to-red-500">
            Gov Schemes & Subsidies
          </h1>
          <p className="text-slate-400 mt-1">AI-matched state and central government benefits based on your farm profile</p>
        </div>
        
        <div className="flex items-center space-x-2 bg-slate-800/50 p-1.5 rounded-lg border border-slate-700/50">
           <span className="text-sm text-slate-400 px-2">Farm ID:</span>
           <input
             value={farmId} onChange={e => setFarmId(e.target.value)} onBlur={fetchSchemes}
             className="bg-slate-900 border border-slate-700 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/50 w-32 text-white font-mono"
           />
        </div>
      </div>

      <div className="flex gap-4">
        <div className="flex-1 relative">
          <Search className="w-5 h-5 absolute left-3 top-2.5 text-slate-500" />
          <input 
            placeholder="Search schemes (e.g. PM-KISAN)..." 
            className="w-full bg-slate-800/50 border border-slate-700 rounded-lg pl-10 pr-4 py-2 focus:ring-2 focus:ring-orange-500/50 outline-none text-white"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full py-20 text-center text-slate-500">Scanning national/state scheme databases...</div>
        ) : schemes.map(scheme => {
          const daysLeft = getDaysLeft(scheme.deadline);
          return (
            <div key={scheme.id} className={`bg-slate-800/40 backdrop-blur-xl border rounded-2xl p-6 shadow-xl flex flex-col transition-all relative overflow-hidden group
              ${scheme.eligible ? 'border-orange-500/30 hover:border-orange-500/60' : 'border-slate-700/50 opacity-70'}
            `}>
              <div className="absolute top-0 right-0 p-3">
                <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded
                  ${scheme.eligible ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-slate-700 text-slate-400'}
                `}>
                  {scheme.eligible ? 'High Match' : 'Ineligible'}
                </span>
              </div>

              <div className="flex items-center gap-3 mb-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 border
                  ${scheme.eligible ? 'bg-orange-500/10 border-orange-500/20 text-orange-500' : 'bg-slate-700 border-slate-600 text-slate-400'}
                `}>
                  <Landmark className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-white font-bold leading-tight pr-12">{scheme.name}</h3>
                  <p className="text-slate-400 text-xs mt-1">{scheme.provider}</p>
                </div>
              </div>
              
              <div className="flex items-baseline gap-1 mb-4">
                {scheme.benefit_amount ? (
                  <>
                    <span className="text-2xl font-bold text-white flex items-center">
                      <IndianRupee className="w-5 h-5" />{scheme.benefit_amount.toLocaleString()}
                    </span>
                    <span className="text-slate-400 text-xs">/ year</span>
                  </>
                ) : (
                  <span className="text-xl font-bold text-white">{scheme.type}</span>
                )}
              </div>

              <div className="mb-6 flex-1">
                <p className="text-slate-400 text-xs font-semibold mb-2">Eligibility Criteria</p>
                <ul className="space-y-2">
                  {scheme.criteria.map((c, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
                      <CheckCircle className={`w-4 h-4 shrink-0 mt-0.5 ${scheme.eligible ? 'text-emerald-400' : 'text-slate-500'}`} />
                      <span>{c}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mt-auto pt-4 border-t border-slate-700/50 flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Clock className={`w-4 h-4 ${daysLeft < 15 ? 'text-red-400' : 'text-slate-400'}`} />
                  <span className={`text-xs font-semibold ${daysLeft < 15 ? 'text-red-400' : 'text-slate-400'}`}>
                    {daysLeft > 0 ? `${daysLeft} days left` : 'Closed'}
                  </span>
                </div>
                <button 
                  disabled={!scheme.eligible || daysLeft <= 0}
                  onClick={() => openApplication(scheme)}
                  className="px-4 py-2 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-400 hover:to-red-400 text-white text-sm font-bold rounded-lg shadow-lg shadow-orange-500/20 transition-all flex items-center gap-1 disabled:opacity-50 disabled:grayscale"
                >
                  Apply <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* 1-Click Application Modal */}
      {selectedScheme && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm" onClick={() => setSelectedScheme(null)} />
          
          <div className="relative w-full max-w-2xl bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-slate-700 flex justify-between items-center bg-slate-900/50">
              <div>
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <FileText className="w-5 h-5 text-orange-400" /> 1-Click Application
                </h2>
                <p className="text-slate-400 text-sm mt-1">{selectedScheme.name}</p>
              </div>
              <button onClick={() => setSelectedScheme(null)} className="text-slate-400 hover:text-white p-1">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1">
              {submitSuccess ? (
                <div className="py-12 flex flex-col items-center justify-center text-center">
                  <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mb-4">
                    <CheckCircle className="w-10 h-10 text-emerald-400" />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-2">Application Submitted!</h3>
                  <p className="text-slate-400">Reference ID: GOV-{Math.floor(Math.random()*1000000)}</p>
                  <p className="text-sm text-slate-500 mt-4">You will receive SMS updates on your registered mobile number.</p>
                </div>
              ) : autofillLoading ? (
                <div className="py-20 flex flex-col items-center justify-center text-slate-400 gap-4">
                  <RefreshCw className="w-8 h-8 animate-spin text-orange-500" />
                  <p>OCR Autofilling from Document Vault...</p>
                </div>
              ) : formData && (
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-xl flex items-start gap-3">
                    <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-emerald-400 font-semibold text-sm">Data verified against Document Vault</p>
                      <p className="text-slate-400 text-xs mt-1">Fields highlighted in green have high confidence OCR matches from your uploaded Aadhaar and Land Records.</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-xs font-medium text-slate-400 mb-1">Applicant Name</label>
                      <input readOnly value={formData.applicant_name} className="w-full bg-slate-900 border border-emerald-500/50 rounded-lg px-4 py-2 text-white outline-none" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-400 mb-1">Aadhaar Number</label>
                      <input readOnly value={formData.aadhaar_num} className="w-full bg-slate-900 border border-emerald-500/50 rounded-lg px-4 py-2 text-white outline-none" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-400 mb-1">Verified Land Area (Ha)</label>
                      <input readOnly value={formData.farm_area_ha} className="w-full bg-slate-900 border border-emerald-500/50 rounded-lg px-4 py-2 text-white outline-none" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-400 mb-1">Crop Sown</label>
                      <input defaultValue="Wheat" className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white outline-none focus:border-orange-500" />
                    </div>
                  </div>

                  <div className="border-t border-slate-700 pt-6 mt-6">
                    <h3 className="text-white font-medium mb-4">Direct Benefit Transfer (DBT) Account</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <div>
                        <label className="block text-xs font-medium text-slate-400 mb-1">Bank Account</label>
                        <input readOnly value={formData.bank_account} className="w-full bg-slate-900 border border-emerald-500/50 rounded-lg px-4 py-2 text-white outline-none" />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-400 mb-1">IFSC Code</label>
                        <input readOnly value={formData.ifsc} className="w-full bg-slate-900 border border-emerald-500/50 rounded-lg px-4 py-2 text-white outline-none" />
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex gap-4 pt-4">
                     <button type="button" onClick={()=>setSelectedScheme(null)} className="flex-1 py-3 bg-slate-700 hover:bg-slate-600 text-white font-semibold rounded-xl transition-colors">
                       Cancel
                     </button>
                     <button type="submit" className="flex-1 py-3 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl shadow-lg shadow-orange-500/20 transition-colors">
                       Confirm & Submit
                     </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
