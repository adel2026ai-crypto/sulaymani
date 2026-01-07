
import React, { useState } from 'react';
import { auth } from '../firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import { Lock, Mail, ChevronRight, AlertCircle, UserPlus, LogIn, Info } from 'lucide-react';

interface LoginProps {
  onCancel: () => void;
}

const Login: React.FC<LoginProps> = ({ onCancel }) => {
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('يرجى إدخال البريد الإلكتروني وكلمة المرور');
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      // Ensure clean state
      if (auth.currentUser) await signOut(auth);

      if (isRegistering) {
        await createUserWithEmailAndPassword(auth, email.trim().toLowerCase(), password);
      } else {
        await signInWithEmailAndPassword(auth, email.trim().toLowerCase(), password);
      }
    } catch (err: any) {
      console.error("Auth Error:", err.code);
      
      // Handle the specific 'auth/invalid-credential' error which replaces multiple errors in newer SDKs
      if (err.code === 'auth/invalid-credential') {
        setError('بيانات الدخول غير صحيحة. تأكد من البريد الإلكتروني وكلمة المرور، أو قم بإنشاء حساب جديد إذا لم يكن لديك واحد.');
      } else if (err.code === 'auth/email-already-in-use') {
        setError('هذا البريد الإلكتروني مستخدم بالفعل. حاول تسجيل الدخول بدلاً من التسجيل.');
      } else if (err.code === 'auth/weak-password') {
        setError('كلمة المرور ضعيفة جداً. يجب أن تتكون من 6 أحرف على الأقل.');
      } else if (err.code === 'auth/wrong-password' || err.code === 'auth/user-not-found') {
        setError('خطأ في البريد الإلكتروني أو كلمة المرور. يرجى التأكد من البيانات.');
      } else if (err.code === 'auth/too-many-requests') {
        setError('لقد حاولت عدة مرات بشكل خاطئ. تم حظر المحاولات مؤقتاً لحماية حسابك.');
      } else if (err.code === 'auth/operation-not-allowed') {
        setError('تسجيل الدخول بالبريد الإلكتروني غير مفعل في إعدادات Firebase الخاصة بك.');
      } else {
        setError('حدث خطأ في الاتصال بالخادم. يرجى التأكد من الإنترنت والمحاولة ثانية.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-[#F4F5F7]">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-8 duration-500 border border-gray-100">
        <div className="p-10 pt-12 text-center relative">
          <button 
            onClick={onCancel}
            className="absolute top-8 right-8 w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors"
          >
            <ChevronRight size={24} />
          </button>
          
          <div className="w-20 h-20 purple-gradient rounded-[1.5rem] flex items-center justify-center text-white mx-auto mb-6 shadow-xl shadow-purple-100">
            {isRegistering ? <UserPlus size={32} /> : <Lock size={32} />}
          </div>
          <h1 className="text-2xl font-black text-gray-800 mb-2">
            {isRegistering ? 'إنشاء حساب جديد' : 'تسجيل الدخول'}
          </h1>
          <p className="text-gray-400 text-sm font-bold">
            {isRegistering ? 'انضم إلينا لحفظ مفضلاتك ومتابعة دروسك' : 'سجل دخولك للتمتع بكافة مميزات المنصة'}
          </p>
        </div>

        <form onSubmit={handleAuth} className="px-10 pb-12 space-y-5">
          {error && (
            <div className="bg-red-50 border border-red-100 text-red-600 p-4 rounded-xl flex items-start gap-3 text-sm animate-in fade-in zoom-in-95 font-bold">
              <AlertCircle size={18} className="shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {!error && !isRegistering && (
             <div className="bg-indigo-50/50 border border-indigo-100 text-indigo-600 p-3 rounded-xl flex items-center gap-3 text-[10px] font-bold">
                <Info size={14} className="shrink-0" />
                <span>إذا كنت الأدمن، يرجى التأكد من تسجيل حسابك الرسمي أولاً.</span>
             </div>
          )}

          <div className="space-y-2">
            <label className="text-xs font-black text-gray-600 block px-1 text-right">البريد الإلكتروني</label>
            <div className="relative group">
              <input 
                type="email" 
                required
                className="w-full bg-[#F4F5F7] border border-gray-200 py-4.5 px-12 rounded-2xl focus:outline-none focus:ring-4 focus:ring-indigo-50 transition-all font-bold text-gray-900 placeholder:text-gray-300 text-right"
                placeholder="email@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <Mail className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-indigo-500 transition-colors" size={20} />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-black text-gray-600 block px-1 text-right">كلمة المرور</label>
            <div className="relative group">
              <input 
                type="password" 
                required
                className="w-full bg-[#F4F5F7] border border-gray-200 py-4.5 px-12 rounded-2xl focus:outline-none focus:ring-4 focus:ring-indigo-50 transition-all font-bold text-gray-900 placeholder:text-gray-300 text-right"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <Lock className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-indigo-500 transition-colors" size={20} />
            </div>
          </div>

          <button 
            type="submit"
            disabled={loading}
            className={`w-full purple-gradient text-white py-5 rounded-2xl font-black shadow-xl active:scale-95 transition-all flex items-center justify-center gap-2 mt-4 ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            ) : isRegistering ? (
              <> <UserPlus size={20} /> إنشاء الحساب الآن </>
            ) : (
              <> <LogIn size={20} /> دخول للمنصة </>
            )}
          </button>

          <div className="pt-4 text-center">
            <button 
              type="button"
              onClick={() => { setIsRegistering(!isRegistering); setError(''); }}
              className="text-xs font-black text-indigo-600 hover:text-indigo-800 transition-colors"
            >
              {isRegistering ? 'لديك حساب بالفعل؟ سجل دخولك' : 'ليس لديك حساب؟ اضغط هنا للتسجيل مجاناً'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;
