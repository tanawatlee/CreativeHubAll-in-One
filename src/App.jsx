import React, { useState, useEffect, Component } from 'react';
import { LayoutDashboard, PenTool, Image as ImageIcon, Trello, Send, Loader2, Download, Copy, CheckCircle2, AlertCircle, Plus, Upload, X, Sparkles, Cloud, Database, RefreshCw } from 'lucide-react';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, collection, addDoc, getDocs, query, orderBy, serverTimestamp } from 'firebase/firestore';
import { getAuth, signInAnonymously, onAuthStateChanged, signInWithCustomToken } from 'firebase/auth';

// --- Firebase Configuration ---
const firebaseConfig = { apiKey: "AIzaSyDSkhGyrcM4E8Dv8n6XG_7AObuAUaZyYoM", authDomain: "creative-hub-all-in-one.firebaseapp.com", projectId: "creative-hub-all-in-one", storageBucket: "creative-hub-all-in-one.firebasestorage.app", messagingSenderId: "1042437402683", appId: "1:1042437402683:web:09f0cfe201d6dd550dac1e", measurementId: "G-JSK9HPSVRQ" };

// ป้องกันหน้าจอขาว (White Screen) จากการที่ Firebase โหลดผิดพลาด
let app, db, auth, appId;
try {
  app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
  db = getFirestore(app);
  auth = getAuth(app);
  appId = firebaseConfig.appId;
} catch (initError) {
  console.error("🔥 Firebase Initialization Error:", initError);
}

// --- API Configuration ---
const apiKey = ""; // API key is injected by the environment

// Helper function for API calls with Exponential Backoff
const fetchWithRetry = async (url, options, retries = 5) => {
  const delays = [1000, 2000, 4000, 8000, 16000];
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url, options);
      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      if (i === retries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, delays[i]));
    }
  }
};

// --- Error Boundary Component (ดักจับ Error ป้องกันหน้าขาว) ---
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex h-screen w-full items-center justify-center bg-[#0a0a0f] p-8 text-gray-200">
          <div className="bg-red-500/10 border border-red-500/20 p-8 rounded-3xl max-w-2xl w-full">
            <h2 className="text-2xl font-bold text-red-400 mb-4 flex items-center gap-2">
              <AlertCircle /> ระบบขัดข้อง (App Crashed)
            </h2>
            <p className="text-gray-300 mb-4">เกิดข้อผิดพลาดบางอย่างในระหว่างการประมวลผล หากคุณเพิ่งแก้ไขโค้ด ลองกดรีเฟรชหน้าต่างเบราว์เซอร์ 1 ครั้ง</p>
            <div className="bg-black/50 p-4 rounded-xl font-mono text-sm text-red-300 overflow-auto">
              {this.state.error?.toString()}
            </div>
            <button 
              onClick={() => window.location.reload()}
              className="mt-6 flex items-center gap-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 px-6 py-3 rounded-xl font-medium transition-colors"
            >
              <RefreshCw size={18} /> โหลดระบบใหม่ (Reload)
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

// --- Main App Component ---
function AppContent() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [notification, setNotification] = useState(null);
  const [user, setUser] = useState(null);
  const [authError, setAuthError] = useState(null);

  useEffect(() => {
    const initAuth = async () => {
      // ป้องกันแอปพังถ้า auth ไม่มีค่า
      if (!auth) {
        setAuthError('firebase-init-failed');
        return;
      }
      
      try {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
          try {
            await signInWithCustomToken(auth, __initial_auth_token);
          } catch (tokenError) {
            console.warn("Token mismatch, falling back to anonymous auth...");
            await signInAnonymously(auth);
          }
        } else {
          await signInAnonymously(auth);
        }
      } catch (error) {
        console.error("Auth error:", error);
        setAuthError(error.code);
      }
    };
    initAuth();
    const unsubscribe = onAuthStateChanged(auth, setUser);
    return () => unsubscribe();
  }, []);

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  return (
    <div className="flex h-screen w-full bg-[#0a0a0f] text-gray-200 font-sans overflow-hidden selection:bg-pink-500/30 selection:text-pink-200">
      <div className="fixed top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-blue-600/20 blur-[120px] pointer-events-none"></div>
      <div className="fixed bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-pink-600/20 blur-[120px] pointer-events-none"></div>

      <aside className="w-72 bg-black/40 backdrop-blur-xl border-r border-white/10 flex flex-col relative z-10 m-4 rounded-[2rem] shadow-2xl shrink-0">
        <div className="p-8">
          <h1 className="text-3xl font-black bg-clip-text text-transparent bg-gradient-to-br from-white via-gray-200 to-gray-500 tracking-tight">
            Creative<span className="text-pink-500">Hub</span>
          </h1>
          <p className="text-xs text-gray-500 mt-2 font-medium tracking-wide uppercase flex items-center gap-1">
            <Cloud size={12} className="text-blue-400" /> Cloud Enabled
          </p>
        </div>
        
        <nav className="flex-1 px-4 space-y-3">
          <NavItem icon={<LayoutDashboard size={20} />} label="Dashboard" isActive={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} />
          <NavItem icon={<PenTool size={20} />} label="AI Copywriter" isActive={activeTab === 'content'} onClick={() => setActiveTab('content')} />
          <NavItem icon={<ImageIcon size={20} />} label="Ad & Image Studio" isActive={activeTab === 'image'} onClick={() => setActiveTab('image')} />
          <NavItem icon={<Trello size={20} />} label="Team Boards" isActive={activeTab === 'workspace'} onClick={() => setActiveTab('workspace')} />
        </nav>

        <div className="p-6 border-t border-white/10 m-4 rounded-2xl bg-white/5 backdrop-blur-md">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-pink-500 to-blue-500 flex items-center justify-center text-white font-bold shadow-lg shadow-pink-500/20">
                You
              </div>
              <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 border-2 border-[#1a1b23] rounded-full"></div>
            </div>
            <div>
              <p className="text-sm font-semibold text-white">Creative Lead</p>
              <p className="text-xs text-gray-400">Online</p>
            </div>
          </div>
        </div>
      </aside>

      <main className="flex-1 overflow-auto relative z-10 p-4 w-full">
        <div className="h-full w-full bg-black/20 backdrop-blur-3xl border border-white/5 rounded-[2.5rem] shadow-2xl overflow-hidden relative">
          
          {notification && (
            <div className={`absolute top-6 right-6 z-50 px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3 text-sm font-medium transition-all animate-in slide-in-from-top-4 backdrop-blur-md border ${
              notification.type === 'error' ? 'bg-red-500/10 text-red-400 border-red-500/20' : 'bg-green-500/10 text-green-400 border-green-500/20'
            }`}>
              {notification.type === 'error' ? <AlertCircle size={18} /> : <CheckCircle2 size={18} />}
              {notification.message}
            </div>
          )}

          <div className="h-full w-full overflow-y-auto custom-scrollbar p-10">
            <div className="w-full h-full">
              {activeTab === 'dashboard' && <Dashboard />}
              {activeTab === 'content' && <ContentGenerator showNotification={showNotification} />}
              {activeTab === 'image' && <ImageStudio showNotification={showNotification} user={user} authError={authError} />}
              {activeTab === 'workspace' && <Workspace />}
            </div>
          </div>
        </div>
      </main>

      {/* Global CSS Override เพื่อบังคับให้แอปใช้พื้นที่ 100% จริงๆ ขจัดค่าเริ่มต้นของ Vite */}
      <style dangerouslySetInnerHTML={{__html: `
        html, body, #root {
          width: 100% !important;
          max-width: none !important;
          margin: 0 !important;
          padding: 0 !important;
          text-align: left !important;
        }
        .custom-scrollbar::-webkit-scrollbar{width:6px;}
        .custom-scrollbar::-webkit-scrollbar-track{background:transparent;}
        .custom-scrollbar::-webkit-scrollbar-thumb{background-color:rgba(255,255,255,0.1);border-radius:20px;}
        .custom-scrollbar::-webkit-scrollbar-thumb:hover{background-color:rgba(255,255,255,0.2);}
      `}} />
    </div>
  );
}

// Export the app wrapped in the Error Boundary
export default function App() {
  return (
    <ErrorBoundary>
      <AppContent />
    </ErrorBoundary>
  );
}

function NavItem({ icon, label, isActive, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all duration-300 text-left font-medium ${
        isActive 
          ? 'bg-white/10 text-white shadow-lg shadow-black/20 border border-white/5 backdrop-blur-md' 
          : 'text-gray-400 hover:bg-white/5 hover:text-gray-200'
      }`}
    >
      <div className={`${isActive ? 'text-pink-400 drop-shadow-[0_0_8px_rgba(244,114,182,0.5)]' : ''}`}>
        {icon}
      </div>
      <span>{label}</span>
      {isActive && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-pink-500 shadow-[0_0_8px_rgba(244,114,182,0.8)]"></div>}
    </button>
  );
}

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
            <div className="w-14 h-14 bg-blue-500/20 text-blue-400 rounded-2xl flex items-center justify-center mb-6">
              <Trello size={28} />
            </div>
            <p className="text-gray-400 font-medium mb-1">Active Projects</p>
            <p className="text-6xl font-black text-white">12</p>
            <div className="mt-6 flex gap-2">
              <span className="text-xs font-semibold px-3 py-1 bg-green-500/20 text-green-400 rounded-full">+3 this week</span>
            </div>
          </div>
        </div>

        <div className="xl:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-6 w-full">
          <StatCard title="AI Copies" value="45" icon={<PenTool size={24} />} color="purple" trend="+12" />
          <StatCard title="AI Assets (Cloud)" value="128" icon={<Cloud size={24} />} color="pink" trend="+40" />
          
          <div className="sm:col-span-2 bg-gradient-to-r from-[#15161c] to-[#1a1b23] p-6 rounded-[2rem] border border-white/5 shadow-2xl flex items-center justify-between">
             <div>
                <p className="text-gray-400 font-medium text-sm mb-1">Cloud Storage Used</p>
                <div className="flex items-baseline gap-2">
                  <p className="text-2xl font-bold text-white">4.2</p>
                  <p className="text-sm text-gray-500">GB / 10 GB</p>
                </div>
             </div>
             <div className="w-24 h-2 bg-white/10 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-blue-500 to-pink-500 w-[42%]"></div>
             </div>
          </div>
        </div>

        <div className="xl:col-span-4 bg-[#15161c] p-8 rounded-[2rem] border border-white/5 shadow-2xl w-full">
          <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
            <Sparkles size={20} className="text-yellow-500" /> Recent Activities
          </h3>
          <div className="space-y-1 w-full">
            <ActivityRow user="Som O." action="saved an ad campaign to cloud" project="9.9 Sale" time="10 mins ago" color="pink" />
            <ActivityRow user="Ek" action="moved task to Review" project="Website Banner" time="1 hour ago" color="blue" />
            <ActivityRow user="Som O." action="wrote social captions" project="Monthly Promo" time="2 hours ago" color="purple" />
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon, color, trend }) {
  const colors = {
    purple: 'bg-purple-500/20 text-purple-400',
    pink: 'bg-pink-500/20 text-pink-400',
    blue: 'bg-blue-500/20 text-blue-400'
  };

  return (
    <div className="bg-[#15161c] p-6 rounded-[2rem] border border-white/5 shadow-2xl relative overflow-hidden group w-full">
      <div className={`absolute -bottom-10 -right-10 w-32 h-32 ${colors[color].split(' ')[0]} rounded-full blur-2xl transition-all group-hover:scale-150 opacity-50`}></div>
      <div className="relative z-10">
        <div className="flex justify-between items-start mb-4">
          <div className={`w-12 h-12 ${colors[color]} rounded-2xl flex items-center justify-center`}>
            {icon}
          </div>
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
        <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-sm font-bold text-white border border-white/5">
          {user.charAt(0)}
        </div>
        <div>
          <p className="text-sm text-gray-300">
            <span className="font-bold text-white">{user}</span> {action}
          </p>
          <p className="text-xs text-gray-500 font-medium mt-0.5">Project: {project}</p>
        </div>
      </div>
      <span className="text-xs font-medium text-gray-500">{time}</span>
    </div>
  );
}

function ContentGenerator({ showNotification }) {
  const [prompt, setPrompt] = useState('');
  const [result, setResult] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setIsGenerating(true);
    setResult('');

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`;
    const payload = {
      contents: [{ parts: [{ text: `คุณคือผู้เชี่ยวชาญด้านการเขียนคอนเทนต์ โฆษณา และการตลาดภาษาไทย โปรดช่วยเขียนคอนเทนต์ตามคำสั่งนี้: ${prompt}` }] }]
    };

    try {
      const data = await fetchWithRetry(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (text) {
        setResult(text);
        showNotification('สร้างคอนเทนต์สำเร็จ');
      } else {
        throw new Error('ไม่พบข้อมูลตอบกลับจาก AI');
      }
    } catch (error) {
      showNotification('เกิดข้อผิดพลาดในการเชื่อมต่อระบบ AI ลองใหม่อีกครั้ง', 'error');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(result);
    showNotification('คัดลอกข้อความแล้ว');
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700 w-full">
      <header className="space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-purple-500/10 text-purple-400 rounded-full border border-purple-500/20 text-sm font-medium mb-4">
          <Sparkles size={14} /> Powered by Gemini
        </div>
        <h2 className="text-4xl font-bold text-white">AI Copywriter</h2>
        <p className="text-gray-400 text-lg">ร่างไอเดีย แคปชั่น หรือบทความได้อย่างรวดเร็ว</p>
      </header>

      <div className="relative group w-full">
        <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-500 to-blue-500 rounded-[2rem] blur opacity-20 group-hover:opacity-40 transition duration-500"></div>
        <div className="relative bg-[#15161c] border border-white/10 p-6 rounded-[2rem] shadow-2xl space-y-4 w-full">
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="เช่น ช่วยเขียนแคปชั่นขายครีมกันแดด สไตล์สนุกสนาน สำหรับวัยรุ่น พร้อมติด Hashtag ให้ด้วย..."
            className="w-full h-40 p-5 bg-white/5 text-gray-200 placeholder:text-gray-600 focus:outline-none focus:ring-1 focus:ring-purple-500/50 rounded-xl resize-none text-lg custom-scrollbar"
          />
          <div className="flex justify-between items-center pt-2">
            <p className="text-xs text-gray-500 font-medium">กดปุ่มเริ่มสร้างเพื่อรับผลลัพธ์ในไม่กี่วินาที</p>
            <button
              onClick={handleGenerate}
              disabled={isGenerating || !prompt.trim()}
              className="flex items-center gap-2 bg-white text-black hover:bg-gray-200 px-8 py-3 rounded-xl font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-white/10"
            >
              {isGenerating ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} />}
              {isGenerating ? 'กำลังสร้างสรรค์...' : 'Generate Copy'}
            </button>
          </div>
        </div>
      </div>

      {result && (
        <div className="bg-[#15161c] p-8 rounded-[2rem] shadow-2xl border border-white/10 space-y-4 mt-8 animate-in slide-in-from-bottom-4 w-full">
          <div className="flex items-center justify-between border-b border-white/5 pb-6">
            <h3 className="font-bold text-white text-xl flex items-center gap-2">
               <CheckCircle2 className="text-green-400" size={24} /> Result Generated
            </h3>
            <button 
              onClick={handleCopy}
              className="text-gray-400 hover:text-white px-4 py-2 rounded-xl hover:bg-white/10 transition-colors flex items-center gap-2 font-medium"
            >
              <Copy size={18} /> คัดลอกเนื้อหา
            </button>
          </div>
          <div className="whitespace-pre-wrap text-gray-300 leading-relaxed text-lg pt-4 custom-scrollbar">
            {result}
          </div>
        </div>
      )}
    </div>
  );
}

function ImageStudio({ showNotification, user, authError }) {
  const [prompt, setPrompt] = useState('');
  const [referenceImage, setReferenceImage] = useState(null);
  const [savedImages, setSavedImages] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isLoadingSaved, setIsLoadingSaved] = useState(true);
  const [dbError, setDbError] = useState(null);

  useEffect(() => {
    if (!user) return;
    fetchSavedImages();
  }, [user]);

  const fetchSavedImages = async () => {
    setIsLoadingSaved(true);
    setDbError(null);
    try {
      const q = query(collection(db, 'artifacts', appId, 'public', 'data', 'images'), orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      const images = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setSavedImages(images);
    } catch (error) {
      console.error("Error fetching saved images:", error);
      if (error.message && error.message.includes('Missing or insufficient permissions')) {
        setDbError('permission_denied');
      } else {
        showNotification('โหลดภาพที่บันทึกไว้ไม่สำเร็จ', 'error');
      }
    } finally {
      setIsLoadingSaved(false);
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

  const handleGenerate = async () => {
    if (!prompt.trim() || !user) return;
    setIsGenerating(true);

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image-preview:generateContent?key=${apiKey}`;
    
    const enhancedPrompt = `(RAW photograph, dslr, natural lighting, f/1.8, film grain, hyper-realistic, uncropped, 8k) A real-life advertisement photograph based on this concept: ${prompt}. If a reference image is provided, integrate it seamlessly as the main product. The final image should look like a genuine photo taken with a professional camera, not digital art or 3D render. IMPORTANT: Also write a highly engaging Thai social media caption with emojis and hashtags for this advertisement.`;

    const parts = [{ text: enhancedPrompt }];

    if (referenceImage) {
      const base64Data = referenceImage.split(',')[1];
      const mimeType = referenceImage.split(';')[0].split(':')[1];
      parts.push({ inlineData: { mimeType, data: base64Data } });
    }

    const payload = {
      contents: [{ parts }],
      generationConfig: { responseModalities: ['TEXT', 'IMAGE'] }
    };

    try {
      const data = await fetchWithRetry(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const base64Output = data.candidates?.[0]?.content?.parts?.find(p => p.inlineData)?.inlineData?.data;
      const generatedCaption = data.candidates?.[0]?.content?.parts?.find(p => p.text)?.text || 'พร้อมสำหรับโพสต์! 🚀✨ #แคมเปญใหม่';
      
      if (base64Output) {
        const imageUrl = `data:image/png;base64,${base64Output}`;

        try {
          await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'images'), {
            url: imageUrl,
            caption: generatedCaption,
            prompt: prompt,
            createdAt: serverTimestamp()
          });

          showNotification('สร้างและบันทึกภาพโฆษณาสำเร็จ!');
          fetchSavedImages();
        } catch (firestoreError) {
           console.error("Firestore Save Error:", firestoreError);
           if (firestoreError.code === 'resource-exhausted') {
              showNotification('สร้างภาพสำเร็จ แต่ภาพมีขนาดใหญ่เกิน 1MB จึงไม่สามารถบันทึกลง Database ได้', 'error');
           } else {
              throw firestoreError;
           }
        }
      } else {
        console.error("Full API Response:", data);
        const finishReason = data.candidates?.[0]?.finishReason;
        const blockReason = data.promptFeedback?.blockReason;
        const errorMsg = data.error?.message;
        throw new Error(`ไม่พบรูปภาพ (เหตุผล: ${errorMsg || finishReason || blockReason || 'Unknown API Error'})`);
      }
    } catch (error) {
      if (error.message && error.message.includes('Missing or insufficient permissions')) {
         setDbError('permission_denied');
         showNotification('สร้างภาพสำเร็จ แต่ไม่สามารถบันทึกลง Cloud ได้ (ติดสิทธิ์ Firebase)', 'error');
      } else {
         const msg = error.message && error.message.includes('ไม่พบรูปภาพ') ? error.message : 'เกิดข้อผิดพลาดในการสร้างโฆษณา ลองใหม่อีกครั้ง';
         showNotification(msg, 'error');
         console.error("Generation Error:", error);
      }
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700 w-full">
      <header className="space-y-2 w-full">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-pink-500/10 text-pink-400 rounded-full border border-pink-500/20 text-sm font-medium mb-4">
          <Sparkles size={14} /> Product-to-Ad Generator (Photorealism Mode)
        </div>
        <h2 className="text-4xl font-bold text-white">Ad & Image Studio</h2>
        <p className="text-gray-400 text-lg">อัปโหลดภาพสินค้า และบอก AI ว่าอยากได้ภาพถ่ายแบบไหน ระบบจะสร้างภาพที่สมจริงที่สุดพร้อมบันทึกลง Cloud ให้ทันที</p>
      </header>

      <div className="relative group w-full">
        <div className="absolute -inset-0.5 bg-gradient-to-r from-pink-500 to-orange-400 rounded-[2rem] blur opacity-20 group-hover:opacity-40 transition duration-500"></div>
        <div className="relative bg-[#15161c] border border-white/10 p-6 rounded-[2rem] shadow-2xl flex flex-col gap-4 w-full">
          
          <div className="flex flex-col md:flex-row gap-4 w-full">
            <div className="w-full md:w-1/3 h-40 border-2 border-dashed border-white/20 rounded-xl flex items-center justify-center relative overflow-hidden bg-black/20 hover:bg-white/5 transition-colors group/upload">
              {referenceImage ? (
                <>
                  <img src={referenceImage} alt="Reference" className="w-full h-full object-contain p-2" />
                  <button 
                    onClick={() => setReferenceImage(null)}
                    className="absolute top-2 right-2 bg-black/50 text-white p-1.5 rounded-lg hover:bg-red-500/80 transition-colors"
                  >
                    <X size={16} />
                  </button>
                </>
              ) : (
                <label className="flex flex-col items-center justify-center w-full h-full cursor-pointer text-gray-400 hover:text-white transition-colors">
                  <Upload size={24} className="mb-2 group-hover/upload:-translate-y-1 transition-transform" />
                  <span className="text-sm font-medium">อัปโหลดภาพสินค้า</span>
                  <span className="text-xs text-gray-500 mt-1">(Reference Image)</span>
                  <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                </label>
              )}
            </div>

            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="เช่น: ภาพถ่ายจริงของสินค้าวางบนโขดหินริมทะเลยามเย็น แสงแดดธรรมชาติสีทองอบอุ่น (Natural Light)..."
              className="flex-1 h-40 p-4 bg-white/5 text-gray-200 placeholder:text-gray-500 focus:outline-none focus:ring-1 focus:ring-pink-500/50 rounded-xl resize-none text-base custom-scrollbar border border-white/5 w-full"
            />
          </div>

          <div className="flex flex-wrap gap-2 mt-2 w-full">
            <span className="text-sm text-gray-400 flex items-center mr-2">ตัวช่วยคำสั่งด่วน (เน้นภาพจริง):</span>
            <button 
              onClick={() => setPrompt("วิเคราะห์ภาพสินค้านี้ว่าคืออะไร จากนั้นสร้างภาพถ่ายจริง (Real Photograph) ที่ 'เน้นการใช้งานจริง (In-use context)' ในสภาพแสงธรรมชาติที่สวยงาม ให้เห็นบรรยากาศขณะกำลังใช้งานสินค้านี้อย่างสมจริงที่สุด ไม่ดูเป็นภาพกราฟิก พร้อมเขียนแคปชั่นเน้นฟังก์ชันและประโยชน์")}
              className="text-xs px-3 py-1.5 bg-indigo-500/10 hover:bg-indigo-500/30 text-indigo-300 border border-indigo-500/20 rounded-lg transition-colors flex items-center gap-1.5"
            >
              <Sparkles size={12} /> ภาพถ่ายขณะใช้งานจริง (Real-life In-Use)
            </button>
            <button 
              onClick={() => setPrompt("สร้างภาพถ่ายสินค้า (Product Photography) สไตล์ 'Professional Studio' วางบนพื้นผิวหินอ่อนแท้ เล่นแสงเงาธรรมชาติ (Natural Shadows) ให้ดูมีมิติและหรูหราสมจริง โฟกัสคมชัดที่ตัวสินค้า พร้อมเขียนแคปชั่นขายของแบบพรีเมียม")}
              className="text-xs px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/20 rounded-lg transition-colors flex items-center gap-1.5"
            >
              <ImageIcon size={12} /> ภาพถ่ายสตูดิโอสมจริง (Realistic Studio)
            </button>
          </div>

          <div className="flex justify-between items-center pt-4 border-t border-white/5 mt-2 w-full">
            <p className="text-xs text-gray-500 flex items-center gap-1">
              <Database size={12} className="text-blue-400" /> ภาพจะถูกบันทึกลง Cloud อัตโนมัติ
            </p>
            <button
              onClick={handleGenerate}
              disabled={isGenerating || !prompt.trim() || authError === 'auth/configuration-not-found'}
              className="flex items-center justify-center gap-2 bg-gradient-to-r from-pink-600 to-orange-500 hover:from-pink-500 hover:to-orange-400 text-white px-8 py-3 rounded-xl font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-pink-500/25"
            >
              {isGenerating ? <Loader2 size={20} className="animate-spin" /> : <Sparkles size={20} />}
              {isGenerating ? 'กำลังสร้างและบันทึก...' : 'Generate & Save Ad'}
            </button>
          </div>
        </div>
      </div>

      <div className="mt-12 w-full">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold text-gray-200 flex items-center gap-2">
            <Cloud size={20} className="text-blue-400" /> Saved Ad Campaigns
          </h3>
          {isLoadingSaved && !authError && <Loader2 size={20} className="animate-spin text-gray-500" />}
        </div>
        
        {authError === 'auth/configuration-not-found' ? (
          <div className="bg-red-500/10 border border-red-500/20 p-8 rounded-[2rem] text-red-200 shadow-2xl w-full">
            <h4 className="font-bold text-xl mb-3 flex items-center gap-2 text-red-400">
              <AlertCircle size={24} /> จำเป็นต้องเปิดใช้งานระบบ Authentication
            </h4>
            <p className="text-sm mb-4 leading-relaxed">
              ระบบตรวจพบว่าโปรเจกต์ Firebase ของคุณยังไม่ได้เปิดใช้งานการล็อกอินแบบไม่ระบุตัวตน (Anonymous Auth)<br/>
              เพื่อเปิดใช้งานระบบ Cloud Storage และ Database โปรดทำตามขั้นตอนต่อไปนี้ใน <a href="https://console.firebase.google.com/" target="_blank" rel="noreferrer" className="text-blue-400 underline">Firebase Console</a>:
            </p>
            <div className="bg-black/40 p-5 rounded-xl border border-red-500/10">
              <ol className="list-decimal list-inside space-y-2 text-sm text-gray-300">
                <li>ไปที่เมนู <strong>Authentication</strong> ด้านซ้ายมือ (ในหมวด Build)</li>
                <li>คลิกที่แท็บ <strong>Sign-in method</strong></li>
                <li>คลิกเลือก <strong>Anonymous</strong> (ไม่ระบุตัวตน)</li>
                <li>กดสวิตช์เปิด <strong>Enable</strong> และกด <strong>Save</strong></li>
              </ol>
            </div>
            <button 
              onClick={() => window.location.reload()}
              className="mt-6 flex items-center gap-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 px-6 py-2 rounded-lg font-medium transition-colors border border-red-500/30"
            >
              ตั้งค่าเสร็จแล้ว โหลดหน้าเว็บใหม่
            </button>
          </div>
        ) : dbError === 'permission_denied' ? (
          <div className="bg-red-500/10 border border-red-500/20 p-8 rounded-[2rem] text-red-200 shadow-2xl w-full">
            <h4 className="font-bold text-xl mb-3 flex items-center gap-2 text-red-400">
              <AlertCircle size={24} /> จำเป็นต้องตั้งค่า Firebase Security Rules
            </h4>
            <p className="text-sm mb-4 leading-relaxed">
              ระบบตรวจพบว่าโปรเจกต์ Firebase ของคุณถูกบล็อกสิทธิ์การเข้าถึง (Missing or insufficient permissions) <br/>
              เพื่อเปิดใช้งานระบบ Cloud Database ให้สมบูรณ์ โปรดทำตามขั้นตอนต่อไปนี้ใน <a href="https://console.firebase.google.com/" target="_blank" rel="noreferrer" className="text-blue-400 underline">Firebase Console</a>:
            </p>
            <div className="grid grid-cols-1 gap-6 w-full">
              <div className="bg-black/40 p-5 rounded-xl border border-red-500/10 w-full">
                <p className="font-semibold text-white mb-2 text-sm">สำหรับ Firestore Database (แท็บ Rules)</p>
                <pre className="text-xs text-green-400 font-mono overflow-x-auto">
{`rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}`}
                </pre>
              </div>
            </div>
            <p className="text-xs text-red-400/80 mt-4">* กฎความปลอดภัยนี้จะอนุญาตให้อ่านและเขียนได้เฉพาะผู้ใช้งานที่เข้าสู่ระบบผ่านแอปพลิเคชันแล้วเท่านั้น ช่วยป้องกันผู้ไม่หวังดีขโมยหรือลบข้อมูลครับ</p>
            <button 
              onClick={fetchSavedImages}
              className="mt-6 flex items-center gap-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 px-6 py-2 rounded-lg font-medium transition-colors border border-red-500/30"
            >
              ตั้งค่าเสร็จแล้ว โหลดข้อมูลใหม่
            </button>
          </div>
        ) : savedImages.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 w-full">
            {savedImages.map((image) => (
              <div key={image.id} className="bg-[#15161c] border border-white/10 rounded-[2rem] overflow-hidden shadow-2xl flex flex-col animate-in zoom-in-95 duration-500 w-full">
                <div className="relative aspect-square w-full border-b border-white/10 bg-black/50">
                  <img src={image.url} alt={image.prompt} className="w-full h-full object-cover" />
                  <div className="absolute top-4 right-4">
                    <a href={image.url} download={`ad-campaign-${image.id}.png`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 bg-black/60 hover:bg-black/80 text-white px-4 py-2 rounded-xl backdrop-blur-md border border-white/10 transition-all font-medium text-sm">
                      <Download size={16} /> ดาวน์โหลด
                    </a>
                  </div>
                </div>
                
                <div className="p-6 flex-1 flex flex-col">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-sm font-semibold text-pink-400 flex items-center gap-2">
                      <PenTool size={16} /> แคปชั่นสำหรับโพสต์
                    </h4>
                    <button 
                      onClick={() => {
                        navigator.clipboard.writeText(image.caption);
                        showNotification('คัดลอกแคปชั่นแล้ว');
                      }}
                      className="text-gray-400 hover:text-white p-2 hover:bg-white/10 rounded-lg transition-colors flex items-center gap-2 text-xs font-medium"
                    >
                      <Copy size={14} /> คัดลอก
                    </button>
                  </div>
                  <div className="bg-black/30 p-4 rounded-xl border border-white/5 flex-1 custom-scrollbar overflow-y-auto max-h-48 text-gray-300 text-sm leading-relaxed whitespace-pre-wrap">
                    {image.caption}
                  </div>
                  <p className="text-xs text-gray-500 mt-4 pt-4 border-t border-white/5 truncate">
                    <span className="font-semibold">Prompt:</span> {image.prompt}
                  </p>
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

function Workspace() {
  const [tasks] = useState([
    { id: 1, title: 'ออกแบบแบนเนอร์โปรโมชั่น 9.9', status: 'todo', tag: 'Graphic' },
    { id: 2, title: 'เขียนแคปชั่นวิดีโอ TikTok', status: 'todo', tag: 'Content' },
    { id: 3, title: 'รีทัชภาพสินค้ายางรถยนต์', status: 'in-progress', tag: 'Graphic' },
    { id: 4, title: 'บทความลง Blog ประจำสัปดาห์', status: 'review', tag: 'Content' },
    { id: 5, title: 'ทำ Artwork โปสเตอร์หน้าร้าน', status: 'done', tag: 'Graphic' },
  ]);

  const columns = [
    { id: 'todo', title: 'To Do', color: 'border-gray-500/20 bg-gray-500/5' },
    { id: 'in-progress', title: 'In Progress', color: 'border-blue-500/20 bg-blue-500/5' },
    { id: 'review', title: 'Review', color: 'border-yellow-500/20 bg-yellow-500/5' },
    { id: 'done', title: 'Done', color: 'border-green-500/20 bg-green-500/5' },
  ];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700 h-full flex flex-col w-full">
      <header className="flex justify-between items-end w-full">
        <div className="space-y-2">
          <h2 className="text-4xl font-bold text-white tracking-tight">Team Boards</h2>
          <p className="text-gray-400 text-lg">อัปเดตสถานะงานของทีม เพื่อการทำงานที่ราบรื่น</p>
        </div>
        <button className="flex items-center gap-2 bg-white text-black hover:bg-gray-200 px-5 py-3 rounded-xl font-bold transition-colors shadow-lg shadow-white/10">
          <Plus size={18} /> New Task
        </button>
      </header>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6 flex-1 mt-4 w-full">
        {columns.map(col => (
          <div key={col.id} className={`rounded-[2rem] p-5 flex flex-col border backdrop-blur-sm ${col.color}`}>
            <h3 className="font-bold text-white mb-6 flex items-center justify-between">
              {col.title} 
              <span className="text-xs font-semibold bg-white/10 px-2 py-1 rounded-lg text-gray-300">
                {tasks.filter(t => t.status === col.id).length}
              </span>
            </h3>
            <div className="space-y-4 flex-1">
              {tasks.filter(t => t.status === col.id).map(task => (
                <div key={task.id} className="bg-[#1a1b23] p-5 rounded-2xl shadow-lg border border-white/5 hover:border-white/20 transition-all cursor-pointer group">
                  <div className="flex justify-between items-start mb-3">
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md ${
                      task.tag === 'Graphic' 
                        ? 'bg-pink-500/20 text-pink-400 border border-pink-500/20' 
                        : 'bg-purple-500/20 text-purple-400 border border-purple-500/20'
                    }`}>
                      {task.tag}
                    </span>
                  </div>
                  <p className="text-sm font-medium text-gray-200 group-hover:text-white transition-colors">{task.title}</p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
