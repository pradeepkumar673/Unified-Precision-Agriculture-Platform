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
        // Fetch first farm from the system
        const profileRes = await axios.post(`${API_BASE}/api/v1/farm/profile`, {
          name: 'My Farm', land_size_acres: 3, soil_type: 'loam', water_source: 'borewell',
          latitude: 18.5, longitude: 73.8, equipment_owned: ['tractor'],
          annual_income_range: '1L_5L', crop_history: []
        }).catch(() => null);
        const farmId = profileRes?.data?.id;
        
        // Parallel fetch real data
        const [plansRes, alertsRes, ordersRes] = await Promise.allSettled([
          farmId ? axios.get(`${API_BASE}/api/v1/planning/crop-plan/${farmId}`) : Promise.resolve({ data: [] }),
          farmId ? axios.get(`${API_BASE}/api/v1/community/alerts/${farmId}`) : Promise.resolve({ data: [] }),
          axios.get(`${API_BASE}/api/v1/marketplace/products?farm_id=${farmId || ''}`),
        ]);
        
        const plans = plansRes.status === 'fulfilled' ? plansRes.value.data : [];
        const alerts = alertsRes.status === 'fulfilled' ? alertsRes.value.data : [];
        const orders = ordersRes.status === 'fulfilled' ? ordersRes.value.data : [];
        
        const unreadAlerts = Array.isArray(alerts) ? alerts.filter(a => !a.read).slice(0, 3) : [];

        setStats({
          activeCropPlans: Array.isArray(plans) ? plans.length : 0,
          unreadAlerts: unreadAlerts.length,
          pendingOrders: Array.isArray(orders) ? orders.filter(o => o.status === 'placed').length : 0,
          walletBalance: 45000,
          recentTransactions: [
            { id: 'TXN-9021', type: 'Loan Disbursement', amount: '+45,000', date: 'Today' },
            { id: 'TXN-9020', type: 'DAP Fertilizer', amount: '-1,500', date: 'Yesterday' }
          ],
          alerts: unreadAlerts.map(a => ({
            text: a.message || a.title || 'Alert',
            type: a.severity === 'high' ? 'warning' : 'success'
          })).concat(unreadAlerts.length === 0 ? [
            { text: 'All systems normal. No pending alerts.', type: 'success' }
          ] : [])
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
        <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-teal-500">
          Welcome back, Farmer
        </h1>
        <p className="text-slate-400 mt-1">Here is the status of your farming operations today.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Stat Cards */}
        <div className="bg-slate-800/40 backdrop-blur-xl border border-slate-700/50 p-5 rounded-2xl shadow-lg relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 p-4 bg-emerald-500/10 rounded-full group-hover:scale-110 transition-transform"><Map className="w-8 h-8 text-emerald-400 opacity-50"/></div>
          <p className="text-slate-400 text-sm font-medium mb-1">Active Crop Plans</p>
          <p className="text-3xl font-bold text-white">{stats.activeCropPlans}</p>
        </div>
        
        <div className="bg-slate-800/40 backdrop-blur-xl border border-slate-700/50 p-5 rounded-2xl shadow-lg relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 p-4 bg-amber-500/10 rounded-full group-hover:scale-110 transition-transform"><Bell className="w-8 h-8 text-amber-400 opacity-50"/></div>
          <p className="text-slate-400 text-sm font-medium mb-1">Unread Alerts</p>
          <p className="text-3xl font-bold text-white">{stats.unreadAlerts}</p>
        </div>

        <div className="bg-slate-800/40 backdrop-blur-xl border border-slate-700/50 p-5 rounded-2xl shadow-lg relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 p-4 bg-blue-500/10 rounded-full group-hover:scale-110 transition-transform"><ShoppingCart className="w-8 h-8 text-blue-400 opacity-50"/></div>
          <p className="text-slate-400 text-sm font-medium mb-1">Pending Orders</p>
          <p className="text-3xl font-bold text-white">{stats.pendingOrders}</p>
        </div>

        <div className="bg-slate-800/40 backdrop-blur-xl border border-slate-700/50 p-5 rounded-2xl shadow-lg relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 p-4 bg-teal-500/10 rounded-full group-hover:scale-110 transition-transform"><IndianRupee className="w-8 h-8 text-teal-400 opacity-50"/></div>
          <p className="text-slate-400 text-sm font-medium mb-1">Escrow / Wallet</p>
          <p className="text-3xl font-bold text-white">₹{stats.walletBalance.toLocaleString()}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Quick Actions */}
        <div className="bg-slate-800/40 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6 shadow-xl">
          <h2 className="text-lg font-bold text-white mb-4">Quick Actions</h2>
          <div className="space-y-3">
            <Link to="/vision/satellite" className="flex items-center justify-between p-4 bg-slate-900 border border-slate-700 rounded-xl hover:border-emerald-500/50 transition-colors group">
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
          <div className="bg-slate-800/40 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6 shadow-xl">
             <h2 className="text-lg font-bold text-white mb-4">Recent Alerts</h2>
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
          
          <div className="bg-slate-800/40 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6 shadow-xl">
             <h2 className="text-lg font-bold text-white mb-4 flex justify-between items-center">
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
