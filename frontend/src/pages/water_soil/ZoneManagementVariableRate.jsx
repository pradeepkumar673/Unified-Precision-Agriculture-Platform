import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Polygon, Rectangle, Tooltip } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { getFarmBoundary } from '../../api/farmApi';

const COLORS = [
  { color: 'bg-primary-container', activeClass: 'bg-primary-container/15 text-primary', dot: 'bg-primary-container', hex: '#93f596', border: '#1b5e20' },
  { color: 'bg-lime-600', activeClass: 'bg-lime-600/15 text-lime-700', dot: 'bg-lime-600', hex: '#c0ca33', border: '#827717' },
  { color: 'bg-secondary-container', activeClass: 'bg-secondary-container/15 text-secondary', dot: 'bg-secondary-container', hex: '#ffdbcf', border: '#a83900' },
  { color: 'bg-error', activeClass: 'bg-error-container text-error', dot: 'bg-error', hex: '#ffdad6', border: '#ba1a1a' },
  { color: 'bg-blue-300', activeClass: 'bg-blue-300/15 text-blue-800', dot: 'bg-blue-300', hex: '#90caf9', border: '#0d47a1' }
];

export default function ZoneManagementVariableRate() {
  const navigate = useNavigate();
  const [activeZone, setActiveZone] = useState(null);
  
  const [boundaryPoints, setBoundaryPoints] = useState([]);
  const [zones, setZones] = useState([]);
  const [mapKey, setMapKey] = useState(0);

  const farmId = localStorage.getItem('farmId');

  useEffect(() => {
    if (!farmId) return;
    getFarmBoundary(farmId).then(res => {
      const bp = res.data.boundary_points || [];
      const zs = res.data.zones || [];
      if (bp.length === 0) return;

      const pts = bp.map(p => [p.lat, p.lng]);
      setBoundaryPoints(pts);
      
      // 1. Calculate main farm centroid
      let cx = 0, cy = 0;
      pts.forEach(p => { cx += p[0]; cy += p[1]; });
      cx /= pts.length;
      cy /= pts.length;
      const farmCentroid = [cx, cy];

      // 2. Sort all boundary points by angle from centroid to ensure contiguous slices
      const sortedPts = [...pts].sort((a, b) => {
        const angleA = Math.atan2(a[1] - cy, a[0] - cx);
        const angleB = Math.atan2(b[1] - cy, b[0] - cx);
        return angleA - angleB;
      });

      // 3. Divide perimeter into N perfectly clean wedges without gaps
      const k = zs.length || 1;
      const chunkSize = Math.ceil(sortedPts.length / k);
      
      const enrichedZones = zs.map((z, i) => {
        const c = COLORS[i % COLORS.length];
        
        // Grab a contiguous slice of the perimeter, PLUS the first point of the next chunk to seal the gap
        let chunk;
        if (i === k - 1) {
          // Last chunk takes all remaining points and wraps around to the very first point
          chunk = sortedPts.slice(i * chunkSize);
          if (sortedPts.length > 0) {
            chunk.push(sortedPts[0]);
          }
        } else {
          // Normal chunks take their size + 1 to share the boundary with the next chunk
          chunk = sortedPts.slice(i * chunkSize, (i + 1) * chunkSize + 1);
        }

        // Connect the slice to the center to form a closed wedge polygon
        const wedgeCoords = [farmCentroid, ...chunk, farmCentroid];
        
        // Marker goes roughly in the middle of the wedge
        const midPoint = chunk[Math.floor(chunk.length / 2)] || farmCentroid;
        const markerPos = [
          (farmCentroid[0] + midPoint[0]) / 2,
          (farmCentroid[1] + midPoint[1]) / 2
        ];
        
        const isStress = z.soil_score <= 50;
        return {
          id: z.zone_id,
          name: `Zone ${z.zone_id}`,
          size: `${Math.max(0.2, (chunk.length / pts.length * 4.5)).toFixed(2)} Ac`,
          share: isStress ? 'Moisture Stress' : `${((chunk.length / pts.length) * 100).toFixed(1)}%`,
          desc: z.soil_score > 70 ? 'High Vigour' : z.soil_score > 50 ? 'Optimum Balance' : 'Moisture Stress',
          isStress,
          centroid: markerPos,
          wedgeCoords,
          ...z,
          ...c
        };
      });
      
      setZones(enrichedZones);
      if (enrichedZones.length > 0) setActiveZone(enrichedZones[0].id);
      setMapKey(prev => prev + 1);
    }).catch(() => {});
  }, [farmId]);

  const mapCenter = boundaryPoints.length > 0 
    ? [
        boundaryPoints.reduce((sum, p) => sum + p[0], 0) / boundaryPoints.length,
        boundaryPoints.reduce((sum, p) => sum + p[1], 0) / boundaryPoints.length
      ]
    : [20.5937, 78.9629];

  const activeZoneObj = zones.find(z => z.id === activeZone) || {};

  const handleExportXML = () => {
    const xmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<ISO11783_TaskData VersionMajor="4" VersionMinor="3" DataTransferOrigin="1">
  <XFR>
${zones.map(z => `    <TZN ZoneId="${z.id}" Designator="Zone ${z.id}">
      <Polygon>
${z.wedgeCoords.map(coord => `        <Point Lat="${coord[0]}" Lon="${coord[1]}"/>`).join('\n')}
      </Polygon>
      <Treatment Product="Urea_N" Rate="${Math.round(40 - (z.soil_score || 50) * 0.1)}" Unit="kg/ha"/>
      <Treatment Product="Seed" Rate="${Math.round(45 - (z.soil_score || 50) * 0.1)}" Unit="kg/ha"/>
    </TZN>`).join('\n')}
  </XFR>
</ISO11783_TaskData>`;

    const blob = new Blob([xmlContent], { type: 'application/xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `VRA_Prescription_Farm_${farmId}.xml`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-surface text-on-surface flex flex-col relative">
      {/* Top Header */}
      

      <main className="flex flex-col relative w-full pt-20 pb-36 bg-surface flex-1">
        {/* Interactive VRA Map Canvas */}
        <section className="w-full relative h-[260px] bg-surface-container-low overflow-hidden shadow-inner flex items-center justify-center">
          {boundaryPoints.length > 0 ? (
            <MapContainer key={mapKey} center={mapCenter} zoom={16} className="w-full h-full z-0">
              <TileLayer
                url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                maxZoom={20}
              />
              <Polygon positions={boundaryPoints} pathOptions={{ color: '#ffffff', weight: 2, fillOpacity: 0.1, dashArray: '4 4' }} />
              
              {zones.map(z => (
                <Polygon 
                  key={z.id} 
                  positions={z.wedgeCoords}
                  pathOptions={{ 
                    color: activeZone === z.id ? '#ffffff' : z.border, 
                    fillColor: z.hex, 
                    fillOpacity: activeZone === z.id ? 0.8 : 0.45,
                    weight: activeZone === z.id ? 3 : 2,
                    dashArray: activeZone === z.id ? '' : '5 5'
                  }}
                  eventHandlers={{ click: () => setActiveZone(z.id) }}
                >
                  <Tooltip direction="center" opacity={1} permanent={activeZone === z.id}>
                    <span className="font-bold">{z.name}</span>
                  </Tooltip>
                </Polygon>
              ))}
            </MapContainer>
          ) : (
            <div className="flex items-center justify-center h-full text-on-surface-variant font-label-md">Loading Map...</div>
          )}

          {/* Floating Map Utilities */}
          <div className="absolute top-2.5 right-2.5 flex flex-col gap-1.5 z-10">
            <button className="w-9 h-9 bg-surface-container-lowest/90 backdrop-blur-md text-on-surface rounded-xl flex items-center justify-center shadow-md" type="button">
              <span className="material-symbols-outlined text-[19px]">layers</span>
            </button>
            <button className="w-9 h-9 bg-surface-container-lowest/90 backdrop-blur-md text-on-surface rounded-xl flex items-center justify-center shadow-md" type="button">
              <span className="material-symbols-outlined text-[19px]">add</span>
            </button>
            <button className="w-9 h-9 bg-surface-container-lowest/90 backdrop-blur-md text-on-surface rounded-xl flex items-center justify-center shadow-md" type="button">
              <span className="material-symbols-outlined text-[19px]">remove</span>
            </button>
          </div>
          
          <div className="absolute bottom-2.5 left-2.5 flex items-center gap-1.5 bg-surface-container-lowest/90 backdrop-blur-md px-2.5 py-1 rounded-full shadow-sm z-10">
            <span className="material-symbols-outlined text-primary text-[15px]">explore</span>
            <span className="font-label-sm text-label-sm text-on-surface">N • 1:2500</span>
          </div>
          <div className="absolute bottom-2.5 right-2.5 flex items-center gap-1.5 bg-surface-container-lowest/90 backdrop-blur-md px-2.5 py-1 rounded-full shadow-sm z-10">
            <span className="w-2 h-2 rounded-full bg-secondary-container"></span>
            <span className="font-label-sm text-label-sm text-on-surface font-medium">NDVI: 0.44 avg</span>
          </div>
        </section>

        {/* Agronomic Zone Horizontal Selection Strip */}
        <section className="px-margin pt-space-sm pb-space-xs flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <span className="font-label-md text-label-md text-on-surface font-semibold">Management Zones ({zones.length} Detected)</span>
            <span className="font-label-sm text-label-sm text-on-surface-variant">Tap parcel to inspect</span>
          </div>
          <div className="flex gap-2.5 overflow-x-auto pb-1 -mx-margin px-margin no-scrollbar">
            {zones.map((zone) => (
              <button
                key={zone.id}
                onClick={() => setActiveZone(zone.id)}
                className={`min-w-[130px] p-2.5 rounded-xl text-left flex flex-col gap-1 transition-all shrink-0 relative ${
                  activeZone === zone.id ? `${zone.activeClass} shadow-md` : 'bg-surface-container-low shadow-sm active:scale-95'
                }`}
                type="button"
              >
                {activeZone === zone.id && (
                  <div className={`absolute top-2 right-2 w-4 h-4 rounded-full flex items-center justify-center ${zone.dot}`}>
                    <span className="material-symbols-outlined text-surface-container-lowest text-[12px]">check</span>
                  </div>
                )}
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-1.5">
                    <span className={`w-2.5 h-2.5 rounded-full ${zone.dot}`}></span>
                    <span className={`font-label-md text-label-md font-bold ${activeZone === zone.id ? '' : 'text-on-surface'}`}>{zone.name}</span>
                  </div>
                  {activeZone !== zone.id && !zone.isStress && (
                    <span className="font-label-sm text-label-sm text-on-surface-variant font-semibold">{zone.share}</span>
                  )}
                </div>
                <p className={`font-body-sm text-body-sm text-[12px] leading-none ${activeZone === zone.id ? 'font-medium' : 'text-on-surface-variant'}`}>{zone.desc}</p>
                <div className="flex items-center justify-between mt-1">
                  <span className={`font-label-sm text-label-sm font-semibold ${activeZone === zone.id ? '' : 'text-on-surface-variant mt-1'}`}>{zone.size}</span>
                  {activeZone === zone.id && (
                    <span className={`font-label-sm text-label-sm px-1.5 py-0.5 rounded-full ${zone.dot} text-white`}>Selected</span>
                  )}
                </div>
              </button>
            ))}
          </div>
        </section>

        {/* Variable-Rate Prescription (VRA) Spec Sheet */}
        <section className="mt-space-sm mx-margin p-space-md bg-surface-container-lowest rounded-2xl shadow-sm flex flex-col gap-space-sm">
          <div className="w-full flex flex-col items-center gap-1.5">
            <div className="w-10 h-1 bg-surface-container-highest rounded-full"></div>
            <div className="w-full flex items-start justify-between gap-space-xs mt-1">
              <div>
                <div className="flex items-center gap-1.5">
                  <span className={`px-2 py-0.5 rounded-full ${zones.find(z => z.id === activeZone)?.color} text-on-surface font-label-sm text-label-sm font-bold`}>
                    Zone {activeZone} VRA
                  </span>
                  <span className="font-label-sm text-label-sm text-on-surface-variant">{zones.find(z => z.id === activeZone)?.size} (Selected)</span>
                </div>
                <h3 className="font-headline-sm text-headline-sm text-on-surface mt-1">Nitrogen Deficit &amp; Compaction</h3>
              </div>
              <div className="w-10 h-10 rounded-full bg-secondary-fixed/50 flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-secondary text-[22px]">auto_fix_high</span>
              </div>
            </div>
          </div>

          <div className="w-full p-space-sm bg-surface-container-low rounded-xl flex items-center justify-between text-[13px]">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-secondary text-[18px]">water_drop</span>
              <span className="font-label-md text-label-md text-on-surface">Soil Moisture: <strong>{Math.round(activeZoneObj.soil_score || 0)}% ({activeZoneObj.isStress ? 'Low' : 'Optimum'})</strong></span>
            </div>
            <span className={`font-label-sm text-label-sm ${activeZoneObj.isStress ? 'text-error' : 'text-primary'} font-semibold`}>
              NDVI: {(activeZoneObj.ndvi_score || 0).toFixed(2)} vs 0.71 Ref
            </span>
          </div>

          <div className="flex flex-col gap-space-xs">
            {/* 1. Seed Rate */}
            <div className="p-space-sm bg-surface-container rounded-xl flex items-center justify-between gap-space-sm">
              <div className="flex items-center gap-space-sm">
                <div className="w-10 h-10 rounded-lg bg-surface-container-lowest flex items-center justify-center text-primary-container shadow-sm shrink-0">
                  <span className="material-symbols-outlined text-[22px]">grain</span>
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <p className="font-label-md text-label-md text-on-surface font-bold">Seed Rate Dosage</p>
                    {activeZoneObj.isStress && (
                      <span className="text-[11px] font-bold px-1.5 py-[2px] bg-primary-fixed text-on-primary-fixed rounded">↑ +10%</span>
                    )}
                  </div>
                  <p className="font-body-sm text-body-sm text-on-surface-variant text-[13px]">
                    {activeZoneObj.isStress ? 'Compensates for low tillering' : 'Standard uniform rate'}
                  </p>
                </div>
              </div>
              <div className="text-right shrink-0">
                <span className="font-headline-sm text-headline-sm text-on-surface font-bold block">
                  {Math.round(45 - (activeZoneObj.soil_score || 50) * 0.1)} kg
                </span>
                <span className="font-label-sm text-label-sm text-on-surface-variant">per Acre</span>
              </div>
            </div>
            
            {/* 2. Fertilizer */}
            <div className="p-space-sm bg-surface-container rounded-xl flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-space-sm">
                  <div className="w-10 h-10 rounded-lg bg-surface-container-lowest flex items-center justify-center text-secondary shadow-sm shrink-0">
                    <span className="material-symbols-outlined text-[22px]">science</span>
                  </div>
                  <div>
                    <p className="font-label-md text-label-md text-on-surface font-bold">Fertilizer Micro-Dosing</p>
                    <p className="font-body-sm text-body-sm text-on-surface-variant text-[13px]">Boosts biomass &amp; active rooting</p>
                  </div>
                </div>
                <span className="font-label-sm text-label-sm text-tertiary font-bold bg-surface-container-lowest px-2 py-1 rounded-md">VRA</span>
              </div>
              <div className="grid grid-cols-3 gap-1.5 pt-1">
                <div className="bg-surface-container-lowest p-2 rounded-lg text-center shadow-sm">
                  <span className="font-label-sm text-label-sm text-on-surface-variant block">Urea (N)</span>
                  <span className="font-label-md text-label-md text-on-surface font-bold">
                    {Math.round(40 - (activeZoneObj.soil_score || 50) * 0.1)} kg
                  </span>
                </div>
                <div className="bg-surface-container-lowest p-2 rounded-lg text-center shadow-sm">
                  <span className="font-label-sm text-label-sm text-on-surface-variant block">DAP (P)</span>
                  <span className="font-label-md text-label-md text-on-surface font-bold">
                    {Math.round(25 - (activeZoneObj.soil_score || 50) * 0.05)} kg
                  </span>
                </div>
                <div className="bg-surface-container-lowest p-2 rounded-lg text-center shadow-sm">
                  <span className="font-label-sm text-label-sm text-on-surface-variant block">Nano Zinc</span>
                  <span className="font-label-md text-label-md text-on-surface font-bold">250 ml</span>
                </div>
              </div>
            </div>

            {/* 3. Pesticide */}
            <div className="p-space-sm bg-surface-container rounded-xl flex items-center justify-between gap-space-sm">
              <div className="flex items-center gap-space-sm">
                <div className="w-10 h-10 rounded-lg bg-surface-container-lowest flex items-center justify-center text-tertiary shadow-sm shrink-0">
                  <span className="material-symbols-outlined text-[22px]">sanitizer</span>
                </div>
                <div>
                  <p className="font-label-md text-label-md text-on-surface font-bold">Propiconazole 25% EC</p>
                  <p className="font-body-sm text-body-sm text-on-surface-variant text-[13px]">Low-volume canopy spray</p>
                </div>
              </div>
              <div className="text-right shrink-0">
                <span className="font-headline-sm text-headline-sm text-on-surface font-bold block">200 ml</span>
                <span className="font-label-sm text-label-sm text-on-surface-variant">total tank</span>
              </div>
            </div>
          </div>

          <div className="p-space-sm bg-primary-fixed/30 rounded-xl flex items-start gap-space-xs">
            <span className="material-symbols-outlined text-primary-container text-[20px] shrink-0 mt-0.5">savings</span>
            <p className="font-body-sm text-body-sm text-on-primary-fixed-variant text-[13.5px] leading-snug">
              <strong>VRA Economic Gain:</strong> Saves <strong>₹11,850</strong> and eliminates <strong>14 kg fertilizer runoff</strong> compared to uniform blanket broadcasting.
            </p>
          </div>

          <div className="flex items-center justify-between px-space-sm py-2 bg-surface-container-high rounded-xl">
            <div className="flex items-center gap-2 min-w-0">
              <span className="material-symbols-outlined text-on-surface-variant text-[18px]">precision_manufacturing</span>
              <span className="font-label-sm text-label-sm text-on-surface truncate">ISO-11783 XML &amp; ESRI Shapefile Ready</span>
            </div>
            <span className="material-symbols-outlined text-primary-container text-[18px]">verified_user</span>
          </div>
        </section>


        {/* Sticky Action Footer Dock */}
        <footer className="sticky bottom-20 w-full p-margin bg-surface-container-lowest/95 backdrop-blur-md shadow-xl flex flex-col gap-2 z-30 pb-safe">
          <button onClick={handleExportXML} className="w-full h-14 bg-secondary-container hover:bg-secondary text-surface-container-lowest rounded-xl font-label-lg text-label-lg flex items-center justify-center gap-space-xs shadow-md active:scale-[0.98] transition-all" type="button">
            <span>Export Prescription Map (ISO-XML)</span>
            <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
          </button>
          <button onClick={() => navigate('/marketplace/drone-booking')} className="w-full h-12 bg-surface-container text-primary-container hover:bg-surface-container-high rounded-xl font-label-md text-label-md flex items-center justify-center gap-2 active:scale-[0.98] transition-all" type="button">
            <span className="material-symbols-outlined text-[18px]">flight_takeoff</span>
            <span>Send to Custom Hiring Drone Operator</span>
          </button>
        </footer>
      </main>
    </div>
  );
}
