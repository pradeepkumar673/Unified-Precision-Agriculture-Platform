import { useState } from 'react';
import { Link, useLocation, Outlet } from 'react-router-dom';
import { 
  Sprout, Map, TestTube, CloudRain, Cpu, BarChart3, 
  ShoppingCart, Landmark, FileCheck, Users, Menu, X, Home
} from 'lucide-react';
import { useAuth } from '../App'; // We will define this context in App.jsx

const NAVIGATION = [
  {
    group: "Dashboard",
    icon: <Home className="w-5 h-5" />,
    links: [
      { name: "Overview", path: "/" }
    ]
  },
  {
    group: "Farm Base",
    icon: <Sprout className="w-5 h-5" />,
    links: [
      { name: "Farm Profile", path: "/farm/profile" },
      { name: "Boundary", path: "/farm/boundary" }
    ]
  },
  {
    group: "Crop Planning",
    icon: <Map className="w-5 h-5" />,
    links: [
      { name: "Crop Plan", path: "/planning/crop-plan" },
      { name: "Rotation", path: "/planning/rotation" },
      { name: "VRA", path: "/planning/variable-rate" }
    ]
  },
  {
    group: "Health & Disease",
    icon: <TestTube className="w-5 h-5" />,
    links: [
      { name: "Diagnostics", path: "/health/disease" },
      { name: "Surveillance", path: "/health/pest-risk" },
      { name: "Livestock", path: "/health/livestock" }
    ]
  },
  {
    group: "Water & Soil",
    icon: <CloudRain className="w-5 h-5" />,
    links: [
      { name: "Irrigation", path: "/water-soil/irrigation" },
      { name: "Soil Map", path: "/water-soil/soil-map" }
    ]
  },
  {
    group: "Vision & Forecast",
    icon: <Cpu className="w-5 h-5" />,
    links: [
      { name: "Vision AI", path: "/vision/satellite" },
      { name: "Markets", path: "/vision/price-forecast" },
      { name: "Yield/Risk", path: "/vision/yield-climate" }
    ]
  },
  {
    group: "Marketplace",
    icon: <ShoppingCart className="w-5 h-5" />,
    links: [
      { name: "Inputs", path: "/marketplace/inputs" },
      { name: "Rentals", path: "/marketplace/rentals" },
      { name: "B2B Exchange", path: "/marketplace/exchange" }
    ]
  },
  {
    group: "Finance",
    icon: <Landmark className="w-5 h-5" />,
    links: [
      { name: "Credit", path: "/finance/credit-loan" },
      { name: "Ledger", path: "/finance/ledger" },
      { name: "Insurance", path: "/finance/insurance-warehouse" }
    ]
  },
  {
    group: "Gov Compliance",
    icon: <FileCheck className="w-5 h-5" />,
    links: [
      { name: "Gov Schemes", path: "/gov/schemes" },
      { name: "Doc Vault", path: "/gov/documents" }
    ]
  },
  {
    group: "Community",
    icon: <Users className="w-5 h-5" />,
    links: [
      { name: "Season Report", path: "/community/season-report" },
      { name: "Reputation", path: "/community/grower-score" },
      { name: "FPO Hub", path: "/community/fpo" }
    ]
  },
  {
    group: "Advanced AI",
    icon: <BarChart3 className="w-5 h-5" />,
    links: [
      { name: "Voice AI", path: "/ai/assistant" },
      { name: "Causal Lab", path: "/ai/causal-lab" },
      { name: "Fed FL", path: "/ai/federated-learning" }
    ]
  }
];

export default function MainLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const location = useLocation();
  const { logout } = useAuth();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-emerald-500/30 flex overflow-hidden">
      
      {/* Mobile Sidebar Overlay */}
      {!sidebarOpen && (
        <div 
          className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setSidebarOpen(true)}
        />
      )}

      {/* Sidebar */}
      <aside 
        className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-slate-900 border-r border-slate-800 flex flex-col transition-transform duration-300 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        <div className="h-16 flex items-center justify-between px-4 border-b border-slate-800 shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center font-bold text-white shadow-lg shadow-emerald-500/20">
              A
            </div>
            <span className="font-bold text-xl tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-teal-300">
              AgriPlatform
            </span>
          </div>
          <button className="lg:hidden text-slate-400" onClick={() => setSidebarOpen(false)}>
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {NAVIGATION.map((nav, idx) => (
            <div key={idx}>
              <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-2">
                {nav.icon} {nav.group}
              </h3>
              <div className="space-y-1 pl-7 border-l border-slate-800 ml-2.5">
                {nav.links.map(link => {
                  const isActive = location.pathname === link.path;
                  return (
                    <Link
                      key={link.path}
                      to={link.path}
                      className={`block px-3 py-1.5 rounded-md text-sm transition-colors ${
                        isActive 
                          ? 'bg-emerald-500/10 text-emerald-400 font-medium' 
                          : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                      }`}
                    >
                      {link.name}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        <div className="p-4 border-t border-slate-800 shrink-0">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 font-bold">
              U
            </div>
            <div>
              <p className="text-sm font-medium text-white">Farmer User</p>
              <p className="text-xs text-slate-500">Premium Account</p>
            </div>
          </div>
          <button 
            onClick={logout}
            className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-medium rounded-lg transition-colors border border-slate-700"
          >
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        {/* Mobile Header */}
        <header className="lg:hidden h-16 border-b border-slate-800 bg-slate-900 flex items-center px-4 shrink-0">
          <button className="text-slate-400 mr-4" onClick={() => setSidebarOpen(true)}>
            <Menu className="w-6 h-6" />
          </button>
          <span className="font-bold text-lg bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-teal-300">
            AgriPlatform
          </span>
        </header>

        <div className="flex-1 overflow-auto p-4 sm:p-6 lg:p-8 relative">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </div>
      </main>

    </div>
  );
}
