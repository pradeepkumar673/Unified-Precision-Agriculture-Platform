import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { applyLoan, fileInsuranceClaim } from '../../api/financeApi';

export default function CreditMarketplaceInsurance() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('credit');
  const [isApplying, setIsApplying] = useState(false);
  const [isFiling, setIsFiling] = useState(false);

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
    setIsFiling(true);
    try {
      const farmId = localStorage.getItem('farmId') || '00000000-0000-0000-0000-000000000000';
      await fileInsuranceClaim({
        farm_id: farmId,
        policy_id: 'PMFBY-MH-2024-99481',
        loss_event_date: new Date().toISOString().split('T')[0],
        photo_paths: ['/mock/gps/evidence1.jpg']
      });
      alert('Claim filed successfully!');
    } catch (err) {
      console.error('Failed to file claim', err);
      alert('Failed to file claim.');
    } finally {
      setIsFiling(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface text-on-surface flex flex-col pt-safe pb-safe relative">
      <header className="fixed top-0 w-full z-50 bg-surface/90 backdrop-blur-xl border-b border-surface-container/50 shadow-sm pt-safe">
        <div className="flex items-center justify-between h-14 px-margin">
          <div className="flex items-center gap-space-sm">
            <button onClick={() => navigate(-1)} className="w-10 h-10 flex items-center justify-center rounded-full text-on-surface active:bg-surface-container-high transition-colors" type="button">
              <span className="material-symbols-outlined text-[24px]">arrow_back</span>
            </button>
            <h1 className="font-headline-sm text-headline-sm font-bold text-on-surface truncate">Credit &amp; Insurance</h1>
          </div>
          <button className="w-10 h-10 flex items-center justify-center rounded-full text-on-surface-variant active:bg-surface-container-high transition-colors" type="button">
            <span className="material-symbols-outlined text-[24px]">help_outline</span>
          </button>
        </div>
      </header>

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
                    <span className="font-headline-lg text-headline-lg text-primary font-bold">785</span>
                    <span className="font-label-sm text-label-sm text-on-surface-variant">/ 900</span>
                  </div>
                </div>
                <div className="bg-primary-fixed px-3 py-1.5 rounded-full flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
                  <span className="font-label-sm text-label-sm text-on-primary-fixed font-bold">Tier-1 Pre-Approved</span>
                </div>
              </div>
              
              <div className="relative flex flex-col items-center justify-center py-2">
                <svg className="w-48 h-24 overflow-visible" viewBox="0 0 160 85">
                  <path className="text-surface-container-highest" d="M 20 80 A 60 60 0 0 1 140 80" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="14"></path>
                  <path className="text-primary" d="M 20 80 A 60 60 0 0 1 140 80" fill="none" stroke="currentColor" strokeDasharray="188.5" strokeDashoffset="36.2" strokeLinecap="round" strokeWidth="14"></path>
                </svg>
                <div className="flex justify-between w-48 px-1 text-on-surface-variant font-label-sm text-label-sm mt-1">
                  <span>300 (Fair)</span>
                  <span>650</span>
                  <span className="text-primary font-bold">900 (Excellent)</span>
                </div>
              </div>
              
              <p className="font-body-sm text-body-sm text-on-surface-variant">
                Score updated yesterday via automated APMC mandi receipts, Sentinel-2 vegetation index, and spotless loan repayments.
              </p>
              
              <div className="flex flex-col gap-2 pt-1">
                <span className="font-label-sm text-label-sm text-on-surface-variant">Top Contributing Boosters</span>
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between bg-surface p-2.5 rounded-lg shadow-sm">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-primary text-[20px]">psychiatry</span>
                      <span className="font-label-sm text-label-sm text-on-surface">4 Consecutive High-Yield Cycles</span>
                    </div>
                    <span className="font-label-sm text-label-sm text-primary font-bold">+65 pts</span>
                  </div>
                  <div className="flex items-center justify-between bg-surface p-2.5 rounded-lg shadow-sm">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-primary text-[20px]">receipt_long</span>
                      <span className="font-label-sm text-label-sm text-on-surface">Verified Mandi Trade Invoices</span>
                    </div>
                    <span className="font-label-sm text-label-sm text-primary font-bold">+40 pts</span>
                  </div>
                  <div className="flex items-center justify-between bg-surface p-2.5 rounded-lg shadow-sm">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-primary text-[20px]">water_drop</span>
                      <span className="font-label-sm text-label-sm text-on-surface">Regular Soil Testing &amp; Water Log</span>
                    </div>
                    <span className="font-label-sm text-label-sm text-primary font-bold">+30 pts</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-space-md">
              <div className="flex items-center justify-between">
                <h2 className="font-headline-sm text-headline-sm text-on-surface">Curated Institutional Loans</h2>
                <span className="bg-secondary-fixed text-on-secondary-fixed font-label-sm text-label-sm px-2.5 py-0.5 rounded-full font-bold">3 Available</span>
              </div>
              
              <div className="bg-surface-container-low p-space-md rounded-xl shadow-sm flex flex-col gap-space-sm relative overflow-hidden">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex flex-col">
                    <span className="font-label-sm text-label-sm text-secondary font-bold uppercase">Top Recommended Offer</span>
                    <span className="font-headline-sm text-headline-sm text-on-surface font-bold">SBI Kisan Gold Card</span>
                    <span className="font-label-sm text-label-sm text-on-surface-variant">State Bank of India • Crop Cycle Line</span>
                  </div>
                  <span className="material-symbols-outlined text-secondary-container text-[28px]" style={{ fontVariationSettings: "'FILL' 1" }}>account_balance</span>
                </div>
                <div className="flex items-baseline gap-2 py-1">
                  <span className="font-headline-lg-mobile text-headline-lg-mobile text-primary font-bold">₹13,50,000</span>
                  <span className="font-label-sm text-label-sm text-on-surface-variant">Pre-Approved Limit</span>
                </div>
                <div className="grid grid-cols-3 gap-2 bg-surface p-2.5 rounded-lg">
                  <div className="flex flex-col">
                    <span className="font-label-sm text-label-sm text-on-surface-variant">Interest</span>
                    <span className="font-label-md text-label-md text-primary font-bold">4.0% p.a.*</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="font-label-sm text-label-sm text-on-surface-variant">Tenure</span>
                    <span className="font-label-md text-label-md text-on-surface font-semibold">12 Mos</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="font-label-sm text-label-sm text-on-surface-variant">Processing</span>
                    <span className="font-label-md text-label-md text-on-surface font-semibold">₹10 Fee</span>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  <span className="bg-surface-container-high text-on-surface-variant font-label-sm text-label-sm px-2 py-0.5 rounded">No Collateral up to ₹11.6L</span>
                  <span className="bg-surface-container-high text-on-surface-variant font-label-sm text-label-sm px-2 py-0.5 rounded">Direct DBT Transfer</span>
                  <span className="bg-surface-container-high text-on-surface-variant font-label-sm text-label-sm px-2 py-0.5 rounded">Govt Subsidized</span>
                </div>
                <button 
                  disabled={isApplying}
                  onClick={() => handleApplyLoan(1350000)}
                  className="w-full mt-2 h-14 bg-secondary-container text-on-secondary rounded-lg font-label-lg text-label-lg flex items-center justify-center gap-2 active:opacity-95 shadow-sm disabled:opacity-70"
                >
                  <span>{isApplying ? 'Applying...' : 'Apply in 2 Mins'}</span>
                  {!isApplying && <span className="material-symbols-outlined text-[20px]">arrow_forward</span>}
                </button>
              </div>

              <div className="bg-surface-container-low p-space-md rounded-xl shadow-sm flex flex-col gap-space-sm">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex flex-col">
                    <span className="font-headline-sm text-headline-sm text-on-surface font-bold">NABARD Agri-Infra Fund</span>
                    <span className="font-label-sm text-label-sm text-on-surface-variant">Solar Pump &amp; Micro-Drip Irrigation</span>
                  </div>
                  <span className="material-symbols-outlined text-primary text-[26px]">solar_power</span>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="font-headline-sm text-headline-sm text-primary font-bold">Up to ₹5,00,000</span>
                  <span className="font-label-sm text-label-sm text-on-surface-variant">@ 5.5% p.a.</span>
                </div>
                <p className="font-body-sm text-body-sm text-on-surface-variant">36 Months duration with customized seasonal EMIs tied to your bi-annual harvest windows.</p>
                <button className="w-full h-12 bg-surface text-primary rounded-lg font-label-md text-label-md flex items-center justify-center gap-2 active:bg-surface-container transition-colors shadow-sm">
                  <span>Check Plot Eligibility</span>
                  <span className="material-symbols-outlined text-[18px]">chevron_right</span>
                </button>
              </div>

              <div className="bg-surface-container-low p-space-md rounded-xl shadow-sm flex flex-col gap-space-sm">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex flex-col">
                    <span className="font-headline-sm text-headline-sm text-on-surface font-bold">Mahindra Agri-Finance</span>
                    <span className="font-label-sm text-label-sm text-on-surface-variant">Tractor &amp; Rotavator Financing</span>
                  </div>
                  <span className="material-symbols-outlined text-primary text-[26px]">agriculture</span>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="font-headline-sm text-headline-sm text-on-surface font-bold">₹8,00,000</span>
                  <span className="font-label-sm text-label-sm text-on-surface-variant">@ 8.2% p.a. • 5 Years Term</span>
                </div>
                <button className="w-full h-12 bg-surface text-on-surface rounded-lg font-label-md text-label-md flex items-center justify-center gap-2 active:bg-surface-container transition-colors shadow-sm">
                  <span>Explore Machinery Specs</span>
                  <span className="material-symbols-outlined text-[18px]">chevron_right</span>
                </button>
              </div>
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
              
              <div>
                <h2 className="font-headline-sm text-headline-sm text-on-surface font-bold">PM Fasal Bima Yojana (Rabi 2024–25)</h2>
                <p className="font-label-sm text-label-sm text-on-surface-variant">Policy #PMFBY-MH-2024-99481 • Plot 1 (4.5 Acres Sharbati Wheat)</p>
              </div>
              
              <div className="grid grid-cols-2 gap-2 bg-surface p-3 rounded-lg mt-1">
                <div className="flex flex-col">
                  <span className="font-label-sm text-label-sm text-on-surface-variant">Sum Insured</span>
                  <span className="font-headline-sm text-headline-sm text-primary font-bold">₹1,80,000</span>
                  <span className="font-label-sm text-label-sm text-on-surface-variant">₹40,000 / Acre</span>
                </div>
                <div className="flex flex-col">
                  <span className="font-label-sm text-label-sm text-on-surface-variant">Farmer Share Paid</span>
                  <span className="font-headline-sm text-headline-sm text-on-surface font-bold">₹2,700</span>
                  <span className="font-label-sm text-label-sm text-secondary font-semibold">1.5% Rabi Tariff</span>
                </div>
              </div>
              
              <div className="flex flex-col gap-1.5 pt-1">
                <span className="font-label-sm text-label-sm text-on-surface-variant">Coverage Inclusions:</span>
                <div className="flex flex-wrap gap-1.5">
                  <span className="bg-surface-container-high text-on-surface-variant font-label-sm text-label-sm px-2 py-0.5 rounded flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px] text-primary">rainy</span> Hail &amp; Unseasonal Rain
                  </span>
                  <span className="bg-surface-container-high text-on-surface-variant font-label-sm text-label-sm px-2 py-0.5 rounded flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px] text-primary">pest_control</span> Yellow Rust Epidemic
                  </span>
                  <span className="bg-surface-container-high text-on-surface-variant font-label-sm text-label-sm px-2 py-0.5 rounded flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px] text-primary">sunny</span> Extreme Heat Wilting
                  </span>
                </div>
              </div>
              
              <div className="flex items-center gap-2 pt-2 text-on-surface-variant font-label-sm text-label-sm">
                <span className="material-symbols-outlined text-[16px] text-primary">event_available</span>
                <span>Valid until 30 Apr 2025 • Auto-renewal through KCC</span>
              </div>
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
              
              <div className="bg-surface-container-low p-space-md rounded-xl shadow-sm flex flex-col gap-2">
                <div className="flex items-start justify-between">
                  <div className="flex flex-col">
                    <span className="font-label-md text-label-md text-on-surface font-bold">Kharif Hail Damage (#CLM-2024-03)</span>
                    <span className="font-label-sm text-label-sm text-on-surface-variant">Disbursed 24 Oct 2024 • Plot 1 Soybeans</span>
                  </div>
                  <span className="bg-primary-fixed text-on-primary-fixed font-label-sm text-label-sm px-2 py-0.5 rounded-full font-bold">
                    ✓ Settled
                  </span>
                </div>
                <div className="flex items-center justify-between pt-1">
                  <span className="font-label-sm text-label-sm text-on-surface-variant">Direct Credit to SBI A/c •••• 4410</span>
                  <span className="font-headline-sm text-headline-sm text-primary font-bold">₹28,500</span>
                </div>
              </div>

              <div className="bg-surface-container-low p-space-md rounded-xl shadow-sm flex flex-col gap-2">
                <div className="flex items-start justify-between">
                  <div className="flex flex-col">
                    <span className="font-label-md text-label-md text-on-surface font-bold">Early Drought Stress Relief (#CLM-2023-11)</span>
                    <span className="font-label-sm text-label-sm text-on-surface-variant">Disbursed 12 Nov 2023 • Satellite Survey</span>
                  </div>
                  <span className="bg-primary-fixed text-on-primary-fixed font-label-sm text-label-sm px-2 py-0.5 rounded-full font-bold">
                    ✓ Settled
                  </span>
                </div>
                <div className="flex items-center justify-between pt-1">
                  <span className="font-label-sm text-label-sm text-on-surface-variant">Direct Credit to SBI A/c •••• 4410</span>
                  <span className="font-headline-sm text-headline-sm text-primary font-bold">₹18,000</span>
                </div>
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

      <nav className="fixed bottom-0 w-full z-50 pb-safe bg-surface/90 backdrop-blur-xl shadow-[0_-2px_10px_rgba(0,0,0,0.05)]">
        <div className="flex justify-around items-center h-16 px-space-xs">
          {[
            { icon: 'home', label: 'Home', path: '/app' },
            { icon: 'calendar_month', label: 'Plan', path: '/planning/crop-plan' },
            { icon: 'storefront', label: 'Market', path: '/marketplace/inputs' },
            { icon: 'shield_with_heart', label: 'Credit', path: '/finance/credit-insurance', active: true },
            { icon: 'account_balance_wallet', label: 'Wallet', path: '/finance/wallet' },
            { icon: 'account_circle', label: 'Profile', path: '/profile/settings' },
          ].map(nav => (
            <button key={nav.label} onClick={() => navigate(nav.path)} className={`flex flex-col items-center justify-center min-w-[48px] h-12 transition-colors ${nav.active ? 'text-primary font-bold' : 'text-on-surface-variant hover:text-on-surface'}`} type="button">
              <span className={`material-symbols-outlined text-[22px] ${nav.active ? 'font-bold fill-1' : ''}`} style={nav.active ? { fontVariationSettings: "'FILL' 1" } : {}}>{nav.icon}</span>
              <span className={`font-label-sm text-label-sm ${nav.active ? 'font-bold' : ''}`}>{nav.label}</span>
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
}
