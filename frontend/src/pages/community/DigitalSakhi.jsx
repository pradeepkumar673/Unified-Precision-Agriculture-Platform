import { useState, useRef, useEffect } from "react";
import { getFarmProfile } from "../../api/farmApi";
import { createSupportTicket } from "../../api/communityApi";

const GROQ_API_KEY = "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";
const GROQ_MODEL = "llama3-8b-8192";

function buildSystemPrompt(farm) {
  const farmInfo = farm
    ? `The farmer's farm is named "${farm.name || "this farm"}", located in ${farm.district || "their district"}, ${farm.state || "India"}. The farm covers ${farm.total_area_acres || "unknown"} acres and grows ${farm.primary_crop || "various crops"}.`
    : "The farmer has not yet set up their farm profile.";

  return `You are KhetSaathi Digital Sakhi, a friendly and knowledgeable AI agricultural assistant for Indian farmers. 
You speak like a caring, experienced village-level Krishi Sakhi (agricultural community helper).
${farmInfo}
Your role:
- Answer farming questions about crops, pests, diseases, irrigation, fertilizers, weather, government schemes.
- Give practical, actionable advice suited for Indian conditions.
- Reference the farmer's actual farm data when relevant.
- Keep responses concise (2-4 sentences), warm, and in simple language.
- Use Indian farming terminology naturally (Rabi, Kharif, mandi, quintal, etc.).
- When uncertain, suggest consulting the local KVK or agricultural officer.
Do NOT: make up specific numerical data you don't have, hallucinate weather forecasts, or give medical advice.
Respond in English unless the farmer writes in Hindi/Marathi, in which case respond in that language.`;
}

export default function DigitalSakhi() {
  const farmId = localStorage.getItem("farmId") || "";
  const [farmData, setFarmData] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [bookingStatus, setBookingStatus] = useState(null);
  const [error, setError] = useState(null);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    const init = async () => {
      try {
        const res = await getFarmProfile(farmId).catch(() => ({ data: null }));
        if (res.data) setFarmData(res.data);
        // Greet with real farm name
        const farmerName = res.data?.owner_name || res.data?.name || "Kisan ji";
        const cropName = res.data?.primary_crop || "your crops";
        setMessages([{
          role: "assistant",
          content: `Namaste ${farmerName}! I am your KhetSaathi Digital Sakhi. I can help you with questions about ${cropName}, pests, irrigation, weather, and government schemes. What would you like to know today?`,
          time: new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
        }]);
      } catch (e) {
        setMessages([{
          role: "assistant",
          content: "Namaste Kisan ji! I am your KhetSaathi Digital Sakhi. Ask me anything about farming, crops, pests, or government schemes!",
          time: new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
        }]);
      }
    };
    init();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const callGroq = async (history) => {
    const systemPrompt = buildSystemPrompt(farmData);
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        messages: [
          { role: "system", content: systemPrompt },
          ...history.map(m => ({ role: m.role, content: m.content })),
        ],
        max_tokens: 300,
        temperature: 0.7,
      }),
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error?.message || `Groq API error ${response.status}`);
    }
    const data = await response.json();
    return data.choices[0]?.message?.content || "Sorry, I could not generate a response.";
  };

  const handleSend = async (e, overrideText) => {
    e?.preventDefault();
    const msg = (overrideText || inputValue).trim();
    if (!msg || isTyping) return;

    const userMsg = {
      role: "user",
      content: msg,
      time: new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
    };

    const updatedHistory = [...messages, userMsg];
    setMessages(updatedHistory);
    setInputValue("");
    setIsTyping(true);
    setError(null);

    try {
      const reply = await callGroq(updatedHistory);
      setMessages(prev => [...prev, {
        role: "assistant",
        content: reply,
        time: new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
      }]);
    } catch (err) {
      setError("Could not connect to AI. Check your internet connection.");
      console.error("Groq error:", err);
    } finally {
      setIsTyping(false);
      inputRef.current?.focus();
    }
  };

  const handleVisitRequest = async () => {
    setBookingStatus("loading");
    try {
      await createSupportTicket({
        farm_id: farmId || "00000000-0000-0000-0000-000000000000",
        issue: "Farm Visit Request - Field assistance needed",
      });
      setBookingStatus("confirmed");
      setMessages(prev => [...prev, {
        role: "assistant",
        content: "Your farm visit request has been submitted! A Krishi Sakhi will contact you within 24 hours to confirm a convenient time.",
        time: new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
      }]);
    } catch {
      setBookingStatus("error");
    }
  };

  const QUICK_REPLIES = [
    "What fertilizer should I apply now?",
    "How do I identify yellow rust on wheat?",
    "What is the MSP for my crop this season?",
    "How much water should I give today?",
    "Which pest spray is safe before harvest?",
  ];

  const farmerName = farmData?.owner_name || farmData?.name || "Kisan";
  const farmName = farmData?.name || "Your Farm";

  return (
    <div className="min-h-screen bg-surface text-on-surface flex flex-col antialiased">
      <main className="flex flex-col relative w-full pt-20 pb-4 px-margin bg-surface flex-1 gap-space-md">

        {/* AI Sakhi Header Card */}
        <section className="w-full bg-gradient-to-r from-primary/10 to-secondary/5 rounded-2xl p-space-md shadow-sm border border-primary/15">
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-full bg-primary flex items-center justify-center flex-shrink-0 shadow-md">
              <span className="material-symbols-outlined text-on-primary text-[30px]">smart_toy</span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <h1 className="font-headline-sm text-headline-sm text-on-surface font-bold">KhetSaathi Digital Sakhi</h1>
                <span className="material-symbols-outlined text-primary text-[18px]" style={{ fontVariationSettings: '"FILL" 1' }}>verified</span>
              </div>
              <p className="font-label-sm text-label-sm text-on-surface-variant">
                AI Agricultural Advisor • {farmData?.district ? farmData.district + " District" : "Your Farm"}
              </p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
                <span className="font-label-sm text-label-sm text-primary font-semibold">Online — Powered by Groq AI</span>
              </div>
            </div>
          </div>
          {/* Farm context chip */}
          {farmData && (
            <div className="mt-3 bg-surface-container-lowest rounded-xl p-2.5 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-[18px]">agriculture</span>
              <span className="font-label-sm text-label-sm text-on-surface">
                Advising for <strong>{farmName}</strong> • {farmData.primary_crop || "General crops"} • {farmData.total_area_acres || "?"} acres
              </span>
            </div>
          )}
        </section>

        {/* Date separator */}
        <div className="flex items-center justify-center">
          <span className="bg-surface-container text-on-surface-variant font-label-sm text-label-sm px-3 py-1 rounded-full">
            {new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "short" })}
          </span>
        </div>

        {/* Messages */}
        <section className="w-full flex flex-col space-y-3">
          {messages.map((msg, idx) => (
            msg.role === "assistant" ? (
              <div key={idx} className="flex items-end gap-2 max-w-[88%] self-start">
                <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                  <span className="material-symbols-outlined text-on-primary text-[16px]">smart_toy</span>
                </div>
                <div className="bg-surface-container-lowest text-on-surface p-3.5 rounded-2xl rounded-bl-sm shadow-sm">
                  <p className="font-body-md text-body-md leading-relaxed">{msg.content}</p>
                  <span className="font-label-sm text-label-sm text-on-surface-variant mt-1 block text-right">{msg.time}</span>
                </div>
              </div>
            ) : (
              <div key={idx} className="flex flex-col items-end self-end max-w-[85%]">
                <div className="bg-primary text-on-primary p-3.5 rounded-2xl rounded-br-sm shadow-sm">
                  <p className="font-body-md text-body-md leading-relaxed">{msg.content}</p>
                  <div className="flex items-center justify-end gap-1 text-on-primary/70 font-label-sm text-label-sm pt-0.5 mt-1">
                    <span>{msg.time}</span>
                    <span className="material-symbols-outlined text-[14px]">done_all</span>
                  </div>
                </div>
              </div>
            )
          ))}

          {/* Typing indicator */}
          {isTyping && (
            <div className="flex items-end gap-2 max-w-[88%] self-start">
              <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                <span className="material-symbols-outlined text-on-primary text-[16px]">smart_toy</span>
              </div>
              <div className="bg-surface-container-lowest p-3.5 rounded-2xl rounded-bl-sm shadow-sm flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: "0ms" }}></span>
                <span className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: "150ms" }}></span>
                <span className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: "300ms" }}></span>
              </div>
            </div>
          )}

          {error && (
            <div className="bg-error-container text-on-error-container rounded-xl p-3 flex items-center gap-2 font-body-sm text-body-sm">
              <span className="material-symbols-outlined text-[20px]">error</span>
              {error}
            </div>
          )}

          <div ref={messagesEndRef} />
        </section>

        {/* Quick replies */}
        {messages.length <= 2 && (
          <div className="flex items-center gap-2 overflow-x-auto py-1 -mx-margin px-margin no-scrollbar">
            {QUICK_REPLIES.map((r, i) => (
              <button key={i} type="button"
                onClick={() => handleSend(null, r)}
                disabled={isTyping}
                className="bg-surface-container text-on-surface font-label-md text-label-md px-3.5 py-2 rounded-full whitespace-nowrap shadow-sm hover:bg-surface-container-high transition-colors flex-shrink-0 disabled:opacity-50">
                {r}
              </button>
            ))}
          </div>
        )}

        {/* Farm Visit Request */}
        <section className="w-full bg-surface-container-lowest rounded-2xl p-space-md shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-full bg-secondary/10 flex items-center justify-center flex-shrink-0">
              <span className="material-symbols-outlined text-secondary text-[22px]">calendar_month</span>
            </div>
            <div>
              <h2 className="font-label-lg text-label-lg text-on-surface font-bold">Need Hands-on Field Help?</h2>
              <p className="font-label-sm text-label-sm text-on-surface-variant">Request a free Krishi Sakhi farm visit</p>
            </div>
          </div>
          <button
            onClick={handleVisitRequest}
            disabled={bookingStatus === "loading" || bookingStatus === "confirmed"}
            type="button"
            className={`w-full h-12 rounded-xl font-label-lg font-bold flex items-center justify-center gap-2 transition-all disabled:opacity-70 ${
              bookingStatus === "confirmed"
                ? "bg-primary-fixed text-on-primary-fixed"
                : "bg-secondary text-on-secondary active:scale-[0.98]"
            }`}
          >
            <span className={`material-symbols-outlined text-[20px] ${bookingStatus === "loading" ? "animate-spin" : ""}`}>
              {bookingStatus === "confirmed" ? "check_circle" : bookingStatus === "loading" ? "progress_activity" : "support_agent"}
            </span>
            <span>
              {bookingStatus === "confirmed"
                ? "Visit Requested! We will contact you."
                : bookingStatus === "loading"
                ? "Submitting..."
                : "Request a Farm Visit"}
            </span>
          </button>
        </section>

        {/* Input bar — sticky at bottom */}
        <div className="sticky bottom-[72px] w-full bg-surface pb-2">
          <section className="w-full bg-surface-container-lowest rounded-2xl p-2 shadow-md border border-surface-container-high">
            <form className="flex items-center gap-1.5" onSubmit={handleSend}>
              <div className="flex-1 min-w-0">
                <input
                  ref={inputRef}
                  className="w-full bg-surface-container text-on-surface placeholder:text-on-surface-variant font-body-md text-body-md rounded-full px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder={`Ask about ${farmData?.primary_crop || "your crops"}, pests, weather...`}
                  type="text"
                  value={inputValue}
                  onChange={e => setInputValue(e.target.value)}
                  disabled={isTyping}
                />
              </div>
              <button
                type="submit"
                disabled={isTyping || !inputValue.trim()}
                className="w-11 h-11 rounded-full bg-primary text-on-primary flex items-center justify-center shadow-sm flex-shrink-0 active:scale-95 transition-transform disabled:opacity-50"
              >
                <span className="material-symbols-outlined text-[20px]">
                  {isTyping ? "pending" : "send"}
                </span>
              </button>
            </form>
          </section>
        </div>
      </main>
    </div>
  );
}
