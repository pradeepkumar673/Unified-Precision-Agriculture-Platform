import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { matchExchange } from '../../api/marketplaceApi';

export default function HarvestSellProduce() {
  const navigate = useNavigate();
  const [quantity, setQuantity] = useState(95);
  const [askingPrice, setAskingPrice] = useState(2580);
  const [acceptingOffer, setAcceptingOffer] = useState(null);

  const bags = Math.round(quantity * 2);
  const totalKg = quantity * 100;
  const totalRev = Math.round(quantity * askingPrice);

  const handleDecreaseQty = () => {
    if (quantity > 5) setQuantity(quantity - 5);
  };

  const handleIncreaseQty = () => {
    setQuantity(quantity + 5);
  };

  const handleAcceptOffer = async (buyerName, index) => {
    setAcceptingOffer(index);
    try {
      // Simulate API call to matchExchange or accept offer
      setTimeout(() => {
        alert(`Offer accepted with ${buyerName}. Pickup will be scheduled shortly.`);
        setAcceptingOffer(null);
      }, 1200);
    } catch (err) {
      console.error(err);
      setAcceptingOffer(null);
    }
  };

  return (
    <div className="min-h-screen bg-surface text-on-surface flex flex-col pt-safe pb-safe relative">
      <header className="fixed top-0 w-full z-50 bg-surface/90 backdrop-blur-xl border-b border-surface-container/50 shadow-sm pt-safe">
        <div className="flex items-center justify-between h-16 px-margin">
          <div className="flex items-center gap-space-sm">
            <button onClick={() => navigate(-1)} className="w-10 h-10 flex items-center justify-center rounded-full text-on-surface active:bg-surface-container-high transition-colors" type="button">
              <span className="material-symbols-outlined text-[24px]">arrow_back</span>
            </button>
            <h1 className="font-headline-sm text-headline-sm font-bold text-on-surface truncate">Market &amp; Harvest</h1>
          </div>
          <div className="flex items-center gap-1.5">
            <button className="w-10 h-10 flex items-center justify-center rounded-full text-on-surface-variant active:bg-surface-container-high transition-colors" type="button">
              <span className="material-symbols-outlined text-[24px]">share</span>
            </button>
          </div>
        </div>
      </header>

      <main className="flex flex-col w-full pt-20 pb-24 px-margin bg-surface flex-1 gap-space-md">
        <section className="flex flex-col gap-space-xs bg-surface-container p-space-md rounded-xl shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-space-xs">
              <span className="w-2.5 h-2.5 rounded-full bg-secondary-container animate-pulse"></span>
              <span className="font-label-sm text-label-sm text-secondary uppercase tracking-wider">Direct Farm-to-Mandi &amp; Buyer Marketplace</span>
            </div>
            <span className="material-symbols-outlined text-primary text-[20px]">verified</span>
          </div>
          <p className="font-body-sm text-body-sm text-on-surface-variant">
            Sell directly to verified millers, wholesale traders, and FPOs with zero middleman brokerage.
          </p>
        </section>

        <section className="flex flex-col gap-space-md">
          <div className="bg-surface-container-lowest p-space-md rounded-xl shadow-sm flex flex-col gap-space-sm relative overflow-hidden">
            <div className="flex items-start justify-between gap-space-sm">
              <div className="flex items-center gap-space-sm min-w-0">
                <div className="w-12 h-12 rounded-xl bg-primary-fixed flex items-center justify-center flex-shrink-0 text-on-primary-fixed">
                  <span className="material-symbols-outlined text-[28px]" style={{ fontVariationSettings: "'FILL' 1" }}>grain</span>
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="font-label-sm text-label-sm text-on-surface-variant">Crop &amp; Variety</span>
                  <h2 className="font-headline-sm text-headline-sm text-on-surface truncate">Wheat • Sharbati Gold</h2>
                  <span className="font-label-sm text-label-sm text-primary font-semibold">HD-2967 High Protein</span>
                </div>
              </div>
              <button className="px-space-sm py-1 bg-surface-container rounded-full text-on-surface-variant hover:text-primary transition-colors flex items-center gap-1" type="button">
                <span className="font-label-sm text-label-sm">Edit</span>
                <span className="material-symbols-outlined text-[14px]">tune</span>
              </button>
            </div>
            <div className="flex items-center gap-space-xs bg-surface-container-low px-space-sm py-1.5 rounded-lg text-on-surface-variant">
              <span className="material-symbols-outlined text-[16px] text-primary">landscape</span>
              <span className="font-body-sm text-body-sm">Harvested from <strong>Plot 1 (4.5 Acres)</strong></span>
            </div>
          </div>

          <div className="bg-surface-container-lowest p-space-md rounded-xl shadow-sm flex flex-col gap-space-sm">
            <div className="flex items-center justify-between">
              <label className="font-headline-sm text-headline-sm text-on-surface" htmlFor="quantity-input">Quantity Available</label>
              <span className="font-label-sm text-label-sm text-primary bg-primary-fixed px-space-xs py-0.5 rounded-full font-bold">1 Qtl = 100 kg</span>
            </div>
            <div className="flex items-center justify-between bg-surface-container-low rounded-xl p-space-xs">
              <button onClick={handleDecreaseQty} aria-label="Decrease quantity" className="w-12 h-12 rounded-lg bg-surface-container flex items-center justify-center text-on-surface active:bg-surface-container-high transition-colors" type="button">
                <span className="material-symbols-outlined text-[24px]">remove</span>
              </button>
              <div className="flex flex-col items-center">
                <div className="flex items-baseline gap-space-xs">
                  <input 
                    className="w-20 bg-transparent text-center font-headline-md text-headline-md text-on-surface focus:outline-none" 
                    id="quantity-input" 
                    type="number" 
                    value={quantity}
                    onChange={(e) => setQuantity(Number(e.target.value) || 0)}
                  />
                  <span className="font-headline-sm text-headline-sm text-on-surface-variant">Quintals</span>
                </div>
                <span className="font-label-sm text-label-sm text-on-surface-variant" id="kg-display">{totalKg.toLocaleString('en-IN')} kg total</span>
              </div>
              <button onClick={handleIncreaseQty} aria-label="Increase quantity" className="w-12 h-12 rounded-lg bg-surface-container flex items-center justify-center text-on-surface active:bg-surface-container-high transition-colors" type="button">
                <span className="material-symbols-outlined text-[24px]">add</span>
              </button>
            </div>
            <div className="flex items-center gap-space-xs text-on-surface-variant">
              <span className="material-symbols-outlined text-[18px] text-secondary">inventory_2</span>
              <span className="font-body-sm text-body-sm" id="bag-count">Approx {bags.toLocaleString('en-IN')} standard 50kg jute bags</span>
            </div>
          </div>

          <div className="bg-surface-container-lowest p-space-md rounded-xl shadow-sm flex flex-col gap-space-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-space-xs">
                <span className="material-symbols-outlined text-primary text-[20px]">psychology</span>
                <span className="font-label-sm text-label-sm text-on-surface-variant uppercase">Quality Assessment</span>
              </div>
              <button className="text-secondary font-label-md text-label-md font-bold hover:underline" type="button">Change Grade</button>
            </div>
            <div className="flex items-center justify-between bg-primary-fixed/30 p-space-sm rounded-lg">
              <div className="flex flex-col">
                <span className="font-headline-sm text-headline-sm text-primary">Grade A1 (Milling Quality)</span>
                <span className="font-label-sm text-label-sm text-on-surface-variant">Suitable for premium branded flour export</span>
              </div>
              <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-on-primary">
                <span className="material-symbols-outlined text-[22px]">auto_awesome</span>
              </div>
            </div>
            <div className="flex items-start gap-space-xs bg-surface-container-low p-space-sm rounded-lg text-on-surface-variant">
              <span className="material-symbols-outlined text-primary text-[18px] flex-shrink-0 mt-0.5">verified_user</span>
              <p className="font-label-sm text-label-sm leading-relaxed">
                Auto-filled from Drone &amp; Satellite Moisture Scan (<span className="font-bold text-on-surface">11.8% grain moisture</span>, 78 test weight).
              </p>
            </div>
          </div>

          <div className="bg-gradient-to-br from-primary-fixed/40 via-surface-container-lowest to-surface-container p-space-md rounded-xl shadow-sm flex flex-col gap-space-md">
            <div className="flex flex-col gap-space-xs">
              <div className="flex items-center gap-space-xs">
                <span className="material-symbols-outlined text-secondary text-[22px]">lightbulb</span>
                <h3 className="font-headline-sm text-headline-sm text-on-surface">AI Price Recommendation</h3>
              </div>
              <div className="flex items-baseline gap-space-xs">
                <span className="font-headline-lg-mobile text-headline-lg-mobile text-primary font-bold">₹12,550 – ₹12,620</span>
                <span className="font-body-md text-body-md text-on-surface-variant">/ Qtl</span>
              </div>
              <p className="font-body-sm text-body-sm text-on-surface-variant leading-snug">
                Lasalgaon modal mandi rate is <span className="font-bold text-on-surface">₹12,420 today</span>. Waiting until Week 3 (18–24 March) or selling direct to bulk flour millers yields up to <span className="text-primary font-bold">+8% higher returns</span>.
              </p>
            </div>

            <div className="bg-surface-container-lowest p-space-sm rounded-xl flex flex-col gap-space-xs shadow-sm">
              <div className="flex justify-between items-center">
                <label className="font-label-md text-label-md text-on-surface" htmlFor="asking-price">Your Asking Price (per Quintal)</label>
                <span className="font-label-sm text-label-sm text-primary font-semibold">Competitive</span>
              </div>
              <div className="flex items-center bg-surface-container-low px-space-sm rounded-lg h-14">
                <span className="font-headline-sm text-headline-sm text-on-surface-variant mr-1">₹</span>
                <input 
                  className="w-full bg-transparent font-headline-md text-headline-md text-on-surface focus:outline-none" 
                  id="asking-price" 
                  type="number" 
                  value={askingPrice}
                  onChange={(e) => setAskingPrice(Number(e.target.value) || 0)}
                />
                <span className="font-label-md text-label-md text-on-surface-variant flex-shrink-0">/ Qtl</span>
              </div>
              <div className="flex justify-between text-on-surface-variant font-label-sm text-label-sm px-1">
                <span>Est. Gross Revenue:</span>
                <span className="font-bold text-primary" id="gross-revenue">₹{totalRev.toLocaleString('en-IN')}</span>
              </div>
            </div>
          </div>
        </section>

        <section className="flex flex-col gap-space-sm">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-headline-sm text-headline-sm text-on-surface">3 Verified Buyers Ready</h3>
              <p className="font-label-sm text-label-sm text-on-surface-variant">Active purchase orders for Nashik Region</p>
            </div>
            <span className="material-symbols-outlined text-primary text-[22px]">handshake</span>
          </div>

          <div className="bg-surface-container-lowest p-space-md rounded-xl shadow-md flex flex-col gap-space-sm relative">
            <div className="flex items-center justify-between">
              <span className="bg-primary text-on-primary font-label-sm text-label-sm px-space-sm py-0.5 rounded-full flex items-center gap-1 font-bold">
                <span className="material-symbols-outlined text-[14px]">thumb_up</span> Top Matched Buyer
              </span>
              <span className="font-label-sm text-label-sm text-primary font-bold">Verified Gold</span>
            </div>
            <div className="flex items-start justify-between gap-space-sm pt-1">
              <div className="flex flex-col min-w-0">
                <h4 className="font-headline-sm text-headline-sm text-on-surface truncate">Patanjali / Agro Foods Milling Ltd.</h4>
                <span className="font-body-sm text-body-sm text-on-surface-variant">Industrial Flour Processing Plant</span>
              </div>
              <div className="flex flex-col items-end flex-shrink-0">
                <span className="font-headline-sm text-headline-sm text-primary font-bold">₹12,590</span>
                <span className="font-label-sm text-label-sm text-on-surface-variant">/ Qtl</span>
              </div>
            </div>
            <div className="flex items-center justify-between bg-surface-container-low p-space-sm rounded-lg">
              <div className="flex flex-col">
                <span className="font-label-sm text-label-sm text-on-surface-variant">Total Order Value ({quantity} Qtl)</span>
                <span className="font-headline-sm text-headline-sm text-on-surface font-bold">₹{Math.round(quantity * 12590).toLocaleString('en-IN')}</span>
              </div>
              <div className="flex items-center text-primary gap-1 font-label-sm text-label-sm font-semibold">
                <span className="material-symbols-outlined text-[18px]">verified</span>
                <span>Escrow Protected</span>
              </div>
            </div>
            <div className="flex flex-col gap-1 text-on-surface-variant font-body-sm text-body-sm">
              <div className="flex items-center gap-space-xs">
                <span className="material-symbols-outlined text-[18px] text-primary">near_me</span>
                <span>14 km away • <strong className="text-on-surface">Free farm gate pickup included</strong></span>
              </div>
              <div className="flex items-center gap-space-xs">
                <span className="material-symbols-outlined text-[18px] text-secondary">flash_on</span>
                <span>Payment: <strong>Instant UPI / NEFT</strong> on weighing receipt</span>
              </div>
            </div>
            <button 
              onClick={() => handleAcceptOffer('Patanjali / Agro Foods', 1)}
              className={`w-full h-14 rounded-xl flex items-center justify-center gap-space-xs shadow transition-opacity active:scale-[0.99] ${acceptingOffer === 1 ? 'bg-primary text-on-primary' : 'bg-secondary-container text-on-secondary hover:opacity-95'}`} 
              type="button"
            >
              {acceptingOffer === 1 ? (
                <>
                  <span className="material-symbols-outlined text-[20px]">check</span>
                  <span>Offer Accepted</span>
                </>
              ) : (
                <>
                  <span>Accept Offer &amp; Schedule Pickup</span>
                  <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
                </>
              )}
            </button>
          </div>

          <div className="bg-surface-container-lowest p-space-md rounded-xl shadow-sm flex flex-col gap-space-sm">
            <div className="flex items-start justify-between gap-space-sm">
              <div className="flex flex-col min-w-0">
                <div className="flex items-center gap-space-xs">
                  <h4 className="font-headline-sm text-headline-sm text-on-surface truncate">Nashik Grain Wholesale Trading Co.</h4>
                </div>
                <span className="font-body-sm text-body-sm text-on-surface-variant">Registered APMC Mandi Trader</span>
              </div>
              <div className="flex flex-col items-end flex-shrink-0">
                <span className="font-headline-sm text-headline-sm text-on-surface font-bold">₹12,520</span>
                <span className="font-label-sm text-label-sm text-on-surface-variant">/ Qtl</span>
              </div>
            </div>
            <div className="flex items-center gap-space-xs text-on-surface-variant font-body-sm text-body-sm">
              <span className="material-symbols-outlined text-[18px] text-primary">location_on</span>
              <span>8 km away • Farmer brings produce to Lasalgaon Yard</span>
            </div>
            <div className="flex items-center justify-between pt-1">
              <span className="font-label-sm text-label-sm text-on-surface-variant">Payment: Same-day Cheque / RTGS</span>
              <button className="px-space-md h-11 bg-surface-container rounded-xl text-primary font-label-md text-label-md font-bold hover:bg-surface-container-high transition-colors" type="button">
                View Details
              </button>
            </div>
          </div>

          <div className="bg-surface-container-lowest p-space-md rounded-xl shadow-sm flex flex-col gap-space-sm">
            <div className="flex items-start justify-between gap-space-sm">
              <div className="flex flex-col min-w-0">
                <div className="flex items-center gap-space-xs">
                  <h4 className="font-headline-sm text-headline-sm text-on-surface truncate">MahaAgro FPO Bulk Consortium</h4>
                </div>
                <span className="font-body-sm text-body-sm text-on-surface-variant">Farmer Producer Organization</span>
              </div>
              <div className="flex flex-col items-end flex-shrink-0">
                <span className="font-headline-sm text-headline-sm text-on-surface font-bold">₹12,540</span>
                <span className="font-label-sm text-label-sm text-on-surface-variant">/ Qtl</span>
              </div>
            </div>
            <div className="flex items-center gap-space-xs text-on-surface-variant font-body-sm text-body-sm">
              <span className="material-symbols-outlined text-[18px] text-primary">local_shipping</span>
              <span>18 km away • Subsidized bagging &amp; pooling provided</span>
            </div>
            <div className="flex items-center justify-between pt-1">
              <span className="font-label-sm text-label-sm text-on-surface-variant">Payment: Direct to Bank (within 24 hrs)</span>
              <button className="px-space-md h-11 bg-surface-container rounded-xl text-primary font-label-md text-label-md font-bold hover:bg-surface-container-high transition-colors" type="button">
                View Details
              </button>
            </div>
          </div>
        </section>

        <div className="rounded-xl overflow-hidden shadow-sm bg-surface-container">
          <img className="w-full h-36 object-cover" alt="Wheat Harvest" src="https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?q=80&w=800&auto=format&fit=crop" />
        </div>

        <div className="pt-space-xs flex flex-col gap-space-xs">
          <button className="w-full h-14 bg-primary text-on-primary rounded-xl font-headline-sm text-headline-sm flex items-center justify-center gap-space-sm shadow-md hover:bg-primary/90 transition-all active:scale-[0.99]" type="button">
            <span>Post Public Listing on Mandi Exchange</span>
            <span className="material-symbols-outlined text-[22px]">arrow_forward</span>
          </button>
          <p className="text-center font-label-sm text-label-sm text-on-surface-variant">
            Free listing • Instant alerts sent to 450+ verified district grain traders
          </p>
        </div>
      </main>

      <nav className="fixed bottom-0 w-full z-50 pb-safe bg-surface/90 backdrop-blur-xl shadow-[0_-2px_10px_rgba(0,0,0,0.05)]">
        <div className="flex justify-around items-center h-16 px-space-xs">
          {[
            { icon: 'home', label: 'Home', path: '/app' },
            { icon: 'calendar_month', label: 'Plan', path: '/planning/crop-plan' },
            { icon: 'water_drop', label: 'Water', path: '/water-soil/irrigation' },
            { icon: 'storefront', label: 'Market', path: '/marketplace/inputs', active: true },
            { icon: 'notifications', label: 'Alerts', path: '/community/alerts' },
            { icon: 'account_circle', label: 'Profile', path: '/profile/settings' },
          ].map(nav => (
            <button key={nav.label} onClick={() => navigate(nav.path)} className={`flex flex-col items-center justify-center min-w-[52px] h-12 transition-colors ${nav.active ? 'text-primary font-bold' : 'text-on-surface-variant hover:text-on-surface'}`} type="button">
              <span className={`material-symbols-outlined text-[22px] ${nav.active ? 'font-bold fill-1' : ''}`} style={nav.active ? { fontVariationSettings: "'FILL' 1" } : {}}>{nav.icon}</span>
              <span className={`font-label-sm text-label-sm ${nav.active ? 'font-bold' : ''}`}>{nav.label}</span>
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
}
