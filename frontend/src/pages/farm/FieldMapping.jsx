import { useState, useEffect, useRef } from 'react';
import AppShell from '../../layouts/AppShell';
import { useNavigate } from 'react-router-dom';
import { saveFarmBoundary, getFarmZones } from '../../api/farmApi';
import { MapContainer, TileLayer, Polygon, Marker, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import area from '@turf/area';
import { polygon } from '@turf/helpers';
import L from 'leaflet';

// Fix Leaflet default icon issue in React
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

function MapEvents({ onAddPoint, mode }) {
  useMapEvents({
    click(e) {
      if (mode === 'tap') {
        onAddPoint([e.latlng.lat, e.latlng.lng]);
      }
    },
  });
  return null;
}

export default function FieldMapping() {
  const navigate = useNavigate();
  const farmId = localStorage.getItem('farmId');
  const [mode, setMode] = useState('tap'); // 'walk' | 'tap'
  const [isPaused, setIsPaused] = useState(false);
  const [elapsed, setElapsed] = useState(0); // seconds
  const [saving, setSaving] = useState(false);
  
  // Polygon state
  const [waypoints, setWaypoints] = useState([]);
  const [calculatedArea, setCalculatedArea] = useState(0);
  const [perimeter, setPerimeter] = useState(0);
  
  const timerRef = useRef(null);

  useEffect(() => {
    if (farmId) {
      getFarmZones(farmId).then(res => {
        if (res.data && res.data.length > 0) {
          const zone = res.data[0];
          if (zone.gps_points && zone.gps_points.length > 0) {
            setWaypoints(zone.gps_points.map(p => [p.lat, p.lng]));
          }
        }
      }).catch(console.error);
    }
  }, [farmId]);

  useEffect(() => {
    timerRef.current = setInterval(() => {
      if (!isPaused) setElapsed(t => t + 1);
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [isPaused]);

  useEffect(() => {
    if (waypoints.length >= 3) {
      try {
        // turf requires first and last position to be identical for polygon
        const coords = [...waypoints, waypoints[0]].map(p => [p[1], p[0]]); // [lng, lat] for turf
        const poly = polygon([coords]);
        const sqMeters = area(poly);
        setCalculatedArea(sqMeters * 0.000247105); // m2 to acres
        
        // simple perimeter
        let perim = 0;
        for (let i = 0; i < waypoints.length; i++) {
          const p1 = waypoints[i];
          const p2 = waypoints[i === waypoints.length - 1 ? 0 : i + 1];
          perim += L.latLng(p1).distanceTo(L.latLng(p2));
        }
        setPerimeter(Math.round(perim));
      } catch (e) {
        console.error('Area calculation error', e);
      }
    } else {
      setCalculatedArea(0);
      setPerimeter(0);
    }
  }, [waypoints]);

  const handleAddPoint = (point) => {
    setWaypoints(prev => [...prev, point]);
  };

  const handleUndo = () => {
    setWaypoints(prev => prev.slice(0, -1));
  };

  const formatElapsed = (s) => {
    const m = Math.floor(s / 60).toString().padStart(2, '0');
    const sec = (s % 60).toString().padStart(2, '0');
    return `${m}m ${sec}s`;
  };

  const handleFinish = async () => {
    if (waypoints.length < 3) return;
    setSaving(true);
    try {
      await saveFarmBoundary(farmId, {
        gps_points: waypoints.map(p => ({ lat: p[0], lng: p[1] }))
      });
      navigate('/farm/profile');
    } catch {
      setSaving(false);
    }
  };

  return (
    <AppShell 
      variant="detail" 
      hideBottomNav={true}
      title="Field Boundary Mapping"
      rootClassName="bg-background"
      headerClassName="pointer-events-none bg-transparent"
      backButtonClassName="w-11 h-11 pointer-events-auto bg-surface/90 backdrop-blur-md shadow-sm"
      titleClassName="font-headline-sm text-headline-sm text-on-surface truncate ml-space-xs pointer-events-auto bg-surface/80 px-2 py-1 rounded-md backdrop-blur-sm shadow-sm"
      headerRightSlot={
        <div className="w-11 h-11 rounded-full bg-primary flex items-center justify-center pointer-events-auto shadow-sm">
          <span className="material-symbols-outlined text-on-primary text-[18px]">person</span>
        </div>
      }
    >
      <div className="flex flex-col relative w-full pt-16 pb-24 bg-background flex-1">
        <div className="flex flex-col w-full pb-safe relative">

          {/* Top Segmented Survey Progress Bar */}
          <div className="w-full bg-surface-container-high h-1.5 flex">
            <div className="bg-primary h-full w-[82%] transition-all duration-500"></div>
          </div>

          {/* Telemetry Strip & RTK Accuracy Header Bar */}
          <section className="px-margin pt-space-sm pb-space-xs flex flex-col gap-space-xs bg-surface shadow-sm">
            <div className="flex items-center justify-between">
              {/* High precision RTK GNSS Pill */}
              <div className="inline-flex items-center gap-2 bg-surface-container-lowest px-3 py-1.5 rounded-full shadow-sm">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-primary"></span>
                </span>
                <span className="font-label-sm text-label-sm text-primary tracking-wide">RTK FIX • ±0.38m</span>
              </div>
              {/* Satellites Badge */}
              <div className="flex items-center gap-1.5 bg-surface-container px-3 py-1.5 rounded-full">
                <span className="material-symbols-outlined text-primary text-[18px]">satellite_alt</span>
                <span className="font-label-sm text-label-sm text-on-surface-variant font-medium">18 Sats (L1/L5)</span>
              </div>
              {/* Audio Guidance Pill */}
              <button aria-label="Listen to voice navigation guidance" className="flex items-center justify-center w-11 h-11 rounded-full bg-primary-container text-on-primary shadow-sm active:scale-95 transition-transform">
                <span className="material-symbols-outlined text-[18px]">volume_up</span>
              </button>
            </div>
          </section>

        {/* Leaflet Map */}
        <div className="relative w-full bg-surface-container" style={{ height: '40vh', zIndex: 0 }}>
          <MapContainer 
            center={[20.5937, 78.9629]} 
            zoom={5} 
            scrollWheelZoom={true} 
            style={{ width: '100%', height: '100%' }}
            zoomControl={false}
          >
            <TileLayer
              attribution='&copy; OpenStreetMap contributors'
              url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
            />
            <MapEvents onAddPoint={handleAddPoint} mode={mode} />
            {waypoints.length > 0 && (
              <Polygon positions={waypoints} color="#1b5e20" fillColor="#91d78a" fillOpacity={0.4} />
            )}
            {waypoints.map((pos, i) => (
              <Marker key={i} position={pos} />
            ))}
          </MapContainer>

          {/* Mode toggle */}
          <div className="absolute top-3 left-3 bg-surface rounded-xl shadow-md p-1 flex gap-1">
            <button
              onClick={() => setMode('walk')}
              className={`flex items-center justify-center gap-1.5 py-2 px-4 min-h-[44px] rounded-lg transition-all ${mode === 'walk' ? 'bg-surface-container-lowest shadow-sm text-primary' : 'text-on-surface-variant hover:bg-surface-container-highest'}`}
              type="button"
            >
              <span className="material-symbols-outlined text-[18px]">directions_walk</span>
              <span className="font-label-md text-label-md">Walk</span>
            </button>
            <button
              onClick={() => setMode('tap')}
              className={`flex items-center justify-center gap-1.5 py-2 px-4 min-h-[44px] rounded-lg transition-all ${mode === 'tap' ? 'bg-surface-container-lowest shadow-sm text-primary' : 'text-on-surface-variant hover:bg-surface-container-highest'}`}
              type="button"
            >
              <span className="material-symbols-outlined text-[18px]">touch_app</span>
              <span className="font-label-md text-label-md">Tap</span>
            </button>
          </div>

          {/* Live label */}
          <div className="absolute top-3 left-1/2 -translate-x-1/2 bg-surface/90 px-3 py-1 rounded-full flex items-center gap-1.5 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
            <span className="font-label-sm text-label-sm font-semibold text-on-surface">Khasra 219/14 · Kharif</span>
          </div>

          {/* Right toolbar */}
          <div className="absolute top-3 right-3 flex flex-col gap-2 pointer-events-auto">
            <button aria-label="Reset North" className="w-11 h-11 rounded-xl bg-surface shadow-md flex items-center justify-center text-primary active:scale-95 transition-transform" type="button">
              <span className="material-symbols-outlined text-[20px]">navigation</span>
            </button>
            <button aria-label="Toggle Satellite layer" className="w-11 h-11 rounded-xl bg-surface shadow-md flex items-center justify-center text-on-surface active:scale-95 transition-transform" type="button">
              <span className="material-symbols-outlined text-[20px]">layers</span>
            </button>
            <button aria-label="Recenter on Farmer Location" className="w-11 h-11 rounded-xl bg-surface shadow-md flex items-center justify-center text-primary active:scale-95 transition-transform" type="button">
              <span className="material-symbols-outlined text-[20px]">my_location</span>
            </button>
            <button onClick={handleUndo} disabled={waypoints.length === 0} aria-label="Undo last surveyed point" className="w-11 h-11 rounded-xl bg-surface shadow-md flex items-center justify-center text-secondary active:scale-95 transition-transform disabled:opacity-50" type="button">
              <span className="material-symbols-outlined text-[20px]">undo</span>
            </button>
          </div>

          {/* Voice toast */}
          <div className="absolute bottom-3 left-3 right-3 bg-surface/95 backdrop-blur-sm px-3.5 py-2 rounded-xl shadow-md flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-full bg-tertiary-container flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-on-tertiary text-[16px]">record_voice_over</span>
            </div>
            <p className="font-body-sm text-[13px] text-on-surface leading-tight truncate">
              "Continue along the canal bund. Turn right at the corner neem tree."
            </p>
          </div>
        </div>

        {/* Telemetry card */}
        <section className="px-margin -mt-2 z-10">
          <div className="bg-surface-container-lowest rounded-2xl p-space-md shadow-md">
            <div className="flex items-center justify-between pb-space-xs">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-secondary-container"></span>
                <span className="font-label-md text-label-md text-on-surface font-bold">Surveying Plot 1 Boundary</span>
              </div>
              <div className="flex items-center gap-1 text-primary">
                <span className="material-symbols-outlined text-[16px]">verified</span>
                <span className="font-label-sm text-label-sm font-semibold">99.4% Loop Fit</span>
              </div>
            </div>
            <div className="flex items-baseline justify-between mt-1 pt-1">
              <div>
                <span className="font-headline-lg-mobile text-headline-lg-mobile text-primary tracking-tight">{calculatedArea.toFixed(2)}</span>
                <span className="font-headline-sm text-headline-sm text-on-surface font-semibold ml-1">Acres</span>
              </div>
              <span className="font-label-md text-label-md text-on-surface-variant font-medium bg-surface-container px-2.5 py-1 rounded-md">≈ {(calculatedArea * 0.404686).toFixed(2)} Hectares</span>
            </div>
            <div className="grid grid-cols-3 gap-2 mt-3 pt-3 bg-surface-container-low p-2.5 rounded-xl">
              <div className="flex flex-col">
                <span className="font-label-sm text-label-sm text-on-surface-variant flex items-center gap-1">
                  <span className="material-symbols-outlined text-[14px]">straighten</span> Perimeter
                </span>
                <span className="font-label-lg text-label-lg font-bold text-on-surface mt-0.5">{perimeter} m</span>
              </div>
              <div className="flex flex-col">
                <span className="font-label-sm text-label-sm text-on-surface-variant flex items-center gap-1">
                  <span className="material-symbols-outlined text-[14px]">pin_drop</span> Waypoints
                </span>
                <span className="font-label-lg text-label-lg font-bold text-on-surface mt-0.5">{waypoints.length} Points</span>
              </div>
              <div className="flex flex-col">
                <span className="font-label-sm text-label-sm text-on-surface-variant flex items-center gap-1">
                  <span className="material-symbols-outlined text-[14px]">speed</span> Walk Speed
                </span>
                <span className="font-label-lg text-label-lg font-bold text-on-surface mt-0.5">3.2 km/h</span>
              </div>
            </div>
          </div>
        </section>

        {/* Timer row */}
        <section className="px-margin mt-space-sm">
          <div className="flex items-center justify-between p-3 bg-surface-container-low rounded-xl">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-surface-container-highest flex items-center justify-center text-primary">
                <span className="material-symbols-outlined text-[20px]">timer</span>
              </div>
              <div>
                <p className="font-label-sm text-label-sm text-on-surface-variant">Active Elapsed Time</p>
                <p className="font-label-md text-label-md text-on-surface font-semibold">{formatElapsed(elapsed)} · {isPaused ? 'Paused' : 'Smooth tracking'}</p>
              </div>
            </div>
            <button
              onClick={() => setIsPaused(p => !p)}
              className="px-4 py-2 min-h-[44px] rounded-lg bg-surface-container-highest text-on-surface text-label-sm font-semibold active:bg-surface-variant flex items-center gap-1"
            >
              <span className="material-symbols-outlined text-[16px]">{isPaused ? 'play_arrow' : 'pause'}</span>
              <span>{isPaused ? 'Resume' : 'Pause'}</span>
            </button>
          </div>
        </section>

        {/* Bottom action dock */}
        <footer className="mt-space-md px-margin flex flex-col gap-space-xs pb-space-sm">
          <button
            onClick={handleFinish}
            disabled={saving}
            className="w-full h-14 bg-secondary-container hover:opacity-95 text-on-secondary rounded-xl font-label-lg text-label-lg font-bold shadow-md active:scale-[0.99] transition-all flex items-center justify-center gap-2"
          >
            {saving ? (
              <><span className="w-5 h-5 rounded-full border-2 border-on-secondary border-t-transparent animate-spin"></span><span>Saving...</span></>
            ) : (
              <><span>Finish &amp; Save Boundary ({calculatedArea.toFixed(2)} Ac)</span><span className="material-symbols-outlined text-[22px]">arrow_forward</span></>
            )}
          </button>
          <div className="flex items-center justify-between gap-2 mt-1">
            <button className="flex-1 py-3 text-center rounded-xl bg-surface-container text-on-surface font-label-md text-label-md font-semibold active:bg-surface-variant" type="button">
              Add Manual Corner
            </button>
            <button onClick={() => setWaypoints([])} className="flex-1 py-3 text-center rounded-xl bg-surface-container text-error font-label-md text-label-md font-semibold active:bg-surface-variant" type="button">
              Discard &amp; Restart
            </button>
          </div>
        </footer>
        </div>
      </div>
    </AppShell>
  );
}
