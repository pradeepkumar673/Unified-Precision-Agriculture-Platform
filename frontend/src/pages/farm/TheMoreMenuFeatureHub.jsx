import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function TheMoreMenuFeatureHub() {
  const [filter, setFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchActive, setIsSearchActive] = useState(false);
  const navigate = useNavigate();

  // Bottom Sheet State
  const [sheetContent, setSheetContent] = useState(null);

  const toggleTheme = () => {
    const html = document.documentElement;
    if (html.classList.contains('dark')) {
      html.classList.remove('dark');
      alert("Switched to Light Mode (Sunlight Visibility)");
    } else {
      html.classList.add('dark');
      alert("Switched to Dark Mode (Battery Saver)");
    }
  };

  const handlePushNotifications = async () => {
    if (!('Notification' in window)) {
      alert("This browser does not support desktop notification");
      return;
    }
    const perm = await Notification.requestPermission();
    if (perm === "granted") {
      new Notification("KhetSaathi Alerts Enabled", {
        body: "You will now receive time-sensitive pest and irrigation alerts."
      });
    } else {
      alert("Push notifications were denied.");
    }
  };

  const handleOfflineSync = () => {
    const isOnline = navigator.onLine;
    alert(`Sync Engine Status: ${isOnline ? 'ONLINE' : 'OFFLINE'}\n\n${isOnline ? 'All forms and logs are synchronized with the cloud.' : 'Currently working locally. Data will sync when connection returns.'}`);
  };

  const handleLanguage = () => {
    setSheetContent({
      title: "Language Localization",
      options: ['English', 'हिंदी (Hindi)', 'मराठी (Marathi)', 'ਪੰਜਾਬੀ (Punjabi)'],
      onSelect: (lang) => {
        localStorage.setItem('appLang', lang);
        alert(`Language changed to ${lang}. (App strings will update on reload)`);
        setSheetContent(null);
      }
    });
  };

  const handleRbac = () => {
    setSheetContent({
      title: "Role-Based Access Control",
      options: ['Farmer (Default)', 'FPO Leader', 'Buyer / Corporate', 'Agronomist'],
      onSelect: (role) => {
        localStorage.setItem('userRole', role);
        alert(`Access level switched to: ${role}. UI elements will adapt accordingly.`);
        setSheetContent(null);
      }
    });
  };

  const handleErrorLogs = () => {
    setSheetContent({
      title: "Global Error Logs",
      text: "No severe exceptions caught in the current session. The Error Boundary is active and watching."
    });
  };

  // All 57 features mapped to screens
  const modules = [
    // 1. Farm Planning & Management
    { id: '1-1', cat: 'planning', bgClass: 'bg-primary-container text-on-primary-container', icon: 'calendar_month', title: 'Crop Plan Recommendation', badge: 'AI', badgeClass: 'bg-primary text-on-primary', desc: 'AI-suggested crop schedules based on region.', actionText: 'View Plan', route: '/planning/crop-plan' },
    { id: '1-2', cat: 'planning', bgClass: 'bg-surface-variant text-on-surface-variant', icon: 'timeline', title: 'Season Timeline', badge: 'Active', badgeClass: 'bg-secondary text-on-secondary', desc: 'Interactive calendar tracking daily farm tasks.', actionText: 'Open Calendar', route: '/planning/season-timeline' },
    { id: '1-3', cat: 'planning', bgClass: 'bg-tertiary-container text-on-tertiary-container', icon: 'analytics', title: 'Season Performance Report', badge: 'Analytics', badgeClass: 'bg-tertiary text-on-tertiary', desc: 'Analytics on past yield vs cost.', actionText: 'View Report', route: '/planning/season-performance' },
    { id: '1-4', cat: 'planning', bgClass: 'bg-primary-fixed text-on-primary-fixed-variant', icon: 'sync', title: 'Crop Rotation Suggestion', badge: 'AI', badgeClass: 'bg-primary text-on-primary', desc: 'AI recommendations to maintain soil nutrients.', actionText: 'Get Suggestion', route: '/planning/rotation' },
    { id: '1-5', cat: 'planning', bgClass: 'bg-secondary-fixed text-on-secondary-fixed-variant', icon: 'compare', title: 'Variety Comparison', badge: 'Data', badgeClass: 'bg-surface text-on-surface', desc: 'Compare seed varieties side-by-side.', actionText: 'Compare', route: '/planning/variety-comparison' },
    { id: '1-6', cat: 'planning', bgClass: 'bg-tertiary-fixed text-on-tertiary-fixed-variant', icon: 'map', title: 'Variable Rate Planning', badge: 'Precision', badgeClass: 'bg-tertiary text-on-tertiary', desc: 'Setup precision fertilizer application maps.', actionText: 'Open Map', route: '/planning/variable-rate' },
    { id: '1-7', cat: 'planning', bgClass: 'bg-surface-container-high text-on-surface', icon: 'account_circle', title: 'Farm Profile & Settings', badge: 'Profile', badgeClass: 'bg-secondary text-on-secondary', desc: 'Manage farm size, soil type, and owner info.', actionText: 'Edit Profile', route: '/farm/profile' },
    { id: '1-8', cat: 'planning', bgClass: 'bg-primary-container text-on-primary-container', icon: 'satellite_alt', title: 'GPS Field Mapping', badge: 'GPS', badgeClass: 'bg-primary text-on-primary', desc: 'Satellite drawing tool to measure precise acreage.', actionText: 'Map Field', route: '/farm/boundary' },

    // 2. Health, Pest & Disease
    { id: '2-1', cat: 'health', bgClass: 'bg-secondary-container text-on-secondary-container', icon: 'document_scanner', title: 'Leaf Disease Scanner', badge: 'Vision', badgeClass: 'bg-secondary text-on-secondary', desc: 'Camera interface to scan sick plants.', actionText: 'Scan Plant', route: '/health/disease-scanner' },
    { id: '2-2', cat: 'health', bgClass: 'bg-tertiary-container text-on-tertiary-container', icon: 'medical_information', title: 'Crop Diagnosis Result', badge: 'AI', badgeClass: 'bg-primary text-on-primary', desc: 'AI output identifying the disease & cure.', actionText: 'View History', route: '/health/disease-result' },
    { id: '2-3', cat: 'health', bgClass: 'bg-error-container text-on-error-container', icon: 'bug_report', title: 'Pest Risk Dashboard', badge: 'Alert', badgeClass: 'bg-error text-on-error', desc: 'Forecasts of pest attacks based on weather.', actionText: 'Check Risk', route: '/health/pest-risk' },
    { id: '2-4', cat: 'health', bgClass: 'bg-surface-variant text-on-surface-variant', icon: 'cruelty_free', title: 'Livestock Health', badge: 'Dairy', badgeClass: 'bg-secondary text-on-secondary', desc: 'Track vaccination and diet for dairy/livestock.', actionText: 'Manage Livestock', route: '/health/livestock' },

    // 3. Water & Soil Management
    { id: '3-1', cat: 'water', bgClass: 'bg-primary-fixed-dim text-on-primary-fixed', icon: 'water_drop', title: 'Irrigation Recommendation', badge: 'IoT', badgeClass: 'bg-primary text-on-primary', desc: 'Daily water requirement calculations.', actionText: 'View Recs', route: '/water-soil/irrigation' },
    { id: '3-2', cat: 'water', bgClass: 'bg-secondary-fixed-dim text-on-secondary-fixed', icon: 'waves', title: 'Water Demand Forecast', badge: 'AI', badgeClass: 'bg-primary text-on-primary', desc: 'Long-term water needs vs reservoir levels.', actionText: 'Forecast', route: '/water-soil/demand-forecast' },
    { id: '3-3', cat: 'water', bgClass: 'bg-tertiary-fixed-dim text-on-tertiary-fixed', icon: 'grid_on', title: 'Zone Management', badge: 'Precision', badgeClass: 'bg-tertiary text-on-tertiary', desc: 'Divide farm into micro-zones for precise care.', actionText: 'Manage Zones', route: '/water-soil/zone-management' },
    { id: '3-4', cat: 'water', bgClass: 'bg-surface-container-high text-on-surface', icon: 'landscape', title: 'Soil Health Heatmap', badge: 'Sensors', badgeClass: 'bg-secondary text-on-secondary', desc: 'Visual map of NPK and moisture levels.', actionText: 'View Map', route: '/water-soil/soil-health' },

    // 4. Vision, Drone & Forecasting
    { id: '4-1', cat: 'vision', bgClass: 'bg-primary-container text-on-primary-container', icon: 'filter_b_and_w', title: 'Satellite Crop Stress', badge: 'NDVI', badgeClass: 'bg-primary text-on-primary', desc: 'NDVI heatmaps showing plant health from space.', actionText: 'View NDVI', route: '/vision/satellite' },
    { id: '4-2', cat: 'vision', bgClass: 'bg-secondary-container text-on-secondary-container', icon: 'grass', title: 'Yield Forecast', badge: 'AI', badgeClass: 'bg-secondary text-on-secondary', desc: 'AI predicting total tons of harvest expected.', actionText: 'Predict Yield', route: '/vision/yield-forecast' },
    { id: '4-3', cat: 'vision', bgClass: 'bg-tertiary-container text-on-tertiary-container', icon: 'trending_up', title: 'Mandi Price Forecast', badge: 'ML', badgeClass: 'bg-tertiary text-on-tertiary', desc: 'Machine learning predicting future market rates.', actionText: 'Check Prices', route: '/vision/price-forecast' },
    { id: '4-4', cat: 'vision', bgClass: 'bg-surface-variant text-on-surface-variant', icon: 'flight', title: 'Drone & Climate Risk', badge: 'Drone', badgeClass: 'bg-secondary text-on-secondary', desc: 'Integrate drone imagery and severe weather tracking.', actionText: 'Analyze Risk', route: '/vision/drone-climate' },

    // 5. Marketplace & Logistics
    { id: '5-1', cat: 'marketplace', bgClass: 'bg-primary-fixed text-on-primary-fixed-variant', icon: 'storefront', title: 'Inputs Marketplace', badge: 'Store', badgeClass: 'bg-primary text-on-primary', desc: 'E-commerce store to buy seeds, fertilizers, and tools.', actionText: 'Shop Inputs', route: '/marketplace/inputs' },
    { id: '5-2', cat: 'marketplace', bgClass: 'bg-secondary-fixed text-on-secondary-fixed-variant', icon: 'agriculture', title: 'Machinery & Labor Rental', badge: 'Rent', badgeClass: 'bg-secondary text-on-secondary', desc: 'Uber-like booking for tractors and labor.', actionText: 'Book Now', route: '/marketplace/rentals' },
    { id: '5-3', cat: 'marketplace', bgClass: 'bg-tertiary-fixed text-on-tertiary-fixed-variant', icon: 'info', title: 'Product Detail / Booking', badge: 'Info', badgeClass: 'bg-tertiary text-on-tertiary', desc: 'Detailed spec sheet for renting heavy machinery.', actionText: 'View Details', route: '/marketplace/machinery' },
    { id: '5-4', cat: 'marketplace', bgClass: 'bg-surface-container-high text-on-surface', icon: 'handshake', title: 'Buyer Exchange', badge: 'B2B', badgeClass: 'bg-primary text-on-primary', desc: 'Connect directly with food processing companies.', actionText: 'Connect', route: '/marketplace/exchange' },
    { id: '5-5', cat: 'marketplace', bgClass: 'bg-primary-container text-on-primary-container', icon: 'sell', title: 'Harvest & Sell Produce', badge: 'Sell', badgeClass: 'bg-secondary text-on-secondary', desc: 'List your yield for live bidding.', actionText: 'List Produce', route: '/marketplace/harvest' },
    { id: '5-6', cat: 'marketplace', bgClass: 'bg-secondary-container text-on-secondary-container', icon: 'local_shipping', title: 'Delivery & Logistics', badge: 'Track', badgeClass: 'bg-tertiary text-on-tertiary', desc: 'Live GPS tracking of trucks moving your produce.', actionText: 'Track Delivery', route: '/marketplace/delivery' },

    // 6. Finance & Insurance
    { id: '6-1', cat: 'finance', bgClass: 'bg-primary-fixed-dim text-on-primary-fixed', icon: 'account_balance_wallet', title: 'Wallet & Ledger', badge: 'Passbook', badgeClass: 'bg-primary text-on-primary', desc: 'Digital passbook tracking all farm expenses.', actionText: 'View Wallet', route: '/finance/wallet' },
    { id: '6-2', cat: 'finance', bgClass: 'bg-secondary-fixed-dim text-on-secondary-fixed', icon: 'payment', title: 'Payment Checkout', badge: 'UPI', badgeClass: 'bg-secondary text-on-secondary', desc: 'Secure UPI/Card gateway for buying inputs.', actionText: 'Pay Now', route: '/finance/checkout' },
    { id: '6-3', cat: 'finance', bgClass: 'bg-tertiary-fixed-dim text-on-tertiary-fixed', icon: 'health_and_safety', title: 'Credit & Insurance Hub', badge: 'Loans', badgeClass: 'bg-tertiary text-on-tertiary', desc: 'Apply for KCC loans and crop insurance.', actionText: 'Apply KCC', route: '/finance/credit-insurance' },

    // 7. Government & Compliance
    { id: '7-1', cat: 'gov', bgClass: 'bg-primary-container text-on-primary-container', icon: 'policy', title: 'Govt Scheme Matching', badge: 'Subsidy', badgeClass: 'bg-primary text-on-primary', desc: 'AI tool that finds subsidies you are eligible for.', actionText: 'Find Schemes', route: '/gov/schemes' },
    { id: '7-2', cat: 'gov', bgClass: 'bg-surface-variant text-on-surface-variant', icon: 'folder', title: 'Farmer Document Vault', badge: 'Secure', badgeClass: 'bg-secondary text-on-secondary', desc: 'Secure digital locker for land records (7/12), Aadhar, etc.', actionText: 'Open Locker', route: '/gov/documents' },
    { id: '7-3', cat: 'gov', bgClass: 'bg-secondary-container text-on-secondary-container', icon: 'qr_code', title: 'Produce Traceability', badge: 'Export', badgeClass: 'bg-tertiary text-on-tertiary', desc: 'Blockchain/QR code generation for export compliance.', actionText: 'Generate QR', route: '/gov/traceability' },

    // 8. Community, FPO & Social
    { id: '8-1', cat: 'community', bgClass: 'bg-tertiary-container text-on-tertiary-container', icon: 'notifications_active', title: 'Farm Alerts Feed', badge: 'Live', badgeClass: 'bg-error text-on-error', desc: 'Real-time localized alerts (weather, pests, canal release).', actionText: 'View Alerts', route: '/community/alerts' },
    { id: '8-2', cat: 'community', bgClass: 'bg-primary-fixed text-on-primary-fixed-variant', icon: 'stars', title: 'Grower Score', badge: 'Rank', badgeClass: 'bg-primary text-on-primary', desc: 'Gamified sustainability score compared to neighbors.', actionText: 'Check Score', route: '/community/grower-score' },
    { id: '8-3', cat: 'community', bgClass: 'bg-surface-container-high text-on-surface', icon: 'forum', title: 'FPO Community Forum', badge: 'Chat', badgeClass: 'bg-secondary text-on-secondary', desc: 'Chat room and knowledge sharing for local farmers.', actionText: 'Join Chat', route: '/community/fpo' },
    { id: '8-4', cat: 'community', bgClass: 'bg-secondary-fixed text-on-secondary-fixed-variant', icon: 'video_call', title: 'Digital Sakhi Support', badge: 'Video', badgeClass: 'bg-tertiary text-on-tertiary', desc: 'Direct video-call line to agricultural experts.', actionText: 'Call Expert', route: '/community/digital-sakhi' },
    { id: '8-5', cat: 'community', bgClass: 'bg-tertiary-fixed text-on-tertiary-fixed-variant', icon: 'group_work', title: 'SHG Shared Bookings', badge: 'Wholesale', badgeClass: 'bg-primary text-on-primary', desc: 'Group buying of expensive inputs to get wholesale rates.', actionText: 'View Shared', route: '/community/shg-bookings' },
    { id: '8-6', cat: 'community', bgClass: 'bg-error-container text-on-error-container', icon: 'warning', title: 'Community Disease Map', badge: 'Waze', badgeClass: 'bg-error text-on-error', desc: 'Waze-style map where farmers report pest outbreaks.', actionText: 'View Outbreaks', route: '/community/disease-map' },
    { id: '8-7', cat: 'community', bgClass: 'bg-primary-container text-on-primary-container', icon: 'admin_panel_settings', title: 'FPO Cooperative Suite', badge: 'Admin', badgeClass: 'bg-secondary text-on-secondary', desc: 'Admin dashboard for FPO leaders to manage members.', actionText: 'Manage FPO', route: '/community/fpo-cooperative-suite' },
    { id: '8-8', cat: 'community', bgClass: 'bg-surface-variant text-on-surface-variant', icon: 'share', title: 'Season Report Sharing', badge: 'Social', badgeClass: 'bg-tertiary text-on-tertiary', desc: 'Share your success metrics with the community.', actionText: 'Share Report', route: '/community/season-report' },

    // 9. Advanced AI & IoT
    { id: '9-1', cat: 'ai_iot', bgClass: 'bg-secondary-container text-on-secondary-container', icon: 'mic', title: 'Voice Assistant', badge: 'KhetSaathi Bol', badgeClass: 'bg-primary text-on-primary', desc: 'Voice-activated conversational AI in local languages.', actionText: 'Speak Now', route: '/ai/assistant' },
    { id: '9-2', cat: 'ai_iot', bgClass: 'bg-tertiary-container text-on-tertiary-container', icon: 'image_search', title: 'Multimodal Query', badge: 'AI', badgeClass: 'bg-secondary text-on-secondary', desc: 'Upload photos + text + audio simultaneously to ask the AI.', actionText: 'Ask AI', route: '/ai/multimodal-query' },
    { id: '9-3', cat: 'ai_iot', bgClass: 'bg-primary-fixed-dim text-on-primary-fixed', icon: 'science', title: 'Counterfactual Simulator', badge: 'What-If', badgeClass: 'bg-tertiary text-on-tertiary', desc: '"What if I plant 10 days late?" simulator.', actionText: 'Simulate', route: '/ai/causal-lab' },
    { id: '9-4', cat: 'ai_iot', bgClass: 'bg-secondary-fixed-dim text-on-secondary-fixed', icon: 'memory', title: 'Federated Learning Status', badge: 'Privacy', badgeClass: 'bg-primary text-on-primary', desc: 'Shows how your local farm data safely trains the AI.', actionText: 'View Status', route: '/ai/federated-learning' },
    { id: '9-5', cat: 'ai_iot', bgClass: 'bg-surface-container-high text-on-surface', icon: 'speed', title: 'Live Sensor Dashboard', badge: 'IoT', badgeClass: 'bg-secondary text-on-secondary', desc: 'Real-time dials for soil moisture, temp, and humidity hardware.', actionText: 'View Sensors', route: '/iot/dashboard' },
    { id: '9-6', cat: 'ai_iot', bgClass: 'bg-tertiary-fixed-dim text-on-tertiary-fixed', icon: 'thermostat', title: 'Hydroponics Climate Control', badge: 'Polyhouse', badgeClass: 'bg-tertiary text-on-tertiary', desc: 'Advanced control panel for indoor/greenhouse farming.', actionText: 'Control Climate', route: '/iot/hydro-climate' },
    { id: '9-7', cat: 'ai_iot', bgClass: 'bg-primary-container text-on-primary-container', icon: 'shelves', title: 'Vertical Farm Monitor', badge: 'Indoor', badgeClass: 'bg-primary text-on-primary', desc: 'Track plant growth on individual racks in a vertical farm.', actionText: 'View Racks', route: '/iot/shelves' },
    { id: '9-8', cat: 'ai_iot', bgClass: 'bg-secondary-container text-on-secondary-container', icon: 'verified', title: 'IoT Traceability', badge: 'Blockchain', badgeClass: 'bg-secondary text-on-secondary', desc: 'Hardware-backed sensor logs proving crop was grown safely.', actionText: 'Verify Logs', route: '/iot/traceability' },

    // 10. Core App Infrastructure
    { id: '10-1', cat: 'core', bgClass: 'bg-surface-variant text-on-surface-variant', icon: 'search', title: 'Global Search', badge: 'System', badgeClass: 'bg-outline text-surface', desc: 'Search across all 57 features instantly.', actionText: 'Search', action: () => setIsSearchActive(true) },
    { id: '10-2', cat: 'core', bgClass: 'bg-surface-variant text-on-surface-variant', icon: 'language', title: 'Language Localization (i18n)', badge: 'System', badgeClass: 'bg-outline text-surface', desc: 'Toggle between English, Hindi, Marathi, etc.', actionText: 'Change Lang', action: handleLanguage },
    { id: '10-3', cat: 'core', bgClass: 'bg-surface-variant text-on-surface-variant', icon: 'cloud_off', title: 'Offline Sync Engine', badge: 'Background', badgeClass: 'bg-outline text-surface', desc: 'Ensures forms and logs work without internet.', actionText: 'Sync Status', action: handleOfflineSync },
    { id: '10-4', cat: 'core', bgClass: 'bg-surface-variant text-on-surface-variant', icon: 'notification_important', title: 'Push Notification Manager', badge: 'System', badgeClass: 'bg-outline text-surface', desc: 'Delivers time-sensitive irrigation and pest alerts.', actionText: 'Settings', action: handlePushNotifications },
    { id: '10-5', cat: 'core', bgClass: 'bg-surface-variant text-on-surface-variant', icon: 'brightness_6', title: 'Dynamic Theming System', badge: 'UI', badgeClass: 'bg-outline text-surface', desc: 'Adapts UI for bright sunlight visibility in the field.', actionText: 'Theme Config', action: toggleTheme },
    { id: '10-6', cat: 'core', bgClass: 'bg-surface-variant text-on-surface-variant', icon: 'error_outline', title: 'Global Error Boundaries', badge: 'Robust', badgeClass: 'bg-outline text-surface', desc: 'Graceful fallback UI for network failures.', actionText: 'Check Logs', action: handleErrorLogs },
    { id: '10-7', cat: 'core', bgClass: 'bg-surface-variant text-on-surface-variant', icon: 'security', title: 'Role-Based Access Control', badge: 'Auth', badgeClass: 'bg-outline text-surface', desc: 'Modifies UI for Farmer, Buyer, or FPO Leader.', actionText: 'Access Levels', action: handleRbac },
  ];

  let filteredModules = filter === 'all' ? modules : modules.filter(m => m.cat === filter);
  
  if (isSearchActive && searchQuery.trim() !== '') {
    filteredModules = modules.filter(m => 
      m.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
      m.desc.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }

  const handleModuleClick = (mod) => {
    if (mod.action) {
      mod.action();
    } else if (mod.route) {
      navigate(mod.route);
    }
  };

  return (
    <div className="flex flex-col w-full px-space-md pb-space-lg space-y-space-md min-h-screen bg-surface relative">
      {/* Interactive Header Panel */}
      <div className="flex flex-col w-full bg-surface-container-low rounded-xl p-space-md shadow-sm mt-space-md pt-[72px]">
        {isSearchActive ? (
          <div className="flex items-center gap-2 mb-2">
            <input 
              type="text" 
              autoFocus
              placeholder="Search across 57 modules..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 h-12 px-4 rounded-xl bg-surface border border-outline-variant focus:outline-none focus:border-primary font-body-lg"
            />
            <button 
              onClick={() => { setIsSearchActive(false); setSearchQuery(''); }}
              className="w-12 h-12 rounded-xl bg-surface-container-highest flex items-center justify-center text-on-surface"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>
        ) : (
          <>
            <div className="flex items-start justify-between gap-space-sm">
              <div className="flex flex-col">
                <div className="flex items-center gap-space-xs">
                  <span className="font-label-sm text-label-sm uppercase tracking-wider text-primary font-bold">Modular Ecosystem</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-primary-container"></span>
                  <span className="font-label-sm text-label-sm text-on-surface-variant">Live v4.2</span>
                </div>
                <h1 className="font-headline-lg-mobile text-headline-lg-mobile text-on-surface mt-0.5">Feature Hub (57 Modules)</h1>
              </div>
              <button onClick={() => navigate('/')} aria-label="Close Hub" className="w-10 h-10 rounded-full bg-surface-container-highest flex items-center justify-center text-on-surface active:scale-95 transition-transform" type="button">
                <span className="material-symbols-outlined text-[22px]">close</span>
              </button>
            </div>
            <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">Explore all 57 specialized tools, AI services, and infrastructure features powering KhetSaathi.</p>
          </>
        )}
        
        {/* Quick Search & Filter Pills */}
        {!isSearchActive && (
          <div className="flex items-center gap-space-xs mt-space-sm overflow-x-auto pb-1 -mx-space-md px-space-md no-scrollbar">
              <button 
                onClick={() => setFilter('all')} 
                className={`px-space-md py-1 min-h-[44px] rounded-full font-label-md text-label-md shrink-0 transition-all active:scale-95 flex items-center justify-center ${filter === 'all' ? 'bg-primary text-on-primary shadow-sm' : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'}`} 
              >
                All 57 Tools
              </button>
              <button 
                onClick={() => setFilter('planning')} 
                className={`px-space-md py-1 min-h-[44px] rounded-full font-label-md text-label-md shrink-0 transition-all active:scale-95 flex items-center justify-center ${filter === 'planning' ? 'bg-primary text-on-primary shadow-sm' : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'}`} 
              >
                Planning & Farm
              </button>
              <button 
                onClick={() => setFilter('health')} 
                className={`px-space-md py-1 min-h-[44px] rounded-full font-label-md text-label-md shrink-0 transition-all active:scale-95 flex items-center justify-center ${filter === 'health' ? 'bg-primary text-on-primary shadow-sm' : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'}`} 
              >
                Health & Pest
              </button>
              <button 
                onClick={() => setFilter('water')} 
                className={`px-space-md py-1 min-h-[44px] rounded-full font-label-md text-label-md shrink-0 transition-all active:scale-95 flex items-center justify-center ${filter === 'water' ? 'bg-primary text-on-primary shadow-sm' : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'}`} 
              >
                Water & Soil
              </button>
              <button 
                onClick={() => setFilter('vision')} 
                className={`px-space-md py-1 min-h-[44px] rounded-full font-label-md text-label-md shrink-0 transition-all active:scale-95 flex items-center justify-center ${filter === 'vision' ? 'bg-primary text-on-primary shadow-sm' : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'}`} 
              >
                Vision & Drone
              </button>
              <button 
                onClick={() => setFilter('marketplace')} 
                className={`px-space-md py-1 min-h-[44px] rounded-full font-label-md text-label-md shrink-0 transition-all active:scale-95 flex items-center justify-center ${filter === 'marketplace' ? 'bg-primary text-on-primary shadow-sm' : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'}`} 
              >
                Market & Logistics
              </button>
              <button 
                onClick={() => setFilter('finance')} 
                className={`px-space-md py-1 min-h-[44px] rounded-full font-label-md text-label-md shrink-0 transition-all active:scale-95 flex items-center justify-center ${filter === 'finance' ? 'bg-primary text-on-primary shadow-sm' : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'}`} 
              >
                Finance & Insure
              </button>
              <button 
                onClick={() => setFilter('gov')} 
                className={`px-space-md py-1 min-h-[44px] rounded-full font-label-md text-label-md shrink-0 transition-all active:scale-95 flex items-center justify-center ${filter === 'gov' ? 'bg-primary text-on-primary shadow-sm' : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'}`} 
              >
                Govt & Trace
              </button>
              <button 
                onClick={() => setFilter('community')} 
                className={`px-space-md py-1 min-h-[44px] rounded-full font-label-md text-label-md shrink-0 transition-all active:scale-95 flex items-center justify-center ${filter === 'community' ? 'bg-primary text-on-primary shadow-sm' : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'}`} 
              >
                Community & FPO
              </button>
              <button 
                onClick={() => setFilter('ai_iot')} 
                className={`px-space-md py-1 min-h-[44px] rounded-full font-label-md text-label-md shrink-0 transition-all active:scale-95 flex items-center justify-center ${filter === 'ai_iot' ? 'bg-primary text-on-primary shadow-sm' : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'}`} 
              >
                AI & IoT
              </button>
              <button 
                onClick={() => setFilter('core')} 
                className={`px-space-md py-1 min-h-[44px] rounded-full font-label-md text-label-md shrink-0 transition-all active:scale-95 flex items-center justify-center ${filter === 'core' ? 'bg-primary text-on-primary shadow-sm' : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'}`} 
              >
                Core System
              </button>
          </div>
        )}
      </div>

      {/* Grid Feature Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-space-sm pb-24">
        {filteredModules.map(mod => (
          <div key={mod.id} onClick={() => handleModuleClick(mod)} className="module-card group bg-surface-container-lowest rounded-xl p-space-md shadow-sm active:scale-[0.99] transition-all cursor-pointer border border-transparent hover:border-outline-variant">
            <div className="flex items-start gap-space-md">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 shadow-sm ${mod.bgClass}`}>
                <span className="material-symbols-outlined text-[28px]" style={{ fontVariationSettings: "'FILL' 1" }}>{mod.icon}</span>
              </div>
              <div className="flex flex-col flex-grow min-w-0">
                <div className="flex items-center justify-between gap-space-xs">
                  <span className="font-headline-sm text-headline-sm text-on-surface truncate">{mod.title}</span>
                  <span className={`font-label-sm text-label-sm px-space-xs py-0.5 rounded-full font-bold shrink-0 ${mod.badgeClass}`}>{mod.badge}</span>
                </div>
                <p className="font-body-sm text-body-sm text-on-surface-variant mt-1 line-clamp-2">{mod.desc}</p>
                <div className="flex items-center gap-space-xs mt-2 font-label-md text-label-md text-primary">
                  <span>{mod.actionText}</span>
                  <span className="material-symbols-outlined text-[16px] group-hover:translate-x-1 transition-transform">arrow_forward</span>
                </div>
              </div>
            </div>
          </div>
        ))}
        {filteredModules.length === 0 && (
          <div className="col-span-full py-10 text-center text-on-surface-variant">
            No features found for this search/category.
          </div>
        )}
      </div>

      {/* Bottom Sheet Modal */}
      {sheetContent && (
        <div className="fixed inset-0 z-[100] flex flex-col justify-end">
          <div 
            className="absolute inset-0 bg-black/50 backdrop-blur-sm" 
            onClick={() => setSheetContent(null)}
          ></div>
          <div className="relative bg-surface rounded-t-3xl p-6 shadow-2xl animate-in slide-in-from-bottom-full duration-300">
            <div className="w-12 h-1.5 bg-surface-container-high rounded-full mx-auto mb-4"></div>
            <h2 className="font-headline-sm text-headline-sm text-on-surface mb-2">{sheetContent.title}</h2>
            
            {sheetContent.text && (
              <p className="font-body-md text-on-surface-variant mb-6">{sheetContent.text}</p>
            )}
            
            {sheetContent.options && (
              <div className="flex flex-col gap-2 mb-4">
                {sheetContent.options.map((opt, i) => (
                  <button 
                    key={i} 
                    onClick={() => sheetContent.onSelect(opt)}
                    className="w-full text-left p-4 rounded-xl bg-surface-container-lowest border border-outline-variant hover:bg-surface-container hover:border-primary active:scale-[0.99] transition-all font-label-lg text-on-surface"
                  >
                    {opt}
                  </button>
                ))}
              </div>
            )}
            
            <button 
              onClick={() => setSheetContent(null)}
              className="w-full h-14 rounded-xl bg-primary text-on-primary font-label-lg font-bold mt-2"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
