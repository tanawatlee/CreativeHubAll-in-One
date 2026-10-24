<!DOCTYPE html>
<html lang="th">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Eats & Use Style - Feed Planner Pro</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css" rel="stylesheet">
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Kanit:wght@300;400;500&display=swap');
        
        body {
            font-family: 'Kanit', sans-serif;
            background-color: #f7f5f2;
        }

        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        
        .phone-frame {
            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
            border: 8px solid #ffffff;
            border-radius: 40px;
        }

        /* Custom Radio Button for Captions */
        .caption-radio:checked + div {
            border-color: #d97706; /* amber-600 */
            background-color: #fffbeb; /* amber-50 */
        }
        
        .timeline-dot {
            width: 12px;
            height: 12px;
            background-color: #d97706;
            border-radius: 50%;
            position: absolute;
            left: -6px;
            top: 24px;
            border: 2px solid white;
        }
    </style>
</head>
<body class="min-h-screen text-gray-800 p-4 lg:p-8">

    <!-- Toast Notification -->
    <div id="toast" class="fixed top-4 right-4 px-6 py-3 rounded-lg shadow-lg transform transition-transform duration-300 translate-x-full z-50 flex items-center gap-2 text-white bg-green-500">
        <i class="fas fa-check-circle" id="toastIcon"></i>
        <span id="toastMsg">สำเร็จ</span>
    </div>

    <!-- Main Layout: 3 Columns -->
    <div class="max-w-[1400px] mx-auto flex flex-col xl:flex-row items-start justify-center gap-6">
        
        <!-- Column 1: Control Panel & AI (Left) -->
        <div class="w-full xl:w-[400px] flex flex-col gap-6 shrink-0">
            <div class="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <h1 class="text-2xl font-medium text-amber-900 mb-1">Feed Planner Pro</h1>
                <p class="text-sm text-gray-500 mb-6">ระบบสร้างภาพ คิดแคปชัน และจัดตารางโพสต์</p>

                <!-- AI Content Generator Section -->
                <div class="bg-gradient-to-br from-amber-50 to-orange-50 p-4 rounded-xl border border-amber-200">
                    <label class="block text-sm font-medium text-amber-900 mb-3"><i class="fas fa-magic text-amber-500 mr-1"></i> ทีมงาน AI ผู้ช่วยสร้างคอนเทนต์</label>
                    
                    <!-- NEW: Mood & Tone Selector -->
                    <div class="mb-4">
                        <label class="block text-xs font-medium text-amber-800 mb-2"><i class="fas fa-palette mr-1"></i> 1. กำหนด Mood & Tone (Brand Identity)</label>
                        <select id="brandMood" class="w-full p-2 text-sm border border-amber-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white text-gray-700">
                            <option value="minimal">🤎 มินิมอล & อบอุ่น (Minimal, Warm, Earthy tones, Homey)</option>
                            <option value="luxury">✨ หรูหรา & พรีเมียม (Luxury, Elegant, Clean, High-end, Studio lighting)</option>
                            <option value="dark">🌑 เท่ & ดาร์ก (Dark Academia, Moody, Shadows, Cinematic, Cool)</option>
                            <option value="pop">🎨 สดใส & ป๊อปอาร์ต (Vibrant, Colorful, Pop-art, Cheerful, Trendy)</option>
                        </select>
                    </div>

                    <!-- NEW: Post Format Selector -->
                    <div class="mb-4">
                        <label class="block text-xs font-medium text-amber-800 mb-2"><i class="fas fa-layer-group mr-1"></i> 1.5 รูปแบบโพสต์ (Format)</label>
                        <select id="postFormat" class="w-full p-2 text-sm border border-amber-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white text-gray-700">
                            <option value="single">ภาพเดียว (Single Image)</option>
                            <option value="carousel">อัลบั้มภาพ 3 รูป (Carousel: แนะนำสินค้า/เล่าเรื่อง)</option>
                        </select>
                    </div>

                    <div class="mb-3 bg-white p-3 rounded-lg border border-amber-100">
                        <label class="block text-xs font-medium text-amber-800 mb-2">2. อัปโหลดภาพสินค้าต้นฉบับ (จำเป็น)</label>
                        <input type="file" id="aiRefImageInput" class="w-full text-xs text-gray-500 file:mr-2 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-medium file:bg-amber-100 file:text-amber-800 hover:file:bg-amber-200 cursor-pointer" accept="image/*">
                        <div id="aiRefImagePreview" class="hidden mt-3 relative inline-block">
                            <img id="aiRefImg" src="" class="h-20 w-20 object-cover rounded-md border border-amber-200 shadow-sm">
                            <button onclick="clearAiRefImage()" class="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-[10px] shadow-sm"><i class="fas fa-times"></i></button>
                        </div>
                    </div>

                    <div class="mb-4">
                        <label class="block text-xs font-medium text-amber-800 mb-1">3. บรีฟงานเพิ่มเติมให้ทีมงาน (ถ้ามี)</label>
                        <textarea id="aiPrompt" rows="2" class="w-full p-2 text-sm border border-amber-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none" placeholder="เช่น ขอให้มีแสงแดดพาดผ่าน, วางอยู่บนโต๊ะทำงาน..."></textarea>
                    </div>
                    
                    <div class="flex items-center gap-2 mb-4 px-1">
                        <i class="fas fa-robot text-amber-500 text-xs"></i>
                        <span class="text-[11px] text-amber-700 leading-tight">ระบบจะวิเคราะห์ประวัติโพสต์ใน Grid อัตโนมัติ เพื่อนำเสนอภาพมุมมองใหม่ๆ ไม่ให้ภาพรวมร้านดูซ้ำจำเจ</span>
                    </div>
                    
                    <button id="aiGenerateBtn" onclick="generateAIContent()" class="w-full bg-gradient-to-r from-amber-600 to-amber-800 hover:from-amber-700 hover:to-amber-900 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-all shadow-sm flex items-center justify-center gap-2">
                        <i class="fas fa-sparkles"></i> สร้างภาพและตัวเลือกแคปชัน
                    </button>
                </div>

                <!-- AI Result Area (Hidden initially) -->
                <div id="aiResultArea" class="hidden mt-4 bg-white p-4 rounded-xl border border-amber-200 shadow-lg">
                    <div id="aiLoading" class="hidden text-center py-8 text-amber-600">
                        <i class="fas fa-spinner fa-spin text-3xl mb-3 block"></i> 
                        <p class="text-sm font-medium">กำลังจัดฉากภาพและคิดแคปชัน...</p>
                        <p class="text-xs text-gray-500 mt-1">อาจใช้เวลาประมาณ 10-15 วินาที</p>
                    </div>

                    <div id="aiContent" class="hidden flex flex-col gap-4">
                        <h3 class="text-sm font-medium text-amber-900 border-b pb-2">ผลลัพธ์จาก AI</h3>
                        <!-- Image -->
                        <div>
                            <div id="aiGeneratedImgContainer" class="w-full flex overflow-x-auto gap-2 pb-2 snap-x snap-mandatory no-scrollbar">
                                <!-- Images will be injected here -->
                            </div>
                        </div>
                        
                        <!-- Caption Selection -->
                        <div>
                            <label class="block text-xs font-medium text-amber-800 mb-2">เลือกแคปชันที่ต้องการ:</label>
                            <div class="space-y-2" id="captionOptionsContainer">
                                <!-- Options populated by JS -->
                            </div>
                        </div>

                        <!-- Date Picker -->
                        <div>
                            <label class="block text-xs font-medium text-amber-800 mb-1">วันที่และเวลาสำหรับโพสต์:</label>
                            <input type="datetime-local" id="postDatetime" class="w-full p-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500">
                        </div>

                        <button id="savePostBtn" onclick="savePostToSchedule()" class="w-full py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium shadow-sm">
                            <i class="fas fa-calendar-check mr-2"></i> บันทึกลงตารางโพสต์
                        </button>
                    </div>
                </div>
                
                <!-- Data Management (Backup & Restore) -->
                <div class="mt-6 bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                    <label class="block text-sm font-medium text-gray-800 mb-3"><i class="fas fa-database text-gray-500 mr-1"></i> จัดการข้อมูล (Backup & Restore)</label>
                    <div class="flex gap-2">
                        <button onclick="exportData()" class="flex-1 bg-gray-50 hover:bg-gray-100 text-gray-700 py-2 rounded-lg text-xs font-medium transition-colors border border-gray-300">
                            <i class="fas fa-download mr-1"></i> สำรองข้อมูล
                        </button>
                        <label class="flex-1 bg-gray-50 hover:bg-gray-100 text-gray-700 py-2 rounded-lg text-xs font-medium transition-colors border border-gray-300 cursor-pointer text-center">
                            <i class="fas fa-upload mr-1"></i> นำเข้าข้อมูล
                            <input type="file" id="importInput" class="hidden" accept=".json" onchange="importData(event)">
                        </label>
                    </div>
                </div>

            </div>
        </div>

        <!-- Column 2: Phone Simulator (Middle) -->
        <div class="phone-frame w-[360px] h-[750px] bg-white relative overflow-hidden flex flex-col shrink-0">
            <div class="pt-10 pb-3 px-4 border-b border-gray-200 bg-white sticky top-0 z-10 flex justify-between items-center">
                <div class="flex items-center gap-1 font-medium text-lg">
                    <i class="fas fa-lock text-xs mr-1"></i> <span>eatsanduse</span>
                    <i class="fas fa-chevron-down text-xs ml-1"></i>
                </div>
                <div class="flex gap-4 text-xl">
                    <i class="far fa-plus-square"></i>
                    <i class="fas fa-bars"></i>
                </div>
            </div>

            <div class="px-4 py-4 flex flex-col">
                <div class="flex justify-between items-center mb-4">
                    <div class="w-20 h-20 rounded-full bg-gray-200 overflow-hidden border border-gray-200">
                        <img src="https://images.unsplash.com/photo-1610701596007-11502861dcfa?auto=format&fit=crop&w=150&q=80" class="w-full h-full object-cover" alt="Profile">
                    </div>
                    <div class="flex gap-6 text-center">
                        <div><div class="font-medium text-lg" id="postCount">0</div><div class="text-xs text-gray-500">Posts</div></div>
                        <div><div class="font-medium text-lg">15.2k</div><div class="text-xs text-gray-500">Followers</div></div>
                        <div><div class="font-medium text-lg">120</div><div class="text-xs text-gray-500">Following</div></div>
                    </div>
                </div>
                <div class="font-medium text-sm uppercase">EATS AND USE</div>
                <div class="text-sm text-gray-600">Home goods store<br>Minimalist ceramic & wooden lifestyle 🤎<br>Shipping worldwide 📦</div>
            </div>

            <div class="flex justify-around border-t border-gray-200 pt-2 pb-2">
                <div class="w-1/3 flex justify-center text-gray-800 border-b-2 border-gray-800 pb-2"><i class="fas fa-th"></i></div>
                <div class="w-1/3 flex justify-center text-gray-400 pb-2"><i class="fas fa-play"></i></div>
                <div class="w-1/3 flex justify-center text-gray-400 pb-2"><i class="fas fa-user-tag"></i></div>
            </div>

            <div class="flex-1 overflow-y-auto no-scrollbar">
                <!-- Grid items ordered by Date -->
                <div id="grid-container" class="grid grid-cols-3 gap-0.5 bg-white pb-20">
                    <!-- Images rendered by JS -->
                </div>
            </div>
        </div>

        <!-- Column 3: Calendar & Captions (Right) -->
        <div class="w-full xl:flex-1 bg-white p-6 rounded-2xl shadow-sm border border-gray-100 h-[750px] overflow-y-auto no-scrollbar relative">
            <div class="flex justify-between items-center mb-6 sticky top-0 bg-white pb-2 border-b z-10">
                <h2 class="text-xl font-medium text-amber-900">
                    <i class="far fa-calendar-alt mr-2 text-amber-600"></i> ปฏิทินโพสต์
                </h2>
                <div class="flex gap-2 items-center">
                    <button onclick="changeMonth(-1)" class="p-1.5 rounded hover:bg-amber-50 text-gray-500 hover:text-amber-600 transition-colors"><i class="fas fa-chevron-left"></i></button>
                    <span id="currentMonthYear" class="font-medium text-sm text-amber-900 min-w-[120px] text-center">มกราคม 2024</span>
                    <button onclick="changeMonth(1)" class="p-1.5 rounded hover:bg-amber-50 text-gray-500 hover:text-amber-600 transition-colors"><i class="fas fa-chevron-right"></i></button>
                </div>
            </div>
            
            <div id="calendar-container" class="w-full">
                <!-- Calendar rendered by JS -->
            </div>
        </div>

    </div>

    <!-- Post Detail Modal -->
    <div id="postModal" class="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 hidden flex items-center justify-center p-4 transition-opacity">
        <div class="bg-white rounded-2xl w-full max-w-3xl overflow-hidden shadow-2xl relative animate-fadeIn">
            <button onclick="closePostModal()" class="absolute top-4 right-4 bg-black/50 hover:bg-black/70 text-white rounded-full w-8 h-8 flex items-center justify-center z-20 backdrop-blur-md transition-colors"><i class="fas fa-times"></i></button>
            <div class="flex flex-col md:flex-row h-full max-h-[85vh]">
                <div class="w-full md:w-1/2 bg-gray-100 flex items-center justify-center relative overflow-hidden">
                    <div id="modalImgContainer" class="w-full h-full flex overflow-x-auto snap-x snap-mandatory no-scrollbar relative scroll-smooth">
                        <!-- Images injected here -->
                    </div>
                    <!-- Navigation Dots -->
                    <div id="modalImgDots" class="absolute bottom-4 left-0 right-0 flex justify-center gap-2 z-10"></div>
                </div>
                <div class="w-full md:w-1/2 p-6 flex flex-col h-[50vh] md:h-auto">
                    <div class="flex justify-between items-center mb-4 pb-3 border-b border-gray-100">
                        <div class="text-sm font-medium text-amber-900" id="modalDate"><i class="far fa-calendar-check mr-1 text-amber-600"></i> <span></span></div>
                        <button id="modalDeleteBtn" class="text-red-400 hover:text-red-600 hover:bg-red-50 text-sm px-2 py-1 rounded transition-colors" title="ลบโพสต์"><i class="fas fa-trash-alt mr-1"></i> ลบ</button>
                    </div>
                    <div class="flex-1 overflow-y-auto mb-4 no-scrollbar text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                        <p id="modalCaption"></p>
                    </div>
                    <div class="flex gap-3 mt-auto pt-4 border-t border-gray-100">
                        <button id="modalDownloadBtn" class="flex-1 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white py-2.5 rounded-xl font-medium transition-all shadow-md shadow-amber-200 text-sm flex items-center justify-center gap-2">
                            <i class="fas fa-download"></i> โหลด 4K
                        </button>
                        <button id="modalCopyBtn" class="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-800 py-2.5 rounded-xl font-medium transition-colors text-sm flex items-center justify-center gap-2">
                            <i class="far fa-copy"></i> คัดลอก
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- Day Posts Selection Modal -->
    <div id="dayPostsModal" class="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 hidden flex items-center justify-center p-4 transition-opacity">
        <div class="bg-white rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl relative animate-fadeIn p-6">
            <div class="flex justify-between items-center mb-4 pb-2 border-b border-gray-100">
                <h3 class="text-lg font-medium text-amber-900" id="dayPostsModalTitle">โพสต์ของวันที่ ...</h3>
                <button onclick="closeDayPostsModal()" class="text-gray-400 hover:text-gray-600 bg-gray-50 hover:bg-gray-100 w-8 h-8 rounded-full flex items-center justify-center transition-colors"><i class="fas fa-times"></i></button>
            </div>
            <div id="dayPostsGrid" class="grid grid-cols-2 sm:grid-cols-3 gap-4 max-h-[60vh] overflow-y-auto no-scrollbar p-1">
                <!-- Items rendered by JS -->
            </div>
        </div>
    </div>

    <!-- Firebase System Script -->
    <script type="module">
        import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
        import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
        import { getFirestore, collection, addDoc, onSnapshot, deleteDoc, doc } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

        // Global config from environment
        const appId = typeof __app_id !== 'undefined' ? __app_id : 'eats-use-planner-v2';
        const firebaseConfigStr = typeof __firebase_config !== 'undefined' ? __firebase_config : '{}';
        let firebaseConfig = {};
        try { firebaseConfig = JSON.parse(firebaseConfigStr); } catch(e) {}
        
        let app, auth, db, userId;
        window.feedItems = []; // Store posts

        // Initialize App
        async function initApp() {
            try {
                if (Object.keys(firebaseConfig).length === 0) {
                    console.warn("No Firebase config found. Running in local mock mode.");
                    return; // Fail gracefully if no config (Canvas environment handling)
                }

                app = initializeApp(firebaseConfig);
                auth = getAuth(app);
                db = getFirestore(app);
                
                const initialToken = typeof __initial_auth_token !== 'undefined' ? __initial_auth_token : null;
                if (initialToken) {
                    await signInWithCustomToken(auth, initialToken);
                } else {
                    await signInAnonymously(auth);
                }
                
                userId = auth.currentUser.uid;
                startRealtimeSync();
                
            } catch(e) {
                console.error("Firebase Initialization Error:", e);
                window.showToast("ระบบออฟไลน์ (Local Mode)", true);
            }
        }

        // Firebase Sync
        function startRealtimeSync() {
            if(!userId) return;
            
            // Path: /artifacts/{appId}/users/{userId}/posts
            const postsRef = collection(db, 'artifacts', appId, 'users', userId, 'posts');
            
            onSnapshot(postsRef, (snapshot) => {
                window.feedItems = [];
                snapshot.forEach(docSnap => {
                    window.feedItems.push({ id: docSnap.id, ...docSnap.data() });
                });
                
                // Sort in memory by date descending (Newest first) - RULE 2
                window.feedItems.sort((a, b) => new Date(b.date) - new Date(a.date));
                
                window.renderGrid();
                window.renderTimeline();
                document.getElementById('postCount').innerText = window.feedItems.length;
            }, (error) => {
                console.error("Snapshot error:", error);
            });
        }

        // Expose DB functions to window
        window.savePostToDb = async function(postData) {
            if(!userId) {
                // Mock behavior if DB fails
                postData.id = Date.now().toString();
                window.feedItems.push(postData);
                window.feedItems.sort((a, b) => new Date(b.date) - new Date(a.date));
                window.renderGrid();
                window.renderTimeline();
                document.getElementById('postCount').innerText = window.feedItems.length;
                return;
            }
            const postsRef = collection(db, 'artifacts', appId, 'users', userId, 'posts');
            await addDoc(postsRef, postData);
        }

        window.deletePostFromDb = async function(postId) {
            if(!userId) {
                window.feedItems = window.feedItems.filter(item => item.id !== postId);
                window.renderGrid();
                window.renderTimeline();
                document.getElementById('postCount').innerText = window.feedItems.length;
                return;
            }
            await deleteDoc(doc(db, 'artifacts', appId, 'users', userId, 'posts', postId));
            window.showToast('ลบโพสต์เรียบร้อยแล้ว');
        }

        initApp();
    </script>

    <!-- UI Logic Script -->
    <script>
        // AI Variables
        let currentAiRefImageBase64 = null;
        let currentAiRefImageMime = null;
        let generatedImageUrls = []; // NEW: Array to support multiple images
        
        // Setup Date picker to current date time
        document.addEventListener('DOMContentLoaded', () => {
            const now = new Date();
            now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
            document.getElementById('postDatetime').value = now.toISOString().slice(0, 16);
        });

        // Toast Message
        window.showToast = function(message, isError = false) {
            const toast = document.getElementById('toast');
            const toastMsg = document.getElementById('toastMsg');
            const icon = document.getElementById('toastIcon');
            
            toast.className = `fixed top-4 right-4 px-6 py-3 rounded-lg shadow-lg transform transition-transform duration-300 z-50 flex items-center gap-2 text-white ${isError ? 'bg-red-500' : 'bg-green-500'}`;
            toastMsg.innerText = message;
            icon.className = isError ? "fas fa-exclamation-circle" : "fas fa-check-circle";
            
            toast.classList.remove('translate-x-full');
            setTimeout(() => toast.classList.add('translate-x-full'), 3000);
        }

        // Handle File Upload for AI Ref Image
        document.getElementById('aiRefImageInput').addEventListener('change', function(e) {
            const file = e.target.files[0];
            if (file && file.type.startsWith('image/')) {
                currentAiRefImageMime = file.type;
                const reader = new FileReader();
                reader.onload = (event) => {
                    const base64String = event.target.result;
                    currentAiRefImageBase64 = base64String.split(',')[1];
                    document.getElementById('aiRefImg').src = base64String;
                    document.getElementById('aiRefImagePreview').classList.remove('hidden');
                };
                reader.readAsDataURL(file);
            }
        });

        window.clearAiRefImage = function() {
            currentAiRefImageBase64 = null;
            currentAiRefImageMime = null;
            document.getElementById('aiRefImageInput').value = '';
            document.getElementById('aiRefImagePreview').classList.add('hidden');
        }

        // Compress image to save storage space but keep quality high for 4K upscale
        async function compressImage(base64Str, maxWidth = 1080) {
            return new Promise((resolve) => {
                let img = new Image();
                img.src = base64Str;
                img.onload = () => {
                    let canvas = document.createElement('canvas');
                    let ratio = maxWidth / img.width;
                    if (ratio > 1) ratio = 1; // Don't upscale during compression
                    canvas.width = img.width * ratio;
                    canvas.height = img.height * ratio;
                    let ctx = canvas.getContext('2d');
                    ctx.imageSmoothingEnabled = true;
                    ctx.imageSmoothingQuality = 'high';
                    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                    resolve(canvas.toDataURL('image/jpeg', 0.85)); 
                };
            });
        }

        // Generate Content (Image + 3 Captions)
        window.generateAIContent = async function() {
            const promptInput = document.getElementById('aiPrompt').value.trim();
            const selectedMood = document.getElementById('brandMood').value;
            const postFormat = document.getElementById('postFormat').value; // NEW
            
            if (!currentAiRefImageBase64) {
                showToast('กรุณาอัปโหลดภาพสินค้าต้นฉบับก่อนครับ', true);
                return;
            }

            const btn = document.getElementById('aiGenerateBtn');
            const resultArea = document.getElementById('aiResultArea');
            const loading = document.getElementById('aiLoading');
            const content = document.getElementById('aiContent');

            btn.disabled = true;
            btn.classList.add('opacity-50');
            resultArea.classList.remove('hidden');
            loading.classList.remove('hidden');
            content.classList.add('hidden');
            
            // Clean up previous results
            document.getElementById('captionOptionsContainer').innerHTML = '';
            document.getElementById('aiGeneratedImgContainer').innerHTML = ''; // NEW
            generatedImageUrls = []; // NEW

            const apiKey = ""; // API key managed by environment

            // Define Mood Prompts for Art Director
            const moodConfig = {
                'minimal': {
                    visual: "minimalist aesthetic, warm earthy tones, home decor vibe, natural soft lighting, plain or subtle warm setting, cozy and inviting.",
                    voice: "สไตล์มินิมอล โฮมคาเฟ่ โทนอบอุ่น เป็นกันเอง เข้าถึงง่าย"
                },
                'luxury': {
                    visual: "high-end luxury, elegant aesthetic, clean background, professional studio lighting, premium feel, sharp and sophisticated.",
                    voice: "สไตล์หรูหรา พรีเมียม เรียบหรู ดูแพง ใช้ภาษาทางการและสุภาพ"
                },
                'dark': {
                    visual: "dark academia, moody aesthetics, cinematic lighting, deep shadows, cool tones, mysterious and stylish.",
                    voice: "สไตล์เท่ๆ คูลๆ สุขุม ดาร์กๆ มีความลึกลับ น่าค้นหา"
                },
                'pop': {
                    visual: "vibrant colors, pop-art style, trendy, cheerful, bright and punchy lighting, playful composition.",
                    voice: "สไตล์สดใส วัยรุ่น ร่าเริง สนุกสนาน ใช้ภาษาวัยรุ่น ทันสมัย"
                }
            };

            const currentStyle = moodConfig[selectedMood];

            // --- NEW: AI Grid Analysis for Perspective Diversity ---
            let historyPrompt = "";
            if (window.feedItems && window.feedItems.length > 0) {
                // วิเคราะห์บริบท 3 โพสต์ล่าสุด
                const recentCaptions = window.feedItems.slice(0, 3).map(item => item.caption.substring(0, 30).replace(/\n/g, " ")).join(" | ");
                historyPrompt = `\nCRITICAL INSTRUCTION FOR GRID DIVERSITY: To prevent the Instagram Feed from looking repetitive, analyze these recent posts: [${recentCaptions}]. You MUST generate this new image using a completely DIFFERENT perspective, angle, zoom level, or composition than usual (e.g. if previous were standard shots, try a top-down flatlay, an extreme macro detail shot, a wider lifestyle context, or a creative angle). Surprise us with a fresh visual angle while keeping the product recognizable!`;
            }

            try {
                // 1. Image Generation via Gemini 3.1 Flash Image (Image-to-Image) - Art Director Role
                const makeImagePayload = (textPrompt) => ({
                    contents: [{ role: 'user', parts: [
                        { text: textPrompt },
                        { inlineData: { mimeType: currentAiRefImageMime, data: currentAiRefImageBase64 } }
                    ]}],
                    generationConfig: { responseModalities: ['IMAGE'], imageConfig: { aspectRatio: "1:1" } }
                });

                let imagePromises = [];

                if (postFormat === 'single') {
                    // ภาพเดียว
                    const prompt = `Act as a top-tier Art Director. Turn this product image into a highly professional Instagram photo following this brand visual identity: ${currentStyle.visual}. ${historyPrompt} \nUser extra brief: ${promptInput}`;
                    imagePromises.push(fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-image:generateContent?key=${apiKey}`, {
                        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(makeImagePayload(prompt))
                    }).then(res => res.json()));
                } else {
                    // อัลบั้มภาพ 3 รูป (Carousel) - สร้าง 3 มุมมองที่แตกต่างกันเพื่อใช้รีวิว/เล่าเรื่อง
                    loading.querySelector('p').innerText = "กำลังสร้างอัลบั้มภาพ 3 รูปและคิดแคปชัน (อาจใช้เวลา 20-30 วินาที)...";
                    
                    const prompt1 = `Act as an Art Director. Create IMAGE 1 (COVER SHOT: Eye-catching, perfect for first impression). Brand style: ${currentStyle.visual}. ${historyPrompt} User brief: ${promptInput}`;
                    const prompt2 = `Act as an Art Director. Create IMAGE 2 (DETAIL/INFO: Close-up focus on texture, quality, material, or specific features of the product to give information). Brand style: ${currentStyle.visual}. User brief: ${promptInput}`;
                    const prompt3 = `Act as an Art Director. Create IMAGE 3 (LIFESTYLE/USAGE: Show the product in a real-world context, being used, or placed beautifully in a room). Brand style: ${currentStyle.visual}. User brief: ${promptInput}`;
                    
                    imagePromises.push(fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-image:generateContent?key=${apiKey}`, {
                        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(makeImagePayload(prompt1))
                    }).then(res => res.json()));
                    imagePromises.push(fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-image:generateContent?key=${apiKey}`, {
                        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(makeImagePayload(prompt2))
                    }).then(res => res.json()));
                    imagePromises.push(fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-image:generateContent?key=${apiKey}`, {
                        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(makeImagePayload(prompt3))
                    }).then(res => res.json()));
                }

                // 2. Text Generation via Gemini 3 Flash Preview (JSON Output) - Copywriter Role
                let textPromptForCap = `Act as an expert Social Media Copywriter. จงเขียนแคปชัน Instagram โปรโมทสินค้า โดยคุมโทนภาษา (Brand Voice) แบบ: ${currentStyle.voice} \nบรีฟเพิ่มเติม: ${promptInput}\nหมายเหตุพิเศษ: ทีม Art Director อาจจะเปลี่ยนมุมมองภาพให้แปลกใหม่ขึ้น โปรดเขียนแคปชันให้ส่งเสริมความน่าสนใจของภาพรวมด้วย\n`;
                
                if (postFormat === 'carousel') {
                    textPromptForCap += `\n**สำคัญมาก**: โพสต์นี้เป็นแบบอัลบั้มภาพ (Carousel) เล่าเรื่องราวหรือให้ข้อมูลสินค้า กรุณาเขียนแคปชันที่กระตุ้นให้คน 'ปัดดูรูปถัดไป' (Swipe left) และอธิบายถึงรายละเอียด (ดีเทล) หรือวิธีการใช้งานด้วยให้ครบถ้วน\n`;
                }
                
                textPromptForCap += `ให้เขียนแคปชัน 3 รูปแบบให้เลือก (แบบสั้นกระชับ, แบบกลางเล่าเรื่อง, แบบยาวใส่รายละเอียด) พร้อมแฮชแท็กที่ตรงกับโทนแบรนด์ \nตอบกลับเป็น JSON Format ตามโครงสร้างนี้เท่านั้น: {"captions": ["...1...", "...2...", "...3..."]}`;

                const textParts = [
                    { text: textPromptForCap },
                    { inlineData: { mimeType: currentAiRefImageMime, data: currentAiRefImageBase64 } }
                ];

                const textPayload = {
                    contents: [{ parts: textParts }],
                    generationConfig: {
                        responseMimeType: "application/json",
                        responseSchema: {
                            type: "OBJECT",
                            properties: {
                                captions: { type: "ARRAY", items: { type: "STRING" } }
                            },
                            required: ["captions"]
                        }
                    }
                };

                const textPromise = fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${apiKey}`, {
                    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(textPayload)
                }).then(res => res.json());

                // Await both APIs (parallel processing for speed)
                const [imageResults, textResult] = await Promise.all([Promise.all(imagePromises), textPromise]);

                // Process Image Results
                const imgContainer = document.getElementById('aiGeneratedImgContainer');
                for (let i = 0; i < imageResults.length; i++) {
                    const imgRes = imageResults[i];
                    const imagePart = imgRes.candidates?.[0]?.content?.parts?.find(p => p.inlineData);
                    if (imagePart) {
                        const rawImageBase64 = `data:${imagePart.inlineData.mimeType};base64,${imagePart.inlineData.data}`;
                        const compressedUrl = await compressImage(rawImageBase64);
                        generatedImageUrls.push(compressedUrl);
                        
                        // Add to UI Container
                        const imgEl = document.createElement('img');
                        imgEl.src = compressedUrl;
                        imgEl.className = 'w-full h-auto rounded-lg object-cover aspect-square border border-gray-200 shadow-sm snap-center shrink-0';
                        if (postFormat === 'carousel') imgEl.classList.add('w-[85%]'); // ให้โชว์ขอบรูปถัดไปนิดนึงเพื่อบอกว่าปัดได้
                        imgContainer.appendChild(imgEl);
                    }
                }
                
                if (generatedImageUrls.length === 0) throw new Error("No image data generated");

                // Process Text Result (JSON)
                const jsonString = textResult.candidates?.[0]?.content?.parts?.[0]?.text;
                let captions = ["แคปชันที่ 1", "แคปชันที่ 2", "แคปชันที่ 3"]; // Fallbacks
                try {
                    const parsed = JSON.parse(jsonString);
                    if (parsed.captions && parsed.captions.length > 0) captions = parsed.captions;
                } catch(e) { console.error("Failed to parse JSON captions", e); }

                // Render Caption Options
                const container = document.getElementById('captionOptionsContainer');
                captions.forEach((cap, index) => {
                    const label = document.createElement('label');
                    label.className = 'cursor-pointer block relative';
                    
                    const isChecked = index === 0 ? 'checked' : '';
                    
                    label.innerHTML = `
                        <input type="radio" name="selectedCaption" value="${index}" class="caption-radio absolute opacity-0 w-0 h-0" ${isChecked}>
                        <div class="p-3 border rounded-lg text-sm text-gray-700 bg-gray-50 transition-all hover:border-amber-400 whitespace-pre-wrap">
                            <span class="font-medium text-amber-700 text-xs mb-1 block">แบบที่ ${index+1}</span>
                            ${cap}
                        </div>
                    `;
                    // Store exact text data inside the element
                    label.dataset.text = cap;
                    container.appendChild(label);
                });

                // Show Results
                loading.classList.add('hidden');
                content.classList.remove('hidden');
                loading.querySelector('p').innerText = "กำลังจัดฉากภาพและคิดแคปชัน..."; // Reset loading text
                showToast('สร้างคอนเทนต์สำเร็จ!');

            } catch (error) {
                console.error("AI Generation Error:", error);
                loading.classList.add('hidden');
                resultArea.classList.add('hidden');
                showToast('เกิดข้อผิดพลาดในการสร้าง กรุณาลองใหม่', true);
            } finally {
                btn.disabled = false;
                btn.classList.remove('opacity-50');
            }
        }

        // Save Generated Post to Database
        window.savePostToSchedule = async function() {
            if (generatedImageUrls.length === 0) return;

            const selectedRadio = document.querySelector('input[name="selectedCaption"]:checked');
            if (!selectedRadio) {
                showToast("กรุณาเลือกแคปชัน", true); return;
            }
            
            const captionText = selectedRadio.closest('label').dataset.text;
            const dateInput = document.getElementById('postDatetime').value;
            
            if (!dateInput) {
                showToast("กรุณาระบุวันเวลาโพสต์", true); return;
            }

            const btn = document.getElementById('savePostBtn');
            btn.disabled = true;
            btn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i> กำลังบันทึก...';

            const postData = {
                imageUrls: generatedImageUrls, // Save as Array
                caption: captionText,
                date: new Date(dateInput).toISOString(),
                createdAt: Date.now()
            };

            try {
                // Call Firebase function exposed globally
                if(window.savePostToDb) {
                    await window.savePostToDb(postData);
                }
                
                showToast('บันทึกลงตารางโพสต์เรียบร้อย');
                
                // Reset form
                document.getElementById('aiResultArea').classList.add('hidden');
                document.getElementById('aiPrompt').value = '';
                clearAiRefImage();
                
            } catch (e) {
                console.error(e);
                showToast('เกิดข้อผิดพลาดในการบันทึก', true);
            } finally {
                btn.disabled = false;
                btn.innerHTML = '<i class="fas fa-calendar-check mr-2"></i> บันทึกลงตารางโพสต์';
            }
        }

        // Backup & Restore Functions
        window.exportData = function() {
            if (!window.feedItems || window.feedItems.length === 0) {
                showToast("ไม่มีข้อมูลให้สำรอง", true);
                return;
            }
            const dataStr = JSON.stringify(window.feedItems);
            const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
            const exportFileDefaultName = 'ig_planner_backup.json';
            
            const linkElement = document.createElement('a');
            linkElement.setAttribute('href', dataUri);
            linkElement.setAttribute('download', exportFileDefaultName);
            linkElement.click();
            showToast("ดาวน์โหลดไฟล์สำรองข้อมูลสำเร็จ");
        }

        window.importData = async function(event) {
            const file = event.target.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = async (e) => {
                try {
                    const importedData = JSON.parse(e.target.result);
                    if (!Array.isArray(importedData)) throw new Error("รูปแบบไฟล์ไม่ถูกต้อง");
                    
                    const btn = event.target.closest('label');
                    const originalHtml = btn.innerHTML;
                    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> กำลังนำเข้า...';
                    
                    // บันทึกข้อมูลที่ import เข้า Database ทีละรายการ
                    for (const item of importedData) {
                        const { id, ...postData } = item; // ตัด id เดิมทิ้งเพื่อให้ระบบสร้างใหม่
                        if(window.savePostToDb) {
                            await window.savePostToDb(postData);
                        }
                    }
                    
                    showToast(`นำเข้าข้อมูลสำเร็จ ${importedData.length} รายการ`);
                    btn.innerHTML = originalHtml;
                    event.target.value = ''; // Reset input
                    
                } catch (err) {
                    console.error(err);
                    showToast("ไฟล์ข้อมูลไม่ถูกต้อง หรือเสียหาย", true);
                }
            };
            reader.readAsText(file);
        }

        // UI Render: Grid (Phone Mockup)
        window.renderGrid = function() {
            const container = document.getElementById('grid-container');
            container.innerHTML = '';
            
            const items = window.feedItems || [];

            items.forEach((item) => {
                const div = document.createElement('div');
                div.className = 'aspect-square relative group bg-gray-100';
                
                // Compatibility for old and new data structure
                const coverImage = (item.imageUrls && item.imageUrls.length > 0) ? item.imageUrls[0] : item.imageUrl;
                const isCarousel = item.imageUrls && item.imageUrls.length > 1;
                
                const img = document.createElement('img');
                img.src = coverImage;
                img.className = 'w-full h-full object-cover pointer-events-none';
                
                // Show date overlay on hover
                const dateOverlay = document.createElement('div');
                const d = new Date(item.date);
                const dateStr = `${d.getDate()}/${d.getMonth()+1}/${d.getFullYear().toString().substr(-2)}`;
                dateOverlay.innerHTML = `<span class="bg-black/60 text-white text-[10px] px-1.5 py-0.5 rounded font-medium absolute bottom-1 right-1">${dateStr}</span>`;
                
                div.appendChild(img);
                
                // IG Carousel Icon
                if (isCarousel) {
                    const icon = document.createElement('div');
                    icon.innerHTML = `<i class="fas fa-clone text-white text-xs absolute top-1.5 right-1.5 drop-shadow-md"></i>`;
                    div.appendChild(icon);
                }
                
                div.appendChild(dateOverlay);
                container.appendChild(div);
            });

            // Fill empty grid slots for aesthetics
            const remaining = Math.max(0, 9 - items.length);
            for(let i=0; i<remaining; i++){
                 const emptyDiv = document.createElement('div');
                 emptyDiv.className = 'aspect-square bg-gray-50 border border-gray-100 flex items-center justify-center text-gray-300';
                 emptyDiv.innerHTML = '<i class="fas fa-image"></i>';
                 container.appendChild(emptyDiv);
            }
        }

        // --- NEW: Calendar & Modal System ---
        
        let currentDate = new Date();
        
        window.changeMonth = function(delta) {
            currentDate.setMonth(currentDate.getMonth() + delta);
            window.renderTimeline(); // trigger calendar re-render
        }

        // Overwrite renderTimeline to render Calendar View instead
        window.renderTimeline = function() {
            const container = document.getElementById('calendar-container');
            if(!container) return;
            
            const monthYearLabel = document.getElementById('currentMonthYear');
            monthYearLabel.innerText = currentDate.toLocaleDateString('th-TH', { month: 'long', year: 'numeric' });
            
            const year = currentDate.getFullYear();
            const month = currentDate.getMonth();
            const firstDay = new Date(year, month, 1).getDay();
            const daysInMonth = new Date(year, month + 1, 0).getDate();
            
            let html = `
                <div class="grid grid-cols-7 gap-1 sm:gap-2 mb-2 text-center text-xs font-medium text-amber-800 bg-amber-50 rounded-lg p-2">
                    <div>อา</div><div>จ</div><div>อ</div><div>พ</div><div>พฤ</div><div>ศ</div><div>ส</div>
                </div>
                <div class="grid grid-cols-7 gap-1 sm:gap-2">
            `;
            
            // Empty slots for previous month
            for (let i = 0; i < firstDay; i++) {
                html += `<div class="aspect-square rounded-lg bg-gray-50/50"></div>`;
            }
            
            // Render Days
            for (let day = 1; day <= daysInMonth; day++) {
                const currentDayStart = new Date(year, month, day, 0, 0, 0);
                const currentDayEnd = new Date(year, month, day, 23, 59, 59);
                
                const items = window.feedItems || [];
                const dayPosts = items.filter(item => {
                    const postDate = new Date(item.date);
                    return postDate >= currentDayStart && postDate <= currentDayEnd;
                });
                
                let postIndicator = '';
                if (dayPosts.length === 1) {
                    const post = dayPosts[0];
                    const coverImage = (post.imageUrls && post.imageUrls.length > 0) ? post.imageUrls[0] : post.imageUrl;
                    const isCarousel = post.imageUrls && post.imageUrls.length > 1;
                    
                    postIndicator = `
                        <div class="absolute inset-0.5 cursor-pointer rounded-lg overflow-hidden border-2 border-amber-400 shadow-sm transition-transform hover:scale-105 z-10" onclick="openPostModal('${post.id}')">
                            <img src="${coverImage}" class="w-full h-full object-cover">
                            ${isCarousel ? '<i class="fas fa-clone text-white text-[10px] absolute top-1 right-1 drop-shadow-md"></i>' : ''}
                        </div>
                    `;
                } else if (dayPosts.length > 1) {
                    const post = dayPosts[0];
                    const coverImage = (post.imageUrls && post.imageUrls.length > 0) ? post.imageUrls[0] : post.imageUrl;
                    
                    postIndicator = `
                        <div class="absolute inset-0.5 cursor-pointer rounded-lg overflow-hidden border-2 border-amber-400 shadow-sm transition-transform hover:scale-105 z-10" onclick="openDayPostsModal(${year}, ${month}, ${day})">
                            <img src="${coverImage}" class="w-full h-full object-cover">
                            <div class="absolute bottom-0.5 right-0.5 bg-amber-600 text-white text-[10px] px-1.5 py-0.5 rounded shadow font-medium">มี ${dayPosts.length} โพสต์</div>
                        </div>
                    `;
                }
                
                const isToday = (day === new Date().getDate() && month === new Date().getMonth() && year === new Date().getFullYear());
                const bgClass = isToday ? 'bg-amber-50 border-amber-200' : 'bg-white border-gray-100';
                
                html += `
                    <div class="aspect-square relative rounded-lg border ${bgClass} hover:border-amber-300 transition-colors">
                        <div class="absolute top-1 left-1.5 text-[10px] font-medium ${isToday ? 'text-amber-600' : 'text-gray-400'} z-0">${day}</div>
                        ${postIndicator}
                    </div>
                `;
            }
            
            html += `</div>`;
            container.innerHTML = html;
        }

        window.openDayPostsModal = function(year, month, day) {
            const currentDayStart = new Date(year, month, day, 0, 0, 0);
            const currentDayEnd = new Date(year, month, day, 23, 59, 59);
            
            const dayPosts = window.feedItems.filter(item => {
                const postDate = new Date(item.date);
                return postDate >= currentDayStart && postDate <= currentDayEnd;
            });
            
            // Sort by time (Earliest first)
            dayPosts.sort((a, b) => new Date(a.date) - new Date(b.date));
            
            const titleDate = currentDayStart.toLocaleDateString('th-TH', { day: 'numeric', month: 'long', year: 'numeric' });
            document.getElementById('dayPostsModalTitle').innerHTML = `<i class="far fa-calendar-alt text-amber-600 mr-2"></i>โพสต์ทั้งหมดของวันที่ ${titleDate}`;
            
            const grid = document.getElementById('dayPostsGrid');
            grid.innerHTML = dayPosts.map(post => {
                const d = new Date(post.date);
                const timeStr = d.toLocaleTimeString('th-TH', {hour:'2-digit', minute:'2-digit'});
                const coverImage = (post.imageUrls && post.imageUrls.length > 0) ? post.imageUrls[0] : post.imageUrl;
                const isCarousel = post.imageUrls && post.imageUrls.length > 1;
                
                return `
                    <div class="cursor-pointer border border-gray-200 rounded-xl overflow-hidden hover:border-amber-500 hover:shadow-lg transition-all group bg-white flex flex-col" onclick="closeDayPostsModal(); openPostModal('${post.id}')">
                        <div class="aspect-square relative overflow-hidden bg-gray-100">
                            <img src="${coverImage}" class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500">
                            ${isCarousel ? '<i class="fas fa-clone text-white text-sm absolute top-2 right-2 drop-shadow-md"></i>' : ''}
                            <div class="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <span class="bg-white/90 text-amber-900 text-xs font-medium px-3 py-1.5 rounded-full shadow-sm"><i class="fas fa-eye mr-1"></i> ดูโพสต์นี้</span>
                            </div>
                        </div>
                        <div class="p-3 flex-1 flex flex-col">
                            <div class="text-xs text-amber-700 font-medium mb-1.5 bg-amber-50 self-start px-2 py-0.5 rounded"><i class="far fa-clock mr-1"></i>${timeStr} น.</div>
                            <div class="text-xs text-gray-600 line-clamp-2 leading-relaxed">${post.caption}</div>
                        </div>
                    </div>
                `;
            }).join('');
            
            document.getElementById('dayPostsModal').classList.remove('hidden');
        }

        window.closeDayPostsModal = function() {
            document.getElementById('dayPostsModal').classList.add('hidden');
        }

        window.openPostModal = function(postId) {
            const post = window.feedItems.find(p => p.id === postId);
            if(!post) return;
            
            const images = (post.imageUrls && post.imageUrls.length > 0) ? post.imageUrls : [post.imageUrl];
            
            const imgContainer = document.getElementById('modalImgContainer');
            const dotsContainer = document.getElementById('modalImgDots');
            
            // Clear old images
            imgContainer.innerHTML = '';
            dotsContainer.innerHTML = '';
            
            // Render images and scroll dots
            images.forEach((imgSrc, idx) => {
                const img = document.createElement('img');
                img.src = imgSrc;
                img.className = 'w-full h-full object-cover shrink-0 snap-center';
                imgContainer.appendChild(img);
                
                if (images.length > 1) {
                    const dot = document.createElement('div');
                    dot.className = `w-2 h-2 rounded-full shadow-sm transition-colors duration-300 ${idx === 0 ? 'bg-amber-500 scale-125' : 'bg-white/70'}`;
                    dotsContainer.appendChild(dot);
                }
            });
            
            // Handle scrolling event to update active dot
            if (images.length > 1) {
                imgContainer.onscroll = () => {
                    const scrollIdx = Math.round(imgContainer.scrollLeft / imgContainer.offsetWidth);
                    Array.from(dotsContainer.children).forEach((dot, i) => {
                        if(i === scrollIdx) {
                            dot.className = 'w-2 h-2 rounded-full shadow-sm transition-all duration-300 bg-amber-500 scale-125';
                        } else {
                            dot.className = 'w-2 h-2 rounded-full shadow-sm transition-all duration-300 bg-white/70';
                        }
                    });
                };
            }
            
            const d = new Date(post.date);
            document.getElementById('modalDate').querySelector('span').innerText = `${d.toLocaleDateString('th-TH')} เวลา ${d.toLocaleTimeString('th-TH', {hour:'2-digit', minute:'2-digit'})} น.`;
            document.getElementById('modalCaption').innerText = post.caption;
            
            const deleteBtn = document.getElementById('modalDeleteBtn');
            deleteBtn.onclick = function() {
                deletePostFromDb(postId);
                closePostModal();
            };
            
            const copyBtn = document.getElementById('modalCopyBtn');
            copyBtn.onclick = function() {
                copyCaptionToClipboard(post.caption, copyBtn);
            };
            
            const downloadBtn = document.getElementById('modalDownloadBtn');
            downloadBtn.innerHTML = `<i class="fas fa-download"></i> ${images.length > 1 ? 'โหลดอัลบั้ม 4K' : 'โหลด 4K'}`;
            downloadBtn.onclick = function() {
                // โหลดภาพทั้งหมดในชุด เรียงตามลำดับ (มีดีเลย์นิดหน่อยกันบราวเซอร์บล็อก Popup)
                images.forEach((imgSrc, idx) => {
                    setTimeout(() => {
                        const fileSuffix = images.length > 1 ? `-${idx+1}` : '';
                        download4KImage(imgSrc, `ig-post-4k-${postId}${fileSuffix}.jpg`, downloadBtn);
                    }, idx * 1000);
                });
            };
            
            const modal = document.getElementById('postModal');
            modal.classList.remove('hidden');
        }

        window.closePostModal = function() {
            document.getElementById('postModal').classList.add('hidden');
        }

        // Enhanced Copy Caption utility
        window.copyCaptionToClipboard = function(text, btnElement) {
            const tempTextArea = document.createElement("textarea");
            tempTextArea.value = text;
            document.body.appendChild(tempTextArea);
            tempTextArea.select();
            
            try {
                document.execCommand('copy');
                const originalHtml = btnElement.innerHTML;
                btnElement.innerHTML = '<i class="fas fa-check mr-2"></i> คัดลอกสำเร็จ';
                btnElement.classList.replace('text-gray-800', 'text-green-600');
                setTimeout(() => { 
                    btnElement.innerHTML = originalHtml;
                    btnElement.classList.replace('text-green-600', 'text-gray-800');
                }, 2000);
            } catch (err) {
                showToast("ไม่สามารถคัดลอกได้", true);
            }
            
            document.body.removeChild(tempTextArea);
        }

        // 4K Upscale Download utility
        window.download4KImage = function(base64Data, filename, btnObj = null) {
            const btn = btnObj || document.getElementById('modalDownloadBtn');
            const originalHtml = btn.innerHTML;
            btn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i> กำลังขยายภาพ 4K...';
            btn.disabled = true;

            setTimeout(() => {
                let img = new Image();
                img.src = base64Data;
                img.onload = () => {
                    let canvas = document.createElement('canvas');
                    // ตั้งค่าความละเอียด 4K (3840 x 3840)
                    canvas.width = 3840;
                    canvas.height = 3840;
                    
                    let ctx = canvas.getContext('2d');
                    // เปิดระบบเกลี่ยภาพขั้นสูง (High Quality Image Smoothing)
                    ctx.imageSmoothingEnabled = true;
                    ctx.imageSmoothingQuality = 'high';
                    
                    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                    
                    const a = document.createElement('a');
                    a.href = canvas.toDataURL('image/jpeg', 1.0);
                    a.download = filename;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    
                    btn.innerHTML = '<i class="fas fa-check mr-2"></i> โหลดสำเร็จ';
                    
                    // หน่วงเวลาคืนสถานะปุ่ม (เผื่อว่ามีการโหลดหลายภาพต่อกัน)
                    setTimeout(() => {
                        btn.innerHTML = originalHtml;
                        btn.disabled = false;
                    }, 2000);
                };
            }, 100); // Small delay to let UI update
        }

    </script>
</body>
</html>
