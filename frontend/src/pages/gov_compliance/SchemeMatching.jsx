import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { matchSchemes } from '../../api/govComplianceApi';

export default function SchemeMatching() {
  const navigate = useNavigate();
  const [filter, setFilter] = useState('all');
  const [matchData, setMatchData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [expandedAccordions, setExpandedAccordions] = useState({});

  useEffect(() => {
    const fetchMatches = async () => {
      try {
        const farmId = localStorage.getItem('farmId') || '00000000-0000-0000-0000-000000000000';
        const res = await matchSchemes(farmId);
        setMatchData(res.data);
      } catch (err) {
        console.error('Failed to match schemes:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchMatches();
  }, []);

  const toggleAccordion = (id) => {
    setExpandedAccordions(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const renderPMKisan = (scheme) => {
    if (filter !== 'all' && filter !== 'dbt') return null;
    const isExpanded = expandedAccordions['eligibility-pmkisan'];
    
    return (
      <article key={scheme.id} className="bg-surface-container-lowest rounded-xl shadow-sm overflow-hidden flex flex-col transition-all duration-200">
        <div 
          className="relative h-28 w-full bg-cover bg-center" 
          style={{ backgroundImage: "url('https://images.unsplash.com/photo-1625246333195-78d9c38ad449?q=80&w=1000&auto=format&fit=crop')" }}
        >
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent"></div>
          <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-primary-fixed text-on-primary-fixed font-label-sm text-label-sm font-bold px-2.5 py-1 rounded-full shadow-sm">
            <span className="material-symbols-outlined text-[16px]">verified</span>
            <span>Top Match • 98% Eligible</span>
          </div>
          <div className="absolute top-3 right-3 bg-surface-container-lowest/90 backdrop-blur-md rounded-full px-2 py-0.5 text-primary font-label-sm text-label-sm font-bold">
            {scheme.level === 'central' ? 'Central DBT' : 'State DBT'}
          </div>
          <div className="absolute bottom-2 left-3 right-3 text-on-primary">
            <p className="font-label-sm text-label-sm text-primary-fixed-dim uppercase tracking-wider font-semibold">
              Ministry of Agriculture &amp; Farmers Welfare
            </p>
            <h2 className="font-headline-sm text-headline-sm font-bold leading-tight">
              {scheme.name}
            </h2>
          </div>
        </div>
        <div className="p-space-md flex flex-col space-y-3">
          <div className="flex items-baseline justify-between bg-primary/5 p-3 rounded-lg">
            <div>
              <span className="font-label-sm text-label-sm text-on-surface-variant">Annual Entitlement</span>
              <div className="font-headline-md text-headline-md text-primary font-bold">₹{scheme.benefit_amount.toLocaleString('en-IN')} <span className="font-body-sm text-body-sm font-normal text-on-surface">/ Year</span></div>
            </div>
            <span className="font-label-sm text-label-sm bg-primary-container text-on-primary px-2.5 py-1 rounded-full font-medium">
              ₹2,000 / 4 Months
            </span>
          </div>
          <p className="font-body-sm text-body-sm text-on-surface-variant">
            Direct Cash Benefit credited directly into your verified bank account for Rabi input procurement.
          </p>
          <div className="bg-surface-container-low rounded-lg p-3">
            <button 
              className="w-full flex items-center justify-between font-label-md text-label-md text-primary font-bold" 
              onClick={() => toggleAccordion('eligibility-pmkisan')} 
              type="button"
            >
              <span className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[18px]">fact_check</span>
                Why am I eligible? (3 of 3 passed)
              </span>
              <span className="material-symbols-outlined text-[20px] transition-transform duration-200" style={{ transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)' }}>
                expand_more
              </span>
            </button>
            {isExpanded && (
              <div className="mt-2.5 space-y-2 pt-2 border-t-0 font-body-sm text-body-sm">
                <div className="flex items-start gap-2 text-on-surface">
                  <span className="material-symbols-outlined text-primary text-[18px] flex-shrink-0 mt-0.5">check_circle</span>
                  <span>Valid 7/12 Land Record uploaded (4.5 Ac conforms to &lt; 2 Hectare threshold)</span>
                </div>
                <div className="flex items-start gap-2 text-on-surface">
                  <span className="material-symbols-outlined text-primary text-[18px] flex-shrink-0 mt-0.5">check_circle</span>
                  <span>Aadhaar linked with SBI Account ••••4891</span>
                </div>
                <div className="flex items-start gap-2 text-on-surface">
                  <span className="material-symbols-outlined text-primary text-[18px] flex-shrink-0 mt-0.5">check_circle</span>
                  <span>Biometric eKYC verified via PM-Kisan Face Auth</span>
                </div>
              </div>
            )}
          </div>
          <div className="flex items-center justify-between font-label-sm text-label-sm px-1 text-on-surface-variant">
            <span className="flex items-center gap-1">
              <span className="material-symbols-outlined text-[16px] text-tertiary">event_repeat</span>
              17th Installment Cycle
            </span>
            <span className="font-bold text-on-surface">{new Date(scheme.deadline).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
          </div>
          <div className="grid grid-cols-2 gap-2 pt-1">
            <button className="h-14 rounded-lg bg-surface-container font-label-md text-label-md text-on-surface font-semibold flex items-center justify-center gap-1.5 hover:bg-surface-container-high active:scale-[0.98] transition-all" type="button">
              <span className="material-symbols-outlined text-[18px]">task_alt</span>
              Already Linked
            </button>
            <button className="h-14 rounded-lg bg-secondary text-on-secondary font-label-md text-label-md font-bold flex items-center justify-center gap-1.5 shadow-sm hover:brightness-105 active:scale-[0.98] transition-all" type="button">
              <span>Verify &amp; Claim</span>
              <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
            </button>
          </div>
        </div>
      </article>
    );
  };

  const renderPMKSY = (scheme) => {
    if (filter !== 'all' && filter !== 'irrigation') return null;
    const isExpanded = expandedAccordions['eligibility-pmksy'];
    
    return (
      <article key={scheme.id} className="bg-surface-container-lowest rounded-xl shadow-sm overflow-hidden flex flex-col transition-all duration-200">
        <div 
          className="relative h-28 w-full bg-cover bg-center" 
          style={{ backgroundImage: "url('https://images.unsplash.com/photo-1590682680695-43b964a3ae17?q=80&w=1000&auto=format&fit=crop')" }}
        >
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent"></div>
          <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-primary text-on-primary font-label-sm text-label-sm font-bold px-2.5 py-1 rounded-full shadow-sm">
            <span className="material-symbols-outlined text-[16px]">water_drop</span>
            <span>94% Match • High Priority</span>
          </div>
          <div className="absolute top-3 right-3 bg-secondary-container text-on-secondary font-label-sm text-label-sm font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
            <span className="material-symbols-outlined text-[14px]">hourglass_top</span>
            <span>Closes in 4 days</span>
          </div>
          <div className="absolute bottom-2 left-3 right-3 text-on-primary">
            <p className="font-label-sm text-label-sm text-primary-fixed-dim uppercase tracking-wider font-semibold">
              Maharashtra Dept of Agriculture
            </p>
            <h2 className="font-headline-sm text-headline-sm font-bold leading-tight">
              {scheme.name}
            </h2>
          </div>
        </div>
        <div className="p-space-md flex flex-col space-y-3">
          <div className="flex items-baseline justify-between bg-primary/5 p-3 rounded-lg">
            <div>
              <span className="font-label-sm text-label-sm text-on-surface-variant">Drip Subsidy for Plot 1</span>
              <div className="font-headline-md text-headline-md text-secondary font-bold">55% Off <span className="font-body-sm text-body-sm font-normal text-on-surface">(₹145,000 saving)</span></div>
            </div>
            <span className="font-label-sm text-label-sm bg-surface-container text-primary font-bold px-2.5 py-1 rounded-full">
              Drip Line Unit
            </span>
          </div>
          <p className="font-body-sm text-body-sm text-on-surface-variant">
            Subsidized micro-drip kits and filters to mitigate Rabi dry spells on your 4.5 Ac plot.
          </p>
          <div className="bg-surface-container-low rounded-lg p-3">
            <button 
              className="w-full flex items-center justify-between font-label-md text-label-md text-primary font-bold" 
              onClick={() => toggleAccordion('eligibility-pmksy')} 
              type="button"
            >
              <span className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[18px]">verified_user</span>
                Why am I eligible? (Action needed)
              </span>
              <span className="material-symbols-outlined text-[20px] transition-transform duration-200" style={{ transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)' }}>
                expand_more
              </span>
            </button>
            {isExpanded && (
              <div className="mt-2.5 space-y-2 pt-2 border-t-0 font-body-sm text-body-sm">
                <div className="flex items-start gap-2 text-on-surface">
                  <span className="material-symbols-outlined text-primary text-[18px] flex-shrink-0 mt-0.5">check_circle</span>
                  <span>Plot 1 flagged as water-stress zone in Sentinel satellite pass</span>
                </div>
                <div className="flex items-start gap-2 text-on-surface">
                  <span className="material-symbols-outlined text-primary text-[18px] flex-shrink-0 mt-0.5">check_circle</span>
                  <span>Land parcel has operational borewell with electricity meter</span>
                </div>
                <div className="flex items-start gap-2 text-on-secondary-container bg-secondary-fixed/40 p-2 rounded-md">
                  <span className="material-symbols-outlined text-secondary text-[18px] flex-shrink-0 mt-0.5">warning</span>
                  <div className="flex flex-col">
                    <span className="font-bold text-on-surface">Pending: Official Vendor Quotation</span>
                    <span className="font-label-sm text-label-sm text-on-surface-variant">Tap below to auto-fetch a quote from pre-approved KhetSaathi vendors.</span>
                  </div>
                </div>
              </div>
            )}
          </div>
          <button className="w-full h-14 rounded-lg bg-secondary text-on-secondary font-label-lg text-label-lg font-bold flex items-center justify-center gap-2 shadow-sm hover:brightness-105 active:scale-[0.98] transition-all" type="button">
            <span>Apply Now (Drip Subsidy)</span>
            <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
          </button>
        </div>
      </article>
    );
  };

  const renderSMAM = (scheme) => {
    if (filter !== 'all' && filter !== 'equipment') return null;
    return (
      <article key={scheme.id} className="bg-surface-container-lowest rounded-xl shadow-sm overflow-hidden flex flex-col transition-all duration-200">
        <div className="p-space-md flex flex-col space-y-3">
          <div className="flex items-start justify-between">
            <div className="flex-1 pr-2">
              <div className="inline-flex items-center gap-1 bg-tertiary-container text-on-tertiary-container px-2 py-0.5 rounded-full font-label-sm text-label-sm font-bold mb-1">
                <span className="material-symbols-outlined text-[14px]">star</span>
                <span>88% Match</span>
              </div>
              <h2 className="font-headline-sm text-headline-sm font-bold text-on-surface leading-snug">
                {scheme.name}
              </h2>
              <p className="font-label-sm text-label-sm text-outline font-medium">Central Sector Scheme • Custom Hiring</p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-surface-container-low flex items-center justify-center text-primary flex-shrink-0">
              <span className="material-symbols-outlined text-[28px]">handyman</span>
            </div>
          </div>
          <div className="bg-surface-container-low p-3 rounded-lg flex items-center justify-between">
            <div>
              <span className="font-label-sm text-label-sm text-on-surface-variant">Harvester &amp; Rotavator</span>
              <div className="font-headline-sm text-headline-sm text-primary font-bold">40% Subsidy</div>
            </div>
            <div className="text-right">
              <span className="font-label-sm text-label-sm text-on-surface-variant">Max Cap</span>
              <div className="font-label-lg text-label-lg text-secondary font-bold">Up to ₹11,25,000</div>
            </div>
          </div>
          <div className="flex flex-wrap gap-1.5 pt-1">
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full font-label-sm text-label-sm bg-surface-container text-on-surface font-medium">
              <span className="material-symbols-outlined text-primary text-[14px]">check</span> Small Farmer (SF/MF)
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full font-label-sm text-label-sm bg-surface-container text-on-surface font-medium">
              <span className="material-symbols-outlined text-primary text-[14px]">check</span> Nashik Kisan FPO Linked
            </span>
          </div>
          <button className="w-full h-12 rounded-lg bg-surface-container-low text-primary font-label-md text-label-md font-bold flex items-center justify-center gap-1.5 hover:bg-surface-container active:scale-[0.98] transition-all" type="button">
            <span>Check Eligibility &amp; Apply</span>
            <span className="material-symbols-outlined text-[18px]">launch</span>
          </button>
        </div>
      </article>
    );
  };

  const renderPMFBY = (scheme) => {
    if (filter !== 'all' && filter !== 'insurance') return null;
    return (
      <article key={scheme.id} className="bg-surface-container-lowest rounded-xl shadow-sm overflow-hidden flex flex-col transition-all duration-200">
        <div className="p-space-md flex flex-col space-y-3">
          <div className="flex items-start justify-between">
            <div className="flex-1 pr-2">
              <div className="inline-flex items-center gap-1 bg-surface-container text-on-surface-variant px-2 py-0.5 rounded-full font-label-sm text-label-sm font-bold mb-1">
                <span className="material-symbols-outlined text-[14px]">shield</span>
                <span>82% Match</span>
              </div>
              <h2 className="font-headline-sm text-headline-sm font-bold text-on-surface leading-snug">
                {scheme.name}
              </h2>
              <p className="font-label-sm text-label-sm text-outline font-medium">National Crop Insurance • Rabi Season</p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
              <span className="material-symbols-outlined text-[28px]">health_and_safety</span>
            </div>
          </div>
          <div className="p-3 bg-surface-container-low rounded-lg flex items-center justify-between">
            <div>
              <span className="font-label-sm text-label-sm text-on-surface-variant">Subsidized Premium</span>
              <div className="font-headline-sm text-headline-sm text-on-surface font-bold">1.5% Premium</div>
            </div>
            <div className="text-right">
              <span className="font-label-sm text-label-sm text-on-surface-variant">Your Share (4.5 Ac Wheat)</span>
              <div className="font-label-lg text-label-lg text-primary font-bold">₹11,120 Total</div>
            </div>
          </div>
          <p className="font-body-sm text-body-sm text-on-surface-variant">
            Complete weather-index coverage against unseasonal hail, localized waterlogging, and post-harvest grain losses.
          </p>
          <button className="w-full h-12 rounded-lg bg-primary text-on-primary font-label-md text-label-md font-bold flex items-center justify-center gap-1.5 hover:bg-primary-container active:scale-[0.98] transition-all" type="button">
            <span className="material-symbols-outlined text-[18px]">add_moderator</span>
            <span>Enroll Crop Insurance</span>
          </button>
        </div>
      </article>
    );
  };

  const renderScheme = (scheme) => {
    const nameLower = scheme.name.toLowerCase();
    if (nameLower.includes('pm-kisan') || nameLower.includes('samman nidhi')) {
      return renderPMKisan(scheme);
    }
    if (nameLower.includes('krishi sinchayee') || nameLower.includes('micro-irrigation') || nameLower.includes('pmksy')) {
      return renderPMKSY(scheme);
    }
    if (nameLower.includes('mechanization') || nameLower.includes('smam')) {
      return renderSMAM(scheme);
    }
    if (nameLower.includes('fasal bima') || nameLower.includes('pmfby')) {
      return renderPMFBY(scheme);
    }
    
    // Fallback generic card if a new scheme is added by backend
    return (
      <article key={scheme.id} className="bg-surface-container-lowest rounded-xl shadow-sm overflow-hidden flex flex-col p-space-md space-y-3">
        <div className="flex items-start justify-between">
          <div className="flex-1 pr-2">
            <h2 className="font-headline-sm text-headline-sm font-bold text-on-surface leading-snug">
              {scheme.name}
            </h2>
          </div>
        </div>
        <p className="font-body-sm text-body-sm text-on-surface-variant">
          Benefit Amount: ₹{scheme.benefit_amount.toLocaleString('en-IN')}
        </p>
      </article>
    );
  };

  return (
    <div className="min-h-screen bg-surface text-on-surface flex flex-col pt-safe pb-safe relative">
      <header className="fixed top-0 w-full z-50 bg-surface/90 backdrop-blur-xl border-b border-surface-container/50 shadow-sm pt-safe">
        <div className="flex items-center justify-between h-16 px-margin">
          <div className="flex items-center gap-space-sm">
            <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-on-primary shadow-sm overflow-hidden">
              <span className="font-label-lg text-label-lg font-bold">RS</span>
            </div>
            <div className="flex flex-col">
              <h1 className="font-headline-sm text-headline-sm font-bold text-on-surface truncate">Govt Schemes</h1>
              <span className="font-label-sm text-label-sm text-on-surface-variant flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px] text-primary">my_location</span>
                Nashik, Maharashtra
              </span>
            </div>
          </div>
          <button className="w-10 h-10 flex items-center justify-center rounded-full text-on-surface-variant active:bg-surface-container-high transition-colors relative" type="button">
            <span className="material-symbols-outlined text-[24px]">notifications</span>
            <span className="absolute top-2 right-2 w-2 h-2 bg-error rounded-full"></span>
          </button>
        </div>
      </header>

      <main className="flex flex-col w-full pt-20 pb-24 px-margin bg-surface flex-1 gap-space-md">
        
        <div className="bg-surface-container-lowest rounded-xl shadow-sm overflow-hidden">
          <div className="bg-primary/10 p-space-md flex items-start gap-space-sm">
            <span className="material-symbols-outlined text-primary text-[28px] mt-0.5">verified_user</span>
            <div className="flex flex-col">
              <h2 className="font-label-lg text-label-lg font-bold text-on-surface">Auto-Eligibility Engine Active</h2>
              <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">
                Scanning your land records, harvest data, and Aadhar profile against 140+ central and state schemes.
              </p>
            </div>
          </div>
          <div className="bg-surface-container-lowest p-space-md grid grid-cols-3 gap-2 divide-x divide-surface-container-high">
            <div className="flex flex-col">
              <span className="font-label-sm text-label-sm text-on-surface-variant font-medium">Matched</span>
              <span className="font-headline-sm text-headline-sm text-primary font-bold">{matchData?.eligible_schemes?.length || 0} Schemes</span>
            </div>
            <div className="flex flex-col pl-3">
              <span className="font-label-sm text-label-sm text-on-surface-variant font-medium">Est. Value</span>
              <span className="font-headline-sm text-headline-sm text-secondary font-bold">₹11,85,000</span>
            </div>
            <div className="flex flex-col pl-3">
              <span className="font-label-sm text-label-sm text-on-surface-variant font-medium">Top Priority</span>
              <span className="font-headline-sm text-headline-sm text-primary font-bold">3 High</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1 -mx-margin px-margin">
          <button 
            onClick={() => setFilter('all')} 
            className={`scheme-filter-btn px-4 py-2 rounded-full font-label-md text-label-md whitespace-nowrap shadow-sm flex items-center gap-1.5 transition-colors ${filter === 'all' ? 'bg-primary text-on-primary' : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container'}`}
          >
            <span>All Matches</span>
            <span className="w-5 h-5 rounded-full bg-surface-container-lowest/20 flex items-center justify-center font-label-sm text-label-sm font-bold">
              {matchData?.eligible_schemes?.length || 0}
            </span>
          </button>
          <button 
            onClick={() => setFilter('dbt')} 
            className={`scheme-filter-btn px-4 py-2 rounded-full font-label-md text-label-md whitespace-nowrap shadow-sm flex items-center gap-1 transition-colors ${filter === 'dbt' ? 'bg-primary text-on-primary' : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container'}`}
          >
            <span className="material-symbols-outlined text-[18px]">account_balance</span>
            <span>Direct Income (DBT)</span>
          </button>
          <button 
            onClick={() => setFilter('irrigation')} 
            className={`scheme-filter-btn px-4 py-2 rounded-full font-label-md text-label-md whitespace-nowrap shadow-sm flex items-center gap-1 transition-colors ${filter === 'irrigation' ? 'bg-primary text-on-primary' : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container'}`}
          >
            <span className="material-symbols-outlined text-[18px]">water_drop</span>
            <span>Solar &amp; Irrigation</span>
          </button>
          <button 
            onClick={() => setFilter('equipment')} 
            className={`scheme-filter-btn px-4 py-2 rounded-full font-label-md text-label-md whitespace-nowrap shadow-sm flex items-center gap-1 transition-colors ${filter === 'equipment' ? 'bg-primary text-on-primary' : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container'}`}
          >
            <span className="material-symbols-outlined text-[18px]">agriculture</span>
            <span>Equipment Subsidy</span>
          </button>
          <button 
            onClick={() => setFilter('insurance')} 
            className={`scheme-filter-btn px-4 py-2 rounded-full font-label-md text-label-md whitespace-nowrap shadow-sm flex items-center gap-1 transition-colors ${filter === 'insurance' ? 'bg-primary text-on-primary' : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container'}`}
          >
            <span className="material-symbols-outlined text-[18px]">security</span>
            <span>Crop Insurance</span>
          </button>
        </div>

        <div className="space-y-space-md">
          {loading && <div className="text-center p-4">Loading schemes...</div>}
          {!loading && matchData && matchData.eligible_schemes.map(renderScheme)}
        </div>

        <div className="bg-surface-container-low rounded-xl p-space-md mt-2 flex flex-col space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-secondary-fixed text-on-secondary-fixed flex items-center justify-center flex-shrink-0">
              <span className="material-symbols-outlined text-[22px]">support_agent</span>
            </div>
            <div>
              <h3 className="font-headline-sm text-headline-sm font-bold text-on-surface">Need Help Applying?</h3>
              <p className="font-body-sm text-body-sm text-on-surface-variant">Visit your local village kiosk or speak with an agronomist.</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 pt-1">
            <a className="h-12 px-3 rounded-lg bg-surface-container-lowest text-primary font-label-sm text-label-sm font-bold flex items-center justify-center gap-1.5 shadow-sm active:scale-[0.98] transition-all" href="tel:18001801551">
              <span className="material-symbols-outlined text-[18px] text-secondary">call</span>
              <span>Kisan Mitra (Toll-Free)</span>
            </a>
            <button className="h-12 px-3 rounded-lg bg-surface-container-lowest text-on-surface font-label-sm text-label-sm font-bold flex items-center justify-center gap-1.5 shadow-sm active:scale-[0.98] transition-all" type="button">
              <span className="material-symbols-outlined text-[18px] text-primary">store</span>
              <span>Find CSC Kiosk</span>
            </button>
          </div>
        </div>
      </main>

      <nav className="fixed bottom-0 inset-x-0 z-50 pb-safe bg-surface/90 backdrop-blur-xl shadow-[0_-2px_12px_rgba(0,0,0,0.04)]">
        <div className="flex justify-around items-center h-20 px-space-xs max-w-md mx-auto">
          {[
            { icon: 'home', label: 'Home', path: '/app' },
            { icon: 'calendar_month', label: 'Plan', path: '/planning/crop-plan' },
            { icon: 'storefront', label: 'Market', path: '/marketplace/inputs' },
            { icon: 'assured_workload', label: 'Schemes', path: '/gov/schemes', active: true },
            { icon: 'badge', label: 'Profile', path: '/profile/settings' },
          ].map(nav => (
            <button key={nav.label} onClick={() => navigate(nav.path)} className={`flex flex-col items-center justify-center gap-1 min-w-[56px] h-14 transition-colors ${nav.active ? 'text-primary font-bold' : 'text-on-surface-variant hover:text-on-surface'}`} type="button">
              <span className="material-symbols-outlined text-[24px]">{nav.icon}</span>
              <span className="font-label-sm text-label-sm font-medium">{nav.label}</span>
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
}
