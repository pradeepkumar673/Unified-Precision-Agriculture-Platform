import { useState } from 'react';
import axios from 'axios';
import { 
  Users, Calculator, Plus, Package, Factory, TrendingUp, Handshake
} from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

export default function FPOCommunityPage() {
  const [activeTab, setActiveTab] = useState('shg'); // shg, fpo
  
  // Split Cost Calculator State
  const [totalCost, setTotalCost] = useState(2500);
  const [members, setMembers] = useState(5);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-indigo-500">
            Community & FPO Hub
          </h1>
          <p className="text-slate-400 mt-1">Form Self-Help Groups (SHGs) and Farmer Producer Orgs (FPOs) for collective bargaining</p>
        </div>
        
        <div className="flex bg-slate-800 p-1 rounded-lg border border-slate-700 w-max">
          <button 
            onClick={() => setActiveTab('shg')}
            className={`px-4 py-2 rounded-md text-sm font-medium flex items-center gap-2 transition-all ${activeTab === 'shg' ? 'bg-indigo-500/20 text-indigo-400 shadow-[inset_0_-2px_0_rgba(99,102,241,1)]' : 'text-slate-400 hover:text-slate-200'}`}
          >
            <Users className="w-4 h-4" /> My SHG
          </button>
          <button 
            onClick={() => setActiveTab('fpo')}
            className={`px-4 py-2 rounded-md text-sm font-medium flex items-center gap-2 transition-all ${activeTab === 'fpo' ? 'bg-indigo-500/20 text-indigo-400 shadow-[inset_0_-2px_0_rgba(99,102,241,1)]' : 'text-slate-400 hover:text-slate-200'}`}
          >
            <Factory className="w-4 h-4" /> FPO Network
          </button>
        </div>
      </div>

      {activeTab === 'shg' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          <div className="bg-slate-800/40 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6 shadow-xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Handshake className="w-5 h-5 text-indigo-400" /> Shirur Progressive SHG
              </h2>
              <span className="bg-slate-900 border border-slate-700 text-xs px-2 py-1 rounded text-slate-400 font-mono">ID: SHG-9921</span>
            </div>
            
            <div className="space-y-4 mb-6">
              <div className="flex justify-between items-center p-3 bg-slate-900/50 rounded-lg border border-slate-700">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400 font-bold text-xs">RK</div>
                  <span className="text-sm font-medium text-white">Ramesh Kumar (You)</span>
                </div>
                <span className="text-xs text-slate-500">Lead</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-slate-900/50 rounded-lg border border-slate-700">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-slate-400 font-bold text-xs">SP</div>
                  <span className="text-sm font-medium text-white">Suresh Patil</span>
                </div>
                <span className="text-xs text-slate-500">Member</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-slate-900/50 rounded-lg border border-slate-700 opacity-50">
                <span className="text-sm text-slate-400">+ 3 other members</span>
              </div>
            </div>

            <button className="w-full py-2 border border-dashed border-indigo-500/50 text-indigo-400 rounded-xl hover:bg-indigo-500/10 transition-colors flex items-center justify-center gap-2 text-sm font-medium">
              <Plus className="w-4 h-4"/> Invite Member
            </button>
          </div>

          <div className="bg-slate-800/40 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6 shadow-xl relative overflow-hidden">
             <div className="absolute top-0 right-0 p-4 opacity-5">
               <Calculator className="w-32 h-32 text-indigo-400" />
             </div>
             
             <h2 className="text-xl font-bold text-white mb-2 relative z-10 flex items-center gap-2">
                Shared Cost Splitter
             </h2>
             <p className="text-sm text-slate-400 mb-6 relative z-10">Split machinery rental or bulk seed orders across SHG members.</p>
             
             <div className="space-y-4 relative z-10">
               <div>
                 <label className="block text-xs font-medium text-slate-400 mb-1">Total Booking Amount (₹)</label>
                 <input 
                   type="number" value={totalCost} onChange={e=>setTotalCost(e.target.value)}
                   className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 focus:ring-2 focus:ring-indigo-500/50 outline-none text-white text-lg font-bold"
                 />
               </div>
               <div>
                 <label className="block text-xs font-medium text-slate-400 mb-1">Split Among</label>
                 <div className="flex items-center gap-2">
                   <input 
                     type="range" min="2" max="10" value={members} onChange={e=>setMembers(e.target.value)}
                     className="flex-1 accent-indigo-500"
                   />
                   <span className="bg-slate-900 border border-slate-700 px-3 py-1 rounded text-white font-mono w-12 text-center">{members}</span>
                 </div>
               </div>
               
               <div className="pt-4 border-t border-slate-700/50 mt-4">
                 <div className="bg-indigo-500/10 border border-indigo-500/30 p-4 rounded-xl flex justify-between items-center">
                   <span className="text-indigo-400 font-medium">Cost per Member</span>
                   <span className="text-2xl font-bold text-white">₹{(totalCost / members).toFixed(2)}</span>
                 </div>
               </div>
               <button className="w-full mt-4 py-3 bg-indigo-500 hover:bg-indigo-600 text-white font-bold rounded-xl shadow-lg transition-colors">
                 Send Split Requests
               </button>
             </div>
          </div>

        </div>
      )}

      {activeTab === 'fpo' && (
        <div className="bg-slate-800/40 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6 shadow-xl">
           <div className="flex justify-between items-start mb-8">
             <div>
               <h2 className="text-xl font-bold text-white flex items-center gap-2 mb-1">
                 <Factory className="w-5 h-5 text-indigo-400" /> Maha-Agri FPO Federation
               </h2>
               <p className="text-slate-400 text-sm">245 active members • 3,200 Hectares combined land</p>
             </div>
             <button className="px-4 py-2 bg-slate-700 text-white text-sm font-medium rounded-lg hover:bg-slate-600">
               Manage FPO
             </button>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             <div className="bg-slate-900/50 border border-slate-700 rounded-xl p-5">
               <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                 <Package className="w-4 h-4 text-emerald-400"/> Active Bulk Purchase Pools
               </h3>
               <div className="space-y-4">
                 <div className="p-4 border border-slate-700 rounded-lg bg-slate-800">
                   <div className="flex justify-between items-center mb-2">
                     <span className="font-bold text-white">DAP Fertilizer (50kg bags)</span>
                     <span className="text-xs font-mono text-emerald-400 border border-emerald-400/30 bg-emerald-400/10 px-2 py-0.5 rounded">15% Volume Discount</span>
                   </div>
                   <div className="w-full bg-slate-900 rounded-full h-2 mb-2"><div className="bg-emerald-400 h-2 rounded-full" style={{width:'65%'}}></div></div>
                   <div className="flex justify-between text-xs text-slate-400">
                     <span>650 / 1000 bags committed</span>
                     <span>Closes in 2 days</span>
                   </div>
                   <button className="w-full mt-3 py-1.5 border border-emerald-500/50 text-emerald-400 text-sm rounded hover:bg-emerald-500/10">Commit Quantity</button>
                 </div>
               </div>
             </div>

             <div className="bg-slate-900/50 border border-slate-700 rounded-xl p-5">
               <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                 <TrendingUp className="w-4 h-4 text-blue-400"/> Pooled Selling (Exchange Matches)
               </h3>
               <div className="space-y-4">
                 <div className="p-4 border border-slate-700 rounded-lg bg-slate-800">
                   <div className="flex justify-between items-center mb-2">
                     <span className="font-bold text-white">Grade A Wheat - ITC Corp</span>
                     <span className="text-xs font-mono text-blue-400 border border-blue-400/30 bg-blue-400/10 px-2 py-0.5 rounded">₹2,200/qtl</span>
                   </div>
                   <div className="w-full bg-slate-900 rounded-full h-2 mb-2"><div className="bg-blue-400 h-2 rounded-full" style={{width:'85%'}}></div></div>
                   <div className="flex justify-between text-xs text-slate-400">
                     <span>42.5 / 50 Tons aggregated</span>
                     <span>Fulfilling Order</span>
                   </div>
                 </div>
               </div>
             </div>
           </div>
        </div>
      )}
    </div>
  );
}

