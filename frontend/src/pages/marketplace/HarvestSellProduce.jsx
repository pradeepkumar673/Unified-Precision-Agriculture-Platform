import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getFarmProfile } from '../../api/farmApi';
import { getPriceForecast } from '../../api/visionForecastApi';

import { getBuyers } from '../../api/marketplaceApi';

export default function HarvestSellProduce() {
  const navigate = useNavigate();
  const [quantity, setQuantity] = useState(95);
  const [askingPrice, setAskingPrice] = useState(0);
  const [acceptingOffer, setAcceptingOffer] = useState(null);

  const [farmData, setFarmData] = useState(null);
  const [priceData, setPriceData] = useState(null);
  const [buyersList, setBuyersList] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const farmId = localStorage.getItem('farmId');
        if (!farmId) return;

        const farmRes = await getFarmProfile(farmId);
        setFarmData(farmRes.data);

        const cropName = farmRes.data?.crops?.[0]?.crop_name || 'Wheat';
        const dist = farmRes.data?.district || 'Nashik';

        const priceRes = await getPriceForecast({ crop: cropName, district: dist, weeks_ahead: 4 });
        setPriceData(priceRes.data);
        
        const buyersRes = await getBuyers({ district: dist });
        setBuyersList(buyersRes.data || []);
        
        // Initialize asking price to the predicted price
        if (priceRes.data?.predicted_price) {
          setAskingPrice(Math.round(priceRes.data.predicted_price));
        } else {
          setAskingPrice(2580);
        }
      } catch (err) {
        console.error('Failed to load harvest data', err);
        setAskingPrice(2580);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

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
      setTimeout(() => {
        alert(`Offer accepted with ${buyerName}. Pickup will be scheduled shortly.`);
        setAcceptingOffer(null);
      }, 1200);
    } catch (err) {
      console.error(err);
      setAcceptingOffer(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <span className="material-symbols-outlined animate-spin text-primary text-[48px]">progress_activity</span>
      </div>
    );
  }

  const crop = farmData?.crops?.[0]?.crop_name || 'Wheat';
  const variety = farmData?.crops?.[0]?.variety || 'Standard';
  const area = farmData?.area_acres || 4.5;
  const district = farmData?.district || 'Nashik';
  
  const currentRate = priceData?.predicted_price ? Math.round(priceData.predicted_price) : 2420;
  const lowRate = priceData?.low_ci ? Math.round(priceData.low_ci) : currentRate - 100;
  const highRate = priceData?.high_ci ? Math.round(priceData.high_ci) : currentRate + 150;
  
  let peakWeek = 1;
  let maxPrice = currentRate;
  if (priceData?.timeline) {
    priceData.timeline.forEach(pt => {
      if (pt.predicted_price > maxPrice) {
        maxPrice = Math.round(pt.predicted_price);
        peakWeek = pt.week;
      }
    });
  }

  const gainPct = Math.round(((maxPrice - currentRate) / currentRate) * 100);

  // Map real backend buyers to the UI format
  const dynamicBuyers = buyersList.map(buyer => ({
    id: buyer.id,
    name: buyer.name,
    type: buyer.buyer_type,
    price: Math.round(currentRate * buyer.markup_pct),
    dist: buyer.perks.includes('away') ? buyer.perks : '14 km away', // Mocking distance for UI if not in perks
    tag: buyer.tag,
    perks: buyer.perks
  }));

  return (
    <div className="min-h-screen bg-surface text-on-surface flex flex-col relative">
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
                  <h2 className="font-headline-sm text-headline-sm text-on-surface truncate capitalize">{crop} • {variety}</h2>
                  <span className="font-label-sm text-label-sm text-primary font-semibold">Premium Yield</span>
                </div>
              </div>
              <button onClick={() => navigate('/planning/crop-plan')} className="px-space-sm py-1 bg-surface-container rounded-full text-on-surface-variant hover:text-primary transition-colors flex items-center gap-1" type="button">
                <span className="font-label-sm text-label-sm">Edit</span>
                <span className="material-symbols-outlined text-[14px]">tune</span>
              </button>
            </div>
            <div className="flex items-center gap-space-xs bg-surface-container-low px-space-sm py-1.5 rounded-lg text-on-surface-variant">
              <span className="material-symbols-outlined text-[16px] text-primary">landscape</span>
              <span className="font-body-sm text-body-sm">Harvested from <strong>Plot 1 ({area} Acres)</strong></span>
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
              <span className="font-body-sm text-body-sm" id="bag-count">Approx {bags.toLocaleString('en-IN')} standard 50kg bags</span>
            </div>
          </div>

          <div className="bg-surface-container-lowest p-space-md rounded-xl shadow-sm flex flex-col gap-space-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-space-xs">
                <span className="material-symbols-outlined text-primary text-[20px]">psychology</span>
                <span className="font-label-sm text-label-sm text-on-surface-variant uppercase">Quality Assessment</span>
              </div>
              <button onClick={() => alert("Quality reassessment requested. An agronomist will review your recent satellite/drone scans.")} className="text-secondary font-label-md text-label-md font-bold hover:underline" type="button">Change Grade</button>
            </div>
            <div className="flex items-center justify-between bg-primary-fixed/30 p-space-sm rounded-lg">
              <div className="flex flex-col">
                <span className="font-headline-sm text-headline-sm text-primary">Grade A1 (Milling Quality)</span>
                <span className="font-label-sm text-label-sm text-on-surface-variant">Suitable for premium bulk export</span>
              </div>
              <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-on-primary">
                <span className="material-symbols-outlined text-[22px]">auto_awesome</span>
              </div>
            </div>
            <div className="flex items-start gap-space-xs bg-surface-container-low p-space-sm rounded-lg text-on-surface-variant">
              <span className="material-symbols-outlined text-primary text-[18px] flex-shrink-0 mt-0.5">verified_user</span>
              <p className="font-label-sm text-label-sm leading-relaxed">
                Auto-filled from Recent Assessment (<span className="font-bold text-on-surface">Valid for 30 days</span>).
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
                <span className="font-headline-lg-mobile text-headline-lg-mobile text-primary font-bold">₹{lowRate.toLocaleString('en-IN')} – ₹{highRate.toLocaleString('en-IN')}</span>
                <span className="font-body-md text-body-md text-on-surface-variant">/ Qtl</span>
              </div>
              <p className="font-body-sm text-body-sm text-on-surface-variant leading-snug">
                {district} modal mandi rate is <span className="font-bold text-on-surface">₹{currentRate.toLocaleString('en-IN')} today</span>. 
                {gainPct > 0 ? (
                  <> Waiting until Week {peakWeek} or selling direct yields up to <span className="text-primary font-bold">+{gainPct}% higher returns</span>.</>
                ) : (
                  <> Current prices are at their peak. Selling now is highly recommended.</>
                )}
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
              <h3 className="font-headline-sm text-headline-sm text-on-surface">Verified Buyers Ready</h3>
              <p className="font-label-sm text-label-sm text-on-surface-variant">Active purchase orders for {district} Region</p>
            </div>
            <span className="material-symbols-outlined text-primary text-[22px]">handshake</span>
          </div>

          {dynamicBuyers.map((buyer, idx) => (
            <div key={buyer.id} className="bg-surface-container-lowest p-space-md rounded-xl shadow-md flex flex-col gap-space-sm relative">
              {buyer.tag && (
                <div className="flex items-center justify-between">
                  <span className="bg-primary text-on-primary font-label-sm text-label-sm px-space-sm py-0.5 rounded-full flex items-center gap-1 font-bold">
                    <span className="material-symbols-outlined text-[14px]">thumb_up</span> {buyer.tag}
                  </span>
                  <span className="font-label-sm text-label-sm text-primary font-bold">Verified Gold</span>
                </div>
              )}
              <div className="flex items-start justify-between gap-space-sm pt-1">
                <div className="flex flex-col min-w-0">
                  <h4 className="font-headline-sm text-headline-sm text-on-surface truncate">{buyer.name}</h4>
                  <span className="font-body-sm text-body-sm text-on-surface-variant">{buyer.type}</span>
                </div>
                <div className="flex flex-col items-end flex-shrink-0">
                  <span className="font-headline-sm text-headline-sm text-primary font-bold">₹{buyer.price.toLocaleString('en-IN')}</span>
                  <span className="font-label-sm text-label-sm text-on-surface-variant">/ Qtl</span>
                </div>
              </div>
              
              {idx === 0 && (
                <div className="flex items-center justify-between bg-surface-container-low p-space-sm rounded-lg">
                  <div className="flex flex-col">
                    <span className="font-label-sm text-label-sm text-on-surface-variant">Total Order Value ({quantity} Qtl)</span>
                    <span className="font-headline-sm text-headline-sm text-on-surface font-bold">₹{Math.round(quantity * buyer.price).toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex items-center text-primary gap-1 font-label-sm text-label-sm font-semibold">
                    <span className="material-symbols-outlined text-[18px]">verified</span>
                    <span>Escrow Protected</span>
                  </div>
                </div>
              )}
              
              <div className="flex flex-col gap-1 text-on-surface-variant font-body-sm text-body-sm">
                <div className="flex items-center gap-space-xs">
                  <span className="material-symbols-outlined text-[18px] text-primary">near_me</span>
                  <span>{buyer.dist} • <strong className="text-on-surface">{buyer.perks}</strong></span>
                </div>
                <div className="flex items-center gap-space-xs">
                  <span className="material-symbols-outlined text-[18px] text-secondary">flash_on</span>
                  <span>Payment: <strong>Instant UPI / NEFT</strong> on receipt</span>
                </div>
              </div>
              
              <button 
                onClick={() => handleAcceptOffer(buyer.name, buyer.id)}
                className={`w-full mt-2 h-14 rounded-xl flex items-center justify-center gap-space-xs shadow transition-opacity active:scale-[0.99] ${acceptingOffer === buyer.id ? 'bg-primary text-on-primary' : 'bg-secondary-container text-on-secondary hover:opacity-95'}`} 
                type="button"
              >
                {acceptingOffer === buyer.id ? (
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
          ))}

        </section>

        <div className="rounded-xl overflow-hidden shadow-sm bg-surface-container">
          <img className="w-full h-36 object-cover" alt="Harvest" src="https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?q=80&w=800&auto=format&fit=crop" />
        </div>

        <div className="pt-space-xs flex flex-col gap-space-xs">
          <button className="w-full h-14 bg-primary text-on-primary rounded-xl font-headline-sm text-headline-sm flex items-center justify-center gap-space-sm shadow-md hover:bg-primary/90 transition-all active:scale-[0.99]" type="button">
            <span>Post Public Listing on Mandi Exchange</span>
            <span className="material-symbols-outlined text-[22px]">arrow_forward</span>
          </button>
          <p className="text-center font-label-sm text-label-sm text-on-surface-variant">
            Free listing • Instant alerts sent to 450+ verified {district} district grain traders
          </p>
        </div>
      </main>
    </div>
  );
}
