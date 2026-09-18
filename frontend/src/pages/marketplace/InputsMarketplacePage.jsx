import { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  ShoppingCart, Package, IndianRupee, Star, TrendingUp, 
  Search, Filter, Plus, Minus, X, CheckCircle 
} from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

export default function InputsMarketplacePage() {
  const [farmId, setFarmId] = useState('FARM-001'); // Default for demo
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  
  const [cart, setCart] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  
  const [orderProcessing, setOrderProcessing] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(null);
  const [error, setError] = useState('');

  const fetchProducts = async () => {
    if (!farmId) return;
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE}/api/v1/marketplace/products?farm_id=${farmId}`);
      setProducts(res.data);
      setError('');
    } catch (err) {
      setProducts([]);
      setError(err.response?.data?.detail || 'Unable to load marketplace products.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [farmId]);

  const addToCart = (product) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item => item.id === product.id ? { ...item, qty: item.qty + 1 } : item);
      }
      return [...prev, { ...product, qty: 1 }];
    });
  };

  const updateQty = (id, delta) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        const newQty = Math.max(0, item.qty + delta);
        return { ...item, qty: newQty };
      }
      return item;
    }).filter(item => item.qty > 0));
  };

  const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    setOrderProcessing(true);
    
    try {
      // In reality, we'd send the whole cart or loop over. For demo API which takes single product_id:
      // We'll just submit the first item to the API to simulate order creation
      const res = await axios.post(`${API_BASE}/api/v1/marketplace/order`, {
        farm_id: farmId,
        product_id: cart[0].id,
        qty: cart[0].qty
      });
      setOrderSuccess(res.data);
      setCart([]);
      setIsCartOpen(false);
    } catch (err) {
      setError(err.response?.data?.detail || 'Order could not be created.');
    } finally {
      setOrderProcessing(false);
    }
  };

  return (
    <div className="space-y-6 relative min-h-screen">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 border-b border-slate-800 pb-4 sm:flex-row sm:items-end">
        <div>
          <h1 className="text-3xl font-bold text-white">Agri-Inputs Marketplace</h1>
          <p className="mt-1 text-slate-300">Recommended seeds, fertilizers, and crop inputs tailored to your farm.</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="bg-slate-800/50 p-1.5 rounded-lg border border-slate-700/50 flex items-center">
            <span className="text-xs text-slate-500 px-2">Farm ID:</span>
            <input
              value={farmId} onChange={e => setFarmId(e.target.value)}
              className="bg-transparent border-none text-sm text-white focus:outline-none w-24 font-mono"
            />
          </div>
          <button
            onClick={() => setIsCartOpen(true)}
            className="relative rounded-lg border border-slate-700 bg-slate-900 p-2 text-slate-200 transition hover:border-slate-500 hover:bg-slate-800"
          >
            <ShoppingCart className="w-6 h-6" />
            {cart.length > 0 && (
              <span className="absolute -top-2 -right-2 w-5 h-5 bg-emerald-500 text-white text-xs font-bold rounded-full flex items-center justify-center shadow-lg shadow-emerald-500/40">
                {cart.reduce((sum, item) => sum + item.qty, 0)}
              </span>
            )}
          </button>
        </div>
      </div>

      {orderSuccess && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 p-4 rounded-xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CheckCircle className="w-6 h-6 text-emerald-400" />
            <div>
              <p className="text-emerald-400 font-bold">Order Placed Successfully!</p>
              <p className="text-sm text-slate-300">Order ID: {orderSuccess.id} | Expected Delivery: {orderSuccess.delivery_eta}</p>
            </div>
          </div>
          <button onClick={() => setOrderSuccess(null)} className="text-slate-400 hover:text-white"><X className="w-5 h-5"/></button>
        </div>
      )}

      {/* Filters/Search (Visual Only) */}
      <div className="flex gap-4">
        <div className="flex-1 relative">
          <Search className="w-5 h-5 absolute left-3 top-2.5 text-slate-500" />
          <input 
            placeholder="Search inputs..." 
            className="w-full bg-slate-800/50 border border-slate-700 rounded-lg pl-10 pr-4 py-2 focus:ring-2 focus:ring-emerald-500/50 outline-none text-white text-sm"
          />
        </div>
        <button className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg flex items-center gap-2 text-slate-300 hover:bg-slate-700 transition-colors text-sm font-medium">
          <Filter className="w-4 h-4" /> Category
        </button>
      </div>

      {/* Product Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {loading ? (
          <div className="col-span-full py-20 text-center text-slate-500">Loading recommendations...</div>
        ) : products.map(product => (
          <div key={product.id} className="bg-slate-800/40 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-5 shadow-xl flex flex-col hover:border-emerald-500/30 transition-all group">
            <div className="flex justify-between items-start mb-4">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 bg-slate-900 px-2 py-1 rounded">
                {product.category}
              </span>
              <div className="flex flex-col items-end">
                <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                  <Star className="w-3 h-3 fill-emerald-400" /> {product.ranking_score.toFixed(1)} AI Score
                </span>
              </div>
            </div>
            
            <div className="h-32 mb-4 bg-slate-900/50 rounded-xl flex items-center justify-center border border-slate-700">
              <Package className="w-12 h-12 text-slate-600 group-hover:text-emerald-400/50 transition-colors" />
            </div>
            
            <h3 className="text-white font-bold text-lg leading-tight mb-1">{product.name}</h3>
            <p className="text-slate-400 text-xs mb-3">Vendor: {product.vendor_id}</p>
            
            {product.predicted_yield_impact_score > 0 && (
              <div className="mb-4 inline-flex items-center gap-1.5 px-2 py-1 rounded bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-medium w-max">
                <TrendingUp className="w-3 h-3" />
                Yield Impact: +{product.predicted_yield_impact_score}%
              </div>
            )}
            
            <div className="mt-auto pt-4 border-t border-slate-700/50 flex items-center justify-between">
              <div className="flex items-center text-xl font-bold text-white">
                <IndianRupee className="w-4 h-4 mr-0.5 text-slate-400" />
                {product.price}
              </div>
              <button
                onClick={() => addToCart(product)}
                className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-sm font-medium text-emerald-300 transition hover:bg-emerald-500/15"
              >
                Add to Cart
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Cart Drawer Overlay */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsCartOpen(false)} />
          
          <div className="relative w-full max-w-md bg-slate-800 h-full border-l border-slate-700 shadow-2xl flex flex-col transform transition-transform">
            <div className="p-6 border-b border-slate-700 flex justify-between items-center bg-slate-900/50">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <ShoppingCart className="w-5 h-5 text-emerald-400" /> Your Cart
              </h2>
              <button onClick={() => setIsCartOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {cart.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-500">
                  <Package className="w-12 h-12 mb-2 opacity-50" />
                  <p>Your cart is empty</p>
                </div>
              ) : cart.map((item, i) => (
                <div key={i} className="flex items-center gap-4 bg-slate-900/50 p-3 rounded-xl border border-slate-700">
                  <div className="w-12 h-12 bg-slate-800 rounded flex items-center justify-center border border-slate-600">
                    <Package className="w-6 h-6 text-slate-400" />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-white text-sm font-bold truncate">{item.name}</h4>
                    <p className="text-emerald-400 text-xs font-semibold">₹{item.price}</p>
                  </div>
                  <div className="flex items-center gap-2 bg-slate-800 rounded-lg p-1 border border-slate-600">
                    <button onClick={() => updateQty(item.id, -1)} className="p-1 hover:text-emerald-400 text-slate-300"><Minus className="w-3 h-3"/></button>
                    <span className="text-xs font-mono w-4 text-center text-white">{item.qty}</span>
                    <button onClick={() => updateQty(item.id, 1)} className="p-1 hover:text-emerald-400 text-slate-300"><Plus className="w-3 h-3"/></button>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="p-6 border-t border-slate-700 bg-slate-900/80">
              <div className="flex justify-between items-center mb-4">
                <span className="text-slate-400 font-medium">Subtotal</span>
                <span className="text-xl font-bold text-white">₹{cartTotal.toLocaleString()}</span>
              </div>
              <button
                onClick={handleCheckout}
                disabled={cart.length === 0 || orderProcessing}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 font-medium text-emerald-300 transition hover:bg-emerald-500/15 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {orderProcessing ? <RefreshCw className="w-5 h-5 animate-spin" /> : 'Checkout via API'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
