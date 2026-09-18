import { useState, useRef } from 'react';
import axios from 'axios';
import { 
  RadialBarChart, RadialBar, PolarAngleAxis, ResponsiveContainer 
} from 'recharts';
import { 
  Satellite, Video, Microscope, AlertTriangle, CheckCircle, 
  RefreshCw, UploadCloud, Eye, Sprout, Wind
} from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

export default function SatelliteVisionPage() {
  const [activeTab, setActiveTab] = useState('satellite'); // satellite, drone, grain
  const [farmId, setFarmId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Results
  const [stressResult, setStressResult] = useState(null);
  const [droneResult, setDroneResult] = useState(null);
  const [grainResult, setGrainResult] = useState(null);

  const fileInputRef = useRef(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [file, setFile] = useState(null);

  const handleStressCheck = async () => {
    if (!farmId) {
      setError('Farm ID required');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await axios.post(`${API_BASE}/api/v1/vision_forecast/stress-check`, { farm_id: farmId });
      setStressResult(res.data);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to check stress');
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    if (selected) {
      setFile(selected);
      if (selected.type.startsWith('image/')) {
        setPreviewUrl(URL.createObjectURL(selected));
      } else {
        setPreviewUrl('video');
      }
    }
  };

  const handleVisionUpload = async () => {
    if (!file || !farmId) {
      setError('Farm ID and File are required');
      return;
    }
    setLoading(true);
    setError('');
    const formData = new FormData();
    formData.append('farm_id', farmId);
    
    try {
      if (activeTab === 'drone') {
        formData.append('file', file);
        const res = await axios.post(`${API_BASE}/api/v1/vision_forecast/plant-count`, formData);
        setDroneResult(res.data);
      } else if (activeTab === 'grain') {
        formData.append('file', file);
        const res = await axios.post(`${API_BASE}/api/v1/vision_forecast/grain-quality`, formData);
        setGrainResult(res.data);
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to process vision task');
    } finally {
      setLoading(false);
    }
  };

  const clearFile = () => {
    setFile(null);
    setPreviewUrl(null);
    setDroneResult(null);
    setGrainResult(null);
  };

  // Stress Gauges Data
  const ndviData = stressResult ? [{ name: 'NDVI', value: Math.max(0, stressResult.ndvi_value), fill: '#34d399' }] : [];
  const ndwiData = stressResult ? [{ name: 'NDWI', value: Math.max(0, stressResult.ndwi_value), fill: '#38bdf8' }] : [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-indigo-500">
            Vision & Satellite Analytics
          </h1>
          <p className="text-slate-400 mt-1">Multi-spectral satellite imaging, drone AI, and optical grading</p>
        </div>
        
        <div className="flex bg-slate-800 p-1 rounded-lg border border-slate-700 w-max overflow-x-auto">
          <button 
            onClick={() => setActiveTab('satellite')}
            className={`px-4 py-2 rounded-md text-sm font-medium flex items-center gap-2 transition-all ${activeTab === 'satellite' ? 'bg-indigo-500/20 text-indigo-400 shadow-[inset_0_-2px_0_rgba(99,102,241,1)]' : 'text-slate-400 hover:text-slate-200'}`}
          >
            <Satellite className="w-4 h-4" /> Sentinel-2 Stress
          </button>
          <button 
            onClick={() => setActiveTab('drone')}
            className={`px-4 py-2 rounded-md text-sm font-medium flex items-center gap-2 transition-all ${activeTab === 'drone' ? 'bg-indigo-500/20 text-indigo-400 shadow-[inset_0_-2px_0_rgba(99,102,241,1)]' : 'text-slate-400 hover:text-slate-200'}`}
          >
            <Video className="w-4 h-4" /> Drone Plant Count
          </button>
          <button 
            onClick={() => setActiveTab('grain')}
            className={`px-4 py-2 rounded-md text-sm font-medium flex items-center gap-2 transition-all ${activeTab === 'grain' ? 'bg-indigo-500/20 text-indigo-400 shadow-[inset_0_-2px_0_rgba(99,102,241,1)]' : 'text-slate-400 hover:text-slate-200'}`}
          >
            <Microscope className="w-4 h-4" /> Grain Quality
          </button>
        </div>
      </div>

      <div className="bg-slate-800/40 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-4 flex flex-wrap gap-4 items-end shadow-xl">
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1">Farm ID</label>
          <input 
            value={farmId} onChange={e => setFarmId(e.target.value)}
            className="bg-slate-900 border border-slate-700 rounded-md px-3 py-2 text-sm text-white focus:ring-1 focus:ring-indigo-500 outline-none w-48"
            placeholder="Farm ID..."
          />
        </div>
        
        {activeTab === 'satellite' ? (
          <button 
            onClick={handleStressCheck} disabled={loading}
            className="px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white font-medium rounded-md flex items-center gap-2 transition-colors disabled:opacity-50"
          >
            {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Satellite className="w-4 h-4" />} Request Sentinel Data
          </button>
        ) : (
          <>
            <button 
              onClick={() => fileInputRef.current.click()} 
              className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white font-medium rounded-md flex items-center gap-2 transition-colors"
            >
              <UploadCloud className="w-4 h-4" /> {file ? file.name : (activeTab === 'drone' ? 'Select Video' : 'Select Image')}
            </button>
            <input type="file" accept={activeTab === 'drone' ? 'video/*' : 'image/*'} ref={fileInputRef} onChange={handleFileChange} className="hidden" />
            
            {file && (
              <button 
                onClick={handleVisionUpload} disabled={loading}
                className="px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white font-medium rounded-md flex items-center gap-2 transition-colors disabled:opacity-50"
              >
                {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Eye className="w-4 h-4" />} Analyze Media
              </button>
            )}
            {file && (
              <button onClick={clearFile} className="px-2 py-2 text-slate-400 hover:text-white">Clear</button>
            )}
          </>
        )}
      </div>

      {error && (
        <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* SATELLITE TAB CONTENT */}
      {activeTab === 'satellite' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-slate-800/40 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6 shadow-xl relative overflow-hidden">
            <h2 className="text-lg font-semibold text-white mb-6">Spectral Indices (Gauges)</h2>
            {!stressResult ? (
              <div className="h-48 flex items-center justify-center text-slate-500">Run stress check to view gauges.</div>
            ) : (
              <div className="flex flex-wrap justify-around items-center">
                <div className="flex flex-col items-center">
                  <div className="h-40 w-40 relative">
                    <ResponsiveContainer width="100%" height="100%">
                      <RadialBarChart innerRadius="70%" outerRadius="100%" data={ndviData} startAngle={180} endAngle={0} >
                        <PolarAngleAxis type="number" domain={[0, 1]} angleAxisId={0} tick={false} />
                        <RadialBar minAngle={15} background={{ fill: '#1e293b' }} clockWise={true} dataKey="value" cornerRadius={10} />
                      </RadialBarChart>
                    </ResponsiveContainer>
                    <div className="absolute inset-0 flex flex-col items-center justify-center -mt-6">
                      <span className="text-3xl font-bold text-white">{stressResult.ndvi_value.toFixed(2)}</span>
                    </div>
                  </div>
                  <p className="text-emerald-400 font-semibold mt-2">NDVI (Vegetation)</p>
                </div>

                <div className="flex flex-col items-center">
                  <div className="h-40 w-40 relative">
                    <ResponsiveContainer width="100%" height="100%">
                      <RadialBarChart innerRadius="70%" outerRadius="100%" data={ndwiData} startAngle={180} endAngle={0} >
                        <PolarAngleAxis type="number" domain={[-1, 1]} angleAxisId={0} tick={false} />
                        <RadialBar minAngle={15} background={{ fill: '#1e293b' }} clockWise={true} dataKey="value" cornerRadius={10} />
                      </RadialBarChart>
                    </ResponsiveContainer>
                    <div className="absolute inset-0 flex flex-col items-center justify-center -mt-6">
                      <span className="text-3xl font-bold text-white">{stressResult.ndwi_value.toFixed(2)}</span>
                    </div>
                  </div>
                  <p className="text-cyan-400 font-semibold mt-2">NDWI (Water)</p>
                </div>
              </div>
            )}
          </div>

          <div className="lg:col-span-1 bg-slate-800/40 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6 shadow-xl">
             <h2 className="text-lg font-semibold text-white mb-4">Farm Status</h2>
             {!stressResult ? (
               <p className="text-slate-500 text-sm">No data</p>
             ) : (
               <div className={`p-4 rounded-xl border ${
                  stressResult.stress_level === 'severe' ? 'bg-red-500/10 border-red-500/30' : 
                  stressResult.stress_level === 'moderate' ? 'bg-orange-500/10 border-orange-500/30' :
                  stressResult.stress_level === 'mild' ? 'bg-yellow-500/10 border-yellow-500/30' :
                  'bg-emerald-500/10 border-emerald-500/30'
               }`}>
                 <div className="flex items-center gap-3 mb-2">
                   {stressResult.stress_level === 'none' ? <CheckCircle className="w-6 h-6 text-emerald-400" /> : <AlertTriangle className={`w-6 h-6 ${stressResult.stress_level === 'severe' ? 'text-red-400' : 'text-orange-400'}`} />}
                   <span className={`text-xl font-bold capitalize ${
                      stressResult.stress_level === 'severe' ? 'text-red-400' : 
                      stressResult.stress_level === 'moderate' ? 'text-orange-400' :
                      stressResult.stress_level === 'mild' ? 'text-yellow-400' :
                      'text-emerald-400'
                   }`}>{stressResult.stress_level} Stress</span>
                 </div>
                 <p className="text-slate-300 text-sm">
                   {stressResult.stress_level === 'none' 
                     ? 'Crop is healthy. NDVI and NDWI are within optimal bounds.'
                     : 'Multi-band analysis indicates deviation from normal vegetative health. Ground truth inspection recommended.'}
                 </p>
               </div>
             )}
          </div>
        </div>
      )}

      {/* DRONE TAB CONTENT */}
      {activeTab === 'drone' && (
        <div className="bg-slate-800/40 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6 shadow-xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-slate-900 border border-slate-700 rounded-xl flex items-center justify-center min-h-[300px]">
              {previewUrl === 'video' ? (
                 <Video className="w-16 h-16 text-indigo-400 opacity-50" />
              ) : (
                 <p className="text-slate-500">Video Preview</p>
              )}
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white mb-6">AI Plant Counting</h2>
              {!droneResult ? (
                <p className="text-slate-400 text-sm">Upload a drone sweep video (.mp4) to detect individual plants and measure emergence gaps.</p>
              ) : (
                <div className="space-y-4">
                  <div className="bg-indigo-500/10 border border-indigo-500/20 p-4 rounded-xl">
                    <p className="text-indigo-400 text-sm font-semibold mb-1">Total Stand Count</p>
                    <p className="text-4xl font-bold text-white">{droneResult.count.toLocaleString()}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-slate-900/50 border border-slate-700 p-4 rounded-xl">
                      <p className="text-slate-400 text-xs mb-1 flex items-center gap-1"><Wind className="w-3.5 h-3.5"/> Emergence Gaps</p>
                      <p className="text-xl font-semibold text-orange-400">{droneResult.gaps_detected}</p>
                    </div>
                    <div className="bg-slate-900/50 border border-slate-700 p-4 rounded-xl">
                      <p className="text-slate-400 text-xs mb-1 flex items-center gap-1"><Sprout className="w-3.5 h-3.5"/> Est. Stage</p>
                      <p className="text-xl font-semibold text-emerald-400 capitalize">{droneResult.growth_stage}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* GRAIN TAB CONTENT */}
      {activeTab === 'grain' && (
        <div className="bg-slate-800/40 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6 shadow-xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-slate-900 border border-slate-700 rounded-xl overflow-hidden min-h-[300px] flex items-center justify-center">
              {previewUrl && previewUrl !== 'video' ? (
                <img src={previewUrl} alt="Grain Sample" className="w-full h-full object-cover" />
              ) : (
                <p className="text-slate-500">Image Preview</p>
              )}
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white mb-6">Optical Grain Grading</h2>
              {!grainResult ? (
                <p className="text-slate-400 text-sm">Upload an image of the harvested grain sample to determine physical quality metrics before marketplace listing.</p>
              ) : (
                <div className="space-y-6">
                  <div className="flex items-center gap-4">
                    <div className={`w-16 h-16 rounded-full flex items-center justify-center text-3xl font-black border-4 shadow-xl
                      ${grainResult.grade === 'A' ? 'bg-emerald-500 text-white border-emerald-400 shadow-emerald-500/30' :
                        grainResult.grade === 'B' ? 'bg-yellow-500 text-white border-yellow-400 shadow-yellow-500/30' :
                        'bg-red-500 text-white border-red-400 shadow-red-500/30'
                      }`}>
                      {grainResult.grade}
                    </div>
                    <div>
                      <p className="text-slate-400 text-sm">Automated Grade</p>
                      <p className="text-xl font-bold text-white">Quality Classification</p>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="bg-slate-900/50 border border-slate-700 p-3 rounded-lg flex justify-between items-center">
                      <span className="text-slate-400 text-sm">Moisture Content (Est.)</span>
                      <span className={`font-mono font-bold ${grainResult.moisture_pct > 14 ? 'text-red-400' : 'text-emerald-400'}`}>{grainResult.moisture_pct}%</span>
                    </div>
                    <div className="bg-slate-900/50 border border-slate-700 p-3 rounded-lg flex justify-between items-center">
                      <span className="text-slate-400 text-sm">Broken Grains (Est.)</span>
                      <span className="font-mono font-bold text-orange-400">{grainResult.broken_pct}%</span>
                    </div>
                    <div className="bg-slate-900/50 border border-slate-700 p-3 rounded-lg flex justify-between items-center">
                      <span className="text-slate-400 text-sm">Foreign Matter (Est.)</span>
                      <span className="font-mono font-bold text-yellow-400">{grainResult.foreign_matter_pct}%</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
