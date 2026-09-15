import { useState, useRef } from 'react';
import axios from 'axios';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer 
} from 'recharts';
import { 
  HeartPulse, Camera, Syringe, CalendarClock, UploadCloud, Stethoscope, RefreshCw, X
} from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

export default function LivestockPage() {
  const [farmId, setFarmId] = useState('');
  const [animalType, setAnimalType] = useState('cow');
  const [tagId, setTagId] = useState('');
  const [livestockList, setLivestockList] = useState([]);
  const [selectedAnimal, setSelectedAnimal] = useState(null);
  
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [healthResult, setHealthResult] = useState(null);
  
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState('');

  const fileInputRef = useRef(null);

  // For demo: Instead of complex listing, we just register a new one and set it as selected
  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const res = await axios.post(`${API_BASE}/api/v1/health/livestock`, {
        farm_id: farmId,
        animal_type: animalType,
        tag_id: tagId
      });
      setSelectedAnimal(res.data);
      // Ensure schedule is loaded if returning an ID but no schedule attached
      if(res.data.id && !res.data.vaccination_schedule) {
        const schedRes = await axios.get(`${API_BASE}/api/v1/health/livestock/${res.data.id}/schedule`);
        setSelectedAnimal(prev => ({...prev, ...schedRes.data}));
      }
      setTagId('');
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to register livestock');
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    if (selected) {
      setFile(selected);
      setPreviewUrl(URL.createObjectURL(selected));
      setHealthResult(null);
    }
  };

  const handleAnalyze = async () => {
    if (!file || !selectedAnimal) return;
    setAnalyzing(true);
    
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await axios.post(`${API_BASE}/api/v1/health/livestock/${selectedAnimal.id}/health-check`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setHealthResult(res.data);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to analyze health');
    } finally {
      setAnalyzing(false);
    }
  };

  const yieldData = selectedAnimal?.milk_yield_log || [];

  const schedData = selectedAnimal?.vaccination_schedule || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-pink-400 to-purple-400">
          Livestock Health
        </h1>
        <p className="text-slate-400 mt-1">Manage herd registry, health checks, and vaccination schedules</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Registry Sidebar */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-slate-800/40 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6 shadow-xl">
            <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
              <HeartPulse className="w-5 h-5 text-pink-400" /> Register Animal
            </h2>
            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Farm ID</label>
                <input 
                  value={farmId} onChange={e => setFarmId(e.target.value)} required
                  className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-4 py-2 focus:ring-2 focus:ring-pink-500/50 outline-none text-white text-sm" 
                  placeholder="Farm ID"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Animal Type</label>
                <select 
                  value={animalType} onChange={e => setAnimalType(e.target.value)}
                  className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-4 py-2 focus:ring-2 focus:ring-pink-500/50 outline-none text-white text-sm capitalize"
                >
                  <option value="cow">Cow</option>
                  <option value="buffalo">Buffalo</option>
                  <option value="goat">Goat</option>
                  <option value="poultry">Poultry</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Ear Tag / ID</label>
                <input 
                  value={tagId} onChange={e => setTagId(e.target.value)} required
                  className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-4 py-2 focus:ring-2 focus:ring-pink-500/50 outline-none text-white text-sm" 
                  placeholder="e.g. TAG-492"
                />
              </div>
              <button 
                type="submit" disabled={loading}
                className="w-full bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-400 hover:to-purple-400 text-white font-semibold py-2 px-4 rounded-lg shadow-lg transition-all flex justify-center items-center gap-2 disabled:opacity-50"
              >
                {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : 'Register'}
              </button>
            </form>
            {error && <p className="text-red-400 text-sm mt-3">{error}</p>}
          </div>

          {selectedAnimal && (
            <div className="bg-slate-800/40 backdrop-blur-xl border border-pink-500/30 rounded-2xl p-6 shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 p-3">
                <span className="bg-pink-500/20 text-pink-400 px-2 py-1 rounded text-xs font-bold uppercase tracking-wider">
                  Active
                </span>
              </div>
              <p className="text-slate-400 text-xs mb-1">Selected Profile</p>
              <h3 className="text-2xl font-bold text-white capitalize">{selectedAnimal.animal_type} <span className="text-pink-400 text-lg">#{selectedAnimal.tag_id}</span></h3>
              <p className="text-slate-500 text-xs mt-1 font-mono break-all">{selectedAnimal.id}</p>
            </div>
          )}
        </div>

        {/* Main Dashboard Area */}
        <div className="lg:col-span-2 space-y-6">
          {!selectedAnimal ? (
            <div className="h-full min-h-[500px] flex flex-col items-center justify-center text-slate-500 border-2 border-dashed border-slate-700/50 rounded-2xl bg-slate-800/20 backdrop-blur-sm">
              <HeartPulse className="w-16 h-16 mb-4 text-slate-600 opacity-50" />
              <p className="text-lg">Register or select an animal to view health dashboard</p>
            </div>
          ) : (
            <>
              {/* Dual Panel: Chart + Schedule */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Yield Chart */}
                <div className="bg-slate-800/40 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6 shadow-xl">
                  <h3 className="text-lg font-semibold text-white mb-4">Yield History</h3>
                  <div className="h-48">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={yieldData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                        <XAxis dataKey="date" stroke="#94a3b8" tick={{fontSize: 10}} tickLine={false} axisLine={false} />
                        <YAxis stroke="#94a3b8" tick={{fontSize: 10}} tickLine={false} axisLine={false} />
                        <RechartsTooltip contentStyle={{ backgroundColor: '#1e293b', borderColor: '#475569' }} />
                        <Line type="monotone" dataKey="liters" stroke="#c084fc" strokeWidth={3} dot={{r: 4, fill: '#c084fc', strokeWidth: 0}} activeDot={{r: 6}} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Schedule List */}
                <div className="bg-slate-800/40 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6 shadow-xl">
                  <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <CalendarClock className="w-5 h-5 text-purple-400" /> Vaccination Schedule
                  </h3>
                  <div className="space-y-3">
                    {schedData.map((v, i) => (
                      <div key={i} className="flex justify-between items-center p-3 bg-slate-900/50 rounded-lg border border-slate-700/50">
                        <div>
                          <p className="text-white font-medium text-sm flex items-center gap-2">
                            <Syringe className="w-3.5 h-3.5 text-slate-400" /> {v.vaccine}
                          </p>
                          <p className="text-xs text-slate-400 mt-1">{v.date}</p>
                        </div>
                        <span className={`px-2 py-1 text-xs font-bold rounded-md uppercase tracking-wider ${v.status === 'completed' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-orange-500/20 text-orange-400'}`}>
                          {v.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

              </div>

              {/* Health Scanner */}
              <div className="bg-slate-800/40 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6 shadow-xl">
                <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
                  <Camera className="w-5 h-5 text-pink-400" /> Visual Health Scanner
                </h3>
                
                <div className="flex flex-col md:flex-row gap-6">
                  {/* Uploader */}
                  <div className="flex-1">
                    {!previewUrl ? (
                      <div 
                        onClick={() => fileInputRef.current.click()}
                        className="h-48 border-2 border-dashed border-slate-600 hover:border-pink-500/50 bg-slate-900/30 rounded-xl flex flex-col items-center justify-center cursor-pointer transition-colors group"
                      >
                        <UploadCloud className="w-8 h-8 text-slate-500 group-hover:text-pink-400 mb-2 transition-colors" />
                        <p className="text-sm text-slate-300 font-medium">Upload affected area photo</p>
                      </div>
                    ) : (
                      <div className="relative rounded-xl overflow-hidden border border-slate-700 h-48 group">
                        <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity gap-2">
                          <button onClick={() => { setFile(null); setPreviewUrl(null); setHealthResult(null); }} className="p-2 bg-slate-700 text-white rounded-full hover:bg-slate-600 transition-colors">
                            <X className="w-4 h-4" />
                          </button>
                          <button onClick={handleAnalyze} disabled={analyzing} className="px-4 py-2 bg-pink-500 text-white font-medium rounded-full hover:bg-pink-600 transition-colors flex items-center gap-2 disabled:opacity-50">
                            {analyzing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Stethoscope className="w-4 h-4" />} Analyze
                          </button>
                        </div>
                      </div>
                    )}
                    <input type="file" accept="image/*" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
                  </div>

                  {/* Result */}
                  <div className="flex-1 bg-slate-900/50 rounded-xl border border-slate-700 p-5 relative overflow-hidden">
                    {!healthResult ? (
                      <div className="h-full flex items-center justify-center text-slate-500 text-sm italic">
                        No recent scan results.
                      </div>
                    ) : (
                      <>
                        <div className="absolute top-0 right-0 p-2">
                          <span className="text-[10px] font-mono text-slate-500 border border-slate-700 rounded px-1 py-0.5 bg-slate-900">
                            {healthResult.model_type || 'opencv_heuristic'}
                          </span>
                        </div>
                        <h4 className="text-pink-400 font-bold mb-1">Detected Condition</h4>
                        <p className="text-2xl font-bold text-white capitalize mb-4">{healthResult.predicted_condition}</p>
                        
                        <div className="flex items-center gap-2 mb-4">
                          <div className="w-full bg-slate-700 rounded-full h-2">
                            <div className="bg-pink-500 h-2 rounded-full" style={{ width: `${(healthResult.confidence || 0.85) * 100}%` }}></div>
                          </div>
                          <span className="text-xs font-bold text-white w-10 text-right">{Math.round((healthResult.confidence || 0.85) * 100)}%</span>
                        </div>

                        {healthResult.vet_booking_requested && (
                          <div className="mt-4 p-3 bg-orange-500/10 border border-orange-500/30 rounded-lg flex items-start gap-3">
                            <AlertTriangle className="w-5 h-5 text-orange-400 shrink-0 mt-0.5" />
                            <p className="text-sm text-slate-300">
                              <span className="text-orange-400 font-semibold block">Vet Attention Recommended</span>
                              This condition requires professional diagnosis. A local vet request has been logged.
                            </p>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
