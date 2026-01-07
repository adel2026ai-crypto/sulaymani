
import React, { useState, useEffect, useRef } from 'react';
import { 
  ChevronRight, 
  Star, 
  Play, 
  Pause, 
  SkipBack, 
  SkipForward,
  BookOpen,
  Eye,
  MessageCircleQuestion,
  Quote,
  Share2,
  Volume2,
  Maximize2,
  Music,
  Youtube,
  MonitorPlay
} from 'lucide-react';
import { ContentItem } from '../types';
import PdfReader from './PdfReader';
import { db, auth } from '../firebase';
import { doc, updateDoc, arrayUnion, arrayRemove, onSnapshot } from 'firebase/firestore';

interface ContentDetailProps {
  item: ContentItem;
  onBack: () => void;
}

const ContentDetail: React.FC<ContentDetailProps> = ({ item, onBack }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isVideoStarted, setIsVideoStarted] = useState(false);
  const [showReader, setShowReader] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState('00:00');
  const [isFavorite, setIsFavorite] = useState(false);
  const [loadingFav, setLoadingFav] = useState(false);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const user = auth.currentUser;
    if (user) {
      const userDocRef = doc(db, 'users', user.uid);
      const unsubscribe = onSnapshot(userDocRef, (snap) => {
        if (snap.exists()) {
          const data = snap.data();
          setIsFavorite(data.favorites?.includes(item.id) || false);
        }
      });
      return unsubscribe;
    }
  }, [item.id]);

  useEffect(() => {
    if (item.type === 'audio' && item.sourceUrl) {
      audioRef.current = new Audio(item.sourceUrl);
      const audio = audioRef.current;

      const updateProgress = () => {
        const p = (audio.currentTime / audio.duration) * 100;
        setProgress(p || 0);
        setCurrentTime(formatTime(audio.currentTime));
      };

      audio.addEventListener('timeupdate', updateProgress);
      audio.addEventListener('ended', () => setIsPlaying(false));

      return () => {
        audio.pause();
        audio.removeEventListener('timeupdate', updateProgress);
      };
    }
  }, [item.id, item.type, item.sourceUrl]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch(e => console.error("Playback failed", e));
    }
    setIsPlaying(!isPlaying);
  };

  const toggleFavorite = async () => {
    const user = auth.currentUser;
    if (!user) {
      alert('يرجى تسجيل الدخول أولاً لتتمكن من الحفظ في المفضلة.');
      return;
    }
    setLoadingFav(true);
    const userDocRef = doc(db, 'users', user.uid);
    try {
      if (isFavorite) {
        await updateDoc(userDocRef, { favorites: arrayRemove(item.id) });
      } else {
        await updateDoc(userDocRef, { favorites: arrayUnion(item.id) });
      }
    } catch (err) {
      console.error("Error toggling favorite:", err);
    } finally {
      setLoadingFav(false);
    }
  };

  const getYouTubeId = (url: string) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  const handleOpenSource = () => {
    if (item.sourceUrl) {
      if (item.type === 'book') {
        setShowReader(true);
      }
    } else {
      alert('الرابط غير متوفر حالياً');
    }
  };

  if (showReader && item.type === 'book') {
    return <PdfReader url={item.sourceUrl} title={item.title} onBack={() => setShowReader(false)} />;
  }

  const youtubeId = item.type === 'video' ? getYouTubeId(item.sourceUrl) : null;
  const youtubeThumb = youtubeId ? `https://img.youtube.com/vi/${youtubeId}/maxresdefault.jpg` : item.coverImage;

  return (
    <div className={`flex flex-col min-h-screen pb-40 ${item.type === 'fatwa' ? 'bg-[#F4F5F7]' : 'bg-white'}`}>
      <div className="p-4 flex justify-between items-center sticky top-0 bg-white/95 backdrop-blur-md z-30 border-b border-gray-100">
        <button onClick={onBack} className="w-10 h-10 rounded-full border border-gray-100 flex items-center justify-center text-gray-600 active:scale-90 transition-all">
          <ChevronRight size={22} className="mr-0.5" />
        </button>
        <h2 className="font-black text-gray-800 text-sm">
          {item.type === 'fatwa' ? 'سؤال وجواب' : item.type === 'book' ? 'تفاصيل الكتاب' : 'مشغل الوسائط'}
        </h2>
        <div className="flex gap-2">
          <button className="w-10 h-10 rounded-full border border-gray-100 flex items-center justify-center text-gray-300">
            <Share2 size={18} />
          </button>
          <button 
            onClick={toggleFavorite}
            disabled={loadingFav}
            className={`w-10 h-10 rounded-full border border-gray-100 flex items-center justify-center transition-all ${isFavorite ? 'text-yellow-500 bg-yellow-50 border-yellow-200' : 'text-gray-300'}`}
          >
            <Star size={18} fill={isFavorite ? "currentColor" : "none"} />
          </button>
        </div>
      </div>

      <div className="p-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        {item.type === 'fatwa' ? (
          <div className="space-y-6">
            <div className="bg-white p-7 rounded-[2rem] shadow-sm border border-gray-100">
              <div className="flex items-center gap-2 mb-4">
                 <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                   <MessageCircleQuestion size={20} />
                 </div>
                 <span className="text-[11px] font-black text-indigo-400 uppercase tracking-widest">السؤال الشرعي</span>
              </div>
              <h1 className="text-xl font-black text-gray-900 leading-relaxed">{item.title}</h1>
            </div>
            
            <div className="space-y-4">
               <div className="flex items-center gap-2 mr-2">
                  <div className="w-2 h-7 bg-indigo-600 rounded-full"></div>
                  <h3 className="font-black text-gray-800 text-lg">الجواب والفتوى</h3>
               </div>
               <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100 leading-loose text-gray-700 text-[15px] whitespace-pre-line relative overflow-hidden">
                  <Quote className="absolute -top-4 -left-4 text-gray-50 w-24 h-24 opacity-60" />
                  <div className="relative z-10 font-bold">{item.description || "لا توجد إجابة مضافة حالياً."}</div>
               </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center">
            
            {/* Custom Cinema Video Player */}
            {item.type === 'video' && (
              <div className="w-full aspect-video rounded-[2.5rem] overflow-hidden shadow-2xl mb-10 relative border-[6px] border-white ring-1 ring-gray-100 group bg-black">
                {!isVideoStarted ? (
                  <div className="absolute inset-0 z-10 cursor-pointer" onClick={() => setIsVideoStarted(true)}>
                    <img 
                      src={youtubeThumb} 
                      className="w-full h-full object-cover opacity-80 group-hover:scale-105 transition-transform duration-700" 
                      alt="" 
                      onError={(e) => { e.currentTarget.src = item.coverImage; }}
                    />
                    <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                       <div className="w-20 h-20 bg-white/20 backdrop-blur-xl rounded-full flex items-center justify-center text-white border border-white/40 shadow-2xl active:scale-90 transition-transform">
                          <Play size={40} fill="white" className="ml-1.5" />
                       </div>
                    </div>
                    {/* YouTube Badge */}
                    <div className="absolute top-5 right-5 bg-white/90 backdrop-blur-md px-4 py-1.5 rounded-2xl shadow-lg border border-gray-100 flex items-center gap-2">
                       <Youtube size={16} className="text-red-600" />
                       <span className="text-[11px] font-black text-gray-800">مشغل اليوتيوب</span>
                    </div>
                  </div>
                ) : (
                  youtubeId ? (
                    <iframe 
                      className="w-full h-full"
                      src={`https://www.youtube.com/embed/${youtubeId}?autoplay=1&rel=0&modestbranding=1`}
                      title={item.title}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    ></iframe>
                  ) : (
                    <video src={item.sourceUrl} controls autoPlay className="w-full h-full" poster={item.coverImage}></video>
                  )
                )}
              </div>
            )}

            {/* Audio Visualizer */}
            {item.type === 'audio' && (
              <div className="w-full max-w-xs aspect-square rounded-[3rem] overflow-hidden shadow-2xl mb-12 mt-4 relative bg-indigo-50 flex items-center justify-center border-4 border-white group">
                <div className="absolute inset-0 purple-gradient opacity-10"></div>
                
                <div className="flex items-end justify-center gap-1.5 h-32 relative z-10">
                  {[...Array(12)].map((_, i) => (
                    <div 
                      key={i}
                      className={`w-2.5 bg-indigo-600 rounded-full transition-all duration-300 ${isPlaying ? 'animate-bounce' : 'h-4 opacity-30'}`}
                      style={{ 
                        height: isPlaying ? `${Math.floor(Math.random() * 80) + 20}%` : '15%',
                        animationDelay: `${i * 0.1}s`,
                        animationDuration: `${0.6 + Math.random()}s`
                      }}
                    ></div>
                  ))}
                </div>
                
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-5 pointer-events-none">
                   <Music size={180} />
                </div>

                <div className="absolute top-6 right-6 bg-white/90 backdrop-blur-md px-4 py-1.5 rounded-2xl shadow-lg border border-gray-100">
                   <span className="text-[11px] font-black text-indigo-600">جـ {item.volumeNumber || 1}</span>
                </div>
              </div>
            )}

            {/* Default Book Cover */}
            {item.type === 'book' && (
              <div className="w-56 h-72 rounded-[2.5rem] overflow-hidden shadow-2xl mb-8 mt-4 relative border-[8px] border-white ring-1 ring-gray-100 group">
                <img src={item.coverImage} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt="" />
                <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-md px-4 py-1.5 rounded-2xl shadow-lg border border-gray-100">
                   <span className="text-[11px] font-black text-indigo-600">جـ {item.volumeNumber || 1}</span>
                </div>
              </div>
            )}
            
            <div className="flex flex-col items-center px-4 w-full">
               <span className="bg-indigo-50 text-indigo-600 px-5 py-2 rounded-full text-[11px] font-black mb-4 uppercase tracking-widest">
                 {item.type === 'video' ? 'عرض مرئي' : item.mainCategory}
               </span>
               <h1 className="text-2xl font-black text-gray-900 text-center mb-2 leading-tight">{item.title}</h1>
               <p className="text-gray-400 font-bold text-sm mb-10">{item.author}</p>
            </div>
            
            {item.type === 'book' && (
              <div className="w-full space-y-6">
                <div className="bg-white p-7 rounded-[2.5rem] border border-gray-100 shadow-sm relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-50/50 rounded-bl-[100px] -z-0"></div>
                  <h3 className="font-black text-gray-800 mb-4 flex items-center gap-2 text-[15px] relative z-10">
                    <BookOpen size={18} className="text-indigo-600" /> نبذة عن الكتاب
                  </h3>
                  <p className="text-[13px] text-gray-600 leading-relaxed font-bold relative z-10">{item.description || "لا يوجد وصف متاح لهذا الكتاب حالياً."}</p>
                </div>
                <button onClick={handleOpenSource} className="w-full purple-gradient text-white py-5.5 rounded-[2rem] font-black shadow-xl shadow-indigo-100 flex items-center justify-center gap-3 active:scale-95 transition-all text-lg">
                  <Eye size={24} /> قراءة الكتاب الآن
                </button>
              </div>
            )}

            {item.type === 'audio' && (
              <div className="w-full px-2">
                <div className="mb-14">
                  <div className="flex justify-between text-[13px] font-black text-gray-400 mb-4 px-1">
                    <span>{currentTime}</span>
                    <span>{item.duration || '00:00'}</span>
                  </div>
                  <div className="h-2.5 w-full bg-gray-100 rounded-full overflow-hidden p-[2px] shadow-inner relative">
                    <div 
                      className="h-full purple-gradient rounded-full shadow-[0_0_10px_rgba(124,58,237,0.3)] transition-all duration-300" 
                      style={{ width: `${progress}%` }}
                    ></div>
                    <div 
                      className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-white rounded-full shadow-md border-2 border-indigo-600" 
                      style={{ left: `calc(${progress}% - 8px)` }}
                    ></div>
                  </div>
                </div>
                
                <div className="flex justify-center items-center gap-10">
                  <button className="text-gray-200 hover:text-gray-400 transition-colors active:scale-90"><SkipBack size={40} /></button>
                  <button 
                    onClick={togglePlay} 
                    className="w-20 h-20 rounded-[2rem] purple-gradient text-white flex items-center justify-center shadow-2xl active:scale-90 transition-all border-4 border-white group"
                  >
                    {isPlaying ? <Pause size={35} fill="white" /> : <Play size={35} fill="white" className="ml-1" />}
                  </button>
                  <button className="text-gray-200 hover:text-gray-400 transition-colors active:scale-90"><SkipForward size={40} /></button>
                </div>

                <div className="mt-12 flex justify-center">
                   <div className="flex items-center gap-2 text-indigo-600 bg-indigo-50 px-6 py-2.5 rounded-full font-black text-xs">
                     <Volume2 size={16} /> مشغل الصوت الرقمي
                   </div>
                </div>
              </div>
            )}

            {item.type === 'video' && (
               <div className="w-full mt-4">
                  <div className="bg-indigo-50/50 p-8 rounded-[2.5rem] border border-indigo-100 text-right relative overflow-hidden">
                    <MonitorPlay className="absolute -bottom-4 -left-4 text-indigo-200/20 w-32 h-32" />
                    <h3 className="font-black text-indigo-900 mb-3 flex items-center gap-2">
                      <div className="w-1.5 h-6 bg-indigo-600 rounded-full"></div>
                      حول هذا العرض
                    </h3>
                    <p className="text-indigo-700/80 font-bold text-sm leading-loose relative z-10">{item.description || "مشاهدة ممتعة ومفيدة في رحاب العلم الشرعي والدروس المنهجية."}</p>
                  </div>
               </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ContentDetail;
