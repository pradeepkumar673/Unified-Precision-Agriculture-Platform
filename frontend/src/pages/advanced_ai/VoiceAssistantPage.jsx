import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { submitVoiceQuery } from '../../api/advancedAiApi';

export default function VoiceAssistantPage() {
  const navigate = useNavigate();
  
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [audioUrl, setAudioUrl] = useState(null);
  const [transcription, setTranscription] = useState('...');
  const [responseHtml, setResponseHtml] = useState(null);
  
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const audioPlaybackRef = useRef(null);

  // Playback state
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      mediaRecorderRef.current.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        const url = URL.createObjectURL(audioBlob);
        setAudioUrl(url);
        
        await handleSubmission(audioBlob);
        
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
      setTranscription('Listening...');
    } catch (err) {
      console.error('Error accessing microphone', err);
      alert('Could not access microphone.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const toggleRecording = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  const handleSubmission = async (audioBlob) => {
    setIsProcessing(true);
    setTranscription('Processing...');
    
    try {
      // In a real app we'd convert Blob to File
      const audioFile = new File([audioBlob], 'voice_query.wav', { type: 'audio/wav' });
      const farmId = localStorage.getItem('farmId') || '00000000-0000-0000-0000-000000000000';
      
      const response = await submitVoiceQuery(farmId, audioFile);
      
      setTranscription(`"${response.transcribed_text}"`);
      
      // Parse the response to simulate the UI
      // In a real scenario, the backend might return structured JSON. Here we just show the text.
      setResponseHtml(
        <div className="bg-surface-container-lowest rounded-xl p-space-md shadow-sm">
          <div className="flex items-center justify-between pb-space-xs mb-space-xs">
            <div className="flex items-center gap-space-sm">
              <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center text-on-primary shadow-sm">
                <span className="material-symbols-outlined text-[20px]">psychology</span>
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h2 className="font-label-lg text-on-surface font-semibold text-[15px]">KhetSaathi Agronomist AI</h2>
                  <span className="material-symbols-outlined text-[16px] text-primary-container" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
                </div>
                <p className="font-label-sm text-on-surface-variant text-[11px]">Just now</p>
              </div>
            </div>
            <div className="px-2 py-0.5 rounded bg-surface-container font-label-sm text-on-surface-variant text-[11px]">
              AI Answer
            </div>
          </div>
          <p className="font-body-md text-on-surface text-[15px] leading-relaxed">
            {response.response_text}
          </p>
          <div className="mt-space-md pt-space-xs flex flex-col gap-2">
            <div className="flex items-center justify-between text-on-surface-variant">
              <div className="flex items-center gap-1.5">
                <span className={`material-symbols-outlined text-[18px] text-primary ${isPlaying ? 'animate-pulse' : ''}`}>volume_up</span>
                <span className="font-label-sm text-on-surface text-[12px] font-medium">{isPlaying ? 'Playing audio' : 'Audio ready'}</span>
              </div>
              <button 
                onClick={togglePlayback}
                className="flex items-center gap-1 text-primary hover:text-primary-container transition-colors py-1 px-2 rounded hover:bg-surface-container" 
              >
                <span className="material-symbols-outlined text-[16px]">{isPlaying ? 'pause' : 'play_arrow'}</span>
                <span className="font-label-sm text-[12px]">{isPlaying ? 'Pause' : 'Play Voice'}</span>
              </button>
            </div>
            <div className="w-full bg-surface-container rounded-full h-2 overflow-hidden flex items-center">
              <div className="bg-primary h-full rounded-full transition-all duration-300" style={{ width: `${progress}%` }}></div>
            </div>
          </div>
        </div>
      );
      
    } catch (err) {
      console.error(err);
      setTranscription('Error processing voice query.');
    } finally {
      setIsProcessing(false);
    }
  };

  const togglePlayback = () => {
    if (!audioPlaybackRef.current && audioUrl) {
      audioPlaybackRef.current = new Audio(audioUrl);
      audioPlaybackRef.current.ontimeupdate = () => {
        setProgress((audioPlaybackRef.current.currentTime / audioPlaybackRef.current.duration) * 100);
      };
      audioPlaybackRef.current.onended = () => {
        setIsPlaying(false);
        setProgress(0);
      };
    }
    
    if (audioPlaybackRef.current) {
      if (isPlaying) {
        audioPlaybackRef.current.pause();
        setIsPlaying(false);
      } else {
        audioPlaybackRef.current.play();
        setIsPlaying(true);
      }
    }
  };

  useEffect(() => {
    return () => {
      if (mediaRecorderRef.current && isRecording) {
        mediaRecorderRef.current.stop();
      }
      if (audioPlaybackRef.current) {
        audioPlaybackRef.current.pause();
      }
    };
  }, [isRecording]);

  const handleQueryClick = (text) => {
    setTranscription(`"${text} ..."`);
    setIsProcessing(true);
    // Simulate backend response for canned query since we don't have audio
    setTimeout(() => {
      setIsProcessing(false);
      setResponseHtml(
        <div className="bg-surface-container-lowest rounded-xl p-space-md shadow-sm mt-4">
          <p className="font-body-md text-on-surface">You asked: {text}. This is a simulated response for keyboard/canned input.</p>
        </div>
      );
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-surface-container-lowest text-on-surface flex flex-col pt-safe pb-safe relative">
      <header className="fixed top-0 w-full z-50 bg-surface-container-lowest/90 backdrop-blur-xl border-b border-surface-container shadow-sm pt-safe">
        <div className="flex items-center justify-between h-14 px-margin">
          <div className="flex items-center gap-space-sm">
            <button onClick={() => navigate(-1)} className="w-10 h-10 flex items-center justify-center rounded-full text-on-surface active:bg-surface-container-high transition-colors" type="button">
              <span className="material-symbols-outlined text-[24px]">arrow_back</span>
            </button>
            <h1 className="font-headline-sm text-headline-sm font-bold text-on-surface truncate">Agronomist Voice</h1>
          </div>
          <div className="flex items-center gap-2">
            <button className="flex items-center justify-center gap-1 w-auto px-3 h-9 rounded-full bg-surface-container-lowest border border-surface-container shadow-sm" type="button">
              <span className="material-symbols-outlined text-[18px] text-primary">volume_up</span>
              <span className="font-label-sm text-on-surface">Auto-play</span>
            </button>
            <div className="px-3 py-1 bg-surface-container rounded-full shadow-sm">
              <span className="font-label-sm text-primary font-bold">EN</span>
            </div>
          </div>
        </div>
      </header>

      <main className="flex flex-col w-full pt-[64px] flex-1 pb-4">
        
        <div className="px-gutter my-space-xs">
          <div className="w-full bg-surface-container-low p-space-sm rounded-xl flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-space-sm min-w-0">
              <div className="w-10 h-10 rounded-lg bg-primary-fixed flex items-center justify-center shrink-0 text-primary">
                <span className="material-symbols-outlined text-[24px]">potted_plant</span>
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="font-label-sm text-primary uppercase tracking-wider">Active Field Context</span>
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-outline-variant"></span>
                  <span className="font-label-sm text-on-surface-variant">Sensor Online</span>
                </div>
                <p className="font-headline-sm text-on-surface truncate text-[16px] leading-tight mt-0.5">Plot 1 • Sharbati Wheat (Day 42 • Tillering)</p>
              </div>
            </div>
            <button aria-label="Change active plot" className="w-9 h-9 rounded-full bg-surface-container flex items-center justify-center text-on-surface-variant shrink-0">
              <span className="material-symbols-outlined text-[20px]">swap_horiz</span>
            </button>
          </div>
        </div>

        <div className="px-gutter mt-space-sm">
          <div className="bg-surface-container-lowest p-space-md rounded-xl shadow-sm relative overflow-hidden min-h-[100px]">
            <div className="flex items-center justify-between mb-2">
              <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-primary-fixed text-on-primary-fixed">
                <span className="material-symbols-outlined text-[14px]">graphic_eq</span>
                <span className="font-label-sm text-[11px]">{isRecording ? 'Listening live...' : (isProcessing ? 'Processing AI...' : 'Ready')}</span>
              </div>
              <span className="font-label-sm text-on-surface-variant">Field Audio</span>
            </div>
            <p className="font-body-lg text-on-surface font-medium leading-snug">
              {transcription}
            </p>
          </div>
        </div>

        <div className="px-gutter my-space-md flex flex-col items-center justify-center relative">
          <div className="relative flex items-center justify-center w-48 h-48 my-1">
            {isRecording && (
              <>
                <div className="absolute inset-0 rounded-full bg-primary/10 animate-ping opacity-60 pointer-events-none"></div>
                <div className="absolute -inset-3 rounded-full bg-primary/15 animate-pulse pointer-events-none"></div>
              </>
            )}
            <button 
              onClick={toggleRecording}
              aria-label={isRecording ? "Stop Listening" : "Start Listening"} 
              className={`relative z-10 w-28 h-28 rounded-full shadow-lg flex flex-col items-center justify-center active:scale-95 transition-all duration-200 ${isRecording ? 'bg-primary-container hover:bg-primary text-on-primary' : 'bg-surface-container-high text-on-surface border-2 border-outline'}`}
            >
              <div className="w-12 h-12 rounded-full bg-surface-tint/30 flex items-center justify-center mb-1">
                <span className={`material-symbols-outlined text-[32px] ${isRecording ? 'text-primary-fixed' : 'text-on-surface'}`} style={{ fontVariationSettings: "'FILL' 1" }}>
                  {isRecording ? 'mic' : 'mic_none'}
                </span>
              </div>
              <span className={`font-label-sm text-[11px] font-semibold ${isRecording ? 'text-primary-fixed' : 'text-on-surface'}`}>
                {isRecording ? 'Tap to Pause' : 'Tap to Speak'}
              </span>
            </button>
          </div>
          
          <div aria-hidden="true" className={`flex items-end justify-center gap-1 h-8 w-56 mt-2 transition-opacity duration-300 ${isRecording ? 'opacity-100' : 'opacity-30'}`}>
            <div className="w-1.5 bg-primary rounded-full animate-bounce h-3" style={{ animationDuration: '450ms', animationDelay: '50ms' }}></div>
            <div className="w-1.5 bg-primary-container rounded-full animate-bounce h-5" style={{ animationDuration: '520ms', animationDelay: '150ms' }}></div>
            <div className="w-1.5 bg-primary rounded-full animate-bounce h-7" style={{ animationDuration: '380ms', animationDelay: '300ms' }}></div>
            <div className="w-1.5 bg-surface-tint rounded-full animate-bounce h-8" style={{ animationDuration: '600ms', animationDelay: '80ms' }}></div>
            <div className="w-1.5 bg-primary rounded-full animate-bounce h-6" style={{ animationDuration: '490ms', animationDelay: '220ms' }}></div>
            <div className="w-1.5 bg-primary-container rounded-full animate-bounce h-7" style={{ animationDuration: '410ms', animationDelay: '100ms' }}></div>
            <div className="w-1.5 bg-primary rounded-full animate-bounce h-4" style={{ animationDuration: '560ms', animationDelay: '190ms' }}></div>
            <div className="w-1.5 bg-surface-tint rounded-full animate-bounce h-6" style={{ animationDuration: '430ms', animationDelay: '260ms' }}></div>
            <div className="w-1.5 bg-primary rounded-full animate-bounce h-3" style={{ animationDuration: '480ms', animationDelay: '70ms' }}></div>
          </div>
        </div>

        <div className="px-gutter mb-space-sm min-h-[150px]">
          {responseHtml}
        </div>

        <div className="px-gutter mb-space-md">
          <div className="flex items-center gap-1.5 mb-2">
            <span className="material-symbols-outlined text-[16px] text-on-surface-variant">tips_and_updates</span>
            <h3 className="font-label-sm uppercase tracking-wider text-on-surface-variant text-[11px]">Recommended Voice Questions</h3>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1 hide-scrollbar">
            <button onClick={() => handleQueryClick('Check mandi wheat price')} className="shrink-0 min-h-[44px] px-3.5 py-2 rounded-full bg-surface-container-lowest hover:bg-surface-container text-on-surface shadow-sm font-label-md flex items-center gap-2 active:bg-surface-container-high transition-colors">
              <span className="material-symbols-outlined text-[18px] text-primary">currency_rupee</span>
              <span>Check mandi wheat price</span>
            </button>
            <button onClick={() => handleQueryClick('Next spray schedule')} className="shrink-0 min-h-[44px] px-3.5 py-2 rounded-full bg-surface-container-lowest hover:bg-surface-container text-on-surface shadow-sm font-label-md flex items-center gap-2 active:bg-surface-container-high transition-colors">
              <span className="material-symbols-outlined text-[18px] text-primary">calendar_clock</span>
              <span>Next spray schedule</span>
            </button>
            <button onClick={() => handleQueryClick('Report yellow leaf rust')} className="shrink-0 min-h-[44px] px-3.5 py-2 rounded-full bg-surface-container-lowest hover:bg-surface-container text-on-surface shadow-sm font-label-md flex items-center gap-2 active:bg-surface-container-high transition-colors">
              <span className="material-symbols-outlined text-[18px] text-error">coronavirus</span>
              <span>Report yellow leaf rust</span>
            </button>
          </div>
        </div>

        <div className="px-gutter pb-space-lg">
          <div className="grid grid-cols-2 gap-3">
            <button aria-label="Switch to typing mode" className="min-h-[48px] bg-surface-container-lowest hover:bg-surface-container text-on-surface rounded-xl flex items-center justify-center gap-2 shadow-sm font-label-md transition-colors">
              <span className="material-symbols-outlined text-[20px] text-on-surface-variant">keyboard</span>
              <span>Keyboard input</span>
            </button>
            <button onClick={() => navigate(-1)} aria-label="End conversation" className="min-h-[48px] bg-error-container hover:opacity-90 text-on-error-container rounded-xl flex items-center justify-center gap-2 shadow-sm font-label-md transition-colors">
              <span className="material-symbols-outlined text-[20px]">call_end</span>
              <span>End voice session</span>
            </button>
          </div>
        </div>

      </main>
    </div>
  );
}
