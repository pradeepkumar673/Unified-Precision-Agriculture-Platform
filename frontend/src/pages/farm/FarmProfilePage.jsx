import { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Sprout, Droplets, MapPin, Tractor, 
  Calendar, Check, AlertCircle, RefreshCw, 
  Plus, Edit2, Save, X
} from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

export default function FarmProfilePage() {
  const [farmId, setFarmId] = useState('');
  const [farmData, setFarmData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    land_size_acres: '',
    soil_type: 'loam',
    water_source: 'borewell',
    latitude: '',
    longitude: '',
    equipment_owned: [],
    annual_income_range: 'under_1L',
    crop_history: []
  });

  const [toast, setToast] = useState(null);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const loadProfile = async (idToLoad) => {
    if (!idToLoad) return;
    setLoading(true);
    setError('');
    try {
      const res = await axios.get(`${API_BASE}/api/v1/farm/profile/${idToLoad}`);
      setFarmData(res.data);
      setFormData(res.data);
      setFarmId(idToLoad);
      // Persist farm ID so dashboard and all other pages work automatically
      localStorage.setItem('farmId', res.data.id);
      showToast('Profile loaded');
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const payload = {
        ...formData,
        land_size_acres: parseFloat(formData.land_size_acres) || 0,
        latitude: parseFloat(formData.latitude) || 0,
        longitude: parseFloat(formData.longitude) || 0,
        equipment_owned: typeof formData.equipment_owned === 'string' 
          ? formData.equipment_owned.split(',').map(s => s.trim()).filter(Boolean)
          : formData.equipment_owned
      };

      if (farmData?.id) {
        // Update
        const res = await axios.put(`${API_BASE}/api/v1/farm/profile/${farmData.id}`, payload);
        setFarmData(res.data);
        localStorage.setItem('farmId', res.data.id);
        showToast('Profile updated successfully');
      } else {
        // Create
        const res = await axios.post(`${API_BASE}/api/v1/farm/profile`, payload);
        setFarmData(res.data);
        setFarmId(res.data.id);
        // Persist so all pages can use it without manual input
        localStorage.setItem('farmId', res.data.id);
        showToast('Profile created successfully');
      }
      setIsEditing(false);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to save profile');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className="min-h-[max(884px,100dvh)] bg-slate-950 text-slate-100 p-4 sm:p-6 lg:p-8 overflow-auto">
      <div className="mx-auto max-w-7xl space-y-6">
      {toast && (
        <div className={`fixed right-8 top-24 z-50 flex items-center space-x-2 rounded-lg border border-slate-700 bg-slate-900/90 px-4 py-3 shadow-[0_20px_60px_rgba(2,6,23,0.7)] ${
          toast.type === 'success' ? 'text-emerald-400' : 'text-red-400'
        }`}>
          {toast.type === 'success' ? <Check className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
          <span className="font-medium">{toast.msg}</span>
        </div>
      )}

      {/* Top Bar: Switcher */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-3xl font-bold text-white">Digital Farm Profile</h1>
          <p className="mt-1 text-slate-300">Manage farm demographics and soil characteristics.</p>
        </div>
        <div className="flex items-center space-x-2 bg-slate-800/50 p-1.5 rounded-lg border border-slate-700/50">
          <input
            type="text"
            placeholder="Enter Farm ID..."
            value={farmId}
            onChange={(e) => setFarmId(e.target.value)}
            className="bg-slate-900 border border-slate-700 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 w-64"
          />
          <button 
            onClick={() => loadProfile(farmId)}
            className="p-1.5 bg-emerald-500/20 text-emerald-400 rounded-md hover:bg-emerald-500/30 transition-colors"
          >
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button 
            onClick={() => { setFarmData(null); setFarmId(''); setIsEditing(true); }}
            className="p-1.5 bg-cyan-500/20 text-cyan-400 rounded-md hover:bg-cyan-500/30 transition-colors"
            title="New Farm"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-lg flex items-center space-x-2">
          <AlertCircle className="w-5 h-5" />
          <span>{error}</span>
        </div>
      )}

      {(!farmData && !isEditing) ? (
        <div className="h-64 flex flex-col items-center justify-center text-slate-500 border-2 border-dashed border-slate-700/50 rounded-2xl bg-slate-800/20 backdrop-blur-sm">
          <Sprout className="w-12 h-12 mb-3 text-slate-600" />
          <p>Enter a Farm ID to load or create a new profile.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Main Card (Glassmorphism) */}
          <div className="relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/80 shadow-[0_10px_30px_rgba(2,6,23,0.35)] lg:col-span-2">
            <div className="relative z-10 p-6">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                    {farmData?.name || 'New Farm'}
                    {farmData && !isEditing && (
                      <span className="text-xs font-mono text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded-full border border-emerald-400/20">
                        ID: {farmData.id.slice(0,8)}...
                      </span>
                    )}
                  </h2>
                </div>
                {!isEditing ? (
                  <button 
                    onClick={() => setIsEditing(true)}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-700/50 hover:bg-slate-700 text-slate-300 transition-colors text-sm font-medium"
                  >
                    <Edit2 className="w-4 h-4" /> Edit Profile
                  </button>
                ) : (
                  <div className="flex gap-2">
                    <button 
                      onClick={() => setIsEditing(false)}
                      className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-700/50 hover:bg-slate-700 text-slate-300 transition-colors text-sm font-medium"
                    >
                      <X className="w-4 h-4" /> Cancel
                    </button>
                    <button 
                      onClick={handleSubmit}
                      className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white transition-colors text-sm font-medium shadow-lg shadow-emerald-500/20"
                    >
                      <Save className="w-4 h-4" /> Save
                    </button>
                  </div>
                )}
              </div>

              {!isEditing ? (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-6 mt-8">
                  <div className="flex flex-col">
                    <span className="text-slate-400 text-sm mb-1 flex items-center gap-1"><MapPin className="w-4 h-4"/> Location</span>
                    <span className="font-semibold">{farmData.latitude}, {farmData.longitude}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-slate-400 text-sm mb-1 flex items-center gap-1"><MapPin className="w-4 h-4"/> Land Size</span>
                    <span className="font-semibold text-emerald-400 text-xl">{farmData.land_size_acres} <span className="text-sm text-slate-300">acres</span></span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-slate-400 text-sm mb-1">Income Range</span>
                    <span className="font-medium capitalize">{farmData.annual_income_range?.replace(/_/g, ' ')}</span>
                  </div>
                  
                  {/* Badges */}
                  <div className="col-span-full flex gap-3 mt-4">
                    <div className="px-3 py-1.5 rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-400 flex items-center gap-2 text-sm font-medium">
                      <Sprout className="w-4 h-4"/>
                      <span className="capitalize">{farmData.soil_type} Soil</span>
                    </div>
                    <div className="px-3 py-1.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center gap-2 text-sm font-medium">
                      <Droplets className="w-4 h-4"/>
                      <span className="capitalize">{farmData.water_source}</span>
                    </div>
                  </div>
                  
                  {farmData.equipment_owned?.length > 0 && (
                    <div className="col-span-full mt-4">
                      <span className="text-slate-400 text-sm mb-2 flex items-center gap-1"><Tractor className="w-4 h-4"/> Equipment Owned</span>
                      <div className="flex flex-wrap gap-2">
                        {farmData.equipment_owned.map((eq, i) => (
                          <span key={i} className="px-2 py-1 text-xs rounded-md bg-slate-700/50 text-slate-300 border border-slate-600">{eq}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <form className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-400 mb-1">Farm Name</label>
                      <input name="name" value={formData.name} onChange={handleInputChange} className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-4 py-2 focus:ring-2 focus:ring-emerald-500/50 outline-none" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-400 mb-1">Land Size (Acres)</label>
                      <input type="number" name="land_size_acres" value={formData.land_size_acres} onChange={handleInputChange} className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-4 py-2 focus:ring-2 focus:ring-emerald-500/50 outline-none" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-400 mb-1">Soil Type</label>
                      <select name="soil_type" value={formData.soil_type} onChange={handleInputChange} className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-4 py-2 focus:ring-2 focus:ring-emerald-500/50 outline-none capitalize">
                        {['clay','loam','sandy','silt','black','red'].map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-400 mb-1">Water Source</label>
                      <select name="water_source" value={formData.water_source} onChange={handleInputChange} className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-4 py-2 focus:ring-2 focus:ring-emerald-500/50 outline-none capitalize">
                        {['borewell','canal','rainfed','pond'].map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-400 mb-1">Latitude</label>
                      <input type="number" step="0.0001" name="latitude" value={formData.latitude} onChange={handleInputChange} className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-4 py-2 focus:ring-2 focus:ring-emerald-500/50 outline-none" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-400 mb-1">Longitude</label>
                      <input type="number" step="0.0001" name="longitude" value={formData.longitude} onChange={handleInputChange} className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-4 py-2 focus:ring-2 focus:ring-emerald-500/50 outline-none" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-400 mb-1">Income Range</label>
                      <select name="annual_income_range" value={formData.annual_income_range} onChange={handleInputChange} className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-4 py-2 focus:ring-2 focus:ring-emerald-500/50 outline-none">
                        <option value="under_1L">Under 1 Lakh</option>
                        <option value="1L_5L">1L - 5L</option>
                        <option value="5L_10L">5L - 10L</option>
                        <option value="above_10L">Above 10L</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-400 mb-1">Equipment (comma separated)</label>
                      <input name="equipment_owned" value={typeof formData.equipment_owned === 'string' ? formData.equipment_owned : formData.equipment_owned?.join(', ') || ''} onChange={handleInputChange} className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-4 py-2 focus:ring-2 focus:ring-emerald-500/50 outline-none" placeholder="Tractor, Harvester..." />
                    </div>
                  </div>
                </form>
              )}
            </div>
          </div>

          {/* Crop History Timeline */}
          <div className="bg-slate-800/30 backdrop-blur-md border border-slate-700/50 rounded-2xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-emerald-400" /> Crop History
            </h3>
            
            {!farmData?.crop_history?.length && !isEditing ? (
              <p className="text-slate-500 text-sm italic">No crop history recorded.</p>
            ) : (
              <div className="space-y-4">
                {farmData?.crop_history?.map((ch, idx) => (
                  <div key={idx} className="relative pl-4 border-l border-slate-700">
                    <div className="absolute w-2 h-2 bg-emerald-500 rounded-full -left-[4.5px] top-1.5 shadow-[0_0_8px_rgba(16,185,129,0.8)]"></div>
                    <div className="text-sm font-medium text-emerald-300">{ch.season} {ch.year}</div>
                    <div className="text-white capitalize">{ch.crop}</div>
                  </div>
                ))}
              </div>
            )}

            {isEditing && (
              <div className="mt-6 p-4 bg-slate-900/50 rounded-lg border border-slate-700">
                <p className="text-xs text-slate-400 mb-2">Edit JSON (Advanced)</p>
                <textarea 
                  className="w-full bg-slate-950 text-emerald-400 text-xs font-mono p-2 rounded border border-slate-700 h-24 outline-none"
                  value={JSON.stringify(formData.crop_history || [], null, 2)}
                  onChange={(e) => {
                    try {
                      setFormData({...formData, crop_history: JSON.parse(e.target.value)});
                    } catch {}
                  }}
                />
              </div>
            )}
          </div>
        </div>
      )}
      </div>
    </div>
  );
}

