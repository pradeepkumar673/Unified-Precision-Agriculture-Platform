import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getProducts, getEquipmentListings } from '../../api/marketplaceApi';

export default function InputsBrowse() {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [equipment, setEquipment] = useState([]);
  const [activeTab, setActiveTab] = useState('All');
  
  const [cartCount, setCartCount] = useState(2);
  const [cartTotal, setCartTotal] = useState(2670);
  const [pulsingItem, setPulsingItem] = useState(null);
  const [bookedItem, setBookedItem] = useState(null);
  const [checkingOut, setCheckingOut] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const farmId = localStorage.getItem('farmId') || '00000000-0000-0000-0000-000000000000';
        const [prodRes, equipRes] = await Promise.all([
          getProducts(farmId),
          getEquipmentListings()
        ]);
        setProducts(prodRes.data || []);
        setEquipment(equipRes.data || []);
      } catch (err) {
        console.error(err);
      }
    };
    fetchData();
  }, []);

  const handleCartAddition = (item, price) => {
    setCartCount(c => c + 1);
    setCartTotal(t => t + price);
    setPulsingItem(item.id);
    
    // Bounce effect trigger handled by CSS class bindings
    setTimeout(() => {
      setPulsingItem(null);
    }, 1500);
  };

  const handleBookRental = (item) => {
    setBookedItem(item.id);
    setTimeout(() => {
      setBookedItem(null);
    }, 2000);
  };

  const handleCheckout = () => {
    setCheckingOut(true);
    setTimeout(() => {
      setCheckingOut(false);
      alert(`Proceeding to verified KhetSaathi escrow checkout: ₹${cartTotal.toLocaleString('en-IN')}`);
    }, 200);
  };

  // Combine products and equipment for curated view
  console.log("products is:", products, "isArray:", Array.isArray(products));
  console.log("equipment is:", equipment, "isArray:", Array.isArray(equipment));
  const allItems = [
    ...(Array.isArray(products) ? products : []).map(p => ({ ...p, type: 'product' })),
    ...(Array.isArray(equipment) ? equipment : []).map(e => ({ ...e, type: 'equipment' }))
  ];
  
  const filteredItems = activeTab === 'All' 
    ? allItems 
    : allItems.filter(item => {
        if (activeTab === 'Seeds & Plants') return item.category === 'seed';
        if (activeTab === 'Fertilizers') return item.category === 'fertilizer';
        if (activeTab === 'Pesticides') return item.category === 'pesticide' || item.category === 'herbicide' || item.category === 'fungicide';
        if (activeTab === 'Machinery Rental') return item.type === 'equipment';
        return true;
      });

  const getProductIcon = (category) => {
    switch (category) {
      case 'seed': return 'eco';
      case 'fertilizer': return 'compost';
      case 'pesticide': 
      case 'herbicide':
      case 'fungicide': return 'sanitizer';
      default: return 'category';
    }
  };

  const getProductBg = (category) => {
    switch (category) {
      case 'seed': return 'bg-primary-fixed text-on-primary-fixed';
      case 'fertilizer': return 'bg-primary-fixed text-on-primary-fixed';
      case 'pesticide': 
      case 'herbicide':
      case 'fungicide': return 'bg-secondary-fixed text-on-secondary-fixed';
      default: return 'bg-surface-variant text-on-surface-variant';
    }
  };

  const tabs = ['All', 'Seeds & Plants', 'Fertilizers', 'Pesticides', 'Machinery Rental', 'Solar Tools'];

  return (
    <div className="min-h-screen bg-surface text-on-surface flex flex-col relative">
      

      <main className="flex flex-col w-full pt-[72px] bg-surface flex-1">
        <section className="px-margin py-2">
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1 -mx-margin px-margin">
            {tabs.map(tab => (
              <button 
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`inline-flex items-center px-space-md py-space-xs rounded-full font-label-md text-label-md flex-shrink-0 transition-all ${activeTab === tab ? 'bg-primary text-on-primary font-bold shadow-sm' : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high active:scale-95'}`}
              >
                {tab}
              </button>
            ))}
          </div>
        </section>

        <div className="px-margin flex flex-col gap-space-md mt-1">
          <section className="w-full bg-surface-container-low rounded-xl p-space-md shadow-sm relative overflow-hidden">
            <div className="flex items-start gap-space-sm">
              <div className="w-10 h-10 rounded-full bg-primary-fixed flex items-center justify-center text-on-primary-fixed flex-shrink-0 shadow-xs">
                <span className="material-symbols-outlined text-[22px]">psychology_alt</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-space-xs mb-1">
                  <h2 className="font-label-lg text-label-lg text-primary font-bold truncate">Plot 1 Recommended Inputs</h2>
                  <span className="material-symbols-outlined text-outline text-[18px]">info</span>
                </div>
                <p className="font-body-sm text-body-sm text-on-surface-variant line-clamp-2">
                  Tailored to your <span className="font-semibold text-on-surface">Sharbati Wheat</span> calendar (Day 42/120, tillering) &amp; current Yellow Rust advisory.
                </p>
                <div className="mt-space-xs flex items-center gap-space-xs">
                  <a className="font-label-sm text-label-sm text-secondary font-bold flex items-center gap-0.5 hover:underline" href="#">
                    View Crop Schedule Plan
                    <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                  </a>
                </div>
              </div>
            </div>
          </section>

          <div className="flex items-center justify-between px-space-xs pt-1">
            <span className="font-headline-sm text-headline-sm text-on-surface">{activeTab === 'All' ? 'Curated for You' : activeTab}</span>
            <span className="font-label-sm text-label-sm text-on-surface-variant">Showing {filteredItems.length} of {allItems.length} items</span>
          </div>

          <section className="grid grid-cols-2 gap-space-sm pb-16">
            {filteredItems.map(item => (
              item.type === 'product' ? (
                <article key={item.id} className="bg-surface-container-lowest rounded-xl shadow-sm flex flex-col justify-between overflow-hidden group hover:shadow-md transition-shadow">
                  <div className="relative w-full aspect-square bg-surface-container-low flex items-center justify-center p-space-md">
                    <div className={`w-16 h-16 rounded-full flex items-center justify-center shadow-inner ${getProductBg(item.category)}`}>
                      <span className="material-symbols-outlined text-[36px]">{getProductIcon(item.category)}</span>
                    </div>
                    {item.rank_score && item.rank_score > 0.8 && (
                      <div className="absolute top-2 left-2 bg-primary text-on-primary px-2 py-0.5 rounded-full font-label-sm text-label-sm shadow-sm flex items-center gap-1">
                        <span>★</span>
                        <span>AI Pick</span>
                      </div>
                    )}
                    {item.category.includes('cide') && (
                      <div className="absolute top-2 left-2 bg-secondary-container text-on-secondary-container px-2 py-0.5 rounded-full font-label-sm text-label-sm shadow-sm flex items-center gap-1 font-bold">
                        <span className="material-symbols-outlined text-[12px]">shield</span>
                        <span className="capitalize">{item.category}</span>
                      </div>
                    )}
                  </div>
                  <div className="p-space-sm flex flex-col flex-1 justify-between gap-space-xs">
                    <div>
                      <h3 className="font-label-md text-label-md text-on-surface font-bold line-clamp-2 leading-tight">
                        {item.name}
                      </h3>
                      <p className="font-label-sm text-label-sm text-on-surface-variant truncate mt-0.5">
                        {item.vendor_id} • <span className="text-secondary font-bold">4.9 ★</span>
                      </p>
                      <div className="inline-flex items-center gap-1 bg-surface-container px-1.5 py-0.5 rounded mt-1.5 text-on-primary-fixed-variant">
                        <span className="material-symbols-outlined text-[14px] text-secondary">bolt</span>
                        <span className="font-label-sm text-[11px] leading-tight font-semibold">Fast Delivery</span>
                      </div>
                    </div>
                    <div className="pt-space-xs">
                      <div className="flex items-baseline gap-1.5">
                        <span className="font-headline-sm text-headline-sm text-on-surface font-bold">₹{item.price}</span>
                      </div>
                      <button 
                        className={`w-full mt-space-xs py-2 min-h-[44px] rounded-lg font-label-md text-label-md flex items-center justify-center gap-1 active:scale-95 transition-all shadow-xs ${pulsingItem === item.id ? 'bg-primary-container text-on-primary-container' : 'bg-secondary text-on-secondary'}`}
                        onClick={() => handleCartAddition(item, item.price)} 
                        type="button"
                      >
                        {pulsingItem === item.id ? (
                          <>
                            <span className="material-symbols-outlined text-[18px]">done</span>
                            <span>Added</span>
                          </>
                        ) : (
                          <>
                            <span className="material-symbols-outlined text-[18px]">add</span>
                            <span>Add</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </article>
              ) : (
                <article key={item.id} className="bg-surface-container-lowest rounded-xl shadow-sm flex flex-col justify-between overflow-hidden group hover:shadow-md transition-shadow">
                  <div className="relative w-full aspect-square bg-surface-container-low overflow-hidden">
                    <div className="w-full h-full bg-surface-variant flex items-center justify-center">
                      <span className="material-symbols-outlined text-[48px] text-on-surface-variant">agriculture</span>
                    </div>
                    <div className="absolute top-2 left-2 bg-tertiary-container text-on-tertiary-container px-2 py-0.5 rounded-full font-label-sm text-label-sm shadow-sm flex items-center gap-1 font-bold">
                      <span className="material-symbols-outlined text-[12px]">agriculture</span>
                      <span>Rental</span>
                    </div>
                  </div>
                  <div className="p-space-sm flex flex-col flex-1 justify-between gap-space-xs">
                    <div>
                      <h3 className="font-label-md text-label-md text-on-surface font-bold line-clamp-2 leading-tight">
                        {item.equipment_type}
                      </h3>
                      <p className="font-label-sm text-label-sm text-on-surface-variant truncate mt-0.5">
                        {item.owner_id} • <span className="text-secondary font-bold">4.7 ★</span>
                      </p>
                      <div className="inline-flex items-center gap-1 bg-surface-container px-1.5 py-0.5 rounded mt-1.5 text-on-surface-variant">
                        <span className="material-symbols-outlined text-[14px]">near_me</span>
                        <span className="font-label-sm text-[11px] leading-tight font-semibold">Local</span>
                      </div>
                    </div>
                    <div className="pt-space-xs">
                      <div className="flex items-baseline gap-1">
                        <span className="font-headline-sm text-headline-sm text-on-surface font-bold">₹{item.daily_rate}</span>
                        <span className="font-label-sm text-label-sm text-outline">/ day</span>
                      </div>
                      <button 
                        className={`w-full mt-space-xs py-2 min-h-[44px] rounded-lg font-label-md text-label-md flex items-center justify-center gap-1 active:scale-95 transition-all shadow-xs font-semibold ${bookedItem === item.id ? 'bg-primary text-on-primary' : 'bg-primary-container text-on-primary-container'}`}
                        onClick={() => handleBookRental(item)} 
                        type="button"
                      >
                        {bookedItem === item.id ? (
                          <>
                            <span className="material-symbols-outlined text-[18px]">check_circle</span>
                            <span>Reserved</span>
                          </>
                        ) : (
                          <>
                            <span className="material-symbols-outlined text-[18px]">calendar_today</span>
                            <span>Rent</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </article>
              )
            ))}
          </section>
        </div>
      </main>

      <aside id="cart-bar" className={`fixed bottom-20 left-4 right-4 z-40 bg-inverse-surface text-inverse-on-surface rounded-xl p-space-md shadow-xl flex items-center justify-between transform transition-all duration-300 ${checkingOut ? 'opacity-80 scale-95' : ''}`}>
        <div className="flex items-center gap-space-sm">
          <div className="w-10 h-10 rounded-full bg-secondary text-on-secondary flex items-center justify-center flex-shrink-0 relative">
            <span className="material-symbols-outlined text-[20px]">shopping_basket</span>
            <span className="absolute -top-1 -right-1 bg-primary text-on-primary text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center" id="cart-badge-count">{cartCount}</span>
          </div>
          <div className="flex flex-col">
            <span className="font-label-md text-label-md text-inverse-on-surface font-bold" id="cart-item-title">{cartCount} items in Cart</span>
            <span className="font-label-sm text-label-sm text-primary-fixed-dim" id="cart-total-price">Total: ₹{cartTotal.toLocaleString('en-IN')}</span>
          </div>
        </div>
        <button 
          aria-label="Proceed to Checkout" 
          onClick={handleCheckout}
          className="bg-secondary px-space-md py-space-xs min-h-[44px] rounded-lg font-label-md text-label-md text-on-secondary font-bold flex items-center gap-1 shadow hover:bg-secondary-container active:scale-95 transition-all"
          type="button"
        >
          <span>Checkout</span>
          <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
        </button>
      </aside>

      
    </div>
  );
}
