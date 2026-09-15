import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { 
  Map, Trash2, Save, RotateCcw, 
  MapPin, Layers, Info, Check, AlertCircle 
} from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

// Simple Shoelace formula (assumes flat plane for demo, normally use Haversine based projection)
// We'll treat the SVG canvas 0-1000 X/Y as roughly representing a 100 acre area for demo scaling
const calculateShoelaceArea = (points) => {
  if (points.length < 3) return 0;
  let area = 0;
  for (let i = 0; i < points.length; i++) {
    const j = (i + 1) % points.length;
    area += points[i].x * points[j].y;
    area -= points[j].x * points[i].y;
  }
  return Math.abs(area / 2);
};

export default function FieldBoundaryPage() {
  const [farmId, setFarmId] = useState('');
  const [points, setPoints] = useState([]);
  const [zones, setZones] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [toast, setToast] = useState(null);
  const svgRef = useRef(null);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleSvgClick = (e) => {
    if (zones.length > 0) return; // Prevent editing if zones are already generated
    const rect = svgRef.current.getBoundingClientRect();
    const x = Math.round((e.clientX - rect.left) / rect.width * 1000);
    const y = Math.round((e.clientY - rect.top) / rect.height * 1000);
    setPoints([...points, { x, y }]);
  };

  const areaPixels = calculateShoelaceArea(points);
  // Arbitrary scale factor for demo: 10000 pixels = 1 acre
  const estimatedAcres = (areaPixels / 10000).toFixed(2);

  const loadZones = async (idToLoad) => {
    if (!idToLoad) return;
    setLoading(true);
    setError('');
    try {
      const res = await axios.get(`${API_BASE}/api/v1/farm/${idToLoad}/zones`);
      setZones(res.data);
      if (res.data.length > 0) {
        // Just extract points from first zone as demo boundary
        // In a real app we'd load the boundary itself too
        showToast('Zones loaded from server');
      }
    } catch (err) {
      if (err.response?.status === 404) {
        setZones([]);
        showToast('No zones found for this farm', 'info');
      } else {
        setError(err.response?.data?.detail || 'Failed to load zones');
      }
    } finally {
      setLoading(false);
    }
  };

  const saveBoundary = async () => {
    if (!farmId) {
      setError('Please enter a Farm ID first');
      return;
    }
    if (points.length < 3) {
      setError('Draw at least 3 points to form a polygon');
      return;
    }

    setLoading(true);
    setError('');
    
    // Map our X/Y to fake lat/lng around a center point for demo
    const baseLat = 18.5204;
    const baseLng = 73.8567;
    const gps_points = points.map(p => ({
      lat: baseLat + (p.y / 100000),
      lng: baseLng + (p.x / 100000)
    }));

    try {
      const res = await axios.post(`${API_BASE}/api/v1/farm/${farmId}/boundary`, {
        gps_points
      });
      setZones(res.data.zones || []);
      showToast('Boundary saved and zones generated');
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to save boundary');
    } finally {
      setLoading(false);
    }
  };

  const resetCanvas = () => {
    setPoints([]);
    setZones([]);
    setError('');
  };

  // Helper to map zone data back to our SVG coordinates
  const renderZonePolygon = (zone, i) => {
    // If the server sends real lat/lng back, we'd need to inverse map it.
    // For this UI demo, if we just saved it, we'll draw abstract polygons based on the zone array
    // Let's assume the backend returned something we can map or we just color code it
    
    // As a simple visualization for the demo, we'll just tint the whole boundary 
    // based on the first zone's score, or we can just show the boundary and list the zones.
    // Wait, the spec says "zone color mapping based on soil_score/ndvi_score".
    // If the backend returns actual sub-polygons in `polygon_points`, we'd map them here.
    
    const polyPointsStr = zone.polygon_points 
      ? zone.polygon_points.map(p => {
          // reverse map from lat/lng to our 0-1000 grid
          const x = (p.lng - 73.8567) * 100000;
          const y = (p.lat - 18.5204) * 100000;
          return `${x},${y}`;
        }).join(' ')
      : '';

    // Color based on ndvi_score (0-1)
    const hue = (zone.ndvi_score || 0.5) * 120; // 0 = red, 120 = green
    const color = `hsla(${hue}, 70%, 50%, 0.6)`;

    return (
      <polygon 
        key={i}
        points={polyPointsStr} 
        fill={color}
        stroke="rgba(255,255,255,0.5)"
        strokeWidth="2"
        className="transition-all duration-500 hover:opacity-80"
      >
        <title>Zone {zone.zone_id} | NDVI: {zone.ndvi_score?.toFixed(2)} | Soil: {zone.soil_score?.toFixed(2)}</title>
      </polygon>
    );
  };

  return (
    <div className="space-y-6">
      {toast && (
        <div className="fixed top-24 right-8 z-50 px-4 py-3 rounded-lg shadow-xl backdrop-blur-md border border-white/10 bg-emerald-500/20 text-emerald-400 flex items-center space-x-2">
          <Check className="w-5 h-5" />
          <span className="font-medium">{toast.msg}</span>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-cyan-400">
            Field Boundary & Zoning
          </h1>
          <p className="text-slate-400 mt-1">Draw farm perimeter to generate AI management zones</p>
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
            onClick={() => loadZones(farmId)}
            className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-md text-sm font-medium transition-colors"
          >
            Load Zones
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-lg flex items-center space-x-2">
          <AlertCircle className="w-5 h-5" />
          <span>{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Interactive Map Area */}
        <div className="lg:col-span-2 relative rounded-2xl overflow-hidden bg-slate-800/40 backdrop-blur-xl border border-slate-700/50 shadow-2xl h-[500px]">
          
          {/* Grid Background */}
          <div className="absolute inset-0 opacity-10 pointer-events-none" 
               style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '40px 40px' }} />
          
          <svg 
            ref={svgRef}
            viewBox="0 0 1000 1000"
            className={`w-full h-full ${zones.length === 0 ? 'cursor-crosshair' : 'cursor-default'}`}
            onClick={handleSvgClick}
          >
            {/* Draw current drawing polygon */}
            {points.length > 0 && zones.length === 0 && (
              <polygon 
                points={points.map(p => `${p.x},${p.y}`).join(' ')} 
                fill="rgba(52, 211, 153, 0.2)" 
                stroke="rgba(52, 211, 153, 0.8)" 
                strokeWidth="4" 
                strokeDasharray={points.length < 3 ? "10,10" : "none"}
              />
            )}
            
            {/* Draw points */}
            {zones.length === 0 && points.map((p, i) => (
              <circle key={i} cx={p.x} cy={p.y} r="8" fill="#34d399" stroke="#0f172a" strokeWidth="2" />
            ))}

            {/* Draw generated zones */}
            {zones.length > 0 && zones.map((z, i) => renderZonePolygon(z, i))}
          </svg>

          {/* Map Overlays */}
          <div className="absolute top-4 left-4 bg-slate-900/80 backdrop-blur-md border border-slate-700/50 rounded-lg p-3 shadow-lg pointer-events-none">
            <div className="flex items-center space-x-2 text-sm text-slate-300">
              <MapPin className="w-4 h-4 text-emerald-400" />
              <span>{points.length} Points</span>
            </div>
            <div className="flex items-center space-x-2 text-sm text-slate-300 mt-1">
              <Map className="w-4 h-4 text-cyan-400" />
              <span className="font-mono">{estimatedAcres} Acres</span>
            </div>
          </div>

          <div className="absolute bottom-4 right-4 flex space-x-2">
            <button 
              onClick={resetCanvas}
              className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-full shadow-lg border border-slate-600 transition-colors"
              title="Reset Canvas"
            >
              <RotateCcw className="w-5 h-5" />
            </button>
            {zones.length === 0 && points.length >= 3 && (
              <button 
                onClick={saveBoundary}
                disabled={loading}
                className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-medium rounded-full shadow-[0_0_15px_rgba(16,185,129,0.5)] transition-all flex items-center space-x-2 disabled:opacity-50"
              >
                <Save className="w-5 h-5" />
                <span>Generate Zones</span>
              </button>
            )}
          </div>
        </div>

        {/* Sidebar Info */}
        <div className="space-y-4">
          <div className="bg-slate-800/40 backdrop-blur-md border border-slate-700/50 rounded-2xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Info className="w-5 h-5 text-cyan-400" /> Instructions
            </h3>
            <ul className="space-y-3 text-sm text-slate-400">
              <li className="flex gap-2"><div className="w-1.5 h-1.5 rounded-full bg-cyan-400 mt-1.5 shrink-0"/> Click on the grid to drop GPS perimeter points.</li>
              <li className="flex gap-2"><div className="w-1.5 h-1.5 rounded-full bg-cyan-400 mt-1.5 shrink-0"/> Draw at least 3 points to form a closed polygon.</li>
              <li className="flex gap-2"><div className="w-1.5 h-1.5 rounded-full bg-cyan-400 mt-1.5 shrink-0"/> Click "Generate Zones" to run the K-Means clustering algorithm on the backend.</li>
              <li className="flex gap-2"><div className="w-1.5 h-1.5 rounded-full bg-cyan-400 mt-1.5 shrink-0"/> The backend will return management zones from the available soil and NDVI readings.</li>
            </ul>
          </div>

          {zones.length > 0 && (
            <div className="bg-slate-800/40 backdrop-blur-md border border-emerald-500/30 rounded-2xl p-6 shadow-[0_0_30px_rgba(16,185,129,0.1)]">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Layers className="w-5 h-5 text-emerald-400" /> Generated Zones
              </h3>
              <div className="space-y-3">
                {zones.map((z, i) => (
                  <div key={i} className="p-3 bg-slate-900/50 rounded-lg border border-slate-700">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-medium text-emerald-300">Zone {z.zone_id}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-400">Soil Score:</span>
                      <span className="text-white font-mono">{(z.soil_score || 0).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-xs mt-1">
                      <span className="text-slate-400">NDVI Score:</span>
                      <span className="text-white font-mono">{(z.ndvi_score || 0).toFixed(2)}</span>
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
