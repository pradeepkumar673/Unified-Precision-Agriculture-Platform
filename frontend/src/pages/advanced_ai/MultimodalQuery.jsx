import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { submitMultimodalQuery } from '../../api/advancedAiApi';

export default function MultimodalQuery() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  
  const [inputText, setInputText] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [messages, setMessages] = useState([]);

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const clearAttachment = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e) => {
    e?.preventDefault();
    if (!inputText.trim() && !selectedFile) return;

    const userMessage = {
      type: 'user',
      text: inputText,
      image: previewUrl,
      time: 'Just now'
    };
    
    setMessages(prev => [...prev, userMessage]);
    
    const currentInputText = inputText;
    const currentFile = selectedFile;
    
    setInputText('');
    clearAttachment();
    setIsSubmitting(true);

    try {
      const farmId = localStorage.getItem('farmId') || '00000000-0000-0000-0000-000000000000';
      const response = await submitMultimodalQuery(farmId, currentInputText, currentFile);
      
      // We render a simulated detailed card if combined_response exists
      // The API returns combined_response as a string, but the UI has a rich card layout for disease detection.
      const aiMessage = {
        type: 'ai',
        time: 'Just now',
        content: response.combined_response
      };
      setMessages(prev => [...prev, aiMessage]);
    } catch (err) {
      console.error(err);
      setMessages(prev => [...prev, { type: 'ai', time: 'Just now', content: 'Sorry, I could not process your query at this time.' }]);
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderSimulatedCard = (content) => {
    return (
      <div className="w-full bg-surface-container-lowest rounded-2xl rounded-tl-none p-4 shadow-sm flex flex-col gap-3.5">
        <div className="w-full rounded-xl bg-secondary-fixed/50 p-3 flex flex-col gap-1">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[20px] text-secondary">coronavirus</span>
              <span className="font-headline-sm text-headline-sm text-on-secondary-fixed leading-none">Diagnostic Result</span>
            </div>
            <span className="bg-secondary text-on-secondary font-label-sm text-label-sm px-2 py-0.5 rounded-full">Match: High</span>
          </div>
        </div>
        
        <div className="flex flex-col gap-1.5">
          <span className="font-label-md text-label-md text-on-surface-variant tracking-wider uppercase text-xs">Agronomist Assessment</span>
          <p className="font-body-md text-body-md text-on-surface leading-relaxed">
            {content}
          </p>
        </div>
        
        <div className="flex flex-col gap-2 bg-surface-container-low rounded-xl p-3">
          <span className="font-label-md text-label-md text-on-surface flex items-center gap-1">
            <span className="material-symbols-outlined text-[18px] text-surface-tint">fact_check</span>
            Recommended Action Plan
          </span>
          <ul className="flex flex-col gap-2 mt-1">
            <li className="flex items-start gap-2.5">
              <span className="w-5 h-5 rounded-full bg-surface-tint text-on-primary flex items-center justify-center shrink-0 font-label-sm text-label-sm mt-0.5">1</span>
              <p className="font-body-sm text-body-sm text-on-surface leading-snug">Follow standard protocol based on assessment.</p>
            </li>
          </ul>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-surface-container-lowest text-on-surface flex flex-col pt-safe pb-safe relative">
      <header className="fixed top-0 w-full z-50 bg-surface-container-lowest/90 backdrop-blur-xl border-b border-surface-container shadow-sm pt-safe">
        <div className="flex items-center justify-between h-14 px-margin">
          <div className="flex items-center gap-space-sm">
            <button onClick={() => navigate(-1)} className="w-10 h-10 flex items-center justify-center rounded-full text-on-surface active:bg-surface-container-high transition-colors" type="button">
              <span className="material-symbols-outlined text-[24px]">arrow_back</span>
            </button>
            <h1 className="font-headline-sm text-headline-sm font-bold text-on-surface truncate">Agronomist AI Chat</h1>
          </div>
          <button className="w-10 h-10 flex items-center justify-center rounded-full text-on-surface active:bg-surface-container-high transition-colors" type="button">
            <span className="material-symbols-outlined text-[24px]">more_vert</span>
          </button>
        </div>
      </header>

      <main className="flex flex-col w-full pt-[64px] pb-36 bg-surface-container flex-1">
        
        <div className="bg-surface-container-lowest border-b border-surface-container p-space-sm flex items-center justify-between shadow-sm sticky top-[56px] z-40">
          <div className="flex items-center gap-space-sm">
            <div className="w-10 h-10 rounded-lg bg-primary-fixed flex items-center justify-center text-primary">
              <span className="material-symbols-outlined text-[24px]">agriculture</span>
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="font-headline-sm text-headline-sm text-on-surface leading-snug">Plot 1 • Sharbati Wheat</span>
                <span className="bg-primary-fixed/60 text-on-primary-fixed font-label-sm text-label-sm px-1.5 py-0.5 rounded">Day 42</span>
              </div>
              <span className="font-body-sm text-body-sm text-on-surface-variant text-xs">North Block (2.4 Acres) • Sown 12 Nov</span>
            </div>
          </div>
          <button aria-label="Switch active plot" className="px-3 py-1.5 rounded-lg bg-surface-container-high text-on-surface font-label-md text-label-md flex items-center gap-1 active:scale-95 transition-transform">
            <span>Switch</span>
            <span className="material-symbols-outlined text-[16px]">expand_more</span>
          </button>
        </div>

        <div className="px-gutter flex flex-col gap-space-lg pt-4 pb-4">
          <div className="flex items-center justify-center my-1">
            <span className="bg-surface-container px-3 py-1 rounded-full font-label-sm text-label-sm text-on-surface-variant">Today</span>
          </div>

          {/* Example static message to match HTML mockup style initially */}
          {messages.length === 0 && (
             <div className="flex flex-col gap-space-lg">
                <div className="flex flex-col items-end gap-1.5 max-w-[92%] self-end">
                  <div className="w-full bg-primary-container text-on-primary rounded-2xl rounded-tr-none p-3.5 shadow-sm flex flex-col gap-3">
                    <div className="relative w-full rounded-xl overflow-hidden bg-black/20 shadow-inner group">
                      <img alt="Thumbnail" className="w-full h-48 object-cover rounded-xl" src="https://images.unsplash.com/photo-1582213782179-e0d53f98f2ca?q=80&w=400&auto=format&fit=crop" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/20 pointer-events-none"></div>
                      <div className="absolute bottom-2 left-2 flex items-center gap-1.5 px-2 py-1 rounded-md bg-black/60 text-white backdrop-blur-sm">
                        <span className="material-symbols-outlined text-[14px] text-primary-fixed">photo_camera</span>
                        <span className="font-label-sm text-label-sm text-xs tracking-wider">Captured via Camera</span>
                      </div>
                    </div>
                    <p className="font-body-md text-body-md text-white font-medium leading-snug">
                      "I found these yellow powdery stripes on three leaves in the North furrow today. Is this yellow rust, and should I spray immediately?"
                    </p>
                  </div>
                  <div className="flex items-center gap-1 text-on-surface-variant text-xs pr-1">
                    <span>10:14 AM</span>
                    <span>•</span>
                    <span className="font-label-sm text-label-sm">Delivered</span>
                    <span className="material-symbols-outlined text-[14px] text-surface-tint" style={{ fontVariationSettings: "'FILL' 1" }}>done_all</span>
                  </div>
                </div>

                <div className="flex flex-col gap-1.5 max-w-[98%]">
                  <div className="flex items-center justify-between px-1">
                    <div className="flex items-center gap-1.5">
                      <div className="w-6 h-6 rounded-full bg-surface-tint flex items-center justify-center text-on-primary">
                        <span className="material-symbols-outlined text-[14px]">psychology</span>
                      </div>
                      <span className="font-label-sm text-label-sm text-on-surface font-semibold">KhetSaathi AI</span>
                      <span className="bg-surface-container px-2 py-0.5 rounded-full font-label-sm text-label-sm text-on-surface-variant flex items-center gap-1">
                        <span className="material-symbols-outlined text-[12px] text-surface-tint">verified</span>
                        Agronomic Computer Vision v2.4
                      </span>
                    </div>
                    <button className="w-7 h-7 rounded-full bg-surface-container-high flex items-center justify-center text-on-surface-variant hover:text-on-surface">
                      <span className="material-symbols-outlined text-[16px]">volume_up</span>
                    </button>
                  </div>
                  
                  <div className="w-full bg-surface-container-lowest rounded-2xl rounded-tl-none p-4 shadow-sm flex flex-col gap-3.5">
                    <div className="w-full rounded-xl bg-secondary-fixed/50 p-3 flex flex-col gap-1">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <span className="material-symbols-outlined text-[20px] text-secondary">coronavirus</span>
                          <span className="font-headline-sm text-headline-sm text-on-secondary-fixed leading-none">Yellow Stripe Rust Detected</span>
                        </div>
                        <span className="bg-secondary text-on-secondary font-label-sm text-label-sm px-2 py-0.5 rounded-full">Match: 96.4%</span>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="font-body-sm text-body-sm text-on-secondary-fixed-variant italic">Puccinia striiformis</span>
                        <span className="text-on-secondary-fixed-variant text-xs">•</span>
                        <span className="font-label-sm text-label-sm text-secondary font-bold">Early Stage (Severity: 2/5)</span>
                      </div>
                    </div>
                    
                    <div className="flex flex-col gap-1.5">
                      <span className="font-label-md text-label-md text-on-surface-variant tracking-wider uppercase text-xs">Agronomist Assessment</span>
                      <p className="font-body-md text-body-md text-on-surface leading-relaxed">
                        Yes, this is confirmed early-stage <strong className="text-secondary font-semibold">Yellow Rust</strong>. It has not penetrated the flag leaf yet. The local weather forecast indicates dry conditions for the next 72 hours, providing an optimal window for curative spray.
                      </p>
                    </div>
                    
                    <div className="flex flex-col gap-2 bg-surface-container-low rounded-xl p-3">
                      <span className="font-label-md text-label-md text-on-surface flex items-center gap-1">
                        <span className="material-symbols-outlined text-[18px] text-surface-tint">fact_check</span>
                        Recommended Action Plan
                      </span>
                      <ul className="flex flex-col gap-2 mt-1">
                        <li className="flex items-start gap-2.5">
                          <span className="w-5 h-5 rounded-full bg-surface-tint text-on-primary flex items-center justify-center shrink-0 font-label-sm text-label-sm mt-0.5">1</span>
                          <p className="font-body-sm text-body-sm text-on-surface leading-snug">
                            Spray <strong>Propiconazole 25% EC</strong> @ <strong>1 ml per liter</strong> of water evenly over affected foliage.
                          </p>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
             </div>
          )}

          {messages.map((msg, idx) => (
            <div key={idx}>
              {msg.type === 'user' ? (
                <div className="flex flex-col items-end gap-1.5 max-w-[92%] self-end float-right clear-both mb-4">
                  <div className="w-full bg-primary-container text-on-primary rounded-2xl rounded-tr-none p-3.5 shadow-sm flex flex-col gap-3">
                    {msg.image && (
                      <div className="relative w-full rounded-xl overflow-hidden bg-black/20 shadow-inner group">
                        <img alt="User Attachment" className="w-full h-48 object-cover rounded-xl" src={msg.image} />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/20 pointer-events-none"></div>
                        <div className="absolute bottom-2 left-2 flex items-center gap-1.5 px-2 py-1 rounded-md bg-black/60 text-white backdrop-blur-sm">
                          <span className="material-symbols-outlined text-[14px] text-primary-fixed">photo_camera</span>
                          <span className="font-label-sm text-label-sm text-xs tracking-wider">Attached Image</span>
                        </div>
                      </div>
                    )}
                    {msg.text && (
                      <p className="font-body-md text-body-md text-white font-medium leading-snug">
                        {msg.text}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-1 text-on-surface-variant text-xs pr-1">
                    <span className="font-label-sm text-label-sm">Delivered</span>
                    <span className="material-symbols-outlined text-[14px] text-surface-tint" style={{ fontVariationSettings: "'FILL' 1" }}>done_all</span>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-1.5 max-w-[98%] clear-both mb-4">
                  <div className="flex items-center justify-between px-1">
                    <div className="flex items-center gap-1.5">
                      <div className="w-6 h-6 rounded-full bg-surface-tint flex items-center justify-center text-on-primary">
                        <span className="material-symbols-outlined text-[14px]">psychology</span>
                      </div>
                      <span className="font-label-sm text-label-sm text-on-surface font-semibold">KhetSaathi AI</span>
                    </div>
                  </div>
                  {renderSimulatedCard(msg.content)}
                </div>
              )}
            </div>
          ))}
          {isSubmitting && (
            <div className="flex items-center gap-2 p-3 text-on-surface-variant clear-both">
              <span className="material-symbols-outlined animate-spin text-[20px]">progress_activity</span>
              <span className="font-label-md">Analyzing...</span>
            </div>
          )}
        </div>
      </main>

      <div className="fixed bottom-0 left-0 right-0 z-40 bg-surface-container-lowest shadow-[0_-4px_16px_rgba(0,0,0,0.08)] px-gutter pt-2.5 pb-safe">
        {previewUrl && (
          <div className="flex items-center justify-between mb-2 px-1">
            <div className="flex items-center gap-2">
              <div className="relative w-8 h-8 rounded-lg overflow-hidden bg-surface-container">
                <img alt="Thumbnail" className="w-full h-full object-cover" src={previewUrl} />
                <div className="absolute inset-0 bg-primary/20"></div>
              </div>
              <span className="font-label-sm text-label-sm text-on-surface-variant truncate max-w-[200px]">Attached: {selectedFile?.name}</span>
            </div>
            <button onClick={clearAttachment} aria-label="Clear active media attachment" className="text-on-surface-variant hover:text-error text-xs font-label-sm flex items-center gap-0.5">
              <span className="material-symbols-outlined text-[14px]">close</span>
              <span>Clear</span>
            </button>
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="flex items-center gap-2 bg-surface-container-low rounded-2xl p-1.5">
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileSelect} 
            accept="image/*" 
            className="hidden" 
          />
          <button 
            type="button" 
            onClick={() => fileInputRef.current?.click()} 
            aria-label="Take or attach new crop picture" 
            className="w-10 h-10 rounded-xl bg-surface-container flex items-center justify-center text-on-surface-variant active:scale-95 transition-transform"
          >
            <span className="material-symbols-outlined text-[22px]">add_a_photo</span>
          </button>
          
          <input 
            className="flex-1 min-w-0 bg-transparent py-2.5 px-1 font-body-md text-body-md text-on-surface placeholder:text-on-surface-variant/70 focus:outline-none" 
            placeholder="Ask follow-up or dosage question..." 
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
          />
          
          <button type="button" aria-label="Hold to speak voice query" className="w-10 h-10 rounded-xl bg-primary-fixed text-primary flex items-center justify-center active:scale-90 transition-transform">
            <span className="material-symbols-outlined text-[22px]">mic</span>
          </button>
          
          <button type="submit" disabled={isSubmitting || (!inputText.trim() && !selectedFile)} aria-label="Submit query" className="w-10 h-10 rounded-xl bg-primary text-on-primary flex items-center justify-center active:scale-95 transition-transform shadow-sm disabled:opacity-50">
            <span className="material-symbols-outlined text-[20px]">send</span>
          </button>
        </form>
        
        <div className="flex items-center justify-center gap-1.5 py-1.5">
          <span className="material-symbols-outlined text-[13px] text-surface-tint">bolt</span>
          <span className="font-label-sm text-label-sm text-xs text-on-surface-variant">Tap mic for Hindi, Marathi, Punjabi, or English voice query</span>
        </div>
      </div>
    </div>
  );
}
