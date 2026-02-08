import React, { useState, useEffect, useRef, useMemo } from 'react';
import { toPng } from 'html-to-image';
import { 
  Settings, 
  Sparkles, 
  Download, 
  LayoutTemplate, 
  ChevronRight, 
  ChevronLeft,
  Image as ImageIcon
} from 'lucide-react';
import { UserProfile, ContentData } from './types';
import { DEFAULT_PROFILE } from './constants';
import { loadUserProfile, saveUserProfile } from './services/storageService';
import { polishContent } from './services/geminiService';
import { ProfileModal } from './components/ProfileModal';
import { PreviewCanvas } from './components/PreviewCanvas';
import { balanceText } from './utils/textBalancer';

const App: React.FC = () => {
  // --- State ---
  const [profile, setProfile] = useState<UserProfile>(DEFAULT_PROFILE);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [content, setContent] = useState<ContentData>({
    title: "",
    body: ""
  });
  const [isPolishing, setIsPolishing] = useState(false);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [scale, setScale] = useState(0.25); // Scale for preview visibility
  
  const previewRef = useRef<HTMLDivElement>(null);
  // We need refs for all slides to download them all at once
  const hiddenRenderRefs = useRef<(HTMLDivElement | null)[]>([]);

  // --- Effects ---
  useEffect(() => {
    const saved = loadUserProfile();
    if (saved) {
      setProfile(saved);
    } else {
      setIsProfileModalOpen(true);
    }

    // Calculate scale based on window size
    const handleResize = () => {
      const containerWidth = document.getElementById('preview-container')?.clientWidth || 500;
      // 1242 is actual width. We want it to fit with some margin.
      const newScale = Math.min(containerWidth / 1400, 0.5); 
      setScale(Math.max(newScale, 0.15));
    };

    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // --- Logic ---
  const handleProfileSave = (newProfile: UserProfile) => {
    setProfile(newProfile);
    saveUserProfile(newProfile);
  };

  const handleGeminiPolish = async () => {
    if (!content.body && !content.title) return;
    setIsPolishing(true);
    try {
      const fullText = `${content.title}\n${content.body}`;
      const polished = await polishContent(fullText);
      setContent(polished);
    } catch (error) {
      alert("AI 优化失败，请检查 API Key 或网络。");
    } finally {
      setIsPolishing(false);
    }
  };

  const generateImages = async () => {
    if (hiddenRenderRefs.current.length === 0) return;
    
    // Helper to generate a single image with retry logic
    const generateSingleImage = async (el: HTMLDivElement, index: number) => {
       const options = { 
         quality: 1.0, 
         pixelRatio: 2, 
         cacheBust: true, 
       };
       
       try {
         // Attempt standard generation
         return await toPng(el, options);
       } catch (e) {
         console.warn(`Initial generation failed for slide ${index}, retrying with safe settings...`, e);
         
         // Fallback 1: Disable cacheBust and skip fonts. 
         // "Cannot access rules" error often comes from accessing StyleSheet.cssRules on CORS-protected sheets.
         // skipFonts: true prevents html-to-image from accessing these rules.
         try {
             return await toPng(el, { 
                 quality: 1.0,
                 pixelRatio: 2,
                 cacheBust: false, // Don't cache bust in retry, might trigger CORS on strict CDNs
                 skipFonts: true,
             });
         } catch (retryError) {
            console.error(`Retry generation failed for slide ${index}`, retryError);
            // Fallback 2: Last resort, pixel ratio 1, absolute bare minimum
            return await toPng(el, {
                quality: 0.9,
                pixelRatio: 1,
                cacheBust: false,
                skipFonts: true,
            });
         }
       }
    };

    try {
      // Iterate through all hidden refs and download them
      for (let i = 0; i < hiddenRenderRefs.current.length; i++) {
        const el = hiddenRenderRefs.current[i];
        if (el) {
          const dataUrl = await generateSingleImage(el, i);
          const link = document.createElement('a');
          link.download = `rednote-slide-${i + 1}.png`;
          link.href = dataUrl;
          link.click();
        }
      }
    } catch (err) {
      console.error("Image generation process failed", err);
      alert("图片生成部分失败，请检查控制台或重试。");
    }
  };

  // Split content into pages
  const pages = useMemo(() => {
    return balanceText(content.title, content.body);
  }, [content.title, content.body]);

  const currentDate = new Date().toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).replace(/\//g, '.');

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-[#F2F4F7] overflow-hidden">
      
      {/* --- Left Panel: Editor --- */}
      <div className="w-full md:w-[450px] bg-white border-r border-gray-200 flex flex-col h-screen z-10 shadow-lg">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-white sticky top-0 z-20">
          <div className="flex items-center gap-2 text-rose-500 font-bold text-xl tracking-tight">
            <LayoutTemplate />
            <span>RedNote Esthete</span>
          </div>
          <button 
            onClick={() => setIsProfileModalOpen(true)}
            className="p-2 hover:bg-gray-100 rounded-full text-gray-600 transition"
            title="设置个人信息"
          >
            <Settings size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* Title Input */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">标题 (Title)</label>
            <input
              type="text"
              className="w-full text-2xl font-bold text-gray-800 placeholder-gray-300 border-b-2 border-transparent focus:border-rose-500 outline-none py-2 transition bg-transparent"
              placeholder="输入吸引人的标题..."
              value={content.title}
              onChange={(e) => setContent(prev => ({ ...prev, title: e.target.value }))}
            />
          </div>

          {/* Body Input */}
          <div className="space-y-2 h-full flex flex-col">
            <div className="flex justify-between items-end">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">正文 (Content)</label>
              <span className="text-xs text-gray-400">{content.body.length} 字</span>
            </div>
            <textarea
              className="w-full flex-1 min-h-[300px] p-4 bg-gray-50 rounded-xl border border-gray-200 focus:border-rose-500 focus:ring-1 focus:ring-rose-500 outline-none transition resize-none text-gray-700 leading-relaxed"
              placeholder="输入正文内容。系统会自动为您排版分页..."
              value={content.body}
              onChange={(e) => setContent(prev => ({ ...prev, body: e.target.value }))}
            />
          </div>

          {/* AI Action */}
          <button
            onClick={handleGeminiPolish}
            disabled={isPolishing}
            className={`w-full py-3 rounded-xl flex items-center justify-center gap-2 font-medium transition-all
              ${isPolishing 
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                : 'bg-gradient-to-r from-violet-100 to-rose-100 text-rose-600 hover:from-violet-200 hover:to-rose-200 shadow-sm hover:shadow-md'
              }`}
          >
            {isPolishing ? (
              <span className="animate-pulse">正在优化文案...</span>
            ) : (
              <>
                <Sparkles size={18} />
                <span>AI 一键润色 & 排版</span>
              </>
            )}
          </button>
        </div>

        {/* Footer Actions */}
        <div className="p-6 border-t border-gray-100 bg-white sticky bottom-0 z-20">
          <button
            onClick={generateImages}
            disabled={!content.body && !content.title}
            className="w-full py-4 bg-[#333] hover:bg-black text-white rounded-xl font-bold text-lg flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transition-all active:scale-[0.98]"
          >
            <Download size={20} />
            生成并下载 ({pages.length} 张)
          </button>
        </div>
      </div>

      {/* --- Right Panel: Preview --- */}
      <div 
        id="preview-container" 
        className="flex-1 h-screen overflow-hidden relative flex items-center justify-center bg-[#E5E5E5]"
        style={{
          backgroundImage: 'radial-gradient(#CBD5E1 1px, transparent 1px)',
          backgroundSize: '20px 20px'
        }}
      >
        {/* Navigation if multiple pages */}
        {pages.length > 0 && (
          <>
            <div className="absolute top-8 bg-white/80 backdrop-blur px-4 py-2 rounded-full shadow-sm text-sm font-medium text-gray-600 z-30">
              预览: 第 {currentSlideIndex + 1} / {pages.length} 页
            </div>

            <button 
              onClick={() => setCurrentSlideIndex(Math.max(0, currentSlideIndex - 1))}
              disabled={currentSlideIndex === 0}
              className="absolute left-8 z-30 p-3 bg-white rounded-full shadow-lg hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition"
            >
              <ChevronLeft size={24} />
            </button>

            <button 
              onClick={() => setCurrentSlideIndex(Math.min(pages.length - 1, currentSlideIndex + 1))}
              disabled={currentSlideIndex === pages.length - 1}
              className="absolute right-8 z-30 p-3 bg-white rounded-full shadow-lg hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition"
            >
              <ChevronRight size={24} />
            </button>
          </>
        )}

        {/* The Visible Preview (Scaled) */}
        <div 
          className="shadow-2xl transition-transform duration-300 ease-out bg-white"
          style={{
            transform: `scale(${scale})`,
            transformOrigin: 'center center',
            width: 1242,
            height: 1660
          }}
        >
          {pages.length > 0 ? (
            <PreviewCanvas
              ref={previewRef}
              pageIndex={currentSlideIndex}
              title={content.title}
              bodyChunks={pages[currentSlideIndex]}
              profile={profile}
              dateStr={currentDate}
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-gray-300 gap-4">
              <ImageIcon size={100} strokeWidth={1} />
              <p className="text-4xl font-light">在此处预览生成效果</p>
            </div>
          )}
        </div>
      </div>

      {/* --- Hidden Render Layer (For Exporting All Pages) --- */}
      <div className="fixed top-0 left-0 pointer-events-none opacity-0" style={{ zIndex: -1 }}>
        {pages.map((pageChunks, idx) => (
          <div key={`hidden-${idx}`} className="mb-10">
            <PreviewCanvas
              ref={(el) => { hiddenRenderRefs.current[idx] = el; }}
              pageIndex={idx}
              title={content.title}
              bodyChunks={pageChunks}
              profile={profile}
              dateStr={currentDate}
            />
          </div>
        ))}
      </div>

      {/* --- Modals --- */}
      <ProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        currentProfile={profile}
        onSave={handleProfileSave}
      />
    </div>
  );
};

export default App;