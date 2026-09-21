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
    <div className="bg-surface font-body-md text-on-surface flex flex-col min-h-screen selection:bg-primary-fixed">
      <header className="fixed top-0 w-full z-50 pt-safe bg-surface/90 backdrop-blur-xl shadow-[0_1px_8px_rgba(0,0,0,0.04)]">
        <div className="h-16 px-gutter flex items-center justify-between gap-space-sm">
          <div className="flex items-center gap-space-xs">
            <button onClick={() => navigate(-1)} className="min-w-[44px] min-h-[44px] flex items-center justify-center text-on-surface rounded-full hover:bg-surface-container active:bg-surface-container-high transition-colors" type="button">
              <span className="material-symbols-outlined text-[24px]">arrow_back</span>
            </button>
            <img alt="Brand logo" className="h-7 w-auto object-contain hidden xs:block" src="https://lh3.googleusercontent.com/aida/AEtjO1UIQkciQWmlsTRY8f9Zy0F8V6Ui5SnL-bNI1XODjLR9sQNG4BHGAMrtvwAK-8Il7hBixSfzotAqt-1yzxZ1tS8lfeStHMZMcAAazASvjFxGLljEzJwhmT37IQLEv0u0wChglbOYjrW80Tbxp2N5Gci7RSN8sqPVnTp66_kG_QHJe8HBtzy0s7YivFGLy5OK6W6ahvWh_DtV3OjnAKUT1Zgj0Ae4r9TLabB2OQOypc-WO4bS3YHevJEUIf8"/>
            <h1 className="font-headline-sm text-on-surface leading-tight truncate max-w-[150px]">Multimodal Query</h1>
          </div>
          <div className="flex items-center gap-space-xs">
            <button className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-full bg-surface-container text-on-surface-variant hover:text-on-surface active:bg-surface-container-high">
              <span className="material-symbols-outlined text-[20px]">volume_up</span>
            </button>
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center ml-1">
              <span className="material-symbols-outlined text-on-primary text-[18px]">person</span>
            </div>
          </div>
        </div>
      </header>

      <main className="flex flex-col relative w-full pt-16 bg-surface min-h-screen">
        <div className="flex flex-col w-full pb-28">
        
        {/* Top Utility Context Strip */}
        <div className="px-gutter py-space-sm bg-surface-container-low flex items-center justify-between">
          <div className="flex items-center gap-space-xs">
            <span className="w-2 h-2 rounded-full bg-surface-tint animate-pulse"></span>
            <span className="font-label-sm text-label-sm text-on-surface">Agri-Vision AI Online</span>
            <span className="text-outline text-xs">•</span>
            <span className="font-label-sm text-label-sm text-on-surface-variant">Cloud Synced</span>
          </div>
          <div className="flex items-center gap-1 bg-surface-container px-2 py-1 rounded-full text-on-surface">
            <span className="material-symbols-outlined text-[14px] text-surface-tint">sensors</span>
            <span className="font-label-sm text-label-sm text-on-surface">Live Field Link</span>
          </div>
        </div>
        
        {/* Plot Context Header Bar */}
        <div className="mx-gutter mt-space-sm mb-space-md p-space-sm bg-surface-container-lowest rounded-xl shadow-sm flex items-center justify-between">
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

        <div className="px-gutter flex flex-col gap-space-lg">
          <div className="flex items-center justify-center my-1">
            <span className="bg-surface-container px-3 py-1 rounded-full font-label-sm text-label-sm text-on-surface-variant">Today • 10:14 AM</span>
          </div>

          {/* Example static message to match HTML mockup style initially */}
          {messages.length === 0 && (
            <>
              <div className="flex flex-col items-end gap-1.5 max-w-[92%] self-end">
                <div className="w-full bg-primary-container text-on-primary rounded-2xl rounded-tr-none p-3.5 shadow-sm flex flex-col gap-3">
                  <div className="relative w-full rounded-xl overflow-hidden bg-black/20 shadow-inner group">
                    <img alt="Thumbnail" className="w-full h-48 object-cover rounded-xl" src="https://lh3.googleusercontent.com/aida/AEtjO1X6jpr6X6R7gzTXv5uL_PUzKZAAGfScbVseU0SGEyKJMUPdKY2EqZD0HQQ_G-WQL6frsZUNwY2vOxlYFBlhsz9ag2_My7Sr8-GNIdnLwlJMTFCmfiWM4A1piX5YLkSaH5r6ls5KXqHefB7h65S83oXuGzVTQe0gfCr1LG7YAIGV-riISeNEC_9J5WSEURJG2fmSXQi6yVrTcvoN-SBxQNOydeZqbf-R6zGcUZhKa0B2_1h1QGG_HrXeDQE" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/20 pointer-events-none"></div>
                    <button aria-label="Zoom captured leaf photo" className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/50 text-white backdrop-blur-md flex items-center justify-center active:scale-90 transition-transform">
                      <span className="material-symbols-outlined text-[18px]">zoom_in</span>
                    </button>
                    <div className="absolute bottom-2 left-2 flex items-center gap-1.5 px-2 py-1 rounded-md bg-black/60 text-white backdrop-blur-sm">
                      <span className="material-symbols-outlined text-[14px] text-primary-fixed">photo_camera</span>
                      <span className="font-label-sm text-label-sm text-xs tracking-wider">Captured via Camera • 1080p</span>
                    </div>
                  </div>
                  <div className="w-full bg-black/15 rounded-lg p-2 flex items-center gap-2.5">
                    <button aria-label="Play voice note" className="w-8 h-8 rounded-full bg-primary-fixed text-on-primary-fixed flex items-center justify-center shrink-0 active:scale-90 transition-transform">
                      <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>play_arrow</span>
                    </button>
                    <div className="flex flex-col flex-1 min-w-0">
                      <div className="flex items-center justify-between text-xs font-label-sm text-on-primary-container">
                        <span>Voice Note</span>
                        <span>0:08s</span>
                      </div>
                      <div className="flex items-center gap-0.5 h-3 mt-1">
                        <span className="w-1 h-2 bg-on-primary-container/60 rounded-full"></span>
                        <span className="w-1 h-3 bg-on-primary rounded-full"></span>
                        <span className="w-1 h-2 bg-on-primary rounded-full"></span>
                        <span className="w-1 h-3.5 bg-on-primary rounded-full"></span>
                        <span className="w-1 h-1.5 bg-on-primary-container/60 rounded-full"></span>
                        <span className="w-1 h-2.5 bg-on-primary rounded-full"></span>
                        <span className="w-1 h-3 bg-on-primary rounded-full"></span>
                        <span className="w-1 h-1 bg-on-primary-container/40 rounded-full"></span>
                        <span className="w-1 h-2.5 bg-on-primary rounded-full"></span>
                        <span className="w-1 h-3 bg-on-primary rounded-full"></span>
                        <span className="w-1 h-1 bg-on-primary-container/40 rounded-full"></span>
                        <span className="w-1 h-2 bg-on-primary-container/60 rounded-full"></span>
                      </div>
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
                  <button aria-label="Listen to diagnosis" className="w-7 h-7 rounded-full bg-surface-container-high flex items-center justify-center text-on-surface-variant hover:text-on-surface">
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
                      <li className="flex items-start gap-2.5">
                        <span className="w-5 h-5 rounded-full bg-surface-tint text-on-primary flex items-center justify-center shrink-0 font-label-sm text-label-sm mt-0.5">2</span>
                        <p className="font-body-sm text-body-sm text-on-surface leading-snug">
                          Target morning hours (<strong>before 9:30 AM</strong>) utilizing a flat-fan nozzle for micro-droplet coverage.
                        </p>
                      </li>
                      <li className="flex items-start gap-2.5">
                        <span className="w-5 h-5 rounded-full bg-surface-tint text-on-primary flex items-center justify-center shrink-0 font-label-sm text-label-sm mt-0.5">3</span>
                        <p className="font-body-sm text-body-sm text-on-surface leading-snug">
                          <strong>Avoid flood irrigation</strong> for 48 hours post-application to prevent wash-off and humidity spike.
                        </p>
                      </li>
                    </ul>
                  </div>
                  
                  <div className="flex flex-col gap-2 pt-1">
                    <button className="w-full min-h-[52px] px-4 rounded-xl bg-secondary-container text-on-secondary flex items-center justify-between font-label-lg text-label-lg shadow active:scale-[0.98] transition-transform">
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-[22px]">shopping_bag</span>
                        <span>Order Propiconazole 25% EC</span>
                      </div>
                      <span className="font-headline-sm text-headline-sm text-white">₹820</span>
                    </button>
                    <button className="w-full min-h-[48px] px-4 rounded-xl bg-surface-container-high text-primary flex items-center justify-center gap-2 font-label-md text-label-md active:bg-surface-container transition-colors">
                      <span className="material-symbols-outlined text-[20px] text-surface-tint">calendar_today</span>
                      <span>Add Spray Schedule to Field Calendar</span>
                    </button>
                  </div>
                </div>
                <span className="text-on-surface-variant font-label-sm text-label-sm pl-2">10:14 AM • AI Response time 1.2s</span>
              </div>
            </>
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
