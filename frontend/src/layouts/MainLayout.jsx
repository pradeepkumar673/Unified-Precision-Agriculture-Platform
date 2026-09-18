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
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-emerald-500/20 flex overflow-hidden">
      {!sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/75 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(true)}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-slate-800 bg-slate-900/95 transition-transform duration-200 lg:static ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="flex h-16 items-center justify-between border-b border-slate-800 px-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-emerald-500/30 bg-emerald-500/10 font-semibold text-emerald-300">
              AP
            </div>
            <div>
              <p className="text-base font-semibold tracking-tight text-white">AgriPlatform</p>
            </div>
          </div>
          <button className="text-slate-400 lg:hidden" onClick={() => setSidebarOpen(false)}>
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 space-y-6 overflow-y-auto p-4">
          {NAVIGATION.map((nav, idx) => (
            <div key={idx}>
              <h3 className="mb-2 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                {nav.icon}
                <span>{nav.group}</span>
              </h3>
              <div className="ml-2 space-y-1 border-l border-slate-800 pl-3">
                {nav.links.map((link) => {
                  const isActive = location.pathname === link.path;
                  return (
                    <Link
                      key={link.path}
                      to={link.path}
                      className={`block rounded-lg px-3 py-2 text-sm transition-colors ${
                        isActive
                          ? 'bg-slate-800 text-white ring-1 ring-slate-700'
                          : 'text-slate-400 hover:bg-slate-800/80 hover:text-slate-200'
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

        <div className="border-t border-slate-800 p-4">
          <div className="mb-3 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-800 font-semibold text-slate-200">
              U
            </div>
            <div>
              <p className="text-sm font-medium text-white">Farmer User</p>
              <p className="text-xs text-slate-500">Operations account</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Link to="/privacy-policy" className="flex-1 rounded-lg border border-slate-700 px-3 py-2 text-center text-xs text-slate-300 hover:border-slate-500 hover:text-white">
              Privacy
            </Link>
            <Link to="/terms" className="flex-1 rounded-lg border border-slate-700 px-3 py-2 text-center text-xs text-slate-300 hover:border-slate-500 hover:text-white">
              Terms
            </Link>
          </div>
          <button
            onClick={logout}
            className="mt-3 w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-200 transition hover:border-slate-500 hover:bg-slate-700"
          >
            Sign out
          </button>
        </div>
      </aside>

      <main className="flex min-h-screen flex-1 flex-col overflow-hidden">
        <header className="flex h-16 items-center border-b border-slate-800 bg-slate-900/80 px-4 lg:hidden">
          <button className="mr-4 text-slate-400" onClick={() => setSidebarOpen(true)}>
            <Menu className="h-5 w-5" />
          </button>
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-emerald-500/30 bg-emerald-500/10 text-xs font-semibold text-emerald-300">
              AP
            </div>
            <span className="text-sm font-semibold tracking-tight text-white">AgriPlatform</span>
          </div>
        </header>

        <div className="flex-1 overflow-auto p-4 sm:p-6 lg:p-8">
          <div className="mx-auto max-w-7xl">
            <Outlet />
          </div>
        </div>
      </main>
    </div>
  );
}
