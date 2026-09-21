import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { createSupportTicket } from '../../api/communityApi';

export default function DigitalSakhi() {
  const navigate = useNavigate();
  const [messages, setMessages] = useState([
    {
      sender: 'agent',
      name: 'Sunita Devi',
      initials: 'SD',
      time: '10:15 AM',
      text: 'Namaste Ramesh ji! I reviewed your Plot 1 satellite stress map. Did you get a chance to check Line 4 drip emitters as recommended?',
      hasAudio: true
    },
    {
      sender: 'user',
      time: '10:18 AM',
      text: 'Yes Sunita didi, flushed the emitters this morning. But I noticed slight yellow flecks on the lower leaves in the north corner. Should I spray Propiconazole today?'
    },
    {
      sender: 'agent',
      name: 'Sunita Devi',
      initials: 'SD',
      time: '10:20 AM',
      text: 'Good that you noticed early! Based on weather forecast, rain is unlikely for 3 days. I advise 1 ml/L spray tomorrow morning before 9 AM. I can also come inspect your parcel tomorrow afternoon if you need help calibrating the sprayer.',
      weather: { title: 'Dry Canopy Window: 72 Hours', desc: 'Optimal fungicide uptake conditions' },
      resource: { title: 'Yellow Rust Field Protocol', meta: 'PDF • 1.2 MB • ICAR Verified' }
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [bookingStatus, setBookingStatus] = useState(null);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }, 50);
  };

  const handleSendMessage = (e) => {
    e?.preventDefault();
    const msg = inputValue.trim();
    if (!msg) return;

    setMessages(prev => [...prev, { sender: 'user', text: msg, time: 'Just now' }]);
    setInputValue('');
    scrollToBottom();
  };

  const handleQuickReply = (text) => {
    setMessages(prev => [...prev, { sender: 'user', text, time: 'Just now' }]);
    scrollToBottom();
  };

  const toggleRecordingState = () => {
    setIsRecording(!isRecording);
  };

  const triggerCameraSimulation = () => {
    setInputValue('📷 [Leaf photo captured: North parcel corner flecks]');
  };

  const confirmVisitRequest = async () => {
    try {
      setBookingStatus('loading');
      const farmId = localStorage.getItem('farmId') || '00000000-0000-0000-0000-000000000000';
      await createSupportTicket({
        farm_id: farmId,
        issue: 'Farm Visit Request - Tomorrow, 2:30 PM',
      });
      setBookingStatus('confirmed');
    } catch (err) {
      console.error(err);
      setBookingStatus('error');
    }
  };

  return (
    <div className="min-h-screen bg-background font-body-md text-on-surface flex flex-col antialiased">
      

      <main className="flex flex-col relative w-full pt-20 pb-safe px-margin bg-background flex-1 gap-space-md">
        
        <section className="w-full bg-surface-container-lowest rounded-xl p-space-md shadow-sm border border-surface-container/30">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="relative flex-shrink-0 w-16 h-16 rounded-full bg-primary-container flex items-center justify-center text-on-primary font-headline-sm shadow-sm">
                <span className="absolute inset-0 flex items-center justify-center">SD</span>
                <img 
                  alt="Sunita Devi, Verified Digital Sakhi" 
                  className="relative w-full h-full object-cover rounded-full z-10" 
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuBv85ZCVyGFOrQ-7NfxtIA0wMyoqzC1ynaHgGGsQIuoLOLGCBQquG6K-xZN6_b7JoRm06h0vhK67Hq88kIgsMmswT4a5MJwzv-LBMj-eB2ELHuJbTj6jhYHK1iMCILtbHhKHK1O8TQtXu-0aIEsRvAQGhYK1HZ-sy8mglfkzBy1nA1jc4OZcqUtn7QXYyylCOUdBTh93Wj1LdRqVog8slLGhSnebqU6Pu0QoQdws_Uf_p7ZeOjTixEp" 
                  onError={(e) => { e.currentTarget.style.display = 'none'; }}
                />
                <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-primary-container rounded-full border-2 border-surface-container-lowest z-20" title="Available Online"></span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <h1 className="font-headline-sm text-headline-sm text-on-surface truncate">Sunita Devi</h1>
                  <span className="material-symbols-outlined text-primary text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
                </div>
                <p className="font-label-sm text-label-sm text-on-surface-variant flex items-center gap-1">
                  <span>Verified Digital Sakhi</span>
                  <span>•</span>
                  <span>Niphad Block</span>
                </p>
                <div className="mt-1 flex items-center gap-1.5 text-on-surface-variant font-label-sm text-label-sm">
                  <span className="material-symbols-outlined text-[15px] text-tertiary">translate</span>
                  <span>Marathi, Hindi, English</span>
                </div>
              </div>
            </div>
            <a className="flex-shrink-0 flex items-center justify-center gap-1.5 bg-primary text-on-primary font-label-md text-label-md px-3.5 py-2.5 rounded-full shadow-sm active:scale-95 transition-transform" href="tel:18001801551">
              <span className="material-symbols-outlined text-[18px]">call</span>
              <span>Call</span>
            </a>
          </div>
          
          <div className="mt-3.5 pt-3 bg-surface-container-low rounded-lg p-2.5 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <span className="w-2 h-2 rounded-full bg-secondary-container flex-shrink-0"></span>
              <div className="flex flex-col min-w-0">
                <span className="font-label-sm text-label-sm text-on-surface font-semibold truncate">Plot 1 Consultation Active</span>
                <span className="font-label-sm text-label-sm text-on-surface-variant truncate">Assigned Village Krishi Sakhi</span>
              </div>
            </div>
            <div className="flex items-center gap-1 bg-surface-container-lowest px-2.5 py-1 rounded-full flex-shrink-0 shadow-sm">
              <span className="material-symbols-outlined text-[16px] text-secondary-container" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
              <span className="font-label-sm text-label-sm text-on-surface font-bold">4.9</span>
              <span className="font-label-sm text-label-sm text-on-surface-variant">(180+)</span>
            </div>
          </div>
        </section>

        <div className="flex items-center justify-center my-1">
          <span className="bg-surface-container-high text-on-surface-variant font-label-sm text-label-sm px-3 py-1 rounded-full">
            Today • 10:15 AM
          </span>
        </div>

        <section className="w-full flex flex-col space-y-3.5">
          {messages.map((msg, idx) => {
            if (msg.sender === 'agent') {
              return (
                <div key={idx} className={`flex items-end gap-2 ${msg.resource ? 'max-w-[92%]' : 'max-w-[88%]'} self-start`}>
                  <div className="w-7 h-7 rounded-full bg-primary-container text-on-primary font-label-sm text-label-sm flex items-center justify-center flex-shrink-0">
                    {msg.initials}
                  </div>
                  <div className="bg-surface-container-lowest text-on-surface p-3.5 rounded-2xl rounded-bl-sm shadow-sm flex flex-col space-y-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-label-sm text-label-sm text-primary font-bold">{msg.name}</span>
                      <span className="font-label-sm text-label-sm text-on-surface-variant">{msg.time}</span>
                    </div>
                    <p className="font-body-md text-body-md leading-relaxed text-on-surface">{msg.text}</p>
                    
                    {msg.hasAudio && (
                      <button aria-label="Listen to voice message" className="self-start flex items-center gap-1 text-tertiary mt-1 font-label-sm text-label-sm hover:opacity-80 transition-colors focus:outline-none" onClick={(e) => { e.stopPropagation(); e.currentTarget.classList.toggle('text-secondary'); }} type="button">
                        <span className="material-symbols-outlined text-[16px]">volume_up</span>
                        <span>Audio readout</span>
                      </button>
                    )}

                    {msg.weather && (
                      <div className="bg-surface-container-low rounded-lg p-2 flex items-center gap-2 text-on-surface">
                        <span className="material-symbols-outlined text-secondary text-[20px]">sunny</span>
                        <div className="flex flex-col">
                          <span className="font-label-sm text-label-sm font-semibold">{msg.weather.title}</span>
                          <span className="font-label-sm text-label-sm text-on-surface-variant">{msg.weather.desc}</span>
                        </div>
                      </div>
                    )}
                    
                    {msg.resource && (
                      <a className="bg-surface-container rounded-xl p-2.5 flex items-center justify-between gap-3 hover:bg-surface-container-high transition-colors" href="#download-protocol" role="button">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="w-8 h-8 rounded-lg bg-error-container text-on-error-container flex items-center justify-center flex-shrink-0">
                            <span className="material-symbols-outlined text-[20px]">picture_as_pdf</span>
                          </div>
                          <div className="flex flex-col min-w-0">
                            <span className="font-label-md text-label-md text-on-surface truncate">{msg.resource.title}</span>
                            <span className="font-label-sm text-label-sm text-on-surface-variant">{msg.resource.meta}</span>
                          </div>
                        </div>
                        <span className="material-symbols-outlined text-primary text-[22px] flex-shrink-0">download</span>
                      </a>
                    )}
                  </div>
                </div>
              );
            }

            return (
              <div key={idx} className="flex flex-col items-end self-end max-w-[85%]">
                <div className="bg-primary text-on-primary p-3.5 rounded-2xl rounded-br-sm shadow-sm flex flex-col space-y-1">
                  <p className="font-body-md text-body-md leading-relaxed text-on-primary">{msg.text}</p>
                  <div className="flex items-center justify-end gap-1 text-on-primary-container font-label-sm text-label-sm pt-0.5">
                    <span>{msg.time}</span>
                    <span className="material-symbols-outlined text-[15px]">done_all</span>
                  </div>
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </section>

        <div className="flex items-center gap-2 overflow-x-auto py-1 -mx-margin px-margin hide-scrollbar">
          <button className="bg-surface-container-low hover:bg-surface-container text-on-surface font-label-md text-label-md px-3.5 py-2 rounded-full whitespace-nowrap shadow-sm transition-colors flex items-center gap-1.5" onClick={() => handleQuickReply('Please book 2:30 PM slot')} type="button">
            <span>👋 Please book 2:30 PM slot</span>
          </button>
          <button className="bg-surface-container-low hover:bg-surface-container text-on-surface font-label-md text-label-md px-3.5 py-2 rounded-full whitespace-nowrap shadow-sm transition-colors" onClick={() => handleQuickReply('What nozzle pressure to use?')} type="button">
            <span>What nozzle pressure to use?</span>
          </button>
          <button className="bg-surface-container-low hover:bg-surface-container text-on-surface font-label-md text-label-md px-3.5 py-2 rounded-full whitespace-nowrap shadow-sm transition-colors" onClick={() => handleQuickReply('Share dosage calculation')} type="button">
            <span>Share dosage calculation</span>
          </button>
        </div>

        <section className="w-full bg-gradient-to-r from-surface-container to-surface-container-low rounded-xl p-3.5 shadow-sm">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-full bg-primary-container text-on-primary flex items-center justify-center flex-shrink-0">
                <span className="material-symbols-outlined text-[20px]">agriculture</span>
              </div>
              <div>
                <h2 className="font-headline-sm text-headline-sm text-on-surface">Need Hands-on Field Assistance?</h2>
                <p className="font-label-sm text-label-sm text-on-surface-variant">Next free slot: Tomorrow, 2:30 PM • Free Govt/FPO assisted</p>
              </div>
            </div>
          </div>
          <button 
            disabled={bookingStatus === 'loading' || bookingStatus === 'confirmed'}
            className={`mt-3 w-full font-label-lg text-label-lg py-3 rounded-lg shadow-sm flex items-center justify-center gap-2 active:opacity-90 transition-opacity ${bookingStatus === 'confirmed' ? 'bg-primary-container text-on-primary-container' : 'bg-secondary-container text-on-secondary'} disabled:opacity-80`} 
            onClick={confirmVisitRequest} 
            type="button"
          >
            <span className="material-symbols-outlined text-[20px]">
              {bookingStatus === 'loading' ? 'sync' : bookingStatus === 'confirmed' ? 'check_circle' : 'calendar_month'}
            </span>
            <span className={bookingStatus === 'loading' ? 'animate-pulse' : ''}>
              {bookingStatus === 'confirmed' ? '✅ Visit Scheduled for Tomorrow, 2:30 PM' : bookingStatus === 'loading' ? 'Requesting...' : 'Request a Farm Visit'}
            </span>
          </button>
        </section>
        <section className="w-full bg-surface-container-lowest rounded-2xl p-2 shadow-md">
            <form className="flex items-center gap-1.5" onSubmit={handleSendMessage}>
              <button aria-label="Send Leaf Photo" className="w-11 h-11 rounded-full bg-surface-container text-on-surface-variant flex items-center justify-center hover:bg-surface-container-high transition-colors flex-shrink-0" onClick={triggerCameraSimulation} title="Send Leaf Photo" type="button">
                <span className="material-symbols-outlined text-[22px]">photo_camera</span>
              </button>
              
              <button aria-label="Record voice note in your dialect" className={`w-11 h-11 rounded-full flex items-center justify-center transition-colors flex-shrink-0 ${isRecording ? 'bg-error-container text-on-error-container' : 'bg-surface-container text-primary hover:bg-surface-container-high'}`} onClick={toggleRecordingState} title="Voice Message" type="button">
                <span className="material-symbols-outlined text-[22px]">mic</span>
              </button>
              
              <div className="flex-1 min-w-0">
                <label className="sr-only" htmlFor="farmerMessageInput">Ask Sunita a question</label>
                <input 
                  className="w-full bg-surface-container-low text-on-surface placeholder:text-on-surface-variant font-body-md text-body-md rounded-full px-4 py-2.5 focus:outline-none focus:bg-surface-container-lowest" 
                  id="farmerMessageInput" 
                  placeholder="Ask Sunita a question..." 
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                />
              </div>
              
              <button aria-label="Send message" className="w-11 h-11 rounded-full bg-primary text-on-primary flex items-center justify-center shadow-sm flex-shrink-0 active:scale-95 transition-transform" type="submit">
                <span className="material-symbols-outlined text-[20px]">send</span>
              </button>
            </form>
          </section>
      </main>
    </div>
  );
}
