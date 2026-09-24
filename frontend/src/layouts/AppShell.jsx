import React from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export default function AppShell({ 
  children, 
  headerSlot,
  variant = 'default', // 'default' | 'detail'
  hideBottomNav = false,
  title,
  headerPaddingClass = 'px-margin',
  headerHeightClass = 'h-16',
  backButtonClassName = 'min-w-[44px] min-h-[44px]',
  rootClassName = 'bg-surface',
  headerRightSlot,
  headerLeftSlot,
  headerTopSlot,
  headerClassName,
  titleClassName
}) {
  const location = useLocation();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();

  const [farm, setFarm] = React.useState(null);
  const [unreadAlerts, setUnreadAlerts] = React.useState(0);
  
  React.useEffect(() => {
    const farmId = localStorage.getItem('farmId');
    if (!farmId) return;
    
    import('../api/farmApi').then(api => {
      api.getFarmProfile(farmId).then(r => setFarm(r.data)).catch(() => {});
    });
    
    import('../api/communityApi').then(api => {
      api.getAlerts(farmId).then(data => {
        if (data) setUnreadAlerts(data.filter(a => !a.read).length);
      }).catch(() => {});
    });
  }, []);

  const toggleLanguage = () => {
    const newLang = i18n.language === 'en' ? 'hi' : 'en';
    i18n.changeLanguage(newLang);
    localStorage.setItem('agri_language', newLang);
  };

  const navItems = [
    { path: '/', id: 'home', icon: 'home', label: t('nav.home', 'Home') },
    { path: '/planning/crop-plan', id: 'plan', icon: 'calendar_month', label: t('nav.plan', 'Plan') },
    { path: '/marketplace/inputs', id: 'marketplace', icon: 'storefront', label: t('nav.marketplace', 'Marketplace') },
    { path: '/community/alerts', id: 'alerts', icon: 'notifications', label: t('nav.alerts', 'Alerts') },
    { path: '/more', id: 'more', icon: 'grid_view', label: t('nav.more', 'More') }
  ];

  const getPageTitle = (path) => {
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
    if (path.startsWith('/ai/federated-learning')) return 'Federated Learning';
    if (path.startsWith('/ai')) return 'Voice Assistant';
    return 'KhetSaathi';
  };

  const isHome = location.pathname === '/';

  return (
    <div className={`${rootClassName} font-body-md text-body-md text-on-surface flex flex-col min-h-screen antialiased`}>
      {headerSlot ? (
        headerSlot
      ) : variant === 'detail' ? (
        <header className={`fixed top-0 w-full z-50 pt-safe ${headerClassName || 'bg-surface/90 backdrop-blur-xl shadow-[0_1px_8px_rgba(0,0,0,0.04)]'}`}>
          {headerTopSlot && (
            <div className="flex flex-col">
              {headerTopSlot}
            </div>
          )}
          <div className={`${headerHeightClass} ${headerPaddingClass} flex items-center justify-between gap-space-sm`}>
            <div className="flex items-center gap-space-xs min-w-0">
              <button aria-label="Go back" className={`${backButtonClassName} shrink-0 flex items-center justify-center text-on-surface rounded-full hover:bg-surface-container active:bg-surface-container-high transition-colors`} onClick={() => navigate(-1)}>
                <span className="material-symbols-outlined text-[24px]">arrow_back</span>
              </button>
              {headerLeftSlot}
              <h1 className={titleClassName || "font-headline-sm text-on-surface leading-tight truncate max-w-[150px]"}>{title !== undefined ? title : getPageTitle(location.pathname)}</h1>
            </div>
            {headerRightSlot && (
              <div className="flex items-center gap-space-xs shrink-0">
                {headerRightSlot}
              </div>
            )}
          </div>
        </header>
      ) : (
        <header className={`fixed top-0 w-full z-50 pt-safe ${headerClassName || 'bg-surface/90 backdrop-blur-xl shadow-[0_1px_8px_rgba(0,0,0,0.04)]'}`}>
          {isHome ? (
            <div className="h-28 px-gutter flex flex-col justify-between py-space-xs">
              <div className="flex items-center justify-between gap-1">
                <div className="flex items-center gap-1">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-primary text-[20px]">eco</span>
                  </div>
                  <span className="font-headline-sm text-headline-sm text-primary tracking-tight hidden sm:block">KhetSaathi</span>
                </div>
                <button 
                  className="flex items-center gap-1 px-2 py-1 rounded-full bg-surface-container text-on-surface-variant min-h-[44px] shrink" 
                  type="button"
                  onClick={() => navigate('/farm/profile')}
                >
                  <span className="material-symbols-outlined text-[18px] text-primary shrink-0">location_on</span>
                  <span className="font-label-md text-label-md truncate max-w-[80px] sm:max-w-[150px]">{farm?.name || 'Farm Dashboard'}</span>
                  <span className="material-symbols-outlined text-[16px] shrink-0">expand_more</span>
                </button>
                <div className="flex items-center gap-1 shrink-0">
                  <button 
                    className="min-h-[44px] min-w-[44px] px-2.5 py-1 rounded-full bg-surface-container flex items-center justify-center font-label-sm text-label-sm text-on-surface hover:bg-surface-container-high transition-colors uppercase" 
                    type="button"
                    onClick={toggleLanguage}
                  >
                    {i18n.language === 'hi' ? 'HI' : 'EN'}
                  </button>
                  <button 
                    aria-label="Notifications" 
                    className="relative min-h-[44px] min-w-[44px] flex items-center justify-center text-on-surface-variant hover:text-on-surface" 
                    type="button"
                    onClick={() => navigate('/community/alerts')}
                  >
                    <span className="material-symbols-outlined text-[22px]">notifications</span>
                    {unreadAlerts > 0 && (
                      <span className="absolute top-1.5 right-1.5 min-w-[18px] h-[18px] bg-secondary-container text-on-secondary font-label-sm text-[10px] rounded-full flex items-center justify-center px-1">{unreadAlerts}</span>
                    )}
                  </button>
                  <Link to="/farm/profile" className="w-11 h-11 rounded-full bg-primary flex items-center justify-center">
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
                <Link to="/farm/profile" className="w-11 h-11 rounded-full bg-primary flex items-center justify-center">
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

      {(!hideBottomNav && navItems.length > 0) && (
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
      )}
    </div>
  );
}
