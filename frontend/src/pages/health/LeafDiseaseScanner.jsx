import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { detectDisease } from '../../api/healthApi';

export default function LeafDiseaseScanner() {
  const navigate = useNavigate();
  const farmId = localStorage.getItem('farmId') || '00000000-0000-0000-0000-000000000000';
  const [loading, setLoading] = useState(false);
  const [flipped, setFlipped] = useState(false);
  const [audioActive, setAudioActive] = useState(false);
  const [flash, setFlash] = useState(false);

  const handleCapture = async () => {
    setFlash(true);
    setTimeout(() => setFlash(false), 120);

    setLoading(true);
    try {
      // Dummy image payload since no actual camera hardware is hooked up
      const blob = new Blob(['dummy'], { type: 'image/jpeg' });
      const file = new File([blob], 'leaf.jpg', { type: 'image/jpeg' });
      
      const formData = new FormData();
      formData.append('farm_id', farmId);
      formData.append('crop', 'Wheat');
      formData.append('file', file);

      const res = await detectDisease(formData);
      
      // Pass the API result directly to the result page via router state
      navigate('/health/disease-result', { state: { result: res.data } });
    } catch (err) {
      setLoading(false);
      // Optional: Handle error toast here
    }
  };

  const handleAudio = () => {
    setAudioActive(true);
    setTimeout(() => setAudioActive(false), 400);
  };

  return (
    <div className="min-h-screen bg-black flex flex-col pt-safe pb-safe relative overflow-hidden">
      {/* Live Viewfinder Feed */}
      <div 
        className="absolute inset-0 z-0 transition-transform duration-300" 
        style={{ transform: flipped ? 'scaleX(-1)' : 'scaleX(1)' }}
      >
        <img
          src="https://lh3.googleusercontent.com/aida-public/AB6AXuB3_g40s_n38iX-s8nZ_cK2XFpZ80R1xY_4lR7aGq-D9N3e0bXk2O4uD9vE_hM7oYm6K6VqZ6y8mPqI8R8x_t_Q8Cj-z_R0n_VlqE7_32_PZc8Kx-3K_V0A5s7L_L5n7Uf5l3J6W5qM-5vR_4dG_V9oR_9H_3U8Y3v2h_6fI-9R8u5_gX"
          alt="Viewfinder feed"
          className="w-full h-full object-cover"
        />
      </div>

      {/* Top Floating App Bar */}
      <div className="w-full px-margin pt-space-sm pb-2 flex items-start justify-between z-20">
        <button onClick={() => navigate(-1)} className="w-11 h-11 shrink-0 rounded-full bg-surface-container-highest/80 backdrop-blur-md text-on-surface flex items-center justify-center active:bg-surface-variant transition-colors" type="button">
          <span className="material-symbols-outlined text-[24px]">close</span>
        </button>
        <div className="flex-1 max-w-[240px] mx-auto bg-surface-container-highest/90 backdrop-blur-xl rounded-2xl p-2 shadow-lg">
          <div className="flex items-center gap-space-sm min-w-0">
            <div className="w-10 h-10 rounded-full bg-secondary-fixed flex items-center justify-center shrink-0 text-secondary">
              <span className="material-symbols-outlined text-[24px]" style={{ fontVariationSettings: "'FILL' 1" }}>wb_sunny</span>
            </div>
            <div className="flex flex-col min-w-0">
              <span className="font-label-md text-label-md text-on-surface font-bold leading-tight truncate">Place diseased leaf inside box</span>
              <span className="font-label-sm text-label-sm text-on-surface-variant leading-none pt-0.5">Keep sunlight bright &amp; steady</span>
            </div>
          </div>
        </div>
        <button
          onClick={handleAudio}
          className={`w-11 h-11 shrink-0 rounded-full text-on-tertiary flex items-center justify-center transition-transform shadow-sm ${audioActive ? 'scale-110 bg-primary-container' : 'bg-tertiary-container active:scale-95'}`}
          type="button"
        >
          <span className="material-symbols-outlined text-[22px]">volume_up</span>
        </button>
      </div>

      {/* Central Augmented Leaf Targeting Reticle */}
      <div className="absolute inset-0 flex items-center justify-center p-gutter pointer-events-none z-10">
        <div className="relative w-full max-w-[280px] h-[340px] flex items-center justify-center">
          {/* Four Corner Framing Brackets */}
          <div className="absolute top-0 left-0 w-8 h-8 rounded-tl-xl border-t-4 border-l-4 border-primary-fixed shadow-sm"></div>
          <div className="absolute top-0 right-0 w-8 h-8 rounded-tr-xl border-t-4 border-r-4 border-primary-fixed shadow-sm"></div>
          <div className="absolute bottom-0 left-0 w-8 h-8 rounded-bl-xl border-b-4 border-l-4 border-primary-fixed shadow-sm"></div>
          <div className="absolute bottom-0 right-0 w-8 h-8 rounded-br-xl border-b-4 border-r-4 border-primary-fixed shadow-sm"></div>
          
          {/* Animated Center Target Laser & Leaf Silhouette */}
          <div className="w-full h-full flex flex-col items-center justify-center p-space-md">
            <svg className="w-48 h-64 text-primary-fixed/60 drop-shadow-md animate-pulse" fill="none" viewBox="0 0 100 160" xmlns="http://www.w3.org/2000/svg">
              <path d="M50 10C50 10 20 45 20 95C20 135 48 150 50 155C52 150 80 135 80 95C80 45 50 10 50 10Z" stroke="currentColor" strokeDasharray="6 6" strokeLinecap="round" strokeWidth="2.5"></path>
              <path d="M50 20V150" stroke="currentColor" strokeDasharray="4 4" strokeLinecap="round" strokeWidth="2"></path>
              <path d="M36 65L50 80L64 65" stroke="currentColor" strokeLinecap="round" strokeWidth="2"></path>
              <path d="M32 95L50 110L68 95" stroke="currentColor" strokeLinecap="round" strokeWidth="2"></path>
            </svg>
          </div>
          
          {/* Dynamic Realtime AI Quality Feedback Badge */}
          {loading ? (
            <div className="absolute -bottom-4 bg-secondary-container text-on-secondary font-label-sm text-label-sm px-space-md py-1 rounded-full shadow-md flex items-center gap-space-xs transition-all duration-300">
              <span className="material-symbols-outlined text-[16px] text-secondary-fixed animate-spin">sync</span>
              <span>Analyzing Leaf Health...</span>
            </div>
          ) : (
            <div className="absolute -bottom-4 bg-primary-container text-on-primary font-label-sm text-label-sm px-space-md py-1 rounded-full shadow-md flex items-center gap-space-xs transition-all duration-300">
              <span className="material-symbols-outlined text-[16px] text-primary-fixed" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
              <span>Leaf Detected - Yellow Rust Suspected</span>
            </div>
          )}
        </div>
      </div>

      {/* Quick Outdoor Capture Rule Chips */}
      <div className="absolute bottom-32 inset-x-0 z-10 flex justify-center items-center gap-space-xs px-margin pointer-events-none">
        <div className="bg-inverse-surface/85 backdrop-blur-md px-space-sm py-1 rounded-full flex items-center gap-1 shadow-sm">
          <span className="material-symbols-outlined text-[16px] text-primary-fixed">straighten</span>
          <span className="font-label-sm text-label-sm text-inverse-on-surface">15 cm distance</span>
        </div>
        <div className="bg-inverse-surface/85 backdrop-blur-md px-space-sm py-1 rounded-full flex items-center gap-1 shadow-sm">
          <span className="material-symbols-outlined text-[16px] text-primary-fixed">filter_vintage</span>
          <span className="font-label-sm text-label-sm text-inverse-on-surface">1 Leaf only</span>
        </div>
        <div className="bg-inverse-surface/85 backdrop-blur-md px-space-sm py-1 rounded-full flex items-center gap-1 shadow-sm">
          <span className="material-symbols-outlined text-[16px] text-secondary-fixed">wb_sunny</span>
          <span className="font-label-sm text-label-sm text-inverse-on-surface">No shadow</span>
        </div>
      </div>

      {/* Interactive Capture Shutter Flash Screen Overlay */}
      <div className={`absolute inset-0 bg-surface-container-lowest pointer-events-none transition-opacity duration-150 z-30 ${flash ? 'opacity-90' : 'opacity-0'}`}></div>

      <div className="flex-1"></div>

      {/* Bottom Ergonomic Control Dock */}
      <div className="w-full bg-inverse-surface px-margin py-space-md flex items-center justify-between z-20 pb-safe">
        {/* Gallery Upload Option */}
        <button className="flex flex-col items-center justify-center min-w-[72px] h-14 rounded-xl bg-white/10 active:bg-white/20 text-inverse-on-surface transition-colors p-1" type="button">
          <span className="material-symbols-outlined text-[24px]">photo_library</span>
          <span className="font-label-sm text-label-sm mt-0.5">Gallery</span>
        </button>
        
        {/* Main Tactile Shutter Button */}
        <div className="relative flex items-center justify-center">
          <div className="absolute w-20 h-20 rounded-full bg-primary-fixed/20 animate-ping pointer-events-none"></div>
          <button
            onClick={handleCapture}
            disabled={loading}
            className="w-[68px] h-[68px] rounded-full bg-primary-fixed flex items-center justify-center shadow-lg active:scale-90 transition-transform focus:outline-none p-1.5"
            type="button"
          >
            <div className="w-full h-full rounded-full bg-surface-container-lowest flex items-center justify-center shadow-inner">
              <div className="w-12 h-12 rounded-full bg-primary-container flex items-center justify-center text-on-primary shadow-sm">
                <span className="material-symbols-outlined text-[26px]">photo_camera</span>
              </div>
            </div>
          </button>
        </div>
        
        {/* Camera Flip / Lens Toggle */}
        <button onClick={() => setFlipped(f => !f)} className="flex flex-col items-center justify-center min-w-[72px] h-14 rounded-xl bg-white/10 active:bg-white/20 text-inverse-on-surface transition-colors p-1" type="button">
          <span className="material-symbols-outlined text-[24px] transition-transform duration-300" style={{ transform: flipped ? 'rotate(180deg)' : 'rotate(0deg)' }}>flip_camera_ios</span>
          <span className="font-label-sm text-label-sm mt-0.5">Flip</span>
        </button>
      </div>
    </div>
  );
}
