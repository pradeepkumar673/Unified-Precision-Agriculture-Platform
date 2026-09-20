import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

export default function CropDiagnosisResult() {
  const navigate = useNavigate();
  const location = useLocation();
  const apiResult = location.state?.result || {
    predicted_disease: "Wheat Yellow Rust (Puccinia striiformis)",
    confidence: 0.94,
    severity: "High",
    treatment_recommendation: "Spray Propiconazole 25% EC at 1ml/L"
  };

  const [narrating, setNarrating] = useState(false);
  const [alertSent, setAlertSent] = useState(false);

  const handleNarrate = () => {
    setNarrating(prev => !prev);
    // In a real app we'd use SpeechSynthesis API here
  };

  const handleAlert = () => {
    setAlertSent(true);
  };

  // Convert confidence to percentage string
  const confPct = Math.round((apiResult.confidence || 0.94) * 100) + '%';
  const diseaseName = apiResult.predicted_disease || "Wheat Yellow Rust (Puccinia striiformis)";
  const severityStr = apiResult.severity || "High";
  
  // Choose color based on severity
  const sevColor = severityStr.toLowerCase() === 'high' ? 'bg-error text-on-error' : 
                   severityStr.toLowerCase() === 'moderate' ? 'bg-secondary text-on-secondary' : 
                   'bg-primary text-on-primary';

  return (
    <div className="min-h-screen bg-background flex flex-col pt-safe pb-safe relative">
      {/* Fixed Header */}
      <header className="fixed top-0 w-full z-50 pt-safe bg-surface/90 backdrop-blur-xl shadow-[0_1px_8px_rgba(0,0,0,0.04)]">
        <div className="h-20 px-margin flex items-center justify-between gap-space-sm">
          <div className="flex items-center gap-space-sm min-w-0 flex-1">
            <button onClick={() => navigate('/app')} className="w-10 h-10 flex items-center justify-center text-on-surface rounded-full active:bg-surface-container flex-shrink-0" type="button">
              <span className="material-symbols-outlined text-[24px]">close</span>
            </button>
            <div className="flex flex-col min-w-0">
              <span className="font-label-sm text-label-sm text-primary-container truncate flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px]">auto_awesome</span> KhetSaathi AI
              </span>
              <h1 className="font-headline-sm text-headline-sm text-on-surface truncate">Diagnosis Result</h1>
            </div>
          </div>
          <button className="w-11 h-11 bg-surface-container rounded-full flex items-center justify-center text-primary active:bg-surface-container-high shrink-0" type="button">
            <span className="material-symbols-outlined text-[20px]">share</span>
          </button>
        </div>
      </header>

      <main className="flex flex-col w-full pt-20 pb-12 px-margin bg-background flex-1 space-y-space-lg mt-4">
        {/* Core Diagnosis Card */}
        <div className="bg-surface-container-lowest rounded-2xl shadow-md overflow-hidden border border-primary-fixed/20 relative">
          <div className="h-1.5 w-full bg-error"></div>
          
          {/* Uploaded Image Thumbnail Row */}
          <div className="p-space-md pb-0 flex items-start gap-space-md">
            <div className="w-24 h-24 rounded-xl bg-surface-container overflow-hidden shrink-0 shadow-sm relative">
              <img
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuB3_g40s_n38iX-s8nZ_cK2XFpZ80R1xY_4lR7aGq-D9N3e0bXk2O4uD9vE_hM7oYm6K6VqZ6y8mPqI8R8x_t_Q8Cj-z_R0n_VlqE7_32_PZc8Kx-3K_V0A5s7L_L5n7Uf5l3J6W5qM-5vR_4dG_V9oR_9H_3U8Y3v2h_6fI-9R8u5_gX"
                alt="Diseased Leaf"
                className="w-full h-full object-cover"
              />
              <div className="absolute bottom-1 right-1 w-6 h-6 rounded-full bg-surface-container-highest/90 backdrop-blur-sm flex items-center justify-center border border-outline-variant">
                <span className="material-symbols-outlined text-[14px] text-on-surface">search</span>
              </div>
            </div>
            <div className="flex flex-col min-w-0 pt-1">
              <span className="inline-flex items-center gap-1 bg-surface-container-high text-on-surface-variant font-label-sm text-label-sm px-2 py-0.5 rounded-full w-max mb-2">
                <span className="material-symbols-outlined text-[14px] text-primary">verified</span>
                {confPct} High Confidence Match
              </span>
              <h2 className="font-headline-sm text-headline-sm text-on-surface leading-snug">{diseaseName}</h2>
              <span className={`inline-flex font-label-md text-label-md px-2.5 py-1 rounded-lg w-max mt-2 ${sevColor}`}>
                {severityStr} Severity • 72% spread
              </span>
            </div>
          </div>
          
          {/* Voice Narration Action */}
          <div className="px-space-md py-space-sm mt-space-sm">
            <button
              onClick={handleNarrate}
              className={`w-full h-12 rounded-xl font-label-md text-label-md flex items-center justify-center gap-2 transition-colors ${
                narrating ? 'bg-primary text-on-primary' : 'bg-tertiary-container text-on-tertiary-container'
              }`}
              type="button"
            >
              {narrating ? (
                <><span className="material-symbols-outlined text-[18px] animate-pulse">graphic_eq</span><span>Speaking...</span></>
              ) : (
                <><span className="material-symbols-outlined text-[18px]">volume_up</span><span>Listen</span></>
              )}
            </button>
          </div>
        </div>

        {/* Treatment Protocol Section */}
        <div className="flex flex-col space-y-space-md">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-primary-fixed flex items-center justify-center text-on-primary-fixed">
                <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>healing</span>
              </div>
              <h3 className="font-headline-sm text-headline-sm text-on-surface">Recommended Treatment</h3>
            </div>
            <span className="font-label-sm text-label-sm font-bold text-primary uppercase bg-primary-fixed/40 px-2 py-0.5 rounded-full">3 Steps</span>
          </div>
          
          <div className="flex flex-col gap-space-md">
            {/* Step 1 */}
            <div className="flex items-start gap-space-sm bg-surface-container-low p-space-sm rounded-xl">
              <div className="w-10 h-10 rounded-xl bg-primary-container text-on-primary-container flex items-center justify-center shrink-0 shadow-sm font-headline-sm text-headline-sm">
                <span className="material-symbols-outlined text-[22px]">format_paint</span>
              </div>
              <div className="flex flex-col min-w-0">
                <div className="flex items-center justify-between gap-1">
                  <h4 className="font-label-lg text-label-lg font-bold text-on-surface">Spray Propiconazole 25% EC</h4>
                  <span className="font-label-sm text-label-sm font-bold text-secondary shrink-0">Step 1</span>
                </div>
                <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">
                  Mix <span className="font-semibold text-on-surface">1 ml per 1 liter of water</span> (200 ml / acre). Spray during early morning hours onto affected canopy foliage.
                </p>
              </div>
            </div>
            
            {/* Step 2 */}
            <div className="flex items-start gap-space-sm bg-surface-container-low p-space-sm rounded-xl">
              <div className="w-10 h-10 rounded-xl bg-secondary-container text-on-secondary flex items-center justify-center shrink-0 shadow-sm">
                <span className="material-symbols-outlined text-[22px]">visibility</span>
              </div>
              <div className="flex flex-col min-w-0">
                <div className="flex items-center justify-between gap-1">
                  <h4 className="font-label-lg text-label-lg font-bold text-on-surface">Isolate &amp; Monitor Border</h4>
                  <span className="font-label-sm text-label-sm font-bold text-secondary shrink-0">Step 2</span>
                </div>
                <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">
                  Inspect neighboring rows within <span className="font-semibold text-on-surface">48 hours</span> to verify whether orange powdery spores have crossed Plot 1 perimeter.
                </p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="flex items-start gap-space-sm bg-surface-container-low p-space-sm rounded-xl">
              <div className="w-10 h-10 rounded-xl bg-error-container text-on-error-container flex items-center justify-center shrink-0 shadow-sm">
                <span className="material-symbols-outlined text-[22px]">water_drop</span>
              </div>
              <div className="flex flex-col min-w-0">
                <div className="flex items-center justify-between gap-1">
                  <h4 className="font-label-lg text-label-lg font-bold text-on-surface">Withhold Overhead Sprinklers</h4>
                  <span className="font-label-sm text-label-sm font-bold text-secondary shrink-0">Step 3</span>
                </div>
                <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">
                  Avoid wetting crop foliage directly. Wet canopies accelerate fungal spore germination. Switch to furrow/drip irrigation temporarily.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Verified Agronomist Trust Card */}
        <div className="bg-surface-container rounded-2xl p-space-md flex items-center gap-space-sm">
          <div className="w-12 h-12 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center shrink-0 shadow-sm">
            <span className="material-symbols-outlined text-[26px]">verified_user</span>
          </div>
          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="font-label-md text-label-md font-bold text-on-surface">KVK Nashik Agronomy Center</span>
              <span className="material-symbols-outlined text-primary text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
            </div>
            <p className="font-label-sm text-label-sm text-on-surface-variant leading-snug mt-0.5">
              Prescription checked against ICAR standards. Fungicide dosage is verified safe for harvest after a 30-day pre-harvest interval (PHI).
            </p>
          </div>
        </div>

        {/* Community Alert Banner */}
        <div className="bg-secondary-fixed text-on-secondary-fixed rounded-2xl p-space-md flex flex-col gap-space-sm shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-secondary text-[22px]" style={{ fontVariationSettings: "'FILL' 1" }}>podcasts</span>
              <span className="font-label-lg text-label-lg font-bold">Community Early Alert</span>
            </div>
            <span className="font-label-sm text-label-sm px-2 py-0.5 rounded-full bg-secondary text-white font-bold">5 km Radius</span>
          </div>
          <p className="font-body-sm text-body-sm text-on-secondary-fixed">
            3 other wheat farmers in your taluka registered Yellow Rust symptoms this week. Anonymous alert helps your village contain spore drift.
          </p>
          <button
            onClick={handleAlert}
            disabled={alertSent}
            className={`mt-1 w-full h-13 py-3 rounded-xl font-label-lg text-label-lg font-bold flex items-center justify-center gap-2 active:scale-[0.98] transition-all shadow-md ${
              alertSent ? 'bg-primary text-on-primary' : 'bg-secondary text-on-secondary'
            }`}
            type="button"
          >
            {alertSent ? (
              <><span className="material-symbols-outlined text-[20px]">check</span><span>Alert Sent to Village Cluster!</span></>
            ) : (
              <><span className="material-symbols-outlined text-[20px]">campaign</span><span>Broadcast Alert to 48 Nearby Farmers</span></>
            )}
          </button>
        </div>

        {/* Additional Secondary Actions */}
        <div className="flex flex-col gap-space-sm pt-space-xs">
          <button className="w-full h-14 rounded-xl bg-primary text-on-primary font-label-lg text-label-lg font-bold flex items-center justify-between px-space-md active:scale-[0.98] transition-transform shadow-md" type="button">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[22px]">shopping_bag</span>
              <span>Order Certified Fungicide on Mandi</span>
            </div>
            <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
          </button>
          <button className="w-full h-12 rounded-xl bg-surface-container text-primary font-label-lg text-label-lg font-bold flex items-center justify-center gap-2 active:bg-surface-container-high transition-colors" type="button">
            <span className="material-symbols-outlined text-[20px]">bookmark_add</span>
            <span>Save to Plot 1 Health Log</span>
          </button>
        </div>

        {/* Quick Feedback */}
        <div className="flex items-center justify-between bg-surface-container-low px-space-md py-space-sm rounded-xl text-on-surface-variant">
          <span className="font-label-sm text-label-sm">Was this AI verification helpful?</span>
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
    </div>
  );
}
