import React, { useState, useEffect, Component } from 'react';
import { LayoutDashboard, PenTool, Image as ImageIcon, Trello, Send, Loader2, Download, Copy, CheckCircle2, AlertCircle, Plus, Upload, X, Sparkles, Cloud, Database, RefreshCw, Trash2, Sliders, ChevronDown, ChevronUp, Globe, Settings, Key, Clapperboard, Layers, AlignLeft, AlignCenter, AlignRight, MonitorPlay, Target, Type, Lightbulb, Film, Video, PlayCircle, Play, Pause, Wand2, Save, FolderOpen, Zap, CheckCircle, ChevronRight, Calculator, PieChart, DollarSign, TrendingUp, TrendingDown, Receipt } from 'lucide-react';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, collection, addDoc, getDocs, query, orderBy, serverTimestamp, deleteDoc, doc } from 'firebase/firestore';
import { getAuth, signInAnonymously, onAuthStateChanged, signInWithCustomToken } from 'firebase/auth';

// --- Firebase Configuration ---
const firebaseConfig = { apiKey: "AIzaSyDSkhGyrcM4E8Dv8n6XG_7AObuAUaZyYoM", authDomain: "creative-hub-all-in-one.firebaseapp.com", projectId: "creative-hub-all-in-one", storageBucket: "creative-hub-all-in-one.firebasestorage.app", messagingSenderId: "1042437402683", appId: "1:1042437402683:web:09f0cfe201d6dd550dac1e", measurementId: "G-JSK9HPSVRQ" };

let app, db, auth, appId;
try {
  app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
  db = getFirestore(app);
  auth = getAuth(app);
  appId = firebaseConfig.appId;
} catch (initError) {
  console.error("🔥 Firebase Initialization Error:", initError);
}

const fetchWithRetry = async (url, options, retries = 5) => {
  const delays = [1000, 2000, 4000, 8000, 16000];
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url, options);
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API Error ${response.status}: ${errorText}`);
      }
      return await response.json();
    } catch (error) {
      if (i === retries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, delays[i]));
    }
  }
};

// --- Image Compression Utility for Firestore ---
const compressImage = (base64Str, maxWidth = 800, quality = 0.6) => {
  return new Promise((resolve) => {
    if (!base64Str) return resolve(null);
    const img = new Image();
    img.src = base64Str;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let width = img.width;
      let height = img.height;

      if (width > maxWidth) {
        height = Math.round((height * maxWidth) / width);
        width = maxWidth;
      } else {
        return resolve(base64Str); 
      }

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL('image/jpeg', quality)); 
    };
    img.onerror = () => resolve(base64Str); 
  });
};

class ErrorBoundary extends Component {
  constructor(props) { super(props); this.state = { hasError: false, error: null }; }
  static getDerivedStateFromError(error) { return { hasError: true, error }; }
  render() {
    if (this.state.hasError) {
      return (
        <div className="flex h-screen w-full items-center justify-center bg-[#0a0a0f] p-8 text-gray-200">
          <div className="bg-red-500/10 border border-red-500/20 p-8 rounded-3xl max-w-2xl w-full">
            <h2 className="text-2xl font-bold text-red-400 mb-4 flex items-center gap-2"><AlertCircle /> ระบบขัดข้อง (App Crashed)</h2>
            <p className="text-gray-300 mb-4">เกิดข้อผิดพลาดบางอย่าง หากคุณเพิ่งแก้ไขโค้ด ลองกดรีเฟรชหน้าต่างเบราว์เซอร์ 1 ครั้ง</p>
            <div className="bg-black/50 p-4 rounded-xl font-mono text-sm text-red-300 overflow-auto">{this.state.error?.toString()}</div>
            <button onClick={() => window.location.reload()} className="mt-6 flex items-center gap-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 px-6 py-3 rounded-xl font-medium transition-colors"><RefreshCw size={18} /> โหลดระบบใหม่ (Reload)</button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

function AppContent() {
  const [activeTab, setActiveTab] = useState('auto');
  const [notification, setNotification] = useState(null);
  const [user, setUser] = useState(null);
  const [authError, setAuthError] = useState(null);
  const [apiKey, setApiKey] = useState(() => localStorage.getItem('gemini_api_key') || '');

  useEffect(() => {
    const initAuth = async () => {
      if (!auth) { setAuthError('firebase-init-failed'); return; }
      try {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
          try { await signInWithCustomToken(auth, __initial_auth_token); } 
          catch (tokenError) { await signInAnonymously(auth); }
        } else { await signInAnonymously(auth); }
      } catch (error) { setAuthError(error.code); }
    };
    initAuth();
    const unsubscribe = onAuthStateChanged(auth, setUser);
    return () => unsubscribe();
  }, []);

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleSaveApiKey = (key) => {
    setApiKey(key);
    localStorage.setItem('gemini_api_key', key);
  };

  return (
    <div className="flex h-screen w-full bg-[#0a0a0f] text-gray-200 font-sans overflow-hidden selection:bg-pink-500/30 selection:text-pink-200">
      <div className="fixed top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-blue-600/20 blur-[120px] pointer-events-none"></div>
      <div className="fixed bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-pink-600/20 blur-[120px] pointer-events-none"></div>

      <aside className="w-72 bg-black/40 backdrop-blur-xl border-r border-white/10 flex flex-col relative z-10 m-4 rounded-[2rem] shadow-2xl shrink-0">
        <div className="p-8 pb-4">
          <h1 className="text-3xl font-black bg-clip-text text-transparent bg-gradient-to-br from-white via-gray-200 to-gray-500 tracking-tight">Creative<span className="text-pink-500">Hub</span></h1>
          <p className="text-[10px] text-gray-500 mt-2 font-bold tracking-widest uppercase flex items-center gap-1">Omniverse Edition 3.0</p>
        </div>
        
        <nav className="flex-1 px-4 space-y-4 overflow-y-auto custom-scrollbar pb-6">
          {/* Section 1: Workspace */}
          <div>
            <p className="px-5 text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">Workspace</p>
            <div className="space-y-1">
              <NavItem icon={<Zap size={20} />} label="One-Click AutoMagic" isActive={activeTab === 'auto'} onClick={() => setActiveTab('auto')} highlight={true} />
              <NavItem icon={<LayoutDashboard size={20} />} label="Dashboard" isActive={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} />
            </div>
          </div>

          {/* Section 2: Creative Hub */}
          <div>
            <p className="px-5 text-[10px] font-bold text-pink-500/70 uppercase tracking-widest mb-2">Creative Hub</p>
            <div className="space-y-1">
              <NavItem icon={<Clapperboard size={20} />} label="AI Campaign Director" isActive={activeTab === 'campaign'} onClick={() => setActiveTab('campaign')} highlight={false} />
              <NavItem icon={<Film size={20} />} label="Storyboard Studio" isActive={activeTab === 'storyboard'} onClick={() => setActiveTab('storyboard')} highlight={false} />
              <NavItem icon={<Video size={20} />} label="AI Video Studio" isActive={activeTab === 'video'} onClick={() => setActiveTab('video')} highlight={false} />
              <NavItem icon={<PenTool size={20} />} label="AI Copywriter" isActive={activeTab === 'content'} onClick={() => setActiveTab('content')} />
              <NavItem icon={<ImageIcon size={20} />} label="Ad & Image Studio" isActive={activeTab === 'image'} onClick={() => setActiveTab('image')} />
              <NavItem icon={<Layers size={20} />} label="Promo & Banner Studio" isActive={activeTab === 'banner'} onClick={() => setActiveTab('banner')} />
            </div>
          </div>

          {/* Section 3: Data Center */}
          <div>
            <p className="px-5 text-[10px] font-bold text-emerald-500/70 uppercase tracking-widest mb-2">Data Center</p>
            <div className="space-y-1">
              <NavItem icon={<Calculator size={20} />} label="Profit Analytics" isActive={activeTab === 'profit'} onClick={() => setActiveTab('profit')} highlight={true} theme="emerald" />
            </div>
          </div>
        </nav>

        <div className="p-6 border-t border-white/10 m-4 rounded-2xl bg-white/5 backdrop-blur-md mt-auto">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-pink-500 to-blue-500 flex items-center justify-center text-white font-bold shadow-lg shadow-pink-500/20">You</div>
              <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 border-2 border-[#1a1b23] rounded-full"></div>
            </div>
            <div>
              <p className="text-sm font-semibold text-white">Creative Lead</p>
              <p className="text-xs text-gray-400">Online</p>
            </div>
          </div>
        </div>
      </aside>

      <main className="flex-1 overflow-auto relative z-10 p-4 w-full flex flex-col gap-4">
        {/* Global Settings Top Bar */}
        <div className="bg-[#15161c] border border-white/5 rounded-2xl p-4 flex items-center justify-between shadow-lg shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-500/10 rounded-xl"><Key className="text-purple-400" size={18} /></div>
            <div>
              <h3 className="font-bold text-sm text-white">ตั้งค่า Gemini API Key</h3>
              <p className="text-xs text-gray-500">บันทึกในเบราว์เซอร์ เพื่อเปิดใช้งานระบบ AI ทั้งหมด</p>
            </div>
          </div>
          <input 
            type="password" 
            value={apiKey} 
            onChange={(e) => handleSaveApiKey(e.target.value)}
            placeholder="ใส่ API Key ที่นี่..." 
            className="bg-black border border-white/10 text-white rounded-xl px-4 py-2 w-64 text-sm focus:border-purple-500 outline-none transition-colors"
          />
        </div>

        <div className="flex-1 w-full bg-black/20 backdrop-blur-3xl border border-white/5 rounded-[2.5rem] shadow-2xl overflow-hidden relative">
          {notification && (
            <div className={`absolute top-6 right-6 z-50 px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3 text-sm font-medium transition-all animate-in slide-in-from-top-4 backdrop-blur-md border ${notification.type === 'error' ? 'bg-red-500/10 text-red-400 border-red-500/20' : 'bg-green-500/10 text-green-400 border-green-500/20'}`}>
              {notification.type === 'error' ? <AlertCircle size={18} /> : <CheckCircle2 size={18} />} {notification.message}
            </div>
          )}
          <div className="h-full w-full overflow-y-auto custom-scrollbar p-10">
            <div className="w-full h-full max-w-[1400px] mx-auto">
              {activeTab === 'auto' && <AutoCampaignWizard showNotification={showNotification} user={user} authError={authError} apiKey={apiKey} />}
              {activeTab === 'dashboard' && <Dashboard />}
              {activeTab === 'profit' && <ProfitCenter showNotification={showNotification} user={user} authError={authError} apiKey={apiKey} />}
              {activeTab === 'campaign' && <CampaignDirector showNotification={showNotification} apiKey={apiKey} />}
              {activeTab === 'storyboard' && <StoryboardStudio showNotification={showNotification} user={user} authError={authError} apiKey={apiKey} />}
              {activeTab === 'video' && <VideoStudio showNotification={showNotification} apiKey={apiKey} />}
              {activeTab === 'content' && <ContentGenerator showNotification={showNotification} user={user} authError={authError} apiKey={apiKey} />}
              {activeTab === 'image' && <ImageStudio showNotification={showNotification} user={user} authError={authError} apiKey={apiKey} />}
              {activeTab === 'banner' && <BannerStudio showNotification={showNotification} apiKey={apiKey} />}
            </div>
          </div>
        </div>
      </main>

      <style dangerouslySetInnerHTML={{__html: `
        html, body, #root { width: 100% !important; max-width: none !important; margin: 0 !important; padding: 0 !important; text-align: left !important; }
        .custom-scrollbar::-webkit-scrollbar{width:6px;} .custom-scrollbar::-webkit-scrollbar-track{background:transparent;}
        .custom-scrollbar::-webkit-scrollbar-thumb{background-color:rgba(255,255,255,0.1);border-radius:20px;}
        .custom-scrollbar::-webkit-scrollbar-thumb:hover{background-color:rgba(255,255,255,0.2);}

        /* Video Simulation Styles */
        @keyframes vid-zoom-in { 0% { transform: scale(1); } 100% { transform: scale(1.15); } }
        @keyframes vid-zoom-out { 0% { transform: scale(1.15); } 100% { transform: scale(1); } }
        @keyframes vid-pan-right { 0% { transform: scale(1.1) translateX(-3%); } 100% { transform: scale(1.1) translateX(3%); } }
        @keyframes vid-pan-left { 0% { transform: scale(1.1) translateX(3%); } 100% { transform: scale(1.1) translateX(-3%); } }
        @keyframes vid-dynamic { 0% { transform: scale(1) rotate(0deg); } 100% { transform: scale(1.1) rotate(2deg); } }
        
        .motion-zoom-in { animation: vid-zoom-in 5s ease-in-out infinite alternate; }
        .motion-zoom-out { animation: vid-zoom-out 5s ease-in-out infinite alternate; }
        .motion-pan-right { animation: vid-pan-right 5s ease-in-out infinite alternate; }
        .motion-pan-left { animation: vid-pan-left 5s ease-in-out infinite alternate; }
        .motion-dynamic { animation: vid-dynamic 5s ease-in-out infinite alternate; }

        /* --- New Advanced Cinematic Effects --- */
        @keyframes light-leak-anim {
          0%, 100% { opacity: 0; transform: scale(1) translate(-20%, -20%); }
          50% { opacity: 0.5; transform: scale(1.5) translate(20%, 20%); }
        }
        @keyframes focus-shift {
          0%, 100% { filter: blur(0px); }
          10%, 90% { filter: blur(0px); }
          50% { filter: blur(2.5px); transform: scale(1.05); }
        }
        .film-grain {
          background-image: url('data:image/svg+xml;utf8,%3Csvg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg"%3E%3Cfilter id="noiseFilter"%3E%3CfeTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="3" stitchTiles="stitch"/%3E%3C/filter%3E%3Crect width="100%25" height="100%25" filter="url(%23noiseFilter)"/%3E%3C/svg%3E');
          opacity: 0.15;
          mix-blend-mode: overlay;
          pointer-events: none;
        }
        .light-leak {
          background: radial-gradient(circle, rgba(255,140,100,0.5) 0%, transparent 60%);
          animation: light-leak-anim 4s ease-in-out infinite alternate;
          pointer-events: none;
          mix-blend-mode: screen;
        }
        .cinematic-focus {
          animation: focus-shift 6s ease-in-out infinite;
        }
      `}} />
    </div>
  );
}

export default function App() { return <ErrorBoundary><AppContent /></ErrorBoundary>; }

function NavItem({ icon, label, isActive, onClick, highlight, theme = 'pink' }) {
  const themeConfig = {
    pink: {
      activeIcon: 'text-pink-400 drop-shadow-[0_0_8px_rgba(244,114,182,0.5)]',
      highlightIcon: 'text-pink-500/70',
      badge: 'bg-pink-500/20 text-pink-400 border-pink-500/30',
      dot: 'bg-pink-500 shadow-[0_0_8px_rgba(244,114,182,0.8)]',
      border: 'border-pink-500/30'
    },
    emerald: {
      activeIcon: 'text-emerald-400 drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]',
      highlightIcon: 'text-emerald-500/70',
      badge: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
      dot: 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]',
      border: 'border-emerald-500/30'
    }
  };

  const t = themeConfig[theme] || themeConfig.pink;

  return (
    <button onClick={onClick} className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all duration-300 text-left font-medium ${isActive ? 'bg-white/10 text-white shadow-lg shadow-black/20 border border-white/5 backdrop-blur-md' : 'text-gray-400 hover:bg-white/5 hover:text-gray-200'} ${highlight && !isActive ? `border ${t.border}` : ''}`}>
      <div className={`${isActive ? t.activeIcon : highlight ? t.highlightIcon : ''}`}>{icon}</div>
      <span>{label}</span>
      {highlight && !isActive && <span className={`ml-auto text-[9px] px-2 py-0.5 rounded-full border ${t.badge}`}>NEW</span>}
      {isActive && <div className={`ml-auto w-1.5 h-1.5 rounded-full ${t.dot}`}></div>}
    </button>
  );
}

// ----------------------------------------------------------------------
// Section: Auto Campaign Wizard
// ----------------------------------------------------------------------
function AutoCampaignWizard({ showNotification, apiKey }) {
  const [step, setStep] = useState(1);
  const [refImage, setRefImage] = useState(null);
  const [brief, setBrief] = useState('');
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [processLogs, setProcessLogs] = useState([]);
  
  const [finalData, setFinalData] = useState(null);

  const handleUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) return showNotification('ขนาดไฟล์ต้องไม่เกิน 5MB', 'error');
      const reader = new FileReader();
      reader.onloadend = () => setRefImage(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const addLog = (msg) => setProcessLogs(prev => [...prev, { time: new Date().toLocaleTimeString(), msg }]);

  const runAutomation = async () => {
    if (!apiKey) return showNotification('กรุณาตั้งค่า API Key ด้านบนก่อน', 'error');
    if (!refImage) return showNotification('กรุณาอัปโหลดภาพสินค้า', 'error');
    
    setStep(2);
    setIsProcessing(true);
    setProcessLogs([]);
    setFinalData(null);

    addLog('🚀 เริ่มต้นระบบ Automation...');
    addLog('🧠 AI กำลังวิเคราะห์สินค้าและกลยุทธ์แคมเปญ...');

    try {
      const textUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`;
      const textPrompt = `You are an elite AI Advertising Agency. Automate a full campaign based on this product image and brief: "${brief}".
      Return ONLY a valid JSON object with this exact structure (Use Thai language for content):
      {
        "strategy": {
          "target_audience": "...",
          "core_concept": "...",
          "tone_of_voice": "..."
        },
        "copywriting": {
          "catchy_headline": "...",
          "social_caption": "...",
          "hashtags": "..."
        },
        "storyboard": [
          {"scene": 1, "camera_angle": "...", "visual": "Detailed prompt for image generation...", "audio": "..."}
        ]
      }
      Generate exactly 4 storyboard scenes. visual must be highly detailed.`;

      const textPayload = {
        contents: [{ parts: [
          { text: textPrompt },
          { inlineData: { mimeType: refImage.split(';')[0].split(':')[1], data: refImage.split(',')[1] } }
        ]}]
      };

      const res = await fetchWithRetry(textUrl, { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(textPayload) });
      const text = res.candidates?.[0]?.content?.parts?.[0]?.text;
      
      if (!text) throw new Error('Failed to generate plan');
      
      const cleanJson = text.replace(/```json/g, '').replace(/```/g, '').trim();
      const parsedData = JSON.parse(cleanJson);
      
      addLog('✅ สร้างแผนกลยุทธ์ สคริปต์ และก๊อปปี้สำเร็จ');
      addLog('🎨 กำลังให้ Art Director สร้างภาพ Storyboard ทีละฉาก...');

      const imageUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image-preview:generateContent?key=${apiKey}`;
      
      const scenesWithImages = await Promise.all(parsedData.storyboard.map(async (scene, index) => {
        addLog(`⏳ กำลังเรนเดอร์ภาพฉากที่ ${index + 1}...`);
        const imagePrompt = `Cinematic storyboard frame. Camera: ${scene.camera_angle}. Scene: ${scene.visual}. Professional advertising photography, photorealistic, 8k.`;
        
        try {
          const imgRes = await fetchWithRetry(imageUrl, {
            method: 'POST', headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ 
              contents: [{ parts: [
                { text: imagePrompt },
                { inlineData: { mimeType: refImage.split(';')[0].split(':')[1], data: refImage.split(',')[1] } }
              ]}], 
              generationConfig: { responseModalities: ['IMAGE'] } 
            })
          });
          const base64Output = imgRes.candidates?.[0]?.content?.parts?.find(p => p.inlineData)?.inlineData?.data;
          
          if (base64Output) {
            addLog(`✅ ฉากที่ ${index + 1} เรนเดอร์สำเร็จ`);
            return { ...scene, image: `data:image/png;base64,${base64Output}` };
          }
        } catch (e) {
          addLog(`❌ เกิดข้อผิดพลาดในฉากที่ ${index + 1}`);
        }
        return { ...scene, image: null };
      }));

      parsedData.storyboard = scenesWithImages;
      setFinalData(parsedData);
      
      addLog('🎉 กระบวนการ Automation เสร็จสมบูรณ์!');
      setTimeout(() => setStep(3), 1500); 
      showNotification('สร้างแคมเปญแบบ Automation สำเร็จ!', 'success');

    } catch (error) {
      console.error(error);
      addLog('❌ ระบบขัดข้องระหว่างประมวลผล โปรดลองใหม่');
      showNotification('เกิดข้อผิดพลาด กรุณาลองใหม่', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700 w-full flex flex-col h-full">
      <header className="space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-gradient-to-r from-yellow-500/20 to-pink-500/20 text-yellow-400 rounded-full border border-yellow-500/30 text-sm font-bold mb-4 shadow-[0_0_15px_rgba(234,179,8,0.2)]">
          <Zap size={14} className="animate-pulse" /> AutoMagic Pipeline
        </div>
        <h2 className="text-4xl font-bold text-white">One-Click Automation</h2>
        <p className="text-gray-400 text-lg">รันแคมเปญครบวงจรแบบอัตโนมัติ (ใส่บรีฟ -&gt; คิดกลยุทธ์ -&gt; เขียนบท -&gt; สเก็ตช์ภาพ) จบในปุ่มเดียว</p>
      </header>

      <div className="flex items-center justify-between relative w-full max-w-3xl mx-auto mb-8">
        <div className="absolute top-1/2 left-0 w-full h-1 bg-white/10 -z-10 rounded-full"></div>
        <div className={`absolute top-1/2 left-0 h-1 bg-gradient-to-r from-yellow-500 to-pink-500 -z-10 rounded-full transition-all duration-700`} style={{ width: step === 1 ? '0%' : step === 2 ? '50%' : '100%' }}></div>
        
        {[1, 2, 3].map((s) => (
          <div key={s} className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg transition-all duration-500 shadow-xl ${step >= s ? 'bg-gradient-to-br from-yellow-400 to-pink-500 text-white shadow-pink-500/30' : 'bg-[#15161c] border-2 border-white/20 text-gray-500'}`}>
            {s === 1 ? <Target size={20}/> : s === 2 ? <RefreshCw size={20} className={step === 2 ? 'animate-spin' : ''}/> : <CheckCircle size={20}/>}
          </div>
        ))}
      </div>

      <div className="flex-1 w-full max-w-5xl mx-auto">
        {step === 1 && (
          <div className="bg-[#15161c] p-8 rounded-[2.5rem] border border-white/10 shadow-2xl animate-in zoom-in-95 duration-500">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="flex flex-col gap-4">
                  <h3 className="text-xl font-bold text-white flex items-center gap-2">1. เลือกสินค้าพระเอก</h3>
                  <label className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed border-white/20 rounded-3xl cursor-pointer hover:border-yellow-500/50 hover:bg-yellow-500/5 relative overflow-hidden transition-all bg-black/20 group">
                    {refImage ? (
                      <>
                        <img src={refImage} alt="Ref" className="w-full h-full object-contain p-4"/>
                        <button onClick={(e) => { e.preventDefault(); setRefImage(null); }} className="absolute top-4 right-4 bg-black/50 text-white p-2 rounded-xl hover:bg-red-500/80 transition-colors"><X size={20} /></button>
                      </>
                    ) : (
                      <div className="flex flex-col items-center text-gray-400 group-hover:text-yellow-400 transition-colors">
                        <Upload size={40} className="mb-4 group-hover:-translate-y-2 transition-transform duration-300" />
                        <span className="font-bold text-lg">อัปโหลดภาพสินค้า</span>
                        <span className="text-sm mt-1 opacity-70">JPG, PNG (Max 5MB)</span>
                      </div>
                    )}
                    <input type="file" className="hidden" onChange={handleUpload} accept="image/*"/>
                  </label>
                </div>
                
                <div className="flex flex-col gap-4">
                  <h3 className="text-xl font-bold text-white flex items-center gap-2">2. ความต้องการ (Brief)</h3>
                  <textarea 
                    value={brief} 
                    onChange={(e)=>setBrief(e.target.value)} 
                    placeholder="เช่น อยากได้วิดีโอไวรัล โปรโมทโปร 9.9 ลด 50% เน้นกลุ่มวัยรุ่น ให้ดูสนุกสนาน มีการเต้น..." 
                    className="w-full flex-1 p-6 bg-black/20 text-gray-200 rounded-3xl text-lg border border-white/10 resize-none focus:outline-none focus:border-pink-500/50 focus:ring-1 focus:ring-pink-500/50 custom-scrollbar"
                  />
                </div>
             </div>

             <div className="mt-8 flex justify-end pt-6 border-t border-white/10">
               <button 
                  onClick={runAutomation}
                  disabled={!refImage}
                  className="bg-gradient-to-r from-yellow-500 via-orange-500 to-pink-500 hover:from-yellow-400 hover:to-pink-400 text-white px-10 py-4 rounded-2xl font-black text-xl flex items-center gap-3 shadow-[0_0_30px_rgba(236,72,153,0.3)] transition-all hover:scale-105 disabled:opacity-50 disabled:hover:scale-100 disabled:cursor-not-allowed"
                >
                 เริ่มสร้างแคมเปญอัตโนมัติ <ChevronRight size={24}/>
               </button>
             </div>
          </div>
        )}

        {step === 2 && (
          <div className="bg-[#15161c] p-12 rounded-[2.5rem] border border-white/10 shadow-2xl flex flex-col items-center justify-center min-h-[500px] animate-in fade-in duration-500">
             <div className="relative w-32 h-32 mb-8">
               <div className="absolute inset-0 border-t-4 border-yellow-500 rounded-full animate-spin"></div>
               <div className="absolute inset-2 border-r-4 border-pink-500 rounded-full animate-spin animation-delay-150"></div>
               <div className="absolute inset-4 border-b-4 border-purple-500 rounded-full animate-spin animation-delay-300"></div>
               <div className="absolute inset-0 flex items-center justify-center"><Zap size={40} className="text-yellow-400 animate-pulse"/></div>
             </div>
             <h3 className="text-2xl font-bold text-white mb-6">AI Automated Pipeline Running...</h3>
             
             <div className="w-full max-w-2xl bg-black/50 border border-white/5 rounded-2xl p-6 font-mono text-sm h-64 overflow-y-auto custom-scrollbar flex flex-col gap-2">
               {processLogs.map((log, i) => (
                 <div key={i} className="flex gap-4 animate-in slide-in-from-left-4 duration-300">
                   <span className="text-gray-500 shrink-0">[{log.time}]</span>
                   <span className="text-green-400">{log.msg}</span>
                 </div>
               ))}
               {isProcessing && <div className="flex gap-4 opacity-50 animate-pulse"><span className="text-gray-500">[{new Date().toLocaleTimeString()}]</span><span className="text-yellow-400">Processing...</span></div>}
             </div>
          </div>
        )}

        {step === 3 && finalData && (
          <div className="space-y-6 animate-in slide-in-from-bottom-12 duration-1000">
             
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <div className="bg-gradient-to-br from-blue-900/40 to-purple-900/40 p-6 rounded-[2rem] border border-blue-500/20 shadow-xl">
                 <h4 className="text-lg font-bold text-blue-300 mb-4 flex items-center gap-2"><Target size={20}/> กลยุทธ์แคมเปญ (Strategy)</h4>
                 <div className="space-y-3">
                   <div className="bg-black/40 p-3 rounded-xl"><span className="text-xs text-blue-400/70 block">กลุ่มเป้าหมาย:</span><p className="text-sm text-gray-200">{finalData.strategy.target_audience}</p></div>
                   <div className="bg-black/40 p-3 rounded-xl"><span className="text-xs text-blue-400/70 block">คอนเซปต์หลัก:</span><p className="text-sm text-gray-200">{finalData.strategy.core_concept}</p></div>
                   <div className="bg-black/40 p-3 rounded-xl"><span className="text-xs text-blue-400/70 block">โทนการสื่อสาร:</span><p className="text-sm text-gray-200">{finalData.strategy.tone_of_voice}</p></div>
                 </div>
               </div>

               <div className="bg-gradient-to-br from-pink-900/40 to-orange-900/40 p-6 rounded-[2rem] border border-pink-500/20 shadow-xl flex flex-col">
                 <div className="flex justify-between items-center mb-4">
                   <h4 className="text-lg font-bold text-pink-300 flex items-center gap-2"><PenTool size={20}/> ก๊อปปี้โฆษณา (Copywriting)</h4>
                   <button onClick={() => { navigator.clipboard.writeText(`${finalData.copywriting.catchy_headline}\n\n${finalData.copywriting.social_caption}\n\n${finalData.copywriting.hashtags}`); showNotification('คัดลอกข้อความแล้ว'); }} className="text-xs bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg flex items-center gap-1 transition-colors"><Copy size={12}/> คัดลอก</button>
                 </div>
                 <div className="space-y-3 flex-1 flex flex-col">
                   <div className="bg-black/40 p-4 rounded-xl border-l-4 border-pink-500"><h5 className="text-xl font-black text-white">{finalData.copywriting.catchy_headline}</h5></div>
                   <div className="bg-black/40 p-4 rounded-xl flex-1"><p className="text-sm text-gray-300 whitespace-pre-wrap">{finalData.copywriting.social_caption}</p></div>
                   <div className="bg-black/40 p-3 rounded-xl"><p className="text-xs text-pink-400 font-medium">{finalData.copywriting.hashtags}</p></div>
                 </div>
               </div>
             </div>

             <div className="bg-[#15161c] p-8 rounded-[2.5rem] border border-white/10 shadow-2xl">
               <h4 className="text-2xl font-bold text-white mb-6 flex items-center gap-2"><Film className="text-yellow-400"/> สตอรี่บอร์ดวิดีโอ (Auto-Generated Storyboard)</h4>
               
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                 {finalData.storyboard.map((scene, i) => (
                   <div key={i} className="bg-black/50 rounded-2xl border border-white/5 overflow-hidden flex flex-col group">
                     <div className="aspect-video w-full relative bg-gray-900 flex items-center justify-center">
                       {scene.image ? (
                         <>
                           <img src={scene.image} alt={`s${i}`} className="w-full h-full object-cover"/>
                           <a href={scene.image} download={`auto-scene-${i+1}.png`} className="absolute top-2 right-2 bg-black/60 p-1.5 rounded-lg text-white opacity-0 group-hover:opacity-100 transition-opacity"><Download size={14}/></a>
                         </>
                       ) : (
                         <ImageIcon size={32} className="text-gray-700"/>
                       )}
                       <div className="absolute bottom-2 left-2 bg-black/80 px-2 py-0.5 rounded text-[10px] font-bold text-yellow-400">SCENE {scene.scene}</div>
                     </div>
                     <div className="p-4 flex-1 flex flex-col gap-2">
                       <span className="text-[10px] bg-white/10 w-fit px-2 py-0.5 rounded text-gray-300 font-mono"><Video size={10} className="inline mr-1"/>{scene.camera_angle}</span>
                       <p className="text-xs text-gray-400 line-clamp-3" title={scene.visual}>{scene.visual}</p>
                       <div className="mt-auto pt-2 border-t border-white/5">
                         <p className="text-[10px] text-gray-500 italic">" {scene.audio} "</p>
                       </div>
                     </div>
                   </div>
                 ))}
               </div>
             </div>

             <div className="flex justify-center pt-4">
               <button onClick={() => setStep(1)} className="text-gray-400 hover:text-white flex items-center gap-2 font-medium transition-colors">
                 <RefreshCw size={16}/> เริ่มสร้างแคมเปญใหม่
               </button>
             </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ----------------------------------------------------------------------
// Section: Storyboard Studio
// ----------------------------------------------------------------------
function StoryboardStudio({ showNotification, user, authError, apiKey }) {
  const [brief, setBrief] = useState('');
  const [refImage, setRefImage] = useState(null);
  const [isGeneratingScript, setIsGeneratingScript] = useState(false);
  const [scenes, setScenes] = useState([]);
  
  const [isAnalyzingImage, setIsAnalyzingImage] = useState(false);
  const [dynamicPlots, setDynamicPlots] = useState([]);

  const [isSaving, setIsSaving] = useState(false);
  const [savedStoryboards, setSavedStoryboards] = useState([]);
  const [isLoadingSaved, setIsLoadingSaved] = useState(false);

  useEffect(() => {
    if (user && !authError) fetchSavedStoryboards();
  }, [user, authError]);

  const fetchSavedStoryboards = async () => {
    setIsLoadingSaved(true);
    try {
      const q = query(collection(db, 'artifacts', appId, 'public', 'data', 'storyboards'), orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      const boards = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setSavedStoryboards(boards);
    } catch (error) {
      console.error("Error fetching storyboards:", error);
    } finally {
      setIsLoadingSaved(false);
    }
  };

  const handleSaveStoryboard = async () => {
    if (!user || authError) return showNotification('กรุณาเข้าสู่ระบบก่อนบันทึก (Authentication Required)', 'error');
    if (scenes.length === 0) return showNotification('ไม่พบฉากที่สามารถบันทึกได้ โปรดสร้าง Storyboard ก่อน', 'error');
    
    setIsSaving(true);
    try {
      const compressedRefImage = await compressImage(refImage, 600, 0.6);
      const compressedScenes = await Promise.all(scenes.map(async (scene) => {
          return {
              ...scene,
              image: await compressImage(scene.image, 600, 0.6)
          };
      }));

      await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'storyboards'), {
        brief,
        refImage: compressedRefImage, 
        scenes: compressedScenes,
        createdAt: serverTimestamp()
      });
      showNotification('บันทึก Storyboard ลง Cloud สำเร็จ!', 'success');
      fetchSavedStoryboards(); 
    } catch (error) {
      console.error("Save Storyboard Error:", error);
      if (error.code === 'resource-exhausted' || (error.message && error.message.includes('longer than'))) {
        showNotification('ไม่สามารถบันทึกได้: ไฟล์มีขนาดใหญ่เกินข้อจำกัดของฐานข้อมูล (1MB)', 'error');
      } else {
        showNotification('เกิดข้อผิดพลาดในการบันทึกข้อมูล', 'error');
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteStoryboard = async (id) => {
    try {
      await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'storyboards', id));
      setSavedStoryboards(prev => prev.filter(b => b.id !== id));
      showNotification('ลบ Storyboard สำเร็จ', 'success');
    } catch (error) {
      showNotification('ไม่สามารถลบข้อมูลได้', 'error');
    }
  };

  const handleLoadStoryboard = (board) => {
    setBrief(board.brief || '');
    setRefImage(board.refImage || null);
    setScenes(board.scenes || []);
    showNotification('โหลด Storyboard สำเร็จ!');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  useEffect(() => {
    setDynamicPlots([]);
  }, [refImage]);

  const handleUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) return showNotification('ขนาดไฟล์ต้องไม่เกิน 5MB', 'error');
      const reader = new FileReader();
      reader.onloadend = () => setRefImage(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleAutoAnalyzeImage = async () => {
    if (!apiKey) return showNotification('กรุณาตั้งค่า API Key ด้านบนก่อน', 'error');
    if (!refImage) return showNotification('กรุณาอัปโหลดภาพสินค้าก่อนเพื่อให้ AI วิเคราะห์', 'error');
    setIsAnalyzingImage(true);
    setDynamicPlots([]);

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
    const promptText = `ในฐานะ Executive Creative Director ระดับโลก:
    1. วิเคราะห์ภาพสินค้าที่แนบมานี้ ว่าคืออะไร มีจุดเด่น วัสดุ หรือฟังก์ชันอะไรที่น่าสนใจ
    2. คิดไอเดียพล็อตเรื่องสำหรับถ่ายวิดีโอโฆษณาสั้น (15-30 วินาที) 3 สไตล์ที่แตกต่างกัน (เช่น ตลกไวรัล, หรูหราพรีเมียม, ซึ้งกินใจ หรือ เล่าสรรพคุณสุดล้ำ) ที่ใช้สินค้านี้เป็นตัวเอก
    3. ส่งผลลัพธ์กลับมาเป็น JSON Array ของ String 3 ข้อเท่านั้น ห้ามพิมพ์ข้อความอื่นอธิบาย
    ตัวอย่าง: ["สไตล์ตลกไวรัล: ชายหนุ่มกำลังวิ่งหนีซอมบี้แบบสุดชีวิต แต่แวะหยิบสินค้านี้ขึ้นมาใช้ ทำให้...", "สไตล์หรูหรา: นางแบบเดินเฉิดฉายในงานกาล่า ทุกสายตาจับจ้องไปที่..."]`;

    const parts = [
      { text: promptText },
      { inlineData: { mimeType: refImage.split(';')[0].split(':')[1], data: refImage.split(',')[1] } }
    ];

    try {
      const res = await fetchWithRetry(url, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts }] })
      });
      const text = res.candidates?.[0]?.content?.parts?.[0]?.text;
      if (text) {
        const jsonMatch = text.match(/\[([\s\S]*?)\]/);
        if (jsonMatch) {
          setDynamicPlots(JSON.parse(jsonMatch[0]));
          showNotification('AI วิเคราะห์ภาพและคิดพล็อตสำเร็จ!', 'success');
        } else {
          throw new Error('Format error');
        }
      }
    } catch (error) {
      console.error(error);
      showNotification('เกิดข้อผิดพลาดในการให้ AI คิดพล็อต', 'error');
    } finally {
      setIsAnalyzingImage(false);
    }
  };

  const handleGenerateScript = async () => {
    if (!apiKey) return showNotification('กรุณาตั้งค่า API Key ด้านบนก่อน', 'error');
    if (!brief.trim() && !refImage) return showNotification('กรุณาใส่บรีฟหรืออัปโหลดภาพสินค้า', 'error');
    setIsGeneratingScript(true);
    setScenes([]);

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`;
    const promptText = `คุณคือ Full Creative Team ระดับโลก (ประกอบด้วย Executive Creative Director, Film Director, Art Director และ Copywriter)
    หน้าที่ของคุณคือสร้าง Storyboard ขั้นเทพสำหรับวิดีโอโฆษณา ความยาว 15-30 วินาที (แบ่งเป็น 4 ถึง 6 ฉาก)
    
    ข้อมูลสำหรับการสร้าง:
    - ภาพอ้างอิง: (จงวิเคราะห์จากภาพที่แนบมา และต้องใช้สินค้านี้เป็นพระเอกในเรื่องอย่างโดดเด่น)
    - บรีฟ/พล็อตเรื่อง: "${brief}"

    คำสั่งพิเศษจากทีมผู้กำกับ:
    1. ทุกฉากต้องมีความเชื่อมโยงกันอย่างสมูท (Cinematic Transitions)
    2. ต้องมีฉากที่เน้นให้เห็น 'สินค้าในภาพอ้างอิง' อย่างชัดเจน (Product Shot / In-use Shot)
    3. "visual" ต้องบรรยายภาพละเอียดแบบ Art Director สั่งงาน (ระบุโทนแสง, สี, สถานที่, อารมณ์ตัวละคร, และตำแหน่งของสินค้า)
    4. "camera_angle" ต้องใช้ศัพท์เทคนิคภาพยนตร์ที่ดูโปร (เช่น Extreme Close Up, Dutch Angle, Tracking Shot, Over the Shoulder)

    ให้ตอบกลับมาเป็น JSON Array เท่านั้น โครงสร้างดังนี้:
    [
      {
        "scene_number": 1,
        "time": "0:00 - 0:05",
        "camera_angle": "ระบุมุมกล้อง",
        "visual": "คำบรรยายภาพในฉากอย่างละเอียดสุดๆ...",
        "audio": "เสียงพากย์ เสียงประกอบ ซาวด์เอฟเฟกต์"
      }
    ]
    *ห้ามพิมพ์ข้อความอื่นนอกจาก JSON`;

    const parts = [{ text: promptText }];
    if (refImage) {
      parts.push({ inlineData: { mimeType: refImage.split(';')[0].split(':')[1], data: refImage.split(',')[1] } });
    }

    try {
      const res = await fetchWithRetry(url, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts }] })
      });
      const text = res.candidates?.[0]?.content?.parts?.[0]?.text;
      if (text) {
        const jsonMatch = text.match(/\[\s*\{[\s\S]*\}\s*\]/);
        if (jsonMatch) {
          const parsedScenes = JSON.parse(jsonMatch[0]);
          const initializedScenes = parsedScenes.map(s => ({ 
            ...s, 
            image: null, 
            isGeneratingImage: false,
            isVideoGenerated: false,
            isGeneratingVideo: false,
            isVideoPlaying: false,
            motion: 'dynamic' 
          }));
          setScenes(initializedScenes);
          showNotification('ผู้กำกับและทีม Creative สร้างบอร์ดสำเร็จ!');
        } else {
          throw new Error('Invalid JSON format');
        }
      }
    } catch (error) {
      console.error(error);
      showNotification('เกิดข้อผิดพลาดในการสร้างบท ลองใหม่อีกครั้ง', 'error');
    } finally {
      setIsGeneratingScript(false);
    }
  };

  const handleGenerateSceneImage = async (index, sceneData) => {
    if (!apiKey) return showNotification('กรุณาตั้งค่า API Key ด้านบนก่อน', 'error');
    setScenes(prev => prev.map((s, i) => i === index ? { ...s, isGeneratingImage: true } : s));

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image-preview:generateContent?key=${apiKey}`;
    const imagePrompt = `A highly detailed, professional cinematic storyboard sketch / film frame for a commercial video. 
    Camera Angle: ${sceneData.camera_angle}. 
    Scene Description: ${sceneData.visual}. 
    Style: Photorealistic, cinematic lighting, movie scene, 8k resolution.`;

    const parts = [{ text: imagePrompt }];
    if (refImage) {
      parts.push({ inlineData: { mimeType: refImage.split(';')[0].split(':')[1], data: refImage.split(',')[1] } });
    }

    try {
      const res = await fetchWithRetry(url, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts }], generationConfig: { responseModalities: ['IMAGE'] } })
      });
      const base64Output = res.candidates?.[0]?.content?.parts?.find(p => p.inlineData)?.inlineData?.data;
      
      if (base64Output) {
        setScenes(prev => prev.map((s, i) => i === index ? { ...s, image: `data:image/png;base64,${base64Output}`, isGeneratingImage: false } : s));
        showNotification(`สร้างภาพฉากที่ ${sceneData.scene_number} สำเร็จ!`);
      } else {
        throw new Error('No image returned');
      }
    } catch (error) {
      showNotification(`เกิดข้อผิดพลาดในการสร้างภาพฉาก ${sceneData.scene_number}`, 'error');
      setScenes(prev => prev.map((s, i) => i === index ? { ...s, isGeneratingImage: false } : s));
    }
  };

  const handleGenerateSceneVideo = (index, sceneData) => {
    setScenes(prev => prev.map((s, i) => i === index ? { ...s, isGeneratingVideo: true } : s));
    
    setTimeout(() => {
      const motions = ['zoom-in', 'zoom-out', 'pan-right', 'pan-left', 'dynamic'];
      const randomMotion = motions[Math.floor(Math.random() * motions.length)]; 
      
      setScenes(prev => prev.map((s, i) => i === index ? { 
        ...s, 
        isGeneratingVideo: false, 
        isVideoGenerated: true, 
        isVideoPlaying: true,
        motion: randomMotion
      } : s));
      showNotification(`เรนเดอร์วิดีโอฉากที่ ${index + 1} (ตาม Visual Prompt) พร้อมแล้ว!`);
    }, 4500); 
  };

  const toggleSceneVideoPlay = (index) => {
    setScenes(prev => prev.map((s, i) => i === index ? { ...s, isVideoPlaying: !s.isVideoPlaying } : s));
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700 w-full">
      <header className="space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-500/10 text-indigo-400 rounded-full border border-indigo-500/20 text-sm font-medium mb-4">
          <Film size={14} /> Full Creative Team AI
        </div>
        <h2 className="text-4xl font-bold text-white">Storyboard Studio</h2>
        <p className="text-gray-400 text-lg">สวมบทผู้กำกับระดับโลก: อัปโหลดภาพสินค้าให้ AI อัจฉริยะวิเคราะห์และคิดพล็อตเรื่องให้ พร้อมเขียนบทและวาด Storyboard แบบครบวงจร</p>
      </header>

      <div className="bg-[#15161c] p-6 rounded-[2rem] border border-white/5 shadow-2xl flex flex-col gap-6 relative group">
        <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-[2rem] blur opacity-20 group-hover:opacity-40 transition duration-500 pointer-events-none"></div>
        
        <div className="flex flex-col md:flex-row gap-6 relative z-10 w-full">
          <div className="w-full md:w-1/3 flex flex-col gap-3">
             <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-white/20 rounded-2xl cursor-pointer hover:bg-white/5 relative overflow-hidden transition-all bg-black/20 group/upload">
              {refImage ? (
                <>
                  <img src={refImage} alt="Ref" className="w-full h-full object-contain p-2"/>
                  <button onClick={(e) => { e.preventDefault(); setRefImage(null); }} className="absolute top-2 right-2 bg-black/50 text-white p-2 rounded-xl hover:bg-red-500/80 transition-colors z-20"><X size={16} /></button>
                  <div className="absolute bottom-2 left-2 right-2 z-20">
                    <button 
                      onClick={(e) => { e.preventDefault(); handleAutoAnalyzeImage(); }}
                      disabled={isAnalyzingImage}
                      className="w-full bg-indigo-500/90 hover:bg-indigo-500 text-white text-xs font-bold py-2.5 px-3 rounded-xl backdrop-blur-md transition-colors shadow-lg shadow-indigo-500/20 flex justify-center items-center gap-1.5"
                    >
                      {isAnalyzingImage ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                      {isAnalyzingImage ? 'กำลังวิเคราะห์สินค้า...' : '🪄 ให้ AI คิดพล็อตจากภาพนี้'}
                    </button>
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center text-gray-400 group-hover/upload:text-white transition-colors">
                  <Upload size={32} className="mb-3 group-hover/upload:-translate-y-1 transition-transform" />
                  <span className="font-semibold">อัปโหลดภาพสินค้า</span>
                  <span className="text-xs text-indigo-400 mt-1 font-medium">(เพื่อใช้เป็นพระเอกในวิดีโอ)</span>
                </div>
              )}
              <input type="file" className="hidden" onChange={handleUpload} accept="image/*"/>
            </label>
          </div>
          
          <div className="flex-1 flex flex-col gap-3">
            <textarea 
              value={brief} 
              onChange={(e)=>setBrief(e.target.value)} 
              placeholder="พิมพ์บรีฟวิดีโอที่ต้องการ เช่น: คลิป TikTok ไวรัลโปรโมทสินค้า แนวตลกขบขัน มีคนกำลังวิ่งหนีซอมบี้... (หรือกดปุ่ม 'ให้ AI คิดพล็อตจากภาพ' ทางซ้าย)" 
              className="w-full flex-1 min-h-[100px] p-5 bg-white/5 text-gray-200 rounded-2xl text-lg border border-white/5 resize-none focus:outline-none focus:ring-1 focus:ring-indigo-500/50 custom-scrollbar"
            />

            {dynamicPlots.length > 0 && (
               <div className="flex flex-col gap-2 animate-in fade-in slide-in-from-top-2">
                 <span className="text-xs text-indigo-400 font-bold flex items-center gap-1"><Lightbulb size={12}/> ไอเดียพล็อตจากทีม Creative:</span>
                 <div className="flex flex-col gap-2">
                   {dynamicPlots.map((plot, idx) => (
                     <button 
                       key={idx}
                       onClick={() => setBrief(plot)}
                       className="text-sm px-4 py-3 bg-indigo-500/10 hover:bg-indigo-500/30 text-indigo-200 border border-indigo-500/20 rounded-xl transition-colors text-left flex items-start gap-2"
                     >
                       <span className="text-indigo-400 mt-0.5">🎬</span> <span className="leading-relaxed">{plot}</span>
                     </button>
                   ))}
                 </div>
               </div>
            )}

            <button 
              onClick={handleGenerateScript} 
              disabled={isGeneratingScript || (!brief && !refImage)} 
              className="w-full mt-auto bg-gradient-to-r from-indigo-600 to-purple-500 hover:from-indigo-500 hover:to-purple-400 text-white py-4 rounded-xl font-bold flex justify-center items-center gap-2 shadow-lg shadow-indigo-500/20 disabled:opacity-50 transition-all text-lg"
            >
              {isGeneratingScript ? <Loader2 className="animate-spin"/> : <Clapperboard />} 
              {isGeneratingScript ? 'ทีมผู้กำกับกำลังประพันธ์บทและแบ่งฉาก...' : 'Generate Storyboard Script'}
            </button>
          </div>
        </div>
      </div>

      {scenes.length > 0 && (
        <div className="space-y-6 mt-8 animate-in slide-in-from-bottom-8 duration-700">
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <h3 className="text-2xl font-bold text-white flex items-center gap-2"><PlayCircle className="text-indigo-400" /> Storyboard Scenes</h3>
            <span className="bg-indigo-500/20 text-indigo-300 text-xs font-bold px-3 py-1 rounded-full border border-indigo-500/30">Total: {scenes.length} Scenes</span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {scenes.map((scene, index) => (
              <div key={index} className="bg-[#1a1b23] rounded-3xl border border-white/5 shadow-2xl overflow-hidden flex flex-col group">
                <div className="aspect-video w-full bg-black/50 border-b border-white/5 relative flex items-center justify-center overflow-hidden">
                  {scene.image ? (
                    scene.isVideoGenerated ? (
                      <div className="relative w-full h-full bg-black overflow-hidden group/vid">
                        <div className="w-full h-full relative overflow-hidden">
                          <div 
                             className={`w-full h-full bg-cover bg-center transition-all ${scene.isVideoPlaying ? `motion-${scene.motion} cinematic-focus` : ''}`}
                             style={{ 
                               backgroundImage: `url(${scene.image})`,
                               animationPlayState: scene.isVideoPlaying ? 'running' : 'paused'
                             }}
                          />
                          
                          {scene.isVideoPlaying && <div className="absolute inset-0 film-grain z-0"></div>}
                          {scene.isVideoPlaying && <div className="absolute -inset-10 light-leak z-0"></div>}

                          <div className="absolute inset-0 bg-black/10 pointer-events-none z-0"></div>
                          <div className="absolute bottom-0 left-0 w-full h-1/2 bg-gradient-to-t from-black/80 to-transparent pointer-events-none z-0"></div>
                        </div>
                        
                        <div className="absolute inset-0 flex flex-col justify-between opacity-0 group-hover/vid:opacity-100 transition-opacity duration-300 z-10">
                          <div className="p-3 flex justify-between items-start gap-2">
                             <span className="bg-black/50 backdrop-blur-md text-[10px] text-indigo-300 font-mono px-3 py-1.5 rounded-lg border border-indigo-500/30 line-clamp-2 shadow-lg w-3/4">
                               🪄 Prompt: {scene.visual}
                             </span>
                            <button onClick={() => showNotification('ดาวน์โหลดไฟล์ MP4 (Simulation Only) สำเร็จ')} className="p-2 bg-black/60 hover:bg-indigo-500 text-white rounded-lg backdrop-blur-md transition-colors shrink-0 border border-white/10"><Download size={16}/></button>
                          </div>
                          
                          <div className="p-4 flex flex-col items-center gap-3">
                            <button 
                              onClick={() => toggleSceneVideoPlay(index)} 
                              className="w-12 h-12 bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 rounded-full flex items-center justify-center text-white transition-transform hover:scale-110"
                            >
                              {scene.isVideoPlaying ? <Pause size={20} className="fill-white"/> : <Play size={20} className="fill-white ml-1"/>}
                            </button>
                            <div className="w-full flex items-center gap-2">
                              <span className="text-[10px] font-mono text-white/80">0:00</span>
                              <div className="flex-1 h-1 bg-white/20 rounded-full overflow-hidden relative">
                                <div className="absolute top-0 left-0 h-full bg-indigo-500 w-1/3"></div>
                              </div>
                              <span className="text-[10px] font-mono text-white/80">0:05</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : scene.isGeneratingVideo ? (
                      <div className="flex flex-col items-center justify-center p-6 text-center h-full w-full bg-black/80 backdrop-blur-md absolute inset-0 z-10">
                         <div className="relative w-12 h-12 mb-3">
                           <div className="absolute inset-0 border-t-2 border-indigo-500 rounded-full animate-spin"></div>
                           <div className="absolute inset-0 flex items-center justify-center text-indigo-400"><Video size={16} className="animate-pulse"/></div>
                         </div>
                         <p className="text-xs font-bold text-indigo-300">Rendering Video Elements...</p>
                         <p className="text-[10px] text-gray-400 mt-2 px-4 line-clamp-2 italic text-center w-3/4">"{scene.visual}"</p>
                      </div>
                    ) : (
                      <>
                        <img src={scene.image} alt={`Scene ${scene.scene_number}`} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center backdrop-blur-sm gap-3 z-10">
                           <button onClick={() => handleGenerateSceneVideo(index, scene)} className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white py-2 px-5 rounded-xl font-bold flex items-center gap-2 text-sm shadow-xl shadow-indigo-500/20 transition-all hover:scale-105">
                             <Video size={16} /> สร้างวิดีโอฉากนี้ (Animate)
                           </button>
                           <a href={scene.image} download={`scene-${scene.scene_number}.png`} className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl backdrop-blur-md transition-colors text-xs font-medium"><Download size={14}/> ดาวน์โหลดภาพร่าง</a>
                        </div>
                      </>
                    )
                  ) : (
                    <div className="flex flex-col items-center justify-center p-6 text-center h-full w-full bg-gradient-to-br from-white/5 to-transparent">
                      <ImageIcon size={48} className="text-gray-600 mb-4" />
                      <button 
                        onClick={() => handleGenerateSceneImage(index, scene)}
                        disabled={scene.isGeneratingImage}
                        className="bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-400 border border-indigo-500/30 py-2 px-6 rounded-xl text-sm font-bold flex items-center gap-2 transition-colors disabled:opacity-50"
                      >
                        {scene.isGeneratingImage ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                        {scene.isGeneratingImage ? 'กำลังวาดภาพฉากนี้...' : 'ให้ AI เจนภาพฉากนี้'}
                      </button>
                    </div>
                  )}
                  <div className="absolute top-2 left-2 bg-black/80 text-white text-xs font-black px-3 py-1.5 rounded-lg border border-white/10 shadow-lg backdrop-blur-sm z-20 flex items-center gap-2">
                    SCENE {scene.scene_number}
                    {scene.isVideoGenerated && <span className="bg-red-500 w-2 h-2 rounded-full animate-pulse ml-1" title="Video Mode Active"></span>}
                  </div>
                </div>

                <div className="p-6 flex-1 flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-indigo-400 font-mono text-sm font-semibold bg-indigo-500/10 px-3 py-1 rounded-lg border border-indigo-500/20">
                      <Video size={14} /> {scene.camera_angle}
                    </div>
                    <span className="text-xs text-gray-500 font-mono font-medium tracking-wider">⏱ {scene.time}</span>
                  </div>

                  <div className="space-y-3 flex-1">
                    <div className="bg-black/30 p-4 rounded-xl border border-white/5 h-full">
                      <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider block mb-1">👁️ Visual (ภาพในหน้าจอ)</span>
                      <p className="text-sm text-gray-300 leading-relaxed">{scene.visual}</p>
                    </div>
                  </div>

                  <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                    <span className="text-[10px] text-indigo-400/70 font-bold uppercase tracking-wider block mb-1">🔊 Audio (เสียงพากย์/ซาวด์)</span>
                    <p className="text-sm text-gray-200 italic">"{scene.audio}"</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-end pt-6 border-t border-white/10 mt-6">
            <button 
              onClick={handleSaveStoryboard}
              disabled={isSaving}
              className="bg-indigo-600/90 hover:bg-indigo-500 text-white py-3 px-8 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-indigo-500/20 disabled:opacity-50 transition-all border border-indigo-400/30"
            >
              {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
              {isSaving ? 'กำลังจัดเก็บข้อมูล...' : '💾 บันทึก Storyboard ชุดนี้'}
            </button>
          </div>
        </div>
      )}

      <div className="mt-16 w-full pt-8 border-t border-white/5">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold text-gray-200 flex items-center gap-2"><Database size={20} className="text-indigo-400" /> Saved Storyboards Library</h3>
          {isLoadingSaved && <Loader2 size={20} className="animate-spin text-gray-500" />}
        </div>

        {authError === 'auth/configuration-not-found' ? (
          <div className="text-center py-8 bg-red-500/10 border border-red-500/20 rounded-[2rem] text-red-400 text-sm">ไม่สามารถเชื่อมต่อ Cloud ได้ (Authentication Error) โปรดตั้งค่า Firebase</div>
        ) : savedStoryboards.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 w-full">
            {savedStoryboards.map((board) => (
              <div key={board.id} className="bg-[#15161c] border border-white/10 rounded-[2rem] p-6 shadow-xl flex flex-col group relative hover:border-indigo-500/30 transition-colors">
                <div className="flex justify-between items-start mb-4 border-b border-white/5 pb-4">
                  <div className="flex items-center gap-3">
                    {board.refImage ? (
                      <img src={board.refImage} alt="ref" className="w-12 h-12 rounded-xl object-cover border border-white/10" />
                    ) : (
                      <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400"><Film size={20}/></div>
                    )}
                    <div>
                      <div className="text-xs text-gray-400 font-mono mb-1">Total: {board.scenes?.length || 0} Scenes</div>
                      <div className="text-xs text-gray-200 line-clamp-1 flex-1 max-w-[150px] font-medium">{board.brief || 'ไม่มีบรีฟ'}</div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => handleLoadStoryboard(board)} title="โหลดข้อมูลชุดนี้" className="p-2 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 rounded-lg transition-colors"><FolderOpen size={16}/></button>
                    <button onClick={() => handleDeleteStoryboard(board.id)} title="ลบข้อมูล" className="p-2 bg-white/5 hover:bg-red-500/20 text-gray-500 hover:text-red-400 rounded-lg transition-colors"><Trash2 size={16}/></button>
                  </div>
                </div>
                
                <div className="flex gap-2 overflow-x-auto custom-scrollbar pb-2">
                  {board.scenes?.map((s, i) => (
                     <div key={i} className="w-16 h-12 shrink-0 rounded-lg bg-black/50 border border-white/10 overflow-hidden relative flex items-center justify-center">
                        {s.image ? <img src={s.image} className="w-full h-full object-cover opacity-70" alt={`s${i}`} /> : <ImageIcon size={12} className="text-gray-600"/>}
                        <span className="absolute bottom-0 right-0 bg-black/80 text-[8px] px-1 text-white font-mono">{i+1}</span>
                     </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          !isLoadingSaved && (
            <div className="text-center py-12 bg-[#15161c] border border-white/5 rounded-[2rem] text-gray-500 w-full">
              <FolderOpen size={48} className="mx-auto mb-4 text-indigo-500/40" />
              <p className="font-medium text-gray-400">ยังไม่มี Storyboard ที่บันทึกไว้</p>
              <p className="text-sm mt-1">เริ่มสร้างผลงานและกดบันทึกเพื่อเก็บเข้าคลัง</p>
            </div>
          )
        )}
      </div>
    </div>
  );
}

// ----------------------------------------------------------------------
// Section: Profit & Cost Calculator
// ----------------------------------------------------------------------
function ProfitCenter({ showNotification, user, authError, apiKey }) {
  const [productName, setProductName] = useState('');
  const [sellPrice, setSellPrice] = useState('');
  const [baseCost, setBaseCost] = useState('');
  const [shippingCost, setShippingCost] = useState('');
  const [platformFeePct, setPlatformFeePct] = useState('10'); 
  const [paymentFeePct, setPaymentFeePct] = useState('3'); 
  const [vatPct, setVatPct] = useState('0'); // Added VAT percentage
  const [adCost, setAdCost] = useState('');

  const [isSaving, setIsSaving] = useState(false);
  const [savedProfits, setSavedProfits] = useState([]);
  const [isLoadingSaved, setIsLoadingSaved] = useState(false);

  // --- New States for AI Pricing Strategist ---
  const [aiStrategy, setAiStrategy] = useState('balanced');
  const [isAnalyzingPrice, setIsAnalyzingPrice] = useState(false);
  const [aiPricingResult, setAiPricingResult] = useState(null);

  const price = parseFloat(sellPrice) || 0;
  const cost = parseFloat(baseCost) || 0;
  const ship = parseFloat(shippingCost) || 0;
  
  const basePlatformFee = price * ((parseFloat(platformFeePct) || 0) / 100);
  const basePaymentFee = price * ((parseFloat(paymentFeePct) || 0) / 100);
  const baseTotalFees = basePlatformFee + basePaymentFee;
  
  // VAT คำนวณจาก "ค่าธรรมเนียมแพลตฟอร์ม"
  const vatAmount = baseTotalFees * ((parseFloat(vatPct) || 0) / 100); 
  
  const ads = parseFloat(adCost) || 0;

  const totalFees = baseTotalFees + vatAmount; // รวมค่าธรรมเนียมและ VAT
  const totalCost = cost + ship + totalFees + ads;
  const netProfit = price - totalCost;
  const profitMargin = price > 0 ? (netProfit / price) * 100 : 0;
  const isLoss = netProfit < 0;

  useEffect(() => {
    if (user && !authError) fetchSavedProfits();
  }, [user, authError]);

  const fetchSavedProfits = async () => {
    setIsLoadingSaved(true);
    try {
      const q = query(collection(db, 'artifacts', appId, 'public', 'data', 'profits'), orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      const records = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setSavedProfits(records);
    } catch (error) {
      console.error("Error fetching profits:", error);
    } finally {
      setIsLoadingSaved(false);
    }
  };

  const handleSaveCalculation = async () => {
    if (!user || authError) return showNotification('กรุณาเข้าสู่ระบบก่อนบันทึก', 'error');
    if (!productName.trim() || price <= 0) return showNotification('กรุณาระบุชื่อสินค้าและราคาขาย', 'error');
    
    setIsSaving(true);
    try {
      await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'profits'), {
        productName,
        sellPrice: price,
        baseCost: cost,
        shippingCost: ship,
        platformFeePct: parseFloat(platformFeePct) || 0,
        paymentFeePct: parseFloat(paymentFeePct) || 0,
        vatPct: parseFloat(vatPct) || 0,
        adCost: ads,
        totalFees,
        totalCost,
        netProfit,
        profitMargin,
        createdAt: serverTimestamp()
      });
      showNotification('บันทึกโครงสร้างราคาสำเร็จ!', 'success');
      fetchSavedProfits();
      setProductName(''); 
    } catch (error) {
      showNotification('เกิดข้อผิดพลาดในการบันทึกข้อมูล', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'profits', id));
      setSavedProfits(prev => prev.filter(p => p.id !== id));
      showNotification('ลบข้อมูลสำเร็จ');
    } catch (error) {
      showNotification('ไม่สามารถลบข้อมูลได้', 'error');
    }
  };

  const handleAnalyzePrice = async () => {
    if (!apiKey) return showNotification('กรุณาตั้งค่า API Key ด้านบนก่อน', 'error');
    if (!baseCost) return showNotification('กรุณาระบุ "ต้นทุนสินค้า" ก่อนให้ AI วิเคราะห์', 'error');
    
    setIsAnalyzingPrice(true);
    setAiPricingResult(null);

    const strategyMap = {
      'penetration': 'เจาะตลาด (Market Penetration) - เน้นราคาดึงดูดใจ เข้าถึงง่าย คู่แข่งสู้ยาก อาศัยจำนวน Volume เพื่อเอากำไร',
      'balanced': 'สมดุล (Balanced) - ราคาสมเหตุสมผล ไม่ถูกหรือแพงเกินไป ได้กำไรคุ้มค่าเหนื่อยและครอบคลุมค่าแอด',
      'premium': 'พรีเมียม (Premium) - วางตำแหน่งสินค้าเป็นของพรีเมียม สร้างมูลค่าแบรนด์ ตั้งราคาสูงเพื่อเน้นกำไรต่อชิ้นสูงสุด'
    };

    const promptText = `คุณคือผู้เชี่ยวชาญด้านกลยุทธ์ราคา (Pricing Strategist) และการเงิน E-commerce
    วิเคราะห์การตั้งราคาสินค้า: "${productName || 'สินค้าทั่วไป'}"
    ต้นทุนสินค้า: ${cost} บาท
    ค่าจัดส่ง: ${ship} บาท
    เปอร์เซ็นต์ค่าธรรมเนียมแพลตฟอร์มและธุรกรรมรวม: ${parseFloat(platformFeePct || 0) + parseFloat(paymentFeePct || 0)}%
    เปอร์เซ็นต์ VAT บนค่าธรรมเนียม: ${vatPct}%
    ค่าโฆษณาต่อชิ้นเฉลี่ย: ${ads} บาท

    กลยุทธ์ที่เจ้าของธุรกิจเลือก: ${strategyMap[aiStrategy]}

    คำสั่ง: กรุณาวิเคราะห์โครงสร้างต้นทุนและแนะนำ "ราคาขาย (Sell Price)" ที่เหมาะสมกับกลยุทธ์ที่เลือก โดยราคาที่แนะนำ "ต้องครอบคลุมต้นทุนและค่าธรรมเนียมทั้งหมดแล้ว และยังเหลือกำไร" (ยกเว้นกลยุทธ์เจาะตลาดที่อาจกำไรบางมาก) ให้ใช้เทคนิคจิตวิทยาการตั้งราคา (เช่น ลงท้ายด้วย 9, 90, 50) ประกอบด้วย

    ส่งผลลัพธ์กลับมาเป็น JSON format ที่ถูกต้องเท่านั้น ห้ามมีข้อความอื่น:
    {
      "suggested_price": 0.00,
      "expected_margin_pct": 0,
      "reasoning": "อธิบายเหตุผลว่าทำไมถึงแนะนำราคานี้ รวมถึงจิตวิทยาการตั้งราคา...",
      "pros": ["ข้อดี 1", "ข้อดี 2"],
      "cons": ["ความเสี่ยง/ข้อควรระวัง 1"]
    }`;

    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`;
      const payload = { contents: [{ parts: [{ text: promptText }] }] };
      const res = await fetchWithRetry(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      const text = res.candidates?.[0]?.content?.parts?.[0]?.text;
      
      if (text) {
        const cleanJson = text.replace(/```json/g, '').replace(/```/g, '').trim();
        const parsedData = JSON.parse(cleanJson);
        setAiPricingResult(parsedData);
        showNotification('AI วิเคราะห์และแนะนำราคาเรียบร้อย!', 'success');
      } else {
        throw new Error('No response');
      }
    } catch (error) {
      console.error(error);
      showNotification('เกิดข้อผิดพลาดในการวิเคราะห์ราคา', 'error');
    } finally {
      setIsAnalyzingPrice(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700 w-full">
      <header className="space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/10 text-emerald-400 rounded-full border border-emerald-500/20 text-sm font-medium mb-4">
          <PieChart size={14} /> Data Center & Cost Analytics
        </div>
        <h2 className="text-4xl font-bold text-white">Profit & Cost Calculator</h2>
        <p className="text-gray-400 text-lg">คำนวณกำไรสุทธิ ป้องกันปัญหา "ขายดีจนเจ๊ง" วิเคราะห์ค่าธรรมเนียมแพลตฟอร์มและค่าโฆษณาแบบ Real-time</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 w-full">
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-[#15161c] p-8 rounded-[2rem] border border-white/5 shadow-2xl space-y-6 relative overflow-hidden group">
            <div className="absolute -inset-0.5 bg-gradient-to-br from-emerald-600/20 to-teal-600/20 rounded-[2rem] blur opacity-50 pointer-events-none"></div>
            
            <div className="relative z-10 space-y-5">
              <h3 className="text-xl font-bold text-white flex items-center gap-2 border-b border-white/10 pb-4"><Calculator className="text-emerald-400"/> โครงสร้างราคาสินค้า</h3>
              
              <div>
                <label className="text-sm font-medium text-gray-400 mb-1.5 block">ชื่อสินค้า / แคมเปญ (Product Name)</label>
                <input type="text" value={productName} onChange={e=>setProductName(e.target.value)} placeholder="เช่น เซตครีมกันแดด 1 แถม 1" className="w-full bg-black/30 border border-white/10 text-white rounded-xl p-3 focus:border-emerald-500/50 outline-none transition-colors" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-emerald-400 mb-1.5 block">ราคาขาย (Sell Price) ฿</label>
                  <input type="number" min="0" value={sellPrice} onChange={e=>setSellPrice(e.target.value)} placeholder="0.00" className="w-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-100 font-bold text-lg rounded-xl p-3 focus:border-emerald-500 outline-none transition-colors" />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-400 mb-1.5 block">ต้นทุนสินค้า (Cost) ฿</label>
                  <input type="number" min="0" value={baseCost} onChange={e=>setBaseCost(e.target.value)} placeholder="0.00" className="w-full bg-black/30 border border-white/10 text-white rounded-xl p-3 focus:border-white/30 outline-none transition-colors" />
                </div>
              </div>

              <div className="pt-4 border-t border-white/5">
                 <h4 className="text-sm font-bold text-gray-300 mb-4 flex items-center gap-2"><Receipt size={16}/> ค่าใช้จ่ายแฝง & ค่าธรรมเนียม</h4>
                 
                 <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="flex-1">
                        <label className="text-xs text-gray-500 mb-1 block">GP แพลตฟอร์ม (%)</label>
                        <input type="number" min="0" value={platformFeePct} onChange={e=>setPlatformFeePct(e.target.value)} className="w-full bg-black/30 border border-white/10 text-white rounded-xl p-2.5 outline-none" />
                      </div>
                      <div className="flex-1">
                        <label className="text-xs text-gray-500 mb-1 block">ค่าธุรกรรมการเงิน (%)</label>
                        <input type="number" min="0" value={paymentFeePct} onChange={e=>setPaymentFeePct(e.target.value)} className="w-full bg-black/30 border border-white/10 text-white rounded-xl p-2.5 outline-none" />
                      </div>
                      <div className="flex-1">
                        <label className="text-xs text-red-400 mb-1 block">ภาษี VAT (%) บนค่าธรรมเนียม</label>
                        <input type="number" min="0" value={vatPct} onChange={e=>setVatPct(e.target.value)} className="w-full bg-red-500/10 border border-red-500/30 text-white rounded-xl p-2.5 outline-none" title="ระบบจะคิด VAT จากค่าธรรมเนียมแพลตฟอร์มเท่านั้น" />
                      </div>
                    </div>
                    
                    <div className="flex gap-2 flex-wrap">
                       <button onClick={()=>{setPlatformFeePct('10.7'); setPaymentFeePct('3');}} className="text-[10px] bg-orange-500/10 hover:bg-orange-500/20 text-orange-400 border border-orange-500/20 px-2 py-1 rounded-lg">Shopee (ทั่วไป)</button>
                       <button onClick={()=>{setPlatformFeePct('8'); setPaymentFeePct('2.5');}} className="text-[10px] bg-black hover:bg-white/10 text-white border border-white/20 px-2 py-1 rounded-lg">TikTok Shop</button>
                       <button onClick={()=>{setPlatformFeePct('0'); setPaymentFeePct('0');}} className="text-[10px] bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/20 px-2 py-1 rounded-lg">ขายเอง (Line/FB)</button>
                       <button onClick={()=>{setVatPct(vatPct === '7' ? '0' : '7');}} className={`text-[10px] ${vatPct === '7' ? 'bg-red-500/20 text-red-400 border-red-500/30' : 'bg-white/5 text-gray-400 border-white/10 hover:bg-white/10'} border px-2 py-1 rounded-lg ml-auto transition-colors`}>
                         {vatPct === '7' ? '✅ หัก VAT 7%' : '+ คิด VAT 7%'}
                       </button>
                    </div>

                    <div className="grid grid-cols-2 gap-4 pt-2">
                      <div>
                        <label className="text-xs text-gray-500 mb-1 block">ค่าจัดส่ง/แพ็ค (฿)</label>
                        <input type="number" min="0" value={shippingCost} onChange={e=>setShippingCost(e.target.value)} className="w-full bg-black/30 border border-white/10 text-white rounded-xl p-2.5 outline-none" />
                      </div>
                      <div>
                        <label className="text-xs text-purple-400 mb-1 block">ค่า Ads/ชิ้น (฿)</label>
                        <input type="number" min="0" value={adCost} onChange={e=>setAdCost(e.target.value)} className="w-full bg-purple-500/10 border border-purple-500/30 text-white rounded-xl p-2.5 outline-none" />
                      </div>
                    </div>
                 </div>
              </div>

              {/* --- AI Pricing Strategist Section --- */}
              <div className="pt-6 border-t border-white/5 mt-6">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-sm font-bold text-yellow-400 flex items-center gap-2">
                    <Sparkles size={16}/> AI Pricing Strategist
                  </h4>
                </div>
                
                <p className="text-xs text-gray-400 mb-2">เลือกระดับกลยุทธ์ เพื่อให้ AI คำนวณราคาขายจากต้นทุน</p>
                <div className="flex bg-black/30 rounded-xl p-1 mb-4 border border-white/5">
                   <button onClick={()=>setAiStrategy('penetration')} className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-colors ${aiStrategy === 'penetration' ? 'bg-yellow-500/20 text-yellow-400 shadow-sm' : 'text-gray-500 hover:text-gray-300'}`}>เจาะตลาด (Volume)</button>
                   <button onClick={()=>setAiStrategy('balanced')} className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-colors ${aiStrategy === 'balanced' ? 'bg-blue-500/20 text-blue-400 shadow-sm' : 'text-gray-500 hover:text-gray-300'}`}>สมดุล (Balanced)</button>
                   <button onClick={()=>setAiStrategy('premium')} className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-colors ${aiStrategy === 'premium' ? 'bg-purple-500/20 text-purple-400 shadow-sm' : 'text-gray-500 hover:text-gray-300'}`}>พรีเมียม (Margin)</button>
                </div>

                <button 
                  onClick={handleAnalyzePrice} 
                  disabled={isAnalyzingPrice || !baseCost}
                  className="w-full bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white py-3 rounded-xl font-bold flex justify-center items-center gap-2 shadow-lg shadow-emerald-500/20 disabled:opacity-50 transition-all text-sm"
                >
                  {isAnalyzingPrice ? <Loader2 className="animate-spin" size={16}/> : <Wand2 size={16}/>} 
                  {isAnalyzingPrice ? 'กำลังวิเคราะห์โครงสร้าง...' : 'ให้ AI ช่วยคำนวณราคาขาย'}
                </button>

                {aiPricingResult && (
                  <div className="mt-4 bg-emerald-900/20 border border-emerald-500/30 rounded-xl p-4 animate-in slide-in-from-top-2">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <p className="text-xs text-emerald-400/80 uppercase font-bold tracking-widest mb-1">ราคาแนะนำ</p>
                        <p className="text-3xl font-black text-emerald-400 drop-shadow-md">฿{aiPricingResult.suggested_price}</p>
                      </div>
                      <button 
                        onClick={() => {
                          setSellPrice(aiPricingResult.suggested_price.toString());
                          showNotification('นำราคามาใช้ในระบบคำนวณแล้ว', 'success');
                        }}
                        className="bg-emerald-500 hover:bg-emerald-400 text-white text-xs font-bold py-1.5 px-3 rounded-lg shadow-lg transition-all"
                      >
                        ใช้ราคานี้
                      </button>
                    </div>
                    
                    <p className="text-xs text-gray-300 mb-3 leading-relaxed border-l-2 border-emerald-500 pl-3">
                      {aiPricingResult.reasoning}
                    </p>

                    <div className="grid grid-cols-2 gap-3 mt-3 pt-3 border-t border-emerald-500/20">
                      <div>
                        <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-1"><CheckCircle2 size={10}/> ข้อดี</span>
                        <ul className="text-[10px] text-gray-400 mt-1 space-y-1 list-disc pl-3">
                          {aiPricingResult.pros.map((p, i) => <li key={i}>{p}</li>)}
                        </ul>
                      </div>
                      <div>
                        <span className="text-[10px] text-orange-400 font-bold flex items-center gap-1"><AlertCircle size={10}/> ระวัง</span>
                        <ul className="text-[10px] text-gray-400 mt-1 space-y-1 list-disc pl-3">
                          {aiPricingResult.cons.map((c, i) => <li key={i}>{c}</li>)}
                        </ul>
                      </div>
                    </div>
                  </div>
                )}
              </div>

            </div>
          </div>
        </div>

        <div className="lg:col-span-7 space-y-6">
          <div className={`p-8 rounded-[2rem] border shadow-2xl relative overflow-hidden transition-colors duration-500 ${isLoss ? 'bg-red-950/20 border-red-500/30 shadow-red-500/10' : 'bg-[#1a1b23] border-white/5'}`}>
            {isLoss && <div className="absolute top-0 left-0 w-full h-1 bg-red-500 animate-pulse"></div>}
            
            <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
              <DollarSign className={isLoss ? 'text-red-400' : 'text-emerald-400'}/> 
              บทสรุปผลกำไร (Analytics)
            </h3>

            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
              <div className="bg-black/30 p-4 rounded-2xl border border-white/5">
                <span className="text-xs text-gray-500 font-medium">ราคาขาย</span>
                <p className="text-xl font-bold text-white mt-1">฿{price.toLocaleString()}</p>
              </div>
              <div className="bg-black/30 p-4 rounded-2xl border border-white/5">
                <span className="text-xs text-gray-500 font-medium">ต้นทุนสินค้า</span>
                <p className="text-xl font-bold text-gray-300 mt-1">฿{cost.toLocaleString()}</p>
              </div>
              <div className="bg-black/30 p-4 rounded-2xl border border-red-500/10">
                <span className="text-xs text-red-400/80 font-medium">ค่าธรรมเนียม</span>
                <p className="text-xl font-bold text-red-400 mt-1">฿{baseTotalFees.toLocaleString(undefined, {minimumFractionDigits:1, maximumFractionDigits:1})}</p>
              </div>
              <div className="bg-black/30 p-4 rounded-2xl border border-orange-500/10">
                <span className="text-xs text-orange-400/80 font-medium">VAT (7%)</span>
                <p className="text-xl font-bold text-orange-400 mt-1">฿{vatAmount.toLocaleString(undefined, {minimumFractionDigits:1, maximumFractionDigits:1})}</p>
              </div>
              <div className="bg-black/30 p-4 rounded-2xl border border-purple-500/10">
                <span className="text-xs text-purple-400/80 font-medium">ค่าแอด+จัดส่ง</span>
                <p className="text-xl font-bold text-purple-400 mt-1">฿{(ship + ads).toLocaleString()}</p>
              </div>
            </div>

            <div className={`p-8 rounded-[2rem] border backdrop-blur-md flex flex-col md:flex-row items-center justify-between gap-6 transition-all duration-500 ${isLoss ? 'bg-red-500/10 border-red-500/40' : 'bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border-emerald-500/30'}`}>
               <div>
                 <span className={`text-sm font-bold flex items-center gap-2 mb-2 ${isLoss ? 'text-red-400' : 'text-emerald-400'}`}>
                   {isLoss ? <TrendingDown size={18}/> : <TrendingUp size={18}/>} 
                   {isLoss ? 'ขาดทุนสุทธิ (Net Loss)' : 'กำไรสุทธิ (Net Profit)'}
                 </span>
                 <h1 className={`text-5xl md:text-6xl font-black ${isLoss ? 'text-red-500' : 'text-emerald-400'} drop-shadow-lg tracking-tight`}>
                   ฿{netProfit.toLocaleString(undefined, {minimumFractionDigits:1, maximumFractionDigits:1})}
                 </h1>
                 
                 {isLoss && (
                   <div className="mt-3 flex items-start gap-2 text-red-300 text-xs bg-red-950/50 p-2.5 rounded-lg border border-red-500/20 w-fit">
                     <AlertCircle size={14} className="shrink-0 mt-0.5"/>
                     <p><b>เตือนภัย:</b> คุณกำลังเหนื่อยฟรี! โดนค่าธรรมเนียมและค่าแอดกินจนหมด โปรดปรับราคาขายหรือลดต้นทุนด่วน</p>
                   </div>
                 )}
               </div>

               <div className="flex flex-col items-center justify-center shrink-0">
                 <div className="relative w-32 h-32 flex items-center justify-center">
                   <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                     <circle cx="50" cy="50" r="45" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="10" />
                     <circle cx="50" cy="50" r="45" fill="none" 
                       stroke={isLoss ? '#ef4444' : '#10b981'} 
                       strokeWidth="10" 
                       strokeDasharray="283" 
                       strokeDashoffset={283 - (283 * Math.max(0, Math.min(profitMargin, 100))) / 100} 
                       className="transition-all duration-1000 ease-out" 
                     />
                   </svg>
                   <div className="absolute flex flex-col items-center justify-center">
                     <span className={`text-2xl font-black ${isLoss ? 'text-red-500' : 'text-emerald-400'}`}>{Math.round(profitMargin)}%</span>
                     <span className="text-[9px] text-gray-400 uppercase tracking-widest">Margin</span>
                   </div>
                 </div>
               </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button 
                onClick={handleSaveCalculation}
                disabled={isSaving || !productName || price <= 0}
                className="bg-emerald-600/90 hover:bg-emerald-500 text-white py-3 px-8 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-emerald-500/20 disabled:opacity-50 transition-all border border-emerald-400/30"
              >
                {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                บันทึก Data ชุดนี้
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-16 w-full pt-8 border-t border-white/5">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold text-gray-200 flex items-center gap-2"><Database size={20} className="text-emerald-400" /> Financial Database</h3>
          {isLoadingSaved && <Loader2 size={20} className="animate-spin text-gray-500" />}
        </div>

        {authError === 'auth/configuration-not-found' ? (
          <div className="text-center py-8 bg-red-500/10 border border-red-500/20 rounded-[2rem] text-red-400 text-sm">ไม่สามารถเชื่อมต่อ Cloud ได้ (Authentication Error) โปรดตั้งค่า Firebase</div>
        ) : savedProfits.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 w-full">
            {savedProfits.map((item) => (
              <div key={item.id} className="bg-[#15161c] border border-white/10 rounded-[2rem] p-6 shadow-xl flex flex-col group relative hover:border-emerald-500/30 transition-colors">
                <div className="flex justify-between items-start mb-4 border-b border-white/5 pb-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg ${item.netProfit < 0 ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'}`}>
                      {item.netProfit < 0 ? <TrendingDown size={20}/> : <TrendingUp size={20}/>}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-gray-200 line-clamp-1">{item.productName}</h4>
                      <p className="text-xs text-gray-500 mt-0.5">ขาย: ฿{item.sellPrice} | ทุน: ฿{item.baseCost}</p>
                    </div>
                  </div>
                  <button onClick={() => handleDelete(item.id)} className="p-2 bg-white/5 hover:bg-red-500/20 text-gray-500 hover:text-red-400 rounded-lg transition-colors"><Trash2 size={16}/></button>
                </div>
                
                <div className="grid grid-cols-2 gap-3 mt-2">
                  <div className="bg-black/30 p-3 rounded-xl border border-white/5">
                     <span className="text-[10px] text-gray-500 block mb-1">ค่าธรรมเนียม+แอด{item.vatPct > 0 ? '+VAT' : ''}</span>
                     <span className="text-sm font-bold text-orange-400">฿{(item.totalFees + item.adCost).toLocaleString(undefined, {maximumFractionDigits:1})}</span>
                  </div>
                  <div className={`p-3 rounded-xl border ${item.netProfit < 0 ? 'bg-red-950/30 border-red-500/20' : 'bg-emerald-950/30 border-emerald-500/20'}`}>
                     <span className={`text-[10px] block mb-1 ${item.netProfit < 0 ? 'text-red-400/70' : 'text-emerald-400/70'}`}>กำไรสุทธิ ({Math.round(item.profitMargin)}%)</span>
                     <span className={`text-sm font-black ${item.netProfit < 0 ? 'text-red-400' : 'text-emerald-400'}`}>฿{item.netProfit.toLocaleString(undefined, {maximumFractionDigits:1})}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          !isLoadingSaved && (
            <div className="text-center py-12 bg-[#15161c] border border-white/5 rounded-[2rem] text-gray-500 w-full">
              <PieChart size={48} className="mx-auto mb-4 text-emerald-500/40" />
              <p className="font-medium text-gray-400">ยังไม่มีข้อมูลโครงสร้างราคา</p>
              <p className="text-sm mt-1">เริ่มคำนวณและกดบันทึกเพื่อเก็บเป็นฐานข้อมูลสินค้าของคุณ</p>
            </div>
          )
        )}
      </div>
    </div>
  );
}

// ----------------------------------------------------------------------
// Section: Video Studio
// ----------------------------------------------------------------------
function VideoStudio({ showNotification, apiKey }) {
  const [refImage, setRefImage] = useState(null);
  const [prompt, setPrompt] = useState('');
  const [motionType, setMotionType] = useState('dynamic');
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState('');
  const [videoResult, setVideoResult] = useState(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isOptimizing, setIsOptimizing] = useState(false);

  const handleUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) return showNotification('ขนาดไฟล์ต้องไม่เกิน 5MB', 'error');
      const reader = new FileReader();
      reader.onloadend = () => setRefImage(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleOptimizePrompt = async () => {
    if (!apiKey) return showNotification('กรุณาตั้งค่า API Key ด้านบนก่อน', 'error');
    if (!prompt.trim()) return showNotification('กรุณาพิมพ์บรีฟสั้นๆ ก่อนให้ AI ช่วยขยาย', 'error');
    setIsOptimizing(true);
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
      const systemInstruction = `You are an expert AI Video Prompt Engineer. Convert the user's short idea into a highly detailed, professional text-to-video prompt in English. Include camera movement, lighting, cinematic style, and subject details. Respond ONLY with the english prompt, no extra text or quotes.`;
      
      const payload = { contents: [{ parts: [{ text: `${systemInstruction}\nUser idea: ${prompt}` }] }] };
      
      const res = await fetchWithRetry(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      const text = res.candidates?.[0]?.content?.parts?.[0]?.text;
      if (text) {
        setPrompt(text.trim());
        showNotification('AI อัปเกรด Prompt สำหรับวิดีโอให้เรียบร้อย!', 'success');
      }
    } catch(error) {
      showNotification('เกิดข้อผิดพลาดในการอัปเกรด Prompt', 'error');
    } finally {
      setIsOptimizing(false);
    }
  };

  const handleGenerate = () => {
    if (!refImage) return showNotification('กรุณาอัปโหลดภาพเริ่มต้น (Start Frame)', 'error');
    if (!prompt) return showNotification('กรุณาใส่คำสั่ง Motion Prompt', 'error');
    
    setIsGenerating(true);
    setProgress(0);
    setVideoResult(null);

    let curr = 0;
    const steps = [
      'กำลังส่งภาพเข้า AI Video Engine...',
      'กำลังวิเคราะห์ Depth Map & 3D Space...',
      'กำลังเรนเดอร์เฟรม (Rendering Frames)...',
      'กำลังประมวลผลการเคลื่อนไหว (Applying Motion)...',
      'กำลังขยายความละเอียด (Upscaling & Polishing)...'
    ];
    let stepIdx = 0;
    setStatusText(steps[stepIdx]);
    
    const interval = setInterval(() => {
      curr += Math.random() * 12; 
      if (curr >= 100) {
        curr = 100;
        clearInterval(interval);
        setTimeout(() => {
          setIsGenerating(false);
          setVideoResult({ image: refImage, motion: motionType });
          setIsPlaying(true);
          showNotification('สร้างวิดีโอสำเร็จ!', 'success');
        }, 800);
      }
      setProgress(curr);
      
      if (curr > 20 && stepIdx === 0) { stepIdx = 1; setStatusText(steps[stepIdx]); }
      if (curr > 40 && stepIdx === 1) { stepIdx = 2; setStatusText(steps[stepIdx]); }
      if (curr > 70 && stepIdx === 2) { stepIdx = 3; setStatusText(steps[stepIdx]); }
      if (curr > 90 && stepIdx === 3) { stepIdx = 4; setStatusText(steps[stepIdx]); }
      
    }, 400);
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700 w-full">
      <header className="space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-500/10 text-blue-400 rounded-full border border-blue-500/20 text-sm font-medium mb-4">
          <Video size={14} /> AI Video Generator (Image-to-Video)
        </div>
        <h2 className="text-4xl font-bold text-white">AI Video Studio</h2>
        <p className="text-gray-400 text-lg">แปลงภาพนิ่งให้เคลื่อนไหวได้ดั่งเวทมนตร์ เพียงอัปโหลดภาพ (Start Frame) และกำหนดทิศทางมุมกล้อง (Motion) จบครบในแอปเดียว</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 w-full">
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-[#15161c] p-6 rounded-[2rem] border border-white/5 shadow-2xl relative overflow-hidden group flex flex-col gap-5">
            <div className="absolute -inset-0.5 bg-gradient-to-br from-blue-600 to-purple-600 rounded-[2rem] blur opacity-10 group-hover:opacity-30 transition duration-500 pointer-events-none"></div>
            
            <div className="relative z-10">
              <h3 className="font-semibold text-white mb-3 flex items-center gap-2"><ImageIcon size={18} className="text-blue-400"/> 1. Upload Start Frame</h3>
              <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-white/20 rounded-2xl cursor-pointer hover:bg-white/5 relative overflow-hidden transition-all bg-black/20">
                {refImage ? (
                  <>
                    <img src={refImage} alt="Ref" className="w-full h-full object-contain p-2"/>
                    <button onClick={(e) => { e.preventDefault(); setRefImage(null); }} className="absolute top-2 right-2 bg-black/50 text-white p-2 rounded-xl hover:bg-red-500/80 transition-colors z-20"><X size={16} /></button>
                  </>
                ) : (
                  <div className="flex flex-col items-center text-gray-400 group-hover:text-white transition-colors">
                    <Upload size={32} className="mb-3 transition-transform group-hover:-translate-y-1" />
                    <span className="font-semibold">อัปโหลดภาพนิ่งแรก</span>
                    <span className="text-xs text-blue-400 mt-1">(Image to Video)</span>
                  </div>
                )}
                <input type="file" className="hidden" onChange={handleUpload} accept="image/*"/>
              </label>
            </div>

            <div className="relative z-10">
              <h3 className="font-semibold text-white mb-3 flex items-center gap-2"><Type size={18} className="text-purple-400"/> 2. Motion Prompt</h3>
              <div className="relative">
                <textarea 
                  value={prompt} 
                  onChange={(e)=>setPrompt(e.target.value)} 
                  placeholder="อธิบายการเคลื่อนไหว เช่น: Cinematic pan right, soft lighting, slow motion..." 
                  className="w-full min-h-[100px] p-4 bg-black/30 text-gray-200 rounded-xl text-sm border border-white/10 resize-none focus:outline-none focus:border-blue-500/50 custom-scrollbar pb-12"
                />
                <button 
                  onClick={handleOptimizePrompt} 
                  disabled={isOptimizing || !prompt.trim()}
                  className="absolute bottom-3 right-3 bg-purple-500/20 hover:bg-purple-500/40 text-purple-300 px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors disabled:opacity-50"
                >
                  {isOptimizing ? <Loader2 size={12} className="animate-spin" /> : <Wand2 size={12} />}
                  AI ช่วยเขียน Prompt
                </button>
              </div>
            </div>

            <div className="relative z-10">
               <h3 className="font-semibold text-white mb-3 flex items-center gap-2"><Sliders size={18} className="text-green-400"/> 3. Camera Control</h3>
               <div className="grid grid-cols-2 gap-3">
                 <button onClick={()=>setMotionType('zoom-in')} className={`py-3 px-2 rounded-xl text-sm font-medium border transition-colors ${motionType === 'zoom-in' ? 'bg-blue-500/20 border-blue-500/50 text-blue-300' : 'bg-black/30 border-white/5 text-gray-400 hover:bg-white/5'}`}>Zoom In</button>
                 <button onClick={()=>setMotionType('zoom-out')} className={`py-3 px-2 rounded-xl text-sm font-medium border transition-colors ${motionType === 'zoom-out' ? 'bg-blue-500/20 border-blue-500/50 text-blue-300' : 'bg-black/30 border-white/5 text-gray-400 hover:bg-white/5'}`}>Zoom Out</button>
                 <button onClick={()=>setMotionType('pan-right')} className={`py-3 px-2 rounded-xl text-sm font-medium border transition-colors ${motionType === 'pan-right' ? 'bg-blue-500/20 border-blue-500/50 text-blue-300' : 'bg-black/30 border-white/5 text-gray-400 hover:bg-white/5'}`}>Pan Right</button>
                 <button onClick={()=>setMotionType('pan-left')} className={`py-3 px-2 rounded-xl text-sm font-medium border transition-colors ${motionType === 'pan-left' ? 'bg-blue-500/20 border-blue-500/50 text-blue-300' : 'bg-black/30 border-white/5 text-gray-400 hover:bg-white/5'}`}>Pan Left</button>
                 <button onClick={()=>setMotionType('dynamic')} className={`py-3 px-2 rounded-xl text-sm font-medium border transition-colors col-span-2 ${motionType === 'dynamic' ? 'bg-purple-500/20 border-purple-500/50 text-purple-300' : 'bg-black/30 border-white/5 text-gray-400 hover:bg-white/5'}`}>Dynamic Motion (Tilt & Pan)</button>
               </div>
            </div>

            <button 
              onClick={handleGenerate} 
              disabled={isGenerating || !refImage || !prompt} 
              className="w-full mt-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white py-4 rounded-xl font-bold flex justify-center items-center gap-2 shadow-lg shadow-blue-500/20 disabled:opacity-50 transition-all text-lg relative z-10"
            >
              {isGenerating ? <Loader2 className="animate-spin"/> : <Video />} 
              {isGenerating ? 'กำลังประมวลผลวิดีโอ...' : '🎬 Generate Video'}
            </button>
          </div>
        </div>

        <div className="lg:col-span-7">
          <div className="bg-[#15161c] border border-white/5 rounded-[2rem] h-[500px] flex items-center justify-center overflow-hidden relative shadow-2xl p-2">
            
            {!videoResult && !isGenerating && (
              <div className="text-gray-500 flex flex-col items-center p-8 text-center">
                <MonitorPlay size={64} className="mb-4 opacity-30"/>
                <h3 className="text-xl font-bold text-gray-300 mb-2">Video Preview</h3>
                <p className="text-sm opacity-70">อัปโหลดภาพและกด Generate เพื่อให้ AI สร้างภาพเคลื่อนไหว</p>
              </div>
            )}

            {isGenerating && (
              <div className="w-full max-w-md flex flex-col items-center animate-in fade-in zoom-in duration-500">
                 <div className="relative w-24 h-24 mb-8">
                   <div className="absolute inset-0 border-t-4 border-blue-500 rounded-full animate-spin"></div>
                   <div className="absolute inset-2 border-r-4 border-purple-500 rounded-full animate-spin animation-delay-150"></div>
                   <div className="absolute inset-0 flex items-center justify-center text-blue-400"><Video size={32} className="animate-pulse"/></div>
                 </div>
                 <h3 className="text-xl font-bold text-white mb-2">AI Video Generation</h3>
                 <p className="text-blue-400 text-sm font-medium h-6">{statusText}</p>
                 <div className="w-full h-2 bg-white/10 rounded-full mt-6 overflow-hidden">
                   <div className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-300 ease-out" style={{ width: `${progress}%` }}></div>
                 </div>
                 <span className="text-xs text-gray-500 mt-2 font-mono">{Math.round(progress)}% Complete</span>
              </div>
            )}

            {videoResult && !isGenerating && (
              <div className="relative w-full h-full bg-black rounded-[1.5rem] overflow-hidden group">
                
                <div className={`w-full h-full relative overflow-hidden`}>
                  <div 
                     className={`w-full h-full bg-cover bg-center transition-all ${isPlaying ? `motion-${videoResult.motion}` : ''}`}
                     style={{ 
                       backgroundImage: `url(${videoResult.image})`,
                       animationPlayState: isPlaying ? 'running' : 'paused'
                     }}
                  />
                  <div className="absolute inset-0 bg-black/10 pointer-events-none"></div> 
                  <div className="absolute top-0 left-0 w-full h-16 bg-gradient-to-b from-black/60 to-transparent pointer-events-none"></div>
                  <div className="absolute bottom-0 left-0 w-full h-24 bg-gradient-to-t from-black/80 to-transparent pointer-events-none"></div>
                </div>

                <div className="absolute inset-0 flex flex-col justify-between opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <div className="p-4 flex justify-between items-center">
                    <span className="bg-black/50 backdrop-blur-md text-white text-xs font-mono px-3 py-1.5 rounded-lg border border-white/10 flex items-center gap-2">
                       <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div> SIMULATED MP4
                    </span>
                    <button 
                      onClick={() => showNotification('ดาวน์โหลดไฟล์ MP4 (Simulation Only) สำเร็จ')}
                      className="bg-black/50 hover:bg-blue-500/80 backdrop-blur-md text-white p-2 rounded-xl transition-colors border border-white/10"
                    >
                      <Download size={18}/>
                    </button>
                  </div>
                  
                  <div className="p-6 flex flex-col items-center gap-4">
                    <button 
                      onClick={() => setIsPlaying(!isPlaying)} 
                      className="w-16 h-16 bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 rounded-full flex items-center justify-center text-white transition-transform hover:scale-110 shadow-2xl"
                    >
                      {isPlaying ? <Pause size={28} className="fill-white"/> : <Play size={28} className="fill-white ml-1"/>}
                    </button>
                    
                    <div className="w-full flex items-center gap-3">
                      <span className="text-xs font-mono text-white/80">0:00</span>
                      <div className="flex-1 h-1.5 bg-white/20 rounded-full overflow-hidden relative cursor-pointer">
                        <div className="absolute top-0 left-0 h-full bg-blue-500 w-1/3"></div>
                      </div>
                      <span className="text-xs font-mono text-white/80">0:05</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

          </div>
          
          <div className="mt-4 flex items-start gap-3 p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl">
             <Lightbulb size={20} className="text-blue-400 shrink-0 mt-0.5"/>
             <div className="text-sm text-blue-200/80 leading-relaxed">
               <strong>Pro Tip:</strong> เนื่องจากข้อจำกัดของ Browser ฝั่ง Frontend ระบบนี้จึงใช้เทคนิค <span className="text-blue-300 font-mono">Image-to-Motion Animation (CSS Keyframes)</span> ในการจำลองการทำงานของ Video AI หากต้องการไฟล์วิดีโอ MP4 จริง สามารถนำการออกแบบส่วนนี้ไปเชื่อมต่อ API ของ Runway Gen-3 หรือ Luma Dream Machine ที่ฝั่ง Backend ในภายหลังได้ครับ
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ----------------------------------------------------------------------
// Section: Content Generator
// ----------------------------------------------------------------------
function ContentGenerator({ showNotification, user, authError, apiKey }) {
  const [prompt, setPrompt] = useState('');
  const [result, setResult] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [refImage, setRefImage] = useState(null);
  
  // Cloud Gallery States
  const [showGallery, setShowGallery] = useState(false);
  const [savedImages, setSavedImages] = useState([]);
  const [isLoadingGallery, setIsLoadingGallery] = useState(false);

  // Content Library States (New)
  const [savedCopies, setSavedCopies] = useState([]);
  const [isLoadingCopies, setIsLoadingCopies] = useState(true);

  useEffect(() => {
    if (user && !authError) fetchSavedCopies();
    else setIsLoadingCopies(false);
  }, [user, authError]);

  const fetchSavedCopies = async () => {
    setIsLoadingCopies(true);
    try {
      const q = query(collection(db, 'artifacts', appId, 'public', 'data', 'copies'), orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      const copies = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setSavedCopies(copies);
    } catch (error) {
      console.error("Error fetching saved copies:", error);
    } finally {
      setIsLoadingCopies(false);
    }
  };

  const handleDeleteCopy = async (id) => {
    try {
      await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'copies', id));
      setSavedCopies(prev => prev.filter(c => c.id !== id));
      showNotification('ลบคอนเทนต์สำเร็จ');
    } catch (error) {
      showNotification('ไม่สามารถลบข้อมูลได้', 'error');
    }
  };

  const fetchCloudImages = async () => {
    if (!user || authError) return;
    setIsLoadingGallery(true);
    try {
      const q = query(collection(db, 'artifacts', appId, 'public', 'data', 'images'), orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      const images = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setSavedImages(images);
    } catch (error) {
      console.error("Error fetching cloud images:", error);
      showNotification('โหลดภาพจาก Cloud ไม่สำเร็จ', 'error');
    } finally {
      setIsLoadingGallery(false);
    }
  };

  const handleToggleGallery = () => {
    if (!showGallery && savedImages.length === 0) {
      fetchCloudImages();
    }
    setShowGallery(!showGallery);
  };

  const handleUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) return showNotification('ขนาดไฟล์ต้องไม่เกิน 5MB', 'error');
      const reader = new FileReader();
      reader.onloadend = () => {
        setRefImage(reader.result);
        setShowGallery(false);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGenerate = async () => {
    if (!apiKey) return showNotification('กรุณาตั้งค่า API Key ด้านบนก่อน', 'error');
    if (!prompt.trim() && !refImage) {
      return showNotification('กรุณาพิมพ์คำสั่งหรือเลือกภาพอย่างน้อย 1 อย่าง', 'error');
    }
    setIsGenerating(true); 
    setResult('');
    
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`;
    
    let systemInstruction = `คุณคือสุดยอดผู้เชี่ยวชาญด้านการทำคอนเทนต์และ Copywriter โฆษณาภาษาไทยระดับท็อป กฎสำคัญ: ห้ามใช้สัญลักษณ์ Markdown เช่น ** หรือ * หรือ ### ในการจัดรูปแบบข้อความเด็ดขาด ให้พิมพ์ข้อความเว้นวรรคและขึ้นบรรทัดใหม่ให้สวยงามพร้อมคัดลอกไปใช้งานได้ทันที `;
    let userPrompt = prompt.trim() || 'วิเคราะห์ภาพสินค้านี้ และเขียนแคปชั่นโฆษณาโซเชียลมีเดียให้น่าสนใจ ดึงดูดลูกค้าให้หยุดดู';

    const parts = [];

    if (refImage) {
      systemInstruction += `วิเคราะห์องค์ประกอบ อารมณ์ และสินค้าในภาพที่แนบมาให้ละเอียดที่สุด เพื่อนำมาเชื่อมโยงกับแคปชั่นโฆษณาที่คุณจะเขียน `;
      const base64Data = refImage.split(',')[1];
      const mimeType = refImage.split(';')[0].split(':')[1];
      parts.push({ inlineData: { mimeType, data: base64Data } });
    }

    parts.push({ text: `${systemInstruction} \n\nคำสั่งจากผู้ใช้งาน: ${userPrompt}` });

    try {
      const data = await fetchWithRetry(url, {
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts }] })
      });
      
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (text) { 
        const cleanText = text.replace(/(\*\*|\*|###|##|# )/g, '').trim();
        setResult(cleanText); 
        showNotification('วิเคราะห์และสร้างคอนเทนต์สำเร็จ!'); 

        if (user && !authError) {
           try {
              await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'copies'), {
                content: cleanText,
                prompt: userPrompt,
                imageUrl: refImage || null,
                createdAt: serverTimestamp()
              });
              fetchSavedCopies();
           } catch(e) {
              console.error("Save copy error:", e);
           }
        }
      } else {
        throw new Error('ไม่พบข้อมูลตอบกลับ');
      }
    } catch (error) { 
      showNotification('เกิดข้อผิดพลาด ลองใหม่อีกครั้ง', 'error'); 
    } finally { 
      setIsGenerating(false); 
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700 w-full">
      <header className="space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-purple-500/10 text-purple-400 rounded-full border border-purple-500/20 text-sm font-medium mb-4">
          <Sparkles size={14} /> AI Multimodal Copywriter
        </div>
        <h2 className="text-4xl font-bold text-white">AI Copywriter</h2>
        <p className="text-gray-400 text-lg">ร่างบทความ หรือดึงภาพโฆษณาที่สร้างเสร็จแล้วจาก Cloud มาให้ AI ช่วยวิเคราะห์เขียนแคปชั่นขายของ</p>
      </header>

      <div className="relative group w-full">
        <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-500 to-blue-500 rounded-[2rem] blur opacity-20 group-hover:opacity-40 transition duration-500"></div>
        <div className="relative bg-[#15161c] border border-white/10 p-6 rounded-[2rem] shadow-2xl space-y-4 w-full flex flex-col md:flex-row gap-6">
          
          <div className="w-full md:w-1/3 flex flex-col gap-3">
             <div className="w-full h-48 border-2 border-dashed border-white/20 rounded-2xl flex flex-col items-center justify-center relative overflow-hidden bg-black/20 group/upload transition-colors hover:border-purple-500/50">
               {refImage ? (
                 <>
                   <img src={refImage} alt="Reference" className="w-full h-full object-contain p-2" />
                   <button onClick={() => setRefImage(null)} className="absolute top-2 right-2 bg-black/60 hover:bg-red-500/80 text-white p-2 rounded-xl transition-colors"><X size={16} /></button>
                 </>
               ) : (
                 <div className="flex flex-col items-center text-center p-4">
                   <ImageIcon size={32} className="text-gray-500 mb-2" />
                   <span className="text-sm font-medium text-gray-400">ยังไม่มีภาพประกอบ</span>
                   <span className="text-xs text-gray-500 mt-1">AI จะเขียนจากข้อความที่คุณพิมพ์อย่างเดียว</span>
                 </div>
               )}
             </div>

             <div className="grid grid-cols-2 gap-2">
               <label className="flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 text-gray-300 py-2.5 px-3 rounded-xl cursor-pointer transition-colors text-xs font-semibold border border-white/5">
                 <Upload size={14} /> อัปโหลดภาพ
                 <input type="file" accept="image/*" className="hidden" onChange={handleUpload} />
               </label>
               <button onClick={handleToggleGallery} className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl transition-colors text-xs font-semibold border ${showGallery ? 'bg-purple-500/20 text-purple-400 border-purple-500/30' : 'bg-white/5 hover:bg-white/10 text-gray-300 border-white/5'}`}>
                 <Cloud size={14} /> ดึงภาพจาก Cloud
               </button>
             </div>
          </div>

          <div className="flex-1 flex flex-col">
            <textarea 
              value={prompt} 
              onChange={(e) => setPrompt(e.target.value)} 
              placeholder={refImage ? "บอกรายละเอียดเพิ่มเติม หรือให้ AI วิเคราะห์ภาพนี้เพื่อเขียนแคปชั่น..." : "ช่วยเขียนแคปชั่นโปรโมชั่น 9.9 สไตล์ตลกขบขัน ให้วัยรุ่นอ่านแล้วหยุดดู..."} 
              className="w-full flex-1 p-5 bg-white/5 text-gray-200 placeholder:text-gray-600 focus:outline-none focus:ring-1 focus:ring-purple-500/50 rounded-xl resize-none text-lg custom-scrollbar border border-white/5 min-h-[150px]" 
            />
            <div className="flex justify-between items-center pt-4 mt-2 border-t border-white/5">
              <p className="text-xs text-gray-500 font-medium flex items-center gap-2">
                 <Database size={12} className="text-blue-400"/> สามารถใช้งานร่วมกับ Ad Studio ได้
              </p>
              <button onClick={handleGenerate} disabled={isGenerating || (!prompt.trim() && !refImage)} className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-blue-500 hover:from-purple-500 hover:to-blue-400 text-white px-8 py-3 rounded-xl font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-purple-500/25">
                {isGenerating ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} />} 
                {isGenerating ? 'กำลังสร้างสรรค์...' : 'Generate Copy'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {showGallery && (
        <div className="bg-[#15161c] border border-purple-500/20 p-6 rounded-[2rem] shadow-xl animate-in fade-in slide-in-from-top-4">
          <div className="flex justify-between items-center mb-4 border-b border-white/5 pb-4">
            <h3 className="font-semibold text-gray-200 flex items-center gap-2"><Cloud className="text-purple-400" size={18}/> เลือกภาพโฆษณาที่เคยสร้างไว้</h3>
            <button onClick={() => setShowGallery(false)} className="text-gray-500 hover:text-white p-1 rounded-lg hover:bg-white/10"><X size={20}/></button>
          </div>
          
          {isLoadingGallery ? (
            <div className="flex justify-center items-center py-12"><Loader2 className="animate-spin text-purple-500" size={32}/></div>
          ) : authError ? (
            <div className="text-center py-8 text-red-400 text-sm">ไม่สามารถเชื่อมต่อ Cloud ได้ (Authentication Error)</div>
          ) : savedImages.length === 0 ? (
            <div className="text-center py-8 text-gray-500 text-sm">ยังไม่มีภาพในระบบ (สร้างภาพใหม่ได้ที่หน้า Ad & Image Studio)</div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 max-h-[300px] overflow-y-auto custom-scrollbar p-2">
              {savedImages.map(img => (
                <div key={img.id} onClick={() => { setRefImage(img.url); setShowGallery(false); }} className="relative aspect-square rounded-xl overflow-hidden cursor-pointer group border-2 border-transparent hover:border-purple-500 transition-all shadow-md">
                  <img src={img.url} alt="Saved Ad" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
                    <span className="bg-purple-500 text-white text-xs font-bold px-3 py-1.5 rounded-lg">นำไปเขียนแคปชั่น</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {result && (
        <div className="bg-[#15161c] p-8 rounded-[2rem] shadow-2xl border border-white/10 space-y-4 mt-8 animate-in slide-in-from-bottom-4 w-full">
          <div className="flex items-center justify-between border-b border-white/5 pb-6">
            <h3 className="font-bold text-white text-xl flex items-center gap-2"><CheckCircle2 className="text-green-400" size={24} /> Result Generated</h3>
            <button onClick={() => { navigator.clipboard.writeText(result); showNotification('คัดลอกข้อความแล้ว'); }} className="text-gray-400 hover:text-white px-4 py-2 rounded-xl hover:bg-white/10 transition-colors flex items-center gap-2 font-medium">
              <Copy size={18} /> คัดลอกเนื้อหา
            </button>
          </div>
          <div className="whitespace-pre-wrap text-gray-300 leading-relaxed text-lg pt-4 custom-scrollbar">
            {result}
          </div>
        </div>
      )}

      <div className="mt-12 w-full">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold text-gray-200 flex items-center gap-2"><Database size={20} className="text-purple-400" /> Content Assets Library</h3>
          {isLoadingCopies && <Loader2 size={20} className="animate-spin text-gray-500" />}
        </div>

        {authError === 'auth/configuration-not-found' ? (
             <div className="text-center py-8 bg-red-500/10 border border-red-500/20 rounded-[2rem] text-red-400 text-sm">ไม่สามารถเชื่อมต่อ Cloud ได้ (Authentication Error) โปรดตั้งค่า Firebase</div>
        ) : savedCopies.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
            {savedCopies.map((copy) => (
              <div key={copy.id} className="bg-[#15161c] border border-white/10 rounded-[2rem] p-6 shadow-xl flex flex-col group relative hover:border-purple-500/30 transition-colors">
                 <div className="flex justify-between items-start mb-4 border-b border-white/5 pb-4">
                    <div className="flex items-center gap-3">
                       {copy.imageUrl ? (
                         <img src={copy.imageUrl} alt="ref" className="w-12 h-12 rounded-xl object-cover border border-white/10" />
                       ) : (
                         <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400"><PenTool size={20}/></div>
                       )}
                       <div className="text-xs text-gray-500 line-clamp-2 flex-1 max-w-[200px]">{copy.prompt}</div>
                    </div>
                    <div className="flex gap-2">
                       <button onClick={() => { navigator.clipboard.writeText(copy.content); showNotification('คัดลอกเนื้อหาแล้ว'); }} className="p-2 bg-white/5 hover:bg-white/10 text-gray-300 rounded-lg transition-colors"><Copy size={16}/></button>
                       <button onClick={() => handleDeleteCopy(copy.id)} className="p-2 bg-white/5 hover:bg-red-500/20 text-gray-500 hover:text-red-400 rounded-lg transition-colors"><Trash2 size={16}/></button>
                    </div>
                 </div>
                 <div className="whitespace-pre-wrap text-sm text-gray-300 leading-relaxed custom-scrollbar overflow-y-auto max-h-48">
                    {copy.content}
                 </div>
              </div>
            ))}
          </div>
        ) : (
          !isLoadingCopies && (
            <div className="text-center py-12 bg-[#15161c] border border-white/5 rounded-[2rem] text-gray-500 w-full">
              <PenTool size={48} className="mx-auto mb-4 text-purple-500/40" />
              <p className="font-medium text-gray-400">ยังไม่มีคอนเทนต์ที่บันทึกไว้</p>
              <p className="text-sm mt-1">เริ่มสร้าง Content Copy แรกของคุณเพื่อเก็บเข้าคลัง</p>
            </div>
          )
        )}
      </div>
    </div>
  );
}

// ----------------------------------------------------------------------
// Section: Dashboard
// ----------------------------------------------------------------------
function Dashboard() {
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700 w-full">
      <header className="space-y-2">
        <h2 className="text-4xl font-bold text-white tracking-tight">Overview <span className="text-gray-500 font-light">/ This Week</span></h2>
        <p className="text-gray-400 text-lg">ติดตามสถานะงานและผลลัพธ์ที่สร้างสรรค์โดย AI</p>
      </header>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6 w-full">
        <div className="xl:col-span-2 bg-[#15161c] p-8 rounded-[2rem] border border-white/5 shadow-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl -mr-20 -mt-20 transition-all group-hover:bg-blue-500/20"></div>
          <div className="relative z-10">
            <div className="w-14 h-14 bg-blue-500/20 text-blue-400 rounded-2xl flex items-center justify-center mb-6"><Trello size={28} /></div>
            <p className="text-gray-400 font-medium mb-1">Active Projects</p>
            <p className="text-6xl font-black text-white">12</p>
            <div className="mt-6 flex gap-2"><span className="text-xs font-semibold px-3 py-1 bg-green-500/20 text-green-400 rounded-full">+3 this week</span></div>
          </div>
        </div>

        <div className="xl:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-6 w-full">
          <StatCard title="AI Copies" value="45" icon={<PenTool size={24} />} color="purple" trend="+12" />
          <StatCard title="AI Assets (Cloud)" value="128" icon={<Cloud size={24} />} color="pink" trend="+40" />
          <div className="sm:col-span-2 bg-gradient-to-r from-[#15161c] to-[#1a1b23] p-6 rounded-[2rem] border border-white/5 shadow-2xl flex items-center justify-between">
             <div>
                <p className="text-gray-400 font-medium text-sm mb-1">Cloud Storage Used</p>
                <div className="flex items-baseline gap-2"><p className="text-2xl font-bold text-white">4.2</p><p className="text-sm text-gray-500">GB / 10 GB</p></div>
             </div>
             <div className="w-24 h-2 bg-white/10 rounded-full overflow-hidden"><div className="h-full bg-gradient-to-r from-blue-500 to-pink-500 w-[42%]"></div></div>
          </div>
        </div>

        <div className="xl:col-span-4 bg-[#15161c] p-8 rounded-[2rem] border border-white/5 shadow-2xl w-full">
          <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2"><Sparkles size={20} className="text-yellow-500" /> Recent Activities</h3>
          <div className="space-y-1 w-full">
            <ActivityRow user="Som O." action="used AI Campaign Director" project="New Launch" time="5 mins ago" />
            <ActivityRow user="Ek" action="saved an ad campaign to cloud" project="9.9 Sale" time="1 hour ago" />
            <ActivityRow user="Som O." action="wrote social captions" project="Monthly Promo" time="2 hours ago" />
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon, color, trend }) {
  const colors = { purple: 'bg-purple-500/20 text-purple-400', pink: 'bg-pink-500/20 text-pink-400', blue: 'bg-blue-500/20 text-blue-400' };
  return (
    <div className="bg-[#15161c] p-6 rounded-[2rem] border border-white/5 shadow-2xl relative overflow-hidden group w-full">
      <div className={`absolute -bottom-10 -right-10 w-32 h-32 ${colors[color].split(' ')[0]} rounded-full blur-2xl transition-all group-hover:scale-150 opacity-50`}></div>
      <div className="relative z-10">
        <div className="flex justify-between items-start mb-4">
          <div className={`w-12 h-12 ${colors[color]} rounded-2xl flex items-center justify-center`}>{icon}</div>
          <span className="text-xs font-semibold px-2 py-1 bg-white/5 text-gray-300 rounded-lg">{trend}</span>
        </div>
        <p className="text-4xl font-black text-white mb-1">{value}</p>
        <p className="text-gray-400 text-sm font-medium">{title}</p>
      </div>
    </div>
  );
}

function ActivityRow({ user, action, project, time }) {
  return (
    <div className="flex items-center justify-between py-4 border-b border-white/5 last:border-0 hover:bg-white/[0.02] -mx-4 px-4 rounded-2xl transition-colors w-full">
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-sm font-bold text-white border border-white/5">{user.charAt(0)}</div>
        <div>
          <p className="text-sm text-gray-300"><span className="font-bold text-white">{user}</span> {action}</p>
          <p className="text-xs text-gray-500 font-medium mt-0.5">Project: {project}</p>
        </div>
      </div>
      <span className="text-xs font-medium text-gray-500">{time}</span>
    </div>
  );
}

// ----------------------------------------------------------------------
// Section: Image Studio & Banner Studio (Restored)
// ----------------------------------------------------------------------
function ImageStudio({ showNotification, user, authError, apiKey }) {
  const [prompt, setPrompt] = useState('');
  const [referenceImage, setReferenceImage] = useState(null);
  const [savedImages, setSavedImages] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isLoadingSaved, setIsLoadingSaved] = useState(true);
  const [dbError, setDbError] = useState(null);
  const [isHighConceptMode, setIsHighConceptMode] = useState(false);
  const [isAnalyzingScene, setIsAnalyzingScene] = useState(false);
  const [dynamicPrompts, setDynamicPrompts] = useState([]);
  const [charType, setCharType] = useState('');
  const [charStyle, setCharStyle] = useState('');
  const [charAction, setCharAction] = useState('');
  const [headline, setHeadline] = useState('');
  const [textStyle, setTextStyle] = useState('impact');
  const [isTextEnabled, setIsTextEnabled] = useState(true);
  const [loadingStatus, setLoadingStatus] = useState('');

  useEffect(() => {
    if (!user) return;
    fetchSavedImages();
  }, [user]);

  useEffect(() => {
    setDynamicPrompts([]);
  }, [referenceImage]);

  const fetchSavedImages = async () => {
    setIsLoadingSaved(true);
    setDbError(null);
    try {
      const q = query(collection(db, 'artifacts', appId, 'public', 'data', 'images'), orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      const images = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setSavedImages(images);
    } catch (error) {
      if (error.message && error.message.includes('Missing or insufficient permissions')) {
        setDbError('permission_denied');
      } else {
        showNotification('โหลดภาพที่บันทึกไว้ไม่สำเร็จ', 'error');
      }
    } finally {
      setIsLoadingSaved(false);
    }
  };

  const handleDeleteImage = async (id) => {
    try {
      await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'images', id));
      setSavedImages(prevImages => prevImages.filter(img => img.id !== id));
      showNotification('ลบแคมเปญเรียบร้อยแล้ว', 'success');
    } catch (error) {
      showNotification('ไม่สามารถลบข้อมูลได้ โปรดลองอีกครั้ง', 'error');
    }
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        showNotification('ขนาดไฟล์ภาพต้องไม่เกิน 5MB', 'error');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setReferenceImage(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleBuildCharPrompt = () => {
     let builtPrompt = '';
     if (charType) builtPrompt += charType;
     if (charStyle) builtPrompt += `สไตล์${charStyle} `;
     if (charAction) builtPrompt += `กำลัง${charAction} `;
     builtPrompt += ' (เน้นภาพถ่ายคนจริง สมจริง 100%)';
     setPrompt(builtPrompt);
  };

  const handleAutoAnalyzeScene = async () => {
    if (!apiKey) return showNotification('กรุณาตั้งค่า API Key ด้านบนก่อน', 'error');
    if (!referenceImage) return;
    setIsAnalyzingScene(true);
    setDynamicPrompts([]);

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
    const base64Data = referenceImage.split(',')[1];
    const mimeType = referenceImage.split(';')[0].split(':')[1];

    let promptText = "";
    if (isHighConceptMode) {
      promptText = `ในฐานะ Creative Director สายโฆษณาแบบ High-Concept ระดับโลก:
      1. จงวิเคราะห์ภาพสินค้าที่แนบมานี้ ว่าคืออะไร มีจุดขายหรือฟังก์ชันการทำงานหลักคืออะไร
      2. คิดค้น "ไอเดียจัดฉากแบบเหนือจริง (Surreal / หลุดโลก)" สำหรับสินค้านี้ 3 ไอเดีย โดยนำ 'ตัวละคร (Character)' และ 'แอคชัน (Action)' สุดเฟี้ยว มาจับคู่กับการใช้งานสินค้า เพื่อชูความโดดเด่นของสินค้าให้ดูน่าตื่นตาตื่นใจแบบสุดโต่ง
      3. ส่งผลลัพธ์กลับมาเป็น JSON Array ของ String 3 ข้อเท่านั้น (ภาษาไทย ความยาวข้อละไม่เกิน 2 บรรทัด) ห้ามมีข้อความอื่นปน
      ตัวอย่าง: ["คุณยายวัย 80 สวมชุดนักแข่งรถสีสะท้อนแสง กำลังดริฟต์รถเข็นซุปเปอร์มาร์เก็ตโดยมีสินค้านี้เปล่งประกายอยู่หน้ารถ...", "ชายหนุ่มชุดสูทกำลังกระโดดร่มดิ่งพสุธาลงมาจากอวกาศ พร้อมกับใช้สินค้านี้อย่างสบายใจ..."]`;
    } else {
      promptText = `ในฐานะ Art Director ระดับโลก:
      1. จงวิเคราะห์ภาพสินค้าที่แนบมานี้ ว่าคืออะไร มีลักษณะทางกายภาพอย่างไร (วัสดุ, ขนาด, การใช้งาน)
      2. คิดค้น "ไอเดียการจัดฉาก (Scene/Situation)" สำหรับถ่ายทำโฆษณาสินค้านี้ 3 สถานการณ์ ที่ดึงดูดใจและส่งเสริมจุดเด่นของสินค้านี้ให้มากที่สุดแบบสมจริง
      3. ส่งผลลัพธ์กลับมาเป็น JSON Array ของ String 3 ข้อเท่านั้น (ภาษาไทย ความยาวข้อละไม่เกิน 2 บรรทัด) ห้ามมีข้อความอื่นปน
      ตัวอย่าง: ["ภาพสินค้านี้วางอยู่บนโต๊ะไม้ริมหน้าต่างยามเช้า มีแสงแดดอ่อนๆ พาดผ่าน...", "ภาพสินค้านี้กำลังถูกใช้งานโดยหญิงสาวในฟิตเนส มีเหงื่อเล็กน้อยดูสมจริง..."]`;
    }

    const payload = { contents: [{ parts: [{ text: promptText }, { inlineData: { mimeType, data: base64Data } }] }] };

    try {
      const data = await fetchWithRetry(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (text) {
        const jsonMatch = text.match(/\[([\s\S]*?)\]/);
        if (jsonMatch) {
          const suggestions = JSON.parse(jsonMatch[0]);
          setDynamicPrompts(suggestions);
          showNotification(isHighConceptMode ? 'วิเคราะห์และคิดไอเดียสุดเฟี้ยวสำเร็จ!' : 'วิเคราะห์และแนะนำฉากสำเร็จ!', 'success');
        } else {
          throw new Error("รูปแบบข้อมูลผิดพลาด");
        }
      }
    } catch (error) {
      showNotification('ไม่สามารถวิเคราะห์ฉากได้ ลองอีกครั้ง', 'error');
    } finally {
      setIsAnalyzingScene(false);
    }
  };

  const handleGenerate = async () => {
    if (!apiKey) return showNotification('กรุณาตั้งค่า API Key ด้านบนก่อน', 'error');
    if (!prompt.trim() || !user) return;
    setIsGenerating(true);
    setLoadingStatus('🔍 AI กำลังวิเคราะห์สินค้าและประมวลผลคำสั่ง...');

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image-preview:generateContent?key=${apiKey}`;
    
    let modeInstructions = `Create a photorealistic, high-end commercial product photography image. Do NOT create 3D renders, vector art, flat design, or illustrations. The image must look like a real photo taken with a high-quality DSLR camera (8k resolution, raw photo). Soft natural lighting, realistic textures, and a professional studio depth of field. Ensure no text, no gibberish, no logos, no typography, and no watermarks anywhere in the image. Keep it perfectly clean.`;
    
    if (isHighConceptMode) {
      modeInstructions = `Create a surreal, hyper-creative, high-concept advertising image. The CONCEPTS and situations can be exaggerated, impossible, and highly dynamic, BUT the VISUAL EXECUTION MUST BE 100% PHOTOREALISTIC. It must look like a real, high-budget live-action photograph taken with a DSLR camera (8k resolution, raw photo). Absolutely NO 3D renders, NO cartoons, NO illustrations, and NO AI-looking plastic skin. Use real human features, real-world textures, real physics lighting, and natural cinematic photography styles.`;
    }

    if (!isTextEnabled) {
       modeInstructions += ` STRICTLY NO TEXT IN THE IMAGE.`;
    } else if (isHighConceptMode && headline) {
       modeInstructions += ` Integrate the text "${headline}" seamlessly into the image environment if possible.`;
    }

    const enhancedPrompt = `You are a world-class commercial photographer and Art Director. 
    Analyze the provided product image carefully (understand its material, scale, and intended use).
    USER CONCEPT/SITUATION: "${prompt}"
    CRITICAL INSTRUCTION: Do not just paste the product. ADAPT the user's concept to physically and logically suit the product perfectly. 
    Ensure the lighting, shadows, and environment interact seamlessly with the product's shape and material. If the user's situation is unusual for the product, creatively bridge the gap so it looks like a masterpiece advertisement.
    STYLE REQUIREMENT: ${modeInstructions}`;

    const parts = [{ text: enhancedPrompt }];

    if (referenceImage) {
      const base64Data = referenceImage.split(',')[1];
      const mimeType = referenceImage.split(';')[0].split(':')[1];
      parts.push({ inlineData: { mimeType, data: base64Data } });
    }

    const imagePayload = { contents: [{ parts }], generationConfig: { responseModalities: ['IMAGE'] } };

    try {
      setLoadingStatus('🎨 AI กำลังจัดฉากและสร้างภาพ Performance Ad...');
      const imageData = await fetchWithRetry(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(imagePayload) });
      const base64Output = imageData.candidates?.[0]?.content?.parts?.find(p => p.inlineData)?.inlineData?.data;
      
      if (!base64Output) {
        const finishReason = imageData.candidates?.[0]?.finishReason;
        if (finishReason === 'IMAGE_SAFETY' || finishReason === 'SAFETY') throw new Error('AI ปฏิเสธการสร้างภาพเนื่องจากติดฟิลเตอร์ความปลอดภัย (เนื้อหาอาจอันตราย หรือล่อแหลมเกินไป) โปรดปรับเปลี่ยนคำสั่งใหม่ครับ');
        throw new Error(`ไม่พบรูปภาพ (Unknown API Error)`);
      }

      setLoadingStatus('✍️ AI กำลังเขียนแคปชั่นโฆษณา...');
      
      const textUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
      const textPrompt = `You are an expert Copywriter. Write a highly engaging social media caption for this advertisement concept: "${prompt}". 
      1. Provide the caption in THAI language first.
      2. Provide the exact same captivating caption in ENGLISH language below it.
      3. Conclude the text with 10-15 highly relevant, SEO-optimized trending hashtags (mixed Thai and English). 
      Format the response clearly with nice emojis.`;
      
      const textParts = [{ text: textPrompt }];
      if (referenceImage) {
        const base64Data = referenceImage.split(',')[1];
        const mimeType = referenceImage.split(';')[0].split(':')[1];
        textParts.push({ inlineData: { mimeType, data: base64Data } });
      }

      const textPayload = { contents: [{ parts: textParts }] };
      let generatedCaption = isHighConceptMode ? `แคมเปญใหม่สุดเฟี้ยว! 🔥 เตรียมพบกับไอเดียสุดล้ำ #CreativeAd #HighConcept` : `พร้อมสำหรับโพสต์! 🚀✨ #แคมเปญใหม่`;
      
      try {
        const textData = await fetchWithRetry(textUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(textPayload) });
        const text = textData.candidates?.[0]?.content?.parts?.find(p => p.text)?.text;
        if (text) generatedCaption = text;
      } catch (textErr) {}

      setLoadingStatus('☁️ กำลังเตรียมผลลัพธ์...');
      const imageUrl = `data:image/png;base64,${base64Output}`;

      const newImage = {
        id: Date.now().toString(),
        url: imageUrl,
        caption: generatedCaption,
        prompt: prompt,
        mode: isHighConceptMode ? 'High-Concept' : 'Standard',
        headline: headline,
        textStyle: textStyle,
        createdAt: new Date()
      };
      setSavedImages(prev => [newImage, ...prev]);

      setLoadingStatus('💾 กำลังบันทึกลง Cloud...');
      try {
        await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'images'), {
          url: imageUrl,
          caption: generatedCaption,
          prompt: prompt,
          mode: isHighConceptMode ? 'High-Concept' : 'Standard',
          headline: headline,
          textStyle: textStyle,
          createdAt: serverTimestamp()
        });
        showNotification('สร้างและบันทึกภาพโฆษณาสำเร็จ!');
      } catch (firestoreError) {
         if (firestoreError.code === 'resource-exhausted' || (firestoreError.message && firestoreError.message.includes('longer than'))) {
            showNotification('สร้างภาพสำเร็จ! แต่ไฟล์ใหญ่เกิน 1MB ฐานข้อมูลจึงไม่บันทึก (กดโหลดเก็บได้)', 'error');
         } else {
            showNotification('สร้างภาพสำเร็จ! แต่เกิดข้อผิดพลาดในการบันทึกลง Cloud', 'error');
         }
      }
    } catch (error) {
      const errMsg = error.message || 'Unknown error';
      if (errMsg.includes('Missing or insufficient permissions')) {
         setDbError('permission_denied');
         showNotification('สร้างภาพสำเร็จ แต่ไม่สามารถบันทึกลง Cloud ได้ (ติดสิทธิ์ Firebase)', 'error');
      } else {
         showNotification(errMsg, 'error');
      }
    } finally {
      setIsGenerating(false);
      setLoadingStatus('');
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700 w-full">
      <header className="space-y-2 w-full flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-pink-500/10 text-pink-400 rounded-full border border-pink-500/20 text-sm font-medium mb-4">
            <Sparkles size={14} /> {isHighConceptMode ? 'High-Concept Creative Ad' : 'Product-to-Ad Generator'}
          </div>
          <h2 className="text-4xl font-bold text-white">Ad & Image Studio</h2>
          <p className="text-gray-400 text-lg">
            {isHighConceptMode 
              ? 'สร้างภาพโฆษณาสุดเหนือจริง ไอเดียหลุดโลก ดึงดูดสายตาขั้นสุดแบบ Commercial Banner' 
              : 'อัปโหลดภาพสินค้า และบอก AI ว่าอยากได้ภาพถ่ายแบบไหน ระบบจะสร้างภาพที่สมจริง'}
          </p>
        </div>
        
        <div className="flex items-center gap-2 bg-white/5 p-1.5 rounded-xl border border-white/10 shrink-0 w-full md:w-auto">
          <button onClick={() => setIsHighConceptMode(false)} className={`flex-1 md:flex-none px-4 py-2 rounded-lg text-sm font-bold transition-all ${!isHighConceptMode ? 'bg-pink-500 text-white shadow-lg' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}>ภาพสมจริง</button>
          <button onClick={() => setIsHighConceptMode(true)} className={`flex-1 md:flex-none px-4 py-2 rounded-lg text-sm font-bold transition-all ${isHighConceptMode ? 'bg-orange-500 text-white shadow-lg' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}>สุดเฟี้ยว 🚀</button>
        </div>
      </header>

      <div className="relative group w-full">
        <div className={`absolute -inset-0.5 rounded-[2rem] blur opacity-20 group-hover:opacity-40 transition duration-500 ${isHighConceptMode ? 'bg-gradient-to-r from-orange-500 to-yellow-400' : 'bg-gradient-to-r from-pink-500 to-orange-400'}`}></div>
        <div className={`relative bg-[#15161c] p-6 rounded-[2rem] shadow-2xl flex flex-col gap-4 w-full border ${isHighConceptMode ? 'border-orange-500/30' : 'border-white/10'}`}>
          <div className="flex flex-col md:flex-row gap-4 w-full">
            <div className="w-full md:w-1/3 h-48 border-2 border-dashed border-white/20 rounded-xl flex items-center justify-center relative overflow-hidden bg-black/20 hover:bg-white/5 transition-colors group/upload shrink-0">
              {referenceImage ? (
                <>
                  <img src={referenceImage} alt="Reference" className="w-full h-full object-contain p-2" />
                  <button onClick={() => setReferenceImage(null)} className="absolute top-2 right-2 bg-black/50 text-white p-1.5 rounded-lg hover:bg-red-500/80 transition-colors"><X size={16} /></button>
                  <div className="absolute bottom-2 left-2 right-2">
                    <button onClick={handleAutoAnalyzeScene} disabled={isAnalyzingScene} className={`w-full text-white text-xs font-bold py-2 px-2 rounded-lg backdrop-blur-md transition-colors shadow-lg flex justify-center items-center gap-1.5 ${isHighConceptMode ? 'bg-orange-500/80 hover:bg-orange-500' : 'bg-pink-500/80 hover:bg-pink-500'}`}>
                      {isAnalyzingScene ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
                      {isAnalyzingScene ? 'กำลังสแกนสินค้า...' : (isHighConceptMode ? '🪄 ให้ AI คิดไอเดียสุดเฟี้ยว' : '🪄 ให้ AI แนะนำฉาก')}
                    </button>
                  </div>
                </>
              ) : (
                <label className="flex flex-col items-center justify-center w-full h-full cursor-pointer text-gray-400 hover:text-white transition-colors">
                  <Upload size={24} className="mb-2 group-hover/upload:-translate-y-1 transition-transform" />
                  <span className="text-sm font-medium">อัปโหลดภาพสินค้า</span>
                  <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                </label>
              )}
            </div>

            <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder="บอก AI ว่าอยากให้สินค้าอยู่ในสถานการณ์ไหน..." className="flex-1 h-48 p-4 bg-white/5 text-gray-200 placeholder:text-gray-500 focus:outline-none focus:ring-1 focus:ring-pink-500/50 rounded-xl resize-none text-base custom-scrollbar border border-white/5 w-full"/>
          </div>

          <div className="flex flex-col gap-2 mt-2 w-full">
            <span className="text-sm text-gray-400 flex items-center"><Sparkles size={14} className="mr-1.5 text-pink-400" /> {dynamicPrompts.length > 0 ? 'ไอเดียที่เหมาะสมกับสินค้านี้:' : 'ตัวช่วยคำสั่งด่วน:'}</span>
            <div className="flex flex-wrap gap-2">
              {dynamicPrompts.length > 0 ? (
                dynamicPrompts.map((dynPrompt, idx) => (
                  <button key={idx} onClick={() => setPrompt(dynPrompt)} className="text-xs px-3 py-2 bg-pink-500/10 hover:bg-pink-500/30 text-pink-300 border border-pink-500/20 rounded-lg transition-colors text-left flex-1 min-w-[250px]">💡 {dynPrompt}</button>
                ))
              ) : (
                <>
                  {!isHighConceptMode && (
                    <>
                      <button onClick={() => setPrompt("ภาพถ่ายจริง (Real Photograph) ที่ 'เน้นการใช้งานจริง (In-use context)' ในสภาพแสงธรรมชาติที่สวยงาม ให้เห็นบรรยากาศขณะกำลังใช้งานอย่างสมจริงที่สุด ไม่ดูเป็นภาพกราฟิก")} className="text-xs px-3 py-1.5 bg-indigo-500/10 hover:bg-indigo-500/30 text-indigo-300 border border-indigo-500/20 rounded-lg transition-colors">📸 ขณะใช้งานจริง (Real-life In-Use)</button>
                      <button onClick={() => setPrompt("ภาพถ่ายสินค้าสไตล์ 'Professional Studio' วางบนแท่นโชว์ เล่นแสงเงาธรรมชาติ (Natural Shadows) ให้ดูมีมิติและหรูหราสมจริง โฟกัสคมชัดที่ตัวสินค้า")} className="text-xs px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/20 rounded-lg transition-colors">✨ สตูดิโอสมจริง (Realistic Studio)</button>
                    </>
                  )}
                  {isHighConceptMode && (
                    <div className="w-full mt-2 bg-black/20 p-4 rounded-xl border border-orange-500/20">
                     <p className="text-xs font-bold text-orange-400 mb-3 flex items-center gap-1"><Sparkles size={14}/> ระบบช่วยแต่งคำสั่งสุดเฟี้ยว</p>
                     <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
                        <select value={charType} onChange={e=>setCharType(e.target.value)} className="bg-black/40 border border-white/10 text-gray-200 rounded-lg p-2.5 text-sm focus:border-orange-500/50 outline-none"><option value="">👤 เลือกตัวละครหลัก</option><option value="ผู้ชายวัยทำงาน">ผู้ชายวัยทำงาน</option><option value="ผู้หญิงวัยทำงาน">ผู้หญิงวัยทำงาน</option></select>
                        <select value={charStyle} onChange={e=>setCharStyle(e.target.value)} className="bg-black/40 border border-white/10 text-gray-200 rounded-lg p-2.5 text-sm focus:border-orange-500/50 outline-none"><option value="">🏋️ ความชอบ/ไลฟ์สไตล์</option><option value="นักกีฬา/นักออกกำลังกาย">นักกีฬา/นักออกกำลังกาย</option><option value="สายรักสุขภาพ/ดูแลตัวเอง">สายรักสุขภาพ/ดูแลตัวเอง</option></select>
                        <select value={charAction} onChange={e=>setCharAction(e.target.value)} className="bg-black/40 border border-white/10 text-gray-200 rounded-lg p-2.5 text-sm focus:border-orange-500/50 outline-none"><option value="">🎬 แอคชันหลุดโลก</option><option value="กระโดดร่มลงมาจากฟ้า">กระโดดร่มลงมาจากฟ้า</option><option value="ขี่จรวดพุ่งสู่อวกาศ">ขี่จรวดพุ่งสู่อวกาศ</option></select>
                     </div>
                     <button onClick={handleBuildCharPrompt} className="w-full bg-orange-500/20 hover:bg-orange-500/30 text-orange-400 border border-orange-500/40 py-2.5 rounded-lg text-sm font-bold transition-colors flex justify-center items-center gap-2"><Plus size={16}/> นำตัวละครไปสร้างเป็นคำสั่ง</button>
                  </div>
                  )}
                </>
              )}
            </div>
          </div>

          <div className="flex justify-between items-center pt-4 border-t border-white/5 mt-2 w-full">
            <p className="text-xs text-gray-500 flex items-center gap-1"><Database size={12} className="text-blue-400" /> ภาพจะถูกบันทึกลง Cloud อัตโนมัติ</p>
            <button onClick={handleGenerate} disabled={isGenerating || !prompt.trim() || authError === 'auth/configuration-not-found'} className={`flex items-center justify-center gap-2 text-white px-8 py-3 rounded-xl font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg ${isHighConceptMode ? 'bg-gradient-to-r from-orange-600 to-yellow-500 hover:from-orange-500 hover:to-yellow-400' : 'bg-gradient-to-r from-pink-600 to-orange-500 hover:from-pink-500 hover:to-orange-400'}`}>
              {isGenerating ? <Loader2 size={20} className="animate-spin" /> : <Sparkles size={20} />}
              {isGenerating ? (loadingStatus || 'กำลังสร้าง...') : (isHighConceptMode ? 'Generate High-Concept Ad' : 'Generate & Save Ad')}
            </button>
          </div>
        </div>
      </div>

      <div className="mt-12 w-full">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold text-gray-200 flex items-center gap-2"><Cloud size={20} className="text-blue-400" /> Saved Ad Campaigns</h3>
          {isLoadingSaved && !authError && <Loader2 size={20} className="animate-spin text-gray-500" />}
        </div>
        
        {authError === 'auth/configuration-not-found' ? (
           <div className="bg-red-500/10 border border-red-500/20 p-8 rounded-[2rem] text-red-200 shadow-2xl w-full">
           <h4 className="font-bold text-xl mb-3 flex items-center gap-2 text-red-400"><AlertCircle size={24} /> จำเป็นต้องเปิดใช้งานระบบ Authentication</h4>
         </div>
        ) : dbError === 'permission_denied' ? (
          <div className="bg-red-500/10 border border-red-500/20 p-8 rounded-[2rem] text-red-200 shadow-2xl w-full">
             <h4 className="font-bold text-xl mb-3 flex items-center gap-2 text-red-400"><AlertCircle size={24} /> จำเป็นต้องตั้งค่า Firebase Security Rules</h4>
          </div>
        ) : savedImages.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 w-full">
            {savedImages.map((image) => (
              <div key={image.id} className={`bg-[#15161c] border rounded-[2rem] overflow-hidden shadow-2xl flex flex-col w-full relative ${image.mode === 'High-Concept' ? 'border-orange-500/30' : 'border-white/10'}`}>
                {image.mode === 'High-Concept' && <div className="absolute top-0 left-1/2 transform -translate-x-1/2 bg-orange-500 text-white text-[10px] font-bold px-3 py-1 rounded-b-lg z-20">HIGH-CONCEPT</div>}
                <div className="relative aspect-square w-full border-b border-white/10 bg-black/50 group/img overflow-hidden">
                  <img src={image.url} alt={image.prompt} className="w-full h-full object-cover" />
                  <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover/img:opacity-100 transition-opacity z-30">
                    <button onClick={() => handleDeleteImage(image.id)} className="p-2 bg-black/60 hover:bg-red-500/80 text-white rounded-xl backdrop-blur-md transition-colors"><X size={16} /></button>
                    <a href={image.url} download={`ad-campaign-${image.id}.png`} className="flex items-center gap-2 bg-black/60 hover:bg-black/80 text-white px-4 py-2 rounded-xl backdrop-blur-md border border-white/10 transition-all font-medium text-sm"><Download size={16} /> โหลด</a>
                  </div>
                </div>
                <div className="p-6 flex-1 flex flex-col">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-sm font-semibold text-pink-400 flex items-center gap-2"><PenTool size={16} /> แคปชั่นสำหรับโพสต์</h4>
                    <button onClick={() => { navigator.clipboard.writeText(image.caption); showNotification('คัดลอกแคปชั่นแล้ว'); }} className="text-gray-400 hover:text-white p-2 hover:bg-white/10 rounded-lg transition-colors flex items-center gap-2 text-xs font-medium"><Copy size={14} /> คัดลอก</button>
                  </div>
                  <div className="bg-black/30 p-4 rounded-xl border border-white/5 flex-1 custom-scrollbar overflow-y-auto max-h-48 text-gray-300 text-sm leading-relaxed whitespace-pre-wrap">
                    {image.caption}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          !isLoadingSaved && (
            <div className="text-center py-12 bg-[#15161c] border border-white/5 rounded-[2rem] text-gray-500 w-full">
              <Database size={48} className="mx-auto mb-4 text-gray-600" />
              <p>ยังไม่มีภาพที่บันทึกไว้ เริ่มสร้างภาพแรกของคุณเลย!</p>
            </div>
          )
        )}
      </div>
    </div>
  );
}

function BannerStudio({ showNotification, apiKey }) {
  const [refImage, setRefImage] = useState(null);
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [bgImage, setBgImage] = useState(null);
  const [texts, setTexts] = useState({ headline: 'หัวข้อโปรโมชั่น', subhead: 'รายละเอียดสินค้า (Sub-headline)' });
  const [textSettings, setTextSettings] = useState({ color: '#ffffff', align: 'center', vAlign: 'center' });

  const handleUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setRefImage(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleGenerate = async () => {
    if (!apiKey) return showNotification('กรุณาตั้งค่า API Key ด้านบนก่อน', 'error');
    if (!prompt.trim() || !refImage) return showNotification('กรุณาอัปโหลดภาพและใส่บรีฟ', 'error');
    setIsGenerating(true);
    
    try {
      const textUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`;
      const textPrompt = `วิเคราะห์ภาพสินค้านี้ และบรีฟ: "${prompt}". กรุณาเขียนข้อความโฆษณา 2 บรรทัด. บรรทัดที่ 1: หัวข้อโปรโมชั่น (ภาษาไทย สั้นๆ น่าสนใจ). บรรทัดที่ 2: รายละเอียด (ภาษาอังกฤษ สั้นๆ). ให้ตอบกลับมาเป็น JSON format: {"headline": "...", "subhead": "..."}`;
      const textRes = await fetchWithRetry(textUrl, { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ contents: [{ parts: [{ text: textPrompt }, { inlineData: { mimeType: refImage.split(';')[0].split(':')[1], data: refImage.split(',')[1] } }]}] }) });
      const rawText = textRes.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
      let generatedTexts = { headline: 'PROMOTION', subhead: 'Special Offer' };
      try { generatedTexts = JSON.parse(rawText.replace(/```json/g, '').replace(/```/g, '').trim()); } catch(e) {}
      setTexts(generatedTexts);

      const imageUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image-preview:generateContent?key=${apiKey}`;
      const imagePrompt = `Create a clean, empty background canvas for an advertisement or infographic based on this brief: ${prompt}. Integrate the reference product. Ensure there is plenty of negative space (empty area) in the center or top to overlay text later. Do NOT write any text.`;
      const imageRes = await fetchWithRetry(imageUrl, { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ contents: [{ parts: [{ text: imagePrompt }, { inlineData: { mimeType: refImage.split(';')[0].split(':')[1], data: refImage.split(',')[1] } }]}], generationConfig: { responseModalities: ['IMAGE'] } }) });
      const base64 = imageRes.candidates?.[0]?.content?.parts?.find(p => p.inlineData)?.inlineData?.data;
      
      if (base64) setBgImage(`data:image/png;base64,${base64}`);
      else throw new Error('Failed to generate image');
      showNotification('สร้างแบนเนอร์สำเร็จ! ปรับแต่งข้อความได้เลย');
    } catch (error) { showNotification('เกิดข้อผิดพลาดในการสร้าง', 'error'); } 
    finally { setIsGenerating(false); }
  };

  const downloadCanvas = () => {
    if (!bgImage) return;
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.src = bgImage;
    img.onload = () => {
      canvas.width = img.width; canvas.height = img.height;
      ctx.drawImage(img, 0, 0);
      ctx.fillStyle = textSettings.color; ctx.textAlign = textSettings.align;
      ctx.shadowColor = 'rgba(0,0,0,0.5)'; ctx.shadowBlur = 10;
      let x = canvas.width / 2; if (textSettings.align === 'left') x = 50; if (textSettings.align === 'right') x = canvas.width - 50;
      let y = canvas.height / 2; if (textSettings.vAlign === 'top') y = 150; if (textSettings.vAlign === 'bottom') y = canvas.height - 150;
      ctx.font = 'bold 80px sans-serif'; ctx.fillText(texts.headline, x, y);
      ctx.font = '40px sans-serif'; ctx.fillText(texts.subhead, x, y + 80);
      const link = document.createElement('a'); link.download = 'promo-banner.png'; link.href = canvas.toDataURL(); link.click();
    };
  };

  return (
    <div className="space-y-8 animate-in fade-in w-full">
      <header className="space-y-2">
        <h2 className="text-4xl font-bold text-white flex items-center gap-3"><Layers className="text-purple-500"/> Promo & Banner Studio</h2>
        <p className="text-gray-400">อัปโหลดภาพสินค้า ให้ AI วิเคราะห์คิดคำโปรโมชั่น และสร้างภาพฉากหลังพร้อมพิมพ์ตัวหนังสือทับให้ถูกต้อง 100%</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 w-full">
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-[#15161c] p-6 rounded-[2rem] border border-white/5 shadow-2xl">
            <h3 className="font-semibold text-white mb-4">1. ภาพสินค้า (Reference)</h3>
            <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-white/20 rounded-xl cursor-pointer hover:bg-white/5 relative overflow-hidden">
              {refImage ? <img src={refImage} alt="Ref" className="h-full object-contain p-2"/> : <><Upload className="mb-2 text-gray-400"/><span className="text-sm text-gray-400">อัปโหลดภาพ</span></>}
              <input type="file" className="hidden" onChange={handleUpload} accept="image/*"/>
            </label>
            <h3 className="font-semibold text-white mt-6 mb-2">2. บรีฟงาน (Brief)</h3>
            <textarea value={prompt} onChange={(e)=>setPrompt(e.target.value)} placeholder="เช่น: ทำแบนเนอร์โปร 1 แถม 1 โทนสีทองหรูหรา..." className="w-full h-24 p-3 bg-white/5 text-gray-200 rounded-xl text-sm border border-white/5 resize-none"/>
            <button onClick={handleGenerate} disabled={isGenerating || !refImage || !prompt} className="w-full mt-4 bg-gradient-to-r from-purple-600 to-blue-500 hover:from-purple-500 hover:to-blue-400 text-white py-3 rounded-xl font-bold flex justify-center items-center gap-2">
              {isGenerating ? <Loader2 className="animate-spin"/> : <Sparkles/>} เจนภาพ & ข้อความ
            </button>
          </div>
          {bgImage && (
            <div className="bg-[#15161c] p-6 rounded-[2rem] border border-white/5 shadow-2xl space-y-4 animate-in fade-in">
              <h3 className="font-semibold text-white flex items-center gap-2"><Sliders size={18}/> ปรับแต่งข้อความ</h3>
              <div className="flex gap-2">
                <input type="color" value={textSettings.color} onChange={(e)=>setTextSettings({...textSettings, color: e.target.value})} className="w-10 h-10 rounded cursor-pointer bg-transparent border-0"/>
                <div className="flex bg-white/5 rounded-lg p-1">
                  <button onClick={()=>setTextSettings({...textSettings, align: 'left'})} className={`p-2 rounded ${textSettings.align==='left'?'bg-white/10':''}`}><AlignLeft size={16} className="text-white"/></button>
                  <button onClick={()=>setTextSettings({...textSettings, align: 'center'})} className={`p-2 rounded ${textSettings.align==='center'?'bg-white/10':''}`}><AlignCenter size={16} className="text-white"/></button>
                  <button onClick={()=>setTextSettings({...textSettings, align: 'right'})} className={`p-2 rounded ${textSettings.align==='right'?'bg-white/10':''}`}><AlignRight size={16} className="text-white"/></button>
                </div>
              </div>
              <select value={textSettings.vAlign} onChange={(e)=>setTextSettings({...textSettings, vAlign: e.target.value})} className="w-full bg-[#15161c] border border-white/10 text-white rounded-lg p-2 text-sm">
                <option value="top">วางด้านบน</option><option value="center">วางตรงกลาง</option><option value="bottom">วางด้านล่าง</option>
              </select>
              <button onClick={downloadCanvas} className="w-full bg-white/10 hover:bg-white/20 text-white py-3 rounded-xl font-bold flex justify-center items-center gap-2 mt-4"><Download size={18}/> ดาวน์โหลดแบนเนอร์</button>
            </div>
          )}
        </div>
        <div className="lg:col-span-8">
          <div className="bg-[#15161c] border border-white/5 rounded-[2rem] h-[600px] flex items-center justify-center overflow-hidden relative shadow-2xl">
            {!bgImage && !isGenerating && <div className="text-gray-500 flex flex-col items-center"><ImageIcon size={48} className="mb-4 opacity-50"/>ภาพแบนเนอร์จะแสดงที่นี่</div>}
            {isGenerating && <div className="text-purple-400 flex flex-col items-center animate-pulse"><Loader2 size={48} className="animate-spin mb-4"/>กำลังวิเคราะห์และสร้างภาพ...</div>}
            {bgImage && !isGenerating && (
              <div className="relative w-full h-full">
                <img src={bgImage} alt="Bg" className="w-full h-full object-cover" />
                <div className={`absolute inset-0 flex flex-col p-12 pointer-events-none ${textSettings.vAlign === 'top' ? 'justify-start' : textSettings.vAlign === 'bottom' ? 'justify-end' : 'justify-center'} ${textSettings.align === 'left' ? 'items-start text-left' : textSettings.align === 'right' ? 'items-end text-right' : 'items-center text-center'}`}>
                  <h1 style={{color: textSettings.color, textShadow: '0 4px 12px rgba(0,0,0,0.8)'}} className="text-5xl md:text-7xl font-black mb-4 pointer-events-auto cursor-text outline-none" contentEditable suppressContentEditableWarning onBlur={(e)=>setTexts({...texts, headline: e.target.innerText})}>{texts.headline}</h1>
                  <p style={{color: textSettings.color, textShadow: '0 4px 12px rgba(0,0,0,0.8)'}} className="text-2xl md:text-3xl font-bold opacity-90 pointer-events-auto cursor-text outline-none" contentEditable suppressContentEditableWarning onBlur={(e)=>setTexts({...texts, subhead: e.target.innerText})}>{texts.subhead}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
