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

  const [claimingId, setClaimingId] = useState(null);

  // Official government portal URLs for each scheme
  const SCHEME_PORTALS = {
    'pm-kisan': 'https://pmkisan.gov.in/',
    'pmfby': 'https://pmfby.gov.in/',
    'kcc': 'https://www.jansamarth.in/home',
    'pm-kusum': 'https://pmkusum.mnre.gov.in/',
    'rytabandhu': 'https://rythu.telangana.gov.in/',
    'rythu': 'https://rythu.telangana.gov.in/',
    'uzhavar': 'https://www.tn.gov.in/scheme/data_view/3577',
    'smam': 'https://agrimachinery.nic.in/',
    'mechaniz': 'https://agrimachinery.nic.in/',
    'sinchayee': 'https://pmksy.gov.in/',
    'pmksy': 'https://pmksy.gov.in/',
    'default': 'https://www.india.gov.in/spotlight/kisan-yojnas',
  };

  const getSchemePortalUrl = (schemeName) => {
    const lower = schemeName.toLowerCase();
    for (const [key, url] of Object.entries(SCHEME_PORTALS)) {
      if (key !== 'default' && lower.includes(key)) return url;
    }
    return SCHEME_PORTALS['default'];
  };

  const handleVerifyClaim = (scheme) => {
    setClaimingId(scheme.id);
    const url = getSchemePortalUrl(scheme.name);
    setTimeout(() => {
      window.open(url, '_blank', 'noopener,noreferrer');
      setClaimingId(null);
    }, 600);
  };

  const toggleAccordion = (id) => {
    setExpandedAccordions(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const renderScheme = (scheme) => {
    // Filter matching logic
    const nameLower = scheme.name.toLowerCase();
    const isDBT = nameLower.includes('pm-kisan') || nameLower.includes('samman nidhi');
    const isIrrigation = nameLower.includes('krishi sinchayee') || nameLower.includes('micro-irrigation') || nameLower.includes('pmksy');
    const isEquipment = nameLower.includes('mechanization') || nameLower.includes('smam');
    const isInsurance = nameLower.includes('fasal bima') || nameLower.includes('pmfby');
    
    if (filter === 'dbt' && !isDBT) return null;
    if (filter === 'irrigation' && !isIrrigation) return null;
    if (filter === 'equipment' && !isEquipment) return null;
    if (filter === 'insurance' && !isInsurance) return null;

    const isExpanded = expandedAccordions[scheme.id];
    
    // Assign icons and background images based on category
    let bgUrl = 'https://images.unsplash.com/photo-1625246333195-78d9c38ad449?q=80&w=1000&auto=format&fit=crop';
    let icon = 'verified';
    if (isIrrigation) {
        bgUrl = 'https://images.unsplash.com/photo-1590682680695-43b964a3ae17?q=80&w=1000&auto=format&fit=crop';
        icon = 'water_drop';
    } else if (isEquipment) {
        icon = 'agriculture';
    } else if (isInsurance) {
        icon = 'shield';
    }

    return (
      <article key={scheme.id} className="bg-surface-container-lowest rounded-xl shadow-sm overflow-hidden flex flex-col transition-all duration-200">
        <div 
          className="relative h-28 w-full bg-cover bg-center" 
          style={{ backgroundImage: `url('${bgUrl}')` }}
        >
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent"></div>
          <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-primary-fixed text-on-primary-fixed font-label-sm text-label-sm font-bold px-2.5 py-1 rounded-full shadow-sm">
            <span className="material-symbols-outlined text-[16px]">{icon}</span>
            <span>Matched</span>
          </div>
          <div className="absolute top-3 right-3 bg-surface-container-lowest/90 backdrop-blur-md rounded-full px-2 py-0.5 text-primary font-label-sm text-label-sm font-bold">
            {scheme.level === 'central' ? 'Central Scheme' : 'State Scheme'}
          </div>
          <div className="absolute bottom-2 left-3 right-3 text-on-primary">
            <h2 className="font-headline-sm text-headline-sm font-bold leading-tight truncate">
              {scheme.name}
            </h2>
          </div>
        </div>
        <div className="p-space-md flex flex-col space-y-3">
          <div className="flex items-baseline justify-between bg-primary/5 p-3 rounded-lg">
            <div>
              <span className="font-label-sm text-label-sm text-on-surface-variant">Benefit Amount</span>
              <div className="font-headline-md text-headline-md text-primary font-bold">
                ₹{scheme.benefit_amount?.toLocaleString('en-IN') || 0}
              </div>
            </div>
          </div>
          
          <div className="bg-surface-container-low rounded-lg p-3">
            <button 
              className="w-full flex items-center justify-between font-label-md text-label-md text-primary font-bold" 
              onClick={() => toggleAccordion(scheme.id)} 
              type="button"
            >
              <span className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[18px]">fact_check</span>
                Why am I eligible?
              </span>
              <span className="material-symbols-outlined text-[20px] transition-transform duration-200" style={{ transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)' }}>
                expand_more
              </span>
            </button>
            {isExpanded && scheme.criteria && (
              <div className="mt-2.5 space-y-2 pt-2 border-t border-surface-container font-body-sm text-body-sm">
                {Object.entries(scheme.criteria).map(([key, val], idx) => (
                  <div key={idx} className="flex items-start gap-2 text-on-surface">
                    <span className="material-symbols-outlined text-primary text-[18px] flex-shrink-0 mt-0.5">check_circle</span>
                    <span>Matched criteria: <strong>{key}</strong> ({val})</span>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <div className="flex items-center justify-between font-label-sm text-label-sm px-1 text-on-surface-variant">
            <span className="flex items-center gap-1">
              <span className="material-symbols-outlined text-[16px] text-tertiary">event</span>
              Deadline
            </span>
            <span className="font-bold text-on-surface">
              {scheme.deadline ? new Date(scheme.deadline).toLocaleDateString('en-GB') : 'Ongoing'}
            </span>
          </div>
          
          <button 
            onClick={() => handleVerifyClaim(scheme)}
            disabled={claimingId === scheme.id}
            className="w-full h-14 rounded-lg bg-secondary text-on-secondary font-label-md text-label-md font-bold flex items-center justify-center gap-1.5 shadow-sm hover:brightness-105 active:scale-[0.98] transition-all disabled:opacity-70" 
            type="button"
          >
            {claimingId === scheme.id ? (
              <>
                <span className="material-symbols-outlined text-[18px] animate-spin">progress_activity</span>
                <span>Opening Portal...</span>
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-[18px]">open_in_new</span>
                <span>Verify &amp; Claim on Gov Portal</span>
              </>
            )}
          </button>
        </div>
      </article>
    );
  };

  return (
    <div className="min-h-screen bg-surface text-on-surface flex flex-col pt-safe pb-safe relative">
      

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
                <span className="font-headline-sm text-headline-sm text-secondary font-bold">
                  ₹{(matchData?.eligible_schemes?.reduce((sum, s) => sum + (s.benefit_amount || 0), 0) || 0).toLocaleString('en-IN')}
                </span>
              </div>
              <div className="flex flex-col pl-3">
                <span className="font-label-sm text-label-sm text-on-surface-variant font-medium">Top Priority</span>
                <span className="font-headline-sm text-headline-sm text-primary font-bold">
                  {matchData?.eligible_schemes?.filter(s => s.deadline && (new Date(s.deadline) - new Date()) / (1000 * 60 * 60 * 24) <= 90).length || 0} High
                </span>
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
          {!loading && matchData && (matchData.eligible_schemes || []).map(renderScheme)}
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

      
    </div>
  );
}
