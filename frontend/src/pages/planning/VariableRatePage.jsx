import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { MapContainer, TileLayer, Polygon, Tooltip } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

export default function VariableRatePage() {
  const navigate = useNavigate();
  const [farmId, setFarmId] = useState('');
  const [crop, setCrop] = useState('Wheat');
  const [zones, setZones] = useState([]);
  const [boundary, setBoundary] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  useEffect(() => {
    const id = localStorage.getItem('farmId') || 'b7d4c0b0-030c-469c-8b30-f8b52be579df';
    setFarmId(id);
    fetchData(id);
  }, []);

  const fetchData = async (id) => {
    try {
      const [zonesRes, boundaryRes] = await Promise.all([
        axios.get(`${API_BASE}/api/v1/farm/${id}/zones`),
        axios.get(`${API_BASE}/api/v1/farm/${id}/boundary`).catch(() => ({ data: null }))
      ]);
      setZones(zonesRes.data);
      if (boundaryRes.data) {
        setBoundary(boundaryRes.data);
      }
    } catch (err) {
      console.error(err);
      setError('Unable to load farm zones.');
    }
  };

  const handleGenerate = async () => {
    if (!farmId || zones.length === 0) return;
    setLoading(true);
    setError('');
    
    try {
      // Map zones to ensure zone_id is a string as required by schema
      const payloadZones = zones.map(z => ({
        ...z,
        zone_id: String(z.zone_id)
      }));
      
      const res = await axios.post(`${API_BASE}/api/v1/planning/variable-rate`, {
        farm_id: farmId,
        crop: crop,
        zones: payloadZones
      });
      setResult(res.data);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to generate variable rate map');
    } finally {
      setLoading(false);
    }
  };

  const downloadGeoJson = async () => {
    try {
      const res = await axios.get(`${API_BASE}/api/v1/planning/variable-rate/${result.id}/export`, { responseType: 'blob' });
      const url = URL.createObjectURL(res.data);
      const a = document.createElement('a');
      a.href = url;
      a.download = `VRA_Prescription_${farmId}.geojson`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      setError('Unable to export prescription.');
    }
  };

  return (
    <div className="flex flex-col min-h-[100dvh] bg-background pb-20">
      {/* Header */}
      <header className="bg-surface sticky top-0 z-10 px-4 py-3 flex items-center gap-3 shadow-sm border-b border-outline-variant/30">
        <button onClick={() => navigate(-1)} className="w-10 h-10 flex items-center justify-center rounded-full active:bg-surface-container transition-colors text-on-surface">
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <div className="flex flex-col">
          <h1 className="font-headline-sm text-headline-sm text-on-surface">NPK Dosage Tool</h1>
          <p className="font-label-sm text-label-sm text-on-surface-variant">Variable Rate Prescriptions</p>
        </div>
      </header>

      <main className="flex-1 p-space-md flex flex-col gap-space-lg animate-fade-in">
        
        {/* Setup Card */}
        <div className="bg-surface-container-low p-space-md rounded-xl shadow-sm flex flex-col gap-space-md border border-outline-variant/30">
          <div className="flex flex-col gap-1">
            <h2 className="font-title-md text-title-md text-on-surface font-semibold">Generate Prescription</h2>
            <p className="font-body-sm text-body-sm text-on-surface-variant">
              Calculate zone-specific NPK fertilizer, seed rate, and pesticide dosage based on satellite soil health data.
            </p>
          </div>
          
          <div className="flex flex-col gap-2">
            <label className="font-label-md text-label-md text-on-surface-variant font-medium">Target Crop</label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[20px]">grass</span>
              <input 
                type="text"
                value={crop} 
                onChange={e => setCrop(e.target.value)}
                className="w-full h-12 bg-surface pl-10 pr-4 rounded-lg border border-outline-variant text-on-surface font-body-md focus:border-primary focus:outline-none transition-colors"
                placeholder="e.g. Wheat, Rice, Soybean"
              />
            </div>
          </div>
          
          <button 
            onClick={handleGenerate}
            disabled={loading || zones.length === 0}
            className="h-12 w-full bg-primary text-on-primary rounded-full font-label-lg text-label-lg flex items-center justify-center gap-2 active:opacity-90 transition-opacity disabled:opacity-50 mt-2"
          >
            {loading ? (
              <span className="material-symbols-outlined animate-spin text-[20px]">progress_activity</span>
            ) : (
              <span className="material-symbols-outlined text-[20px]">science</span>
            )}
            {loading ? 'Calculating Dosage...' : 'Calculate NPK Dosage'}
          </button>
          
          {error && (
            <div className="bg-error-container text-on-error-container p-3 rounded-lg font-body-sm text-body-sm flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px]">error</span>
              {typeof error === 'object' ? JSON.stringify(error) : error}
            </div>
          )}
          
          {!error && zones.length === 0 && !loading && (
            <div className="bg-secondary-container text-on-secondary-container p-3 rounded-lg font-body-sm text-body-sm flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px]">info</span>
              Scanning satellite data for farm zones...
            </div>
          )}
          
          {/* Map Overlay */}
          {boundary && boundary.boundary_points && boundary.boundary_points.length > 0 && (
            <div className="w-full h-48 rounded-xl overflow-hidden border border-outline-variant/30 mt-2 z-0 relative">
              <MapContainer 
                center={[boundary.boundary_points[0].lat, boundary.boundary_points[0].lng]} 
                zoom={17} 
                className="w-full h-full z-0"
                zoomControl={false}
              >
                <TileLayer url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}" />
                
                {/* Farm Boundary */}
                <Polygon 
                  positions={boundary.boundary_points.map(p => [p.lat, p.lng])} 
                  pathOptions={{ color: '#4CAF50', fillColor: 'transparent', weight: 3 }} 
                />
                
                {/* Zones (if available in boundary API) */}
                {boundary.zones?.map((zone, idx) => {
                  if (!zone.polygon_points || zone.polygon_points.length === 0) return null;
                  
                  // Zone colors based on ID
                  const colors = { 1: '#4CAF50', 2: '#FFC107', 3: '#F44336', 4: '#E91E63' };
                  const color = colors[zone.zone_id] || '#2196F3';
                  
                  return (
                    <Polygon 
                      key={idx}
                      positions={zone.polygon_points.map(p => [p.lat, p.lng])} 
                      pathOptions={{ color, fillColor: color, fillOpacity: 0.5, weight: 2 }}
                    >
                      <Tooltip direction="top" opacity={1}>Zone {zone.zone_id}</Tooltip>
                    </Polygon>
                  );
                })}
              </MapContainer>
              <div className="absolute top-2 right-2 bg-surface/80 backdrop-blur-sm px-2 py-1 rounded text-[10px] font-bold text-on-surface z-[1000] shadow-sm">
                SATELLITE
              </div>
            </div>
          )}
        </div>

        {/* Results */}
        {result && (
          <div className="flex flex-col gap-space-md animate-slide-up">
            <div className="flex items-center justify-between px-1">
              <h3 className="font-title-md text-title-md text-on-surface font-bold">Zone Prescriptions</h3>
              <button 
                onClick={downloadGeoJson}
                className="text-primary font-label-md text-label-md font-bold flex items-center gap-1 active:bg-primary-container px-3 py-1.5 rounded-full transition-colors border border-primary/30"
              >
                <span className="material-symbols-outlined text-[18px]">download</span> Export Map
              </button>
            </div>
            
            <div className="grid grid-cols-1 gap-3">
              {result.zone_prescriptions?.map((zp, i) => (
                <div key={i} className="bg-surface p-4 rounded-xl shadow-sm border border-outline-variant/50 flex flex-col gap-3">
                  <div className="flex items-center justify-between border-b border-outline-variant/50 pb-3">
                    <span className="font-title-md text-title-md text-on-surface font-bold flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full" style={{backgroundColor: zp.zone_id === '1' || zp.zone_id === 1 ? '#4CAF50' : zp.zone_id === '2' || zp.zone_id === 2 ? '#FFC107' : '#F44336'}}></span>
                      Zone {zp.zone_id}
                    </span>
                    <span className="font-label-sm text-label-sm text-on-surface-variant bg-surface-container px-2.5 py-1 rounded-md font-medium">
                      {zp.zone_id === '1' || zp.zone_id === 1 ? 'High Yield' : zp.zone_id === '2' || zp.zone_id === 2 ? 'Medium Yield' : 'Low Yield'}
                    </span>
                  </div>
                  
                  <div className="flex flex-col gap-2 pt-1">
                    <div className="flex items-center justify-between bg-surface-container-lowest border border-outline-variant/30 p-2.5 rounded-lg">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-secondary-container text-on-secondary-container flex items-center justify-center">
                          <span className="material-symbols-outlined text-[18px]">science</span>
                        </div>
                        <span className="font-label-md text-label-md text-on-surface">Fertilizer (NPK)</span>
                      </div>
                      <span className="font-headline-sm text-headline-sm text-on-surface font-bold">{zp.fertilizer_kg.toFixed(1)} <span className="font-label-sm text-label-sm text-on-surface-variant font-normal">kg/ha</span></span>
                    </div>
                    
                    <div className="flex items-center justify-between bg-surface-container-lowest border border-outline-variant/30 p-2.5 rounded-lg">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-tertiary-container text-on-tertiary-container flex items-center justify-center">
                          <span className="material-symbols-outlined text-[18px]">psychiatry</span>
                        </div>
                        <span className="font-label-md text-label-md text-on-surface">Seed Rate</span>
                      </div>
                      <span className="font-headline-sm text-headline-sm text-on-surface font-bold">{zp.seed_rate_kg.toFixed(1)} <span className="font-label-sm text-label-sm text-on-surface-variant font-normal">kg/ha</span></span>
                    </div>
                    
                    <div className="flex items-center justify-between bg-surface-container-lowest border border-outline-variant/30 p-2.5 rounded-lg">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-error-container text-on-error-container flex items-center justify-center">
                          <span className="material-symbols-outlined text-[18px]">pest_control</span>
                        </div>
                        <span className="font-label-md text-label-md text-on-surface">Pesticide</span>
                      </div>
                      <span className="font-headline-sm text-headline-sm text-on-surface font-bold">{zp.pesticide_ml.toFixed(1)} <span className="font-label-sm text-label-sm text-on-surface-variant font-normal">ml/ha</span></span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
