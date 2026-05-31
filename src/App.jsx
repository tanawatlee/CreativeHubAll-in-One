import React, { useState, useEffect, Component } from 'react';
import { LayoutDashboard, PenTool, Image as ImageIcon, Trello, Send, Loader2, Download, Copy, CheckCircle2, AlertCircle, Plus, Upload, X, Sparkles, Cloud, Database, RefreshCw, Trash2, Sliders, ChevronDown, ChevronUp, Globe, Settings, Key } from 'lucide-react';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, collection, addDoc, getDocs, query, orderBy, serverTimestamp, deleteDoc, doc } from 'firebase/firestore';
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

// Helper function for API Key Rotation (สลับ API Key อัตโนมัติเมื่อโควต้าเต็มหรือเกิด Error)
const executeWithKeyRotation = async (endpoint, payload, customKeys) => {
  const keysToTry = customKeys.length > 0 ? [...customKeys, apiKey] : [apiKey];
  let lastError;
  
  for (let i = 0; i < keysToTry.length; i++) {
    const currentKey = keysToTry[i];
    if (!currentKey) continue;
    
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${endpoint}?key=${currentKey}`;
    try {
      console.log(`Trying API Key ${i + 1} of ${keysToTry.length}...`);
      return await fetchWithRetry(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
    } catch (error) {
      lastError = error;
      console.warn(`Key ${i + 1} failed. Trying next...`, error.message);
      // ทำงานวนลูปต่อไปเพื่อลอง Key ถัดไป
    }
  }
  throw lastError || new Error("ไม่สามารถเชื่อมต่อ API ได้เลย (ทุก Key ล้มเหลวหรือโควต้าเต็ม)");
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
  const [customApiKeys, setCustomApiKeys] = useState([]);

  useEffect(() => {
    const initAuth = async () => {
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
          <div className="my-2 border-t border-white/10"></div>
          <NavItem icon={<Settings size={20} />} label="Settings & API" isActive={activeTab === 'settings'} onClick={() => setActiveTab('settings')} />
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
              {activeTab === 'content' && <ContentGenerator showNotification={showNotification} customApiKeys={customApiKeys} user={user} authError={authError} />}
              {activeTab === 'image' && <ImageStudio showNotification={showNotification} user={user} authError={authError} customApiKeys={customApiKeys} />}
              {activeTab === 'settings' && <SettingsTab customApiKeys={customApiKeys} setCustomApiKeys={setCustomApiKeys} showNotification={showNotification} />}
            </div>
          </div>
        </div>
      </main>

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

function ContentGenerator({ showNotification, customApiKeys, user, authError }) {
  const [prompt, setPrompt] = useState('');
  const [result, setResult] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  
  // --- เพิ่ม State สำหรับรองรับการอัปโหลดรูปภาพเพื่อวิเคราะห์ (Vision AI) ---
  const [referenceImage, setReferenceImage] = useState(null);
  
  const [savedContents, setSavedContents] = useState([]);
  const [isLoadingSaved, setIsLoadingSaved] = useState(true);
  const [dbError, setDbError] = useState(null);

  useEffect(() => {
    if (!user) return;
    fetchSavedContents();
  }, [user]);

  const fetchSavedContents = async () => {
    setIsLoadingSaved(true);
    setDbError(null);
    try {
      const q = query(collection(db, 'artifacts', appId, 'public', 'data', 'contents'), orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      const contents = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setSavedContents(contents);
    } catch (error) {
      console.error("Error fetching saved contents:", error);
      if (error.message && error.message.includes('Missing or insufficient permissions')) {
        setDbError('permission_denied');
      } else {
        showNotification('โหลดประวัติคอนเทนต์ไม่สำเร็จ', 'error');
      }
    } finally {
      setIsLoadingSaved(false);
    }
  };

  const handleDeleteContent = async (id) => {
    try {
      await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'contents', id));
      setSavedContents(prev => prev.filter(item => item.id !== id));
      showNotification('ลบคอนเทนต์เรียบร้อยแล้ว', 'success');
    } catch (error) {
      console.error("Error deleting content:", error);
      showNotification('ไม่สามารถลบข้อมูลได้ โปรดลองอีกครั้ง', 'error');
    }
  };

  // --- ฟังก์ชันจัดการอัปโหลดภาพเข้า AI Copywriter ---
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
    setResult('');

    // ใช้โมเดลที่เสถียรและรองรับ Multimodal เต็มรูปแบบ
    const endpoint = "gemini-2.5-flash:generateContent";
    
    // จัดเตรียมข้อมูลส่งให้ AI (ถ้ามีรูปภาพจะเปลี่ยนคำสั่งให้ AI เน้นวิเคราะห์รูปภาพด้วย)
    let parts = [{ text: `คุณคือผู้เชี่ยวชาญด้านการเขียนคอนเทนต์ โฆษณา และการตลาดภาษาไทย โปรดช่วยเขียนคอนเทนต์ตามคำสั่งนี้: ${prompt}` }];

    if (referenceImage) {
      const base64Data = referenceImage.split(',')[1];
      const mimeType = referenceImage.split(';')[0].split(':')[1];
      parts = [
        { text: `คุณคือผู้เชี่ยวชาญด้านการเขียนคอนเทนต์ โฆษณา และการตลาดภาษาไทย โปรดวิเคราะห์ภาพที่แนบมานี้อย่างละเอียด และทำงานตามคำสั่งต่อไปนี้: ${prompt}` },
        { inlineData: { mimeType, data: base64Data } }
      ];
    }

    const payload = {
      contents: [{ parts }]
    };

    try {
      const data = await executeWithKeyRotation(endpoint, payload, customApiKeys);
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      
      if (text) {
        setResult(text);
        
        // Save to Firestore (บันทึกเฉพาะ Prompt/Text เพื่อประหยัดพื้นที่ Cloud แต่บันทึกสถานะไว้ว่าวิเคราะห์จากภาพ)
        try {
          await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'contents'), {
            content: text,
            prompt: prompt,
            hasImage: !!referenceImage, // บันทึกว่าถูกสร้างจากการแนบรูปหรือไม่
            createdAt: serverTimestamp()
          });
          showNotification('สร้างและบันทึกคอนเทนต์สำเร็จ');
          fetchSavedContents();
        } catch (firestoreError) {
          console.error("Firestore Save Error:", firestoreError);
          showNotification('สร้างสำเร็จ แต่ไม่สามารถบันทึกลง Cloud ได้', 'error');
        }

      } else {
        throw new Error('ไม่พบข้อมูลตอบกลับจาก AI');
      }
    } catch (error) {
      showNotification('เกิดข้อผิดพลาดในการเชื่อมต่อระบบ AI ลองใหม่อีกครั้ง', 'error');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = (textToCopy = result) => {
    navigator.clipboard.writeText(textToCopy);
    showNotification('คัดลอกข้อความแล้ว');
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700 w-full">
      <header className="space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-purple-500/10 text-purple-400 rounded-full border border-purple-500/20 text-sm font-medium mb-4">
          <Sparkles size={14} /> Powered by Gemini Vision
        </div>
        <h2 className="text-4xl font-bold text-white">AI Copywriter</h2>
        <p className="text-gray-400 text-lg">ร่างไอเดีย แคปชั่น หรือสามารถแนบภาพให้ AI ช่วยวิเคราะห์เขียนแคปชั่นโฆษณาที่เข้ากับสินค้าได้อย่างแม่นยำ</p>
      </header>

      <div className="relative group w-full">
        <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-500 to-blue-500 rounded-[2rem] blur opacity-20 group-hover:opacity-40 transition duration-500"></div>
        <div className="relative bg-[#15161c] border border-white/10 p-6 rounded-[2rem] shadow-2xl space-y-4 w-full">
          
          {/* --- เพิ่ม UI สำหรับอัปโหลดภาพในส่วน AI Copywriter --- */}
          <div className="flex flex-col md:flex-row gap-4 w-full">
            <div className={`w-full ${referenceImage ? 'md:w-1/3' : 'md:w-48'} h-40 border-2 border-dashed border-white/20 rounded-xl flex items-center justify-center relative overflow-hidden bg-black/20 hover:bg-white/5 transition-all group/upload shrink-0`}>
              {referenceImage ? (
                <>
                  <img src={referenceImage} alt="Reference" className="w-full h-full object-cover opacity-80" />
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover/upload:opacity-100 transition-opacity">
                      <span className="text-white text-sm font-medium flex items-center gap-2"><ImageIcon size={16}/> เปลี่ยนรูปภาพ</span>
                  </div>
                  <button 
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); setReferenceImage(null); }}
                    className="absolute top-2 right-2 bg-black/50 text-white p-1.5 rounded-lg hover:bg-red-500/80 transition-colors z-10"
                  >
                    <X size={16} />
                  </button>
                  <input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer z-0" onChange={handleImageUpload} />
                </>
              ) : (
                <label className="flex flex-col items-center justify-center w-full h-full cursor-pointer text-gray-400 hover:text-white transition-colors p-4 text-center">
                  <ImageIcon size={24} className="mb-2 group-hover/upload:-translate-y-1 transition-transform text-purple-400/70" />
                  <span className="text-sm font-medium">แนบภาพให้ AI ช่วยคิด</span>
                  <span className="text-xs text-gray-500 mt-1">(Vision AI)</span>
                  <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                </label>
              )}
            </div>

            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder={referenceImage ? "เช่น วิเคราะห์ภาพนี้เพื่อเขียนแคปชั่นขายสินค้าแบบฮาร์ดเซล เน้นโปรโมชั่นลด 50%..." : "เช่น ช่วยเขียนแคปชั่นขายครีมกันแดด สไตล์สนุกสนาน สำหรับวัยรุ่น พร้อมติด Hashtag ให้ด้วย..."}
              className="flex-1 h-40 p-5 bg-white/5 text-gray-200 placeholder:text-gray-600 focus:outline-none focus:ring-1 focus:ring-purple-500/50 rounded-xl resize-none text-lg custom-scrollbar border border-white/5"
            />
          </div>

          {/* --- เพิ่มปุ่มคำสั่งด่วนเมื่อมีการอัปโหลดรูปภาพ --- */}
          {referenceImage && (
            <div className="flex flex-wrap gap-2 mt-2 w-full animate-in fade-in slide-in-from-top-2">
              <span className="text-sm text-gray-400 flex items-center mr-2">คำสั่งด่วนวิเคราะห์ภาพ:</span>
              <button 
                onClick={() => setPrompt("วิเคราะห์องค์ประกอบและสินค้าในภาพนี้อย่างละเอียด และเขียนแคปชั่นโฆษณาที่ดึงดูดใจ ดึงจุดเด่นของภาพมาเล่าเรื่อง พร้อมติด Hashtag ที่เกี่ยวข้อง")}
                className="text-xs px-3 py-1.5 bg-purple-500/10 hover:bg-purple-500/30 text-purple-300 border border-purple-500/20 rounded-lg transition-colors flex items-center gap-1.5"
              >
                <Sparkles size={12} /> เขียนแคปชั่นจากภาพ
              </button>
              <button 
                onClick={() => setPrompt("สกัดจุดเด่นและเอกลักษณ์ (Key Selling Points) จากรูปภาพนี้ออกมาเป็นข้อๆ อย่างน้อย 3 ข้อ เพื่อนำไปทำ Artwork หรือทำสคริปต์วิดีโอ")}
                className="text-xs px-3 py-1.5 bg-blue-500/10 hover:bg-blue-500/30 text-blue-300 border border-blue-500/20 rounded-lg transition-colors flex items-center gap-1.5"
              >
                <PenTool size={12} /> สกัดจุดเด่นเป็นข้อๆ
              </button>
            </div>
          )}

          <div className="flex justify-between items-center pt-4 border-t border-white/5 mt-2">
            <p className="text-xs text-gray-500 flex items-center gap-1">
              <Database size={12} className="text-purple-400" /> คอนเทนต์จะถูกบันทึกลง Cloud อัตโนมัติ
            </p>
            <button
              onClick={handleGenerate}
              disabled={isGenerating || !prompt.trim() || authError === 'auth/configuration-not-found'}
              className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-blue-500 hover:from-purple-500 hover:to-blue-400 text-white px-8 py-3 rounded-xl font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-purple-500/25"
            >
              {isGenerating ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} />}
              {isGenerating ? 'กำลังวิเคราะห์และสร้างสรรค์...' : 'Generate Copy'}
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
              onClick={() => handleCopy(result)}
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

      {/* --- ส่วนประวัติที่บันทึกไว้ (Saved Contents) --- */}
      <div className="mt-12 w-full">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold text-gray-200 flex items-center gap-2">
            <Database size={20} className="text-purple-400" /> Saved Contents History
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
              ทำให้ไม่สามารถบันทึกและดึงข้อมูลประวัติคอนเทนต์ได้
            </p>
          </div>
        ) : dbError === 'permission_denied' ? (
          <div className="bg-red-500/10 border border-red-500/20 p-8 rounded-[2rem] text-red-200 shadow-2xl w-full">
            <h4 className="font-bold text-xl mb-3 flex items-center gap-2 text-red-400">
              <AlertCircle size={24} /> ติดสิทธิ์การเข้าถึงฐานข้อมูล (Permission Denied)
            </h4>
            <p className="text-sm mb-4 leading-relaxed">
              กรุณาอัปเดต Firestore Security Rules เพื่ออนุญาตให้เข้าถึงข้อมูลได้
            </p>
            <button 
              onClick={fetchSavedContents}
              className="mt-2 flex items-center gap-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 px-6 py-2 rounded-lg font-medium transition-colors border border-red-500/30"
            >
              โหลดข้อมูลใหม่
            </button>
          </div>
        ) : savedContents.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
            {savedContents.map((item) => (
              <div key={item.id} className="bg-[#15161c] border border-white/10 rounded-2xl shadow-xl p-6 flex flex-col hover:border-purple-500/30 transition-all duration-300 group">
                <div className="flex items-start justify-between mb-4 border-b border-white/5 pb-4">
                  <div className="flex-1 pr-4">
                    <p className="text-xs font-semibold text-purple-400 mb-1 flex items-center gap-1">
                      <PenTool size={12} /> Prompt
                      {item.hasImage && (
                        <span className="ml-2 px-1.5 py-0.5 bg-blue-500/20 text-blue-400 rounded text-[10px] flex items-center gap-1">
                          <ImageIcon size={10} /> วิเคราะห์จากภาพ
                        </span>
                      )}
                    </p>
                    <p className="text-sm text-gray-300 line-clamp-2" title={item.prompt}>{item.prompt}</p>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <button 
                      onClick={() => handleCopy(item.content)}
                      className="p-2 text-gray-500 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                      title="คัดลอกคอนเทนต์"
                    >
                      <Copy size={16} />
                    </button>
                    <button 
                      onClick={() => handleDeleteContent(item.id)}
                      className="p-2 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                      title="ลบข้อมูล"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
                <div className="flex-1 bg-black/30 p-4 rounded-xl border border-white/5 overflow-y-auto custom-scrollbar max-h-48 text-gray-400 text-sm leading-relaxed whitespace-pre-wrap">
                  {item.content}
                </div>
              </div>
            ))}
          </div>
        ) : (
          !isLoadingSaved && (
            <div className="text-center py-12 bg-[#15161c] border border-white/5 rounded-[2rem] text-gray-500 w-full flex flex-col items-center">
              <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-4">
                <PenTool size={24} className="text-gray-600" />
              </div>
              <p>ยังไม่มีประวัติการสร้างคอนเทนต์ เริ่มเขียนเลย!</p>
            </div>
          )
        )}
      </div>
    </div>
  );
}

function ImageStudio({ showNotification, user, authError, customApiKeys }) {
  const [prompt, setPrompt] = useState('');
  const [referenceImage, setReferenceImage] = useState(null);
  const [savedImages, setSavedImages] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isLoadingSaved, setIsLoadingSaved] = useState(true);
  const [dbError, setDbError] = useState(null);

  const [showAdvanced, setShowAdvanced] = useState(false);
  const [advancedOptions, setAdvancedOptions] = useState({
    style: 'Realistic Photography',
    mood: 'Bright & Energetic',
    format: 'Square (1:1)'
  });

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

  const handleDeleteImage = async (id) => {
    try {
      await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'images', id));
      setSavedImages(prevImages => prevImages.filter(img => img.id !== id));
      showNotification('ลบแคมเปญเรียบร้อยแล้ว', 'success');
    } catch (error) {
      console.error("Error deleting image:", error);
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

  const handleGenerate = async () => {
    if (!prompt.trim() || !user) return;
    setIsGenerating(true);

    const endpoint = "gemini-2.5-flash-image-preview:generateContent";
    
    const enhancedPrompt = `Create a highly professional advertisement image based on this concept: ${prompt}. 
    - Visual Style: ${advancedOptions.style}
    - Color & Mood: ${advancedOptions.mood}
    - Composition/Ratio Focus: ${advancedOptions.format}
    Instructions: If a reference image is provided, integrate it seamlessly as the main product. The image must look ultra-realistic and high-quality according to the requested style, not like cheap digital art.

    IMPORTANT TEXT REQUIREMENT: Write a highly engaging social media caption for this advertisement. 
    1. Provide the caption in THAI language first.
    2. Provide the exact same captivating caption in ENGLISH language below it.
    3. Conclude the text with 10-15 highly relevant, SEO-optimized trending hashtags (mixed Thai and English). 
    Format the response clearly with nice emojis.`;

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
      const data = await executeWithKeyRotation(endpoint, payload, customApiKeys);

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

          <div className="flex flex-col gap-3 mt-2 w-full">
            <button 
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="flex items-center gap-2 w-fit text-sm font-medium text-pink-400 hover:text-pink-300 transition-colors bg-pink-500/10 px-4 py-2 rounded-lg border border-pink-500/20"
            >
              <Sliders size={16} /> 
              {showAdvanced ? 'ซ่อนการตั้งค่าขั้นสูง' : 'ตั้งค่าสร้างภาพขั้นสูง (Advanced Options)'}
              {showAdvanced ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>

            {showAdvanced && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-5 bg-black/30 border border-pink-500/10 rounded-xl animate-in fade-in slide-in-from-top-2 shadow-inner">
                <div className="space-y-2">
                  <label className="text-xs text-gray-400 font-semibold tracking-wide uppercase">สไตล์ภาพ (Art Style)</label>
                  <select 
                    value={advancedOptions.style}
                    onChange={(e) => setAdvancedOptions({...advancedOptions, style: e.target.value})}
                    className="w-full bg-[#15161c] border border-white/10 text-gray-200 text-sm rounded-lg p-3 focus:ring-1 focus:ring-pink-500 outline-none cursor-pointer transition-colors hover:border-white/20"
                  >
                    <option value="Realistic Photography">ภาพถ่ายสมจริง (Realistic Photo)</option>
                    <option value="Professional Studio Lighting">สตูดิโอระดับโปร (Studio Lighting)</option>
                    <option value="Cinematic Movie Style">สไตล์ภาพยนตร์ (Cinematic)</option>
                    <option value="Minimalist & Clean">มินิมอลเรียบง่าย (Minimalist)</option>
                    <option value="3D Render Unreal Engine">3D กราฟิก (3D Render)</option>
                    <option value="Vintage Film Camera">กล้องฟิล์มวินเทจ (Vintage Film)</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs text-gray-400 font-semibold tracking-wide uppercase">อารมณ์ภาพ (Mood & Tone)</label>
                  <select 
                    value={advancedOptions.mood}
                    onChange={(e) => setAdvancedOptions({...advancedOptions, mood: e.target.value})}
                    className="w-full bg-[#15161c] border border-white/10 text-gray-200 text-sm rounded-lg p-3 focus:ring-1 focus:ring-pink-500 outline-none cursor-pointer transition-colors hover:border-white/20"
                  >
                    <option value="Bright & Energetic">สว่างและมีพลัง (Bright & Energetic)</option>
                    <option value="Dark & Luxurious">มืดและหรูหรา (Dark & Luxurious)</option>
                    <option value="Warm & Cozy">อบอุ่นและสบาย (Warm & Cozy)</option>
                    <option value="Cool & Cyberpunk">โทนเย็น/ไซเบอร์ (Cool & Cyberpunk)</option>
                    <option value="Soft Pastel">สีพาสเทลละมุน (Soft Pastel)</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs text-gray-400 font-semibold tracking-wide uppercase">สัดส่วน (Composition)</label>
                  <select 
                    value={advancedOptions.format}
                    onChange={(e) => setAdvancedOptions({...advancedOptions, format: e.target.value})}
                    className="w-full bg-[#15161c] border border-white/10 text-gray-200 text-sm rounded-lg p-3 focus:ring-1 focus:ring-pink-500 outline-none cursor-pointer transition-colors hover:border-white/20"
                  >
                    <option value="Square (1:1)">จัตุรัส (Square 1:1) - IG/FB</option>
                    <option value="Portrait (9:16)">แนวตั้ง (Portrait 9:16) - Reels/TikTok</option>
                    <option value="Landscape (16:9)">แนวนอน (Landscape 16:9) - Web/YT</option>
                  </select>
                </div>
              </div>
            )}
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
                <div className="relative aspect-square w-full border-b border-white/10 bg-black/50 group/img">
                  <img src={image.url} alt={image.prompt} className="w-full h-full object-cover" />
                  <div className="absolute top-4 right-4 flex items-center gap-2">
                    <button 
                      onClick={() => handleDeleteImage(image.id)}
                      className="flex items-center justify-center w-9 h-9 bg-black/60 hover:bg-red-500/90 text-gray-300 hover:text-white rounded-xl backdrop-blur-md border border-white/10 transition-colors shadow-lg"
                      title="ลบแคมเปญนี้"
                    >
                      <Trash2 size={16} />
                    </button>
                    <a href={image.url} download={`ad-campaign-${image.id}.png`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 bg-black/60 hover:bg-black/80 text-white px-4 py-2 rounded-xl backdrop-blur-md border border-white/10 transition-all font-medium text-sm">
                      <Download size={16} /> ดาวน์โหลด
                    </a>
                  </div>
                </div>
                
                <div className="p-6 flex-1 flex flex-col">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-sm font-semibold text-pink-400 flex items-center gap-2">
                      <Globe size={16} /> แคปชั่น (Thai & English)
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

function SettingsTab({ customApiKeys, setCustomApiKeys, showNotification }) {
  const [newKey, setNewKey] = useState('');

  const handleAddKey = () => {
    if (!newKey.trim()) return;
    if (customApiKeys.includes(newKey.trim())) {
      showNotification('มี API Key นี้อยู่ในระบบแล้ว', 'error');
      return;
    }
    setCustomApiKeys([...customApiKeys, newKey.trim()]);
    setNewKey('');
    showNotification('เพิ่ม API Key สำเร็จ');
  };

  const handleRemoveKey = (keyToRemove) => {
    setCustomApiKeys(customApiKeys.filter(k => k !== keyToRemove));
    showNotification('ลบ API Key สำเร็จ');
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700 w-full h-full">
      <header className="space-y-2">
        <h2 className="text-4xl font-bold text-white tracking-tight flex items-center gap-3">
          <Settings className="text-gray-400" size={36} /> Settings & API Keys
        </h2>
        <p className="text-gray-400 text-lg">จัดการกลุ่ม API Key ของคุณ ระบบจะสลับไปใช้ Key ถัดไปอัตโนมัติหากโควต้าเต็ม (Fallback)</p>
      </header>

      <div className="bg-[#15161c] border border-white/10 p-8 rounded-[2rem] shadow-2xl max-w-3xl">
        <h3 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
          <Key size={20} className="text-pink-400" /> จัดการกลุ่ม API Keys
        </h3>
        
        <div className="flex gap-4 mb-8">
          <input
            type="text"
            value={newKey}
            onChange={(e) => setNewKey(e.target.value)}
            placeholder="วาง Gemini API Key ของคุณที่นี่ (AIzaSy...)"
            className="flex-1 bg-black/40 border border-white/10 text-gray-200 text-sm rounded-xl p-4 focus:ring-1 focus:ring-pink-500 outline-none transition-colors hover:border-white/20"
          />
          <button
            onClick={handleAddKey}
            disabled={!newKey.trim()}
            className="flex items-center gap-2 bg-pink-500 hover:bg-pink-600 text-white px-6 py-3 rounded-xl font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Plus size={18} /> เพิ่ม Key
          </button>
        </div>

        <div className="space-y-3">
          <h4 className="text-sm font-medium text-gray-400 mb-4">API Keys ที่ใช้งานอยู่ (เรียงตามลำดับการเรียกใช้)</h4>
          
          {/* Default Injected Key (Visual only) */}
          <div className="flex items-center justify-between bg-white/5 border border-white/5 p-4 rounded-xl">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center">
                1
              </div>
              <div>
                <p className="text-sm text-gray-200 font-mono">System Default Key (Injected)</p>
                <p className="text-xs text-green-400 mt-0.5">สถานะ: พร้อมเป็นตัวสำรองหลัก</p>
              </div>
            </div>
            <span className="text-xs bg-blue-500/20 text-blue-400 px-3 py-1 rounded-full font-medium">
              ค่าเริ่มต้น
            </span>
          </div>

          {/* Custom Keys */}
          {customApiKeys.map((k, index) => (
            <div key={index} className="flex items-center justify-between bg-black/40 border border-white/10 p-4 rounded-xl group hover:border-pink-500/30 transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-pink-500/20 text-pink-400 flex items-center justify-center">
                  {index + 2}
                </div>
                <div>
                  <p className="text-sm text-gray-200 font-mono">
                    {k.substring(0, 10)}...{k.substring(k.length - 4)}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">Custom Key</p>
                </div>
              </div>
              <button
                onClick={() => handleRemoveKey(k)}
                className="text-gray-500 hover:text-red-400 p-2 rounded-lg hover:bg-red-500/10 transition-colors"
                title="ลบ Key นี้"
              >
                <Trash2 size={18} />
              </button>
            </div>
          ))}

          {customApiKeys.length === 0 && (
            <div className="text-center py-8 text-gray-500 border border-dashed border-white/10 rounded-xl bg-black/20">
              ยังไม่ได้เพิ่ม API Key สำรอง ระบบจะใช้เพียง Default Key เท่านั้น
            </div>
          )}
        </div>

        <div className="mt-8 p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl flex items-start gap-3 text-blue-300 text-sm leading-relaxed">
          <AlertCircle size={20} className="shrink-0 mt-0.5" />
          <p>
            <strong>ระบบทำงานอย่างไร?</strong> เมื่อคุณสั่ง Generate คอนเทนต์หรือรูปภาพ ระบบจะลองใช้ Custom API Keys ที่คุณเพิ่มไว้ก่อนตามลำดับ หาก Key ใดเกิด Error (เช่น Quota เต็ม หรือ 429 Too Many Requests) ระบบจะสลับไปใช้ Key ลำดับถัดไป หรือ System Default Key ทันทีโดยอัตโนมัติ ทำให้การทำงานของคุณไม่สะดุด
          </p>
        </div>
      </div>
    </div>
  );
}
