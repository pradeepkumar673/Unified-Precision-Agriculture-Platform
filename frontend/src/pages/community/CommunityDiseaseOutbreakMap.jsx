import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { getPublicDiseaseReports } from '../../api/healthApi';
import { getFarmProfile } from '../../api/farmApi';

// Fix leaflet icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const redIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const orangeIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-orange.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const greenIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

function getDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    0.5 - Math.cos(dLat)/2 + 
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    (1 - Math.cos(dLon))/2;
  return R * 2 * Math.asin(Math.sqrt(a));
}

function timeAgo(dateString) {
  const diff = Date.now() - new Date(dateString).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

// Automatically re-center map if farm coordinates change
function MapCenterUpdater({ center }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, map.getZoom());
  }, [center, map]);
  return null;
}

export default function CommunityDiseaseOutbreakMap() {
  const navigate = useNavigate();
  const [activeView, setActiveView] = useState('map'); // map or list
  const [activeFilter, setActiveFilter] = useState('All');
  
  const [farm, setFarm] = useState(null);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const farmId = localStorage.getItem('farmId') || 'b7d4c0b0-030c-469c-8b30-f8b52be579df';
        if (farmId) {
          const farmRes = await getFarmProfile(farmId);
          setFarm(farmRes.data);
          
          const district = farmRes.data.district || 'Niphad';
          const reportRes = await getPublicDiseaseReports(district);
          setReports(reportRes.data);
        }
      } catch (err) {
        console.error("Failed to load map data", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const farmCenter = farm ? [farm.latitude || 20.0, farm.longitude || 74.0] : [20.0, 74.0];

  const processedReports = useMemo(() => {
    if (!farm) return [];
    return reports.map(r => {
      const dist = getDistance(farm.latitude, farm.longitude, r.latitude, r.longitude);
      return { ...r, distance: dist };
    }).sort((a, b) => a.distance - b.distance);
  }, [reports, farm]);
  
  const filteredReports = useMemo(() => {
    if (activeFilter === 'All') return processedReports;
    if (activeFilter === 'Within 10 km') return processedReports.filter(r => r.distance <= 10);
    return processedReports.filter(r => r.predicted_disease.includes(activeFilter));
  }, [processedReports, activeFilter]);

  const uniqueDiseases = useMemo(() => {
    const counts = {};
    reports.forEach(r => {
      const d = r.predicted_disease;
      counts[d] = (counts[d] || 0) + 1;
    });
    return Object.keys(counts).map(k => ({ label: k, count: counts[k] }));
  }, [reports]);

  const filters = [
    { label: 'All', icon: '', count: reports.length },
    ...uniqueDiseases.map(d => ({ label: d.label, icon: 'yard', count: d.count, dotClass: 'bg-primary' })),
    { label: 'Within 10 km', icon: 'near_me', count: processedReports.filter(r => r.distance <= 10).length }
  ];

  return (
    <div className="min-h-screen bg-surface-container-lowest text-on-surface flex flex-col relative">
      <main className="flex flex-col w-full pt-[56px] pb-24 bg-surface-container-lowest flex-1">
        
        <section className="px-gutter pt-space-md pb-space-xs">
          <div className="flex items-start justify-between">
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-primary text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>rss_feed</span>
                <span className="font-label-sm text-label-sm text-primary uppercase tracking-wider">Live Radar Sync</span>
              </div>
              <h2 className="font-headline-md text-headline-md text-on-surface tracking-tight">{farm ? farm.district || 'Community' : 'Loading'} Block Outbreaks</h2>
              <p className="font-label-md text-label-md text-on-surface-variant">Monitoring {reports.length} nearby disease cases</p>
            </div>
            
            <div className="flex bg-surface-container-highest p-1 rounded-lg shadow-inner">
              <button 
                onClick={() => setActiveView('map')}
                className={`w-11 h-9 rounded-md flex items-center justify-center transition-all ${activeView === 'map' ? 'bg-surface-container-lowest text-primary shadow-sm' : 'text-on-surface-variant hover:text-on-surface'}`} 
                type="button" 
                title="Map View"
              >
                <span className="material-symbols-outlined text-[20px]">map</span>
              </button>
              <button 
                onClick={() => setActiveView('list')}
                className={`w-11 h-9 rounded-md flex items-center justify-center transition-all ${activeView === 'list' ? 'bg-surface-container-lowest text-primary shadow-sm' : 'text-on-surface-variant hover:text-on-surface'}`} 
                type="button" 
                title="List View"
              >
                <span className="material-symbols-outlined text-[20px]">view_agenda</span>
              </button>
            </div>
          </div>
          
          <div className="flex gap-2 overflow-x-auto py-3 -mx-gutter px-gutter hide-scrollbar">
            {filters.map((filter) => (
              <button 
                key={filter.label}
                onClick={() => setActiveFilter(filter.label)}
                className={`filter-chip flex items-center gap-1 px-3 py-2 rounded-full font-label-md text-label-md shrink-0 active:scale-95 transition-transform ${activeFilter === filter.label ? 'bg-primary text-on-primary shadow-sm' : 'bg-surface-container text-on-surface'}`}
              >
                {filter.dotClass && <span className={`w-2 h-2 rounded-full ${filter.dotClass}`}></span>}
                {filter.icon && <span className={`material-symbols-outlined text-[16px] ${activeFilter === filter.label ? 'text-on-primary' : 'text-primary'}`}>{filter.icon}</span>}
                <span>{filter.label}</span>
                {filter.count !== null && <span className={activeFilter === filter.label ? 'font-label-sm text-label-sm' : 'text-on-surface-variant font-label-sm text-label-sm'}>{filter.count}</span>}
              </button>
            ))}
          </div>
        </section>

        {activeView === 'map' && (
          <section className="px-gutter pt-space-xs pb-space-sm relative z-0">
            <div className="relative w-full h-[400px] rounded-xl overflow-hidden shadow-sm bg-surface-container-high border border-surface-variant/30">
              {!loading && (
                <MapContainer center={farmCenter} zoom={11} scrollWheelZoom={false} className="w-full h-full">
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  <MapCenterUpdater center={farmCenter} />
                  
                  {farm && (
                    <Marker position={farmCenter} icon={greenIcon}>
                      <Popup>
                        <div className="font-bold">Your Farm</div>
                        <div>{farm.name}</div>
                      </Popup>
                    </Marker>
                  )}
                  
                  {filteredReports.map(r => (
                    <Marker 
                      key={r.id} 
                      position={[r.latitude, r.longitude]}
                      icon={r.severity === 'high' ? redIcon : orangeIcon}
                    >
                      <Popup>
                        <div className="flex flex-col gap-1 min-w-[150px]">
                          <div className={`font-bold ${r.severity === 'high' ? 'text-error' : 'text-primary'}`}>{r.predicted_disease}</div>
                          <div className="text-sm text-on-surface-variant">Crop: {r.crop}</div>
                          <div className="text-xs text-on-surface-variant">{timeAgo(r.created_at)}</div>
                        </div>
                      </Popup>
                    </Marker>
                  ))}
                  
                  {farm && (
                    <Circle center={farmCenter} radius={10000} pathOptions={{ color: 'blue', fillColor: 'blue', fillOpacity: 0.1, weight: 1 }} />
                  )}
                </MapContainer>
              )}
              
              <div className="absolute bottom-2 left-3 right-3 flex items-center justify-between text-on-surface font-label-sm text-label-sm pointer-events-none z-[400]">
                <span className="flex items-center gap-1 bg-surface/90 backdrop-blur-md px-2 py-0.5 rounded-md shadow">
                  <span className="material-symbols-outlined text-[14px] text-secondary">radar</span>
                  <span>Proximity Radius: 10 km</span>
                </span>
                <span className="bg-surface/90 backdrop-blur-md px-2 py-0.5 rounded-md shadow text-[11px]">Live Updates</span>
              </div>
            </div>
          </section>
        )}

        <section className="px-gutter pt-space-sm pb-1 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-error text-[22px]">crisis_alert</span>
            <h2 className="font-headline-sm text-headline-sm text-on-surface">Nearby Threat Feed</h2>
          </div>
          <span className="font-label-sm text-label-sm px-2.5 py-1 rounded-full bg-error-container text-on-error-container font-bold">
            {processedReports.filter(r => r.distance <= 10 && r.severity === 'high').length} Urgent Nearby
          </span>
        </section>

        <section className="px-gutter py-space-xs flex flex-col gap-space-md">
          {filteredReports.map(r => (
            <article key={r.id} className="bg-surface-container-lowest rounded-xl p-space-md shadow-sm flex flex-col gap-space-sm relative overflow-hidden transition-all hover:shadow-md border border-surface-variant/20">
              <div className={`absolute top-0 left-0 bottom-0 w-1.5 ${r.severity === 'high' ? 'bg-error' : 'bg-primary'}`}></div>
              
              <div className="flex items-center justify-between pl-1.5">
                <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full ${r.severity === 'high' ? 'bg-error-container text-on-error-container' : 'bg-primary-container text-on-primary-container'}`}>
                  <span className={`material-symbols-outlined text-[16px] ${r.severity === 'high' ? 'text-error animate-pulse' : 'text-primary'}`}>warning</span>
                  <span className="font-label-sm text-label-sm font-bold">{r.severity === 'high' ? 'High Risk' : 'Moderate Spread'}</span>
                </div>
              </div>
              
              <div className="flex items-start gap-space-sm pl-1.5">
                <div className="flex flex-col min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-1">
                    <h3 className="font-headline-sm text-headline-sm text-on-surface truncate">{r.predicted_disease.split('___').pop().replace(/_/g, ' ')}</h3>
                    <span className={`font-label-sm text-label-sm font-bold whitespace-nowrap ${r.severity === 'high' ? 'text-error' : 'text-primary'}`}>{r.distance.toFixed(1)} km away</span>
                  </div>
                  <p className="font-body-sm text-body-sm text-on-surface-variant truncate">Crop: {r.crop}</p>
                  <div className="flex items-center gap-1.5 mt-1 text-on-surface-variant font-label-sm text-label-sm">
                    <span className="material-symbols-outlined text-[15px] text-on-surface-variant">schedule</span>
                    <span>Reported {timeAgo(r.created_at)}</span>
                  </div>
                </div>
              </div>
              
              <div className="pl-1.5 flex flex-col gap-2">
                <div className="flex items-center gap-2 pt-1">
                  <button className="flex-1 min-h-[48px] px-3 rounded-lg bg-surface-container-high text-on-surface font-label-md text-label-md flex items-center justify-center gap-1.5 shadow-sm active:opacity-90 transition-colors hover:bg-surface-variant" type="button" onClick={() => navigate('/health/disease-scanner')}>
                    <span className="material-symbols-outlined text-[18px]">science</span>
                    <span>View Treatment</span>
                  </button>
                </div>
              </div>
            </article>
          ))}
          {filteredReports.length === 0 && (
            <div className="p-8 text-center bg-surface-container-low rounded-xl">
              <span className="material-symbols-outlined text-4xl text-on-surface-variant mb-2">done_all</span>
              <p className="font-label-md text-on-surface">No disease outbreaks found.</p>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
