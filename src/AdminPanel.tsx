import React, { useState, useEffect } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { auth, db } from './firebase';
import { signInWithPopup, GoogleAuthProvider, signOut, onAuthStateChanged, User } from 'firebase/auth';
import { collection, getDocs, doc, setDoc, deleteDoc, query, onSnapshot, getDoc, updateDoc, writeBatch } from 'firebase/firestore';
import { v4 as uuidv4 } from 'uuid';
import { Plus, Edit2, Trash2, X, Image as ImageIcon, Camera, Sparkles, Sliders, Check, RefreshCw, Calendar, Clock, ExternalLink, Link } from 'lucide-react';
import GoogleDrivePicker from './components/GoogleDrivePicker';

const SA_LOCATIONS = [
  'Johannesburg',
  'Pretoria',
  'Cape Town',
  'Durban',
  'KwaZulu-Natal',
  'Port Elizabeth',
  'Bloemfontein',
  'Nelspruit',
  'Kimberley',
  'Polokwane',
  'Rustenburg',
  'East London',
  'Stellenbosch',
  'George',
  'Other'
];

export let googleAccessToken: string | null = typeof window !== 'undefined' ? sessionStorage.getItem('googleAccessToken') : null;

export const setGoogleAccessToken = (token: string | null) => {
  googleAccessToken = token;
  if (typeof window !== 'undefined') {
    if (token) {
      sessionStorage.setItem('googleAccessToken', token);
    } else {
      sessionStorage.removeItem('googleAccessToken');
    }
  }
};

const getGoogleDriveFileId = (url: string): string | null => {
  if (!url.includes('drive.google.com') && !url.includes('googleusercontent.com')) return null;
  
  // Format: /file/d/FILE_ID/...
  const fileDMatch = url.match(/\/file\/d\/([^/]+)/);
  if (fileDMatch) return fileDMatch[1];
  
  // Format: id=FILE_ID
  const idParamMatch = url.match(/[?&]id=([^&]+)/);
  if (idParamMatch) return idParamMatch[1];
  
  // Format: /d/FILE_ID
  const dMatch = url.match(/\/d\/([^/=]+)/);
  if (dMatch) return dMatch[1];
  
  return null;
};

const fetchImageAsBase64 = async (url: string): Promise<string> => {
  if (!url.startsWith('http')) return url;
  try {
    const fileId = getGoogleDriveFileId(url);
    let blob: Blob | null = null;

    // 1. If it's a Google Drive file, try our specialized Google Drive fetching paths first
    if (fileId) {
      // 1a. Try public direct fetch via corsproxy.io (extremely reliable)
      try {
        const corsProxyUrl = `https://corsproxy.io/?` + encodeURIComponent(`https://lh3.googleusercontent.com/d/${fileId}`);
        const res = await fetch(corsProxyUrl);
        if (res.ok) {
          blob = await res.blob();
        }
      } catch (e) {
        console.warn("Public direct fetch via corsproxy.io failed, trying other methods...", e);
      }

      // 1b. Try public direct fetch via allorigins.win (backup CORS proxy)
      if (!blob) {
        try {
          const allOriginsUrl = `https://api.allorigins.win/raw?url=` + encodeURIComponent(`https://lh3.googleusercontent.com/d/${fileId}`);
          const res = await fetch(allOriginsUrl);
          if (res.ok) {
            blob = await res.blob();
          }
        } catch (e) {
          console.warn("Public direct fetch via allorigins.win failed...", e);
        }
      }

      // 1c. If we have a token, try authorized fetch
      if (!blob && googleAccessToken) {
        try {
          const res = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
            headers: { 'Authorization': `Bearer ${googleAccessToken}` }
          });
          if (res.ok) {
            blob = await res.blob();
          }
        } catch (e) {
          console.warn("Authorized fetch failed:", e);
        }
      }

      // 1d. Try public direct fetch without proxy (just in case)
      if (!blob) {
        try {
          const res = await fetch(`https://lh3.googleusercontent.com/d/${fileId}`);
          if (res.ok) {
            blob = await res.blob();
          }
        } catch (e) {
          console.warn("Public direct fetch without proxy failed:", e);
        }
      }
    }

    // 2. Fallback to normal fetch or proxy fetch for other URLs (like Unsplash or generic URLs)
    if (!blob) {
      try {
        const res = await fetch(url);
        if (res.ok) {
          blob = await res.blob();
        } else {
          throw new Error(`HTTP ${res.status}`);
        }
      } catch (err) {
        console.warn("Direct fetch failed, trying corsproxy.io for fallback...", err);
        // Try corsproxy.io
        try {
          const res = await fetch(`https://corsproxy.io/?` + encodeURIComponent(url));
          if (res.ok) {
            blob = await res.blob();
          } else {
            throw new Error(`Proxy HTTP ${res.status}`);
          }
        } catch (proxyErr) {
          console.warn("corsproxy.io fallback failed, trying allorigins.win...", proxyErr);
          // Try allorigins.win
          try {
            const res = await fetch(`https://api.allorigins.win/raw?url=` + encodeURIComponent(url));
            if (res.ok) {
              blob = await res.blob();
            } else {
              throw new Error(`Allorigins HTTP ${res.status}`);
            }
          } catch (aoErr) {
            console.warn("allorigins.win fallback failed as well:", aoErr);
          }
        }
      }
    }

    if (!blob) throw new Error("Failed to retrieve image content from all sources.");

    return await new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const maxDim = 800;
        let width = img.width;
        let height = img.height;
        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', 0.8));
        } else {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(blob!);
        }
        URL.revokeObjectURL(img.src);
      };
      img.onerror = () => {
        reject(new Error("Failed to load image for resizing"));
        URL.revokeObjectURL(img.src);
      };
      img.src = URL.createObjectURL(blob!);
    });
  } catch (e) {
    console.warn("Failed to fetch image as base64 client-side:", e);
    return url; // Fallback to sending original URL
  }
};

export default function AdminPanel() {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [activeTab, setActiveTab] = useState<'portfolio' | 'bookings' | 'messages'>('portfolio');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        if (currentUser.email === 'itsnotalwin@gmail.com') {
          setIsAdmin(true);
          // Silently register/ensure admin record exists in DB in background
          try {
            await setDoc(doc(db, 'admins', currentUser.uid), {
              email: currentUser.email,
              role: 'admin',
              bootstrapped: true
            });
          } catch (err) {
            // Silently swallow errors here so as not to pollute the console
          }
        } else {
          // Reject anyone else
          setIsAdmin(false);
        }
      } else {
        setIsAdmin(false);
      }
    });
    return () => unsubscribe();
  }, []);

  const handleLogin = async () => {
    const provider = new GoogleAuthProvider();
    provider.addScope('https://www.googleapis.com/auth/drive.readonly');
    provider.addScope('https://www.googleapis.com/auth/calendar');
    try {
      const result = await signInWithPopup(auth, provider);
      
      if (result.user.email !== 'itsnotalwin@gmail.com') {
        alert("Unauthorized. Only itsnotalwin@gmail.com is allowed as admin.");
        await signOut(auth);
        return;
      }

      const credential = GoogleAuthProvider.credentialFromResult(result);
      if (credential?.accessToken) {
        setGoogleAccessToken(credential.accessToken);
      }
    } catch (error: any) {
      console.error("Login failed", error);
      alert("Login failed: " + error.message + "\n\nMake sure to add this domain to Firebase Console Authorized Domains!");
    }
  };

  const handleLogout = async () => {
    try {
      setGoogleAccessToken(null);
      await signOut(auth);
    } catch (error) {
      console.error("Logout failed", error);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-oatmeal dark:bg-cocoa flex items-center justify-center p-6 text-espresso dark:text-alabaster font-sans">
        <div className="max-w-md w-full bg-white dark:bg-surface-1 p-8 border border-sand dark:border-dark-border text-center space-y-6">
          <h1 className="text-xl font-serif font-light italic tracking-tighter">SHUTTERHAUS VISUALS</h1>
          <p className="text-xs font-mono uppercase tracking-widest text-[#7c7265] dark:text-[#9a9088]">Admin Portal</p>
          <button 
            onClick={handleLogin}
            className="w-full py-3 bg-accent-light dark:bg-accent-dark text-white dark:text-cocoa text-[10px] tracking-widest font-mono uppercase font-bold hover:opacity-95 transition-all flex justify-center items-center gap-2"
          >
            <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="w-4 h-4">
              <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
              <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
              <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
              <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
              <path fill="none" d="M0 0h48v48H0z"></path>
            </svg>
            Sign in with Google
          </button>
          <RouterLink to="/" className="block mt-4 text-[10px] font-mono tracking-widest uppercase hover:underline">Return to Home</RouterLink>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-oatmeal dark:bg-cocoa text-espresso dark:text-alabaster font-sans flex flex-col md:flex-row">
      {/* Sidebar */}
      <div className="w-full md:w-64 border-b md:border-b-0 md:border-r border-sand dark:border-dark-border p-6 flex flex-col justify-between">
        <div className="space-y-8">
          <div>
            <h1 className="text-lg font-serif font-light italic tracking-tighter mb-1">SHUTTERHAUS</h1>
            <p className="text-[9px] font-mono uppercase tracking-widest text-accent-light dark:text-accent-dark">Admin Console</p>
          </div>
          <nav className="flex flex-col gap-2">
            <button 
              onClick={() => setActiveTab('portfolio')}
              className={`text-left px-4 py-2 text-xs font-mono uppercase tracking-wider transition-colors ${activeTab === 'portfolio' ? 'bg-espresso text-oatmeal dark:bg-alabaster dark:text-cocoa' : 'hover:bg-sand/30 dark:hover:bg-surface-1'}`}
            >
              Portfolio
            </button>
            <button 
              onClick={() => setActiveTab('bookings')}
              className={`text-left px-4 py-2 text-xs font-mono uppercase tracking-wider transition-colors ${activeTab === 'bookings' ? 'bg-espresso text-oatmeal dark:bg-alabaster dark:text-cocoa' : 'hover:bg-sand/30 dark:hover:bg-surface-1'}`}
            >
              Bookings
            </button>
            <button 
              onClick={() => setActiveTab('messages')}
              className={`text-left px-4 py-2 text-xs font-mono uppercase tracking-wider transition-colors ${activeTab === 'messages' ? 'bg-espresso text-oatmeal dark:bg-alabaster dark:text-cocoa' : 'hover:bg-sand/30 dark:hover:bg-surface-1'}`}
            >
              Messages
            </button>
            <RouterLink 
              to="/"
              className="text-left px-4 py-2 text-xs font-mono uppercase tracking-wider transition-colors hover:bg-sand/30 dark:hover:bg-surface-1 text-accent-light dark:text-accent-dark flex items-center gap-1.5"
            >
              ← Main Site
            </RouterLink>
          </nav>
        </div>
        <div className="pt-8 space-y-4">
          <p className="text-[10px] text-[#7c7265] dark:text-[#9a9088] truncate">{user?.email || "Guest"}</p>
          <button 
            onClick={handleLogout}
            className="w-full py-2 border border-sand dark:border-dark-border text-[9px] font-mono uppercase tracking-widest hover:bg-red-500 hover:text-white dark:hover:bg-red-900 transition-colors"
          >
            Sign Out
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-6 md:p-12 overflow-y-auto">
        {activeTab === 'portfolio' && <PortfolioManager />}
        {activeTab === 'bookings' && <BookingsManager />}
        {activeTab === 'messages' && <MessagesManager />}
      </div>
    </div>
  );
}

function PortfolioManager() {
  const [items, setItems] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [groqKey, setGroqKey] = useState(localStorage.getItem('groqApiKey') || '');
  const [geminiKey, setGeminiKey] = useState(localStorage.getItem('geminiApiKey') || '');
  const [aiEngine, setAiEngine] = useState<'groq' | 'gemini'>(localStorage.getItem('preferredAiEngine') as 'groq' | 'gemini' || 'gemini');
  
  // Batch states
  const [isBatchModalOpen, setIsBatchModalOpen] = useState(false);
  const [batchInputUrls, setBatchInputUrls] = useState('');
  const [batchItems, setBatchItems] = useState<any[]>([]);
  const [isBatchAnalyzing, setIsBatchAnalyzing] = useState(false);
  
  // Form states
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<'portrait' | 'boudoir' | 'family' | 'event' | 'editorial'>('editorial');
  const [year, setYear] = useState('2026');
  const [location, setLocation] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [description, setDescription] = useState('');
  const [dimensions, setDimensions] = useState('4000x6000');
  
  // Camera settings
  const [camera, setCamera] = useState('Canon EOS 4000D');
  const [lens, setLens] = useState('18-85mm');
  const [aperture, setAperture] = useState('f/2.8');
  const [shutterSpeed, setShutterSpeed] = useState('1/250s');
  const [iso, setIso] = useState('100');

  // Delete confirmation trackers
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  useEffect(() => {
    const q = query(collection(db, 'portfolio'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setItems(data);
    }, (error) => {
      console.warn("Portfolio real-time sync failed (using local state):", error);
    });
    return () => unsubscribe();
  }, []);

  const openAddModal = () => {
    setEditingId(null);
    setTitle('');
    setCategory('editorial');
    setYear(new Date().getFullYear().toString());
    setLocation('Johannesburg');
    setImageUrl('');
    setDescription('');
    setDimensions('4000x6000');
    setCamera('Canon EOS 4000D');
    setLens('18-85mm');
    setAperture('f/4.0');
    setShutterSpeed('1/160s');
    setIso('100');
    setIsModalOpen(true);
  };

  const openEditModal = (item: any) => {
    setEditingId(item.id);
    setTitle(item.title || '');
    setCategory(item.category || 'editorial');
    setYear(item.year || '2026');
    setLocation(item.location || '');
    setImageUrl(item.imageUrl || '');
    setDescription(item.description || '');
    setDimensions(item.dimensions || '4000x6000');
    
    // Unpack nested camera specs safely
    const cam = item.cameraSettings || {};
    setCamera(cam.camera || 'Canon EOS 4000D');
    setLens(cam.lens || '18-85mm');
    setAperture(cam.aperture || 'f/4.0');
    setShutterSpeed(cam.shutterSpeed || '1/160s');
    setIso(cam.iso || '100');
    
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !imageUrl) {
      alert("Please provide both a title and an image URL.");
      return;
    }

    const id = editingId || uuidv4();
    const portfolioPayload = {
      id,
      title,
      category,
      year,
      location,
      imageUrl,
      description,
      dimensions,
      cameraSettings: {
        camera,
        lens,
        aperture,
        shutterSpeed,
        iso
      }
    };

    try {
      await setDoc(doc(db, 'portfolio', id), portfolioPayload);
      setIsModalOpen(false);
      setEditingId(null);
    } catch (err) {
      console.error('Error saving portfolio item to Firestore:', err);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'portfolio', id));
      setDeleteConfirmId(null);
    } catch (err) {
      console.error('Error deleting portfolio item:', err);
    }
  };

  // Curated Preset Assets to easily change / preseed beautiful styling
  const PHOTO_PRESETS = [
    {
      category: 'editorial' as const,
      name: 'Avant-garde Couture',
      url: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&q=80',
      location: 'Milano Atelier',
      desc: 'Dramatic high-fashion couture lighting with striking shadows and fabric movement.',
      camera: 'Phase One XF',
      lens: 'Rodenstock 80mm'
    },
    {
      category: 'editorial' as const,
      name: 'Minimalist Neo-Noir',
      url: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&q=80',
      location: 'Berlin Bunker',
      desc: 'Intense high-contrast editorial featuring sharp geometry and modern minimalism.',
      camera: 'Canon EOS 4000D',
      lens: '18-85mm'
    },
    {
      category: 'portrait' as const,
      name: 'Golden Hour Gaze',
      url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80',
      location: 'Cape Dunes',
      desc: 'Soft, cinematic backlighting capturing genuine emotion with crisp organic details.',
      camera: 'Hasselblad X2D',
      lens: 'XCD 90mm'
    },
    {
      category: 'portrait' as const,
      name: 'Sovereign Shadow Portrait',
      url: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80',
      location: 'Studio C',
      desc: 'Classic low-key portraiture styled in dramatic high-contrast black and white.',
      camera: 'Phase One IQ4',
      lens: '150mm Blue Ring'
    },
    {
      category: 'boudoir' as const,
      name: 'Lace & Light Shadows',
      url: 'https://images.unsplash.com/photo-1522845015757-50bce044e5da?auto=format&fit=crop&q=80',
      location: 'Sonder Penthouse',
      desc: 'Intimate fine-art study highlighting graceful profiles, linen, and warm lace texture.',
      camera: 'Leica M11',
      lens: 'Noctilux-M 50mm'
    },
    {
      category: 'boudoir' as const,
      name: 'Warm Sunset Silk',
      url: 'https://images.unsplash.com/photo-1518156677180-95a2893f3e9f?auto=format&fit=crop&q=80',
      location: 'Chateau Suite',
      desc: 'Dreamy low-light exploration styled with velvet textures and vintage brass tones.',
      camera: 'Sony A7R V',
      lens: 'FE 50mm f/1.2 GM'
    },
    {
      category: 'family' as const,
      name: 'Generations Embrace',
      url: 'https://images.unsplash.com/photo-1609234656388-0ff363383899?auto=format&fit=crop&q=80',
      location: 'Wilderness Ridge',
      desc: 'Sincere, lifestyle-oriented documentary portraiture celebrating lineage and ties.',
      camera: 'Canon EOS R3',
      lens: 'RF 85mm f/1.2 DS'
    },
    {
      category: 'event' as const,
      name: 'Gala Grandeur',
      url: 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&q=80',
      location: 'The Diamond Room',
      desc: 'Vibrant, exclusive high-society social documenting candid visual interactions.',
      camera: 'Sony A9 III',
      lens: 'FE 24-70mm f/2.8 GM II'
    }
  ];

  const applyPreset = (preset: typeof PHOTO_PRESETS[0]) => {
    setTitle(preset.name);
    setCategory(preset.category);
    setImageUrl(preset.url);
    setLocation(preset.location);
    setDescription(preset.desc);
    setCamera(preset.camera);
    setLens(preset.lens);
  };

  const handleGenerateMetadata = async () => {
    if (!imageUrl) return;
    setIsGenerating(true);
    try {
      let data;
      if (aiEngine === 'gemini') {
        try {
          const response = await fetch('/api/gemini-generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ imageUrl, geminiApiKey: geminiKey, googleAccessToken })
          });
          
          if (response.status === 405 || response.status === 404) {
            throw new Error('Backend not available');
          }
          
          data = await response.json();
          if (!response.ok) {
            throw new Error(data.error || 'Failed to generate metadata');
          }
        } catch (err: any) {
          // Fallback: Call Gemini API directly from the client if backend is missing
          console.warn('Backend API failed or missing, attempting direct client-side Gemini call...', err);
          if (!geminiKey) throw new Error('Gemini API Key is required for direct client-side calls (e.g. on GitHub Pages).');
          
          const finalImageUrl = await fetchImageAsBase64(imageUrl);
          let rawBase64 = "";
          let mimeType = "image/jpeg";
          if (finalImageUrl.startsWith("data:")) {
            const match = finalImageUrl.match(/^data:([^;]+);base64,(.+)$/);
            if (match && match.length === 3) {
              mimeType = match[1];
              rawBase64 = match[2];
            }
          }
          if (!rawBase64) {
            throw new Error("Could not load image data for direct client-side analysis. Make sure the image URL is accessible.");
          }

          const directResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [
                {
                  parts: [
                    {
                      inlineData: {
                        mimeType: mimeType,
                        data: rawBase64
                      }
                    },
                    {
                      text: "Analyze this image and return an SEO-optimized JSON object suitable for a premium photography portfolio website. The response must contain a captivating, elegant 'title'; a single 'category' that matches exactly one of ['portrait', 'boudoir', 'family', 'event', 'editorial']; a refined, 1-2 sentence search-optimized 'description' capturing the mood, depth, and aesthetics; and an array of 3 to 5 'seoKeywords' representing the photo tags. Return ONLY the JSON object, nothing else. Format: { \"title\": \"...\", \"category\": \"...\", \"description\": \"...\", \"seoKeywords\": [...] }"
                    }
                  ]
                }
              ],
              generationConfig: {
                responseMimeType: "application/json"
              }
            })
          });

          if (!directResponse.ok) {
            const errData = await directResponse.json();
            throw new Error(errData.error?.message || 'Direct Gemini API call failed');
          }

          const directData = await directResponse.json();
          const textContent = directData.candidates?.[0]?.content?.parts?.[0]?.text;
          if (!textContent) {
            throw new Error("No response text returned from direct Gemini API");
          }
          data = JSON.parse(textContent);
        }
      } else {
        // Groq Engine
        try {
          const response = await fetch('/api/groq-generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ imageUrl, groqApiKey: groqKey, googleAccessToken })
          });
          
          if (response.status === 405 || response.status === 404) {
            throw new Error('Backend not available');
          }
          
          data = await response.json();
          
          if (!response.ok) {
            throw new Error(data.error || 'Failed to generate metadata');
          }
        } catch (err: any) {
          // Fallback: Call Groq API directly from the client if backend is missing
          console.warn('Backend API failed or missing, attempting direct client-side Groq call...', err);
          if (!groqKey) throw new Error('Groq API Key is required for direct client-side calls.');
          
          const finalImageUrl = await fetchImageAsBase64(imageUrl);
          
          const completion = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${groqKey}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              model: "meta-llama/llama-4-scout-17b-16e-instruct",
              messages: [
                {
                  role: "user",
                  content: [
                    {
                      type: "text",
                      text: "Analyze this image and return a JSON object with a suitable title, category (must be exactly one of: 'portrait', 'boudoir', 'family', 'event', 'editorial'), and a short 1-2 sentence description for a fine-art photography portfolio. Return ONLY the JSON object, nothing else. Format: { \"title\": \"...\", \"category\": \"...\", \"description\": \"...\" }"
                    },
                    {
                      type: "image_url",
                      image_url: { url: finalImageUrl }
                    }
                  ]
                }
              ],
              response_format: { type: "json_object" }
            })
          });
          
          if (!completion.ok) {
             const errData = await completion.json();
             throw new Error(errData.error?.message || 'Direct Groq API call failed');
          }
          
          const completionData = await completion.json();
          const content = completionData.choices[0]?.message?.content;
          
          try {
            data = JSON.parse(content);
          } catch (e) {
            const match = content.match(/```(?:json)?\n([\s\S]*?)\n```/);
            if (match) {
              data = JSON.parse(match[1]);
            } else {
              const matchBraces = content.match(/\{[\s\S]*\}/);
              if (matchBraces) data = JSON.parse(matchBraces[0]);
              else throw new Error('Failed to parse fallback Groq response');
            }
          }
        }
      }

      if (data.title) setTitle(data.title);
      if (data.category) setCategory(data.category);
      if (data.description) {
        let finalDesc = data.description;
        if (data.seoKeywords && data.seoKeywords.length > 0) {
          finalDesc += "\n\nSEO Tags: " + data.seoKeywords.map((k: string) => `#${k.replace(/\s+/g, '')}`).join(' ');
        }
        setDescription(finalDesc);
      }
    } catch (err: any) {
      alert(err.message);
      console.error(err);
    } finally {
      setIsGenerating(false);
    }
  };

  // Batch Handlers
  const handleAddUrlsToBatch = () => {
    if (!batchInputUrls.trim()) return;
    const lines = batchInputUrls.split(/\n|,/).map(url => url.trim()).filter(url => url.startsWith('http'));
    if (lines.length === 0) {
      alert("No valid image URLs (starting with http) found.");
      return;
    }

    const newBatchItems = lines.map(url => ({
      id: uuidv4(),
      imageUrl: url,
      title: 'Pending AI Analysis...',
      category: 'editorial' as const,
      year: new Date().getFullYear().toString(),
      location: 'Johannesburg',
      description: '',
      camera: 'Canon EOS 4000D',
      lens: '18-85mm',
      aperture: 'f/4.0',
      shutterSpeed: '1/160s',
      iso: '100',
      status: 'pending' as const,
      error: ''
    }));

    setBatchItems(prev => [...prev, ...newBatchItems]);
    setBatchInputUrls('');
  };

  const handleAddDriveFilesToBatch = (files: { id: string, name: string, url: string }[]) => {
    const newBatchItems = files.map(file => {
      const cleanTitle = file.name.replace(/\.[^/.]+$/, "");
      return {
        id: uuidv4(),
        imageUrl: file.url,
        title: cleanTitle || 'Pending AI Analysis...',
        category: 'editorial' as const,
        year: new Date().getFullYear().toString(),
        location: 'Johannesburg',
        description: '',
        camera: 'Canon EOS 4000D',
        lens: '18-85mm',
        aperture: 'f/4.0',
        shutterSpeed: '1/160s',
        iso: '100',
        status: 'pending' as const,
        error: ''
      };
    });
    setBatchItems(prev => [...prev, ...newBatchItems]);
  };

  const handleAnalyzeBatch = async () => {
    if (batchItems.length === 0) return;
    const itemsToAnalyze = batchItems.filter(item => item.status === 'pending' || item.status === 'failed');
    if (itemsToAnalyze.length === 0) {
      alert("No pending or failed items to analyze.");
      return;
    }

    setIsBatchAnalyzing(true);
    
    // Process items in sequence to avoid rate limits
    for (const item of itemsToAnalyze) {
      setBatchItems(prev => prev.map(i => i.id === item.id ? { ...i, status: 'analyzing' } : i));

      try {
        let data;
        if (aiEngine === 'gemini') {
          try {
            const response = await fetch('/api/gemini-generate', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                imageUrl: item.imageUrl,
                geminiApiKey: geminiKey,
                googleAccessToken
              })
            });

            if (response.status === 405 || response.status === 404) {
               throw new Error('Backend not available');
            }

            data = await response.json();
            if (!response.ok) {
              throw new Error(data.error || 'Failed to analyze');
            }
          } catch (err: any) {
            console.warn('Backend API failed or missing, attempting direct client-side Gemini call...', err);
            if (!geminiKey) throw new Error('Gemini API Key is required for direct client-side calls.');
            
            const finalImageUrl = await fetchImageAsBase64(item.imageUrl);
            let rawBase64 = "";
            let mimeType = "image/jpeg";
            if (finalImageUrl.startsWith("data:")) {
              const match = finalImageUrl.match(/^data:([^;]+);base64,(.+)$/);
              if (match && match.length === 3) {
                mimeType = match[1];
                rawBase64 = match[2];
              }
            }
            if (!rawBase64) {
              throw new Error("Could not load image data for direct client-side analysis. Make sure the image URL is accessible.");
            }

            const directResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiKey}`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                contents: [
                  {
                    parts: [
                      {
                        inlineData: {
                          mimeType: mimeType,
                          data: rawBase64
                        }
                      },
                      {
                        text: "Analyze this image and return an SEO-optimized JSON object suitable for a premium photography portfolio website. The response must contain a captivating, elegant 'title'; a single 'category' that matches exactly one of ['portrait', 'boudoir', 'family', 'event', 'editorial']; a refined, 1-2 sentence search-optimized 'description' capturing the mood, depth, and aesthetics; and an array of 3 to 5 'seoKeywords' representing the photo tags. Return ONLY the JSON object, nothing else. Format: { \"title\": \"...\", \"category\": \"...\", \"description\": \"...\", \"seoKeywords\": [...] }"
                      }
                    ]
                  }
                ],
                generationConfig: {
                  responseMimeType: "application/json"
                }
              })
            });

            if (!directResponse.ok) {
              const errData = await directResponse.json();
              throw new Error(errData.error?.message || 'Direct Gemini API call failed');
            }

            const directData = await directResponse.json();
            const textContent = directData.candidates?.[0]?.content?.parts?.[0]?.text;
            if (!textContent) {
              throw new Error("No response text returned from direct Gemini API");
            }
            data = JSON.parse(textContent);
          }
        } else {
          // Groq engine
          try {
            const response = await fetch('/api/groq-generate', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                imageUrl: item.imageUrl,
                groqApiKey: groqKey,
                googleAccessToken
              })
            });

            if (response.status === 405 || response.status === 404) {
               throw new Error('Backend not available');
            }

            data = await response.json();
            if (!response.ok) {
              throw new Error(data.error || 'Failed to analyze');
            }
          } catch (err: any) {
            console.warn('Backend API failed or missing, attempting direct client-side Groq call...', err);
            if (!groqKey) throw new Error('Groq API Key is required for direct client-side calls.');
            
            const finalImageUrl = await fetchImageAsBase64(item.imageUrl);
            
            const completion = await fetch('https://api.groq.com/openai/v1/chat/completions', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${groqKey}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                model: "meta-llama/llama-4-scout-17b-16e-instruct",
                messages: [
                  {
                    role: "user",
                    content: [
                      {
                        type: "text",
                        text: "Analyze this image and return a JSON object with a suitable title, category (must be exactly one of: 'portrait', 'boudoir', 'family', 'event', 'editorial'), and a short 1-2 sentence description for a fine-art photography portfolio. Return ONLY the JSON object, nothing else. Format: { \"title\": \"...\", \"category\": \"...\", \"description\": \"...\" }"
                      },
                      {
                        type: "image_url",
                        image_url: { url: finalImageUrl }
                      }
                    ]
                  }
                ],
                response_format: { type: "json_object" }
              })
            });
            
            if (!completion.ok) {
               const errData = await completion.json();
               throw new Error(errData.error?.message || 'Direct Groq API call failed');
            }
            
            const completionData = await completion.json();
            const content = completionData.choices[0]?.message?.content;
            
            try {
              data = JSON.parse(content);
            } catch (e) {
              const match = content.match(/```(?:json)?\n([\s\S]*?)\n```/);
              if (match) {
                data = JSON.parse(match[1]);
              } else {
                const matchBraces = content.match(/\{[\s\S]*\}/);
                if (matchBraces) data = JSON.parse(matchBraces[0]);
                else throw new Error('Failed to parse fallback Groq response');
              }
            }
          }
        }

        // Apply SEO keywords to description if present
        let finalDescription = data.description || item.description;
        if (data.seoKeywords && data.seoKeywords.length > 0) {
          finalDescription += "\n\nSEO Tags: " + data.seoKeywords.map((k: string) => `#${k.replace(/\s+/g, '')}`).join(' ');
        }

        setBatchItems(prev => prev.map(i => i.id === item.id ? {
          ...i,
          title: data.title || i.title,
          category: data.category || i.category,
          description: finalDescription,
          status: 'done' as const,
          error: ''
        } : i));
      } catch (err: any) {
        console.error("Batch item analysis error:", err);
        setBatchItems(prev => prev.map(i => i.id === item.id ? {
          ...i,
          status: 'failed' as const,
          error: err.message || 'Error occurred'
        } : i));
      }
    }
    setIsBatchAnalyzing(false);
  };

  const handleUpdateBatchItemField = (id: string, field: string, value: any) => {
    setBatchItems(prev => prev.map(item => item.id === id ? { ...item, [field]: value } : item));
  };

  const handleRemoveBatchItem = (id: string) => {
    setBatchItems(prev => prev.filter(item => item.id !== id));
  };

  const handleSaveBatch = async () => {
    if (batchItems.length === 0) {
      alert("Please add at least one image to the batch.");
      return;
    }
    const invalidItems = batchItems.filter(item => !item.imageUrl);
    if (invalidItems.length > 0) {
      alert("Some items are missing image URLs.");
      return;
    }

    try {
      const savePromises = batchItems.map(item => {
        const payload = {
          id: item.id,
          title: item.title,
          category: item.category,
          year: item.year,
          location: item.location,
          imageUrl: item.imageUrl,
          description: item.description,
          dimensions: '4000x6000',
          cameraSettings: {
            camera: item.camera,
            lens: item.lens,
            aperture: item.aperture,
            shutterSpeed: item.shutterSpeed,
            iso: item.iso
          }
        };
        return setDoc(doc(db, 'portfolio', item.id), payload);
      });

      await Promise.all(savePromises);
      setIsBatchModalOpen(false);
      setBatchItems([]);
      alert(`Successfully added ${batchItems.length} fine-art photo(s) to your portfolio!`);
    } catch (err) {
      console.error("Error saving batch to Firestore:", err);
      alert("Failed to save some or all items. Please try again.");
    }
  };

  const preseedCuratedCollection = async () => {
    if (!window.confirm('This will populate the database with a curation of 6 premium, pre-configured fine-art portfolio images. Continue?')) {
      return;
    }
    try {
      for (const preset of PHOTO_PRESETS.slice(0, 6)) {
        const id = uuidv4();
        await setDoc(doc(db, 'portfolio', id), {
          id,
          title: preset.name,
          category: preset.category,
          year: '2026',
          location: preset.location,
          imageUrl: preset.url,
          description: preset.desc,
          dimensions: '4000x6000',
          cameraSettings: {
            camera: preset.camera,
            lens: preset.lens,
            aperture: 'f/2.8',
            shutterSpeed: '1/160s',
            iso: '100'
          }
        });
      }
    } catch (err) {
      console.error('Failed to preseed collection:', err);
    }
  };

  const clearPortfolio = async () => {
    if (!window.confirm('Are you sure you want to completely clear the entire portfolio? This action cannot be undone.')) {
      return;
    }
    try {
      const q = query(collection(db, 'portfolio'));
      const snapshot = await getDocs(q);
      const batch = writeBatch(db);
      snapshot.docs.forEach((doc) => {
        batch.delete(doc.ref);
      });
      await batch.commit();
      alert('Portfolio cleared successfully.');
    } catch (err) {
      console.error('Failed to clear portfolio:', err);
      alert('Failed to clear portfolio. Check console for details.');
    }
  };

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="border-b border-sand dark:border-dark-border pb-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl font-serif font-light text-espresso dark:text-alabaster">Portfolio Curation & Image Manager</h2>
          <p className="text-xs font-mono text-[#7c7265] dark:text-[#9a9088] mt-1">
            Publish new fine-art photography, modify settings, swap image URLs, or preseed defaults.
          </p>
        </div>
        
        <div className="flex gap-2 w-full md:w-auto flex-wrap">
          <button 
            onClick={clearPortfolio}
            className="flex items-center gap-1.5 px-3 py-1.5 border border-red-500/50 hover:bg-red-500/10 text-[10px] font-mono uppercase tracking-wider text-red-500 transition-colors"
          >
            <Trash2 className="w-3 h-3" />
            <span>Clear Portfolio</span>
          </button>

          <button 
            onClick={preseedCuratedCollection}
            className="flex items-center gap-1.5 px-3 py-1.5 border border-sand dark:border-dark-border hover:bg-sand/20 dark:hover:bg-surface-2 text-[10px] font-mono uppercase tracking-wider text-[#7c7265] dark:text-[#9a9088]"
          >
            <RefreshCw className="w-3 h-3 animate-spin-hover" />
            <span>Preseed Defaults</span>
          </button>
          
          <button 
            onClick={openAddModal} 
            className="flex items-center gap-1.5 px-4 py-1.5 bg-espresso dark:bg-alabaster text-oatmeal dark:text-cocoa text-[10px] font-mono uppercase tracking-widest font-bold hover:opacity-95 transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add New Photo</span>
          </button>

          <button 
            onClick={() => {
              setBatchItems([]);
              setBatchInputUrls('');
              setIsBatchModalOpen(true);
            }} 
            className="flex items-center gap-1.5 px-4 py-1.5 bg-accent-light dark:bg-accent-dark text-white dark:text-cocoa text-[10px] font-mono uppercase tracking-widest font-bold hover:opacity-95 transition-all"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Batch AI Upload</span>
          </button>
        </div>
      </div>

      {/* Grid List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {items.map(item => (
          <div key={item.id} className="group relative border border-sand dark:border-dark-border bg-white dark:bg-surface-1 overflow-hidden transition-all duration-300 hover:shadow-md flex flex-col">
            
            {/* Thumbnail Box */}
            <div className="relative aspect-[3/2] overflow-hidden bg-oatmeal/20 dark:bg-surface-2/20 border-b border-sand dark:border-dark-border">
              <img 
                src={item.imageUrl} 
                alt={item.title} 
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                onError={(e) => {
                  // Fallback for broken image links
                  (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1554080353-a576cf803bda?auto=format&fit=crop&q=80';
                }}
              />
              <span className="absolute top-3 left-3 text-[8px] font-mono uppercase tracking-widest font-bold px-2 py-0.5 bg-espresso/90 text-oatmeal dark:bg-alabaster/90 dark:text-cocoa">
                {item.category}
              </span>
              <span className="absolute bottom-3 right-3 text-[8px] font-mono px-1.5 py-0.5 bg-white/80 dark:bg-black/80 text-espresso dark:text-alabaster">
                {item.dimensions || '4000x6000'}
              </span>
            </div>

            {/* Info Body */}
            <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
              <div className="space-y-1">
                <div className="flex justify-between items-start gap-2">
                  <h3 className="font-bold text-sm text-espresso dark:text-alabaster tracking-tight line-clamp-1">{item.title}</h3>
                  <span className="text-[10px] font-mono text-[#7c7265] dark:text-[#9a9088] shrink-0">{item.year}</span>
                </div>
                <p className="text-[11px] text-[#7c7265] dark:text-[#9a9088] italic line-clamp-1">{item.location || 'In Studio'}</p>
                {item.description && (
                  <p className="text-[11px] text-[#7c7265]/80 dark:text-[#9a9088]/80 line-clamp-2 pt-1 border-t border-sand/30 dark:border-dark-border/30">
                    {item.description}
                  </p>
                )}
              </div>

              {/* Camera Metadata Summary */}
              {item.cameraSettings && (
                <div className="bg-oatmeal/40 dark:bg-surface-2/30 p-2 border border-sand/30 dark:border-dark-border/20 text-[9px] font-mono space-y-0.5 text-[#7c7265] dark:text-[#9a9088]">
                  <div className="flex justify-between gap-2">
                    <span className="truncate max-w-[120px] font-bold text-espresso dark:text-alabaster">{item.cameraSettings.camera}</span>
                    <span>{item.cameraSettings.lens}</span>
                  </div>
                  <div className="flex justify-between text-espresso/80 dark:text-alabaster/80">
                    <span>{item.cameraSettings.aperture} • {item.cameraSettings.shutterSpeed}</span>
                    <span>ISO {item.cameraSettings.iso}</span>
                  </div>
                </div>
              )}

              {/* Control Actions Row */}
              <div className="flex justify-between items-center pt-2 border-t border-sand/40 dark:border-dark-border/30">
                {deleteConfirmId === item.id ? (
                  <div className="flex gap-2 w-full justify-between items-center text-red-500 font-mono text-[9px]">
                    <span className="font-bold">Delete permanently?</span>
                    <div className="flex gap-1.5">
                      <button 
                        onClick={() => handleDelete(item.id)}
                        className="bg-red-500 text-white font-bold px-2 py-1 uppercase hover:bg-red-600"
                      >
                        Confirm
                      </button>
                      <button 
                        onClick={() => setDeleteConfirmId(null)}
                        className="border border-sand dark:border-dark-border text-espresso dark:text-alabaster px-2 py-1 uppercase hover:bg-sand/10"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <button 
                      onClick={() => openEditModal(item)}
                      className="flex items-center gap-1 text-[10px] text-espresso dark:text-alabaster font-mono uppercase tracking-wider hover:opacity-75 transition-colors"
                    >
                      <Edit2 className="w-3 h-3" />
                      <span>Edit Details</span>
                    </button>
                    <button 
                      onClick={() => setDeleteConfirmId(item.id)}
                      className="flex items-center gap-1 text-[10px] text-red-500 font-mono uppercase tracking-wider hover:underline"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>Delete</span>
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        ))}
        
        {items.length === 0 && (
          <div className="col-span-full border border-dashed border-sand dark:border-dark-border p-12 text-center text-xs text-[#7c7265] dark:text-[#9a9088] space-y-3 bg-white/20 dark:bg-surface-1/20">
            <ImageIcon className="w-8 h-8 mx-auto opacity-40 text-espresso dark:text-alabaster" />
            <p className="font-mono">No live Firestore portfolio curation records detected.</p>
            <p className="max-w-md mx-auto">
              Click <strong className="text-espresso dark:text-alabaster">"Preseed Defaults"</strong> above to load a stunning fine-art layout instantly, or add custom photo blocks.
            </p>
          </div>
        )}
      </div>

      {/* MODAL EDIT/ADD PORTFOLIO DIALOG */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="relative bg-oatmeal dark:bg-cocoa border border-sand dark:border-dark-border max-w-2xl w-full p-6 md:p-8 space-y-6 shadow-2xl max-h-[90vh] overflow-y-auto font-sans text-espresso dark:text-alabaster">
            
            {/* Header */}
            <div className="flex justify-between items-start border-b border-sand dark:border-dark-border pb-4">
              <div>
                <h3 className="text-lg font-serif font-light">
                  {editingId ? 'Edit Fine-Art Portfolio Piece' : 'Add New Portfolio Masterpiece'}
                </h3>
                <p className="text-[11px] font-mono text-[#7c7265] dark:text-[#9a9088] mt-0.5">
                  {editingId ? 'Modify existing parameters and visual URLs.' : 'Introduce new creative photography works to the dynamic display.'}
                </p>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-1 border border-sand dark:border-dark-border hover:bg-sand/20 dark:hover:bg-surface-2 text-[#7c7265] dark:text-[#9a9088]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Quick Assets presets selection panel (highly functional) */}
            <div className="border border-sand/60 dark:border-dark-border/60 bg-white/40 dark:bg-surface-1/40 p-4 space-y-3">
              <span className="text-[9px] font-mono uppercase tracking-wider text-accent-light dark:text-accent-dark font-bold flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                <span>Quick Aesthetic Assets presets library</span>
              </span>
              <p className="text-[10px] text-[#7c7265] dark:text-[#9a9088]">
                Instantly swap all form variables to a pre-configured high-resolution Unsplash photo preset to test aesthetic layouts.
              </p>
              <div className="flex gap-1.5 flex-wrap">
                {PHOTO_PRESETS.map((preset, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => applyPreset(preset)}
                    className="px-2 py-1 text-[9px] font-mono border border-sand dark:border-dark-border bg-white dark:bg-surface-2 hover:bg-espresso dark:hover:bg-alabaster hover:text-oatmeal dark:hover:text-cocoa transition-colors"
                  >
                    {preset.name} ({preset.category})
                  </button>
                ))}
              </div>
            </div>

            {/* Main Form */}
            <form onSubmit={handleSave} className="space-y-5">
              
              {/* Image URL with live preview */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-mono uppercase tracking-wider block font-bold">Image URL *</label>
                <div className="flex gap-3">
                  <div className="flex-1 flex flex-col gap-2">
                    <div className="flex gap-2">
                      <input 
                        type="url"
                        required
                        placeholder="https://images.unsplash.com/photo-..."
                        value={imageUrl}
                        onChange={(e) => setImageUrl(e.target.value)}
                        className="w-full p-2.5 bg-white dark:bg-surface-1 border border-sand dark:border-dark-border text-xs focus:outline-none focus:border-accent-light dark:focus:border-accent-dark"
                      />
                      <GoogleDrivePicker onPick={(file) => {
                        setImageUrl(file.url);
                        if (!title) setTitle(file.name.replace(/\.[^/.]+$/, ""));
                      }} />
                    </div>
                    {imageUrl && (
                      <div className="space-y-2">
                        {/* Engine selector */}
                        <div className="flex items-center justify-between gap-2 border border-sand/40 dark:border-dark-border/40 p-1.5 bg-oatmeal/20 dark:bg-surface-1/40">
                          <span className="text-[9px] font-mono uppercase text-[#7c7265] dark:text-[#9a9088] pl-1">
                            AI Model Engine
                          </span>
                          <div className="flex gap-1">
                            <button
                              type="button"
                              onClick={() => {
                                setAiEngine('gemini');
                                localStorage.setItem('preferredAiEngine', 'gemini');
                              }}
                              className={`px-2 py-0.5 text-[9px] font-mono uppercase transition-all ${
                                aiEngine === 'gemini'
                                  ? 'bg-accent-light dark:bg-accent-dark text-white dark:text-cocoa font-bold'
                                  : 'text-[#7c7265] dark:text-[#9a9088] hover:text-[#5a5248]'
                              }`}
                            >
                              Gemini 3.5
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setAiEngine('groq');
                                localStorage.setItem('preferredAiEngine', 'groq');
                              }}
                              className={`px-2 py-0.5 text-[9px] font-mono uppercase transition-all ${
                                aiEngine === 'groq'
                                  ? 'bg-accent-light dark:bg-accent-dark text-white dark:text-cocoa font-bold'
                                  : 'text-[#7c7265] dark:text-[#9a9088] hover:text-[#5a5248]'
                              }`}
                            >
                              Llama 4 (Groq)
                            </button>
                          </div>
                        </div>

                        {/* Selected Key input & Auto-fill button */}
                        <div className="flex gap-2">
                          {aiEngine === 'gemini' ? (
                            <input 
                              type="password"
                              placeholder="Gemini API Key - Optional if set in AI Studio"
                              value={geminiKey}
                              onChange={(e) => {
                                setGeminiKey(e.target.value);
                                localStorage.setItem('geminiApiKey', e.target.value);
                              }}
                              className="flex-1 p-2 bg-white dark:bg-surface-1 border border-sand dark:border-dark-border text-xs focus:outline-none"
                            />
                          ) : (
                            <input 
                              type="password"
                              placeholder="Groq API Key (gsk_...) - Optional"
                              value={groqKey}
                              onChange={(e) => {
                                setGroqKey(e.target.value);
                                localStorage.setItem('groqApiKey', e.target.value);
                              }}
                              className="flex-1 p-2 bg-white dark:bg-surface-1 border border-sand dark:border-dark-border text-xs focus:outline-none"
                            />
                          )}
                          <button
                            type="button"
                            onClick={handleGenerateMetadata}
                            disabled={isGenerating}
                            className="px-3 py-2 bg-accent-light dark:bg-accent-dark text-white dark:text-cocoa text-[10px] tracking-widest font-mono uppercase font-bold hover:opacity-95 transition-all flex items-center justify-center gap-2 whitespace-nowrap"
                          >
                            <Sparkles className={`w-3 h-3 ${isGenerating ? 'animate-spin' : ''}`} />
                            {isGenerating ? 'Analyzing...' : 'AI SEO Auto-Fill'}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                  {imageUrl && (
                    <div className="w-12 h-12 border border-sand dark:border-dark-border shrink-0 bg-white dark:bg-surface-2 overflow-hidden">
                      <img 
                        src={imageUrl} 
                        alt="Preview" 
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1554080353-a576cf803bda?auto=format&fit=crop&q=80';
                        }}
                      />
                    </div>
                  )}
                </div>
                <span className="text-[9px] font-mono text-[#7c7265] dark:text-[#9a9088] block">Provide a valid high-quality photography Unsplash image address, direct link or storage URL.</span>
              </div>

              {/* Title & Category Pair */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono uppercase tracking-wider block font-bold">Photo Title *</label>
                  <input 
                    type="text"
                    required
                    placeholder="E.g., Soft Shadows & Lace"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full p-2.5 bg-white dark:bg-surface-1 border border-sand dark:border-dark-border text-xs focus:outline-none focus:border-accent-light dark:focus:border-accent-dark"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono uppercase tracking-wider block font-bold">Creative Category *</label>
                  <select 
                    value={category}
                    onChange={(e: any) => setCategory(e.target.value)}
                    className="w-full p-2.5 bg-white dark:bg-surface-1 border border-sand dark:border-dark-border text-xs focus:outline-none focus:border-accent-light dark:focus:border-accent-dark"
                  >
                    <option value="portrait">Portrait & Profile</option>
                    <option value="editorial">Editorial & Haute Couture</option>
                    <option value="boudoir">Boudoir & Fine Art Shadow</option>
                    <option value="family">Family & Legacy Essence</option>
                    <option value="event">Event & Gala Celebration</option>
                  </select>
                </div>
              </div>

              {/* Year, Location & Dimensions Trio */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono uppercase tracking-wider block font-bold">Production Year</label>
                  <input 
                    type="text"
                    placeholder="2026"
                    value={year}
                    onChange={(e) => setYear(e.target.value)}
                    className="w-full p-2.5 bg-white dark:bg-surface-1 border border-sand dark:border-dark-border text-xs focus:outline-none focus:border-accent-light dark:focus:border-accent-dark"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono uppercase tracking-wider block font-bold">Studio / Location</label>
                  <select 
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full p-2.5 bg-white dark:bg-surface-1 border border-sand dark:border-dark-border text-xs focus:outline-none focus:border-accent-light dark:focus:border-accent-dark"
                  >
                    <option value="" disabled>Select Location</option>
                    {SA_LOCATIONS.map(loc => (
                      <option key={loc} value={loc}>{loc}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono uppercase tracking-wider block font-bold">Max Print Dimensions</label>
                  <input 
                    type="text"
                    placeholder="4000x6000"
                    value={dimensions}
                    onChange={(e) => setDimensions(e.target.value)}
                    className="w-full p-2.5 bg-white dark:bg-surface-1 border border-sand dark:border-dark-border text-xs focus:outline-none focus:border-accent-light dark:focus:border-accent-dark"
                  />
                </div>
              </div>

              {/* Camera settings nested panel header */}
              <div className="border-t border-sand dark:border-dark-border pt-4 space-y-3">
                <span className="text-[10px] font-mono uppercase tracking-widest text-[#7c7265] dark:text-[#9a9088] font-bold flex items-center gap-1.5">
                  <Camera className="w-3.5 h-3.5" />
                  <span>Camera Exposure & EXIF Metadata Specs</span>
                </span>

                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                  <div className="space-y-1">
                    <label className="text-[9px] font-mono uppercase block text-[#7c7265] dark:text-[#9a9088]">Camera Body</label>
                    <input 
                      type="text"
                      placeholder="Canon EOS 4000D"
                      value={camera}
                      onChange={(e) => setCamera(e.target.value)}
                      className="w-full p-2 bg-white dark:bg-surface-1 border border-sand dark:border-dark-border text-xs focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-mono uppercase block text-[#7c7265] dark:text-[#9a9088]">Lens System</label>
                    <input 
                      type="text"
                      placeholder="50mm f/1.4"
                      value={lens}
                      onChange={(e) => setLens(e.target.value)}
                      className="w-full p-2 bg-white dark:bg-surface-1 border border-sand dark:border-dark-border text-xs focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-mono uppercase block text-[#7c7265] dark:text-[#9a9088]">Aperture</label>
                    <input 
                      type="text"
                      placeholder="f/2.8"
                      value={aperture}
                      onChange={(e) => setAperture(e.target.value)}
                      className="w-full p-2 bg-white dark:bg-surface-1 border border-sand dark:border-dark-border text-xs focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-mono uppercase block text-[#7c7265] dark:text-[#9a9088]">Shutter Speed</label>
                    <input 
                      type="text"
                      placeholder="1/160s"
                      value={shutterSpeed}
                      onChange={(e) => setShutterSpeed(e.target.value)}
                      className="w-full p-2 bg-white dark:bg-surface-1 border border-sand dark:border-dark-border text-xs focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1 col-span-2 md:col-span-1">
                    <label className="text-[9px] font-mono uppercase block text-[#7c7265] dark:text-[#9a9088]">ISO Rating</label>
                    <input 
                      type="text"
                      placeholder="100"
                      value={iso}
                      onChange={(e) => setIso(e.target.value)}
                      className="w-full p-2 bg-white dark:bg-surface-1 border border-sand dark:border-dark-border text-xs focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Description box */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-mono uppercase tracking-wider block font-bold">Creative Vision Description</label>
                <textarea 
                  rows={2}
                  placeholder="Detail the creative composition, lighting architecture, shadow aesthetics, or thematic expression..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full p-2.5 bg-white dark:bg-surface-1 border border-sand dark:border-dark-border text-xs focus:outline-none focus:border-accent-light dark:focus:border-accent-dark resize-none"
                />
              </div>

              {/* Bottom buttons */}
              <div className="flex justify-end gap-3 pt-4 border-t border-sand dark:border-dark-border">
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-sand dark:border-dark-border text-[10px] font-mono uppercase tracking-widest hover:bg-sand/10"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="px-6 py-2 bg-espresso dark:bg-alabaster text-oatmeal dark:text-cocoa text-[10px] font-mono uppercase tracking-widest font-bold hover:opacity-90 transition-all flex items-center gap-1.5"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>{editingId ? 'Apply Changes' : 'Publish to Portfolio'}</span>
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* BATCH UPLOAD MODAL */}
      {isBatchModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="relative bg-oatmeal dark:bg-cocoa border border-sand dark:border-dark-border max-w-5xl w-full p-6 md:p-8 space-y-6 shadow-2xl max-h-[92vh] overflow-y-auto font-sans text-espresso dark:text-alabaster flex flex-col">
            
            {/* Header */}
            <div className="flex justify-between items-start border-b border-sand dark:border-dark-border pb-4">
              <div>
                <h3 className="text-lg font-serif font-light flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-accent-light dark:text-accent-dark animate-pulse" />
                  <span>Batch Fine-Art AI Ingestion System</span>
                </h3>
                <p className="text-[11px] font-mono text-[#7c7265] dark:text-[#9a9088] mt-0.5">
                  Index multiple masterpieces simultaneously. Analyze compositions, generate titles, and auto-populate EXIF metadata with Groq.
                </p>
              </div>
              <button 
                onClick={() => {
                  if (batchItems.length > 0 && !window.confirm("Close batch modal? Unsaved batch items will be discarded.")) return;
                  setIsBatchModalOpen(false);
                }}
                className="p-1 border border-sand dark:border-dark-border hover:bg-sand/20 dark:hover:bg-surface-2 text-[#7c7265] dark:text-[#9a9088]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Ingestion Sources Panel */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 bg-white/40 dark:bg-surface-1/40 p-4 border border-sand/60 dark:border-dark-border/60">
              {/* Left: Input URLs */}
              <div className="md:col-span-8 space-y-2">
                <label className="text-[10px] font-mono uppercase tracking-wider block font-bold">Ingest Image URLs</label>
                <p className="text-[10px] text-[#7c7265] dark:text-[#9a9088] mb-1">
                  Paste high-resolution photo URLs (Unsplash, absolute URLs, or hosting endpoints). One URL per line or separated by commas.
                </p>
                <textarea
                  rows={3}
                  value={batchInputUrls}
                  onChange={(e) => setBatchInputUrls(e.target.value)}
                  placeholder={`https://images.unsplash.com/photo-1...\nhttps://images.unsplash.com/photo-2...`}
                  className="w-full p-2.5 bg-white dark:bg-surface-1 border border-sand dark:border-dark-border text-xs focus:outline-none focus:border-accent-light dark:focus:border-accent-dark font-mono"
                />
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleAddUrlsToBatch}
                    className="px-3 py-1.5 bg-espresso dark:bg-alabaster text-oatmeal dark:text-cocoa text-[10px] font-mono uppercase tracking-widest font-bold hover:opacity-90 transition-all flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Add URLs to Batch</span>
                  </button>
                  
                  <GoogleDrivePicker 
                    multiple={true}
                    onPick={() => {}}
                    onPickMultiple={handleAddDriveFilesToBatch}
                  />
                </div>
              </div>

              {/* Right: AI Ingestion Settings */}
              <div className="md:col-span-4 border-l border-sand/40 dark:border-dark-border/40 md:pl-6 space-y-3">
                <label className="text-[10px] font-mono uppercase tracking-wider block font-bold">Ingestion Engine Settings</label>
                
                {/* Engine Selector */}
                <div className="space-y-1">
                  <label className="text-[9px] font-mono uppercase block text-[#7c7265] dark:text-[#9a9088]">Preferred Model</label>
                  <div className="flex border border-sand dark:border-dark-border p-0.5">
                    <button
                      type="button"
                      onClick={() => {
                        setAiEngine('gemini');
                        localStorage.setItem('preferredAiEngine', 'gemini');
                      }}
                      className={`flex-1 py-1 text-[9px] font-mono uppercase font-bold tracking-wider text-center transition-all ${
                        aiEngine === 'gemini'
                          ? 'bg-accent-light dark:bg-accent-dark text-white dark:text-cocoa'
                          : 'text-[#7c7265] dark:text-[#9a9088] hover:bg-sand/10'
                      }`}
                    >
                      Gemini 3.5
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setAiEngine('groq');
                        localStorage.setItem('preferredAiEngine', 'groq');
                      }}
                      className={`flex-1 py-1 text-[9px] font-mono uppercase font-bold tracking-wider text-center transition-all ${
                        aiEngine === 'groq'
                          ? 'bg-accent-light dark:bg-accent-dark text-white dark:text-cocoa'
                          : 'text-[#7c7265] dark:text-[#9a9088] hover:bg-sand/10'
                      }`}
                    >
                      Llama 4 (Groq)
                    </button>
                  </div>
                </div>

                {/* API Key Input */}
                <div className="space-y-1">
                  {aiEngine === 'gemini' ? (
                    <>
                      <label className="text-[9px] font-mono uppercase block text-[#7c7265] dark:text-[#9a9088]">Gemini API Key</label>
                      <input
                        type="password"
                        placeholder="Gemini Key (Optional if set in AI Studio)"
                        value={geminiKey}
                        onChange={(e) => {
                          setGeminiKey(e.target.value);
                          localStorage.setItem('geminiApiKey', e.target.value);
                        }}
                        className="w-full p-2 bg-white dark:bg-surface-1 border border-sand dark:border-dark-border text-xs focus:outline-none focus:border-accent-light dark:focus:border-accent-dark"
                      />
                    </>
                  ) : (
                    <>
                      <label className="text-[9px] font-mono uppercase block text-[#7c7265] dark:text-[#9a9088]">Groq Vision Key</label>
                      <input
                        type="password"
                        placeholder="gsk_... (Optional if in settings)"
                        value={groqKey}
                        onChange={(e) => {
                          setGroqKey(e.target.value);
                          localStorage.setItem('groqApiKey', e.target.value);
                        }}
                        className="w-full p-2 bg-white dark:bg-surface-1 border border-sand dark:border-dark-border text-xs focus:outline-none focus:border-accent-light dark:focus:border-accent-dark"
                      />
                    </>
                  )}
                </div>

                <button
                  type="button"
                  onClick={handleAnalyzeBatch}
                  disabled={isBatchAnalyzing || batchItems.length === 0}
                  className="w-full py-2 bg-accent-light dark:bg-accent-dark text-white dark:text-cocoa text-[10px] tracking-widest font-mono uppercase font-bold hover:opacity-95 transition-all flex items-center justify-center gap-2 whitespace-nowrap disabled:opacity-50"
                >
                  <Sparkles className={`w-3.5 h-3.5 ${isBatchAnalyzing ? 'animate-spin' : ''}`} />
                  {isBatchAnalyzing ? 'AI Auto-Analyzing Batch...' : 'AI SEO Auto-Fill Batch'}
                </button>
              </div>
            </div>

            {/* Batch items stack container */}
            <div className="flex-1 min-h-[300px] overflow-y-auto space-y-4 max-h-[45vh] pr-1">
              <div className="flex justify-between items-center border-b border-sand/40 dark:border-dark-border/40 pb-2">
                <span className="text-[10px] font-mono uppercase tracking-wider font-bold">
                  Batch Queue ({batchItems.length} image{batchItems.length === 1 ? '' : 's'})
                </span>
                {batchItems.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      if (window.confirm("Clear the entire batch?")) setBatchItems([]);
                    }}
                    className="text-[9px] font-mono uppercase tracking-wider text-red-500 hover:underline flex items-center gap-1"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>Clear All</span>
                  </button>
                )}
              </div>

              {batchItems.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 border border-dashed border-sand dark:border-dark-border text-center space-y-2 bg-white/10 dark:bg-surface-1/10">
                  <ImageIcon className="w-8 h-8 text-[#7c7265]/40 dark:text-[#9a9088]/40" />
                  <p className="text-xs font-mono text-[#7c7265] dark:text-[#9a9088]">Ingest image URLs above or load from Google Drive to build your batch.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {batchItems.map((item, index) => (
                    <div key={item.id} className="p-4 border border-sand dark:border-dark-border bg-white dark:bg-surface-1/60 space-y-4 shadow-sm relative flex flex-col md:flex-row gap-4">
                      {/* Left thumbnail & Status */}
                      <div className="flex flex-col items-center gap-2 md:w-36 shrink-0">
                        <div className="w-full aspect-[3/2] overflow-hidden border border-sand dark:border-dark-border bg-oatmeal/20 relative">
                          <img 
                            referrerPolicy="no-referrer"
                            src={item.imageUrl} 
                            alt={item.title} 
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1554080353-a576cf803bda?auto=format&fit=crop&q=80';
                            }}
                          />
                        </div>
                        {/* Status Label */}
                        <div className="w-full text-center">
                          {item.status === 'pending' && (
                            <span className="inline-block px-2 py-0.5 text-[8px] font-mono uppercase tracking-wider bg-sand text-espresso dark:bg-surface-2 dark:text-alabaster">
                              Pending AI
                            </span>
                          )}
                          {item.status === 'analyzing' && (
                            <span className="inline-block px-2 py-0.5 text-[8px] font-mono uppercase tracking-wider bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300 animate-pulse">
                              Analyzing...
                            </span>
                          )}
                          {item.status === 'done' && (
                            <span className="inline-block px-2 py-0.5 text-[8px] font-mono uppercase tracking-wider bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300">
                              Analyzed
                            </span>
                          )}
                          {item.status === 'failed' && (
                            <span className="inline-block px-2 py-0.5 text-[8px] font-mono uppercase tracking-wider bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300" title={item.error}>
                              Failed
                            </span>
                          )}
                        </div>
                        {item.error && (
                          <p className="text-[8px] font-mono text-rose-500 max-w-full truncate text-center" title={item.error}>
                            {item.error}
                          </p>
                        )}
                      </div>

                      {/* Middle Fields layout */}
                      <div className="flex-1 grid grid-cols-1 md:grid-cols-12 gap-3">
                        <div className="col-span-12 md:col-span-4 space-y-1">
                          <label className="text-[9px] font-mono uppercase text-[#7c7265] dark:text-[#9a9088]">Title *</label>
                          <input
                            type="text"
                            required
                            value={item.title}
                            onChange={(e) => handleUpdateBatchItemField(item.id, 'title', e.target.value)}
                            className="w-full p-2 bg-oatmeal/20 dark:bg-surface-1 border border-sand dark:border-dark-border text-xs focus:outline-none"
                          />
                        </div>

                        <div className="col-span-12 md:col-span-3 space-y-1">
                          <label className="text-[9px] font-mono uppercase text-[#7c7265] dark:text-[#9a9088]">Category</label>
                          <select
                            value={item.category}
                            onChange={(e) => handleUpdateBatchItemField(item.id, 'category', e.target.value)}
                            className="w-full p-2 bg-oatmeal/20 dark:bg-surface-1 border border-sand dark:border-dark-border text-xs focus:outline-none"
                          >
                            <option value="editorial">Editorial</option>
                            <option value="portrait">Portrait</option>
                            <option value="boudoir">Boudoir</option>
                            <option value="family">Family</option>
                            <option value="event">Event</option>
                          </select>
                        </div>

                        <div className="col-span-6 md:col-span-2 space-y-1">
                          <label className="text-[9px] font-mono uppercase text-[#7c7265] dark:text-[#9a9088]">Year</label>
                          <input
                            type="text"
                            value={item.year}
                            onChange={(e) => handleUpdateBatchItemField(item.id, 'year', e.target.value)}
                            className="w-full p-2 bg-oatmeal/20 dark:bg-surface-1 border border-sand dark:border-dark-border text-xs focus:outline-none"
                          />
                        </div>

                        <div className="col-span-6 md:col-span-3 space-y-1">
                          <label className="text-[9px] font-mono uppercase text-[#7c7265] dark:text-[#9a9088]">Location</label>
                          <select
                            value={item.location}
                            onChange={(e) => handleUpdateBatchItemField(item.id, 'location', e.target.value)}
                            className="w-full p-2 bg-oatmeal/20 dark:bg-surface-1 border border-sand dark:border-dark-border text-xs focus:outline-none"
                          >
                            <option value="" disabled>Select Location</option>
                            {SA_LOCATIONS.map(loc => (
                              <option key={loc} value={loc}>{loc}</option>
                            ))}
                          </select>
                        </div>

                        {/* EXIF Metadata Row */}
                        <div className="col-span-12 grid grid-cols-2 md:grid-cols-5 gap-2 border-t border-dashed border-sand/40 dark:border-dark-border/40 pt-2 mt-1">
                          <div className="space-y-0.5">
                            <label className="text-[8px] font-mono uppercase text-[#7c7265] dark:text-[#9a9088]">Camera</label>
                            <input
                              type="text"
                              value={item.camera}
                              onChange={(e) => handleUpdateBatchItemField(item.id, 'camera', e.target.value)}
                              className="w-full p-1.5 bg-oatmeal/10 dark:bg-surface-1 border border-sand dark:border-dark-border text-[10px] focus:outline-none"
                            />
                          </div>
                          <div className="space-y-0.5">
                            <label className="text-[8px] font-mono uppercase text-[#7c7265] dark:text-[#9a9088]">Lens</label>
                            <input
                              type="text"
                              value={item.lens}
                              onChange={(e) => handleUpdateBatchItemField(item.id, 'lens', e.target.value)}
                              className="w-full p-1.5 bg-oatmeal/10 dark:bg-surface-1 border border-sand dark:border-dark-border text-[10px] focus:outline-none"
                            />
                          </div>
                          <div className="space-y-0.5">
                            <label className="text-[8px] font-mono uppercase text-[#7c7265] dark:text-[#9a9088]">Aperture</label>
                            <input
                              type="text"
                              value={item.aperture}
                              onChange={(e) => handleUpdateBatchItemField(item.id, 'aperture', e.target.value)}
                              className="w-full p-1.5 bg-oatmeal/10 dark:bg-surface-1 border border-sand dark:border-dark-border text-[10px] focus:outline-none"
                            />
                          </div>
                          <div className="space-y-0.5">
                            <label className="text-[8px] font-mono uppercase text-[#7c7265] dark:text-[#9a9088]">Shutter</label>
                            <input
                              type="text"
                              value={item.shutterSpeed}
                              onChange={(e) => handleUpdateBatchItemField(item.id, 'shutterSpeed', e.target.value)}
                              className="w-full p-1.5 bg-oatmeal/10 dark:bg-surface-1 border border-sand dark:border-dark-border text-[10px] focus:outline-none"
                            />
                          </div>
                          <div className="space-y-0.5">
                            <label className="text-[8px] font-mono uppercase text-[#7c7265] dark:text-[#9a9088]">ISO</label>
                            <input
                              type="text"
                              value={item.iso}
                              onChange={(e) => handleUpdateBatchItemField(item.id, 'iso', e.target.value)}
                              className="w-full p-1.5 bg-oatmeal/10 dark:bg-surface-1 border border-sand dark:border-dark-border text-[10px] focus:outline-none"
                            />
                          </div>
                        </div>

                        <div className="col-span-12 space-y-1">
                          <label className="text-[9px] font-mono uppercase text-[#7c7265] dark:text-[#9a9088]">Creative Vision Description</label>
                          <textarea
                            rows={1}
                            value={item.description}
                            onChange={(e) => handleUpdateBatchItemField(item.id, 'description', e.target.value)}
                            placeholder="Fine-art description context..."
                            className="w-full p-2 bg-oatmeal/20 dark:bg-surface-1 border border-sand dark:border-dark-border text-xs focus:outline-none resize-none"
                          />
                        </div>
                      </div>

                      {/* Remove item button */}
                      <button
                        type="button"
                        onClick={() => handleRemoveBatchItem(item.id)}
                        className="absolute top-2 right-2 p-1 border border-transparent hover:border-sand dark:hover:border-dark-border text-[#7c7265] dark:text-[#9a9088] hover:text-red-500"
                        title="Remove from batch"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Bottom buttons */}
            <div className="flex justify-between items-center pt-4 border-t border-sand dark:border-dark-border flex-wrap gap-2">
              <p className="text-[10px] font-mono text-[#7c7265] dark:text-[#9a9088]">
                Note: Ensure the Groq API key is valid to utilize vision generation.
              </p>
              <div className="flex gap-3">
                <button 
                  type="button"
                  onClick={() => {
                    if (batchItems.length > 0 && !window.confirm("Close batch modal? Unsaved batch items will be discarded.")) return;
                    setIsBatchModalOpen(false);
                  }}
                  className="px-4 py-2 border border-sand dark:border-dark-border text-[10px] font-mono uppercase tracking-widest hover:bg-sand/10"
                >
                  Cancel
                </button>
                <button 
                  type="button"
                  disabled={batchItems.length === 0}
                  onClick={handleSaveBatch}
                  className="px-6 py-2 bg-espresso dark:bg-alabaster text-oatmeal dark:text-cocoa text-[10px] font-mono uppercase tracking-widest font-bold hover:opacity-90 transition-all flex items-center gap-1.5 disabled:opacity-50"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Publish Batch ({batchItems.length})</span>
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}

function BookingsManager() {
  const [bookings, setBookings] = useState<any[]>([]);
  const [token, setToken] = useState<string | null>(typeof window !== 'undefined' ? sessionStorage.getItem('googleAccessToken') : null);
  
  // Google Calendar events state
  const [gcalEvents, setGcalEvents] = useState<any[]>([]);
  const [loadingGcal, setLoadingGcal] = useState(false);
  const [syncingId, setSyncingId] = useState<string | null>(null);

  // Edit Booking states
  const [editingBooking, setEditingBooking] = useState<any | null>(null);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editDate, setEditDate] = useState('');
  const [editTime, setEditTime] = useState('');
  const [editPackage, setEditPackage] = useState('');
  const [editVision, setEditVision] = useState('');

  // Quick Blockout states
  const [quickSummary, setQuickSummary] = useState('');
  const [quickDate, setQuickDate] = useState('');
  const [quickTime, setQuickTime] = useState('09:00 AM');
  const [quickDuration, setQuickDuration] = useState('2');
  const [isAddingQuickEvent, setIsAddingQuickEvent] = useState(false);

  useEffect(() => {
    const q = query(collection(db, 'bookings'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setBookings(data);
    }, (error) => {
      console.warn("Bookings real-time sync failed (using local state):", error);
    });
    return () => unsubscribe();
  }, []);

  // Fetch GCal events if token exists
  useEffect(() => {
    if (token) {
      fetchGcalEvents(token);
    }
  }, [token]);

  const fetchGcalEvents = async (accessToken: string) => {
    setLoadingGcal(true);
    try {
      const res = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${new Date().toISOString()}&orderBy=startTime&singleEvents=true&maxResults=15`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      );
      if (res.ok) {
        const data = await res.json();
        setGcalEvents(data.items || []);
      } else {
        console.warn("Failed to fetch Google Calendar events:", res.statusText);
      }
    } catch (err) {
      console.error("Error fetching Google Calendar events:", err);
    } finally {
      setLoadingGcal(false);
    }
  };

  const handleConnectGoogle = async () => {
    const provider = new GoogleAuthProvider();
    provider.addScope('https://www.googleapis.com/auth/drive.readonly');
    provider.addScope('https://www.googleapis.com/auth/calendar');
    try {
      const result = await signInWithPopup(auth, provider);
      const credential = GoogleAuthProvider.credentialFromResult(result);
      if (credential?.accessToken) {
        setGoogleAccessToken(credential.accessToken);
        setToken(credential.accessToken);
      }
    } catch (error: any) {
      console.error("Failed to connect Google Calendar", error);
      alert("Connection failed: " + error.message);
    }
  };

  const handleStatusChange = async (bookingId: string, newStatus: string) => {
    try {
      await updateDoc(doc(db, 'bookings', bookingId), {
        status: newStatus
      });
    } catch (error) {
      console.error("Error updating status:", error);
    }
  };

  const parseDateAndTime = (dateStr: string, timeSlotStr: string) => {
    try {
      const parts = dateStr.replace(/,/g, '').split(' ');
      if (parts.length < 3) return null;
      const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      const monthIndex = monthNames.findIndex(m => parts[0].startsWith(m));
      const day = parseInt(parts[1], 10);
      const year = parseInt(parts[2], 10);
      
      if (monthIndex === -1 || isNaN(day) || isNaN(year)) return null;
      
      const timeStr = timeSlotStr || "09:00 AM";
      const timeParts = timeStr.split(' ');
      const hhmm = timeParts[0].split(':');
      let hour = parseInt(hhmm[0], 10);
      const min = hhmm[1] ? parseInt(hhmm[1], 10) : 0;
      const ampm = timeParts[1] ? timeParts[1].toUpperCase() : 'AM';
      
      if (ampm === 'PM' && hour < 12) hour += 12;
      if (ampm === 'AM' && hour === 12) hour = 0;
      
      const startDate = new Date(year, monthIndex, day, hour, min, 0);
      const endDate = new Date(startDate.getTime() + 2 * 60 * 60 * 1000); // 2 hours shoot
      
      return {
        start: startDate.toISOString(),
        end: endDate.toISOString()
      };
    } catch (e) {
      console.warn("Failed to parse date/time:", e);
      return null;
    }
  };

  const dateToInputFormat = (dateStr: string) => {
    try {
      const parts = dateStr.replace(/,/g, '').split(' ');
      if (parts.length < 3) return '';
      const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      const monthIndex = monthNames.findIndex(m => parts[0].startsWith(m));
      if (monthIndex === -1) return '';
      const day = parts[1].padStart(2, '0');
      const year = parts[2];
      const month = String(monthIndex + 1).padStart(2, '0');
      return `${year}-${month}-${day}`;
    } catch {
      return '';
    }
  };

  const dateFromInputFormat = (inputVal: string) => {
    if (!inputVal) return '';
    const parts = inputVal.split('-');
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      const date = new Date(year, month, day);
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    }
    const date = new Date(inputVal);
    if (isNaN(date.getTime())) return '';
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const syncBookingToGCal = async (booking: any) => {
    if (!token) {
      alert("Please connect Google Calendar first using the panel on the right.");
      return;
    }

    const confirmed = window.confirm(`Create a Google Calendar event for ${booking.clientName}'s shoot?`);
    if (!confirmed) return;

    setSyncingId(booking.id);
    const times = parseDateAndTime(booking.date, booking.time);
    if (!times) {
      alert("Invalid date or time format on this booking. Please 'Edit' the booking first to set a valid format.");
      setSyncingId(null);
      return;
    }

    try {
      const eventBody = {
        summary: `Shutterhaus Session: ${booking.package || 'Photography'} - ${booking.clientName}`,
        location: 'Shutterhaus Visuals Studio',
        description: `Client: ${booking.clientName}\nEmail: ${booking.clientEmail}\nPhone: ${booking.clientPhone || 'N/A'}\n\nClient Vision/Notes:\n${booking.vision || 'N/A'}\n\nSynced from Shutterhaus Admin Panel.`,
        start: {
          dateTime: times.start,
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'
        },
        end: {
          dateTime: times.end,
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'
        }
      };

      const res = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(eventBody)
      });

      if (res.ok) {
        const data = await res.json();
        // Update Firestore booking with event ID
        await updateDoc(doc(db, 'bookings', booking.id), {
          gcalEventId: data.id,
          gcalSynced: true
        });
        alert("Booking successfully synced to Google Calendar!");
        fetchGcalEvents(token);
      } else {
        const errData = await res.json();
        console.error("GCal Sync failed:", errData);
        alert("Google Calendar Sync failed: " + (errData.error?.message || "Unknown error"));
      }
    } catch (e) {
      console.error("GCal Sync error:", e);
      alert("Google Calendar Sync error. Check console.");
    } finally {
      setSyncingId(null);
    }
  };

  const deleteGCalEvent = async (eventId: string) => {
    if (!token) return;
    try {
      await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
    } catch (error) {
      console.error("Error deleting Google Calendar event:", error);
    }
  };

  const handleUnsyncGCal = async (booking: any) => {
    if (!token) return;
    const confirmed = window.confirm("Are you sure you want to remove this booking's Google Calendar event? This deletes the event from Google Calendar.");
    if (!confirmed) return;

    setSyncingId(booking.id);
    try {
      await deleteGCalEvent(booking.gcalEventId);
      await updateDoc(doc(db, 'bookings', booking.id), {
        gcalEventId: null,
        gcalSynced: false
      });
      alert("Unsynced and removed event from Google Calendar.");
      fetchGcalEvents(token);
    } catch (e) {
      console.error(e);
    } finally {
      setSyncingId(null);
    }
  };

  const handleDeleteBooking = async (booking: any) => {
    const confirmed = confirm(`Are you sure you want to delete the booking for ${booking.clientName}? This action cannot be undone.`);
    if (!confirmed) return;

    try {
      if (booking.gcalEventId && token) {
        const deleteGCal = confirm("This booking is synced with Google Calendar. Delete the Google Calendar event too?");
        if (deleteGCal) {
          await deleteGCalEvent(booking.gcalEventId);
        }
      }
      await deleteDoc(doc(db, 'bookings', booking.id));
      if (token) fetchGcalEvents(token);
    } catch (error) {
      console.error("Error deleting booking:", error);
    }
  };

  const handleEditClick = (booking: any) => {
    setEditingBooking(booking);
    setEditName(booking.clientName || '');
    setEditEmail(booking.clientEmail || '');
    setEditPhone(booking.clientPhone || '');
    setEditDate(dateToInputFormat(booking.date || ''));
    setEditTime(booking.time || '09:00 AM');
    setEditPackage(booking.package || 'Portrait Fine Art Session');
    setEditVision(booking.vision || '');
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBooking) return;

    try {
      const finalDate = dateFromInputFormat(editDate) || editingBooking.date;
      const updatedFields: any = {
        clientName: editName,
        clientEmail: editEmail,
        clientPhone: editPhone,
        date: finalDate,
        time: editTime,
        package: editPackage,
        vision: editVision
      };

      await updateDoc(doc(db, 'bookings', editingBooking.id), updatedFields);

      // Ask to update in Google Calendar if synced
      if (editingBooking.gcalEventId && token) {
        const updateGcal = confirm("Booking updated in database! This booking is linked to Google Calendar. Update Google Calendar too?");
        if (updateGcal) {
          const times = parseDateAndTime(finalDate, editTime);
          if (times) {
            const eventBody = {
              summary: `Shutterhaus Session: ${editPackage} - ${editName}`,
              location: 'Shutterhaus Visuals Studio',
              description: `Client: ${editName}\nEmail: ${editEmail}\nPhone: ${editPhone || 'N/A'}\n\nClient Vision/Notes:\n${editVision || 'N/A'}\n\nSynced from Shutterhaus Admin Panel.`,
              start: {
                dateTime: times.start,
                timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'
              },
              end: {
                dateTime: times.end,
                timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'
              }
            };

            const res = await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events/${editingBooking.gcalEventId}`, {
              method: 'PUT',
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify(eventBody)
            });

            if (res.ok) {
              alert("Successfully updated Google Calendar event!");
              fetchGcalEvents(token);
            } else {
              console.warn("Failed to update GCal event:", res.statusText);
            }
          }
        }
      }

      setEditingBooking(null);
    } catch (error) {
      console.error("Error updating booking:", error);
      alert("Error saving: " + error);
    }
  };

  const handleQuickAddEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      alert("Connect Google Calendar first.");
      return;
    }
    if (!quickSummary || !quickDate) {
      alert("Please enter a summary and a date.");
      return;
    }

    setIsAddingQuickEvent(true);
    try {
      const dateParts = quickDate.split('-');
      if (dateParts.length < 3) throw new Error("Invalid date");
      const year = parseInt(dateParts[0], 10);
      const monthIndex = parseInt(dateParts[1], 10) - 1;
      const day = parseInt(dateParts[2], 10);

      const timeParts = quickTime.split(' ');
      const hhmm = timeParts[0].split(':');
      let hour = parseInt(hhmm[0], 10);
      const min = hhmm[1] ? parseInt(hhmm[1], 10) : 0;
      const ampm = timeParts[1] ? timeParts[1].toUpperCase() : 'AM';

      if (ampm === 'PM' && hour < 12) hour += 12;
      if (ampm === 'AM' && hour === 12) hour = 0;

      const startDate = new Date(year, monthIndex, day, hour, min, 0);
      const durationHours = parseFloat(quickDuration) || 2;
      const endDate = new Date(startDate.getTime() + durationHours * 60 * 60 * 1000);

      const eventBody = {
        summary: quickSummary,
        location: 'Shutterhaus Visuals Studio',
        description: 'Scheduled directly from Shutterhaus Admin Panel.',
        start: {
          dateTime: startDate.toISOString(),
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'
        },
        end: {
          dateTime: endDate.toISOString(),
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'
        }
      };

      const res = await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(eventBody)
      });

      if (res.ok) {
        alert("Blockout event added to Google Calendar!");
        setQuickSummary('');
        setQuickDate('');
        fetchGcalEvents(token);
      } else {
        const errData = await res.json();
        alert("Failed to add event: " + (errData.error?.message || "Unknown error"));
      }
    } catch (err: any) {
      alert("Error adding event: " + err.message);
    } finally {
      setIsAddingQuickEvent(false);
    }
  };

  const formatGCalDate = (event: any) => {
    const start = event.start?.dateTime || event.start?.date;
    if (!start) return '';
    const d = new Date(start);
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-8 max-w-7xl">
      <div className="flex flex-col lg:flex-row gap-8">
        
        {/* Left Column: Shutterhaus Bookings */}
        <div className="flex-1 space-y-6">
          <div className="flex justify-between items-center border-b border-sand dark:border-dark-border pb-4">
            <h2 className="text-xl font-serif font-light">Booking Inquiries</h2>
            <span className="text-xs font-mono text-[#7c7265] dark:text-[#9a9088]">
              {bookings.length} Total Records
            </span>
          </div>

          <div className="space-y-4">
            {bookings.map(booking => (
              <div key={booking.id} className="border border-sand dark:border-dark-border p-5 bg-white dark:bg-surface-1 transition-all hover:border-sand-hover dark:hover:border-dark-border-hover">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-bold text-base text-espresso dark:text-alabaster">{booking.clientName}</h3>
                    <p className="text-xs font-mono text-[#7c7265] dark:text-[#9a9088]">
                      {booking.clientEmail} {booking.clientPhone ? `• ${booking.clientPhone}` : ''}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <select 
                      value={booking.status || 'pending'} 
                      onChange={(e) => handleStatusChange(booking.id, e.target.value)}
                      className="bg-transparent border border-sand dark:border-dark-border py-1 px-2 text-[10px] font-mono text-espresso dark:text-alabaster uppercase rounded-none focus:outline-none focus:border-accent-light"
                    >
                      <option value="pending">Pending</option>
                      <option value="approved">Approved</option>
                      <option value="shooting">Shooting</option>
                      <option value="retouching">Retouching</option>
                      <option value="delivered">Delivered</option>
                    </select>

                    <button 
                      onClick={() => handleEditClick(booking)}
                      className="p-1.5 border border-sand dark:border-dark-border text-[#7c7265] hover:text-espresso dark:hover:text-alabaster transition-colors"
                      title="Edit/Fix Booking Details"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>

                    <button 
                      onClick={() => handleDeleteBooking(booking)}
                      className="p-1.5 border border-sand dark:border-dark-border text-red-500 hover:bg-red-500/10 transition-colors"
                      title="Delete booking"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-mono mt-2 py-3 border-t border-b border-sand/40 dark:border-dark-border/40">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-accent-light dark:text-accent-dark" />
                    <span>{booking.date}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-accent-light dark:text-accent-dark" />
                    <span>{booking.time || booking.timeSlot}</span>
                  </div>
                  <div className="truncate font-sans font-medium text-espresso/80 dark:text-alabaster/80">
                    <span className="text-[#7c7265] dark:text-[#9a9088] font-mono text-xs">Package:</span> {booking.package}
                  </div>
                </div>

                {booking.vision && (
                  <div className="mt-3 p-3 bg-oatmeal/40 dark:bg-surface-2/40 border border-sand/40 dark:border-dark-border/40">
                    <p className="text-[9px] text-[#7c7265] dark:text-[#9a9088] font-mono uppercase tracking-wider mb-1">Client Vision:</p>
                    <p className="text-xs italic text-espresso/90 dark:text-alabaster/90 font-sans">"{booking.vision}"</p>
                  </div>
                )}

                {/* Google Calendar Action for this Booking */}
                <div className="mt-4 flex justify-between items-center text-xs pt-1">
                  {booking.gcalSynced ? (
                    <div className="flex items-center gap-2 text-green-600 dark:text-green-400 font-mono text-[11px]">
                      <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                      <span>Linked with Google Calendar</span>
                    </div>
                  ) : (
                    <span className="text-[#7c7265] font-mono text-[10px]">Not synced to Google Calendar</span>
                  )}

                  {booking.gcalSynced ? (
                    <button
                      disabled={syncingId === booking.id}
                      onClick={() => handleUnsyncGCal(booking)}
                      className="px-3 py-1 bg-red-500/10 hover:bg-red-500/20 text-red-600 text-[10px] font-mono uppercase tracking-wider border border-red-500/20"
                    >
                      {syncingId === booking.id ? 'Removing...' : 'Delete GCal Event'}
                    </button>
                  ) : (
                    <button
                      disabled={syncingId === booking.id}
                      onClick={() => syncBookingToGCal(booking)}
                      className="px-3 py-1 bg-accent-light/10 dark:bg-accent-dark/10 hover:bg-accent-light/20 dark:hover:bg-accent-dark/20 text-accent-light dark:text-accent-dark border border-accent-light/30 dark:border-accent-dark/30 text-[10px] font-mono uppercase tracking-widest flex items-center gap-1.5"
                    >
                      <Link className="w-3 h-3" />
                      <span>{syncingId === booking.id ? 'Syncing...' : 'Sync to GCal'}</span>
                    </button>
                  )}
                </div>
              </div>
            ))}
            {bookings.length === 0 && <p className="text-xs text-[#7c7265] dark:text-[#9a9088] italic">No booking inquiries found in database.</p>}
          </div>
        </div>

        {/* Right Column: Google Calendar Feed & Controls */}
        <div className="w-full lg:w-[380px] space-y-6">
          <div className="border border-sand dark:border-dark-border p-5 bg-white dark:bg-surface-1">
            <h3 className="font-serif font-light text-base mb-4 border-b border-sand dark:border-dark-border pb-2 flex items-center justify-between">
              <span>Google Calendar Feed</span>
              {token && (
                <button 
                  onClick={() => fetchGcalEvents(token)} 
                  disabled={loadingGcal}
                  className="p-1 text-[#7c7265] hover:text-espresso dark:hover:text-alabaster transition-colors disabled:opacity-50"
                  title="Refresh Feed"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loadingGcal ? 'animate-spin' : ''}`} />
                </button>
              )}
            </h3>

            {token ? (
              <div className="space-y-4">
                <div className="p-3 bg-green-500/5 border border-green-500/20 text-[11px] font-mono text-green-700 dark:text-green-400 flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-500"></div>
                  <span>Google Calendar Connected</span>
                </div>

                {/* Upcoming Events list */}
                <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1 scrollbar-none">
                  <p className="text-[10px] font-mono uppercase text-[#7c7265] dark:text-[#9a9088] tracking-widest">Upcoming Agenda</p>
                  {gcalEvents.map(event => (
                    <div key={event.id} className="p-3 bg-oatmeal/30 dark:bg-surface-2 border border-sand/40 dark:border-dark-border/40 text-xs">
                      <p className="font-bold truncate text-espresso dark:text-alabaster">{event.summary}</p>
                      <div className="flex items-center gap-1.5 text-[10px] font-mono text-[#7c7265] dark:text-[#9a9088] mt-1">
                        <Clock className="w-3 h-3" />
                        <span>{formatGCalDate(event)}</span>
                      </div>
                      {event.location && (
                        <p className="text-[10px] font-mono text-[#7c7265] dark:text-[#9a9088] truncate mt-0.5">📍 {event.location}</p>
                      )}
                    </div>
                  ))}
                  {gcalEvents.length === 0 && !loadingGcal && (
                    <p className="text-xs text-[#7c7265] dark:text-[#9a9088] italic">No upcoming events found.</p>
                  )}
                  {loadingGcal && (
                    <p className="text-xs text-[#7c7265] dark:text-[#9a9088] animate-pulse">Loading GCal schedule...</p>
                  )}
                </div>

                {/* Quick block-out event builder */}
                <form onSubmit={handleQuickAddEvent} className="border-t border-sand dark:border-dark-border pt-4 mt-4 space-y-3">
                  <h4 className="text-[10px] font-mono uppercase text-[#7c7265] dark:text-[#9a9088] tracking-widest">Quick Block-Out / Event</h4>
                  
                  <div>
                    <input 
                      type="text" 
                      placeholder="e.g. Blocked: Studio Maintenance" 
                      value={quickSummary}
                      onChange={(e) => setQuickSummary(e.target.value)}
                      required
                      className="w-full bg-transparent border border-sand dark:border-dark-border p-2 text-xs font-sans text-espresso dark:text-alabaster rounded-none focus:outline-none focus:border-accent-light"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[9px] font-mono text-[#7c7265] mb-1">Date</label>
                      <input 
                        type="date" 
                        value={quickDate}
                        onChange={(e) => setQuickDate(e.target.value)}
                        required
                        className="w-full bg-transparent border border-sand dark:border-dark-border p-1.5 text-xs font-mono text-espresso dark:text-alabaster rounded-none focus:outline-none focus:border-accent-light"
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] font-mono text-[#7c7265] mb-1">Time</label>
                      <select 
                        value={quickTime}
                        onChange={(e) => setQuickTime(e.target.value)}
                        className="w-full bg-transparent border border-sand dark:border-dark-border p-1.5 text-xs font-mono text-espresso dark:text-alabaster rounded-none focus:outline-none focus:border-accent-light"
                      >
                        <option value="09:00 AM">09:00 AM</option>
                        <option value="11:30 AM">11:30 AM</option>
                        <option value="02:00 PM">02:00 PM</option>
                        <option value="04:30 PM">04:30 PM</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[9px] font-mono text-[#7c7265] mb-1">Duration (Hours)</label>
                    <input 
                      type="number" 
                      min="0.5" 
                      step="0.5" 
                      value={quickDuration}
                      onChange={(e) => setQuickDuration(e.target.value)}
                      className="w-full bg-transparent border border-sand dark:border-dark-border p-1.5 text-xs font-mono text-espresso dark:text-alabaster rounded-none focus:outline-none focus:border-accent-light"
                    />
                  </div>

                  <button 
                    type="submit"
                    disabled={isAddingQuickEvent}
                    className="w-full py-2 bg-espresso dark:bg-alabaster text-oatmeal dark:text-cocoa text-[10px] font-mono uppercase tracking-widest font-bold hover:opacity-90 transition-all"
                  >
                    {isAddingQuickEvent ? 'Adding Event...' : 'Add Block Event'}
                  </button>
                </form>

              </div>
            ) : (
              <div className="space-y-4 text-center py-4">
                <p className="text-xs text-[#7c7265] dark:text-[#9a9088] leading-relaxed">
                  Connect your Google Calendar to view upcoming shoots, see conflict warning systems, and write events directly from Shutterhaus Admin.
                </p>
                <button
                  onClick={handleConnectGoogle}
                  className="w-full py-2 bg-[#4285F4] text-white text-[10px] font-mono uppercase tracking-widest font-bold hover:opacity-90 transition-all flex justify-center items-center gap-2"
                >
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Connect Google Calendar</span>
                </button>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Editing Booking Modal */}
      {editingBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-espresso/80 backdrop-blur-sm">
          <div className="relative max-w-lg w-full bg-oatmeal dark:bg-cocoa p-6 border border-sand dark:border-dark-border shadow-xl space-y-4 animate-fade-in text-espresso dark:text-alabaster">
            
            <div className="flex justify-between items-center border-b border-sand dark:border-dark-border pb-3">
              <h3 className="font-serif font-light text-base uppercase tracking-wider">Edit / Fix Booking Details</h3>
              <button 
                onClick={() => setEditingBooking(null)}
                className="p-1 text-[#7c7265] hover:text-espresso dark:hover:text-alabaster transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4 text-xs">
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-mono text-[10px] text-[#7c7265] uppercase mb-1">Client Name</label>
                  <input 
                    type="text" 
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    required
                    className="w-full bg-white dark:bg-surface-1 border border-sand dark:border-dark-border p-2 text-xs font-sans text-espresso dark:text-alabaster rounded-none focus:outline-none focus:border-accent-light"
                  />
                </div>
                <div>
                  <label className="block font-mono text-[10px] text-[#7c7265] uppercase mb-1">Client Email</label>
                  <input 
                    type="email" 
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    required
                    className="w-full bg-white dark:bg-surface-1 border border-sand dark:border-dark-border p-2 text-xs font-sans text-espresso dark:text-alabaster rounded-none focus:outline-none focus:border-accent-light"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-mono text-[10px] text-[#7c7265] uppercase mb-1">Client Phone</label>
                  <input 
                    type="text" 
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    className="w-full bg-white dark:bg-surface-1 border border-sand dark:border-dark-border p-2 text-xs font-sans text-espresso dark:text-alabaster rounded-none focus:outline-none focus:border-accent-light"
                  />
                </div>
                <div>
                  <label className="block font-mono text-[10px] text-[#7c7265] uppercase mb-1">Package / Shoot Type</label>
                  <select 
                    value={editPackage}
                    onChange={(e) => setEditPackage(e.target.value)}
                    className="w-full bg-white dark:bg-surface-1 border border-sand dark:border-dark-border p-2 text-xs font-sans text-espresso dark:text-alabaster rounded-none focus:outline-none focus:border-accent-light"
                  >
                    <option value="Portrait Fine Art Session">Portrait Fine Art Session</option>
                    <option value="Boudoir & Intimate Portraiture">Boudoir & Intimate Portraiture</option>
                    <option value="Family & Heritage Session">Family & Heritage Session</option>
                    <option value="Events — Corporate Booking">Events — Corporate Booking</option>
                    <option value="Commercial — Campaign Booking">Commercial — Campaign Booking</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-mono text-[10px] text-[#7c7265] uppercase mb-1">Shoot Date</label>
                  <input 
                    type="date" 
                    value={editDate}
                    onChange={(e) => setEditDate(e.target.value)}
                    required
                    className="w-full bg-white dark:bg-surface-1 border border-sand dark:border-dark-border p-2 text-xs font-mono text-espresso dark:text-alabaster rounded-none focus:outline-none focus:border-accent-light"
                  />
                </div>
                <div>
                  <label className="block font-mono text-[10px] text-[#7c7265] uppercase mb-1">Time Slot</label>
                  <select 
                    value={editTime}
                    onChange={(e) => setEditTime(e.target.value)}
                    className="w-full bg-white dark:bg-surface-1 border border-sand dark:border-dark-border p-2 text-xs font-mono text-espresso dark:text-alabaster rounded-none focus:outline-none focus:border-accent-light"
                  >
                    <option value="09:00 AM">09:00 AM (Morning Natural Softlight)</option>
                    <option value="11:30 AM">11:30 AM (Crisp Midday Architectural)</option>
                    <option value="02:00 PM">02:00 PM (Pre-Sunset Warmth)</option>
                    <option value="04:30 PM">04:30 PM (Golden Hour & Twilight)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-mono text-[10px] text-[#7c7265] uppercase mb-1">Client Vision / Notes</label>
                <textarea 
                  rows={4}
                  value={editVision}
                  onChange={(e) => setEditVision(e.target.value)}
                  className="w-full bg-white dark:bg-surface-1 border border-sand dark:border-dark-border p-2 text-xs font-sans text-espresso dark:text-alabaster rounded-none focus:outline-none focus:border-accent-light"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-sand dark:border-dark-border">
                <button 
                  type="button" 
                  onClick={() => setEditingBooking(null)}
                  className="px-4 py-2 border border-sand dark:border-dark-border text-[10px] font-mono uppercase tracking-widest hover:bg-sand/20"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="px-5 py-2 bg-espresso dark:bg-alabaster text-oatmeal dark:text-cocoa text-[10px] font-mono uppercase tracking-widest font-bold hover:opacity-90"
                >
                  Save & Update
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}

function MessagesManager() {
  const [messages, setMessages] = useState<any[]>([]);

  useEffect(() => {
    const q = query(collection(db, 'messages'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setMessages(data);
    }, (error) => {
      console.warn("Messages real-time sync failed (using local state):", error);
    });
    return () => unsubscribe();
  }, []);

  return (
    <div className="space-y-6 max-w-4xl">
      <h2 className="text-lg font-serif font-light">Inbox Messages</h2>
      <div className="space-y-4">
        {messages.map(msg => (
          <div key={msg.id} className="border border-sand dark:border-dark-border p-5 bg-white dark:bg-surface-1">
            <div className="flex justify-between mb-2">
              <h3 className="font-bold text-sm">{msg.name}</h3>
              <span className="text-[10px] font-mono text-[#7c7265]">{msg.date}</span>
            </div>
            <p className="text-xs text-[#7c7265] mb-4">{msg.email}</p>
            <p className="text-sm font-serif italic mb-2">"{msg.message}"</p>
            <div className="text-[10px] font-mono uppercase text-[#7c7265] flex gap-4">
              <span>Service: {msg.service}</span>
              <span>Budget: {msg.budget}</span>
            </div>
          </div>
        ))}
        {messages.length === 0 && <p className="text-xs text-[#7c7265] dark:text-[#9a9088]">No messages found.</p>}
      </div>
    </div>
  );
}
