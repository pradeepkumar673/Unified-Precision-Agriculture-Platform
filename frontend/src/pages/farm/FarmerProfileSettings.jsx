import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../App'; // Import auth to allow logout
import { useTranslation } from 'react-i18next';
import { getFarmProfile, getFarmZones } from '../../api/farmApi';

export default function FarmerProfileSettings() {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  
  const farmId = localStorage.getItem('farmId');
  const [farm, setFarm] = useState(null);
  const [zones, setZones] = useState([]);

  useEffect(() => {
    if (!farmId) return;
    getFarmProfile(farmId).then(r => setFarm(r.data)).catch(() => {});
    getFarmZones(farmId).then(r => setZones(r.data || [])).catch(() => {});
  }, [farmId]);

  const farmerName = farm?.owner_name || 'Farmer';
  const farmShortId = farm?.id ? `#KS-${farm.id.slice(0, 6).toUpperCase()}` : '#KS-PENDING';
  const locationText = [farm?.village, farm?.district, farm?.state].filter(Boolean).join(', ') || 'Location pending';
  const totalArea = farm?.land_size_acres || 0;
  const areaHa = (totalArea * 0.404686).toFixed(2);
  
  // Use first two zones if available, otherwise fallback to farm level crop
  const plot1 = zones.length > 0 ? zones[0] : null;
  const plot2 = zones.length > 1 ? zones[1] : null;

  const handleLanguageToggle = () => {
    const nextLang = i18n.language === 'en' ? 'hi' : 'en';
    i18n.changeLanguage(nextLang);
    localStorage.setItem('agri_language', nextLang);
  };

  const { logout } = useAuth();
  const [isSheetOpen, setIsSheetOpen] = useState(false);

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

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="flex flex-col w-full px-space-md pt-24 pb-28 space-y-space-md">
      {/* Farmer Profile Header Card */}
      <div className="bg-surface-container-lowest p-space-md rounded-xl shadow-sm flex flex-col gap-space-sm relative overflow-hidden">
        <div className="flex items-start gap-space-md">
          <div className="relative shrink-0">
            <div className="w-20 h-20 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center shadow-sm">
              <span className="font-display-sm text-display-sm">{farmerName.charAt(0).toUpperCase()}</span>
            </div>
            <span className="absolute bottom-0 right-0 w-6 h-6 bg-primary text-on-primary rounded-full flex items-center justify-center shadow">
              <span className="material-symbols-outlined text-[14px]">check</span>
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-space-xs">
              <h1 className="font-headline-sm text-headline-sm text-on-surface truncate">{farmerName}</h1>
              <button aria-label="Edit Profile" className="px-space-sm py-1 rounded-full bg-surface-container-high text-on-surface font-label-sm text-label-sm flex items-center gap-1 active:scale-95 transition-transform" type="button">
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
        
        {/* Verification Badge Strip */}
        <div className="bg-surface-container-low px-space-sm py-2 rounded-lg flex items-center justify-between gap-space-xs mt-space-sm">
          <div className="flex items-center gap-space-xs min-w-0">
            <span className="material-symbols-outlined text-primary text-[18px] shrink-0" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
            <span className="font-label-sm text-label-sm text-on-surface font-semibold truncate">KYC Verified</span>
          </div>
          <span className="font-label-sm text-label-sm text-primary font-bold bg-primary-fixed px-2 py-0.5 rounded-full shrink-0">Active</span>
        </div>
      </div>

      {/* Farm Holdings Summary Bento Card */}
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
            <p className="font-headline-sm text-headline-sm text-on-surface font-bold">{totalArea} Acres <span className="font-body-sm text-body-sm text-on-surface-variant font-normal">({areaHa} Ha)</span></p>
          </div>
          <span className="w-10 h-10 rounded-full bg-primary-fixed flex items-center justify-center text-primary shrink-0">
            <span className="material-symbols-outlined text-[22px]">crop_free</span>
          </span>
        </div>

        {/* Plots Quick Snapshot */}
        <div className="grid grid-cols-2 gap-space-sm">
          {plot1 || farm?.current_crop ? (
            <div onClick={() => navigate('/farm/profile')} className="bg-surface-container-low p-space-sm rounded-lg flex flex-col justify-between space-y-1 cursor-pointer active:scale-95 transition-transform">
              <div className="flex items-center gap-1 text-primary">
                <span className="material-symbols-outlined text-[16px]">grass</span>
                <span className="font-label-sm text-label-sm font-bold truncate">{plot1?.name || 'Main Plot'}</span>
              </div>
              <p className="font-body-sm text-body-sm text-on-surface font-semibold truncate">{plot1?.current_crop || farm?.current_crop || 'Not specified'}</p>
              <span className="inline-block font-label-sm text-label-sm text-secondary bg-secondary-fixed px-2 py-0.5 rounded-full self-start truncate">{plot1?.crop_stage || farm?.crop_stage || 'Unknown Stage'}</span>
            </div>
          ) : null}
          
          {plot2 ? (
            <div onClick={() => navigate('/farm/profile')} className="bg-surface-container-low p-space-sm rounded-lg flex flex-col justify-between space-y-1 cursor-pointer active:scale-95 transition-transform">
              <div className="flex items-center gap-1 text-primary">
                <span className="material-symbols-outlined text-[16px]">eco</span>
                <span className="font-label-sm text-label-sm font-bold truncate">{plot2.name}</span>
              </div>
              <p className="font-body-sm text-body-sm text-on-surface font-semibold truncate">{plot2.current_crop || 'Not specified'}</p>
              <span className="inline-block font-label-sm text-label-sm text-primary bg-primary-fixed px-2 py-0.5 rounded-full self-start truncate">{plot2.crop_stage || 'Unknown Stage'}</span>
            </div>
          ) : null}
        </div>

        {/* Soil Health & Equipment Details */}
        <div className="space-y-space-xs pt-1">
          <div className="flex items-center justify-between py-1 cursor-pointer hover:bg-surface-container-low transition-colors rounded px-1" onClick={() => navigate('/water-soil/soil-health')}>
            <div className="flex items-center gap-space-xs text-on-surface-variant">
              <span className="material-symbols-outlined text-[18px] text-primary">science</span>
              <span className="font-body-sm text-body-sm text-on-surface">Soil Health Card</span>
            </div>
            <span className="font-label-sm text-label-sm text-primary font-bold bg-primary-fixed px-2 py-0.5 rounded-full">Report Pending</span>
          </div>
          <div className="flex items-center justify-between py-1">
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

      {/* Explore More Tools & Services CTA Banner */}
      <div onClick={() => setIsSheetOpen(true)} className="bg-secondary-container text-on-secondary-container p-space-md rounded-xl shadow-md cursor-pointer active:scale-[0.99] transition-transform flex items-center justify-between gap-space-sm">
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

      {/* Account & App Settings Section */}
      <div className="space-y-space-xs">
        <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider px-space-xs">Preferences & Records</span>
        <div className="bg-surface-container-lowest rounded-xl shadow-sm overflow-hidden flex flex-col">
          {/* Language & Audio */}
          <div onClick={handleLanguageToggle} className="p-space-md flex items-center justify-between cursor-pointer active:bg-surface-container-low transition-colors">
            <div className="flex items-center gap-space-md min-w-0">
              <div className="w-10 h-10 rounded-full bg-surface-container-high flex items-center justify-center text-primary shrink-0">
                <span className="material-symbols-outlined text-[20px]">translate</span>
              </div>
              <div className="min-w-0">
                <p className="font-label-lg text-label-lg text-on-surface font-semibold truncate">Language & Voice Assistance</p>
                <p className="font-label-sm text-label-sm text-on-surface-variant truncate">{i18n.language === 'hi' ? 'हिंदी (Hindi)' : 'English'} • Audio Readout (Normal)</p>
              </div>
            </div>
            <span className="material-symbols-outlined text-[20px] text-on-surface-variant shrink-0">sync_alt</span>
          </div>
          <div className="h-[1px] bg-surface-container mx-space-md"></div>
          
          {/* Notifications & Outbreak Alerts */}
          <div onClick={() => navigate('/community/alerts')} className="p-space-md flex items-center justify-between cursor-pointer active:bg-surface-container-low transition-colors">
            <div className="flex items-center gap-space-md min-w-0">
              <div className="w-10 h-10 rounded-full bg-surface-container-high flex items-center justify-center text-secondary shrink-0">
                <span className="material-symbols-outlined text-[20px]">notifications_active</span>
              </div>
              <div className="min-w-0">
                <p className="font-label-lg text-label-lg text-on-surface font-semibold truncate">Critical Alerts & Mandi Updates</p>
                <p className="font-label-sm text-label-sm text-on-surface-variant truncate">Pest warnings & SMS Fallback Enabled</p>
              </div>
            </div>
            <span className="material-symbols-outlined text-[20px] text-on-surface-variant shrink-0">chevron_right</span>
          </div>
          <div className="h-[1px] bg-surface-container mx-space-md"></div>
          
          {/* Linked Bank & DBT */}
          <div onClick={() => navigate('/gov/schemes')} className="p-space-md flex items-center justify-between cursor-pointer active:bg-surface-container-low transition-colors">
            <div className="flex items-center gap-space-md min-w-0">
              <div className="w-10 h-10 rounded-full bg-surface-container-high flex items-center justify-center text-primary shrink-0">
                <span className="material-symbols-outlined text-[20px]">account_balance</span>
              </div>
              <div className="min-w-0">
                <p className="font-label-lg text-label-lg text-on-surface font-semibold truncate">Linked Bank & DBT Subsidy</p>
                <p className="font-label-sm text-label-sm text-on-surface-variant truncate">SBI A/C ••••4891 • PM-Kisan Active</p>
              </div>
            </div>
            <span className="material-symbols-outlined text-[20px] text-on-surface-variant shrink-0">chevron_right</span>
          </div>
          <div className="h-[1px] bg-surface-container mx-space-md"></div>
          
          {/* Document Vault */}
          <div onClick={() => navigate('/gov/documents')} className="p-space-md flex items-center justify-between cursor-pointer active:bg-surface-container-low transition-colors">
            <div className="flex items-center gap-space-md min-w-0">
              <div className="w-10 h-10 rounded-full bg-surface-container-high flex items-center justify-center text-tertiary shrink-0">
                <span className="material-symbols-outlined text-[20px]">folder_shared</span>
              </div>
              <div className="min-w-0">
                <p className="font-label-lg text-label-lg text-on-surface font-semibold truncate">Farmer Document Vault</p>
                <p className="font-label-sm text-label-sm text-on-surface-variant truncate">4 of 5 Verified (7/12, Aadhaar, Soil Card)</p>
              </div>
            </div>
            <span className="material-symbols-outlined text-[20px] text-on-surface-variant shrink-0">chevron_right</span>
          </div>
          <div className="h-[1px] bg-surface-container mx-space-md"></div>
          
          {/* Custom Hiring Operator Mode */}
          <div className="p-space-md flex items-center justify-between cursor-pointer active:bg-surface-container-low transition-colors">
            <div className="flex items-center gap-space-md min-w-0">
              <div className="w-10 h-10 rounded-full bg-surface-container-high flex items-center justify-center text-primary shrink-0">
                <span className="material-symbols-outlined text-[20px]">rv_hookup</span>
              </div>
              <div className="min-w-0">
                <p className="font-label-lg text-label-lg text-on-surface font-semibold truncate">Custom Hiring Operator Mode</p>
                <p className="font-label-sm text-label-sm text-on-surface-variant truncate">Rent out your Power Tiller & Pump</p>
              </div>
            </div>
            <span className="material-symbols-outlined text-[20px] text-on-surface-variant shrink-0">toggle_off</span>
          </div>
        </div>
      </div>

      {/* Support & Help Center */}
      <div className="space-y-space-xs">
        <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider px-space-xs">Farmer Support & Helplines</span>
        <div className="grid grid-cols-2 gap-space-sm">
          {/* Digital Sakhi Contact */}
          <div className="bg-surface-container-lowest p-space-md rounded-xl shadow-sm flex flex-col justify-between space-y-space-sm">
            <div className="w-10 h-10 rounded-full bg-primary-fixed flex items-center justify-center text-primary">
              <span className="material-symbols-outlined text-[20px]">support_agent</span>
            </div>
            <div>
              <p className="font-label-sm text-label-sm text-on-surface-variant">Assigned Mitra</p>
              <p className="font-body-sm text-body-sm text-on-surface font-bold truncate">Sunita Devi (Sakhi)</p>
            </div>
            <button onClick={() => navigate('/community/digital-sakhi')} className="w-full py-2 bg-primary-container text-on-primary font-label-sm text-label-sm rounded-lg flex items-center justify-center gap-1 active:scale-95 transition-transform" type="button">
              <span className="material-symbols-outlined text-[16px]">call</span>
              <span>Call Mitra</span>
            </button>
          </div>
          
          {/* Kisan Call Center */}
          <div className="bg-surface-container-lowest p-space-md rounded-xl shadow-sm flex flex-col justify-between space-y-space-sm">
            <div className="w-10 h-10 rounded-full bg-secondary-fixed flex items-center justify-center text-secondary">
              <span className="material-symbols-outlined text-[20px]">phone_in_talk</span>
            </div>
            <div>
              <p className="font-label-sm text-label-sm text-on-surface-variant">Govt Helpline</p>
              <p className="font-body-sm text-body-sm text-on-surface font-bold truncate">1800-180-1551</p>
            </div>
            <button className="w-full py-2 bg-secondary text-on-secondary font-label-sm text-label-sm rounded-lg flex items-center justify-center gap-1 active:scale-95 transition-transform" type="button">
              <span className="material-symbols-outlined text-[16px]">headset_mic</span>
              <span>Toll-Free</span>
            </button>
          </div>
        </div>

        {/* WhatsApp Support Bot Tile */}
        <div className="bg-surface-container-lowest p-space-md rounded-xl shadow-sm flex items-center justify-between cursor-pointer active:bg-surface-container-low transition-colors mt-space-sm">
          <div className="flex items-center gap-space-md min-w-0">
            <div className="w-10 h-10 rounded-full bg-primary-fixed flex items-center justify-center text-primary shrink-0">
              <span className="material-symbols-outlined text-[20px]">chat</span>
            </div>
            <div className="min-w-0">
              <p className="font-label-lg text-label-lg text-on-surface font-semibold truncate">WhatsApp Krishi Sahayak</p>
              <p className="font-label-sm text-label-sm text-on-surface-variant truncate">Instant advisory in Marathi & Hindi</p>
            </div>
          </div>
          <span className="font-label-sm text-label-sm text-primary font-bold bg-primary-fixed px-space-sm py-1 rounded-full shrink-0">Open Chat</span>
        </div>
      </div>

      {/* Logout / Switch Profile */}
      <div className="pt-space-sm pb-space-sm flex flex-col items-center space-y-space-sm">
        <button onClick={handleLogout} className="w-full py-space-sm bg-error-container text-on-error-container rounded-xl font-label-lg text-label-lg font-bold flex items-center justify-center gap-space-xs active:scale-[0.98] transition-transform" type="button">
          <span className="material-symbols-outlined text-[20px]">logout</span>
          <span>Switch Account or Logout</span>
        </button>
        <div className="flex items-center gap-space-xs text-on-surface-variant">
          <span className="font-label-sm text-label-sm">KhetSaathi v2.4.0 (Build 412)</span>
          <span>•</span>
          <a className="font-label-sm text-label-sm underline hover:text-on-surface" href="#">Privacy</a>
          <span>•</span>
          <a className="font-label-sm text-label-sm underline hover:text-on-surface" href="#">Terms</a>
        </div>
      </div>

      {/* Fullscreen Modal / Sheet: 11 Advanced Agritech Modules */}
      <div className={`${isSheetOpen ? 'flex' : 'hidden'} fixed inset-0 z-50 bg-inverse-surface/60 backdrop-blur-sm flex-col justify-end p-0`} onClick={() => setIsSheetOpen(false)}>
        <div className="bg-surface rounded-t-xl max-h-[85vh] flex flex-col overflow-hidden shadow-xl animate-in slide-in-from-bottom duration-200" onClick={(e) => e.stopPropagation()}>
          <div className="p-space-md bg-surface-container-high flex items-center justify-between">
            <div className="flex items-center gap-space-xs">
              <span className="material-symbols-outlined text-primary text-[24px]">apps</span>
              <h3 className="font-headline-sm text-headline-sm text-on-surface">All Agritech Tools & Modules</h3>
            </div>
            <button onClick={() => setIsSheetOpen(false)} className="w-9 h-9 rounded-full bg-surface flex items-center justify-center text-on-surface active:scale-95" type="button">
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>
          </div>
          
          <div className="p-space-md overflow-y-auto space-y-space-md">
            <p className="font-body-sm text-body-sm text-on-surface-variant">Select an agritech module to open specialized field workflows and tools.</p>
            
            <div className="grid grid-cols-2 gap-space-sm pb-space-lg">
              {modules.map((mod) => (
                <div key={mod.id} onClick={() => { setIsSheetOpen(false); navigate(mod.route); }} className="bg-surface-container-lowest p-space-sm rounded-lg flex items-center gap-space-xs cursor-pointer active:scale-95 transition-transform">
                  <span className={`material-symbols-outlined text-[24px] shrink-0 ${mod.colorClass}`}>{mod.icon}</span>
                  <div className="min-w-0">
                    <p className="font-label-md text-label-md text-on-surface font-bold truncate">{mod.title}</p>
                    <p className="font-label-sm text-label-sm text-on-surface-variant truncate">{mod.subtitle}</p>
                  </div>
                </div>
              ))}

              {/* 11. Krishi Charcha Community (spans 2 cols) */}
              <div onClick={() => { setIsSheetOpen(false); navigate('/more'); }} className="col-span-2 bg-surface-container-lowest p-space-sm rounded-lg flex items-center gap-space-xs cursor-pointer active:scale-95 transition-transform">
                <span className="material-symbols-outlined text-[24px] text-secondary shrink-0">forum</span>
                <div className="min-w-0">
                  <p className="font-label-md text-label-md text-on-surface font-bold truncate">Krishi Charcha (Farmer Community)</p>
                  <p className="font-label-sm text-label-sm text-on-surface-variant truncate">Connect with local farmers to share advice & crop solutions</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
