import React, { useState, useEffect, useCallback } from 'react';
import api from '../../services/api.js';
import {
  Thermometer, Droplets, Wind, Zap, Waves, Leaf,
  Settings, RefreshCw, AlertCircle, Wifi, WifiOff, CheckCircle2
} from 'lucide-react';

const SENSOR_ICONS = {
  temperature: <Thermometer className="w-5 h-5 text-red-400" />,
  humidity: <Droplets className="w-5 h-5 text-blue-400" />,
  co2: <Wind className="w-5 h-5 text-purple-400" />,
  light_intensity: <Leaf className="w-5 h-5 text-yellow-400" />,
  ph: <Waves className="w-5 h-5 text-teal-400" />,
  ec: <Zap className="w-5 h-5 text-orange-400" />,
  power_kw: <Zap className="w-5 h-5 text-green-400" />,
};

const SENSOR_UNITS = {
  temperature: '°C', humidity: '%', co2: 'ppm',
  light_intensity: 'μmol', ph: '', ec: 'mS/cm',
  power_kw: 'kW', do_mg_l: 'mg/L', water_level_pct: '%',
};

const SensorCard = ({ label, value, unit, icon }) => (
  <div className="bg-slate-900/60 border border-slate-700 rounded-xl p-4 flex items-center gap-3">
    <div className="p-2 bg-slate-800 rounded-lg">{icon}</div>
    <div>
      <p className="text-xs text-slate-400 font-medium">{label}</p>
      <p className="text-xl font-bold text-white">
        {value !== undefined && value !== null ? Number(value).toFixed(1) : '—'}{' '}
        <span className="text-sm text-slate-400">{unit}</span>
      </p>
    </div>
  </div>
);

export default function FacilityDashboardPage() {
  const farmId = localStorage.getItem('farmId') || '';
  const [dashboardData, setDashboardData] = useState(null);
  const [aquaBalance, setAquaBalance] = useState(null);
  const [verticalOpt, setVerticalOpt] = useState(null);
  const [energyOpt, setEnergyOpt] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState('');
  const [tariff, setTariff] = useState(7.5);

  // Setpoints form
  const [setpoints, setSetpoints] = useState({ ph: 6.2, ec: 1.8, temperature: 24.0 });
  const [setpointSaving, setSetpointSaving] = useState(false);
  const [setpointMsg, setSetpointMsg] = useState('');

  const fetchAll = useCallback(async () => {
    if (!farmId) return;
    try {
      const dashRes = await api.get('/cea_iot/dashboard', { params: { farm_id: farmId } });
      setDashboardData(dashRes.data);
      setConnected(true);
      setError('');
      setLastUpdated(new Date());
    } catch (err) {
      const status = err.response?.status;
      if (status === 404) {
        setError('no_data');
      } else {
        setError(err.response?.data?.detail || 'Connection failed');
      }
      setConnected(false);
    } finally {
      setLoading(false);
    }

    // Fetch sub-panels independently (don't break main if these fail)
    try {
      const aquaRes = await api.get('/cea_iot/aqua-balance', { params: { farm_id: farmId } });
      setAquaBalance(aquaRes.data);
    } catch {
      setAquaBalance(null);
    }
    try {
      const vertRes = await api.get('/cea_iot/vertical-optimization', { params: { farm_id: farmId } });
      setVerticalOpt(vertRes.data);
    } catch {
      setVerticalOpt(null);
    }
    try {
      const energyRes = await api.get('/cea_iot/energy-optimization', {
        params: { farm_id: farmId, tariff_per_kwh: tariff }
      });
      setEnergyOpt(energyRes.data);
    } catch {
      setEnergyOpt(null);
    }
  }, [farmId, tariff]);

  useEffect(() => {
    fetchAll();
    const interval = setInterval(fetchAll, 5000);
    return () => clearInterval(interval);
  }, [fetchAll]);

  const saveSetpoints = async () => {
    setSetpointSaving(true);
    setSetpointMsg('');
    try {
      await api.post('/cea_iot/setpoints', {
        farm_id: farmId,
        values: setpoints
      });
      setSetpointMsg('✓ Setpoints saved');
      setTimeout(() => setSetpointMsg(''), 3000);
    } catch (err) {
      setSetpointMsg('✗ ' + (err.response?.data?.detail || 'Save failed'));
    } finally {
      setSetpointSaving(false);
    }
  };

  if (!farmId) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-slate-400 gap-4">
        <WifiOff className="w-12 h-12" />
        <p className="text-lg font-medium">No Farm Selected</p>
        <p className="text-sm text-slate-500">
          Go to <a href="/farm/profile" className="text-emerald-400 underline">Farm Profile</a> to create or load your farm first.
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 gap-3 text-slate-400">
        <RefreshCw className="w-6 h-6 animate-spin" />
        <span>Connecting to IoT gateway...</span>
      </div>
    );
  }

  const readings = dashboardData?.latest_reading?.data || {};

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-teal-400 to-cyan-500">
            CEA Facility Dashboard
          </h1>
          <p className="text-slate-400 mt-1">Controlled Environment Agriculture — Live IoT Monitoring</p>
        </div>
        <div className="flex items-center gap-3">
          {connected ? (
            <span className="flex items-center gap-2 text-emerald-400 text-sm font-medium bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-full">
              <Wifi className="w-4 h-4" /> Live · {lastUpdated?.toLocaleTimeString()}
            </span>
          ) : (
            <span className="flex items-center gap-2 text-amber-400 text-sm font-medium bg-amber-500/10 border border-amber-500/20 px-3 py-1.5 rounded-full">
              <WifiOff className="w-4 h-4" /> Waiting for sensor data
            </span>
          )}
          <button onClick={fetchAll} className="p-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-slate-300 transition-colors">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* No Data State */}
      {error === 'no_data' && (
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-6 flex gap-4">
          <AlertCircle className="w-6 h-6 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-amber-300">No sensor readings yet</p>
            <p className="text-sm text-slate-400 mt-1">
              Start the hardware simulator to feed live data:
            </p>
            <pre className="mt-2 bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-xs text-emerald-400 font-mono">
              cd backend{'\n'}
              set CEA_FARM_ID={farmId}{'\n'}
              python hardware-sim/simulate_sensors.py
            </pre>
            <p className="text-xs text-slate-500 mt-2">Data will appear automatically within 5 seconds.</p>
          </div>
        </div>
      )}

      {/* Live Sensor Readings */}
      {connected && Object.keys(readings).length > 0 && (
        <div className="bg-slate-800/40 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6 shadow-xl">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Wifi className="w-5 h-5 text-teal-400" /> Live Sensor Readings
            <span className="ml-auto text-xs text-slate-500 font-normal">
              Device: {dashboardData?.latest_reading?.device_id} · {dashboardData?.latest_reading?.device_type}
            </span>
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {Object.entries(readings).map(([key, val]) => (
              <SensorCard
                key={key}
                label={key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                value={val}
                unit={SENSOR_UNITS[key] || ''}
                icon={SENSOR_ICONS[key] || <Leaf className="w-5 h-5 text-slate-400" />}
              />
            ))}
          </div>
          {dashboardData?.system_status && (
            <p className="mt-3 text-xs text-slate-500">
              System: <span className="text-teal-400 capitalize">{dashboardData.system_status}</span>
              {dashboardData.setpoints && ' · Setpoints configured'}
            </p>
          )}
        </div>
      )}

      {/* Setpoints + Sub-panels */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Setpoints Config */}
        <div className="bg-slate-800/40 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-5 shadow-xl">
          <h2 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
            <Settings className="w-4 h-4 text-cyan-400" /> Configure Setpoints
          </h2>
          <div className="space-y-3">
            {[
              { key: 'ph', label: 'Target pH', min: 5.0, max: 8.0, step: 0.1 },
              { key: 'ec', label: 'Target EC (mS/cm)', min: 0.5, max: 4.0, step: 0.1 },
              { key: 'temperature', label: 'Temperature (°C)', min: 15, max: 35, step: 0.5 },
            ].map(({ key, label, min, max, step }) => (
              <div key={key}>
                <label className="block text-xs text-slate-400 mb-1">{label}</label>
                <input
                  type="number"
                  min={min} max={max} step={step}
                  value={setpoints[key]}
                  onChange={e => setSetpoints(s => ({ ...s, [key]: parseFloat(e.target.value) }))}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:ring-2 focus:ring-teal-500/50 outline-none"
                />
              </div>
            ))}
            <button
              onClick={saveSetpoints}
              disabled={setpointSaving}
              className="w-full py-2 bg-teal-600 hover:bg-teal-500 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
            >
              {setpointSaving ? 'Saving...' : 'Save Setpoints'}
            </button>
            {setpointMsg && (
              <p className={`text-xs text-center ${setpointMsg.startsWith('✓') ? 'text-emerald-400' : 'text-red-400'}`}>
                {setpointMsg}
              </p>
            )}
          </div>
        </div>

        {/* Aquaponics Balance */}
        <div className="bg-slate-800/40 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-5 shadow-xl">
          <h2 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
            <Waves className="w-4 h-4 text-blue-400" /> Aquaponics Balance
          </h2>
          {aquaBalance ? (
            <div className="space-y-3">
              {[
                { label: 'pH', current: aquaBalance.ph, status: aquaBalance.ph_status },
                { label: 'EC', current: aquaBalance.ec, status: aquaBalance.ec_status },
              ].map(({ label, current, status }) => (
                <div key={label} className="flex items-center justify-between p-3 bg-slate-900/60 rounded-lg border border-slate-700">
                  <span className="text-sm text-slate-400">{label}: <span className="text-white font-mono">{current}</span></span>
                  <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
                    status === 'optimal' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'
                  }`}>
                    {status === 'optimal' ? '✓ Optimal' : '⚠ Adjust'}
                  </span>
                </div>
              ))}
              <p className="text-xs text-slate-400 bg-slate-900/40 p-3 rounded-lg">{aquaBalance.recommendation}</p>
            </div>
          ) : (
            <p className="text-slate-500 text-sm">
              {connected ? 'Requires ph & ec sensor readings + setpoints.' : 'Start simulator first.'}
            </p>
          )}
        </div>

        {/* Energy Optimization */}
        <div className="bg-slate-800/40 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-5 shadow-xl">
          <h2 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
            <Zap className="w-4 h-4 text-yellow-400" /> Energy Optimization
          </h2>
          <div className="mb-3">
            <label className="text-xs text-slate-400 block mb-1">Tariff (₹/kWh)</label>
            <input
              type="number" min={1} max={20} step={0.5}
              value={tariff}
              onChange={e => setTariff(parseFloat(e.target.value))}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm outline-none"
            />
          </div>
          {energyOpt ? (
            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-slate-900/60 border border-slate-700 rounded-lg p-3 text-center">
                  <p className="text-xs text-slate-400">Current</p>
                  <p className="text-lg font-bold text-white">{energyOpt.current_consumption_kw} <span className="text-xs text-slate-400">kW</span></p>
                </div>
                <div className="bg-slate-900/60 border border-slate-700 rounded-lg p-3 text-center">
                  <p className="text-xs text-slate-400">Tariff</p>
                  <p className="text-lg font-bold text-amber-400">₹{energyOpt.tariff_per_kwh}</p>
                </div>
              </div>
              <p className="text-xs text-slate-400 bg-slate-900/40 p-3 rounded-lg">{energyOpt.recommendation}</p>
            </div>
          ) : (
            <p className="text-slate-500 text-sm">Requires power_kw sensor reading.</p>
          )}
        </div>
      </div>

      {/* Vertical Farm Layers */}
      {verticalOpt && verticalOpt.layers?.length > 0 && (
        <div className="bg-slate-800/40 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6 shadow-xl">
          <h2 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
            <Leaf className="w-4 h-4 text-green-400" /> Vertical Farm Layers
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {verticalOpt.layers.map((layer) => (
              <div key={layer.layer} className="bg-slate-900/60 border border-slate-700 rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-bold text-white">Shelf {layer.layer}</h3>
                  <span className="text-xs text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-full flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> {layer.status}
                  </span>
                </div>
                <div className="space-y-1.5 text-sm">
                  <p className="flex justify-between">
                    <span className="text-slate-400">Light</span>
                    <span className="text-yellow-400 font-mono">{layer.light_intensity ?? '—'} μmol</span>
                  </p>
                  <p className="flex justify-between">
                    <span className="text-slate-400">Temp</span>
                    <span className="text-red-400 font-mono">{layer.temp ?? '—'} °C</span>
                  </p>
                </div>
              </div>
            ))}
          </div>
          {verticalOpt.recommendation && (
            <p className="mt-3 text-xs text-slate-400 bg-slate-900/40 p-3 rounded-lg">{verticalOpt.recommendation}</p>
          )}
        </div>
      )}

      {/* Hydroponics Status */}
      {connected && dashboardData?.setpoints && (
        <div className="bg-slate-800/40 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6 shadow-xl">
          <h2 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
            <Droplets className="w-4 h-4 text-teal-400" /> Hydroponics Setpoints (Active)
          </h2>
          <div className="flex flex-wrap gap-3">
            {Object.entries(dashboardData.setpoints).map(([k, v]) => (
              <div key={k} className="bg-teal-500/10 border border-teal-500/20 rounded-lg px-4 py-2 text-sm">
                <span className="text-slate-400 capitalize">{k.replace(/_/g, ' ')}: </span>
                <span className="text-teal-300 font-bold font-mono">{v}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

