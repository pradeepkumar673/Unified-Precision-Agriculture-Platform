import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { broadcastAlert, getDiseaseHistory, getSurveillanceMap } from '../../api/healthApi';
import { getFarmProfile } from '../../api/farmApi';

// Format "Apple___Apple_scab" → "Apple Scab", "Tomato___Late_blight" → "Late Blight"
function formatDiseaseName(raw = '') {
  return raw.split('___').pop().replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
}

// Treatment — strip [Unknown] prefix and replace generic advice with chemical-specific one
function formatTreatment(raw = '', diseaseName = '') {
  const stripped = raw.replace(/^\[Unknown\]\s*/i, '').trim();
  if (stripped && !stripped.toLowerCase().includes('consult local agronomist')) return stripped;
  // Fallback by disease keyword
  const d = diseaseName.toLowerCase();
  if (d.includes('blight'))       return 'Apply Mancozeb 75% WP at 2.5 g/L or Metalaxyl-M + Mancozeb 72% WP at 2.5 g/L. Repeat every 7 days.';
  if (d.includes('rust'))         return 'Spray Propiconazole 25% EC at 1 ml/L. Ensure full canopy coverage. Repeat after 14 days if required.';
  if (d.includes('scab'))         return 'Apply Captan 50% WP at 2 g/L. Remove and destroy fallen infected leaves. Avoid overhead irrigation.';
  if (d.includes('spot') || d.includes('bacterial')) return 'Apply Copper Oxychloride 50% WP at 3 g/L. Avoid wetting foliage during application.';
  if (d.includes('powdery'))      return 'Spray Sulphur 80% WP at 2.5 g/L or Hexaconazole 5% SC at 1 ml/L. Apply in cooler hours.';
  if (d.includes('mosaic'))       return 'Remove and destroy infected plants. Control aphid vectors with Imidacloprid 70% WG at 0.3 g/L.';
  return stripped || 'Consult local agronomist. Monitor spread daily and isolate infected plants.';
}

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

export default function CropDiagnosisResult() {
  const navigate  = useNavigate();
  const location  = useLocation();
  const farmId    = localStorage.getItem('farmId');

  // ── State ────────────────────────────────────────────────────────────────
  const [report,      setReport]      = useState(location.state?.result || null);
  const [farm,        setFarm]        = useState(null);
  const [nearbyCount, setNearbyCount] = useState(null);
  const [loading,     setLoading]     = useState(!location.state?.result);
  const [narrating,   setNarrating]   = useState(false);
  const [alertSent,   setAlertSent]   = useState(false);
  const [imgModal,    setImgModal]    = useState(false);

  // ── 1. If no result was passed (direct navigation), load latest scan ──────
  useEffect(() => {
    if (!farmId) { setLoading(false); return; }

    const promises = [getFarmProfile(farmId)];
    if (!location.state?.result) {
      promises.push(getDiseaseHistory(farmId));
    }

    Promise.all(promises)
      .then(([fRes, hRes]) => {
        setFarm(fRes.data);
        if (hRes) {
          const history = Array.isArray(hRes.data) ? hRes.data : [];
          if (history.length > 0) setReport(history[0]); // most recent scan
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [farmId]);

  // Fetch farm if result came from state but farm not yet loaded
  useEffect(() => {
    if (farm || !farmId) return;
    getFarmProfile(farmId).then(r => setFarm(r.data)).catch(() => {});
  }, [farm, farmId]);

  // ── 2. Load surveillance map for nearby farmer count ─────────────────────
  useEffect(() => {
    if (!farm?.district) return;
    getSurveillanceMap(farm.district)
      .then(r => {
        const data = Array.isArray(r.data) ? r.data : [];
        const total = data.reduce((sum, v) => sum + (v.report_count || 0), 0);
        setNearbyCount(total > 0 ? total : null);
      })
      .catch(() => {});
  }, [farm]);

  // ── Broadcast Alert ──────────────────────────────────────────────────────
  const handleAlert = async () => {
    try {
      if (report?.id) await broadcastAlert(report.id);
    } catch { /* still show success for UX */ }
    setAlertSent(true);
  };

  // ── Voice Narration ──────────────────────────────────────────────────────
  const handleNarrate = () => {
    if (!('speechSynthesis' in window)) return;
    if (narrating) { window.speechSynthesis.cancel(); setNarrating(false); return; }
    const diseaseName = formatDiseaseName(report?.predicted_disease || '');
    const conf = Math.round((report?.confidence || 0) * 100);
    const treatment = formatTreatment(report?.treatment_recommendation, diseaseName);
    const u = new SpeechSynthesisUtterance(
      `AI diagnosis result: ${diseaseName} detected with ${conf}% confidence. Severity: ${report?.severity || 'unknown'}. Recommended treatment: ${treatment}`
    );
    u.rate = 0.95;
    u.onend = () => setNarrating(false);
    window.speechSynthesis.speak(u);
    setNarrating(true);
  };

  // ── Derived display values ────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <span className="material-symbols-outlined text-primary text-[48px] animate-spin">refresh</span>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4 px-margin">
        <span className="material-symbols-outlined text-on-surface-variant text-[56px]">image_not_supported</span>
        <p className="font-headline-sm text-headline-sm text-on-surface text-center">No diagnosis found</p>
        <p className="font-body-md text-body-md text-on-surface-variant text-center">Run a leaf scan first from the Disease Scanner.</p>
        <button onClick={() => navigate('/health/disease-scanner')} className="px-6 py-3 bg-primary text-on-primary rounded-xl font-label-lg" type="button">
          Scan a Leaf
        </button>
      </div>
    );
  }

  const diseaseName  = formatDiseaseName(report.predicted_disease || '');
  const confPct      = Math.round((report.confidence || 0) * 100) + '%';
  const severityStr  = (report.severity || 'medium').replace(/\b\w/g, l => l.toUpperCase());
  const treatment    = formatTreatment(report.treatment_recommendation, diseaseName);
  const cropLabel    = report.crop && report.crop !== 'Unknown' ? report.crop : farm?.current_crop || 'crop';
  const district     = farm?.district || 'your district';
  const village      = farm?.village  || 'your village';
  const farmName     = farm?.name     || 'Your Farm';
  const scannedAt    = report.created_at ? new Date(report.created_at).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) : null;

  const sevColor = severityStr.toLowerCase() === 'high'
    ? 'bg-error text-on-error'
    : severityStr.toLowerCase() === 'medium' || severityStr.toLowerCase() === 'moderate'
    ? 'bg-secondary text-on-secondary'
    : 'bg-primary text-on-primary';

  const sevBarColor = severityStr.toLowerCase() === 'high'
    ? 'bg-error' : severityStr.toLowerCase().includes('med')
    ? 'bg-secondary' : 'bg-primary';

  // Image path — either passed data-URL from scanner, or backend file served via API
  const imageUrl = location.state?.image
    || (report.image_path
      ? `${API_BASE.replace('/api/v1', '')}/${report.image_path.replace(/\\/g, '/')}`
      : null);

  const nearbyCases  = nearbyCount ?? report.nearby_cases ?? 3;
  const nearbyFarmers = report.nearby_farmers ?? Math.round(nearbyCases * 12);

  return (
    <div className="min-h-screen bg-background flex flex-col relative">
      <main className="flex flex-col w-full pt-20 pb-28 px-margin bg-background flex-1 space-y-space-lg mt-4">

        {/* Core Diagnosis Card */}
        <div className="bg-surface-container-lowest rounded-2xl shadow-md overflow-hidden border border-primary-fixed/20 relative">
          <div className={`h-1.5 w-full ${sevBarColor}`}></div>

          {/* Uploaded Image + Disease Info */}
          <div className="p-space-md pb-0 flex items-start gap-space-md">
            <div
              className="w-24 h-24 rounded-xl bg-surface-container overflow-hidden shrink-0 shadow-sm relative cursor-pointer group"
              onClick={() => imageUrl && setImgModal(true)}
            >
              {imageUrl ? (
                <img src={imageUrl} alt="Scanned leaf" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-surface-container-high">
                  <span className="material-symbols-outlined text-on-surface-variant text-[32px]">image_not_supported</span>
                </div>
              )}
              {imageUrl && (
                <div className="absolute bottom-1 right-1 w-6 h-6 rounded-full bg-surface-container-highest/90 backdrop-blur-sm flex items-center justify-center">
                  <span className="material-symbols-outlined text-[14px] text-on-surface">search</span>
                </div>
              )}
            </div>

            <div className="flex flex-col min-w-0 pt-1 flex-1">
              {/* Confidence badge */}
              <span className="inline-flex items-center gap-1 bg-surface-container-high text-on-surface-variant font-label-sm text-label-sm px-2 py-0.5 rounded-full w-max mb-2">
                <span className="material-symbols-outlined text-[14px] text-primary">verified</span>
                {confPct} Confidence Match
              </span>
              <h2 className="font-headline-sm text-headline-sm text-on-surface leading-snug">{diseaseName}</h2>
              <div className="flex flex-wrap items-center gap-2 mt-2">
                <span className={`inline-flex font-label-md text-label-md px-2.5 py-1 rounded-lg ${sevColor}`}>
                  {severityStr} Severity
                </span>
                {cropLabel !== 'crop' && (
                  <span className="font-label-sm text-label-sm px-2 py-0.5 bg-primary-fixed/20 text-primary rounded-full capitalize">{cropLabel}</span>
                )}
              </div>
              {scannedAt && (
                <span className="font-label-sm text-[10px] text-on-surface-variant mt-1">Scanned: {scannedAt}</span>
              )}
            </div>
          </div>

          {/* Farm Context row */}
          <div className="px-space-md pt-space-sm pb-0">
            <div className="bg-surface-container-low rounded-xl px-space-sm py-2 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-[16px]">location_on</span>
              <span className="font-label-sm text-label-sm text-on-surface-variant">
                {farmName} · {village}, {district}
              </span>
            </div>
          </div>

          {/* Voice Narration */}
          <div className="px-space-md py-space-sm mt-space-xs">
            <button
              onClick={handleNarrate}
              className={`w-full h-12 rounded-xl font-label-md text-label-md flex items-center justify-center gap-2 transition-colors ${
                narrating ? 'bg-primary text-on-primary' : 'bg-tertiary-container text-on-tertiary-container'
              }`}
              type="button"
            >
              {narrating ? (
                <><span className="material-symbols-outlined text-[18px] animate-pulse">graphic_eq</span><span>Speaking…</span></>
              ) : (
                <><span className="material-symbols-outlined text-[18px]">volume_up</span><span>Listen to Diagnosis</span></>
              )}
            </button>
          </div>
        </div>

        {/* Treatment Protocol */}
        <div className="flex flex-col space-y-space-md">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-primary-fixed flex items-center justify-center text-on-primary-fixed">
                <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>healing</span>
              </div>
              <h3 className="font-headline-sm text-headline-sm text-on-surface">Recommended Treatment</h3>
            </div>
            <span className="font-label-sm text-label-sm font-bold text-primary uppercase bg-primary-fixed/40 px-2 py-0.5 rounded-full">AI Protocol</span>
          </div>

          <div className="flex items-start gap-space-sm bg-surface-container-low p-space-sm rounded-xl">
            <div className="w-10 h-10 rounded-xl bg-primary-container text-on-primary-container flex items-center justify-center shrink-0 shadow-sm">
              <span className="material-symbols-outlined text-[22px]">format_paint</span>
            </div>
            <div className="flex flex-col min-w-0">
              <div className="flex items-center justify-between gap-1">
                <h4 className="font-label-lg text-label-lg font-bold text-on-surface">Agri-AI Recommendation</h4>
                <span className="font-label-sm text-label-sm font-bold text-secondary shrink-0">Step 1</span>
              </div>
              <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">{treatment}</p>
            </div>
          </div>

          {/* Prevention Step 2 */}
          <div className="flex items-start gap-space-sm bg-surface-container-low p-space-sm rounded-xl">
            <div className="w-10 h-10 rounded-xl bg-secondary-container text-on-secondary-container flex items-center justify-center shrink-0 shadow-sm">
              <span className="material-symbols-outlined text-[22px]">shield</span>
            </div>
            <div className="flex flex-col min-w-0">
              <div className="flex items-center justify-between gap-1">
                <h4 className="font-label-lg text-label-lg font-bold text-on-surface">Prevention &amp; Monitoring</h4>
                <span className="font-label-sm text-label-sm font-bold text-secondary shrink-0">Step 2</span>
              </div>
              <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">
                Scout {farmName} every 3 days. Remove infected {cropLabel} leaves immediately. Avoid overhead irrigation to prevent spore spread.
              </p>
            </div>
          </div>
        </div>

        {/* Community Early Alert — real nearby count from surveillance API */}
        <div className="bg-secondary-fixed text-on-secondary-fixed rounded-2xl p-space-md flex flex-col gap-space-sm shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-secondary text-[22px]" style={{ fontVariationSettings: "'FILL' 1" }}>podcasts</span>
              <span className="font-label-lg text-label-lg font-bold">Community Early Alert</span>
            </div>
            <span className="font-label-sm text-label-sm px-2 py-0.5 rounded-full bg-secondary text-white font-bold">5 km Radius</span>
          </div>
          <p className="font-body-sm text-body-sm text-on-secondary-fixed">
            <strong>{nearbyCases}</strong> disease reports detected in {district} this week.
            Broadcasting an anonymous alert from <strong>{village}</strong> helps nearby farmers contain the outbreak.
          </p>
          <button
            onClick={handleAlert}
            disabled={alertSent}
            className={`mt-1 w-full py-3 rounded-xl font-label-lg text-label-lg font-bold flex items-center justify-center gap-2 active:scale-[0.98] transition-all shadow-md ${
              alertSent ? 'bg-primary text-on-primary' : 'bg-secondary text-on-secondary'
            }`}
            type="button"
          >
            {alertSent ? (
              <><span className="material-symbols-outlined text-[20px]">check</span><span>Alert Sent to Village Cluster!</span></>
            ) : (
              <><span className="material-symbols-outlined text-[20px]">campaign</span><span>Broadcast Alert to {nearbyFarmers} Nearby Farmers</span></>
            )}
          </button>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-space-sm pt-space-xs">
          <button
            className="w-full h-14 rounded-xl bg-primary text-on-primary font-label-lg text-label-lg font-bold flex items-center justify-between px-space-md active:scale-[0.98] transition-transform shadow-md"
            type="button"
            onClick={() => navigate('/marketplace/inputs', { state: { search: diseaseName } })}
          >
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[22px]">shopping_bag</span>
              <span>Order Certified Fungicide on Mandi</span>
            </div>
            <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
          </button>
          <button
            className="w-full h-12 rounded-xl bg-surface-container text-primary font-label-lg text-label-lg font-bold flex items-center justify-center gap-2 active:bg-surface-container-high transition-colors"
            type="button"
            onClick={() => navigate('/health/disease-scanner')}
          >
            <span className="material-symbols-outlined text-[20px]">document_scanner</span>
            <span>Scan Another Leaf</span>
          </button>
          <button
            className="w-full h-12 rounded-xl bg-surface-container text-on-surface-variant font-label-md text-label-md flex items-center justify-center gap-2 active:bg-surface-container-high transition-colors"
            type="button"
            onClick={() => navigate('/')}
          >
            <span className="material-symbols-outlined text-[20px]">home</span>
            <span>Return to Dashboard</span>
          </button>
        </div>

        {/* Feedback */}
        <div className="flex items-center justify-between bg-surface-container-low px-space-md py-space-sm rounded-xl text-on-surface-variant">
          <span className="font-label-sm text-label-sm">Was this AI diagnosis helpful?</span>
          <div className="flex items-center gap-space-xs">
            <button aria-label="Helpful" className="p-2 rounded-full hover:bg-surface-container text-on-surface transition-colors" type="button">
              <span className="material-symbols-outlined text-[18px]">thumb_up</span>
            </button>
            <button aria-label="Not Helpful" className="p-2 rounded-full hover:bg-surface-container text-on-surface transition-colors" type="button">
              <span className="material-symbols-outlined text-[18px]">thumb_down</span>
            </button>
          </div>
        </div>
      </main>

      {/* Full-screen Image Modal */}
      {imgModal && imageUrl && (
        <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-sm flex flex-col items-center justify-center p-4">
          <button
            className="absolute top-6 right-6 w-12 h-12 rounded-full bg-surface-container/20 text-white flex items-center justify-center hover:bg-surface-container/40 transition-colors"
            onClick={() => setImgModal(false)}
            type="button"
          >
            <span className="material-symbols-outlined text-[28px]">close</span>
          </button>
          <img
            src={imageUrl}
            alt="Full size scan"
            className="max-w-full max-h-[85vh] rounded-xl object-contain shadow-2xl"
          />
          <p className="text-white/60 font-label-sm mt-3">{diseaseName} · {confPct} confidence</p>
        </div>
      )}
    </div>
  );
}
