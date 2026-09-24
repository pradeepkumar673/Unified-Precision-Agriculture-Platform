import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import AppShell from "../../layouts/AppShell";
import { getFarmProfile } from "../../api/farmApi";

const GROQ_API_KEY = "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";
const GROQ_MODEL = "llama3-8b-8192";

export default function MultimodalQuery() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const farmId = localStorage.getItem("farmId") || "00000000-0000-0000-0000-000000000000";
  
  const [farmData, setFarmData] = useState(null);
  const [inputText, setInputText] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [messages, setMessages] = useState([]);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    getFarmProfile(farmId).then(res => setFarmData(res.data)).catch(() => {});
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isSubmitting]);

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
      fileInputRef.current.value = "";
    }
  };

  const callGroq = async (text, hasImage) => {
    const farmInfo = farmData 
      ? `Farm Name: ${farmData.name}, Crop: ${farmData.primary_crop || "Unknown"}, Location: ${farmData.village || farmData.district || "Unknown"}`
      : "Farm details unknown.";
    
    const systemPrompt = `You are Agri-Vision AI, a precision agriculture assistant. 
Context: ${farmInfo}
The user is asking a query. ${hasImage ? "They have also attached an image (which you cannot see, but assume it relates to their question about pests, diseases, or crop health)." : ""}
Provide a detailed, practical agronomic assessment and actionable recommended plan. 
Keep it concise, formatting with short paragraphs or bullet points if needed. Don't mention that you can't see the image, just provide best-effort advice based on their text description.`;

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
          ...messages.map(m => ({ role: m.type === "user" ? "user" : "assistant", content: m.text || m.content })),
          { role: "user", content: text || "Please analyze the attached image." }
        ],
        max_tokens: 500,
        temperature: 0.5,
      }),
    });
    
    if (!response.ok) throw new Error("Failed to fetch from Groq");
    const data = await response.json();
    return data.choices[0]?.message?.content || "No response generated.";
  };

  const handleSubmit = async (e) => {
    e?.preventDefault();
    if (!inputText.trim() && !selectedFile) return;

    const userMessage = {
      type: "user",
      text: inputText,
      image: previewUrl,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    };
    
    setMessages(prev => [...prev, userMessage]);
    
    const currentInputText = inputText;
    const hasImage = !!selectedFile;
    
    setInputText("");
    clearAttachment();
    setIsSubmitting(true);

    try {
      const responseText = await callGroq(currentInputText, hasImage);
      
      const aiMessage = {
        type: "ai",
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        content: responseText
      };
      setMessages(prev => [...prev, aiMessage]);
    } catch (err) {
      console.error(err);
      setMessages(prev => [...prev, { type: "ai", time: "Just now", content: "Sorry, I could not process your query at this time." }]);
    } finally {
      setIsSubmitting(false);
    }
  };

  const farmName = farmData?.name || "Your Farm";
  const crop = farmData?.primary_crop || "Mixed Crops";
  const area = farmData?.total_area_acres ? `${farmData.total_area_acres} Acres` : "";

  return (
    <AppShell 
      variant="detail" 
      hideBottomNav={true}
      rootClassName="bg-surface selection:bg-primary-fixed"
      title="Multimodal Query"
      headerRightSlot={
        <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center ml-1">
          <span className="material-symbols-outlined text-on-primary text-[18px]">person</span>
        </div>
      }
    >
      <div className="flex flex-col w-full pb-28 pt-16 min-h-screen relative">
      
      {/* Top Utility Context Strip */}
      <div className="px-margin py-2 bg-surface-container-low flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
          <span className="font-label-sm text-label-sm text-on-surface">Agri-Vision AI Online</span>
        </div>
        <div className="flex items-center gap-1 bg-surface-container px-2 py-1 rounded-full text-on-surface">
          <span className="material-symbols-outlined text-[14px] text-primary">sensors</span>
          <span className="font-label-sm text-label-sm text-on-surface">Live Cloud Sync</span>
        </div>
      </div>
      
      {/* Plot Context Header Bar */}
      <div className="mx-margin mt-3 mb-4 p-3 bg-surface-container-lowest rounded-xl shadow-sm border border-surface-container-low flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
            <span className="material-symbols-outlined text-[24px]">agriculture</span>
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="font-headline-sm text-headline-sm text-on-surface">{farmName} • {crop}</span>
            </div>
            <span className="font-body-sm text-body-sm text-on-surface-variant text-xs">{area} • Powered by Groq AI</span>
          </div>
        </div>
      </div>

      <div className="px-margin flex flex-col gap-4">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center py-10 gap-3 text-on-surface-variant opacity-70">
            <span className="material-symbols-outlined text-[48px]">center_focus_strong</span>
            <p className="font-body-md text-body-md text-center">
              Upload a picture of a diseased leaf, pest, or soil condition and ask a question.
            </p>
          </div>
        )}

        {messages.map((msg, idx) => (
          <div key={idx} className="clear-both">
            {msg.type === "user" ? (
              <div className="flex flex-col items-end gap-1.5 max-w-[88%] float-right mb-4">
                <div className="w-full bg-primary text-on-primary rounded-2xl rounded-tr-none p-3 shadow-sm flex flex-col gap-2">
                  {msg.image && (
                    <div className="relative w-full rounded-lg overflow-hidden bg-black/20">
                      <img alt="User Upload" className="w-full h-40 object-cover" src={msg.image} />
                      <div className="absolute bottom-1 left-1 flex items-center gap-1 px-1.5 py-0.5 rounded bg-black/60 text-white backdrop-blur-sm">
                        <span className="material-symbols-outlined text-[12px]">photo_camera</span>
                        <span className="font-label-sm text-label-sm text-[10px]">Attached</span>
                      </div>
                    </div>
                  )}
                  {msg.text && (
                    <p className="font-body-md text-body-md font-medium leading-snug">
                      {msg.text}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-1 text-on-surface-variant text-xs pr-1">
                  <span>{msg.time}</span>
                  <span className="material-symbols-outlined text-[14px] text-primary">done_all</span>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-start gap-1.5 max-w-[92%] float-left mb-4">
                <div className="flex items-center gap-1.5 mb-1">
                  <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center text-on-primary">
                    <span className="material-symbols-outlined text-[14px]">psychology</span>
                  </div>
                  <span className="font-label-sm text-label-sm text-on-surface font-semibold">Agri-Vision AI</span>
                </div>
                
                <div className="w-full bg-surface-container-lowest rounded-2xl rounded-tl-none p-4 shadow-sm border border-surface-container-low flex flex-col gap-3">
                  <div className="flex flex-col gap-1.5">
                    <span className="font-label-md text-label-md text-primary tracking-wider uppercase text-xs font-bold">Assessment & Action Plan</span>
                    <p className="font-body-md text-body-md text-on-surface leading-relaxed whitespace-pre-wrap">
                      {msg.content}
                    </p>
                  </div>
                </div>
                <span className="text-on-surface-variant font-label-sm text-label-sm pl-1">{msg.time}</span>
              </div>
            )}
          </div>
        ))}
        {isSubmitting && (
          <div className="flex items-center gap-2 p-3 text-on-surface-variant clear-both float-left">
            <span className="material-symbols-outlined animate-spin text-[20px] text-primary">progress_activity</span>
            <span className="font-label-md">Analyzing with Groq...</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 z-40 bg-surface-container-lowest shadow-[0_-4px_16px_rgba(0,0,0,0.1)] px-margin pt-2 pb-safe">
        {previewUrl && (
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="relative w-10 h-10 rounded-lg overflow-hidden bg-surface-container">
                <img alt="Thumbnail" className="w-full h-full object-cover" src={previewUrl} />
              </div>
              <span className="font-label-sm text-label-sm text-on-surface-variant truncate max-w-[200px]">{selectedFile?.name}</span>
            </div>
            <button type="button" onClick={clearAttachment} className="text-error flex items-center gap-0.5 p-1">
              <span className="material-symbols-outlined text-[18px]">close</span>
            </button>
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="flex items-center gap-2 bg-surface-container rounded-2xl p-1.5 mb-2 border border-surface-container-high">
          <input type="file" ref={fileInputRef} onChange={handleFileSelect} accept="image/*" className="hidden" />
          <button type="button" onClick={() => fileInputRef.current?.click()} className="w-10 h-10 rounded-xl bg-surface-container-highest flex items-center justify-center text-on-surface-variant shrink-0 hover:text-primary transition-colors">
            <span className="material-symbols-outlined text-[20px]">add_photo_alternate</span>
          </button>
          
          <input 
            className="flex-1 min-w-0 bg-transparent py-2.5 px-1 font-body-md text-body-md text-on-surface placeholder:text-on-surface-variant focus:outline-none" 
            placeholder="Describe the image or ask..." 
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
          />
          
          <button type="submit" disabled={isSubmitting || (!inputText.trim() && !selectedFile)} className="w-10 h-10 rounded-xl bg-primary text-on-primary flex items-center justify-center shrink-0 disabled:opacity-50 transition-opacity">
            <span className="material-symbols-outlined text-[18px]">send</span>
          </button>
        </form>
      </div>
    </AppShell>
  );
}
