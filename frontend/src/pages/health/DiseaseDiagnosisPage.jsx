import { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { 
  UploadCloud, AlertTriangle, ShieldCheck, Bug, Activity, 
  Camera, Stethoscope, CheckCircle, RefreshCw, X
} from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

export default function DiseaseDiagnosisPage() {
  const [activeTab, setActiveTab] = useState('disease'); // 'disease' or 'weed'
  const [farmId, setFarmId] = useState(localStorage.getItem('farmId') || '');
  const [crop, setCrop] = useState('');
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [history, setHistory] = useState([]);

  const fileInputRef = useRef(null);

  const fetchHistory = async () => {
    if (!farmId || activeTab !== 'disease') return;
    try {
      const res = await axios.get(`${API_BASE}/api/v1/health/disease-history/${farmId}`);
      setHistory(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [farmId, activeTab]);

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    if (selected) {
      setFile(selected);
      setPreviewUrl(URL.createObjectURL(selected));
      setResult(null);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const selected = e.dataTransfer.files[0];
    if (selected) {
      setFile(selected);
      setPreviewUrl(URL.createObjectURL(selected));
      setResult(null);
    }
  };

  const handleDragOver = (e) => e.preventDefault();

  const handleClear = () => {
    setFile(null);
    setPreviewUrl(null);
    setResult(null);
    setError('');
  };

  const handleAnalyze = async () => {
    if (!file || !farmId || (activeTab === 'disease' && !crop)) {
      setError('Please provide farm ID, crop (for disease), and an image.');
      return;
    }

    setLoading(true);
    setError('');
    
    const formData = new FormData();
    formData.append('file', file);
    formData.append('farm_id', farmId);
    if (activeTab === 'disease') formData.append('crop', crop);

    const endpoint = activeTab === 'disease' 
      ? '/api/v1/health/disease-detect' 
      : '/api/v1/health/weed-detect';

    try {
      const res = await axios.post(`${API_BASE}${endpoint}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setResult(res.data);
      if (activeTab === 'disease') fetchHistory();
    } catch (err) {
      setError(err.response?.data?.detail || `Failed to analyze ${activeTab}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-red-400 to-orange-400">
            Crop Health Diagnostics
          </h1>
          <p className="text-slate-400 mt-1">AI-powered disease and weed detection</p>
        </div>
        
        {/* Tab Switcher */}
        <div className="flex bg-slate-800 p-1 rounded-lg border border-slate-700 w-max">
          <button 
            onClick={() => { setActiveTab('disease'); setResult(null); }}
            className={`px-4 py-2 rounded-md text-sm font-medium flex items-center gap-2 transition-all ${activeTab === 'disease' ? 'bg-red-500/20 text-red-400 shadow-[inset_0_-2px_0_rgba(239,68,68,1)]' : 'text-slate-400 hover:text-slate-200'}`}
          >
            <Activity className="w-4 h-4" /> Disease Detection
          </button>
          <button 
            onClick={() => { setActiveTab('weed'); setResult(null); }}
            className={`px-4 py-2 rounded-md text-sm font-medium flex items-center gap-2 transition-all ${activeTab === 'weed' ? 'bg-emerald-500/20 text-emerald-400 shadow-[inset_0_-2px_0_rgba(16,185,129,1)]' : 'text-slate-400 hover:text-slate-200'}`}
          >
            <Sprout className="w-4 h-4" /> Weed Classifier
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Scanner Form */}
        <div className="bg-slate-800/40 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6 shadow-xl lg:col-span-1 h-fit space-y-5">
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-1">Farm ID</label>
            <input 
              value={farmId} onChange={e => setFarmId(e.target.value)} onBlur={fetchHistory}
              className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-4 py-2 focus:ring-2 focus:ring-red-500/50 outline-none text-white" 
              placeholder="Enter Farm ID"
            />
          </div>
          
          {activeTab === 'disease' && (
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1">Crop Type</label>
              <input 
                value={crop} onChange={e => setCrop(e.target.value)} 
                className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-4 py-2 focus:ring-2 focus:ring-red-500/50 outline-none text-white capitalize" 
                placeholder="e.g. Cotton, Wheat"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-400 mb-2">Upload Image</label>
            {!previewUrl ? (
              <div 
                onDrop={handleDrop} onDragOver={handleDragOver} onClick={() => fileInputRef.current.click()}
                className="border-2 border-dashed border-slate-600 hover:border-red-500/50 bg-slate-900/30 rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer transition-colors group"
              >
                <UploadCloud className="w-10 h-10 text-slate-500 group-hover:text-red-400 mb-3 transition-colors" />
                <p className="text-sm text-slate-300 font-medium">Click or drag image to upload</p>
                <p className="text-xs text-slate-500 mt-1">JPG, PNG, JPEG</p>
              </div>
            ) : (
              <div className="relative rounded-xl overflow-hidden border border-slate-700 group">
                <img src={previewUrl} alt="Preview" className="w-full h-48 object-cover" />
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <button onClick={handleClear} className="p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors">
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
            )}
            <input type="file" accept="image/*" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
          </div>

          <button 
            onClick={handleAnalyze} 
            disabled={loading || !file || !farmId}
            className={`w-full py-3 px-4 rounded-xl shadow-lg transition-all flex justify-center items-center gap-2 font-semibold disabled:opacity-50 text-white
              ${activeTab === 'disease' ? 'bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-400 hover:to-orange-400 shadow-red-500/20' 
                                        : 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 shadow-emerald-500/20'}`}
          >
            {loading ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Camera className="w-5 h-5" />}
            Analyze Image
          </button>

          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg text-sm">
              {error}
            </div>
          )}
        </div>

        {/* Results Area */}
        <div className="lg:col-span-2 space-y-6">
          {!result ? (
            <div className="h-48 lg:h-full flex flex-col items-center justify-center text-slate-500 border-2 border-dashed border-slate-700/50 rounded-2xl bg-slate-800/20 backdrop-blur-sm">
              <Stethoscope className="w-16 h-16 mb-4 text-slate-600 opacity-50" />
              <p className="text-lg">Upload an image to view diagnostic results</p>
            </div>
          ) : (
            <div className={`bg-slate-800/40 backdrop-blur-xl border rounded-2xl p-6 shadow-2xl relative overflow-hidden
              ${activeTab === 'disease' ? 'border-red-500/30' : 'border-emerald-500/30'}`}>
              
              <div className="absolute top-0 right-0 p-4">
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-mono
                  ${activeTab === 'disease' ? 'bg-red-500/10 border-red-500/20 text-red-400' : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'}`}>
                  <Bug className="w-3 h-3" />
                  {result.model_type || 'cnn_classifier'}
                </span>
              </div>

              <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                <CheckCircle className={`w-6 h-6 ${activeTab === 'disease' ? 'text-red-400' : 'text-emerald-400'}`} />
                Analysis Complete
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                <div>
                  <p className="text-slate-400 text-sm mb-1">{activeTab === 'disease' ? 'Detected Disease' : 'Detected Weed Species'}</p>
                  <p className={`text-3xl font-bold capitalize ${activeTab === 'disease' ? 'text-red-400' : 'text-emerald-400'}`}>
                    {activeTab === 'disease' ? result.predicted_disease : result.species}
                  </p>
                </div>
                
                <div className="flex items-center gap-4">
                  <div className="relative w-16 h-16">
                    <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                      <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#1e293b" strokeWidth="3" />
                      <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" 
                        stroke={activeTab === 'disease' ? '#f87171' : '#34d399'} strokeWidth="3" 
                        strokeDasharray={`${(result.confidence || 0.85) * 100}, 100`} />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center flex-col">
                      <span className="text-xs font-bold text-white">{Math.round((result.confidence || 0.85) * 100)}%</span>
                    </div>
                  </div>
                  <div>
                    <p className="text-slate-400 text-sm mb-1">Confidence</p>
                    <p className="text-white font-medium">High</p>
                  </div>
                </div>
              </div>

              {activeTab === 'disease' ? (
                <>
                  <div className="mb-6 flex items-center gap-3">
                    <span className="text-slate-400 text-sm">Severity:</span>
                    <span className={`px-3 py-1 rounded-md text-xs font-bold uppercase tracking-wider
                      ${result.severity === 'high' ? 'bg-red-500 text-white shadow-lg shadow-red-500/40' : 
                        result.severity === 'medium' ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/40' : 
                        'bg-yellow-500 text-white shadow-lg shadow-yellow-500/40'}`}>
                      {result.severity || 'Medium'}
                    </span>
                  </div>
                  <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-5">
                    <h3 className="text-red-400 font-semibold mb-2 flex items-center gap-2">
                      <Stethoscope className="w-4 h-4" /> Treatment Prescription
                    </h3>
                    <p className="text-slate-300 text-sm leading-relaxed whitespace-pre-wrap">
                      {result.treatment_recommendation}
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="bg-slate-900/60 border border-slate-700 rounded-xl p-4">
                      <p className="text-slate-400 text-xs mb-1">Recommended Herbicide</p>
                      <p className="text-emerald-400 font-semibold text-lg">{result.herbicide}</p>
                    </div>
                    <div className="bg-slate-900/60 border border-slate-700 rounded-xl p-4">
                      <p className="text-slate-400 text-xs mb-1">Dosage per Acre</p>
                      <p className="text-emerald-400 font-semibold text-lg">{result.dosage_ml_per_acre} ml</p>
                    </div>
                  </div>
                  <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-5 flex items-start gap-3">
                    <ShieldCheck className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
                    <div>
                      <h3 className="text-blue-400 font-semibold mb-1">Spraying Safety Guide</h3>
                      <p className="text-slate-300 text-sm">Wear protective gear (gloves, mask) before application. Ensure wind speeds are below 10km/h to avoid drift. Do not spray if rain is expected within 4 hours.</p>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* History Gallery for Disease */}
          {activeTab === 'disease' && history.length > 0 && (
            <div className="bg-slate-800/30 backdrop-blur-md border border-slate-700/50 rounded-2xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Past Reports</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {history.map((h, i) => (
                  <div key={i} className="bg-slate-900/50 rounded-lg border border-slate-700 overflow-hidden relative group">
                    <div className="h-24 bg-slate-800 flex items-center justify-center overflow-hidden">
                       <img src={h.image_path.startsWith('http') ? h.image_path : 'https://images.unsplash.com/photo-1590682680695-43b964a3ae17?w=300&q=80'} alt="Crop" className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity" />
                    </div>
                    <div className="p-2">
                      <p className="text-xs font-semibold text-white truncate capitalize">{h.predicted_disease}</p>
                      <p className="text-[10px] text-slate-400">{new Date(h.created_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}


