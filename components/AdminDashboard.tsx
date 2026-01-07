
import React, { useState, useEffect, useMemo } from 'react';
import { 
  Plus, 
  Trash2, 
  Tag, 
  LayoutDashboard, 
  LogOut,
  Loader2,
  Settings as SettingsIcon,
  Save,
  PlusCircle,
  ChevronLeft,
  Edit3,
  X,
  Layers,
  FilePlus,
  ArrowRight,
  ChevronDown,
  Library,
  BookOpen,
  Mic,
  Video,
  HelpCircle,
  MoreVertical,
  Filter,
  Search,
  AlertTriangle,
  FolderPlus,
  MessageCircleQuestion
} from 'lucide-react';
import { ContentItem, ContentType, SiteInfo } from '../types';
import { db, auth } from '../firebase';
import { collection, addDoc, deleteDoc, doc, onSnapshot, query, setDoc, updateDoc, arrayUnion, arrayRemove, orderBy } from 'firebase/firestore';
import { signOut, User } from 'firebase/auth';

interface AdminDashboardProps {
  content: ContentItem[];
  user: User;
}

interface Category {
  id: string;
  name: string;
  type: ContentType;
  subCategories: string[];
}

interface ConfirmState {
  show: boolean;
  title: string;
  id: string;
  collection: string;
}

type AdminTab = 'all' | 'categories' | 'settings' | string;

const SidebarItem: React.FC<any> = ({ icon, label, active, onClick, count }) => (
  <button onClick={onClick} className={`w-full flex items-center justify-between px-4 py-3.5 rounded-xl font-black transition-all group ${active ? 'bg-indigo-600 text-white shadow-lg' : 'text-gray-500 hover:bg-indigo-50 hover:text-indigo-600'}`}>
    <div className="flex items-center gap-3">
      <div className={`transition-all ${active ? 'scale-110' : 'opacity-60 group-hover:opacity-100'}`}>{icon}</div>
      <span className="text-sm tracking-wide text-right">{label}</span>
    </div>
    {count !== undefined && (
      <span className={`text-[10px] font-black px-2 py-0.5 rounded-md ${active ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-400 group-hover:bg-indigo-100'}`}>{count}</span>
    )}
  </button>
);

const AdminDashboard: React.FC<AdminDashboardProps> = ({ content, user }) => {
  const [activeTab, setActiveTab] = useState<AdminTab>('all');
  const [isAddingContent, setIsAddingContent] = useState(false);
  const [editingItem, setEditingItem] = useState<ContentItem | null>(null);
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [newSubCatName, setNewSubCatName] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [toast, setToast] = useState<{show: boolean, message: string, type: 'success' | 'error'}>({ show: false, message: '', type: 'success' });
  const [confirmDelete, setConfirmDelete] = useState<ConfirmState>({ show: false, title: '', id: '', collection: '' });
  const [categories, setCategories] = useState<Category[]>([]);
  const [newCatName, setNewCatName] = useState('');
  const [newCatType, setNewCatType] = useState<ContentType>('book');
  const [searchQuery, setSearchQuery] = useState('');
  
  const ADMIN_EMAIL = 'adel2026ai@gmail.com';
  const [siteInfo, setSiteInfo] = useState<SiteInfo>({ aboutMarib: '', aboutSheikh: '' });
  const [formData, setFormData] = useState<Partial<ContentItem>>({ 
    type: 'book', mainCategory: '', subCategory: '', volumeNumber: 1, author: 'الشيخ أبي الحسن السليماني'
  });

  useEffect(() => {
    const unsubCats = onSnapshot(query(collection(db, 'categories'), orderBy('name')), (snapshot) => {
      setCategories(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Category[]);
    });
    const unsubSettings = onSnapshot(doc(db, 'settings', 'general'), (snap) => {
      if (snap.exists()) setSiteInfo(snap.data() as SiteInfo);
    });
    return () => { unsubCats(); unsubSettings(); };
  }, []);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast(prev => ({ ...prev, show: false })), 4000);
  };

  const filteredItems = useMemo(() => {
    let items = content;
    if (activeTab !== 'all' && activeTab !== 'categories' && activeTab !== 'settings') {
      items = items.filter(i => i.mainCategory === activeTab);
    }
    if (searchQuery) items = items.filter(i => i.title.toLowerCase().includes(searchQuery.toLowerCase()));
    return items;
  }, [content, activeTab, searchQuery]);

  const triggerDelete = (e: React.MouseEvent, coll: string, id: string, title: string) => {
    e.preventDefault(); e.stopPropagation();
    setConfirmDelete({ show: true, collection: coll, id, title });
  };

  const handleEditItem = (item: ContentItem) => {
    setEditingItem(item);
    setFormData({ ...item });
    setIsAddingContent(true);
  };

  const executeDelete = async () => {
    if (!confirmDelete.id || !user || user.email !== ADMIN_EMAIL) return;
    setIsProcessing(true);
    try {
      await deleteDoc(doc(db, confirmDelete.collection, confirmDelete.id));
      showToast('تم الحذف بنجاح');
    } catch (err) { showToast('خطأ في الحذف', 'error'); }
    finally { setIsProcessing(false); setConfirmDelete({ show: false, title: '', id: '', collection: '' }); }
  };

  const handleSubmitContent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.mainCategory) { showToast('يرجى تحديد القسم والعنوان', 'error'); return; }
    setIsProcessing(true);
    try {
      if (editingItem) {
        const itemRef = doc(db, 'content', editingItem.id);
        await updateDoc(itemRef, { ...formData });
        showToast('تم تحديث المادة بنجاح');
      } else {
        await addDoc(collection(db, 'content'), { ...formData, createdAt: Date.now() });
        showToast('تم النشر بنجاح');
      }
      setIsAddingContent(false);
      setEditingItem(null);
      setFormData({ type: 'book', volumeNumber: 1, mainCategory: '', subCategory: '', author: 'الشيخ أبي الحسن السليماني' });
    } catch (err) { 
      console.error(err);
      showToast('خطأ في العملية', 'error'); 
    }
    finally { setIsProcessing(false); }
  };

  const inputStyle = "w-full bg-gray-50 border border-gray-200 p-4 rounded-xl font-bold text-gray-900 focus:bg-white focus:ring-4 focus:ring-indigo-50 transition-all outline-none appearance-none text-sm text-right";
  const labelStyle = "text-sm font-black text-gray-500 mb-2 block uppercase tracking-wider text-right";

  return (
    <div className="flex h-screen bg-[#F8F9FB] overflow-hidden font-['IBM_Plex_Sans_Arabic']" dir="rtl">
      {isProcessing && (
        <div className="fixed inset-0 z-[600] bg-white/60 backdrop-blur-[2px] flex items-center justify-center">
           <div className="bg-white p-6 rounded-2xl shadow-2xl border border-gray-100 flex items-center gap-4 animate-in zoom-in-95">
             <Loader2 className="w-6 h-6 text-indigo-600 animate-spin" />
             <span className="font-black text-gray-800">جاري المعالجة...</span>
           </div>
        </div>
      )}

      {confirmDelete.show && (
        <div className="fixed inset-0 z-[700] bg-black/70 backdrop-blur-md flex items-center justify-center p-6">
          <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl p-8 animate-in zoom-in-95 text-center">
            <div className="w-16 h-16 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center mx-auto mb-5">
              <AlertTriangle size={32} />
            </div>
            <h3 className="text-xl font-black text-gray-900 mb-2 text-right">تأكيد الحذف</h3>
            <p className="text-gray-500 font-bold mb-6 text-base text-right">هل أنت متأكد من حذف <span className="text-red-600">"{confirmDelete.title}"</span>؟</p>
            <div className="flex gap-3">
              <button onClick={executeDelete} className="flex-1 bg-red-600 text-white py-4 rounded-xl font-black shadow-lg shadow-red-50 text-sm">تأكيد الحذف</button>
              <button onClick={() => setConfirmDelete({ ...confirmDelete, show: false })} className="flex-1 bg-gray-100 text-gray-500 py-4 rounded-xl font-black text-sm">إلغاء</button>
            </div>
          </div>
        </div>
      )}

      {toast.show && (
        <div className={`fixed top-6 left-1/2 -translate-x-1/2 z-[800] px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3 animate-in slide-in-from-top ${toast.type === 'success' ? 'bg-indigo-600 text-white' : 'bg-red-600 text-white'}`}>
          <span className="font-bold text-base">{toast.message}</span>
        </div>
      )}

      <aside className="w-72 bg-white border-l border-gray-100 flex flex-col shadow-sm">
        <div className="p-8">
          <div className="flex items-center gap-3 mb-10">
            <div className="w-11 h-11 purple-gradient rounded-xl flex items-center justify-center text-white shadow-lg"><Layers size={22} /></div>
            <h1 className="text-lg font-black text-gray-800">لوحة التحكم</h1>
          </div>
          
          <div className="space-y-2 mb-10">
            <SidebarItem icon={<LayoutDashboard size={20} />} label="المحتوى العام" active={activeTab === 'all'} onClick={() => setActiveTab('all')} />
            <SidebarItem icon={<Tag size={20} />} label="إدارة الأقسام" active={activeTab === 'categories'} onClick={() => setActiveTab('categories')} />
            <SidebarItem icon={<SettingsIcon size={20} />} label="الإعدادات" active={activeTab === 'settings'} onClick={() => setActiveTab('settings')} />
          </div>

          <div className="flex-1 overflow-y-auto no-scrollbar max-h-[50vh]">
            <p className="text-[11px] font-black text-gray-400 uppercase tracking-widest px-4 mb-4 text-right">الأقسام العلمية</p>
            <div className="space-y-1.5">
              {categories.map(cat => (
                <SidebarItem 
                  key={cat.id} 
                  icon={cat.type === 'book' ? <BookOpen size={18}/> : cat.type === 'audio' ? <Mic size={18}/> : cat.type === 'video' ? <Video size={18}/> : <MessageCircleQuestion size={18}/>} 
                  label={cat.name} 
                  active={activeTab === cat.name} 
                  onClick={() => setActiveTab(cat.name)}
                  count={content.filter(i => i.mainCategory === cat.name).length}
                />
              ))}
            </div>
          </div>
        </div>
        <div className="mt-auto p-6 border-t bg-gray-50/30">
          <button onClick={() => signOut(auth)} className="w-full flex items-center justify-center gap-2 text-red-500 p-3.5 rounded-xl font-black hover:bg-red-50 transition-all text-sm"><LogOut size={16} /> تسجيل الخروج</button>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto p-10 text-right">
        <header className="flex justify-between items-center mb-10">
          <div>
            <h2 className="text-3xl font-black text-gray-900 mb-1.5">
              {activeTab === 'all' ? 'المكتبة الشاملة' : activeTab === 'categories' ? 'إدارة التصنيفات' : activeTab === 'settings' ? 'إعدادات المنصة' : `قسم: ${activeTab}`}
            </h2>
            <p className="text-gray-500 text-sm font-bold">{filteredItems.length} مادة علمية متوفرة حالياً</p>
          </div>
          <div className="flex gap-4">
             <div className="relative">
               <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
               <input type="text" placeholder="بحث سريع..." className="bg-white border border-gray-100 py-3 pr-11 pl-5 rounded-xl font-bold text-sm shadow-sm focus:ring-4 focus:ring-indigo-50 outline-none w-64 transition-all text-gray-900 text-right" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
             </div>
             {activeTab !== 'categories' && activeTab !== 'settings' && (
               <button onClick={() => { setEditingItem(null); setFormData({ type: 'book', volumeNumber: 1, mainCategory: '', subCategory: '', author: 'الشيخ أبي الحسن السليماني' }); setIsAddingContent(true); }} className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-xl font-black shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all text-sm">
                 <Plus size={18} /> إضافة مادة جديدة
               </button>
             )}
          </div>
        </header>

        {activeTab === 'categories' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 animate-in fade-in">
             <button onClick={() => setIsAddingCategory(true)} className="min-h-[160px] bg-indigo-50 border-2 border-dashed border-indigo-200 rounded-2xl flex flex-col items-center justify-center gap-3 text-indigo-600 hover:bg-indigo-100 transition-all group">
                <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform"><Plus size={24} /></div>
                <span className="font-black text-sm">إنشاء قسم رئيسي</span>
             </button>
             {categories.map(cat => (
              <div key={cat.id} className="bg-white rounded-2xl p-6 border border-gray-50 shadow-sm hover:shadow-md transition-all group">
                <div className="flex justify-between items-start mb-5">
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${cat.type === 'book' ? 'bg-blue-50 text-blue-600' : cat.type === 'audio' ? 'bg-purple-50 text-purple-600' : cat.type === 'video' ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
                    {cat.type === 'book' ? <BookOpen size={20}/> : cat.type === 'audio' ? <Mic size={20}/> : cat.type === 'video' ? <Video size={20}/> : <MessageCircleQuestion size={20}/>}
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => setEditingCategory(cat)} className="p-2.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"><Edit3 size={16}/></button>
                    <button onClick={(e) => triggerDelete(e, 'categories', cat.id, cat.name)} className="p-2.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"><Trash2 size={16}/></button>
                  </div>
                </div>
                <h3 className="text-base font-black text-gray-800 mb-1.5">{cat.name}</h3>
                <div className="flex items-center gap-2 mb-6">
                  <span className={`text-[10px] font-black px-2.5 py-1 rounded-md uppercase tracking-wider ${cat.type === 'fatwa' ? 'bg-green-50 text-green-600' : 'bg-indigo-50 text-indigo-400'}`}>{cat.type === 'fatwa' ? 'فتاوى' : cat.type}</span>
                  <span className="text-[10px] font-bold text-gray-400">{content.filter(i => i.mainCategory === cat.name).length} مادة علمية</span>
                </div>
                <button onClick={() => setEditingCategory(cat)} className="w-full py-3 bg-gray-50 text-gray-600 rounded-xl font-bold text-xs hover:bg-indigo-600 hover:text-white transition-all text-center">إدارة التصنيفات الفرعية ({cat.subCategories?.length || 0})</button>
              </div>
            ))}
          </div>
        ) : activeTab === 'settings' ? (
          <div className="max-w-4xl space-y-8">
             <div className="bg-white p-10 rounded-[2.5rem] shadow-sm border border-gray-50 space-y-8">
                <div className="space-y-3">
                   <label className={labelStyle}>عن دار الحديث بمأرب</label>
                   <textarea className={inputStyle + " h-48 resize-none text-base"} value={siteInfo.aboutMarib} onChange={e => setSiteInfo({...siteInfo, aboutMarib: e.target.value})} />
                </div>
                <div className="space-y-3">
                   <label className={labelStyle}>التعريف بالشيخ أبي الحسن السليماني</label>
                   <textarea className={inputStyle + " h-48 resize-none text-base"} value={siteInfo.aboutSheikh} onChange={e => setSiteInfo({...siteInfo, aboutSheikh: e.target.value})} />
                </div>
                <button onClick={async () => {
                  setIsProcessing(true);
                  try { await setDoc(doc(db, 'settings', 'general'), siteInfo, { merge: true }); showToast('تم حفظ الإعدادات بنجاح'); }
                  catch(e) { showToast('فشل في حفظ الإعدادات', 'error'); }
                  finally { setIsProcessing(false); }
                }} className="w-full bg-indigo-600 text-white py-4.5 rounded-xl font-black shadow-lg shadow-indigo-50 text-base text-center">حفظ كافة التغييرات في الإعدادات</button>
             </div>
          </div>
        ) : (
          <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-50 overflow-hidden">
             <table className="w-full text-right text-sm">
                <thead className="bg-gray-50 text-gray-500 font-black uppercase border-b border-gray-100">
                   <tr>
                     <th className="px-8 py-5">المادة العلمية</th>
                     <th className="px-8 py-5">القسم والتصنيف</th>
                     <th className="px-8 py-5">المؤلف</th>
                     <th className="px-8 py-5 text-center">الإجراءات</th>
                   </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                   {filteredItems.map(item => (
                     <tr key={item.id} className="hover:bg-indigo-50/20 transition-all group">
                       <td className="px-8 py-5">
                         <div className="flex items-center gap-4">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                              item.type === 'book' ? 'bg-blue-50 text-blue-600' : 
                              item.type === 'audio' ? 'bg-purple-50 text-purple-500' : 
                              item.type === 'fatwa' ? 'bg-green-50 text-green-600' :
                              'bg-red-50 text-red-600'
                            }`}>
                               {item.type === 'book' ? <BookOpen size={18}/> : 
                                item.type === 'audio' ? <Mic size={18}/> : 
                                item.type === 'fatwa' ? <MessageCircleQuestion size={18}/> :
                                <Video size={18}/>}
                            </div>
                            <span className="font-black text-gray-800 line-clamp-1">{item.title}</span>
                         </div>
                       </td>
                       <td className="px-8 py-5 font-bold text-gray-700">{item.mainCategory} <span className="text-gray-300 font-medium mx-1">/</span> <span className="text-gray-400">{item.subCategory || 'عام'}</span></td>
                       <td className="px-8 py-5 font-bold text-gray-400">{item.author}</td>
                       <td className="px-8 py-5 text-center">
                          <div className="flex items-center justify-center gap-3">
                             <button 
                               onClick={() => handleEditItem(item)} 
                               className="flex items-center gap-2 px-4 py-2 text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-xl transition-all font-black text-xs"
                             >
                                <Edit3 size={16} /> تعديل
                             </button>
                             <button 
                               onClick={(e) => triggerDelete(e, 'content', item.id, item.title)} 
                               className="p-2 text-red-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all" 
                               title="حذف"
                             >
                                <Trash2 size={18} />
                             </button>
                          </div>
                       </td>
                     </tr>
                   ))}
                </tbody>
             </table>
             {filteredItems.length === 0 && <div className="p-24 text-center text-gray-300 font-black text-base">لا توجد مواد علمية للعرض حالياً في هذا القسم</div>}
          </div>
        )}

        {/* Modals */}
        {isAddingCategory && (
          <div className="fixed inset-0 z-[500] bg-black/60 backdrop-blur-md flex items-center justify-center p-6">
            <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl p-10 animate-in zoom-in-95">
               <h3 className="text-xl font-black text-gray-900 mb-8">إنشاء قسم رئيسي جديد</h3>
               <div className="space-y-6">
                  <div className="space-y-2">
                    <label className={labelStyle}>اسم القسم</label>
                    <input autoFocus type="text" className={inputStyle} placeholder="أدخل اسم القسم..." value={newCatName} onChange={e => setNewCatName(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <label className={labelStyle}>نوع المحتوى</label>
                    <div className="relative">
                      <select className={inputStyle} value={newCatType} onChange={e => setNewCatType(e.target.value as any)}>
                        <option value="book">مؤلفات وكتب</option>
                        <option value="audio">دروس صوتية</option>
                        <option value="video">مرئيات</option>
                        <option value="fatwa">فتاوى وأسئلة</option>
                      </select>
                      <ChevronDown className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={20} />
                    </div>
                  </div>
               </div>
               <div className="flex gap-3 mt-10">
                 <button onClick={async () => {
                    if (!newCatName) return; setIsProcessing(true);
                    try { await addDoc(collection(db, 'categories'), { name: newCatName, type: newCatType, subCategories: [] }); setIsAddingCategory(false); setNewCatName(''); showToast('تم إنشاء القسم بنجاح'); }
                    catch (e) { showToast('خطأ في العملية', 'error'); } finally { setIsProcessing(false); }
                 }} className="flex-1 bg-indigo-600 text-white py-4 rounded-xl font-black shadow-lg text-sm text-center">حفظ القسم</button>
                 <button onClick={() => setIsAddingCategory(false)} className="flex-1 bg-gray-100 text-gray-500 py-4 rounded-xl font-black text-sm text-center">إلغاء</button>
               </div>
            </div>
          </div>
        )}

        {editingCategory && (
          <div className="fixed inset-0 z-[550] bg-black/70 backdrop-blur-md flex items-center justify-center p-6">
            <div className="bg-white w-full max-w-xl rounded-[2.8rem] shadow-2xl p-10 animate-in slide-in-from-bottom-5 relative">
               <button onClick={() => setEditingCategory(null)} className="absolute top-8 left-8 text-gray-300 hover:text-gray-900 transition-colors"><X size={24} /></button>
               <h3 className="text-xl font-black text-gray-900 mb-8">إدارة التصنيفات في: {editingCategory.name}</h3>
               
               <div className="space-y-8">
                  <div className="bg-gray-50 p-8 rounded-3xl border border-gray-100">
                    <label className={labelStyle}>إضافة تصنيف فرعي</label>
                    <div className="flex gap-3">
                      <input type="text" className={inputStyle} placeholder="مثال: العقيدة، التفسير..." value={newSubCatName} onChange={e => setNewSubCatName(e.target.value)} onKeyPress={async (e) => {
                        if (e.key === 'Enter' && newSubCatName.trim()) {
                           setIsProcessing(true);
                           try { await updateDoc(doc(db, 'categories', editingCategory.id), { subCategories: arrayUnion(newSubCatName.trim()) }); setNewSubCatName(''); showToast('تمت إضافة التصنيف الفرعي'); }
                           finally { setIsProcessing(false); }
                        }
                      }} />
                      <button onClick={async () => {
                        if (!newSubCatName.trim()) return; setIsProcessing(true);
                        try { await updateDoc(doc(db, 'categories', editingCategory.id), { subCategories: arrayUnion(newSubCatName.trim()) }); setNewSubCatName(''); showToast('تمت إضافة التصنيف الفرعي'); }
                        finally { setIsProcessing(false); }
                      }} className="bg-indigo-600 text-white px-6 rounded-xl font-black shadow-lg"><Plus size={22} /></button>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <label className={labelStyle}>التصنيفات الحالية ({editingCategory.subCategories?.length || 0})</label>
                    <div className="grid grid-cols-2 gap-3 max-h-64 overflow-y-auto no-scrollbar p-1">
                      {editingCategory.subCategories?.map((sub, i) => (
                        <div key={i} className="flex items-center justify-between p-4 bg-white border border-gray-100 rounded-xl shadow-sm">
                          <span className="font-bold text-sm text-gray-800">{sub}</span>
                          <button onClick={async (e) => {
                             if (window.confirm('هل تريد حذف هذا التصنيف الفرعي؟')) {
                               setIsProcessing(true);
                               try { await updateDoc(doc(db, 'categories', editingCategory.id), { subCategories: arrayRemove(sub) }); showToast('تم الحذف بنجاح'); }
                               finally { setIsProcessing(false); }
                             }
                          }} className="text-red-300 hover:text-red-500 transition-colors"><Trash2 size={18}/></button>
                        </div>
                      ))}
                    </div>
                  </div>
               </div>
               <button onClick={() => setEditingCategory(null)} className="w-full mt-10 py-4.5 bg-gray-900 text-white rounded-xl font-black shadow-xl text-base text-center">حفظ وإغلاق النافذة</button>
            </div>
          </div>
        )}

        {isAddingContent && (
          <div className="fixed inset-0 z-[500] bg-black/60 backdrop-blur-md flex items-center justify-center p-10 overflow-y-auto">
            <div className="bg-white w-full max-w-5xl rounded-[3rem] shadow-2xl p-12 animate-in zoom-in-95 my-10 relative">
               <button onClick={() => { setIsAddingContent(false); setEditingItem(null); }} className="absolute top-10 left-10 text-gray-300 hover:text-gray-900 transition-colors"><X size={28} /></button>
               <h3 className="text-3xl font-black text-gray-900 mb-10">{editingItem ? 'تعديل مادة علمية' : 'نشر مادة علمية جديدة'}</h3>

               <form onSubmit={handleSubmitContent} className="space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-2 relative">
                      <label className={labelStyle}>نوع المحتوى</label>
                      <div className="relative">
                        <select className={inputStyle} value={formData.type} onChange={e => setFormData({...formData, type: e.target.value as any, mainCategory: '', subCategory: ''})}>
                          <option value="book">مؤلفات وكتب</option>
                          <option value="audio">دروس صوتية</option>
                          <option value="video">مرئيات</option>
                          <option value="fatwa">فتاوى وأسئلة</option>
                        </select>
                        <ChevronDown className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={20} />
                      </div>
                    </div>
                    <div className="space-y-2 relative">
                      <label className={labelStyle}>القسم الرئيسي</label>
                      <div className="relative">
                        <select className={inputStyle} required value={formData.mainCategory} onChange={e => setFormData({...formData, mainCategory: e.target.value, subCategory: ''})}>
                          <option value="">اختر القسم المناسب...</option>
                          {categories.filter(c => c.type === (formData.type || 'book')).map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                        </select>
                        <ChevronDown className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={20} />
                      </div>
                    </div>
                    <div className="space-y-2 relative">
                      <label className={labelStyle}>التصنيف الفرعي</label>
                      <div className="relative">
                        <select className={inputStyle} value={formData.subCategory} onChange={e => setFormData({...formData, subCategory: e.target.value})}>
                          <option value="">عام / غير مصنف</option>
                          {categories.find(c => c.name === formData.mainCategory)?.subCategories?.map((sub, idx) => <option key={idx} value={sub}>{sub}</option>)}
                        </select>
                        <ChevronDown className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={20} />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className={labelStyle}>{formData.type === 'fatwa' ? 'نص السؤال الشرعي' : 'عنوان المادة العلمية'}</label>
                    <input type="text" className={inputStyle} placeholder="أدخل العنوان هنا..." value={formData.title || ''} onChange={e => setFormData({...formData, title: e.target.value})} required />
                  </div>

                  {formData.type === 'fatwa' ? (
                    <div className="space-y-2">
                      <label className={labelStyle}>نص الجواب والفتوى</label>
                      <textarea className={inputStyle + " h-64 resize-none text-base leading-relaxed"} placeholder="اكتب الجواب بالتفصيل..." value={formData.description || ''} onChange={e => setFormData({...formData, description: e.target.value})} required />
                    </div>
                  ) : (
                    <>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label className={labelStyle}>رابط المصدر (PDF/YouTube)</label>
                          <input type="url" className={inputStyle} placeholder="https://..." value={formData.sourceUrl || ''} onChange={e => setFormData({...formData, sourceUrl: e.target.value})} />
                        </div>
                        <div className="space-y-2">
                          <label className={labelStyle}>رابط صورة الغلاف</label>
                          <input type="url" className={inputStyle} placeholder="https://..." value={formData.coverImage || ''} onChange={e => setFormData({...formData, coverImage: e.target.value})} />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-6">
                         <div className="space-y-2">
                            <label className={labelStyle}>رقم المجلد (اختياري)</label>
                            <input type="number" className={inputStyle} value={formData.volumeNumber} onChange={e => setFormData({...formData, volumeNumber: parseInt(e.target.value)})} />
                         </div>
                         <div className="space-y-2">
                            <label className={labelStyle}>المدة الزمنية</label>
                            <input type="text" className={inputStyle} placeholder="مثال: 01:20:00" value={formData.duration} onChange={e => setFormData({...formData, duration: e.target.value})} />
                         </div>
                      </div>
                    </>
                  )}

                  <div className="flex gap-4 pt-8">
                    <button type="submit" disabled={isProcessing} className="flex-1 bg-indigo-600 text-white py-5 rounded-2xl font-black shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all flex items-center justify-center gap-3 text-lg text-center">
                      <Save size={24} /> {editingItem ? 'حفظ التعديلات' : 'حفظ المادة ونشرها الآن'}
                    </button>
                    <button type="button" onClick={() => { setIsAddingContent(false); setEditingItem(null); }} className="px-10 bg-gray-100 text-gray-500 py-5 rounded-2xl font-black text-lg transition-colors hover:bg-gray-200 text-center">إلغاء</button>
                  </div>
               </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default AdminDashboard;
