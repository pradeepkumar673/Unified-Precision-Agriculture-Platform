import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { getProducts, getEquipmentListings, createProduct, createEquipmentListing } from '../../api/marketplaceApi';

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

  // Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [newListingType, setNewListingType] = useState('product'); // 'product' or 'equipment'
  const [formData, setFormData] = useState({
    name: '', category: 'seed', price: '', stock: '',
    equipment_type: '', daily_rate: ''
  });

  const wsRef = useRef(null);

  useEffect(() => {
    const farmId = localStorage.getItem('farmId') || '00000000-0000-0000-0000-000000000000';
    
    const fetchData = async () => {
      try {
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

    // WebSocket connection for real-time updates
    const wsUrl = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000').replace('http', 'ws');
    const ws = new WebSocket(`${wsUrl}/api/v1/marketplace/ws/${farmId}`);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log('WebSocket connected to real-time marketplace');
    };

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        console.log("Real-time event received:", message);
        if (message.type === 'NEW_PRODUCT') {
          setProducts(prev => [message.data, ...prev]);
        } else if (message.type === 'NEW_EQUIPMENT') {
          setEquipment(prev => [message.data, ...prev]);
        }
      } catch (err) {
        console.error('Failed to parse websocket message', err);
      }
    };

    ws.onclose = () => {
      console.log('WebSocket disconnected');
    };

    return () => {
      if (wsRef.current) wsRef.current.close();
    };
  }, []);

  const handleCartAddition = (item, price) => {
    setCartCount(c => c + 1);
    setCartTotal(t => t + price);
    setPulsingItem(item.id);
    
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

  const handleCreateListing = async (e) => {
    e.preventDefault();
    try {
      if (newListingType === 'product') {
        await createProduct({
          name: formData.name,
          category: formData.category,
          price: parseFloat(formData.price),
          vendor_id: 'Farmer ' + Math.floor(Math.random()*1000), // Real identity in prod
          stock: parseInt(formData.stock, 10)
        });
      } else {
        await createEquipmentListing({
          equipment_type: formData.equipment_type,
          owner_id: 'Farmer ' + Math.floor(Math.random()*1000), // Real identity in prod
          latitude: 0,
          longitude: 0,
          daily_rate: parseFloat(formData.daily_rate),
          available: true
        });
      }
      setShowAddModal(false);
      setFormData({ name: '', category: 'seed', price: '', stock: '', equipment_type: '', daily_rate: '' });
      // We do NOT manually update state here. We wait for the real-time WebSocket broadcast!
    } catch (err) {
      console.error(err);
      alert("Failed to create listing");
    }
  };

  // Combine products and equipment for curated view
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
        <section className="px-margin py-2 flex justify-between items-center">
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1 -mx-margin px-margin flex-1">
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
          <button 
            onClick={() => setShowAddModal(true)}
            className="ml-2 flex-shrink-0 bg-tertiary text-on-tertiary px-3 py-1 rounded-full font-bold shadow flex items-center gap-1 hover:bg-tertiary-container hover:text-on-tertiary-container transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
            List
          </button>
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
              </div>
            </div>
          </section>

          <div className="flex items-center justify-between px-space-xs pt-1">
            <span className="font-headline-sm text-headline-sm text-on-surface">{activeTab === 'All' ? 'Curated for You' : activeTab}</span>
            <span className="font-label-sm text-label-sm text-on-surface-variant">Showing {filteredItems.length} items</span>
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
                  </div>
                  <div className="p-space-sm flex flex-col flex-1 justify-between gap-space-xs">
                    <div>
                      <h3 className="font-label-md text-label-md text-on-surface font-bold line-clamp-2 leading-tight">
                        {item.name}
                      </h3>
                      <p className="font-label-sm text-label-sm text-on-surface-variant truncate mt-0.5">
                        {item.vendor_id} • <span className="text-secondary font-bold">4.9 ★</span>
                      </p>
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

      {/* Add Listing Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-surface rounded-2xl w-full max-w-sm p-space-md shadow-xl">
            <h2 className="text-title-lg font-bold mb-4">List an Item</h2>
            <div className="flex gap-2 mb-4">
              <button 
                className={`flex-1 py-2 rounded-lg font-bold ${newListingType === 'product' ? 'bg-primary text-on-primary' : 'bg-surface-container text-on-surface'}`}
                onClick={() => setNewListingType('product')}
              >
                Product
              </button>
              <button 
                className={`flex-1 py-2 rounded-lg font-bold ${newListingType === 'equipment' ? 'bg-primary text-on-primary' : 'bg-surface-container text-on-surface'}`}
                onClick={() => setNewListingType('equipment')}
              >
                Equipment
              </button>
            </div>
            
            <form onSubmit={handleCreateListing} className="flex flex-col gap-3">
              {newListingType === 'product' ? (
                <>
                  <input required placeholder="Product Name (e.g., Sharbati Wheat Seeds)" className="w-full p-3 rounded-xl bg-surface-container-lowest border border-outline-variant" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                  <select required className="w-full p-3 rounded-xl bg-surface-container-lowest border border-outline-variant" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}>
                    <option value="seed">Seed</option>
                    <option value="fertilizer">Fertilizer</option>
                    <option value="pesticide">Pesticide</option>
                  </select>
                  <input required type="number" placeholder="Price (₹)" className="w-full p-3 rounded-xl bg-surface-container-lowest border border-outline-variant" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} />
                  <input required type="number" placeholder="Stock Available" className="w-full p-3 rounded-xl bg-surface-container-lowest border border-outline-variant" value={formData.stock} onChange={e => setFormData({...formData, stock: e.target.value})} />
                </>
              ) : (
                <>
                  <input required placeholder="Equipment Type (e.g., John Deere Tractor)" className="w-full p-3 rounded-xl bg-surface-container-lowest border border-outline-variant" value={formData.equipment_type} onChange={e => setFormData({...formData, equipment_type: e.target.value})} />
                  <input required type="number" placeholder="Daily Rate (₹)" className="w-full p-3 rounded-xl bg-surface-container-lowest border border-outline-variant" value={formData.daily_rate} onChange={e => setFormData({...formData, daily_rate: e.target.value})} />
                </>
              )}
              <div className="flex gap-2 mt-4">
                <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 py-3 rounded-xl font-bold bg-surface-variant text-on-surface-variant">Cancel</button>
                <button type="submit" className="flex-1 py-3 rounded-xl font-bold bg-primary text-on-primary shadow-md">Post Listing</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
