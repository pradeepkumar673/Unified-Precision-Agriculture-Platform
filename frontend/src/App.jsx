import { Routes, Route, Link, useLocation } from 'react-router-dom';
import FarmProfilePage from './pages/farm/FarmProfilePage';
import FieldBoundaryPage from './pages/farm/FieldBoundaryPage';

function App() {
  const location = useLocation();

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 font-sans selection:bg-emerald-500/30">
      <nav className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center font-bold text-white shadow-lg shadow-emerald-500/20">
                A
              </div>
              <span className="font-bold text-xl tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-teal-300">
                AgriPlatform
              </span>
            </div>
            <div className="flex space-x-1">
              <NavLink to="/farm/profile" current={location.pathname}>Farm Profile</NavLink>
              <NavLink to="/farm/boundary" current={location.pathname}>Field Boundary</NavLink>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Routes>
          <Route path="/" element={<div className="text-center py-20 text-slate-400">Welcome to the AgriPlatform. Select a module from the nav.</div>} />
          <Route path="/farm/profile" element={<FarmProfilePage />} />
          <Route path="/farm/boundary" element={<FieldBoundaryPage />} />
        </Routes>
      </main>
    </div>
  );
}

function NavLink({ to, current, children }) {
  const isActive = current.startsWith(to);
  return (
    <Link
      to={to}
      className={`px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
        isActive
          ? 'bg-emerald-500/10 text-emerald-400 shadow-[inset_0_-2px_0_rgba(52,211,153,1)]'
          : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
      }`}
    >
      {children}
    </Link>
  );
}

export default App;
