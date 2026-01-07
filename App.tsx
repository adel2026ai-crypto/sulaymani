
import React, { useState, useEffect } from 'react';
import MobileHome from './components/MobileHome';
import AdminDashboard from './components/AdminDashboard';
import Login from './components/Login';
import { ContentItem } from './types';
import { auth, db } from './firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isAdminView, setIsAdminView] = useState<boolean>(false);
  const [content, setContent] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorType, setErrorType] = useState<'permission' | 'connection' | 'other' | null>(null);

  // Admin Email Constant
  const ADMIN_EMAIL = 'adel2026ai@gmail.com';

  useEffect(() => {
    // زيادة المهلة إلى 20 ثانية للسماح لـ Firestore بالاتصال في الشبكات الضعيفة
    const connectionTimeout = setTimeout(() => {
      if (loading) {
        setErrorType('connection');
        setLoading(false);
      }
    }, 20000);

    // 1. Listen for Auth State
    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (!currentUser) setIsAdminView(false);
    });

    // 2. Listen for Firestore Data
    const q = query(collection(db, 'content'), orderBy('createdAt', 'desc'));
    const unsubscribeData = onSnapshot(q, (snapshot) => {
      clearTimeout(connectionTimeout); // البيانات وصلت، نلغي مهلة الانتظار
      const items = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as ContentItem[];
      setContent(items);
      setErrorType(null);
      setLoading(false);
    }, (err) => {
      clearTimeout(connectionTimeout);
      console.error("Firestore Snapshot Error:", err);
      
      if (err.code === 'permission-denied') {
        setErrorType('permission');
      } else if (err.code === 'unavailable' || err.code === 'deadline-exceeded') {
        // إذا كان هناك محتوى محمل مسبقاً (Cache)، لا نعرض شاشة الخطأ
        if (content.length === 0) {
          setErrorType('connection');
        }
      } else {
        if (content.length === 0) {
          setErrorType('other');
        }
      }
      setLoading(false);
    });

    return () => {
      clearTimeout(connectionTimeout);
      unsubscribeAuth();
      unsubscribeData();
    };
  }, []);

  const handleRetry = () => {
    setLoading(true);
    setErrorType(null);
    window.location.reload();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
        <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
        <p className="text-gray-500 font-bold">جاري الاتصال بدار الحديث...</p>
        <p className="text-[10px] text-gray-400 mt-2">قد يستغرق الاتصال بضع ثوانٍ إضافية</p>
      </div>
    );
  }

  if (errorType && !isAdminView) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-red-50">
        <div className="bg-white p-8 rounded-[2.5rem] shadow-2xl max-w-md text-center border border-red-100 animate-in zoom-in-95">
          <div className="w-20 h-20 bg-red-100 text-red-600 rounded-3xl flex items-center justify-center mx-auto mb-6">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-2xl font-black text-gray-800 mb-4">
            {errorType === 'permission' ? 'خطأ في الصلاحيات' : 'تعذر الاتصال بالخادم'}
          </h2>
          <p className="text-gray-500 mb-8 font-medium leading-relaxed">
            {errorType === 'permission' 
              ? 'يبدو أن الوصول لقاعدة البيانات محظور. يرجى مراجعة إعدادات Firebase Security Rules.' 
              : 'لم نتمكن من الوصول للمواد العلمية حالياً. يرجى التأكد من اتصالك بالإنترنت.'}
          </p>
          <button 
            onClick={handleRetry}
            className="w-full purple-gradient text-white py-4.5 rounded-2xl font-black shadow-lg shadow-indigo-100 hover:scale-[1.02] active:scale-95 transition-all"
          >
            إعادة المحاولة الآن
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 font-['IBM_Plex_Sans_Arabic']">
      {/* Admin Toggle - Hidden on Mobile, Visible on Desktop */}
      <div className="fixed top-4 left-4 z-50 hidden md:flex gap-2">
        <button 
          onClick={() => setIsAdminView(!isAdminView)}
          className={`px-6 py-2.5 rounded-full text-[11px] shadow-xl transition-all font-black border border-white/20 active:scale-95 ${
            isAdminView 
            ? 'bg-white text-gray-800 border-gray-200' 
            : 'bg-black/90 backdrop-blur-md text-white hover:bg-black'
          }`}
        >
          {isAdminView ? '← العودة للموقع' : 'دخول لوحة التحكم'}
        </button>
      </div>

      {isAdminView ? (
        user?.email === ADMIN_EMAIL ? (
          <AdminDashboard content={content} user={user} />
        ) : (
          <Login onCancel={() => setIsAdminView(false)} />
        )
      ) : (
        <div className="mobile-frame min-h-screen overflow-x-hidden relative shadow-2xl">
          <MobileHome content={content} />
        </div>
      )}
    </div>
  );
};

export default App;
