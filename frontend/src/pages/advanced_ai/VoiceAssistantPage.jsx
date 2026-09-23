import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { submitTextQuery } from '../../api/advancedAiApi';
import { getFarmProfile } from '../../api/farmApi';

const SUGGESTED_QUERIES = [
  { icon: 'water_drop', text: 'When should I irrigate my field?', color: 'text-primary' },
  { icon: 'pest_control', text: 'How to control aphids on my crop?', color: 'text-error' },
  { icon: 'currency_rupee', text: 'What is the current mandi price for sugarcane?', color: 'text-tertiary' },
  { icon: 'vaccines', text: 'Which fertilizer to apply at tillering stage?', color: 'text-secondary' },
  { icon: 'cloud', text: 'Is this a good week to spray pesticide?', color: 'text-on-surface-variant' },
  { icon: 'account_balance', text: 'How do I apply for PM-KISAN?', color: 'text-primary' },
];

export default function VoiceAssistantPage() {
  const navigate = useNavigate();
  const farmId = localStorage.getItem('farmId');

  const [farm, setFarm] = useState(null);
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [textInput, setTextInput] = useState('');
  const [showTextInput, setShowTextInput] = useState(false);
  const [messages, setMessages] = useState([]); // [{role, text}]
  const [lang, setLang] = useState('en-IN'); // en-IN | hi-IN | ta-IN
  const [error, setError] = useState('');

  const recognitionRef = useRef(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (farmId) {
      getFarmProfile(farmId).then(r => setFarm(r.data)).catch(() => {});
    }
  }, [farmId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Detect if Web Speech API is supported
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  const speechSupported = !!SpeechRecognition;

  const startListening = () => {
    if (!SpeechRecognition) {
      setError('Voice recognition not supported in this browser. Use Chrome for best results.');
      setShowTextInput(true);
      return;
    }
    setError('');
    const recognition = new SpeechRecognition();
    recognition.lang = lang;
    recognition.continuous = false;
    recognition.interimResults = true;
    recognitionRef.current = recognition;

    recognition.onstart = () => setIsListening(true);
    recognition.onresult = (e) => {
      const interim = Array.from(e.results).map(r => r[0].transcript).join('');
      setTranscript(interim);
    };
    recognition.onend = () => {
      setIsListening(false);
      if (transcript.trim()) {
        askQuestion(transcript.trim());
      }
    };
    recognition.onerror = (e) => {
      setIsListening(false);
      if (e.error === 'not-allowed') {
        setError('Microphone access denied. Please allow microphone access in your browser.');
        setShowTextInput(true);
      }
    };
    recognition.start();
  };

  const stopListening = () => {
    recognitionRef.current?.stop();
    setIsListening(false);
  };

  const speakResponse = (text) => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = lang;
    utter.rate = 0.9;
    utter.onstart = () => setIsSpeaking(true);
    utter.onend = () => setIsSpeaking(false);
    utter.onerror = () => setIsSpeaking(false);
    window.speechSynthesis.speak(utter);
  };

  const stopSpeaking = () => {
    window.speechSynthesis?.cancel();
    setIsSpeaking(false);
  };

  const askQuestion = async (question) => {
    if (!question.trim()) return;
    setTranscript('');
    setTextInput('');
    setIsProcessing(true);
    setMessages(prev => [...prev, { role: 'user', text: question }]);

    try {
      const res = await submitTextQuery(farmId, question, lang.split('-')[0]);
      const answer = res.response_text || 'I could not get an answer right now.';
      setMessages(prev => [...prev, { role: 'assistant', text: answer }]);
      speakResponse(answer);
    } catch (err) {
      const fallback = 'Sorry, I could not connect right now. Please try again.';
      setMessages(prev => [...prev, { role: 'assistant', text: fallback }]);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleTextSubmit = (e) => {
    e.preventDefault();
    if (textInput.trim()) askQuestion(textInput.trim());
  };

  const toggleMic = () => {
    if (isListening) stopListening();
    else startListening();
  };

  const LANG_OPTIONS = [
    { code: 'en-IN', label: 'EN', full: 'English' },
    { code: 'hi-IN', label: 'हिं', full: 'Hindi' },
    { code: 'ta-IN', label: 'த', full: 'Tamil' },
    { code: 'mr-IN', label: 'म', full: 'Marathi' },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background border-b border-outline-variant">
        <div className="flex items-center gap-3 px-margin py-3">
          <button
            onClick={() => navigate(-1)}
            className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-surface-container-low active:scale-95 transition-all"
          >
            <span className="material-symbols-outlined text-on-surface text-[24px]">arrow_back</span>
          </button>
          <div className="flex-1">
            <h1 className="font-title-md text-title-md text-on-surface">KhetSaathi Bol</h1>
            <p className="font-label-sm text-label-sm text-on-surface-variant">AI Voice Assistant</p>
          </div>
          {/* Language switcher */}
          <div className="flex items-center gap-1">
            {LANG_OPTIONS.map(l => (
              <button
                key={l.code}
                onClick={() => setLang(l.code)}
                title={l.full}
                className={`w-9 h-9 rounded-full font-label-sm text-label-sm font-bold transition-all ${
                  lang === l.code
                    ? 'bg-primary text-on-primary'
                    : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'
                }`}
              >
                {l.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Farm context */}
      {farm && (
        <div className="px-margin pt-3">
          <div className="flex items-center gap-2 bg-surface-container-low px-space-md py-space-sm rounded-xl">
            <span className="material-symbols-outlined text-primary text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>landscape</span>
            <span className="font-label-md text-label-md text-on-surface truncate capitalize">
              {farm.name} · {farm.current_crop || 'Unknown crop'} · {farm.district}
            </span>
          </div>
        </div>
      )}

      {/* Messages feed */}
      <div className="flex-1 overflow-y-auto px-margin py-3 flex flex-col gap-space-sm">
        {messages.length === 0 && (
          <>
            {/* Welcome state */}
            <div className="flex flex-col items-center justify-center py-8 gap-3">
              <div className="w-16 h-16 rounded-full bg-primary-container flex items-center justify-center">
                <span className="material-symbols-outlined text-on-primary text-[32px]" style={{ fontVariationSettings: "'FILL' 1" }}>mic</span>
              </div>
              <p className="font-body-md text-body-md text-on-surface-variant text-center">
                Tap the mic and ask anything about<br />your crops, weather, prices, or schemes.
              </p>
            </div>

            {/* Suggested questions */}
            <p className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">Try asking…</p>
            <div className="flex flex-col gap-2">
              {SUGGESTED_QUERIES.map((q, i) => (
                <button
                  key={i}
                  onClick={() => askQuestion(q.text)}
                  className="flex items-center gap-space-sm bg-surface-container-lowest rounded-xl px-space-md py-space-sm shadow-sm text-left hover:bg-surface-container active:scale-[0.98] transition-all"
                >
                  <span className={`material-symbols-outlined text-[20px] ${q.color} flex-shrink-0`}>{q.icon}</span>
                  <span className="font-body-md text-body-md text-on-surface">{q.text}</span>
                </button>
              ))}
            </div>
          </>
        )}

        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {msg.role === 'assistant' && (
              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center mr-2 mt-1 flex-shrink-0">
                <span className="material-symbols-outlined text-on-primary text-[16px]">psychology</span>
              </div>
            )}
            <div className={`max-w-[85%] rounded-2xl px-space-md py-space-sm shadow-sm ${
              msg.role === 'user'
                ? 'bg-primary text-on-primary rounded-br-sm'
                : 'bg-surface-container-lowest text-on-surface rounded-bl-sm'
            }`}>
              <p className="font-body-md text-body-md leading-relaxed">{msg.text}</p>
            </div>
            {msg.role === 'user' && (
              <div className="w-8 h-8 rounded-full bg-surface-container-high flex items-center justify-center ml-2 mt-1 flex-shrink-0">
                <span className="material-symbols-outlined text-on-surface-variant text-[16px]">person</span>
              </div>
            )}
          </div>
        ))}

        {isProcessing && (
          <div className="flex justify-start">
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center mr-2 flex-shrink-0">
              <span className="material-symbols-outlined text-on-primary text-[16px]">psychology</span>
            </div>
            <div className="bg-surface-container-lowest rounded-2xl rounded-bl-sm px-space-md py-space-sm shadow-sm flex items-center gap-2">
              <div className="flex gap-1">
                {[0, 1, 2].map(j => (
                  <div key={j} className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: `${j * 150}ms` }} />
                ))}
              </div>
              <span className="font-label-sm text-label-sm text-on-surface-variant">Thinking…</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Error */}
      {error && (
        <div className="px-margin">
          <div className="bg-error-container text-error font-label-sm text-label-sm px-space-md py-space-sm rounded-xl flex items-center gap-2">
            <span className="material-symbols-outlined text-[16px]">error</span>
            {error}
          </div>
        </div>
      )}

      {/* Transcript preview */}
      {(isListening || transcript) && (
        <div className="px-margin">
          <div className="bg-primary-fixed rounded-xl px-space-md py-space-sm flex items-center gap-2">
            <span className={`material-symbols-outlined text-primary text-[18px] ${isListening ? 'animate-pulse' : ''}`}>mic</span>
            <span className="font-body-md text-body-md text-on-surface flex-1 italic">
              {isListening && !transcript ? 'Listening…' : transcript || ''}
            </span>
          </div>
        </div>
      )}

      {/* Bottom controls */}
      <div className="sticky bottom-0 bg-background border-t border-outline-variant px-margin py-3">
        {showTextInput ? (
          <form onSubmit={handleTextSubmit} className="flex items-center gap-2">
            <input
              type="text"
              value={textInput}
              onChange={e => setTextInput(e.target.value)}
              placeholder="Type your question…"
              className="flex-1 bg-surface-container rounded-xl px-space-md h-12 font-body-md text-body-md text-on-surface placeholder-on-surface-variant focus:outline-none border border-outline-variant focus:border-primary"
            />
            <button
              type="submit"
              disabled={!textInput.trim() || isProcessing}
              className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center text-on-primary active:scale-95 transition-all disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-[20px]">send</span>
            </button>
            <button
              type="button"
              onClick={() => setShowTextInput(false)}
              className="w-12 h-12 bg-surface-container rounded-xl flex items-center justify-center text-on-surface-variant active:scale-95 transition-all"
            >
              <span className="material-symbols-outlined text-[20px]">mic</span>
            </button>
          </form>
        ) : (
          <div className="flex items-center justify-center gap-4">
            {/* Stop speaking */}
            {isSpeaking && (
              <button
                onClick={stopSpeaking}
                className="w-12 h-12 rounded-full bg-surface-container flex items-center justify-center text-primary active:scale-95 transition-all"
              >
                <span className="material-symbols-outlined text-[22px]">volume_off</span>
              </button>
            )}

            {/* Main mic button */}
            <div className="relative">
              {isListening && (
                <>
                  <div className="absolute inset-0 rounded-full bg-primary/20 animate-ping" />
                  <div className="absolute -inset-2 rounded-full bg-primary/10 animate-pulse" />
                </>
              )}
              <button
                onClick={toggleMic}
                disabled={isProcessing}
                className={`relative w-16 h-16 rounded-full flex items-center justify-center shadow-lg active:scale-95 transition-all disabled:opacity-50 ${
                  isListening ? 'bg-error text-on-error' : 'bg-primary text-on-primary'
                }`}
              >
                <span className="material-symbols-outlined text-[28px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                  {isListening ? 'stop' : 'mic'}
                </span>
              </button>
            </div>

            {/* Keyboard input toggle */}
            <button
              onClick={() => setShowTextInput(true)}
              className="w-12 h-12 rounded-full bg-surface-container flex items-center justify-center text-on-surface-variant active:scale-95 transition-all"
            >
              <span className="material-symbols-outlined text-[22px]">keyboard</span>
            </button>
          </div>
        )}

        {!showTextInput && (
          <p className="text-center font-label-sm text-label-sm text-on-surface-variant mt-2">
            {isListening ? 'Listening… tap to stop' : isProcessing ? 'Getting answer…' : 'Tap mic to speak'}
          </p>
        )}
      </div>
    </div>
  );
}
