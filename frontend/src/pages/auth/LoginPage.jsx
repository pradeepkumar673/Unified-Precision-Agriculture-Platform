import { useState } from 'react';
import { useAuth } from '../../App';
import { Sprout, Lock, Mail, ArrowRight, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function LoginPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
    try {
      const path = isLogin ? '/api/v1/auth/login' : '/api/v1/auth/signup';
      const body = isLogin
        ? { email, password }
        : { email, password, full_name: email.split('@')[0], role: 'farmer' };
      const res = await fetch(`${API_BASE}${path}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.detail || 'Authentication failed');
        setLoading(false);
        return;
      }
      if (data.farms?.[0]?.id) {
        localStorage.setItem('farmId', data.farms[0].id);
      }
      login(data.access_token);
      navigate('/');
    } catch {
      setError('Cannot reach the API. Start the backend on port 8000.');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 selection:bg-emerald-500/20 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(16,185,129,0.12),_transparent_30%)]" />

      <div className="relative z-10 w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900/80 p-8 shadow-[0_20px_60px_rgba(2,6,23,0.7)]">
        <div className="mb-8 flex flex-col items-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-300">
            <Sprout className="h-7 w-7" />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-white">AgriPlatform</h1>
          <p className="mt-1 text-sm text-slate-400">Unified Precision Agriculture</p>
          <p className="mt-2 text-xs text-slate-500">Demo: demo@agri.test / demo1234</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-1">Email Address</label>
            <div className="relative">
              <Mail className="w-5 h-5 absolute left-3 top-2.5 text-slate-500" />
              <input 
                type="email" value={email} onChange={e=>setEmail(e.target.value)} required
                className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 focus:ring-2 focus:ring-emerald-500/50 outline-none text-white transition-all"
                placeholder="farmer@example.com"
              />
            </div>
          </div>
          
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-sm font-medium text-slate-400">Password</label>
              {isLogin && <a href="#" className="text-xs text-emerald-400 hover:text-emerald-300">Forgot?</a>}
            </div>
            <div className="relative">
              <Lock className="w-5 h-5 absolute left-3 top-2.5 text-slate-500" />
              <input 
                type="password" value={password} onChange={e=>setPassword(e.target.value)} required
                className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 focus:ring-2 focus:ring-emerald-500/50 outline-none text-white transition-all"
                placeholder="••••••••"
              />
            </div>
          </div>

          {error && <div className="text-red-400 text-sm bg-red-500/10 p-3 rounded-lg border border-red-500/20">{error}</div>}

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 font-medium text-emerald-300 transition hover:bg-emerald-500/15 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : (
              <>
                <span>{isLogin ? 'Sign In' : 'Create Account'}</span>
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-slate-400">
          {isLogin ? "Don't have an account? " : "Already have an account? "}
          <button onClick={() => setIsLogin(!isLogin)} className="text-emerald-400 font-semibold hover:text-emerald-300">
            {isLogin ? 'Sign up' : 'Sign in'}
          </button>
        </div>
      </div>
    </div>
  );
}
