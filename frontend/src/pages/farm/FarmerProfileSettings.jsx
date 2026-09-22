import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../App';
import { useTranslation } from 'react-i18next';
import { getFarmProfile, getFarmZones, updateFarmProfile, getFarmBoundary } from '../../api/farmApi';
import { MapContainer, TileLayer, Polygon } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

const SOIL_TYPES = [
  { key: 'clay_loam', label: 'Clay Loam' },
  { key: 'black_cotton', label: 'Black Cotton' },
  { key: 'sandy_loam', label: 'Sandy Loam' },
  { key: 'red_laterite', label: 'Red Laterite' },
  { key: 'alluvial', label: 'Alluvial' },
  { key: 'silt', label: 'Silt' },
];

const WATER_SOURCES = [
  { key: 'borewell', label: 'Borewell / Tubewell' },
  { key: 'canal', label: 'Canal System' },
  { key: 'rainfed', label: 'Rainfed' },
  { key: 'pond', label: 'Farm Pond' },
];

export default function FarmerProfileSettings() {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const { logout } = useAuth();

  const farmId = localStorage.getItem('farmId');
  const [farm, setFarm] = useState(null);
  const [zones, setZones] = useState([]);
  const [boundaryPoints, setBoundaryPoints] = useState([]);

  // --- Modals ---
  const [isModulesSheetOpen, setIsModulesSheetOpen] = useState(false);
  const [isEditSheetOpen, setIsEditSheetOpen] = useState(false);
  const [isMapOpen, setIsMapOpen] = useState(false);
  const [mapKey, setMapKey] = useState(0); // increments each open to force Leaflet remount

  // --- Edit form state ---
  const [editName, setEditName] = useState('');
  const [editOwnerName, setEditOwnerName] = useState('');
  const [editVillage, setEditVillage] = useState('');
  const [editDistrict, setEditDistrict] = useState('');
  const [editState, setEditState] = useState('');
  const [editLandSize, setEditLandSize] = useState('');
  const [editSoilType, setEditSoilType] = useState('clay_loam');
  const [editWaterSource, setEditWaterSource] = useState('borewell');
  const [editCurrentCrop, setEditCurrentCrop] = useState('');
  const [editSaving, setEditSaving] = useState(false);

  const loadData = () => {
    if (!farmId) return;
    getFarmProfile(farmId).then(r => setFarm(r.data)).catch(() => {});
    getFarmZones(farmId).then(r => setZones(r.data || [])).catch(() => {});
    getFarmBoundary(farmId).then(r => {
      const pts = r.data?.boundary_points || [];
      setBoundaryPoints(pts.map(p => [p.lat, p.lng]));
    }).catch(() => {});
  };

  useEffect(() => {
    loadData();
  }, [farmId]);

  const farmerName = farm?.owner_name || 'Farmer';
  const farmShortId = farm?.id ? `#KS-${farm.id.slice(0, 6).toUpperCase()}` : '#KS-PENDING';
  const locationText = [farm?.village, farm?.district, farm?.state].filter(Boolean).join(', ') || 'Location pending';
  const totalArea = farm?.land_size_acres || 0;
  const areaHa = (totalArea * 0.404686).toFixed(2);

  // Profile completion check (no fake KYC — based on real data)
  const profileChecks = [
    !!farm?.owner_name,
    !!farm?.village || !!farm?.district,
    boundaryPoints.length > 0,
    !!farm?.current_crop,
  ];
  const completedCount = profileChecks.filter(Boolean).length;
  const profilePct = Math.round((completedCount / profileChecks.length) * 100);
  const profileComplete = completedCount === profileChecks.length;

  const plot1 = zones.length > 0 ? zones[0] : null;
  const plot2 = zones.length > 1 ? zones[1] : null;

  const mapCenter = boundaryPoints.length > 0
    ? [
        boundaryPoints.reduce((s, p) => s + p[0], 0) / boundaryPoints.length,
        boundaryPoints.reduce((s, p) => s + p[1], 0) / boundaryPoints.length,
      ]
    : [20.5937, 78.9629];

  const openEditSheet = () => {
    // Pre-fill with existing data
    setEditName(farm?.name || '');
    setEditOwnerName(farm?.owner_name || '');
    setEditVillage(farm?.village || '');
    setEditDistrict(farm?.district || '');
    setEditState(farm?.state || '');
    setEditLandSize(farm?.land_size_acres?.toString() || '');
    setEditSoilType(farm?.soil_type || 'clay_loam');
    setEditWaterSource(farm?.water_source || 'borewell');
    setEditCurrentCrop(farm?.current_crop || '');
    setIsEditSheetOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!farmId) return;
    setEditSaving(true);
    try {
      await updateFarmProfile(farmId, {
        name: editName,
        owner_name: editOwnerName,
        village: editVillage,
        district: editDistrict,
        state: editState,
        land_size_acres: parseFloat(editLandSize) || 0,
        soil_type: editSoilType,
        water_source: editWaterSource,
        current_crop: editCurrentCrop,
      });
      setIsEditSheetOpen(false);
      loadData(); // Refresh profile card with new data
    } catch (e) {
      console.error(e);
    } finally {
      setEditSaving(false);
    }
  };

  const handleLanguageToggle = () => {
    const nextLang = i18n.language === 'en' ? 'hi' : 'en';
    i18n.changeLanguage(nextLang);
    localStorage.setItem('agri_language', nextLang);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const modules = [
    { id: 1, icon: 'camera_indoor', colorClass: 'text-primary', title: 'AI Crop Doctor', subtitle: 'Instant disease scan', route: '/health/disease-scanner' },
    { id: 2, icon: 'thunderstorm', colorClass: 'text-tertiary', title: 'Weather Radar', subtitle: '3-day rain hypercast', route: '/vision/drone-climate' },
    { id: 3, icon: 'satellite_alt', colorClass: 'text-primary', title: 'Satellite Vigour', subtitle: 'NDVI plot health', route: '/vision/satellite' },
    { id: 4, icon: 'water_drop', colorClass: 'text-tertiary', title: 'Smart Irrigation', subtitle: 'Moisture schedules', route: '/water-soil/irrigation' },
    { id: 5, icon: 'storefront', colorClass: 'text-secondary', title: 'Mandi Bhav', subtitle: '14 APMC live prices', route: '/vision/price-forecast' },
    { id: 6, icon: 'flight_takeoff', colorClass: 'text-primary', title: 'Drone Booking', subtitle: '₹350/Acre service', route: '/vision/drone-climate' },
    { id: 7, icon: 'agriculture', colorClass: 'text-secondary', title: 'CHC Machinery', subtitle: 'Tractor, Harvester', route: '/marketplace/machinery' },
    { id: 8, icon: 'biotech', colorClass: 'text-primary', title: 'Soil Testing Lab', subtitle: 'Doorstep sample pickup', route: '/water-soil/soil-health' },
    { id: 9, icon: 'shield', colorClass: 'text-tertiary', title: 'PMFBY Insurance', subtitle: 'Claims & Policies', route: '/finance/credit-insurance' },
    { id: 10, icon: 'calculate', colorClass: 'text-primary', title: 'NPK Dosage Tool', subtitle: 'Fertilizer calculator', route: '/planning/variable-rate' }
  ];

  return (
    <div className="flex flex-col w-full px-space-md pt-24 pb-28 space-y-space-md">

      {/* ── Farmer Profile Header Card ── */}
      <div className="bg-surface-container-lowest p-space-md rounded-xl shadow-sm flex flex-col gap-space-sm relative overflow-hidden">
        <div className="flex items-start gap-space-md">
          <div className="relative shrink-0">
            <div className="w-20 h-20 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center shadow-sm">
              <span className="text-[2rem] font-bold">{farmerName.charAt(0).toUpperCase()}</span>
            </div>
            <span className="absolute bottom-0 right-0 w-6 h-6 bg-primary text-on-primary rounded-full flex items-center justify-center shadow">
              <span className="material-symbols-outlined text-[14px]">check</span>
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-space-xs">
              <h1 className="font-headline-sm text-headline-sm text-on-surface truncate">{farmerName}</h1>
              {/* EDIT BUTTON → opens inline edit sheet */}
              <button
                onClick={openEditSheet}
                aria-label="Edit Profile"
                className="px-space-sm py-1 rounded-full bg-surface-container-high text-on-surface font-label-sm text-label-sm flex items-center gap-1 active:scale-95 transition-transform"
                type="button"
              >
                <span className="material-symbols-outlined text-[16px]">edit</span>
                <span>Edit</span>
              </button>
            </div>
            <p className="font-label-md text-label-md text-primary font-semibold mt-0.5">Verified Profile</p>
            <p className="font-label-sm text-label-sm text-on-surface-variant truncate mt-0.5">ID: {farmShortId}</p>
            <div className="flex items-center gap-1 text-on-surface-variant mt-1">
              <span className="material-symbols-outlined text-[14px] text-secondary shrink-0">location_on</span>
              <span className="font-label-sm text-label-sm truncate">{locationText}</span>
            </div>
          </div>
        </div>

        {/* Profile Completion Strip */}
        <div className="bg-surface-container-low px-space-sm py-2 rounded-lg flex items-center justify-between gap-space-xs mt-space-sm">
          <div className="flex items-center gap-space-xs min-w-0">
            <span
              className={`material-symbols-outlined text-[18px] shrink-0 ${profileComplete ? 'text-primary' : 'text-secondary'}`}
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              {profileComplete ? 'verified' : 'pending'}
            </span>
            <span className="font-label-sm text-label-sm text-on-surface font-semibold truncate">
              {profileComplete ? 'Profile Complete' : `Profile ${profilePct}% complete`}
            </span>
          </div>
          {profileComplete ? (
            <span className="font-label-sm text-label-sm text-primary font-bold bg-primary-fixed px-2 py-0.5 rounded-full shrink-0">Active</span>
          ) : (
            <button
              onClick={openEditSheet}
              className="font-label-sm text-label-sm text-secondary font-bold bg-secondary-fixed px-2 py-0.5 rounded-full shrink-0 active:scale-95 transition-transform"
              type="button"
            >Fill Details</button>
          )}
        </div>
      </div>

      {/* ── Farm Holdings Card ── */}
      <div className="bg-surface-container-lowest p-space-md rounded-xl shadow-sm flex flex-col space-y-space-md">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-space-xs">
            <span className="material-symbols-outlined text-primary text-[20px]">landscape</span>
            <span className="font-label-lg text-label-lg text-on-surface font-bold">Farm Holdings & Assets</span>
          </div>
          <span className="font-label-sm text-label-sm text-on-surface-variant">{zones.length > 0 ? `${zones.length} Parcels` : 'No parcels mapped'}</span>
        </div>

        {/* Total Area Banner */}
        <div className="bg-surface-container p-space-sm rounded-lg flex items-center justify-between">
          <div>
            <p className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">Total Operated Land</p>
            <p className="font-headline-sm text-headline-sm text-on-surface font-bold">
              {totalArea} Acres <span className="font-body-sm text-body-sm text-on-surface-variant font-normal">({areaHa} Ha)</span>
            </p>
          </div>
          {/* EXPAND BUTTON → opens map modal showing saved boundary */}
          <button
            onClick={() => { setMapKey(k => k + 1); setIsMapOpen(true); }}
            className="w-10 h-10 rounded-full bg-primary-fixed flex items-center justify-center text-primary shrink-0 active:scale-95 transition-transform"
            type="button"
            aria-label="View Farm Boundary Map"
          >
            <span className="material-symbols-outlined text-[22px]">crop_free</span>
          </button>
        </div>

        {/* Plots Grid */}
        <div className="grid grid-cols-2 gap-space-sm">
          {(plot1 || farm?.current_crop) ? (
            <div className="bg-surface-container-low p-space-sm rounded-lg flex flex-col justify-between space-y-1">
              <div className="flex items-center gap-1 text-primary">
                <span className="material-symbols-outlined text-[16px]">grass</span>
                <span className="font-label-sm text-label-sm font-bold truncate">{plot1?.name || 'Main Plot'}</span>
              </div>
              <p className="font-body-sm text-body-sm text-on-surface font-semibold truncate">{plot1?.current_crop || farm?.current_crop || 'Not specified'}</p>
              <span className="inline-block font-label-sm text-label-sm text-secondary bg-secondary-fixed px-2 py-0.5 rounded-full self-start truncate">{plot1?.crop_stage || farm?.crop_stage || 'Unknown Stage'}</span>
            </div>
          ) : (
            <div className="bg-surface-container-low p-space-sm rounded-lg flex flex-col items-center justify-center space-y-1 min-h-[80px]">
              <span className="material-symbols-outlined text-[24px] text-on-surface-variant">add_circle</span>
              <p className="font-label-sm text-label-sm text-on-surface-variant text-center">Add plot</p>
            </div>
          )}

          {plot2 ? (
            <div className="bg-surface-container-low p-space-sm rounded-lg flex flex-col justify-between space-y-1">
              <div className="flex items-center gap-1 text-primary">
                <span className="material-symbols-outlined text-[16px]">eco</span>
                <span className="font-label-sm text-label-sm font-bold truncate">{plot2.name}</span>
              </div>
              <p className="font-body-sm text-body-sm text-on-surface font-semibold truncate">{plot2.current_crop || 'Not specified'}</p>
              <span className="inline-block font-label-sm text-label-sm text-primary bg-primary-fixed px-2 py-0.5 rounded-full self-start truncate">{plot2.crop_stage || 'Unknown Stage'}</span>
            </div>
          ) : null}
        </div>

        {/* Static rows */}
        <div className="space-y-space-xs pt-1">
          <div className="flex items-center justify-between py-1 cursor-pointer hover:bg-surface-container-low transition-colors rounded px-1" onClick={() => navigate('/water-soil/soil-health')}>
            <div className="flex items-center gap-space-xs text-on-surface-variant">
              <span className="material-symbols-outlined text-[18px] text-primary">science</span>
              <span className="font-body-sm text-body-sm text-on-surface text-primary font-bold">Soil Health Heatmap</span>
            </div>
            <span className="font-label-sm text-label-sm text-on-primary-fixed font-bold bg-primary-fixed px-2 py-0.5 rounded-full">Available</span>
          </div>
          <div className="flex items-center justify-between py-1 rounded px-1">
            <div className="flex items-center gap-space-xs text-on-surface-variant">
              <span className="material-symbols-outlined text-[18px] text-secondary">solar_power</span>
              <span className="font-body-sm text-body-sm text-on-surface">Equipment</span>
            </div>
            <span className="font-label-sm text-label-sm text-on-surface-variant font-medium">None Listed</span>
          </div>
          <div className="flex items-center justify-between py-1 cursor-pointer hover:bg-surface-container-low transition-colors rounded px-1" onClick={() => navigate('/community/fpo-cooperative-suite')}>
            <div className="flex items-center gap-space-xs text-on-surface-variant">
              <span className="material-symbols-outlined text-[18px] text-tertiary">groups</span>
              <span className="font-body-sm text-body-sm text-on-surface">FPO Member</span>
            </div>
            <span className="font-label-sm text-label-sm text-tertiary font-semibold truncate max-w-[170px]">Not Enrolled</span>
          </div>
        </div>
      </div>

      {/* ── Explore Modules CTA ── */}
      <div onClick={() => setIsModulesSheetOpen(true)} className="bg-secondary-container text-on-secondary-container p-space-md rounded-xl shadow-md cursor-pointer active:scale-[0.99] transition-transform flex items-center justify-between gap-space-sm">
        <div className="flex items-center gap-space-md min-w-0">
          <div className="w-12 h-12 rounded-xl bg-on-secondary-container/10 flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-[28px] text-on-secondary-container">apps</span>
          </div>
          <div className="min-w-0">
            <h2 className="font-headline-sm text-headline-sm text-on-secondary-container leading-tight truncate">Explore All 11 Modules</h2>
            <p className="font-label-sm text-label-sm opacity-90 truncate">AI Advisory, Drone Spraying, CHC Hire & more</p>
          </div>
        </div>
        <span className="material-symbols-outlined text-[24px] text-on-secondary-container shrink-0">arrow_forward</span>
      </div>

      {/* ── Preferences & Records ── */}
      <div className="space-y-space-xs">
        <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider px-space-xs">Preferences & Records</span>
        <div className="bg-surface-container-lowest rounded-xl shadow-sm overflow-hidden flex flex-col">
          <div onClick={handleLanguageToggle} className="p-space-md flex items-center justify-between cursor-pointer active:bg-surface-container-low transition-colors">
            <div className="flex items-center gap-space-md min-w-0">
              <div className="w-10 h-10 rounded-full bg-surface-container-high flex items-center justify-center text-primary shrink-0">
                <span className="material-symbols-outlined text-[20px]">translate</span>
              </div>
              <div className="min-w-0">
                <p className="font-label-lg text-label-lg text-on-surface font-semibold truncate">Language</p>
                <p className="font-label-sm text-label-sm text-on-surface-variant truncate">{i18n.language === 'hi' ? 'हिंदी (Hindi)' : 'English'}</p>
              </div>
            </div>
            <span className="material-symbols-outlined text-[20px] text-on-surface-variant shrink-0">sync_alt</span>
          </div>
          <div className="h-[1px] bg-surface-container mx-space-md"></div>
          <div onClick={() => navigate('/community/alerts')} className="p-space-md flex items-center justify-between cursor-pointer active:bg-surface-container-low transition-colors">
            <div className="flex items-center gap-space-md min-w-0">
              <div className="w-10 h-10 rounded-full bg-surface-container-high flex items-center justify-center text-secondary shrink-0">
                <span className="material-symbols-outlined text-[20px]">notifications_active</span>
              </div>
              <div className="min-w-0">
                <p className="font-label-lg text-label-lg text-on-surface font-semibold truncate">Critical Alerts & Mandi Updates</p>
                <p className="font-label-sm text-label-sm text-on-surface-variant truncate">Pest warnings & SMS Fallback</p>
              </div>
            </div>
            <span className="material-symbols-outlined text-[20px] text-on-surface-variant shrink-0">chevron_right</span>
          </div>
          <div className="h-[1px] bg-surface-container mx-space-md"></div>
          <div onClick={() => navigate('/gov/schemes')} className="p-space-md flex items-center justify-between cursor-pointer active:bg-surface-container-low transition-colors">
            <div className="flex items-center gap-space-md min-w-0">
              <div className="w-10 h-10 rounded-full bg-surface-container-high flex items-center justify-center text-primary shrink-0">
                <span className="material-symbols-outlined text-[20px]">account_balance</span>
              </div>
              <div className="min-w-0">
                <p className="font-label-lg text-label-lg text-on-surface font-semibold truncate">Linked Bank & DBT Subsidy</p>
                <p className="font-label-sm text-label-sm text-on-surface-variant truncate">PM-Kisan & subsidy management</p>
              </div>
            </div>
            <span className="material-symbols-outlined text-[20px] text-on-surface-variant shrink-0">chevron_right</span>
          </div>
          <div className="h-[1px] bg-surface-container mx-space-md"></div>
          <div onClick={() => navigate('/gov/documents')} className="p-space-md flex items-center justify-between cursor-pointer active:bg-surface-container-low transition-colors">
            <div className="flex items-center gap-space-md min-w-0">
              <div className="w-10 h-10 rounded-full bg-surface-container-high flex items-center justify-center text-tertiary shrink-0">
                <span className="material-symbols-outlined text-[20px]">folder_shared</span>
              </div>
              <div className="min-w-0">
                <p className="font-label-lg text-label-lg text-on-surface font-semibold truncate">Farmer Document Vault</p>
                <p className="font-label-sm text-label-sm text-on-surface-variant truncate">Aadhaar, Soil Card, Land Records</p>
              </div>
            </div>
            <span className="material-symbols-outlined text-[20px] text-on-surface-variant shrink-0">chevron_right</span>
          </div>
          <div className="h-[1px] bg-surface-container mx-space-md"></div>
          <div onClick={() => navigate('/marketplace/machinery')} className="p-space-md flex items-center justify-between cursor-pointer active:bg-surface-container-low transition-colors">
            <div className="flex items-center gap-space-md min-w-0">
              <div className="w-10 h-10 rounded-full bg-surface-container-high flex items-center justify-center text-primary shrink-0">
                <span className="material-symbols-outlined text-[20px]">rv_hookup</span>
              </div>
              <div className="min-w-0">
                <p className="font-label-lg text-label-lg text-on-surface font-semibold truncate">Custom Hiring Operator Mode</p>
                <p className="font-label-sm text-label-sm text-on-surface-variant truncate">Rent out your machinery</p>
              </div>
            </div>
            <span className="material-symbols-outlined text-[20px] text-on-surface-variant shrink-0">toggle_off</span>
          </div>
        </div>
      </div>

      {/* ── Logout ── */}
      <div className="pt-space-sm pb-space-sm flex flex-col items-center space-y-space-sm">
        <button onClick={handleLogout} className="w-full py-space-sm bg-error-container text-on-error-container rounded-xl font-label-lg text-label-lg font-bold flex items-center justify-center gap-space-xs active:scale-[0.98] transition-transform" type="button">
          <span className="material-symbols-outlined text-[20px]">logout</span>
          <span>Switch Account or Logout</span>
        </button>
        <div className="flex items-center gap-space-xs text-on-surface-variant">
          <span className="font-label-sm text-label-sm">KhetSaathi v2.4.0</span>
          <span>•</span>
          <a className="font-label-sm text-label-sm underline hover:text-on-surface" href="#">Privacy</a>
          <span>•</span>
          <a className="font-label-sm text-label-sm underline hover:text-on-surface" href="#">Terms</a>
        </div>
      </div>


      {/* ════════════════════════════════════
          MODAL 1: EDIT PROFILE BOTTOM SHEET
          ════════════════════════════════════ */}
      {isEditSheetOpen && (
        <div
          className="fixed inset-0 z-[200] bg-black/50 flex flex-col justify-end"
          onClick={() => setIsEditSheetOpen(false)}
        >
          <div
            className="bg-surface rounded-t-2xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            {/* Sheet header */}
            <div className="px-space-md pt-space-md pb-space-sm flex items-center justify-between border-b border-surface-container">
              <h3 className="font-headline-sm text-headline-sm text-on-surface">Edit Profile</h3>
              <button onClick={() => setIsEditSheetOpen(false)} className="w-9 h-9 rounded-full bg-surface-container flex items-center justify-center" type="button">
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            {/* Scrollable form */}
            <div
              className="overflow-y-scroll flex-1 min-h-0 p-space-md space-y-space-md overscroll-contain"
              style={{ WebkitOverflowScrolling: 'touch', paddingBottom: '2rem' }}
            >

              {/* Personal Info */}
              <div className="space-y-space-sm">
                <p className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">Personal Info</p>
                <div>
                  <label className="font-label-sm text-label-sm text-on-surface-variant block mb-1">Your Full Name</label>
                  <input
                    type="text"
                    value={editOwnerName}
                    onChange={e => setEditOwnerName(e.target.value)}
                    placeholder="e.g. Ramesh Patil"
                    className="w-full h-12 rounded-xl bg-surface-container px-space-md font-body-md text-body-md text-on-surface focus:outline-none focus:ring-2 focus:ring-primary-container"
                  />
                </div>
              </div>

              {/* Farm Info */}
              <div className="space-y-space-sm">
                <p className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">Farm Details</p>
                <div>
                  <label className="font-label-sm text-label-sm text-on-surface-variant block mb-1">Farm / Plot Name</label>
                  <input
                    type="text"
                    value={editName}
                    onChange={e => setEditName(e.target.value)}
                    placeholder="e.g. North Field"
                    className="w-full h-12 rounded-xl bg-surface-container px-space-md font-body-md text-body-md text-on-surface focus:outline-none focus:ring-2 focus:ring-primary-container"
                  />
                </div>
                <div>
                  <label className="font-label-sm text-label-sm text-on-surface-variant block mb-1">Land Size (Acres)</label>
                  <input
                    type="number"
                    value={editLandSize}
                    onChange={e => setEditLandSize(e.target.value)}
                    placeholder="e.g. 4.5"
                    min="0.1"
                    step="0.1"
                    className="w-full h-12 rounded-xl bg-surface-container px-space-md font-body-md text-body-md text-on-surface focus:outline-none focus:ring-2 focus:ring-primary-container"
                  />
                </div>
                <div>
                  <label className="font-label-sm text-label-sm text-on-surface-variant block mb-1">Current Crop</label>
                  <input
                    type="text"
                    value={editCurrentCrop}
                    onChange={e => setEditCurrentCrop(e.target.value)}
                    placeholder="e.g. Wheat, Cotton, Rice"
                    className="w-full h-12 rounded-xl bg-surface-container px-space-md font-body-md text-body-md text-on-surface focus:outline-none focus:ring-2 focus:ring-primary-container"
                  />
                </div>
                <div>
                  <label className="font-label-sm text-label-sm text-on-surface-variant block mb-1">Soil Type</label>
                  <select
                    value={editSoilType}
                    onChange={e => setEditSoilType(e.target.value)}
                    className="w-full h-12 rounded-xl bg-surface-container px-space-md font-body-md text-body-md text-on-surface focus:outline-none focus:ring-2 focus:ring-primary-container"
                  >
                    {SOIL_TYPES.map(s => (
                      <option key={s.key} value={s.key}>{s.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="font-label-sm text-label-sm text-on-surface-variant block mb-1">Water Source</label>
                  <select
                    value={editWaterSource}
                    onChange={e => setEditWaterSource(e.target.value)}
                    className="w-full h-12 rounded-xl bg-surface-container px-space-md font-body-md text-body-md text-on-surface focus:outline-none focus:ring-2 focus:ring-primary-container"
                  >
                    {WATER_SOURCES.map(w => (
                      <option key={w.key} value={w.key}>{w.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Location */}
              <div className="space-y-space-sm">
                <p className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">Location</p>
                <div className="grid grid-cols-2 gap-space-sm">
                  <div>
                    <label className="font-label-sm text-label-sm text-on-surface-variant block mb-1">Village</label>
                    <input
                      type="text"
                      value={editVillage}
                      onChange={e => setEditVillage(e.target.value)}
                      placeholder="e.g. Niphad"
                      className="w-full h-12 rounded-xl bg-surface-container px-space-md font-body-md text-body-md text-on-surface focus:outline-none focus:ring-2 focus:ring-primary-container"
                    />
                  </div>
                  <div>
                    <label className="font-label-sm text-label-sm text-on-surface-variant block mb-1">District</label>
                    <input
                      type="text"
                      value={editDistrict}
                      onChange={e => setEditDistrict(e.target.value)}
                      placeholder="e.g. Nashik"
                      className="w-full h-12 rounded-xl bg-surface-container px-space-md font-body-md text-body-md text-on-surface focus:outline-none focus:ring-2 focus:ring-primary-container"
                    />
                  </div>
                </div>
                <div>
                  <label className="font-label-sm text-label-sm text-on-surface-variant block mb-1">State</label>
                  <input
                    type="text"
                    value={editState}
                    onChange={e => setEditState(e.target.value)}
                    placeholder="e.g. Maharashtra"
                    className="w-full h-12 rounded-xl bg-surface-container px-space-md font-body-md text-body-md text-on-surface focus:outline-none focus:ring-2 focus:ring-primary-container"
                  />
                </div>
              </div>

            </div>

            {/* ── Pinned Save Button (always visible at bottom) ── */}
            <div className="px-space-md py-space-sm border-t border-surface-container bg-surface">
              <button
                onClick={handleSaveEdit}
                disabled={editSaving}
                className="w-full py-space-sm bg-primary text-on-primary rounded-xl font-label-lg text-label-lg font-bold flex items-center justify-center gap-2 active:scale-[0.98] transition-transform disabled:opacity-60"
                type="button"
              >
                {editSaving ? (
                  <>
                    <span className="material-symbols-outlined text-[20px] animate-spin">progress_activity</span>
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-[20px]">save</span>
                    <span>Save Changes</span>
                  </>
                )}
              </button>
            </div>

          </div>
        </div>
      )}


      {/* ════════════════════════════════════
          MODAL 2: FARM BOUNDARY MAP VIEWER
          ════════════════════════════════════ */}
      {isMapOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 flex flex-col" onClick={() => setIsMapOpen(false)}>
          <div className="flex flex-col h-full" onClick={e => e.stopPropagation()}>
            {/* Map header */}
            <div className="bg-surface px-space-md py-space-sm flex items-center justify-between shadow-sm pt-safe">
              <div className="flex items-center gap-space-sm">
                <button onClick={() => setIsMapOpen(false)} className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-surface-container" type="button">
                  <span className="material-symbols-outlined text-[24px]">arrow_back</span>
                </button>
                <div>
                  <h3 className="font-headline-sm text-headline-sm text-on-surface">Farm Boundary</h3>
                  <p className="font-label-sm text-label-sm text-on-surface-variant">{totalArea} Acres mapped</p>
                </div>
              </div>
              <button
                onClick={() => { setIsMapOpen(false); navigate('/farm/boundary'); }}
                className="px-space-sm py-1.5 rounded-full bg-primary text-on-primary font-label-sm text-label-sm flex items-center gap-1 active:scale-95 transition-transform"
                type="button"
              >
                <span className="material-symbols-outlined text-[16px]">edit_location</span>
                <span>Re-map</span>
              </button>
            </div>

            {/* Map */}
            <div className="flex-1 relative" style={{ minHeight: 0 }}>
              {boundaryPoints.length > 0 ? (
                  <MapContainer
                    key={mapKey}
                    center={mapCenter}
                    zoom={16}
                    scrollWheelZoom={true}
                    style={{ width: '100%', height: '100%' }}
                    zoomControl={true}
                  >
                    <TileLayer
                      attribution='&copy; OpenStreetMap contributors'
                      url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                    />
                    <Polygon
                      positions={boundaryPoints}
                      pathOptions={{ color: '#1b5e20', fillColor: '#4caf50', fillOpacity: 0.35, weight: 2 }}
                    />
                  </MapContainer>
              ) : (
                <div className="w-full h-full bg-surface-container flex flex-col items-center justify-center gap-space-md p-space-lg">
                  <span className="material-symbols-outlined text-[64px] text-on-surface-variant">map</span>
                  <p className="font-body-md text-body-md text-on-surface-variant text-center">No boundary mapped yet.</p>
                  <button
                    onClick={() => { setIsMapOpen(false); navigate('/farm/boundary'); }}
                    className="px-space-lg py-space-sm bg-primary text-on-primary rounded-xl font-label-lg text-label-lg flex items-center gap-2"
                    type="button"
                  >
                    <span className="material-symbols-outlined text-[20px]">add_location</span>
                    <span>Map My Land Now</span>
                  </button>
                </div>
              )}
            </div>

            {/* Area info strip */}
            {boundaryPoints.length > 0 && (
              <div className="bg-surface px-space-md py-space-sm flex items-center justify-between pb-safe shadow-[0_-2px_10px_rgba(0,0,0,0.06)]">
                <div className="flex items-center gap-space-sm">
                  <span className="w-3 h-3 rounded-sm bg-[#4caf50] border border-[#1b5e20]"></span>
                  <span className="font-label-md text-label-md text-on-surface font-semibold">{farm?.name || 'My Farm'}</span>
                </div>
                <span className="font-label-sm text-label-sm text-on-surface-variant">{totalArea} Ac · {boundaryPoints.length} pts</span>
              </div>
            )}
          </div>
        </div>
      )}


      {/* ════════════════════════════════════
          MODAL 3: 11 MODULES SHEET
          ════════════════════════════════════ */}
      {isModulesSheetOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex flex-col justify-end" onClick={() => setIsModulesSheetOpen(false)}>
          <div className="bg-surface rounded-t-xl max-h-[85vh] flex flex-col overflow-hidden shadow-xl" onClick={e => e.stopPropagation()}>
            <div className="p-space-md bg-surface-container-high flex items-center justify-between">
              <div className="flex items-center gap-space-xs">
                <span className="material-symbols-outlined text-primary text-[24px]">apps</span>
                <h3 className="font-headline-sm text-headline-sm text-on-surface">All Agritech Tools & Modules</h3>
              </div>
              <button onClick={() => setIsModulesSheetOpen(false)} className="w-9 h-9 rounded-full bg-surface flex items-center justify-center text-on-surface active:scale-95" type="button">
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>
            <div className="p-space-md overflow-y-auto space-y-space-md">
              <p className="font-body-sm text-body-sm text-on-surface-variant">Select an agritech module to open specialized workflows.</p>
              <div className="grid grid-cols-2 gap-space-sm pb-space-lg">
                {modules.map(mod => (
                  <div key={mod.id} onClick={() => { setIsModulesSheetOpen(false); navigate(mod.route); }} className="bg-surface-container-lowest p-space-sm rounded-lg flex items-center gap-space-xs cursor-pointer active:scale-95 transition-transform">
                    <span className={`material-symbols-outlined text-[24px] shrink-0 ${mod.colorClass}`}>{mod.icon}</span>
                    <div className="min-w-0">
                      <p className="font-label-md text-label-md text-on-surface font-bold truncate">{mod.title}</p>
                      <p className="font-label-sm text-label-sm text-on-surface-variant truncate">{mod.subtitle}</p>
                    </div>
                  </div>
                ))}
                <div onClick={() => { setIsModulesSheetOpen(false); navigate('/more'); }} className="col-span-2 bg-surface-container-lowest p-space-sm rounded-lg flex items-center gap-space-xs cursor-pointer active:scale-95 transition-transform">
                  <span className="material-symbols-outlined text-[24px] text-secondary shrink-0">forum</span>
                  <div className="min-w-0">
                    <p className="font-label-md text-label-md text-on-surface font-bold truncate">Krishi Charcha Community</p>
                    <p className="font-label-sm text-label-sm text-on-surface-variant truncate">Connect with local farmers</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
