import { useState, useRef } from 'react';
import axios from 'axios';
import { 
  Warehouse, FileBadge, UploadCloud, AlertTriangle, ShieldCheck, 
  Map, RefreshCw, Send
} from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

export default function InsuranceWarehousePage() {
  const [activeTab, setActiveTab] = useState('warehouse'); // warehouse, insurance
  const [farmId, setFarmId] = useState('FARM-001');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Warehouse State
  const [qty, setQty] = useState(50);
  const [enwr, setEnwr] = useState(null);

  // Insurance State
  const [policyId, setPolicyId] = useState('POL-2023-X1');
  const fileInputRef = useRef(null);
  const [photos, setPhotos] = useState([]);
  const [claimResult, setClaimResult] = useState(null);

  const handleWarehouseBook = async () => {
    setLoading(true);
    setError('');
    try {
      const bookRes = await axios.post(`${API_BASE}/api/v1/finance/warehouse/book`, {
        farm_id: farmId, facility_id: 'FAC-77', qty_kg: qty * 100 // quintals to kg
      });
      // 2. Generate eNWR
      const bookingId = bookRes.data.id;
      const enwrRes = await axios.post(`${API_BASE}/api/v1/finance/warehouse/${bookingId}/generate-enwr`);
      setEnwr(enwrRes.data);
    } catch (err) {
      setError(err.response?.data?.detail || 'Unable to generate the warehouse receipt.');
    } finally {
      setLoading(false);
    }
  };

  const handlePhotoUpload = (e) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      const newPhotos = files.map(file => ({ file, url: URL.createObjectURL(file) }));
      setPhotos(prev => [...prev, ...newPhotos].slice(0, 3));
    }
  };

  const handleClaim = async () => {
    if (photos.length === 0) {
      setError('Please upload at least 1 evidence photo');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await axios.post(`${API_BASE}/api/v1/finance/insurance/claim`, {
        farm_id: farmId, policy_id: policyId, loss_event_date: new Date().toISOString().split('T')[0], photo_paths: photos.map(photo => photo.file.name)
      });
      setClaimResult(res.data);
    } catch (err) {
      setError(err.response?.data?.detail || 'Unable to file the insurance claim.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-500">
            Storage & Insurance
          </h1>
          <p className="text-slate-400 mt-1">Generate e-NWRs for warehouse receipt financing and file AI-verified claims</p>
        </div>
        
        <div className="flex bg-slate-800 p-1 rounded-lg border border-slate-700 w-max">
          <button 
            onClick={() => setActiveTab('warehouse')}
            className={`px-4 py-2 rounded-md text-sm font-medium flex items-center gap-2 transition-all ${activeTab === 'warehouse' ? 'bg-purple-500/20 text-purple-400 shadow-[inset_0_-2px_0_rgba(168,85,247,1)]' : 'text-slate-400 hover:text-slate-200'}`}
          >
            <Warehouse className="w-4 h-4" /> WDRA e-NWR
          </button>
          <button 
            onClick={() => setActiveTab('insurance')}
            className={`px-4 py-2 rounded-md text-sm font-medium flex items-center gap-2 transition-all ${activeTab === 'insurance' ? 'bg-purple-500/20 text-purple-400 shadow-[inset_0_-2px_0_rgba(168,85,247,1)]' : 'text-slate-400 hover:text-slate-200'}`}
          >
            <ShieldCheck className="w-4 h-4" /> Parametric Claim
          </button>
        </div>
      </div>

      <div className="bg-slate-800/40 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-4 shadow-xl">
         <div className="flex items-center bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white w-max">
           <span className="text-slate-500 mr-2">Farm ID:</span>
           <input value={farmId} onChange={e=>setFarmId(e.target.value)} className="bg-transparent border-none outline-none w-24 font-mono" />
         </div>
      </div>

      {error && (
        <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg text-sm">{error}</div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* WAREHOUSE TAB */}
        {activeTab === 'warehouse' && (
           <>
             <div className="bg-slate-800/40 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6 shadow-xl">
               <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
                 <Warehouse className="w-5 h-5 text-purple-400" /> Storage Deposit
               </h2>
               <div className="space-y-4">
                 <div>
                   <label className="block text-sm font-medium text-slate-400 mb-1">Commodity Quantity (Quintals)</label>
                   <input type="number" value={qty} onChange={e=>setQty(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 focus:ring-2 focus:ring-purple-500/50 outline-none text-white font-mono"/>
                 </div>
                 <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-700">
                   <p className="text-slate-400 text-sm mb-2">Selected Facility</p>
                   <div className="flex justify-between items-center">
                     <span className="text-white font-semibold">Central Warehousing Corp, Pune</span>
                     <span className="text-xs bg-emerald-500/20 text-emerald-400 px-2 py-1 rounded border border-emerald-500/30">WDRA Approved</span>
                   </div>
                 </div>
                 <button 
                   onClick={handleWarehouseBook} disabled={loading}
                   className="w-full py-3 bg-purple-500 hover:bg-purple-600 text-white font-bold rounded-xl shadow-lg transition-colors flex justify-center items-center gap-2 disabled:opacity-50"
                 >
                   {loading ? <RefreshCw className="w-5 h-5 animate-spin"/> : 'Generate e-NWR'}
                 </button>
               </div>
             </div>
             
             <div className="bg-slate-800/40 backdrop-blur-xl border border-purple-500/30 rounded-2xl p-6 shadow-[0_0_20px_rgba(168,85,247,0.1)] relative">
               <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
                 <FileBadge className="w-5 h-5 text-purple-400" /> Electronic Receipt (e-NWR)
               </h2>
               {!enwr ? (
                 <div className="h-48 flex items-center justify-center text-slate-500 border-2 border-dashed border-slate-700/50 rounded-xl">Deposit goods to generate receipt</div>
               ) : (
                 <div className="space-y-6">
                   <div className="flex justify-between items-start border-b border-slate-700/50 pb-4">
                     <div>
                       <p className="text-slate-400 text-sm">Receipt Number</p>
                       <p className="text-2xl font-mono font-bold text-white tracking-widest">{enwr.e_nwr_id}</p>
                     </div>
                     <span className="bg-purple-500 text-white text-xs font-bold px-3 py-1 rounded-full uppercase">Active</span>
                   </div>
                   <div className="grid grid-cols-2 gap-4">
                     <div>
                       <p className="text-slate-400 text-xs">Quantity Secured</p>
                       <p className="text-white font-semibold">{qty} Quintals</p>
                     </div>
                     <div>
                       <p className="text-slate-400 text-xs">Loan Eligibility</p>
                       <p className="text-emerald-400 font-semibold">{enwr.loan_eligible ? 'Up to 70% LTV' : 'Not Eligible'}</p>
                     </div>
                   </div>
                   <button className="w-full py-2 bg-slate-900 border border-purple-500/50 text-purple-400 font-medium rounded-lg hover:bg-purple-500/10 transition-colors">
                     Apply for Pledge Loan
                   </button>
                 </div>
               )}
             </div>
           </>
        )}

        {/* INSURANCE TAB */}
        {activeTab === 'insurance' && (
           <>
             <div className="bg-slate-800/40 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6 shadow-xl">
               <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
                 <AlertTriangle className="w-5 h-5 text-pink-500" /> Report Crop Loss
               </h2>
               <div className="space-y-4">
                 <div>
                   <label className="block text-sm font-medium text-slate-400 mb-1">Policy ID</label>
                   <input value={policyId} onChange={e=>setPolicyId(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 focus:ring-2 focus:ring-pink-500/50 outline-none text-white font-mono"/>
                 </div>
                 
                 <div>
                   <label className="block text-sm font-medium text-slate-400 mb-2">Ground Evidence (Max 3)</label>
                   <div className="flex gap-4 mb-2">
                     {photos.map((photo, i) => (
                       <div key={i} className="w-16 h-16 rounded-lg overflow-hidden border border-slate-600"><img src={photo.url} className="w-full h-full object-cover"/></div>
                     ))}
                     {photos.length < 3 && (
                       <button onClick={()=>fileInputRef.current.click()} className="w-16 h-16 rounded-lg border-2 border-dashed border-slate-600 flex flex-col items-center justify-center text-slate-500 hover:border-pink-500 hover:text-pink-400">
                         <UploadCloud className="w-5 h-5"/>
                       </button>
                     )}
                   </div>
                   <input type="file" ref={fileInputRef} onChange={handlePhotoUpload} accept="image/*" multiple className="hidden" />
                 </div>

                 <button 
                   onClick={handleClaim} disabled={loading || photos.length === 0}
                   className="w-full mt-4 py-3 bg-pink-600 hover:bg-pink-700 text-white font-bold rounded-xl shadow-lg transition-colors flex justify-center items-center gap-2 disabled:opacity-50"
                 >
                   {loading ? <RefreshCw className="w-5 h-5 animate-spin"/> : <Send className="w-5 h-5" />} File Claim
                 </button>
               </div>
             </div>

             <div className="bg-slate-800/40 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6 shadow-xl relative">
               <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
                 <Map className="w-5 h-5 text-pink-400" /> Satellite Verification
               </h2>
               
               {!claimResult ? (
                 <div className="h-48 flex items-center justify-center text-slate-500 border-2 border-dashed border-slate-700/50 rounded-xl bg-slate-900/30">
                   Submit claim to trigger geospatial cross-check
                 </div>
               ) : (
                 <div className="space-y-6">
                   <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl">
                     <div className="flex items-center gap-3 mb-2">
                       <ShieldCheck className="w-6 h-6 text-emerald-400" />
                       <h3 className="text-emerald-400 font-bold text-lg">AI Verification Passed</h3>
                     </div>
                     <p className="text-sm text-slate-300">Ground photos match our Sentinel-1 SAR flood mapping data for your coordinate polygon on the claimed date.</p>
                   </div>
                   
                   <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-700">
                     <p className="text-slate-400 text-xs mb-1">Claim Reference ID</p>
                     <p className="text-white font-mono font-medium mb-4">{claimResult.id}</p>
                     
                     <div className="flex justify-between items-center pt-3 border-t border-slate-700/50">
                       <span className="text-slate-400">Estimated Auto-Payout</span>
                       <span className="text-slate-400">Awaiting insurer assessment</span>
                     </div>
                   </div>
                   <div className="text-center">
                     <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-semibold">
                       <RefreshCw className="w-3 h-3"/> {claimResult.status.replace(/_/g, ' ')}
                     </span>
                   </div>
                 </div>
               )}
             </div>
           </>
        )}
      </div>
    </div>
  );
}
