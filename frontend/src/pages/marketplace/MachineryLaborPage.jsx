import { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Tractor, Calendar, MapPin, Search, Navigation2, CheckCircle, Clock, Users, Wrench
} from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

export default function MachineryLaborPage() {
  const [farmId, setFarmId] = useState('FARM-001');
  const [activeTab, setActiveTab] = useState('machinery'); // machinery, labor
  
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(null);
  const [error, setError] = useState('');

  const [machineryList, setMachineryList] = useState([]);
  const [laborGangs, setLaborGangs] = useState([]);

  useEffect(() => {
    const endpoint = activeTab === 'machinery' ? 'equipment' : 'labor';
    axios.get(`${API_BASE}/api/v1/marketplace/${endpoint}`)
      .then(res => activeTab === 'machinery' ? setMachineryList(res.data) : setLaborGangs(res.data))
      .catch(err => setError(err.response?.data?.detail || 'Unable to load rental listings.'));
  }, [activeTab]);

  const handleBook = async (item) => {
    setBookingLoading(item.id);
    setError('');
    
    try {
      const endpoint = activeTab === 'machinery' ? 'equipment/book' : 'labor/book';
      const payload = activeTab === 'machinery' 
        ? { listing_id: item.id, farm_id: farmId, start_date: new Date().toISOString().split('T')[0], end_date: new Date().toISOString().split('T')[0] }
        : { listing_id: item.id, farm_id: farmId, task_type: 'General', date: new Date().toISOString().split('T')[0] };

      const res = await axios.post(`${API_BASE}/api/v1/marketplace/${endpoint}`, payload);
      
      setBookingSuccess({
        id: item.id,
        name: item.equipment_type || item.skill,
        eta: res.data?.assigned_route_eta || 'Confirmed'
      });
      setTimeout(() => setBookingSuccess(null), 5000);
    } catch (err) {
      setError(err.response?.data?.detail || 'Booking failed.');
    } finally {
      setBookingLoading(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-amber-400 to-orange-500">
            Machinery & Labor Rentals
          </h1>
          <p className="text-slate-400 mt-1">On-demand tractor booking and labor gang scheduling</p>
        </div>
        
        <div className="flex bg-slate-800 p-1 rounded-lg border border-slate-700 w-max">
          <button 
            onClick={() => setActiveTab('machinery')}
            className={`px-4 py-2 rounded-md text-sm font-medium flex items-center gap-2 transition-all ${activeTab === 'machinery' ? 'bg-amber-500/20 text-amber-400 shadow-[inset_0_-2px_0_rgba(245,158,11,1)]' : 'text-slate-400 hover:text-slate-200'}`}
          >
            <Tractor className="w-4 h-4" /> Machinery
          </button>
          <button 
            onClick={() => setActiveTab('labor')}
            className={`px-4 py-2 rounded-md text-sm font-medium flex items-center gap-2 transition-all ${activeTab === 'labor' ? 'bg-amber-500/20 text-amber-400 shadow-[inset_0_-2px_0_rgba(245,158,11,1)]' : 'text-slate-400 hover:text-slate-200'}`}
          >
            <Users className="w-4 h-4" /> Labor Gangs
          </button>
        </div>
      </div>

      {/* Control Bar */}
      <div className="bg-slate-800/40 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-4 flex flex-wrap gap-4 items-center shadow-xl">
        <div className="flex items-center bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white">
          <span className="text-slate-500 mr-2">Farm ID:</span>
          <input value={farmId} onChange={e=>setFarmId(e.target.value)} className="bg-transparent border-none outline-none w-24 font-mono" />
        </div>
        
        <div className="flex items-center bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-300 w-64">
          <Calendar className="w-4 h-4 text-slate-500 mr-2" />
          <span>Today - Tomorrow</span>
        </div>

        <div className="flex items-center bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-300 flex-1 relative">
          <Search className="w-4 h-4 text-slate-500 mr-2 absolute" />
          <input placeholder={`Search ${activeTab}...`} className="bg-transparent border-none outline-none pl-6 w-full text-white" />
        </div>
      </div>

      {bookingSuccess && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 p-4 rounded-xl flex items-center gap-3">
          <CheckCircle className="w-6 h-6 text-emerald-400" />
          <div>
            <p className="text-emerald-400 font-bold">Booking Confirmed: {bookingSuccess.name}</p>
            <p className="text-sm text-slate-300">Estimated Arrival: <span className="font-mono bg-emerald-500/20 px-1 rounded">{bookingSuccess.eta} mins</span> based on OR-Tools routing.</p>
          </div>
        </div>
      )}

      {error && (
        <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg text-sm">{error}</div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Listings */}
        <div className="lg:col-span-2 space-y-4">
          {(activeTab === 'machinery' ? machineryList : laborGangs).map(item => (
            <div key={item.id} className="bg-slate-800/40 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-5 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-amber-500/30 transition-colors">
              <div className="flex items-start gap-4">
                <div className={`w-16 h-16 rounded-xl flex items-center justify-center shrink-0 border ${activeTab === 'machinery' ? 'bg-amber-500/10 border-amber-500/20 text-amber-500' : 'bg-blue-500/10 border-blue-500/20 text-blue-500'}`}>
                  {activeTab === 'machinery' ? <Wrench className="w-8 h-8" /> : <Users className="w-8 h-8" />}
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-700">
                      {item.type || `${item.size} Workers`}
                    </span>
                    {activeTab === 'machinery' && <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded flex items-center gap-1"><Navigation2 className="w-3 h-3"/> ETA: {item.eta_mins}m</span>}
                  </div>
                  <h3 className="text-white font-bold text-lg">{item.name}</h3>
                  <p className="text-slate-400 text-sm mt-1 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5" /> {item.distance} km away • {item.owner || item.availability}
                  </p>
                  {activeTab === 'labor' && (
                    <div className="flex gap-1 mt-2">
                      {item.skills.map(s => <span key={s} className="text-[10px] bg-slate-700 text-slate-300 px-1.5 py-0.5 rounded">{s}</span>)}
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex flex-col sm:items-end justify-between h-full min-w-[120px]">
                <div className="mb-4">
                  <span className="text-2xl font-bold text-white">₹{item.rate || item.daily_rate_per_head}</span>
                  <span className="text-slate-400 text-xs ml-1">{activeTab === 'machinery' ? '/ day' : '/ head'}</span>
                </div>
                <button 
                  onClick={() => handleBook(item)}
                  disabled={bookingLoading === item.id}
                  className="px-6 py-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white font-semibold rounded-xl shadow-lg shadow-amber-500/20 transition-all flex items-center justify-center disabled:opacity-50"
                >
                  {bookingLoading === item.id ? <Clock className="w-4 h-4 animate-spin" /> : 'Book Now'}
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Availability overview */}
        <div className="lg:col-span-1 bg-slate-800/40 backdrop-blur-xl border border-slate-700/50 rounded-2xl overflow-hidden shadow-xl min-h-[400px] relative">
          <div className="absolute inset-0 bg-slate-900/80 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-30 pointer-events-none" />
          <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
            <MapPin className="w-12 h-12 text-slate-600 mb-3" />
            <h3 className="text-white font-semibold mb-1">Available assets</h3>
            <p className="text-slate-400 text-sm">Listings returned by the marketplace service.</p>
            <div className="mt-8 border border-amber-500/30 bg-amber-500/10 rounded-lg p-3 w-full max-w-xs text-left backdrop-blur-md">
               <div className="flex justify-between items-center text-sm">
                 <span className="text-amber-400 font-mono">My Farm</span>
                 <span className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
               </div>
               <div className="mt-2 text-xs text-slate-300">
                 {items.length} {activeTab} listings available
               </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
