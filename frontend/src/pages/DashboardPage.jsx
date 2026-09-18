import { useState, useEffect } from 'react';
import { 
  Sprout, Bell, ShoppingCart, IndianRupee, CloudRain, 
  Map, TrendingUp, Calendar, ArrowRight
} from 'lucide-react';
import { Link } from 'react-router-dom';
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

export default function DashboardPage() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const farmId = localStorage.getItem('farmId');
        if (!farmId) throw new Error('No farm selected');
        
        // Parallel fetch real data
        const [plansRes, alertsRes, ledgerRes, productsRes] = await Promise.allSettled([
          axios.get(`${API_BASE}/api/v1/planning/crop-plan/${farmId}`),
          axios.get(`${API_BASE}/api/v1/community/alerts/${farmId}`),
          axios.get(`${API_BASE}/api/v1/finance/ledger/${farmId}`),
          axios.get(`${API_BASE}/api/v1/marketplace/products?farm_id=${farmId}`),
        ]);
        
        const plans = plansRes.status === 'fulfilled' ? plansRes.value.data : [];
        const alerts = alertsRes.status === 'fulfilled' ? alertsRes.value.data : [];
        const ledger = ledgerRes.status === 'fulfilled' ? ledgerRes.value.data : [];
        const products = productsRes.status === 'fulfilled' ? productsRes.value.data : [];
        const released = ledger.filter(t => t.status === 'released');
        const walletBalance = released.reduce((sum, t) => sum + Number(t.amount || 0), 0);
        
        const unreadAlerts = Array.isArray(alerts) ? alerts.filter(a => !a.read).slice(0, 3) : [];

        setStats({
          activeCropPlans: Array.isArray(plans) ? plans.length : 0,
          unreadAlerts: unreadAlerts.length,
          pendingOrders: ledger.filter(t => t.status === 'pending' || t.status === 'escrow_held').length,
          walletBalance,
          recentTransactions: ledger.slice(0, 4).map(t => ({
            id: t.id,
            type: t.tag || t.type,
            amount: `${t.status === 'released' ? '+' : '-'}${Number(t.amount || 0).toLocaleString()}`,
            date: new Date(t.created_at).toLocaleDateString(),
          })),
          alerts: unreadAlerts.map(a => ({
            text: a.message || a.title || 'Alert',
            type: a.severity === 'high' ? 'warning' : 'success'
          })).concat(unreadAlerts.length === 0 ? [{ text: `No unread alerts. ${products.length} marketplace products available.`, type: 'success' }] : [])
        });
      } catch (err) {
        console.error('Dashboard fetch error:', err);
        setStats({
          activeCropPlans: 0, unreadAlerts: 0, pendingOrders: 0, walletBalance: 0,
          recentTransactions: [], alerts: [{ text: 'Unable to load dashboard data.', type: 'warning' }]
        });
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  if (loading) {
    return <div className="py-20 flex justify-center text-slate-500">Loading Dashboard...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white">Welcome back, Farmer</h1>
        <p className="mt-1 text-slate-300">Here is the status of your farming operations today.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/80 p-5 shadow-[0_10px_30px_rgba(2,6,23,0.35)]">
          <div className="absolute -right-4 -top-4 rounded-full bg-emerald-500/10 p-4"><Map className="h-8 w-8 text-emerald-400 opacity-70"/></div>
          <p className="mb-1 text-sm font-medium text-slate-400">Active Crop Plans</p>
          <p className="text-3xl font-bold text-white">{stats.activeCropPlans}</p>
        </div>
        
        <div className="relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/80 p-5 shadow-[0_10px_30px_rgba(2,6,23,0.35)]">
          <div className="absolute -right-4 -top-4 rounded-full bg-amber-500/10 p-4"><Bell className="h-8 w-8 text-amber-400 opacity-70"/></div>
          <p className="mb-1 text-sm font-medium text-slate-400">Unread Alerts</p>
          <p className="text-3xl font-bold text-white">{stats.unreadAlerts}</p>
        </div>

        <div className="relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/80 p-5 shadow-[0_10px_30px_rgba(2,6,23,0.35)]">
          <div className="absolute -right-4 -top-4 rounded-full bg-blue-500/10 p-4"><ShoppingCart className="h-8 w-8 text-blue-400 opacity-70"/></div>
          <p className="mb-1 text-sm font-medium text-slate-400">Pending Orders</p>
          <p className="text-3xl font-bold text-white">{stats.pendingOrders}</p>
        </div>

        <div className="relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/80 p-5 shadow-[0_10px_30px_rgba(2,6,23,0.35)]">
          <div className="absolute -right-4 -top-4 rounded-full bg-teal-500/10 p-4"><IndianRupee className="h-8 w-8 text-teal-400 opacity-70"/></div>
          <p className="mb-1 text-sm font-medium text-slate-400">Escrow / Wallet</p>
          <p className="text-3xl font-bold text-white">₹{stats.walletBalance.toLocaleString()}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Quick Actions */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6 shadow-[0_10px_30px_rgba(2,6,23,0.35)]">
          <h2 className="mb-4 text-lg font-bold text-white">Quick Actions</h2>
          <div className="space-y-3">
            <Link to="/vision/satellite" className="group flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950/60 p-4 transition hover:border-slate-700">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-lg"><CloudRain className="w-5 h-5"/></div>
                <div>
                  <p className="font-semibold text-slate-200">Check Crop Stress (NDVI)</p>
                  <p className="text-xs text-slate-500">Run satellite analysis</p>
                </div>
              </div>
              <ArrowRight className="w-5 h-5 text-slate-600 group-hover:text-emerald-400 transition-colors" />
            </Link>
            
            <Link to="/ai/assistant" className="flex items-center justify-between p-4 bg-slate-900 border border-slate-700 rounded-xl hover:border-blue-500/50 transition-colors group">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500/20 text-blue-400 rounded-lg"><Sprout className="w-5 h-5"/></div>
                <div>
                  <p className="font-semibold text-slate-200">Ask AI Agronomist</p>
                  <p className="text-xs text-slate-500">Voice or photo diagnosis</p>
                </div>
              </div>
              <ArrowRight className="w-5 h-5 text-slate-600 group-hover:text-blue-400 transition-colors" />
            </Link>

            <Link to="/planning/crop-plan" className="flex items-center justify-between p-4 bg-slate-900 border border-slate-700 rounded-xl hover:border-orange-500/50 transition-colors group">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-500/20 text-orange-400 rounded-lg"><Calendar className="w-5 h-5"/></div>
                <div>
                  <p className="font-semibold text-slate-200">Next Season Plan</p>
                  <p className="text-xs text-slate-500">Generate Rabi recommendations</p>
                </div>
              </div>
              <ArrowRight className="w-5 h-5 text-slate-600 group-hover:text-orange-400 transition-colors" />
            </Link>
          </div>
        </div>

        {/* Notifications & Ledger */}
        <div className="space-y-6">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6 shadow-[0_10px_30px_rgba(2,6,23,0.35)]">
             <h2 className="mb-4 text-lg font-bold text-white">Recent Alerts</h2>
             <div className="space-y-3">
               {stats.alerts.map((a, i) => (
                 <div key={i} className={`p-3 rounded-lg border flex gap-3 text-sm ${
                   a.type === 'warning' ? 'bg-amber-500/10 border-amber-500/20 text-amber-400' : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                 }`}>
                   <Bell className="w-4 h-4 shrink-0 mt-0.5" />
                   {a.text}
                 </div>
               ))}
             </div>
          </div>
          
          <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6 shadow-[0_10px_30px_rgba(2,6,23,0.35)]">
             <h2 className="mb-4 flex items-center justify-between text-lg font-bold text-white">
               <span>Recent Ledger Activity</span>
               <Link to="/finance/ledger" className="text-xs text-teal-400 hover:underline">View All</Link>
             </h2>
             <div className="space-y-4">
               {stats.recentTransactions.map((t, i) => (
                 <div key={i} className="flex justify-between items-center border-b border-slate-700/50 pb-3 last:border-0 last:pb-0">
                   <div>
                     <p className="text-sm font-medium text-slate-200">{t.type}</p>
                     <p className="text-xs text-slate-500">{t.date} • {t.id}</p>
                   </div>
                   <p className={`font-bold ${t.amount.startsWith('+') ? 'text-emerald-400' : 'text-slate-300'}`}>
                     {t.amount}
                   </p>
                 </div>
               ))}
             </div>
          </div>
        </div>

      </div>
    </div>
  );
}
