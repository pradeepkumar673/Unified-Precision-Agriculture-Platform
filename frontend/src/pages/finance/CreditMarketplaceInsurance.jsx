import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { applyLoan, fileInsuranceClaim, getCreditProfile, getInsuranceProfile } from '../../api/financeApi';

export default function CreditMarketplaceInsurance() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('credit');
  const [isApplying, setIsApplying] = useState(false);
  const [isFiling, setIsFiling] = useState(false);
  const [creditProfile, setCreditProfile] = useState(null);
  const [insuranceProfile, setInsuranceProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        const farmId = localStorage.getItem('farmId') || '00000000-0000-0000-0000-000000000000';
        const [creditRes, insuranceRes] = await Promise.all([
          getCreditProfile(farmId).catch(() => ({data: null})),
          getInsuranceProfile(farmId).catch(() => ({data: null}))
        ]);
        if (creditRes.data) setCreditProfile(creditRes.data);
        if (insuranceRes.data) setInsuranceProfile(insuranceRes.data);
      } catch (err) {
        console.error('Failed to load profiles', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleApplyLoan = async (amount) => {
    if (isApplying) return;
    setIsApplying(true);
    try {
      const farmId = localStorage.getItem('farmId') || '00000000-0000-0000-0000-000000000000';
      await applyLoan({ farm_id: farmId, amount });
      alert('Loan application submitted successfully!');
    } catch (err) {
      console.error('Failed to apply loan', err);
      alert('Failed to submit loan application.');
    } finally {
      setIsApplying(false);
    }
  };

  const handleFileClaim = async () => {
    if (isFiling) return;
    if (!insuranceProfile?.active_policy?.policy_id) {
      alert('No active policy found to claim against.');
      return;
    }
    setIsFiling(true);
    try {
      const farmId = localStorage.getItem('farmId') || '00000000-0000-0000-0000-000000000000';
      await fileInsuranceClaim({
        farm_id: farmId,
        policy_id: insuranceProfile.active_policy.policy_id,
        loss_event_date: new Date().toISOString().split('T')[0],
        photo_paths: [`/mock/gps/evidence_${Date.now()}.jpg`]
      });
      alert('Claim filed successfully!');
      
      // Refresh insurance profile to see the new claim
      const res = await getInsuranceProfile(farmId);
      if (res.data) setInsuranceProfile(res.data);
    } catch (err) {
      console.error('Failed to file claim', err);
      alert('Failed to file claim.');
    } finally {
      setIsFiling(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center pt-[64px]">
        <span className="material-symbols-outlined animate-spin text-primary text-[32px]">progress_activity</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface text-on-surface flex flex-col relative">
      

      <main className="flex flex-col w-full pt-[64px] pb-24 px-margin bg-surface flex-1 gap-space-md">
        
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-1">
            <span className="material-symbols-outlined text-primary text-[16px]">account_balance</span>
            <span className="font-label-sm text-label-sm font-bold text-primary tracking-wide uppercase">
              NABARD &amp; RBI Approved
            </span>
          </div>
          <h1 className="font-headline-lg-mobile text-headline-lg-mobile text-on-surface">Agri-Credit &amp; Crop Insurance</h1>
          <p className="font-body-md text-body-md text-on-surface-variant">Institutional credit linked directly to your land records, harvest records, and satellite telemetry.</p>
        </div>

        <div className="flex p-1 bg-surface-container rounded-xl gap-1">
          <button 
            className={`flex-1 py-3 px-space-sm rounded-lg font-label-md text-label-md flex items-center justify-center gap-2 transition-all ${activeTab === 'credit' ? 'bg-surface shadow-sm text-primary' : 'text-on-surface-variant'}`} 
            onClick={() => setActiveTab('credit')}
          >
            <span className="material-symbols-outlined text-[18px]">credit_score</span>
            <span>Credit &amp; Loans</span>
          </button>
          <button 
            className={`flex-1 py-3 px-space-sm rounded-lg font-label-md text-label-md flex items-center justify-center gap-2 transition-all ${activeTab === 'insurance' ? 'bg-surface shadow-sm text-primary' : 'text-on-surface-variant'}`} 
            onClick={() => setActiveTab('insurance')}
          >
            <span className="material-symbols-outlined text-[18px]">shield</span>
            <span>PMFBY &amp; Claims</span>
          </button>
        </div>

        {activeTab === 'credit' && (
          <div className="flex flex-col gap-space-lg animate-fade-in" id="panel-credit">
            
              <div className="bg-surface-container-low p-space-md rounded-xl shadow-sm flex flex-col gap-space-md">
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-label-sm text-label-sm text-on-surface-variant uppercase">Kisan Digital Score</span>
                  <div className="flex items-baseline gap-2">
                    <span className="font-headline-lg text-headline-lg text-primary font-bold">
                      {creditProfile ? creditProfile.credit_score : '...'}
                    </span>
                    <span className="font-label-sm text-label-sm text-on-surface-variant">/ 900</span>
                  </div>
                </div>
                <div className="bg-primary-fixed px-3 py-1.5 rounded-full flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
                  <span className="font-label-sm text-label-sm text-on-primary-fixed font-bold">
                    {creditProfile && creditProfile.credit_score >= 700 ? 'Tier-1 Pre-Approved' : 'Evaluating...'}
                  </span>
                </div>
              </div>
              
              <div className="relative flex flex-col items-center justify-center py-2">
                <svg className="w-48 h-24 overflow-visible" viewBox="0 0 160 85">
                  <path className="text-surface-container-highest" d="M 20 80 A 60 60 0 0 1 140 80" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="14"></path>
                  <path className="text-primary" d="M 20 80 A 60 60 0 0 1 140 80" fill="none" stroke="currentColor" strokeDasharray="188.5" strokeDashoffset={creditProfile ? 188.5 - (188.5 * (Math.max(0, creditProfile.credit_score - 300) / 600)) : 188.5} strokeLinecap="round" strokeWidth="14"></path>
                </svg>
                <div className="flex justify-between w-48 px-1 text-on-surface-variant font-label-sm text-label-sm mt-1">
                  <span>300 (Fair)</span>
                  <span>650</span>
                  <span className="text-primary font-bold">900 (Excellent)</span>
                </div>
              </div>
              
              <p className="font-body-sm text-body-sm text-on-surface-variant">
                Score updated dynamically via AI risk assessment of your climate, harvest logs, and transactions.
              </p>
              
              <div className="flex flex-col gap-2 pt-1">
                <span className="font-label-sm text-label-sm text-on-surface-variant">Top Contributing Boosters</span>
                <div className="flex flex-col gap-2">
                  {creditProfile?.top_factors?.map((factor, idx) => (
                    <div key={idx} className="flex items-center justify-between bg-surface p-2.5 rounded-lg shadow-sm">
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary text-[20px]">verified</span>
                        <span className="font-label-sm text-label-sm text-on-surface">{factor.factor}</span>
                      </div>
                      <span className="font-label-sm text-label-sm text-primary font-bold">+{factor.impact} pts</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-space-md">
              <div className="flex items-center justify-between">
                <h2 className="font-headline-sm text-headline-sm text-on-surface">Curated Institutional Loans</h2>
                <span className="bg-secondary-fixed text-on-secondary-fixed font-label-sm text-label-sm px-2.5 py-0.5 rounded-full font-bold">
                  {creditProfile?.offers?.length || 0} Available
                </span>
              </div>
              
              {creditProfile?.offers?.map((offer, idx) => (
                <div key={idx} className="bg-surface-container-low p-space-md rounded-xl shadow-sm flex flex-col gap-space-sm relative overflow-hidden">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex flex-col">
                      {idx === 0 && <span className="font-label-sm text-label-sm text-secondary font-bold uppercase">Top Recommended Offer</span>}
                      <span className="font-headline-sm text-headline-sm text-on-surface font-bold">{offer.title}</span>
                      <span className="font-label-sm text-label-sm text-on-surface-variant">{offer.lender} • {offer.subtitle}</span>
                    </div>
                    <span className="material-symbols-outlined text-primary text-[26px]">
                      {offer.lender.includes("SBI") ? "account_balance" : offer.lender.includes("NABARD") ? "solar_power" : "agriculture"}
                    </span>
                  </div>
                  <div className="flex items-baseline gap-2 py-1">
                    <span className="font-headline-lg-mobile text-headline-lg-mobile text-primary font-bold">₹{(offer.max_amount).toLocaleString()}</span>
                    <span className="font-label-sm text-label-sm text-on-surface-variant">Pre-Approved Limit</span>
                  </div>
                  
                  {idx === 0 ? (
                    <div className="grid grid-cols-3 gap-2 bg-surface p-2.5 rounded-lg">
                      <div className="flex flex-col">
                        <span className="font-label-sm text-label-sm text-on-surface-variant">Interest</span>
                        <span className="font-label-md text-label-md text-primary font-bold">{offer.interest_rate}% p.a.</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="font-label-sm text-label-sm text-on-surface-variant">Tenure</span>
                        <span className="font-label-md text-label-md text-on-surface font-semibold">{offer.tenure_months} Mos</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="font-label-sm text-label-sm text-on-surface-variant">Processing</span>
                        <span className="font-label-md text-label-md text-on-surface font-semibold">₹{offer.processing_fee} Fee</span>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-baseline gap-2">
                      <span className="font-label-sm text-label-sm text-on-surface-variant">@ {offer.interest_rate}% p.a. • {Math.round(offer.tenure_months/12)} Years Term</span>
                    </div>
                  )}

                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {offer.benefits.map((b, i) => (
                       <span key={i} className="bg-surface-container-high text-on-surface-variant font-label-sm text-label-sm px-2 py-0.5 rounded">{b}</span>
                    ))}
                  </div>
                  <button 
                    disabled={isApplying}
                    onClick={() => handleApplyLoan(offer.max_amount)}
                    className={`w-full mt-2 h-12 rounded-lg font-label-lg text-label-lg flex items-center justify-center gap-2 transition-all ${idx === 0 ? 'bg-secondary-container text-on-secondary shadow-sm' : 'bg-surface text-primary shadow-sm active:bg-surface-container'} disabled:opacity-70`}
                  >
                    <span>{isApplying ? 'Applying...' : idx === 0 ? 'Apply in 2 Mins' : 'Check Eligibility'}</span>
                    {!isApplying && <span className="material-symbols-outlined text-[18px]">chevron_right</span>}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'insurance' && (
          <div className="flex flex-col gap-space-lg animate-fade-in" id="panel-insurance">
            
            <div className="bg-surface-container-low p-space-md rounded-xl shadow-sm flex flex-col gap-space-sm relative">
              <div className="flex items-center justify-between">
                <span className="font-label-sm text-label-sm text-primary font-bold uppercase tracking-wide">Government Backed Policy</span>
                <span className="inline-flex items-center gap-1 bg-primary-container text-on-primary-container px-2.5 py-0.5 rounded-full font-label-sm text-label-sm font-semibold">
                  <span className="material-symbols-outlined text-[14px]">check_circle</span> Active Protection
                </span>
              </div>
              
              {insuranceProfile?.active_policy && (
                <>
                  <div>
                    <h2 className="font-headline-sm text-headline-sm text-on-surface font-bold">{insuranceProfile.active_policy.name}</h2>
                    <p className="font-label-sm text-label-sm text-on-surface-variant">Policy #{insuranceProfile.active_policy.policy_id} • {insuranceProfile.active_policy.crop_details}</p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 bg-surface p-3 rounded-lg mt-1">
                    <div className="flex flex-col">
                      <span className="font-label-sm text-label-sm text-on-surface-variant">Sum Insured</span>
                      <span className="font-headline-sm text-headline-sm text-primary font-bold">₹{insuranceProfile.active_policy.sum_insured.toLocaleString()}</span>
                      <span className="font-label-sm text-label-sm text-on-surface-variant">₹{insuranceProfile.active_policy.sum_insured_per_acre.toLocaleString()} / Acre</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="font-label-sm text-label-sm text-on-surface-variant">Farmer Share Paid</span>
                      <span className="font-headline-sm text-headline-sm text-on-surface font-bold">₹{insuranceProfile.active_policy.farmer_share_paid.toLocaleString()}</span>
                      <span className="font-label-sm text-label-sm text-secondary font-semibold">{insuranceProfile.active_policy.farmer_share_percent}% Tariff</span>
                    </div>
                  </div>
                  
                  <div className="flex flex-col gap-1.5 pt-1">
                    <span className="font-label-sm text-label-sm text-on-surface-variant">Coverage Inclusions:</span>
                    <div className="flex flex-wrap gap-1.5">
                      {insuranceProfile.active_policy.coverage_inclusions.map((inc, i) => (
                        <span key={i} className="bg-surface-container-high text-on-surface-variant font-label-sm text-label-sm px-2 py-0.5 rounded flex items-center gap-1">
                          <span className="material-symbols-outlined text-[14px] text-primary">{inc.includes('Rain') ? 'rainy' : inc.includes('Pest') || inc.includes('Epidemic') ? 'pest_control' : 'sunny'}</span> {inc}
                        </span>
                      ))}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 pt-2 text-on-surface-variant font-label-sm text-label-sm">
                    <span className="material-symbols-outlined text-[16px] text-primary">event_available</span>
                    <span>Valid until {new Date(insuranceProfile.active_policy.valid_until).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })} • Auto-renewal through KCC</span>
                  </div>
                </>
              )}
            </div>

            <div className="bg-surface-container-low p-space-md rounded-xl shadow-sm flex flex-col gap-space-sm">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-secondary-fixed flex items-center justify-center text-on-secondary-fixed flex-shrink-0">
                  <span className="material-symbols-outlined text-[22px]">warning</span>
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="font-headline-sm text-headline-sm text-on-surface">Crop In Distress?</span>
                  <span className="font-label-sm text-label-sm text-on-surface-variant">Submit photo proof within 72 hrs of incident</span>
                </div>
              </div>
              <p className="font-body-sm text-body-sm text-on-surface-variant">
                Our automated satellite telemetry cross-references field weather station alerts to expedite your PMFBY claim disbursal directly to your account.
              </p>
              <button 
                disabled={isFiling}
                onClick={handleFileClaim}
                className="w-full h-14 bg-secondary-container text-on-secondary rounded-lg font-label-lg text-label-lg flex items-center justify-center gap-2 active:opacity-95 shadow-sm disabled:opacity-70"
              >
                <span className="material-symbols-outlined text-[22px]">add_a_photo</span>
                <span>{isFiling ? 'Filing Claim...' : 'File Claim with GPS Evidence'}</span>
              </button>
            </div>

            <div className="flex flex-col gap-space-sm">
              <h3 className="font-headline-sm text-headline-sm text-on-surface">Claims Track Record</h3>
              
              <div className="flex flex-col gap-2 mt-1">
                {!insuranceProfile?.claims || insuranceProfile?.claims?.length === 0 ? (
                  <div className="p-4 text-center bg-surface-container-low rounded-lg text-on-surface-variant font-label-md">
                    No past claims. Your farm is healthy!
                  </div>
                ) : (
                  insuranceProfile?.claims?.map((claim, idx) => (
                    <div key={idx} className="bg-surface-container-low p-space-md rounded-xl shadow-sm flex flex-col gap-2">
                      <div className="flex items-start justify-between">
                        <div className="flex flex-col">
                          <span className="font-label-md text-label-md text-on-surface font-bold">Claim #{claim.id.substring(0, 8).toUpperCase()}</span>
                          <span className="font-label-sm text-label-sm text-on-surface-variant">Filed {new Date(claim.loss_event_date).toLocaleDateString('en-GB')} • PMFBY</span>
                        </div>
                        <span className={`px-2 py-0.5 rounded-full font-label-sm text-label-sm font-bold flex items-center gap-1 ${
                          claim.status === 'settled' || claim.status === 'approved' 
                            ? 'bg-primary-fixed text-on-primary-fixed' 
                            : claim.status === 'rejected' 
                            ? 'bg-error-container text-on-error-container' 
                            : 'bg-secondary-fixed text-on-secondary-fixed'
                        }`}>
                          {claim.status === 'settled' || claim.status === 'approved' ? '✓ Settled' : claim.status === 'rejected' ? '✕ Rejected' : '⧖ Pending'}
                        </span>
                      </div>
                      {claim.settlement_amount && (
                        <div className="flex items-center justify-between pt-1">
                          <span className="font-label-sm text-label-sm text-on-surface-variant">Direct Credit to Linked Bank A/c</span>
                          <span className="font-headline-sm text-headline-sm text-primary font-bold">₹{claim.settlement_amount.toLocaleString()}</span>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        <div className="p-space-md bg-surface-container rounded-xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-surface-container-highest flex items-center justify-center text-primary">
              <span className="material-symbols-outlined text-[20px]">support_agent</span>
            </div>
            <div className="flex flex-col">
              <span className="font-label-md text-label-md text-on-surface font-bold">Need Help with KCC or Insurance?</span>
              <span className="font-label-sm text-label-sm text-on-surface-variant">KhetSaathi Mitr is available 24/7 in Hindi &amp; Marathi</span>
            </div>
          </div>
          <button className="w-10 h-10 rounded-full bg-surface flex items-center justify-center text-primary active:bg-surface-container-high transition-colors">
            <span className="material-symbols-outlined text-[20px]">call</span>
          </button>
        </div>
      </main>

      
    </div>
  );
}
