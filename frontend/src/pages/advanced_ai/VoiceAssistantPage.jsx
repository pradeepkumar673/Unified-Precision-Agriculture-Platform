import { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { 
  Mic, MicOff, Image as ImageIcon, Send, X, 
  Bot, User, Activity, Loader2, Play
} from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

export default function VoiceAssistantPage() {
  const [farmId] = useState('FARM-001');
  const [messages, setMessages] = useState([
    { id: 1, sender: 'bot', text: 'Hello! I am your AI Agri-Assistant. Ask me anything via voice or text, and feel free to upload a photo for analysis.', type: 'text' }
  ]);
  const [inputText, setInputText] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  
  const [isRecording, setIsRecording] = useState(false);
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef(null);

  // Auto-scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
  };

  const toggleRecording = () => {
    if (isRecording) {
      setIsRecording(false);
      handleVoiceSubmit();
    } else {
      setIsRecording(true);
    }
  };

  const handleVoiceSubmit = async () => {
    setLoading(true);
    // Mocking voice recording payload
    const formData = new FormData();
    formData.append('audio', new Blob(['mock audio'], { type: 'audio/webm' }));
    formData.append('farm_id', farmId);

    try {
      // const res = await axios.post(`${API_BASE}/api/v1/advanced_ai/voice-query`, formData);
      setTimeout(() => {
        setMessages(prev => [
          ...prev, 
          { id: Date.now(), sender: 'user', text: '"What fertilizer should I use for yellowing wheat leaves?"', type: 'voice' },
          { id: Date.now()+1, sender: 'bot', text: 'Based on your voice query, yellowing leaves in wheat often indicate a Nitrogen deficiency. Given your last soil test showed low N levels, I recommend applying 25kg/acre of Urea.', type: 'text' }
        ]);
        setLoading(false);
      }, 2000);
    } catch (err) {
      setLoading(false);
    }
  };

  const handleTextSubmit = async (e) => {
    e.preventDefault();
    if (!inputText.trim() && !imageFile) return;

    const newMsg = { 
      id: Date.now(), 
      sender: 'user', 
      text: inputText, 
      type: 'text',
      image: imagePreview 
    };
    
    setMessages(prev => [...prev, newMsg]);
    setInputText('');
    setLoading(true);

    const formData = new FormData();
    if (imageFile) formData.append('image', imageFile);
    formData.append('input_text', inputText);
    formData.append('farm_id', farmId);

    try {
      // const res = await axios.post(`${API_BASE}/api/v1/advanced_ai/multimodal-query`, formData);
      setTimeout(() => {
        setMessages(prev => [
          ...prev, 
          { 
            id: Date.now()+1, 
            sender: 'bot', 
            text: imageFile 
              ? 'I analyzed the image you uploaded. It appears to show early signs of Leaf Rust. I recommend a preventative fungicide spray like Propiconazole.' 
              : 'I have checked your farm profile. Your current crop plan looks optimal for the upcoming weather.', 
            type: 'text' 
          }
        ]);
        removeImage();
        setLoading(false);
      }, 1500);
    } catch (err) {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4 h-[calc(100vh-8rem)] flex flex-col">
      <div>
        <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-cyan-500">
          Multimodal AI Assistant
        </h1>
        <p className="text-slate-400 mt-1">LLM-powered voice and vision queries (Whisper + Llama3/GPT-4V)</p>
      </div>

      <div className="flex-1 bg-slate-800/40 backdrop-blur-xl border border-slate-700/50 rounded-2xl shadow-xl flex flex-col overflow-hidden">
        
        {/* Chat Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {messages.map(msg => (
            <div key={msg.id} className={`flex gap-4 ${msg.sender === 'user' ? 'flex-row-reverse' : ''}`}>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 shadow-lg
                ${msg.sender === 'user' ? 'bg-gradient-to-br from-blue-500 to-indigo-600' : 'bg-gradient-to-br from-emerald-400 to-teal-500'}
              `}>
                {msg.sender === 'user' ? <User className="w-5 h-5 text-white" /> : <Bot className="w-6 h-6 text-white" />}
              </div>
              
              <div className={`max-w-[75%] rounded-2xl p-4 shadow-md
                ${msg.sender === 'user' 
                  ? 'bg-blue-600 text-white rounded-tr-none' 
                  : 'bg-slate-700 text-slate-200 rounded-tl-none border border-slate-600'}
              `}>
                {msg.type === 'voice' && (
                  <div className="flex items-center gap-2 mb-2 text-blue-200 bg-blue-700/50 w-max px-3 py-1 rounded-full text-xs">
                    <Play className="w-3 h-3"/> Voice Transcript
                  </div>
                )}
                {msg.image && (
                  <img src={msg.image} className="w-48 h-48 object-cover rounded-xl mb-3 border-2 border-white/20" alt="Upload"/>
                )}
                <p className="leading-relaxed">{msg.text}</p>
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex gap-4">
              <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center shrink-0">
                <Loader2 className="w-5 h-5 text-teal-400 animate-spin" />
              </div>
              <div className="bg-slate-700 rounded-2xl rounded-tl-none p-4 flex gap-1">
                <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></span>
                <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{animationDelay: '150ms'}}></span>
                <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{animationDelay: '300ms'}}></span>
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 bg-slate-900 border-t border-slate-700">
          
          {imagePreview && (
            <div className="mb-3 relative inline-block">
              <img src={imagePreview} className="h-20 rounded-lg border border-slate-600" alt="Preview"/>
              <button onClick={removeImage} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-lg hover:bg-red-600">
                <X className="w-3 h-3"/>
              </button>
            </div>
          )}

          <form onSubmit={handleTextSubmit} className="flex items-end gap-3">
            <button 
              type="button" onClick={toggleRecording}
              className={`p-4 rounded-full flex items-center justify-center transition-all shadow-lg shrink-0
                ${isRecording ? 'bg-red-500 text-white animate-pulse' : 'bg-slate-800 text-slate-300 hover:text-white border border-slate-700'}
              `}
            >
              {isRecording ? <Activity className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
            </button>
            
            <div className="flex-1 relative bg-slate-800 border border-slate-700 rounded-2xl flex items-center shadow-inner focus-within:border-cyan-500/50 focus-within:ring-1 focus-within:ring-cyan-500/50">
              <label className="p-3 text-slate-400 hover:text-cyan-400 cursor-pointer transition-colors">
                <ImageIcon className="w-6 h-6"/>
                <input type="file" accept="image/*" className="hidden" onChange={handleImageSelect} />
              </label>
              <input 
                value={inputText} onChange={e=>setInputText(e.target.value)}
                placeholder="Ask about crops, upload a diseased leaf, or tap mic..."
                className="flex-1 bg-transparent border-none py-4 outline-none text-white placeholder:text-slate-500"
              />
            </div>
            
            <button 
              type="submit" disabled={(!inputText.trim() && !imageFile) || loading}
              className="p-4 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg hover:opacity-90 disabled:opacity-50 disabled:grayscale transition-all shrink-0"
            >
              <Send className="w-6 h-6" />
            </button>
          </form>
          
          {isRecording && <p className="text-red-400 text-xs text-center mt-2 animate-pulse">Listening... Click mic again to send.</p>}
        </div>
      </div>
    </div>
  );
}
