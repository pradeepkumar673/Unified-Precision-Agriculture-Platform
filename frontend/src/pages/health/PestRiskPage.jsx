import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getFarmProfile } from '../../api/farmApi';
import { getPestRiskMap, getSurveillanceMap, getPublicDiseaseReports } from '../../api/healthApi';

export default function PestRiskPage() {
  const navigate = useNavigate();
  const farmId = localStorage.getItem('farmId');

  const [farm, setFarm] = useState(null);
  const [district, setDistrict] = useState('');
  const [riskData, setRiskData] = useState([]);
  const [publicReports, setPublicReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('risk'); // 'risk' | 'reports'

  // Load farm profile first, then use its district
  useEffect(() => {
    if (!farmId) { setLoading(false); return; }
    getFarmProfile(farmId)
      .then(res => {
        const f = res.data;
        setFarm(f);
        const d = f?.district || 'Ambur';
        setDistrict(d);
        return fetchData(d);
      })
      .catch(() => setLoading(false));
  }, [farmId]);

  const fetchData = async (d) => {
    setLoading(true);
    setError(null);
    try {
      const [riskRes, reportsRes] = await Promise.all([
        getPestRiskMap(d),
        getPublicDiseaseReports(d).catch(() => ({ data: [] })),
      ]);
      setRiskData(riskRes.data || []);
      setPublicReports(reportsRes.data || []);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to load pest data');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (district.trim()) fetchData(district.trim());
  };

  const highRisk = riskData.filter(d => d.risk_score >= 0.7);
  const medRisk = riskData.filter(d => d.risk_score >= 0.4 && d.risk_score < 0.7);

  const getRiskColor = (score) => {
    if (score >= 0.7) return { bg: 'bg-error-container', fg: 'text-error', bar: 'bg-error', label: 'Critical', labelStyle: 'bg-error-container text-error' };
    if (score >= 0.4) return { bg: 'bg-tertiary-fixed', fg: 'text-tertiary', bar: 'bg-tertiary', label: 'Monitor', labelStyle: 'bg-tertiary-fixed text-tertiary' };
    return { bg: 'bg-primary-fixed', fg: 'text-primary', bar: 'bg-primary', label: 'Safe', labelStyle: 'bg-primary-fixed text-primary' };
  };

  const getSeverityStyle = (sev) => {
    if (!sev) return 'bg-surface-container text-on-surface-variant';
    const s = sev.toLowerCase();
    if (s === 'high') return 'bg-error-container text-error';
    if (s === 'medium') return 'bg-tertiary-fixed text-tertiary';
    return 'bg-primary-fixed text-primary';
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background border-b border-outline-variant">
        <div className="flex items-center gap-3 px-margin py-3">
          <button
            onClick={() => navigate(-1)}
            className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-surface-container-low active:scale-95 transition-all"
            aria-label="Go back"
          >
            <span className="material-symbols-outlined text-on-surface text-[24px]">arrow_back</span>
          </button>
          <div className="flex-1">
            <h1 className="font-title-md text-title-md text-on-surface">Pest & Disease Risk</h1>
            <p className="font-label-sm text-label-sm text-on-surface-variant">{district || 'Loading…'} District</p>
          </div>
          <button
            onClick={() => fetchData(district)}
            disabled={loading}
            className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-surface-container-low active:scale-95 transition-all"
            aria-label="Refresh"
          >
            <span className={`material-symbols-outlined text-primary text-[22px] ${loading ? 'animate-spin' : ''}`}>refresh</span>
          </button>
        </div>

        {/* District search bar */}
        <form onSubmit={handleSearch} className="px-margin pb-3">
          <div className="flex items-center gap-2 bg-surface-container rounded-xl px-space-md h-12 border border-outline-variant focus-within:border-primary transition-colors">
            <span className="material-symbols-outlined text-on-surface-variant text-[20px]">location_on</span>
            <input
              value={district}
              onChange={e => setDistrict(e.target.value)}
              placeholder="Search district…"
              className="flex-1 bg-transparent font-body-md text-body-md text-on-surface placeholder-on-surface-variant focus:outline-none"
            />
            <button type="submit" className="text-primary font-label-md text-label-md">Search</button>
          </div>
        </form>
      </div>

      <main className="flex-1 px-margin pb-28 pt-4 flex flex-col gap-space-md">

        {/* Farm context chip */}
        {farm && (
          <div className="flex items-center gap-space-xs bg-surface-container-low px-space-md py-space-sm rounded-xl">
            <span className="material-symbols-outlined text-primary text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>landscape</span>
            <span className="font-label-md text-label-md text-on-surface truncate">
              {farm.name} · {farm.district}, {farm.state}
            </span>
          </div>
        )}

        {error && (
          <div className="flex items-center gap-space-sm bg-error-container text-error font-label-md text-label-md px-space-md py-space-sm rounded-xl">
            <span className="material-symbols-outlined text-[18px]">error</span>
            {error}
          </div>
        )}

        {/* Alert banner for high risk villages */}
        {!loading && highRisk.length > 0 && (
          <div className="bg-error-container rounded-2xl p-space-md flex items-start gap-space-sm">
            <div className="w-10 h-10 rounded-full bg-error flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="material-symbols-outlined text-on-error text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>warning</span>
            </div>
            <div>
              <p className="font-label-lg text-label-lg text-error font-bold">High Risk Alert!</p>
              <p className="font-body-sm text-body-sm text-on-error-container mt-0.5">
                Elevated pest pressure in <span className="font-semibold">{highRisk.map(v => v.village_name).join(', ')}</span>. Preventive spraying recommended immediately.
              </p>
            </div>
          </div>
        )}

        {/* Summary stat cards */}
        {!loading && riskData.length > 0 && (
          <div className="grid grid-cols-3 gap-space-sm">
            {[
              { icon: 'crisis_alert', label: 'Critical', count: highRisk.length, style: 'text-error', bg: 'bg-error-container' },
              { icon: 'visibility', label: 'Monitor', count: medRisk.length, style: 'text-tertiary', bg: 'bg-tertiary-fixed' },
              { icon: 'check_circle', label: 'Safe', count: riskData.length - highRisk.length - medRisk.length, style: 'text-primary', bg: 'bg-primary-fixed' },
            ].map(s => (
              <div key={s.label} className="bg-surface-container-lowest rounded-2xl p-space-md shadow-sm flex flex-col items-center gap-1">
                <div className={`w-9 h-9 rounded-full ${s.bg} ${s.style} flex items-center justify-center`}>
                  <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>{s.icon}</span>
                </div>
                <span className={`font-headline-sm text-headline-sm ${s.style} font-bold`}>{s.count}</span>
                <span className="font-label-sm text-label-sm text-on-surface-variant">{s.label}</span>
              </div>
            ))}
          </div>
        )}

        {/* Tab Switch */}
        <div className="flex bg-surface-container rounded-xl p-1 gap-1">
          {[
            { id: 'risk', label: 'Village Risk Map', icon: 'pest_control' },
            { id: 'reports', label: 'Community Reports', icon: 'groups' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg font-label-md text-label-md transition-all ${
                activeTab === tab.id
                  ? 'bg-surface-container-lowest text-primary shadow-sm font-bold'
                  : 'text-on-surface-variant'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Loading state */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-16 gap-4">
            <div className="w-12 h-12 rounded-full border-4 border-surface-container-high border-t-primary animate-spin" />
            <p className="font-body-md text-body-md text-on-surface-variant">Loading pest data for {district}…</p>
          </div>
        )}

        {/* RISK TAB */}
        {!loading && activeTab === 'risk' && (
          <div className="flex flex-col gap-space-sm">
            {riskData.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 gap-3 bg-surface-container-lowest rounded-2xl">
                <span className="material-symbols-outlined text-[48px] text-on-surface-variant">pest_control</span>
                <p className="font-body-md text-body-md text-on-surface-variant">No risk data for {district}</p>
              </div>
            ) : (
              riskData.map((row, idx) => {
                const style = getRiskColor(row.risk_score);
                const pct = Math.round(row.risk_score * 100);
                return (
                  <div key={idx} className="bg-surface-container-lowest rounded-2xl p-space-md shadow-sm flex items-center gap-space-md">
                    <div className={`w-12 h-12 rounded-full ${style.bg} ${style.fg} flex items-center justify-center flex-shrink-0`}>
                      <span className="material-symbols-outlined text-[22px]" style={{ fontVariationSettings: "'FILL' 1" }}>pest_control</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <p className="font-label-lg text-label-lg text-on-surface font-bold truncate">{row.village_name}</p>
                        <span className={`px-2 py-0.5 rounded-full font-label-sm text-label-sm font-bold ${style.labelStyle} flex-shrink-0`}>{style.label}</span>
                      </div>
                      {/* Risk progress bar */}
                      <div className="w-full bg-surface-container-high rounded-full h-2 mb-1">
                        <div
                          className={`h-2 rounded-full ${style.bar} transition-all`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <p className="font-body-sm text-body-sm text-on-surface-variant">{row.contributing_reports_count} community reports</p>
                        <p className="font-label-sm text-label-sm text-on-surface-variant font-mono">{pct}% risk</p>
                      </div>
                      <p className="font-label-xs text-label-xs text-on-surface-variant mt-0.5">Week of {new Date(row.week_of).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* REPORTS TAB */}
        {!loading && activeTab === 'reports' && (
          <div className="flex flex-col gap-space-sm">
            {publicReports.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 gap-3 bg-surface-container-lowest rounded-2xl">
                <span className="material-symbols-outlined text-[48px] text-on-surface-variant">groups</span>
                <p className="font-body-md text-body-md text-on-surface-variant">No community reports for {district}</p>
                <p className="font-body-sm text-body-sm text-on-surface-variant text-center px-8">Be the first to report a disease sighting to help your community.</p>
              </div>
            ) : (
              publicReports.slice(0, 20).map((report, idx) => (
                <div key={idx} className="bg-surface-container-lowest rounded-2xl p-space-md shadow-sm flex items-start gap-space-sm">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${getSeverityStyle(report.severity)}`}>
                    <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>coronavirus</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-label-lg text-label-lg text-on-surface font-bold truncate capitalize">{report.predicted_disease}</p>
                      <span className={`px-2 py-0.5 rounded-full font-label-sm text-label-sm font-bold capitalize ${getSeverityStyle(report.severity)} flex-shrink-0`}>
                        {report.severity || 'Unknown'}
                      </span>
                    </div>
                    <p className="font-body-sm text-body-sm text-on-surface-variant capitalize mt-0.5">Crop: {report.crop || 'Unknown'}</p>
                    <p className="font-label-xs text-label-xs text-on-surface-variant mt-0.5">
                      {new Date(report.created_at).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Advisory card */}
        {!loading && riskData.length > 0 && (
          <div className="bg-surface-container-lowest rounded-2xl p-space-md shadow-sm border border-outline-variant mt-2">
            <div className="flex items-center gap-space-sm mb-space-sm">
              <span className="material-symbols-outlined text-secondary text-[22px]" style={{ fontVariationSettings: "'FILL' 1" }}>tips_and_updates</span>
              <p className="font-label-lg text-label-lg text-on-surface font-bold">Pest Advisory</p>
            </div>
            <ul className="flex flex-col gap-2">
              {highRisk.length > 0 && <li className="flex items-start gap-2 font-body-sm text-body-sm text-on-surface"><span className="material-symbols-outlined text-error text-[16px] mt-0.5" style={{ fontVariationSettings: "'FILL' 1" }}>circle</span>Apply recommended pesticide in {highRisk.map(v => v.village_name).join(', ')} immediately.</li>}
              <li className="flex items-start gap-2 font-body-sm text-body-sm text-on-surface"><span className="material-symbols-outlined text-primary text-[16px] mt-0.5" style={{ fontVariationSettings: "'FILL' 1" }}>circle</span>Scout fields every 3–4 days during active pest pressure.</li>
              <li className="flex items-start gap-2 font-body-sm text-body-sm text-on-surface"><span className="material-symbols-outlined text-primary text-[16px] mt-0.5" style={{ fontVariationSettings: "'FILL' 1" }}>circle</span>Use pheromone traps to monitor pest population trends.</li>
              <li className="flex items-start gap-2 font-body-sm text-body-sm text-on-surface"><span className="material-symbols-outlined text-primary text-[16px] mt-0.5" style={{ fontVariationSettings: "'FILL' 1" }}>circle</span>Report sightings via the Leaf Disease Scanner to help community surveillance.</li>
            </ul>
            <button
              onClick={() => navigate('/health/leaf-scanner')}
              className="mt-space-md w-full h-12 bg-primary-container text-on-primary rounded-xl font-label-lg text-label-lg flex items-center justify-center gap-space-xs shadow-sm active:opacity-90 transition-opacity"
            >
              <span className="material-symbols-outlined text-[20px]">camera_alt</span>
              Scan a Leaf Now
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
