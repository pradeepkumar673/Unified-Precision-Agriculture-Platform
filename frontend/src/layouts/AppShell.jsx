import React from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';

export default function AppShell({ headerSlot, children }) {
  const location = useLocation();
  const navigate = useNavigate();

  const navItems = [
    { path: '/', id: 'home', icon: 'home', label: 'Home' },
    { path: '/planning/crop-plan', id: 'plan', icon: 'calendar_month', label: 'Plan' },
    { path: '/marketplace/inputs', id: 'marketplace', icon: 'storefront', label: 'Marketplace' },
    { path: '/community/alerts', id: 'alerts', icon: 'notifications', label: 'Alerts' },
    { path: '/farm/profile', id: 'profile', icon: 'account_circle', label: 'Profile' }
  ];

  const getPageTitle = (path) => {
    if (path === '/') return 'Home';
    if (path.startsWith('/planning/crop-plan')) return 'Crop Plan & Recommendations';
    if (path.startsWith('/planning/season-performance')) return 'Season Performance';
    if (path.startsWith('/planning/season-timeline')) return 'Season Timeline';
    if (path.startsWith('/planning/variety-comparison')) return 'Variety Comparison';
    if (path.startsWith('/planning/rotation')) return 'Crop Rotation Suggestions';
    if (path.startsWith('/marketplace/inputs')) return 'Inputs Browse';
    if (path.startsWith('/marketplace/machinery')) return 'Machinery Rental';
    if (path.startsWith('/marketplace/harvest')) return 'Harvest Marketplace';
    if (path.startsWith('/marketplace/delivery')) return 'Logistics Tracking';
    if (path.startsWith('/community/alerts')) return 'Community Alerts';
    if (path.startsWith('/community/digital-sakhi')) return 'Digital Sakhi AI';
    if (path.startsWith('/community/shg-bookings')) return 'SHG Shared Bookings';
    if (path.startsWith('/community/disease-map')) return 'Disease Outbreak Map';
    if (path.startsWith('/community/fpo-cooperative-suite')) return 'FPO Cooperative Suite';
    if (path.startsWith('/farm/profile')) return 'Farmer Profile Settings';
    if (path.startsWith('/more')) return 'More Feature Hub';
    if (path.startsWith('/health/disease-result')) return 'Diagnosis Result';
    if (path.startsWith('/health/disease-scanner')) return 'Disease Scanner';
    if (path.startsWith('/water-soil/irrigation')) return 'Irrigation Recommendation';
    if (path.startsWith('/water-soil/demand-forecast')) return 'Water Demand Forecast';
    if (path.startsWith('/water-soil/zone-management')) return 'Zone Management';
    if (path.startsWith('/water-soil/soil-health')) return 'Soil Health Heatmap';
    if (path.startsWith('/vision/price-forecast')) return 'Mandi Price Forecast';
    if (path.startsWith('/vision/yield-forecast')) return 'Yield Forecast';
    if (path.startsWith('/vision/satellite')) return 'Satellite Crop Stress';
    if (path.startsWith('/vision/drone-climate')) return 'Drone & Climate Risk';
    if (path.startsWith('/finance/wallet')) return 'Wallet Transaction Ledger';
    if (path.startsWith('/finance/checkout')) return 'Payment Checkout';
    if (path.startsWith('/finance/credit-insurance')) return 'Credit & Insurance';
    if (path.startsWith('/gov/schemes')) return 'Scheme Matching';
    if (path.startsWith('/gov/documents')) return 'Farmer Document Vault';
    if (path.startsWith('/gov/traceability')) return 'Produce Traceability';
    if (path.startsWith('/iot/dashboard')) return 'Live Sensor Dashboard';
    if (path.startsWith('/iot/hydro-climate')) return 'Hydroponics Climate Control';
    if (path.startsWith('/iot/shelves')) return 'Vertical Farm Shelf Monitor';
    if (path.startsWith('/ai/causal-lab')) return 'Counterfactual Simulator';
    if (path.startsWith('/ai/multimodal-query')) return 'Multimodal Query';
    if (path.startsWith('/ai')) return 'Voice Assistant';
    return 'KhetSaathi';
  };

  const isHome = location.pathname === '/';

  return (
    <div className="bg-surface font-body-md text-body-md text-on-surface flex flex-col min-h-screen antialiased">
      {headerSlot ? (
        headerSlot
      ) : (
        <header className="fixed top-0 w-full z-50 bg-surface/90 backdrop-blur-xl shadow-[0_1px_8px_rgba(0,0,0,0.04)] pt-safe">
          {isHome ? (
            <div className="h-28 px-gutter flex flex-col justify-between py-space-xs">
              <div className="flex items-center justify-between gap-space-xs">
                <div className="flex items-center gap-space-xs">
                  <img 
                    alt="Brand logo" 
                    className="h-8 w-auto object-contain" 
                    src="https://lh3.googleusercontent.com/aida/AEtjO1UIQkciQWmlsTRY8f9Zy0F8V6Ui5SnL-bNI1XODjLR9sQNG4BHGAMrtvwAK-8Il7hBixSfzotAqt-1yzxZ1tS8lfeStHMZMcAAazASvjFxGLljEzJwhmT37IQLEv0u0wChglbOYjrW80Tbxp2N5Gci7RSN8sqPVnTp66_kG_QHJe8HBtzy0s7YivFGLy5OK6W6ahvWh_DtV3OjnAKUT1Zgj0Ae4r9TLabB2OQOypc-WO4bS3YHevJEUIf8"
                  />
                  <span className="font-headline-sm text-headline-sm text-primary tracking-tight">KhetSaathi</span>
                </div>
                <button className="flex items-center gap-1 px-space-xs py-1 rounded-full bg-surface-container text-on-surface-variant min-h-[44px] px-3" type="button">
                  <span className="material-symbols-outlined text-[18px] text-primary">location_on</span>
                  <span className="font-label-md text-label-md truncate max-w-[150px]">Green Valley Farm • Nashik</span>
                  <span className="material-symbols-outlined text-[16px]">expand_more</span>
                </button>
                <div className="flex items-center gap-space-xs">
                  <button className="min-h-[44px] min-w-[44px] px-2.5 py-1 rounded-full bg-surface-container flex items-center justify-center font-label-sm text-label-sm text-on-surface hover:bg-surface-container-high transition-colors" type="button">
                    EN
                  </button>
                  <button aria-label="Notifications" className="relative min-h-[44px] min-w-[44px] flex items-center justify-center text-on-surface-variant hover:text-on-surface" type="button">
                    <span className="material-symbols-outlined text-[22px]">notifications</span>
                    <span className="absolute top-1.5 right-1.5 min-w-[18px] h-[18px] bg-secondary-container text-on-secondary font-label-sm text-[10px] rounded-full flex items-center justify-center px-1">3</span>
                  </button>
                  <Link to="/farm/profile" className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                    <span className="material-symbols-outlined text-on-primary text-[18px]">person</span>
                  </Link>
                </div>
              </div>
              <div className="flex items-center justify-between pb-1">
                <div className="flex items-center gap-1.5 px-space-xs py-0.5 rounded-full bg-surface-container-low">
                  <span className="w-2 h-2 rounded-full bg-primary-container animate-pulse"></span>
                  <span className="font-label-sm text-label-sm text-on-surface-variant">Synced 2m ago • Offline Ready</span>
                </div>
                <h1 className="font-label-lg text-label-lg text-primary truncate pl-space-xs">{getPageTitle(location.pathname)}</h1>
              </div>
            </div>
          ) : (
            <div className="h-20 px-margin flex items-center justify-between gap-space-sm">
              <div className="flex items-center gap-space-xs min-w-0">
                <button aria-label="Go back" onClick={() => navigate(-1)} className="w-11 h-11 flex items-center justify-center text-on-surface rounded-full hover:bg-surface-variant transition-colors" type="button">
                  <span className="material-symbols-outlined text-[24px]">arrow_back</span>
                </button>
                <h1 className="font-headline-sm text-headline-sm text-on-surface truncate ml-space-xs">{getPageTitle(location.pathname)}</h1>
              </div>
              <div className="flex items-center gap-space-xs shrink-0">
                <Link to="/farm/profile" className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                  <span className="material-symbols-outlined text-on-primary text-[18px]">person</span>
                </Link>
              </div>
            </div>
          )}
        </header>
      )}

      <main className="flex flex-col relative w-full flex-grow">
        {children || <Outlet />}
      </main>

      <nav className="fixed bottom-0 inset-x-0 z-50 pb-safe bg-surface/90 backdrop-blur-xl shadow-[0_-2px_10px_rgba(0,0,0,0.05)]" data-active-classes="text-primary font-bold">
        <div className="flex justify-around items-center h-20 px-space-xs">
          {navItems.map((item) => {
            const isActive = item.path === '/' 
              ? location.pathname === '/' 
              : location.pathname.startsWith(item.path);

            return (
              <Link
                key={item.id}
                to={item.path}
                className={`flex flex-col items-center justify-center gap-space-xs min-w-[56px] min-h-[48px] transition-colors ${
                  isActive 
                    ? 'text-primary font-bold' 
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                <span className="material-symbols-outlined text-[24px]">{item.icon}</span>
                <span className="font-label-sm text-label-sm">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
