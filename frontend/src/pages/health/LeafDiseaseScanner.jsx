import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AppShell from '../../layouts/AppShell';
import { detectDisease } from '../../api/healthApi';
import { useTranslation } from 'react-i18next';

export default function LeafDiseaseScanner() {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();

  const handleLanguageToggle = () => {
    const nextLang = i18n.language === 'en' ? 'hi' : 'en';
    i18n.changeLanguage(nextLang);
    localStorage.setItem('agri_language', nextLang);
  };
  const farmId = localStorage.getItem('farmId') || '00000000-0000-0000-0000-000000000000';
  const [loading, setLoading] = useState(false);
  const [flipped, setFlipped] = useState(false);
  const [facingMode, setFacingMode] = useState('environment');
  const [audioActive, setAudioActive] = useState(false);
  const [flash, setFlash] = useState(false);
  const fileInputRef = useRef(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  useEffect(() => {
    let activeStream = null;
    const startCamera = async () => {
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode }
        });
        activeStream = mediaStream;
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
        }
      } catch (err) {
        console.error("Camera access denied or unavailable", err);
      }
    };
    startCamera();

    return () => {
      if (activeStream) {
        activeStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [facingMode]);

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('farm_id', farmId);
      formData.append('crop', 'Unknown');
      formData.append('file', file);

      const res = await detectDisease(formData);
      const imageUrl = URL.createObjectURL(file);
      navigate('/health/disease-result', { state: { result: res.data, image: imageUrl } });
    } catch (err) {
      setLoading(false);
      console.error(err);
    }
  };

  const handleCapture = async () => {
    setFlash(true);
    setTimeout(() => setFlash(false), 120);

    if (!videoRef.current || !canvasRef.current) return;
    
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth || 480;
    canvas.height = video.videoHeight || 640;
    const ctx = canvas.getContext('2d');
    
    if (facingMode === 'user') {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }
    
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    canvas.toBlob(async (blob) => {
      if (!blob) return;
      
      setLoading(true);
      try {
        const file = new File([blob], 'leaf.jpg', { type: 'image/jpeg' });
        const formData = new FormData();
        formData.append('farm_id', farmId);
        formData.append('crop', 'Unknown');
        formData.append('file', file);

        const res = await detectDisease(formData);
        
        // Stop camera stream before navigating away
        if (videoRef.current && videoRef.current.srcObject) {
          videoRef.current.srcObject.getTracks().forEach(track => track.stop());
        }
        
        const imageUrl = URL.createObjectURL(blob);
        navigate('/health/disease-result', { state: { result: res.data, image: imageUrl } });
      } catch (err) {
        setLoading(false);
        console.error(err);
      }
    }, 'image/jpeg', 0.8);
  };

  const handleAudio = () => {
    setAudioActive(true);
    setTimeout(() => setAudioActive(false), 400);
  };

  return (
      <AppShell 
        variant="detail" 
        hideBottomNav={true}
        title=""
        rootClassName="bg-inverse-surface text-inverse-on-surface selection:bg-primary-fixed"
        headerClassName="bg-surface/80 backdrop-blur-md"
        headerHeightClass="h-14"
        backButtonClassName="w-11 h-11 shrink-0"
        headerTopSlot={
          <div className="h-6 px-margin flex items-center justify-between bg-black/40">
            <div className="flex items-center gap-space-xs">
              <span className="w-2 h-2 rounded-full bg-primary-fixed animate-pulse"></span>
              <span className="font-label-sm text-label-sm uppercase tracking-wider text-surface-container-high">OFFLINE AI DIAGNOSIS READY</span>
            </div>
            <div className="flex items-center gap-space-xs text-surface-container-high">
              <span className="material-symbols-outlined text-[14px]">offline_bolt</span>
            </div>
          </div>
        }
        headerRightSlot={
          <>
            <button aria-label="Toggle Flash" className="w-11 h-11 flex items-center justify-center rounded-full text-inverse-on-surface hover:bg-white/10 active:bg-white/20 transition-colors" type="button">
              <span className="material-symbols-outlined text-[22px]">flash_on</span>
            </button>
            <button onClick={handleLanguageToggle} aria-label="Select Language" className="min-h-[44px] px-4 rounded-full bg-white/15 text-inverse-on-surface flex items-center gap-space-xs hover:bg-white/25 active:bg-white/30 transition-colors" type="button">
              <span className="material-symbols-outlined text-[16px] text-primary-fixed">language</span>
              <span className="font-label-md text-label-md">{i18n.language === 'hi' ? 'हिंदी' : 'English'}</span>
            </button>
          </>
        }
      >
        <div className="flex-1 flex flex-col relative w-full pt-[104px] pb-safe">
          <div className="flex flex-col w-full relative select-none">
            {/* Interactive Viewfinder Stage */}
            <div className="relative w-full overflow-hidden bg-inverse-surface rounded-b-xl shadow-md" style={{ height: 'calc(100dvh - 180px)', minHeight: '520px' }}>
              {/* Live Camera Feed */}
              <video 
                ref={videoRef}
                autoPlay 
                playsInline 
                muted
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 ease-out"
                style={{ 
                  transform: facingMode === 'user' ? 'scaleX(-1)' : 'scaleX(1)'
                }}
              />
              <canvas ref={canvasRef} className="hidden" />
              <div className="absolute inset-0 bg-gradient-to-b from-inverse-surface/70 via-transparent to-inverse-surface/80 pointer-events-none"></div>
              
              {/* Top Guidance & Audio Readout Banner */}
              <div className="relative z-10 mx-margin mt-space-sm">
                <div className="bg-surface/95 backdrop-blur-md text-on-surface px-space-md py-space-sm rounded-xl shadow-md flex items-center justify-between gap-space-sm">
                  <div className="flex items-center gap-space-sm min-w-0">
                    <div className="w-10 h-10 rounded-full bg-secondary-fixed flex items-center justify-center shrink-0 text-secondary">
                      <span className="material-symbols-outlined text-[24px]" style={{ fontVariationSettings: "'FILL' 1" }}>wb_sunny</span>
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="font-label-md text-label-md text-on-surface font-bold leading-tight truncate">Place diseased leaf inside box</span>
                      <span className="font-label-sm text-label-sm text-on-surface-variant leading-none pt-0.5">Keep sunlight bright &amp; steady</span>
                    </div>
                  </div>
                  <button
                    onClick={handleAudio}
                    aria-label="Audio Instructions"
                    className={`w-11 h-11 shrink-0 rounded-full text-on-tertiary flex items-center justify-center transition-transform shadow-sm ${audioActive ? 'scale-110 bg-primary-container' : 'bg-tertiary-container active:scale-95'}`}
                    type="button"
                  >
                    <span className="material-symbols-outlined text-[22px]">volume_up</span>
                  </button>
                </div>
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
                      <span>Ready to Scan</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Quick Outdoor Capture Rule Chips */}
              <div className="absolute bottom-space-md inset-x-0 z-10 flex justify-center items-center gap-space-xs px-margin pointer-events-none">
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
            </div>

            {/* Bottom Ergonomic Control Dock */}
            <div className="w-full bg-inverse-surface px-margin py-space-md flex items-center justify-between z-20">
              {/* Gallery Upload Option */}
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileUpload} 
                accept="image/*" 
                className="hidden" 
              />
              <button 
                onClick={() => fileInputRef.current?.click()}
                disabled={loading}
                aria-label="Upload from Phone Gallery" 
                className="flex flex-col items-center justify-center min-w-[72px] h-14 rounded-xl bg-white/10 active:bg-white/20 text-inverse-on-surface transition-colors p-1 disabled:opacity-50" 
                type="button"
              >
                <span className="material-symbols-outlined text-[24px]">photo_library</span>
                <span className="font-label-sm text-label-sm mt-0.5">Gallery</span>
              </button>
              
              {/* Main Tactile Shutter Button */}
              <div className="relative flex items-center justify-center">
                <div className="absolute w-20 h-20 rounded-full bg-primary-fixed/20 animate-ping pointer-events-none"></div>
                <button
                  onClick={handleCapture}
                  disabled={loading}
                  aria-label="Capture Leaf Image"
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
            <button 
              onClick={() => {
                setFacingMode(prev => prev === 'environment' ? 'user' : 'environment');
                setFlipped(f => !f);
              }}
              aria-label="Flip Camera or Toggle Lens" 
              className="flex flex-col items-center justify-center min-w-[72px] h-14 rounded-xl bg-white/10 active:bg-white/20 text-inverse-on-surface transition-colors p-1" 
              type="button"
            >
              <span className="material-symbols-outlined text-[24px] transition-transform duration-300" style={{ transform: flipped ? 'rotate(180deg)' : 'rotate(0deg)' }}>flip_camera_ios</span>
              <span className="font-label-sm text-label-sm mt-0.5">Flip</span>
            </button>
          </div>
          </div>
        </div>
      </AppShell>
  );
}
