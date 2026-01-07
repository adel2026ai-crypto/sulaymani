
import React, { useState } from 'react';
import { ChevronRight, Maximize2, ExternalLink, Download, FileText, AlertCircle } from 'lucide-react';

interface PdfReaderProps {
  url: string;
  title: string;
  onBack: () => void;
}

const PdfReader: React.FC<PdfReaderProps> = ({ url, title, onBack }) => {
  const [loadError, setLoadError] = useState(false);
  
  // Using Google Docs Viewer for better mobile compatibility
  const viewerUrl = `https://docs.google.com/viewer?url=${encodeURIComponent(url)}&embedded=true`;

  return (
    <div className="fixed inset-0 z-[60] bg-[#F4F5F7] flex flex-col animate-in slide-in-from-left duration-400">
      {/* Reader Header */}
      <div className="p-4 bg-white border-b border-gray-100 flex justify-between items-center shadow-sm z-10">
        <button 
          onClick={onBack} 
          className="w-11 h-11 rounded-full bg-gray-50 flex items-center justify-center text-gray-800 active:scale-90 transition-transform"
        >
          <ChevronRight size={24} className="mr-0.5" />
        </button>
        
        <div className="flex flex-col items-center flex-1 mx-4">
          <h2 className="font-black text-gray-900 text-[13px] line-clamp-1 text-center">{title}</h2>
          <div className="flex items-center gap-1.5 text-[10px] text-indigo-600 font-black uppercase tracking-widest mt-0.5">
            <FileText size={12} />
            <span>نمط القراءة</span>
          </div>
        </div>

        <div className="flex gap-2">
          <a 
            href={url} 
            target="_blank" 
            rel="noopener noreferrer"
            className="w-11 h-11 rounded-full bg-indigo-600 flex items-center justify-center text-white shadow-lg active:scale-95 transition-all"
            title="فتح في المتصفح"
          >
            <ExternalLink size={20} />
          </a>
        </div>
      </div>

      {/* PDF Container */}
      <div className="flex-1 relative overflow-hidden flex flex-col">
        <iframe
          src={viewerUrl}
          className="w-full h-full border-none flex-1"
          title={title}
          onError={() => setLoadError(true)}
        />
        
        {/* Helper Overlay for first-time instruction */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 bg-indigo-600/90 backdrop-blur-md text-white px-7 py-3 rounded-2xl text-[11px] font-black shadow-2xl pointer-events-none animate-bounce border border-white/20">
          استخدم إصبعين للتكبير والتصغير 🔍
        </div>

        {/* Fallback Option */}
        <div className="p-6 bg-white border-t border-gray-100 text-center">
          <p className="text-xs text-gray-400 font-bold mb-4 flex items-center justify-center gap-2">
            <AlertCircle size={14} className="text-amber-500" />
            إذا لم يظهر الملف، يمكنك فتحه مباشرة بالزر الأزرق في الأعلى
          </p>
          <button 
            onClick={() => window.open(url, '_blank')}
            className="text-indigo-600 text-xs font-black underline active:opacity-60"
          >
            فتح الملف في نافذة جديدة
          </button>
        </div>
      </div>
    </div>
  );
};

export default PdfReader;
