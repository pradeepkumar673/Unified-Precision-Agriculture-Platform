import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getFarmProfile } from "../../api/farmApi";

const GROQ_API_KEY = "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";
const GROQ_MODEL = "llama3-8b-8192";

const SUGGESTED_QUERIES = [
  { icon: "water_drop", text: "When should I irrigate my field?", color: "text-primary" },
  { icon: "pest_control", text: "How to control aphids on my crop?", color: "text-error" },
  { icon: "currency_rupee", text: "What is the current mandi price for sugarcane?", color: "text-tertiary" },
  { icon: "vaccines", text: "Which fertilizer to apply at tillering stage?", color: "text-secondary" },
  { icon: "cloud", text: "Is this a good week to spray pesticide?", color: "text-on-surface-variant" },
  { icon: "account_balance", text: "How do I apply for PM-KISAN?", color: "text-primary" },
];

export default function VoiceAssistantPage() {
  const navigate = useNavigate();
  const farmId = localStorage.getItem("farmId") || "00000000-0000-0000-0000-000000000000";

  const [farm, setFarm] = useState(null);
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [textInput, setTextInput] = useState("");
  const [showTextInput, setShowTextInput] = useState(false);
  const [messages, setMessages] = useState([]); // [{role, text}]
  const [lang, setLang] = useState("en-IN"); // en-IN | hi-IN | ta-IN | mr-IN
  const [error, setError] = useState("");

  const recognitionRef = useRef(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    getFarmProfile(farmId).then(r => setFarm(r.data)).catch(() => {});
  }, [farmId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isProcessing, isListening]);

  // Detect if Web Speech API is supported
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  const speechSupported = !!SpeechRecognition;

  const startListening = () => {
    if (!SpeechRecognition) {
      setError("Voice recognition not supported in this browser. Use Chrome for best results.");
      setShowTextInput(true);
      return;
    }
    setError("");
    const recognition = new SpeechRecognition();
    recognition.lang = lang;
    recognition.continuous = false;
    recognition.interimResults = true;
    recognitionRef.current = recognition;

    recognition.onstart = () => setIsListening(true);
    recognition.onresult = (e) => {
      const interim = Array.from(e.results).map(r => r[0].transcript).join("");
      setTranscript(interim);
    };
    recognition.onend = () => {
      setIsListening(false);
      // Hack to get the final transcript since onend doesn't receive it natively in state due to closures
      setTranscript(t => {
        if (t.trim()) {
          askQuestion(t.trim());
        }
        return t;
      });
    };
    recognition.onerror = (e) => {
      setIsListening(false);
      if (e.error === "not-allowed") {
        setError("Microphone access denied. Please allow microphone access in your browser.");
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
    
    // Attempt to pick a decent voice based on language
    const voices = window.speechSynthesis.getVoices();
    const isHindi = lang.startsWith("hi");
    const isMarathi = lang.startsWith("mr");
    const isTamil = lang.startsWith("ta");
    
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = lang;
    utter.rate = 0.9;
    
    // Filter voices to find a matching one
    const matchingVoice = voices.find(v => v.lang.startsWith(lang.substring(0, 2)));
    if (matchingVoice) utter.voice = matchingVoice;

    utter.onstart = () => setIsSpeaking(true);
    utter.onend = () => setIsSpeaking(false);
    utter.onerror = () => setIsSpeaking(false);
    window.speechSynthesis.speak(utter);
  };

  const stopSpeaking = () => {
    window.speechSynthesis?.cancel();
    setIsSpeaking(false);
  };

  const getSystemPrompt = () => {
    const farmContext = farm 
      ? `Farm: ${farm.name}, Crop: ${farm.primary_crop || "Unknown"}, Location: ${farm.district || "Unknown"}`
      : "No farm details available.";
    
    let languageInstruction = "Reply in English.";
    if (lang === "hi-IN") languageInstruction = "Reply in Hindi.";
    else if (lang === "mr-IN") languageInstruction = "Reply in Marathi.";
    else if (lang === "ta-IN") languageInstruction = "Reply in Tamil.";
    
    return `You are KhetSaathi Bol, a helpful AI Voice Assistant for farmers.
Context: ${farmContext}
You provide concise, spoken-friendly advice about agriculture, weather, crops, and government schemes.
Keep your response short (2-4 sentences max) because it will be spoken aloud using Text-To-Speech.
${languageInstruction}`;
  };

  const askQuestion = async (question) => {
    if (!question.trim()) return;
    setTranscript("");
    setTextInput("");
    setIsProcessing(true);
    setMessages(prev => [...prev, { role: "user", text: question }]);

    try {
      const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${GROQ_API_KEY}`,
        },
        body: JSON.stringify({
          model: GROQ_MODEL,
          messages: [
            { role: "system", content: getSystemPrompt() },
            ...messages.map(m => ({ role: m.role, content: m.text })),
            { role: "user", content: question }
          ],
          max_tokens: 150,
          temperature: 0.6,
        }),
      });

      if (!response.ok) throw new Error("API Failed");
      const data = await response.json();
      const answer = data.choices[0]?.message?.content || "Sorry, I could not generate a response.";
      
      setMessages(prev => [...prev, { role: "assistant", text: answer }]);
      speakResponse(answer);
    } catch (err) {
      const fallback = "Sorry, I could not connect right now. Please try again.";
      setMessages(prev => [...prev, { role: "assistant", text: fallback }]);
      speakResponse(fallback);
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
    { code: "en-IN", label: "EN", full: "English" },
    { code: "hi-IN", label: "हिं", full: "Hindi" },
    { code: "ta-IN", label: "த", full: "Tamil" },
    { code: "mr-IN", label: "म", full: "Marathi" },
  ];

  return (
    <div className="min-h-screen bg-surface flex flex-col font-sans antialiased text-on-surface selection:bg-primary/20">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-surface/90 backdrop-blur-md border-b border-surface-container">
        <div className="flex items-center justify-between px-margin py-3">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="w-10 h-10 flex items-center justify-center rounded-full bg-surface-container-low hover:bg-surface-container active:scale-95 transition-all"
            >
              <span className="material-symbols-outlined text-[24px]">arrow_back</span>
            </button>
            <div className="flex flex-col">
              <h1 className="font-headline-sm text-headline-sm font-bold">KhetSaathi Bol</h1>
              <p className="font-label-sm text-label-sm text-on-surface-variant flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" /> AI Voice Assistant
              </p>
            </div>
          </div>
          {/* Language switcher */}
          <div className="flex items-center gap-1 bg-surface-container-low p-1 rounded-full">
            {LANG_OPTIONS.map(l => (
              <button
                key={l.code}
                onClick={() => setLang(l.code)}
                title={l.full}
                className={`w-8 h-8 rounded-full font-label-sm text-[13px] font-bold transition-all ${
                  lang === l.code
                    ? "bg-primary text-on-primary shadow-sm"
                    : "text-on-surface-variant hover:bg-surface-container-highest"
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
        <div className="px-margin pt-4 pb-2">
          <div className="flex items-center justify-between bg-surface-container-lowest border border-surface-container px-3 py-2.5 rounded-xl shadow-sm">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>landscape</span>
              <div className="flex flex-col">
                <span className="font-label-md text-label-md capitalize font-bold leading-tight">
                  {farm.name}
                </span>
                <span className="font-body-sm text-[11px] text-on-surface-variant truncate max-w-[200px]">
                  {farm.primary_crop || "Mixed Crops"} • {farm.district}
                </span>
              </div>
            </div>
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="material-symbols-outlined text-primary text-[16px]">psychology</span>
            </div>
          </div>
        </div>
      )}

      {/* Messages feed */}
      <div className="flex-1 overflow-y-auto px-margin py-2 flex flex-col gap-4">
        {messages.length === 0 && (
          <div className="flex flex-col h-full items-center justify-center mt-8 gap-8">
            <div className="flex flex-col items-center gap-4">
              <div className="relative">
                <div className="absolute inset-0 bg-primary/10 rounded-full animate-ping" />
                <div className="w-20 h-20 rounded-full bg-primary-container flex items-center justify-center shadow-inner relative z-10">
                  <span className="material-symbols-outlined text-on-primary text-[40px]" style={{ fontVariationSettings: "'FILL' 1" }}>mic</span>
                </div>
              </div>
              <p className="font-body-md text-body-md text-on-surface-variant text-center max-w-[280px] leading-relaxed">
                Tap the mic and ask anything about your crops, weather, prices, or schemes.
              </p>
            </div>

            <div className="w-full">
              <p className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-widest mb-3 pl-1 font-bold">Try asking…</p>
              <div className="flex flex-col gap-2">
                {SUGGESTED_QUERIES.slice(0, 4).map((q, i) => (
                  <button
                    key={i}
                    onClick={() => askQuestion(q.text)}
                    className="flex items-center gap-3 bg-surface-container-lowest border border-surface-container-low rounded-xl px-4 py-3 shadow-sm text-left hover:bg-surface-container active:scale-[0.98] transition-all"
                  >
                    <span className={`material-symbols-outlined text-[22px] ${q.color} flex-shrink-0`}>{q.icon}</span>
                    <span className="font-body-md text-body-md font-medium">{q.text}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            {msg.role === "assistant" && (
              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center mr-2 mt-1 flex-shrink-0">
                <span className="material-symbols-outlined text-on-primary text-[16px]">psychology</span>
              </div>
            )}
            <div className={`max-w-[85%] rounded-2xl px-4 py-3 shadow-sm ${
              msg.role === "user"
                ? "bg-primary text-on-primary rounded-tr-sm"
                : "bg-surface-container-lowest border border-surface-container-low text-on-surface rounded-tl-sm"
            }`}>
              <p className="font-body-md text-body-md leading-relaxed whitespace-pre-wrap">{msg.text}</p>
            </div>
          </div>
        ))}

        {isProcessing && (
          <div className="flex justify-start">
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center mr-2 flex-shrink-0">
              <span className="material-symbols-outlined text-on-primary text-[16px]">psychology</span>
            </div>
            <div className="bg-surface-container-lowest border border-surface-container-low rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm flex items-center gap-2">
              <div className="flex gap-1">
                {[0, 1, 2].map(j => (
                  <div key={j} className="w-2 h-2 rounded-full bg-primary" style={{ animation: `bounce 1s infinite ${j * 150}ms` }} />
                ))}
              </div>
              <span className="font-label-sm text-label-sm text-primary font-bold ml-1">Thinking...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} className="h-4" />
      </div>

      {/* Error */}
      {error && (
        <div className="px-margin pb-2">
          <div className="bg-error-container text-on-error-container font-body-sm text-[13px] px-3 py-2 rounded-xl flex items-center gap-2 shadow-sm">
            <span className="material-symbols-outlined text-[18px]">error</span>
            {error}
          </div>
        </div>
      )}

      {/* Transcript preview */}
      {(isListening || transcript) && (
        <div className="px-margin pb-4">
          <div className="bg-primary/10 border border-primary/20 rounded-2xl px-4 py-3 flex items-center gap-3">
            <span className={`material-symbols-outlined text-primary text-[24px] ${isListening ? "animate-pulse" : ""}`}>mic</span>
            <span className="font-body-lg text-body-lg text-on-surface flex-1 italic font-medium">
              {isListening && !transcript ? "Listening..." : transcript}
            </span>
          </div>
        </div>
      )}

      {/* Bottom controls */}
      <div className="bg-surface/90 backdrop-blur-md border-t border-surface-container px-margin py-3 pb-safe z-10 shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
        {showTextInput ? (
          <form onSubmit={handleTextSubmit} className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowTextInput(false)}
              className="w-12 h-12 bg-surface-container-low rounded-xl flex items-center justify-center text-on-surface-variant hover:text-primary active:scale-95 transition-all"
            >
              <span className="material-symbols-outlined text-[24px]">mic</span>
            </button>
            <input
              type="text"
              value={textInput}
              onChange={e => setTextInput(e.target.value)}
              placeholder="Type your question..."
              className="flex-1 bg-surface-container-lowest border border-surface-container rounded-xl px-4 h-12 font-body-md text-body-md text-on-surface placeholder-on-surface-variant focus:outline-none focus:border-primary shadow-sm"
            />
            <button
              type="submit"
              disabled={!textInput.trim() || isProcessing}
              className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center text-on-primary active:scale-95 transition-all disabled:opacity-50 shadow-sm"
            >
              <span className="material-symbols-outlined text-[20px]">send</span>
            </button>
          </form>
        ) : (
          <div className="flex flex-col items-center">
            <div className="flex items-center justify-center gap-6 w-full">
              {/* Keyboard input toggle */}
              <button
                onClick={() => setShowTextInput(true)}
                className="w-12 h-12 rounded-full bg-surface-container-low hover:bg-surface-container flex items-center justify-center text-on-surface-variant active:scale-95 transition-all shadow-sm"
              >
                <span className="material-symbols-outlined text-[24px]">keyboard</span>
              </button>

              {/* Main mic button */}
              <div className="relative">
                {isListening && (
                  <>
                    <div className="absolute inset-0 rounded-full bg-error/30 animate-ping" />
                    <div className="absolute -inset-3 rounded-full bg-error/10 animate-pulse" />
                  </>
                )}
                <button
                  onClick={toggleMic}
                  disabled={isProcessing}
                  className={`relative w-[72px] h-[72px] rounded-full flex items-center justify-center shadow-lg active:scale-90 transition-all duration-300 disabled:opacity-50 ${
                    isListening ? "bg-error text-on-error" : "bg-primary text-on-primary"
                  }`}
                >
                  <span className="material-symbols-outlined text-[36px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                    {isListening ? "stop" : "mic"}
                  </span>
                </button>
              </div>

              {/* Stop speaking */}
              <button
                onClick={stopSpeaking}
                disabled={!isSpeaking}
                className={`w-12 h-12 rounded-full flex items-center justify-center transition-all shadow-sm ${
                  isSpeaking ? "bg-surface-container text-error hover:bg-error/10 active:scale-95" : "bg-surface-container-low text-on-surface-variant/30 opacity-50 cursor-not-allowed"
                }`}
              >
                <span className="material-symbols-outlined text-[24px]">volume_off</span>
              </button>
            </div>
            
            <p className="text-center font-label-sm text-label-sm text-on-surface-variant mt-4 font-medium tracking-wide">
              {isListening ? "Listening... tap to stop" : isProcessing ? "Getting answer..." : "Tap mic to speak"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
