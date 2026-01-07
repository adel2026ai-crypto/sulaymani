
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
  Search, 
  Home, 
  BookOpen, 
  Headphones, 
  PlayCircle, 
  User, 
  X,
  ChevronLeft,
  ChevronRight,
  Book,
  Mic,
  Video,
  Library,
  Layers,
  MessageCircleQuestion,
  HelpCircle,
  Clock,
  ArrowLeft,
  LogOut,
  Star,
  Play,
  MonitorPlay,
  Settings,
  History,
  Bookmark,
  Volume2,
  ListFilter,
  ShieldCheck,
  Mail,
  KeyRound,
  Bell,
  Info,
  Check,
  Filter,
  LayoutGrid,
  ChevronDown,
  FileText
} from 'lucide-react';
import { ContentItem, ViewState, ContentType, SiteInfo } from '../types';
import ContentDetail from './ContentDetail';
import Login from './Login';
import { db, auth } from '../firebase';
import { collection, onSnapshot, doc, getDoc, setDoc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { onAuthStateChanged, signOut, User as FirebaseUser, updateProfile } from 'firebase/auth';

interface UserData {
  favorites: string[];
  history: string[];
  displayName?: string;
}

interface Category {
  id: string;
  name: string;
  type: ContentType;
  subCategories: string[];
}

interface MobileHomeProps {
  content: ContentItem[];
}

const getYouTubeId = (url: string) => {
  if (!url) return null;
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
};

const CompactRow: React.FC<any> = ({ item, onClick, isFav, onToggleFavorite }) => (
  <div onClick={onClick} className="w-full bg-white p-3 rounded-2xl border border-gray-100 shadow-[0_2px_8px_rgba(0,0,0,0.01)] flex items-center gap-3.5 active:scale-[0.98] transition-all group text-right">
    <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 border border-gray-50 ${
      item.type === 'book' ? 'bg-blue-50 text-blue-500' : 
      item.type === 'audio' ? 'bg-purple-50 text-purple-500' : 
      item.type === 'video' ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'
    }`}>
      {item.type === 'book' ? <BookOpen size={18} /> : 
       item.type === 'audio' ? <Mic size={18} /> : 
       item.type === 'video' ? <Video size={18} /> : <MessageCircleQuestion size={18} />}
    </div>
    <div className="flex-1 min-w-0">
       <h4 className="font-bold text-gray-800 text-[12px] leading-tight mb-1 group-hover:text-indigo-600 transition-colors line-clamp-1">{item.title}</h4>
       <div className="flex items-center gap-2">
          {item.volumeNumber && <span className="text-[8px] font-black text-indigo-400 bg-indigo-50 px-1.5 py-0.5 rounded">مجلد {item.volumeNumber}</span>}
          <span className="text-[8px] font-bold text-gray-300 truncate">{item.author}</span>
       </div>
    </div>
    <div className="flex items-center gap-2 shrink-0">
      <button onClick={(e) => { e.stopPropagation(); onToggleFavorite(e); }} className={`p-1.5 active:scale-125 transition-all ${isFav ? 'text-yellow-500' : 'text-gray-200'}`}>
        <Star size={14} fill={isFav ? "currentColor" : "none"} />
      </button>
      <ChevronLeft size={14} className="text-gray-200" />
    </div>
  </div>
);

const Section: React.FC<any> = ({ label, items, onShowAll, type, renderItem }) => (
  <section className="animate-in fade-in px-0 text-right">
    <div className="flex justify-between items-center mb-6 px-1">
      <div className="flex items-center gap-3">
        <div className="w-1.5 h-8 rounded-full bg-indigo-600"></div>
        <h3 className="font-black text-gray-800 text-2xl leading-none">{label}</h3>
      </div>
      {onShowAll && (
        <button onClick={onShowAll} className="text-indigo-600 text-[11px] font-black px-5 py-2.5 bg-indigo-50/70 backdrop-blur rounded-full active:scale-95 transition-transform hover:bg-indigo-100/80">
          عرض الكل
        </button>
      )}
    </div>
    <div className={type === 'grid' ? "grid grid-cols-2 gap-5" : "space-y-4"}>
      {items.map(renderItem)}
    </div>
  </section>
);

const ProfileMenuBtn: React.FC<{ icon: React.ReactNode; label: string; onClick?: () => void }> = ({ icon, label, onClick }) => (
  <button onClick={onClick} className="w-full flex items-center justify-between p-5 hover:bg-gray-50/50 active:scale-[0.98] transition-all group text-right">
     <div className="flex items-center gap-5">
        <div className="w-12 h-12 rounded-[1.2rem] bg-gray-50 flex items-center justify-center group-hover:bg-white transition-colors shadow-sm">{icon}</div>
        <span className="font-black text-gray-700 text-[15px]">{label}</span>
     </div>
     <ChevronLeft className="text-gray-300 group-hover:text-indigo-600" size={20} />
  </button>
);

const SmallCard: React.FC<any> = ({ item, onClick, isFav, onToggleFavorite }) => {
  const isAudio = item.type === 'audio';
  const isBook = item.type === 'book';
  const isVideo = item.type === 'video';
  
  const getModalityColor = () => {
    if (isAudio) return 'bg-[#7c3aed]';
    if (isBook) return 'bg-[#3b82f6]';
    return 'bg-black';
  };

  const getBadge = () => {
    if (isVideo) return { text: 'عرض مرئي', color: 'bg-red-600', icon: <PlayCircle size={10} /> };
    if (isAudio) return { text: 'درس صوتي', color: 'bg-[#a855f7]', icon: <Mic size={10} /> };
    if (isBook) return { text: 'مؤلف علمي', color: 'bg-blue-600', icon: <Book size={10} /> };
    return null;
  };

  const badge = getBadge();
  const youtubeId = isVideo ? getYouTubeId(item.sourceUrl) : null;
  const thumb = youtubeId ? `https://img.youtube.com/vi/${youtubeId}/mqdefault.jpg` : item.coverImage;

  return (
    <div onClick={onClick} className="flex flex-col w-full group cursor-pointer text-right active:scale-95 transition-transform">
      <div className={`relative aspect-[16/10] w-full rounded-[1.8rem] overflow-hidden shadow-sm border border-gray-100 ${getModalityColor()}`}>
        {isVideo ? (
          <>
            <img src={thumb} className="w-full h-full object-cover opacity-80 group-hover:scale-110 transition-transform duration-700" alt="" />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white border border-white/30 shadow-xl group-hover:scale-110 transition-transform">
                 <Play size={24} fill="white" className="ml-1" />
              </div>
            </div>
          </>
        ) : isAudio ? (
          <div className="w-full h-full flex items-center justify-center relative overflow-hidden bg-purple-600">
             <div className="w-14 h-14 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center text-white border border-white/20">
                <Mic size={30} strokeWidth={2.5} className="opacity-90" />
             </div>
             <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-10 pointer-events-none">
                <Mic size={120} />
             </div>
          </div>
        ) : (
          <div className="w-full h-full flex items-center justify-center relative overflow-hidden bg-blue-600">
             <div className="w-14 h-14 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center text-white border border-white/20">
                <BookOpen size={30} strokeWidth={2.5} className="opacity-90" />
             </div>
             <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-10 pointer-events-none">
                <Book size={120} />
             </div>
          </div>
        )}
        
        <button 
          onClick={(e) => { e.stopPropagation(); onToggleFavorite(e); }} 
          className={`absolute top-3 left-3 w-8 h-8 rounded-full backdrop-blur-md flex items-center justify-center transition-all ${isFav ? 'bg-white text-yellow-500 shadow-lg' : 'bg-black/20 text-white'}`}
        >
           <Star size={14} fill={isFav ? "currentColor" : "none"} strokeWidth={isFav ? 0 : 2} />
        </button>
        
        {badge && (
          <div className={`absolute bottom-3 right-3 ${badge.color} backdrop-blur-md px-2.5 py-1.5 rounded-xl shadow-sm border border-white/10 flex items-center gap-1.5`}>
             <span className="text-white"> {badge.icon} </span>
             <span className="text-[9px] font-black text-white whitespace-nowrap">{badge.text}</span>
          </div>
        )}
      </div>
      <div className="mt-3 px-1">
        <h4 className="font-bold text-gray-800 text-[14px] leading-tight line-clamp-2 mb-1 group-hover:text-indigo-600 transition-colors">{item.title}</h4>
        <p className="text-gray-400 text-[11px] font-bold line-clamp-1">{item.author}</p>
      </div>
    </div>
  );
};

const QuickShortcut: React.FC<any> = ({ icon, label, color, active, onClick }) => {
  const colorStyles = {
    blue: active ? 'bg-blue-600 text-white' : 'bg-white text-blue-600',
    purple: active ? 'bg-purple-600 text-white' : 'bg-white text-purple-600',
    red: active ? 'bg-red-600 text-white' : 'bg-white text-red-600',
    green: active ? 'bg-green-600 text-white' : 'bg-white text-green-600',
  }[color as 'blue' | 'purple' | 'red' | 'green'];
  return (
    <button onClick={onClick} className="flex flex-col items-center gap-2 shrink-0">
      <div className={`w-15 h-15 rounded-2xl flex items-center justify-center transition-all duration-300 shadow-[0_4px_15px_rgba(0,0,0,0.02)] border border-gray-50 ${colorStyles} ${active ? 'shadow-xl shadow-indigo-100 scale-105' : 'active:scale-95'}`}>{icon}</div>
      <span className={`text-[10px] font-black ${active ? 'text-indigo-600' : 'text-gray-400'}`}>{label}</span>
    </button>
  );
};

const NavItem: React.FC<any> = ({ active, icon, onClick, label }) => (
  <button onClick={onClick} className="flex flex-col items-center gap-0.5 group active:scale-90 flex-1 h-14 justify-center transition-all">
    <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 ${active ? 'bg-indigo-50 text-indigo-600 shadow-sm' : 'text-gray-400 opacity-60'}`}>{icon}</div>
    <span className={`text-[10px] font-black transition-colors ${active ? 'text-indigo-600' : 'text-gray-400 opacity-60'}`}>{label}</span>
  </button>
);

const MobileHome: React.FC<MobileHomeProps> = ({ content }) => {
  const [activeTab, setActiveTab] = useState<ViewState | 'categories'>('home');
  const [filter, setFilter] = useState<ContentType | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItem, setSelectedItem] = useState<ContentItem | null>(null);
  const [selectedMainCategory, setSelectedMainCategory] = useState<string | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [userData, setUserData] = useState<UserData>({ favorites: [], history: [] });
  const [showLogin, setShowLogin] = useState(false);
  const [profileSubView, setProfileSubView] = useState<'main' | 'password' | 'edit-data' | 'about-sheikh' | 'about-marib'>('main');
  
  const [siteInfo, setSiteInfo] = useState<SiteInfo>({ aboutMarib: '', aboutSheikh: '' });
  const [tempDisplayName, setTempDisplayName] = useState('');
  
  const searchInputRef = useRef<HTMLInputElement>(null);

  const groupedContent = useMemo<Record<string, ContentItem[]>>(() => {
    if (!selectedMainCategory) return {};
    
    const mainCatItems = content.filter(item => 
      item.mainCategory === selectedMainCategory &&
      (!searchQuery.trim() || item.title.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    const activeCat = categories.find(c => c.name === selectedMainCategory);
    const groups: Record<string, ContentItem[]> = {};

    if (activeCat?.subCategories) {
      activeCat.subCategories.forEach((sub: string) => groups[sub] = []);
    }
    
    const others: ContentItem[] = [];

    mainCatItems.forEach(item => {
      const sub = item.subCategory;
      if (sub && groups[sub]) {
        groups[sub].push(item);
      } else {
        others.push(item);
      }
    });

    if (others.length > 0) groups['عام / غير مصنف'] = others;

    return Object.fromEntries(
      Object.entries(groups).filter(([_, items]) => items.length > 0)
    ) as Record<string, ContentItem[]>;
  }, [content, selectedMainCategory, categories, searchQuery]);

  const filteredContent = useMemo(() => {
    return content.filter(item => {
      const matchesType = filter === 'all' || item.type === filter;
      const matchesSearch = !searchQuery.trim() || 
        item.title.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesType && matchesSearch;
    });
  }, [content, filter, searchQuery]);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'categories'), (snapshot) => {
      setCategories(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Category)));
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    const unsubscribe = onSnapshot(doc(db, 'settings', 'general'), (snap) => {
      if (snap.exists()) setSiteInfo(snap.data() as SiteInfo);
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      if (u) {
        setShowLogin(false);
        setTempDisplayName(u.displayName || u.email?.split('@')[0] || '');
        const userDocRef = doc(db, 'users', u.uid);
        onSnapshot(userDocRef, (docSnap) => {
          if (docSnap.exists()) {
            setUserData(docSnap.data() as UserData);
          } else {
            setDoc(userDocRef, { favorites: [], history: [] }, { merge: true });
          }
        });
      }
    });
    return unsubscribe;
  }, []);

  const handleOpenItem = async (item: ContentItem) => {
    setSelectedItem(item);
    if (user) {
      const userDocRef = doc(db, 'users', user.uid);
      await setDoc(userDocRef, { history: arrayUnion(item.id) }, { merge: true });
    }
  };

  const toggleFavorite = async (e: React.MouseEvent, itemId: string) => {
    e.stopPropagation();
    if (!user) { setShowLogin(true); return; }
    const userDocRef = doc(db, 'users', user.uid);
    const isFav = userData.favorites.includes(itemId);
    await setDoc(userDocRef, { favorites: isFav ? arrayRemove(itemId) : arrayUnion(itemId) }, { merge: true });
  };

  const handleUpdateDisplayName = async () => {
    if (!user || !tempDisplayName.trim()) return;
    try {
      await updateProfile(user, { displayName: tempDisplayName });
      const userDocRef = doc(db, 'users', user.uid);
      await setDoc(userDocRef, { displayName: tempDisplayName }, { merge: true });
      setProfileSubView('main');
    } catch (e) { alert('خطأ في التحديث'); }
  };

  const handleLogout = async () => {
    if (window.confirm('هل تريد تسجيل الخروج؟')) {
      await signOut(auth);
      setActiveTab('home');
    }
  };

  const handleTopCategoryClick = (type: ContentType) => {
    setFilter(type);
    setSelectedMainCategory(null);
    setActiveTab('categories');
  };

  const renderMainContent = () => {
    if (selectedItem) return <ContentDetail item={selectedItem} onBack={() => setSelectedItem(null)} />;
    if (showLogin) return <Login onCancel={() => setShowLogin(false)} />;

    if (activeTab === 'profile') {
      if (!user) return (
        <div className="flex flex-col items-center justify-center h-[80vh] p-8 text-center bg-[#F4F5F7]">
          <div className="w-24 h-24 bg-white rounded-[2rem] shadow-xl flex items-center justify-center text-indigo-100 mb-8"><User size={48} /></div>
          <h2 className="text-2xl font-black text-gray-800 mb-4">لوحة تحكم العضو</h2>
          <button onClick={() => setShowLogin(true)} className="w-full purple-gradient text-white py-4.5 rounded-2xl font-black shadow-lg">تسجيل الدخول الآن</button>
        </div>
      );

      if (profileSubView === 'edit-data') return (
        <div className="p-6 pt-12 animate-in fade-in bg-[#F4F5F7] min-h-screen text-right">
           <button onClick={() => setProfileSubView('main')} className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-gray-600 mb-8 shadow-sm"><ChevronRight size={24} /></button>
           <h2 className="text-3xl font-black text-gray-800 mb-8 flex items-center gap-3"><div className="w-2 h-8 bg-indigo-600 rounded-full"></div> تعديل البيانات</h2>
           <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-50 space-y-6">
              <div>
                <label className="text-xs font-bold text-gray-400 block mb-2">الاسم المعروض</label>
                <input type="text" className="w-full bg-[#F9FAFB] border-none py-4 px-6 rounded-xl font-bold text-gray-900 text-right" value={tempDisplayName} onChange={e => setTempDisplayName(e.target.value)} />
              </div>
              <button onClick={handleUpdateDisplayName} className="w-full purple-gradient text-white py-4 rounded-xl font-bold shadow-lg flex items-center justify-center gap-2"><Check size={20}/> حفظ التغييرات</button>
           </div>
        </div>
      );

      if (profileSubView === 'about-sheikh' || profileSubView === 'about-marib') return (
        <div className="p-6 pt-12 animate-in fade-in bg-[#F4F5F7] min-h-screen text-right">
           <button onClick={() => setProfileSubView('main')} className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-gray-600 mb-8 shadow-sm"><ChevronRight size={24} /></button>
           <h2 className="text-3xl font-black text-gray-800 mb-8 flex items-center gap-3"><div className="w-2 h-8 bg-indigo-600 rounded-full"></div> {profileSubView === 'about-sheikh' ? 'التعريف بالشيخ' : 'عن دار الحديث بمأرب'}</h2>
           <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-50 leading-loose text-gray-700 font-medium whitespace-pre-line text-right">
              {profileSubView === 'about-sheikh' ? (siteInfo.aboutSheikh || "المعلومات غير متوفرة حالياً.") : (siteInfo.aboutMarib || "المعلومات غير متوفرة حالياً.")}
           </div>
        </div>
      );

      return (
        <div className="pb-32 bg-[#F4F5F7] min-h-screen animate-in fade-in text-right">
          <div className="purple-gradient pt-20 pb-20 px-8 rounded-b-[3.5rem] shadow-xl relative overflow-hidden">
             <div className="absolute top-0 left-0 w-64 h-64 bg-white/5 rounded-full -ml-32 -mt-32"></div>
             <div className="flex items-center gap-6 relative z-10">
                <div className="w-20 h-20 bg-white/30 backdrop-blur-xl rounded-[1.8rem] border border-white/40 flex items-center justify-center text-white text-3xl font-black shadow-2xl shrink-0">
                  {user.displayName?.charAt(0) || user.email?.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1">
                   <h2 className="text-white text-2xl font-black mb-1">{user.displayName || user.email?.split('@')[0]}</h2>
                   <div className="flex items-center gap-2 text-white/80 text-sm font-bold"><Mail size={16} /> {user.email}</div>
                </div>
             </div>
          </div>

          <div className="px-8 -mt-10 space-y-8 relative z-20">
            <div className="bg-white p-7 rounded-[2.5rem] shadow-[0_10px_30px_rgba(0,0,0,0.03)] border border-gray-50 flex justify-between items-center text-center">
               <div className="flex-1">
                  <div className="text-3xl font-black text-gray-800 mb-1">{userData.favorites.length}</div>
                  <div className="text-[11px] font-bold text-gray-400">المفضلة</div>
               </div>
               <div className="w-px h-12 bg-gray-100"></div>
               <div className="flex-1">
                  <div className="text-3xl font-black text-gray-800 mb-1">{userData.history.length}</div>
                  <div className="text-[11px] font-bold text-gray-400">تمت قراءتها</div>
               </div>
            </div>

            <div className="space-y-4">
               <h3 className="text-[11px] font-black text-gray-400 uppercase tracking-widest mr-4">إعدادات الحساب</h3>
               <div className="bg-white rounded-[2.5rem] border border-gray-50 shadow-sm overflow-hidden p-2">
                  <ProfileMenuBtn icon={<User className="text-blue-500" />} label="تعديل البيانات الشخصية" onClick={() => setProfileSubView('edit-data')} />
                  <div className="h-px bg-gray-50 mx-8"></div>
                  <ProfileMenuBtn icon={<KeyRound className="text-purple-500" />} label="تغيير كلمة السر" onClick={() => setProfileSubView('password')} />
               </div>
            </div>

            <div className="space-y-4">
               <h3 className="text-[11px] font-black text-gray-400 uppercase tracking-widest mr-4">عن المنصة</h3>
               <div className="bg-white rounded-[2.5rem] border border-gray-50 shadow-sm overflow-hidden p-2">
                  <ProfileMenuBtn icon={<Info className="text-indigo-500" />} label="عن دار الحديث بمأرب" onClick={() => setProfileSubView('about-marib')} />
                  <div className="h-px bg-gray-50 mx-8"></div>
                  <ProfileMenuBtn icon={<HelpCircle className="text-amber-500" />} label="التعريف بالشيخ أبي الحسن" onClick={() => setProfileSubView('about-sheikh')} />
               </div>
            </div>

            <button onClick={handleLogout} className="w-full flex items-center justify-center gap-3 p-6 bg-red-50/50 text-red-600 rounded-[2rem] font-black border border-red-100/50"><LogOut size={20} /> تسجيل الخروج</button>
          </div>
        </div>
      );
    }

    if (activeTab === 'categories') {
      const activeCat = categories.find(c => c.name === selectedMainCategory);
      
      if (selectedMainCategory && activeCat) {
        return (
          <div className="min-h-screen bg-[#F4F5F7] pb-32 animate-in fade-in slide-in-from-left duration-300 text-right">
             <div className="px-6 pt-12 pb-8 bg-white border-b border-gray-100 shadow-sm sticky top-0 z-20">
                <div className="flex justify-between items-center mb-6">
                  <button onClick={() => setSelectedMainCategory(null)} className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-indigo-600 shadow-sm active:scale-90 transition-transform"><ChevronRight size={24} /></button>
                  <div>
                     <h2 className="text-xl font-black text-gray-900 line-clamp-1">{activeCat.name}</h2>
                     <p className="text-gray-400 font-bold text-[10px]">تصفح المواد العلمية المصنفة</p>
                  </div>
                </div>
                <div className="relative">
                  <input 
                    type="text" 
                    placeholder="ابحث داخل هذا القسم..." 
                    className="w-full bg-gray-50 border border-gray-200 h-12 pr-12 pl-6 rounded-2xl font-bold text-right focus:bg-white focus:ring-4 focus:ring-indigo-50 transition-all text-sm outline-none" 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-indigo-400" size={18} />
                </div>
             </div>

             <div className="p-6 space-y-10">
                {Object.keys(groupedContent).length > 0 ? (
                  (Object.entries(groupedContent) as [string, ContentItem[]][]).map(([subName, items]) => (
                    <div key={subName} className="space-y-4">
                      <div className="flex items-center gap-3 pr-1">
                        <div className="w-1 h-5 bg-indigo-500 rounded-full"></div>
                        <h3 className="text-[13px] font-black text-gray-800 tracking-tight">{subName}</h3>
                        <div className="flex-1 h-px bg-gray-200/50 mr-2"></div>
                        <span className="text-[9px] font-black text-gray-400 bg-white border border-gray-100 px-2 py-0.5 rounded-md">{items.length} مادة</span>
                      </div>
                      
                      <div className="grid grid-cols-1 gap-2.5">
                         {items.map(item => (
                           <CompactRow 
                             key={item.id} 
                             item={item} 
                             onClick={() => handleOpenItem(item)} 
                             isFav={userData.favorites.includes(item.id)}
                             onToggleFavorite={(e: React.MouseEvent) => toggleFavorite(e, item.id)}
                           />
                         ))}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="flex flex-col items-center justify-center py-32 text-center opacity-30">
                     <LayoutGrid size={60} className="mb-4" />
                     <p className="font-black text-lg">لا توجد مواد تطابق بحثك</p>
                  </div>
                )}
             </div>
          </div>
        );
      }

      const visibleCategories: Category[] = (filter === 'all' ? categories : categories.filter(c => c.type === filter)) as Category[];

      return (
        <div className="p-6 pt-12 animate-in fade-in bg-[#F4F5F7] min-h-screen text-right">
          <div className="flex justify-between items-center mb-8">
            <button onClick={() => { setActiveTab('home'); setFilter('all'); }} className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-gray-400 shadow-sm"><ChevronRight size={22} /></button>
            <h2 className="text-2xl font-black text-gray-800 flex items-center gap-3">
              الأقسام العلمية <div className="w-2 h-8 bg-indigo-600 rounded-full"></div>
            </h2>
          </div>
          
          <div className="grid grid-cols-1 gap-5 pb-32">
            {visibleCategories.length > 0 ? visibleCategories.map((cat: Category) => (
              <button key={cat.id} onClick={() => { setSelectedMainCategory(cat.name); setSearchQuery(''); }} className="flex items-center justify-between p-5 bg-white rounded-[2.2rem] border border-gray-50 group hover:shadow-xl hover:border-indigo-100 transition-all relative overflow-hidden shadow-sm active:scale-[0.98]">
                <div className="flex items-center gap-5 w-full">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-sm shrink-0 ${
                    cat.type === 'book' ? 'bg-blue-50 text-blue-600' : 
                    cat.type === 'audio' ? 'bg-purple-50 text-purple-600' : 
                    cat.type === 'video' ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'
                  }`}>
                    {cat.type === 'book' ? <BookOpen size={28} /> : 
                     cat.type === 'audio' ? <Mic size={28} /> : 
                     cat.type === 'video' ? <Video size={28} /> : <MessageCircleQuestion size={28} />}
                  </div>
                  <div className="text-right flex-1">
                    <span className="font-black text-gray-800 text-lg block leading-tight mb-1">{cat.name}</span>
                    <div className="flex items-center gap-3">
                       <span className="text-[10px] font-bold text-gray-400">تصفح {cat.subCategories?.length || 0} تصنيفات فرعية</span>
                       <div className="w-1 h-1 bg-gray-200 rounded-full"></div>
                       <span className="text-[9px] font-black text-indigo-400 bg-indigo-50 px-2 py-0.5 rounded-md uppercase tracking-wider">
                          {cat.type === 'book' ? 'مؤلفات' : cat.type === 'audio' ? 'دروس' : cat.type === 'video' ? 'مرئيات' : 'فتاوى'}
                       </span>
                    </div>
                  </div>
                </div>
              </button>
            )) : (
              <div className="text-center py-32 opacity-20 flex flex-col items-center">
                 <Layers size={60} className="mb-4" />
                 <p className="font-black text-lg">لم يتم إنشاء أقسام لهذا النوع بعد</p>
              </div>
            )}
          </div>
        </div>
      );
    }

    if (activeTab === 'search') {
      return (
        <div className="p-0 bg-[#F4F5F7] min-h-screen overflow-x-hidden animate-in fade-in text-right">
          <div className="px-6 pt-12 pb-6 bg-white border-b border-gray-100 shadow-sm sticky top-0 z-50">
             <div className="flex items-center justify-between mb-6">
                <button onClick={() => setActiveTab('home')} className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-600 active:scale-90 transition-all"><ChevronRight size={22} /></button>
                <h2 className="text-xl font-black text-gray-800">البحث الشامل</h2>
             </div>
             <div className="relative">
                <input 
                  autoFocus 
                  ref={searchInputRef}
                  type="text" 
                  placeholder="ابحث عن كتب، دروس، فتاوى..." 
                  className="w-full bg-gray-50 border border-gray-200 h-14 pr-14 pl-6 rounded-full font-bold text-right focus:bg-white focus:ring-4 focus:ring-indigo-50 transition-all text-gray-950 outline-none placeholder:text-gray-400" 
                  value={searchQuery} 
                  onChange={(e) => setSearchQuery(e.target.value)} 
                />
                <Search className="absolute right-5 top-1/2 -translate-y-1/2 text-indigo-600" size={20} />
                {searchQuery && (
                  <button onClick={() => setSearchQuery('')} className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500"><X size={18} /></button>
                )}
             </div>
          </div>

          <div className="p-6 pb-32 space-y-10">
            {searchQuery.trim() === '' ? (
              <div className="flex flex-col items-center justify-center py-20 text-center text-gray-300">
                <Search size={60} className="mb-4 opacity-20" />
                <p className="font-black text-sm">ابدأ الكتابة للبحث في المكتبة</p>
              </div>
            ) : filteredContent.length > 0 ? (
              <div className="grid grid-cols-1 gap-3">
                 {filteredContent.map(item => (
                   <CompactRow 
                      key={item.id} 
                      item={item} 
                      onClick={() => handleOpenItem(item)} 
                      isFav={userData.favorites.includes(item.id)}
                      onToggleFavorite={(e: React.MouseEvent) => toggleFavorite(e, item.id)}
                   />
                 ))}
              </div>
            ) : (
              <div className="text-center py-20 bg-white rounded-3xl p-8 shadow-sm text-gray-400 font-bold">لا توجد نتائج مطابقة لعملية البحث.</div>
            )}
          </div>
        </div>
      );
    }

    if (activeTab === 'library') return (
      <div className="p-6 pt-12 bg-[#F4F5F7] min-h-screen animate-in fade-in text-right">
        <h2 className="text-3xl font-black text-gray-800 mb-8 flex items-center gap-3 justify-start">مكتبتي <div className="w-2 h-8 bg-indigo-600 rounded-full"></div></h2>
        {user ? (
          userData.favorites.length > 0 ? <div className="grid grid-cols-1 gap-3 pb-32">{content.filter(i => userData.favorites.includes(i.id)).map(item => (
            <CompactRow 
              key={item.id} 
              item={item} 
              onClick={() => handleOpenItem(item)} 
              isFav={true}
              onToggleFavorite={(e: React.MouseEvent) => toggleFavorite(e, item.id)}
            />
          ))}</div> : <div className="text-center py-24 bg-white rounded-3xl p-8 shadow-sm text-gray-400 font-bold">لم تضف أي مواد للمفضلة بعد.</div>
        ) : <div className="flex flex-col items-center justify-center p-10 bg-white rounded-3xl mt-10 shadow-sm"><Library size={60} className="text-gray-200 mb-6" /><button onClick={() => setShowLogin(true)} className="bg-indigo-600 text-white px-10 py-4 rounded-xl font-bold shadow-lg">دخول / تسجيل</button></div>}
      </div>
    );

    return (
      <div className="animate-in fade-in duration-700 text-right">
        <div className="px-6 pt-10 pb-0">
          <div className="flex justify-between items-center mb-8">
            <div className="text-right">
              <h1 className="text-[10px] font-black text-indigo-500 uppercase tracking-widest leading-none mb-1">دار الحديث بمأرب</h1>
              <p className="text-[9px] font-bold text-gray-400 mb-2">مكتبة الشيخ أبي الحسن السليماني</p>
              <h2 className="text-2xl font-black text-gray-800 leading-none">الرئيسية</h2>
            </div>
            <div onClick={() => { setActiveTab('profile'); setProfileSubView('main'); setSelectedItem(null); setShowLogin(false); }} className="w-11 h-11 bg-white rounded-xl shadow-[0_4px_15px_rgba(0,0,0,0.04)] border border-gray-50 flex items-center justify-center text-gray-400 overflow-hidden shrink-0 cursor-pointer active:scale-90 transition-transform">
               {user ? <div className="w-full h-full bg-indigo-600 flex items-center justify-center font-bold text-white text-base">{user.displayName?.charAt(0) || user.email?.charAt(0).toUpperCase()}</div> : <User size={22} />}
            </div>
          </div>
          
          <div className="relative group mb-8 cursor-pointer" onClick={() => setActiveTab('search')}>
            <div className="absolute inset-y-0 right-0 flex items-center pr-5 pointer-events-none">
              <Search className="text-indigo-600 transition-transform group-focus-within:scale-110" size={18} />
            </div>
            <div className="w-full h-15 bg-white border border-gray-100 pr-16 pl-6 rounded-full shadow-[0_8px_30px_rgba(0,0,0,0.03)] flex items-center justify-end text-gray-400 font-bold text-sm">
              ابحث في الكتب والدروس والفتاوى...
            </div>
          </div>

          <div className="flex justify-center mb-10 gap-5 px-1">
            <QuickShortcut icon={<Book size={20} />} label="المؤلفات" color="blue" active={filter === 'book'} onClick={() => handleTopCategoryClick('book')} />
            <QuickShortcut icon={<Mic size={20} />} label="الدروس" color="purple" active={filter === 'audio'} onClick={() => handleTopCategoryClick('audio')} />
            <QuickShortcut icon={<MonitorPlay size={20} />} label="المرئيات" color="red" active={filter === 'video'} onClick={() => handleTopCategoryClick('video')} />
            <QuickShortcut icon={<HelpCircle size={20} />} label="الفتاوى" color="green" active={filter === 'fatwa'} onClick={() => handleTopCategoryClick('fatwa')} />
          </div>
        </div>

        <div className="px-6 pt-0 pb-32 space-y-12">
          <Section 
            label="مرئيات علمية" 
            items={content.filter(i => i.type === 'video').slice(0, 4)} 
            type="grid" 
            onShowAll={() => handleTopCategoryClick('video')}
            renderItem={(i: any) => <SmallCard key={i.id} item={i} onClick={() => handleOpenItem(i)} isFav={userData.favorites.includes(i.id)} onToggleFavorite={(e: any) => toggleFavorite(e, i.id)} />} 
          />
          <Section 
            label="دروس علمية" 
            items={content.filter(i => i.type === 'audio').slice(0, 4)} 
            type="grid" 
            onShowAll={() => handleTopCategoryClick('audio')}
            renderItem={(i: any) => <SmallCard key={i.id} item={i} onClick={() => handleOpenItem(i)} isFav={userData.favorites.includes(i.id)} onToggleFavorite={(e: any) => toggleFavorite(e, i.id)} />} 
          />
          <Section 
            label="مؤلفات علمية" 
            items={content.filter(i => i.type === 'book').slice(0, 4)} 
            type="grid" 
            onShowAll={() => handleTopCategoryClick('book')}
            renderItem={(i: any) => <SmallCard key={i.id} item={i} onClick={() => handleOpenItem(i)} isFav={userData.favorites.includes(i.id)} onToggleFavorite={(e: any) => toggleFavorite(e, i.id)} />} 
          />
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-screen bg-[#F4F5F7] overflow-hidden" dir="rtl">
      <div className="flex-1 overflow-y-auto no-scrollbar scroll-smooth">{renderMainContent()}</div>
      
      <div className="fixed bottom-0 left-0 right-0 z-[100] max-w-[450px] mx-auto pointer-events-none">
        <div className="bg-white/95 backdrop-blur-md px-1 py-1 flex justify-around items-center rounded-t-[2.2rem] shadow-[0_-10px_40px_rgba(0,0,0,0.08)] border-t border-gray-100 pointer-events-auto">
          <NavItem active={activeTab === 'home' && !selectedItem && !showLogin} icon={<Home size={22} />} onClick={() => { setActiveTab('home'); setSelectedItem(null); setFilter('all'); }} label="الرئيسية" />
          <NavItem active={activeTab === 'categories' && !selectedItem} icon={<Layers size={22} />} onClick={() => { setActiveTab('categories'); setSelectedItem(null); setFilter('all'); setSelectedMainCategory(null); }} label="الأقسام" />
          <NavItem active={activeTab === 'search' && !selectedItem} icon={<Search size={22} />} onClick={() => { setActiveTab('search'); setSelectedItem(null); setSearchQuery(''); }} label="بحث" />
          <NavItem active={activeTab === 'library' && !selectedItem} icon={<Library size={22} />} onClick={() => { setActiveTab('library'); setSelectedItem(null); }} label="مكتبتي" />
          <NavItem active={activeTab === 'profile' || showLogin} icon={<User size={22} />} onClick={() => { setActiveTab('profile'); setProfileSubView('main'); setSelectedItem(null); setShowLogin(false); }} label="حسابي" />
        </div>
      </div>
    </div>
  );
};

export default MobileHome;
