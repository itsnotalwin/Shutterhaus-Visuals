import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ArrowLeft, ArrowRight, Camera, Maximize, Eye, HelpCircle } from 'lucide-react';
import { PortfolioItem } from '../types';

interface LightboxProps {
  item: PortfolioItem | null;
  onClose: () => void;
  onNext: () => void;
  onPrev: () => void;
}

export default function Lightbox({ item, onClose, onNext, onPrev }: LightboxProps) {
  const [isZoomed, setIsZoomed] = useState(false);
  const [showMeta, setShowMeta] = useState(true);

  // Keyboard controls
  useEffect(() => {
    if (!item) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') {
        setIsZoomed(false);
        onNext();
      }
      if (e.key === 'ArrowLeft') {
        setIsZoomed(false);
        onPrev();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    // Lock background scroll
    document.body.style.overflow = 'hidden';

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [item, onClose, onNext, onPrev]);

  if (!item) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex flex-col md:flex-row bg-[#121110] text-[#fcfaf7] overflow-hidden select-none"
      >
        {/* Left Side: Main image viewport */}
        <div className="relative flex-1 flex items-center justify-center bg-black/90 p-4 md:p-8 overflow-hidden h-[60vh] md:h-full">
          {/* Top Controls */}
          <div className="absolute top-4 left-4 right-4 z-20 flex justify-between items-center">
            <span className="text-xs tracking-widest text-[#fcfaf7]/50 uppercase font-mono">
              {item.category} — {item.year}
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsZoomed(!isZoomed)}
                className="p-2 bg-[#242120]/60 hover:bg-[#242120] text-[#fcfaf7] rounded-full transition-colors duration-200"
                title="Toggle Zoom"
              >
                <Maximize className="w-4 h-4" />
              </button>
              <button
                onClick={() => setShowMeta(!showMeta)}
                className={`p-2 rounded-full transition-colors duration-200 md:hidden ${
                  showMeta ? 'bg-[#242120] text-[#fcfaf7]' : 'bg-[#242120]/60 text-[#fcfaf7]/50'
                }`}
                title="Toggle Info"
              >
                <HelpCircle className="w-4 h-4" />
              </button>
              <button
                onClick={onClose}
                className="p-2 bg-[#242120]/60 hover:bg-[#242120] text-[#fcfaf7] rounded-full transition-colors duration-200"
                title="Close Lightbox"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Image Container */}
          <div 
            className="w-full h-full flex items-center justify-center overflow-auto"
            onClick={() => setIsZoomed(!isZoomed)}
          >
            <motion.img
              key={item.id}
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              src={item.imageUrl}
              alt={item.title}
              referrerPolicy="no-referrer"
              className={`max-w-full max-h-full object-contain cursor-zoom-in transition-transform duration-300 ${
                isZoomed ? 'scale-150 cursor-zoom-out' : ''
              }`}
            />
          </div>

          {/* Left/Right Arrow Navigation Overlays */}
          <div className="absolute inset-y-0 left-0 w-1/6 flex items-center justify-start pl-4 md:pl-8 opacity-0 hover:opacity-100 transition-opacity duration-200 pointer-events-none">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsZoomed(false);
                onPrev();
              }}
              className="p-4 bg-[#121110]/80 border border-[#332d29] text-[#fcfaf7] rounded-full pointer-events-auto hover:bg-[#242120] transition-colors"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
          </div>
          <div className="absolute inset-y-0 right-0 w-1/6 flex items-center justify-end pr-4 md:pr-8 opacity-0 hover:opacity-100 transition-opacity duration-200 pointer-events-none">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsZoomed(false);
                onNext();
              }}
              className="p-4 bg-[#121110]/80 border border-[#332d29] text-[#fcfaf7] rounded-full pointer-events-auto hover:bg-[#242120] transition-colors"
            >
              <ArrowRight className="w-6 h-6" />
            </button>
          </div>

          {/* Bottom Swipe hint for Mobile */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-4 md:hidden">
            <button
              onClick={(e) => { e.stopPropagation(); onPrev(); }}
              className="p-2 bg-[#121110]/90 rounded-full border border-[#332d29]"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <span className="text-[10px] tracking-wider uppercase font-mono bg-black/60 px-3 py-1 rounded-full">
              Navigate
            </span>
            <button
              onClick={(e) => { e.stopPropagation(); onNext(); }}
              className="p-2 bg-[#121110]/90 rounded-full border border-[#332d29]"
            >
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Right Side: Metadata / Photographic Specs */}
        {showMeta && (
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 180 }}
            className="w-full md:w-[400px] bg-[#1a1817] border-t md:border-t-0 md:border-l border-[#332d29] p-6 md:p-10 flex flex-col justify-between overflow-y-auto h-[40vh] md:h-full shrink-0"
          >
            {/* Title & Description */}
            <div className="space-y-6">
              <div>
                <span className="text-[10px] tracking-widest text-[#fcfaf7]/40 uppercase font-mono block mb-1">
                  Title / Edition
                </span>
                <h3 className="text-xl md:text-2xl font-light tracking-tight text-[#fcfaf7]">
                  {item.title}
                </h3>
              </div>

              <div>
                <span className="text-[10px] tracking-widest text-[#fcfaf7]/40 uppercase font-mono block mb-1">
                  Context / Description
                </span>
                <p className="text-xs leading-relaxed text-[#fcfaf7]/70 font-light">
                  {item.description}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4 border-y border-[#332d29] py-4">
                <div>
                  <span className="text-[10px] tracking-widest text-[#fcfaf7]/40 uppercase font-mono block">
                    Location
                  </span>
                  <span className="text-xs font-light text-[#fcfaf7]/85 block mt-1">
                    {item.location}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] tracking-widest text-[#fcfaf7]/40 uppercase font-mono block">
                    Year
                  </span>
                  <span className="text-xs font-light text-[#fcfaf7]/85 block mt-1">
                    {item.year}
                  </span>
                </div>
              </div>
            </div>

            {/* Photographic EXIF Data Card */}
            <div className="mt-8 bg-[#242120]/30 border border-[#332d29] rounded p-5">
              <div className="flex items-center gap-2 text-[10px] font-mono tracking-widest text-[#fcfaf7]/50 uppercase mb-5 border-b border-[#332d29]/50 pb-3">
                <Camera className="w-3.5 h-3.5" />
                <span>EXIF Data</span>
              </div>

              <div className="grid grid-cols-3 gap-2 mb-5">
                <div className="flex flex-col items-center justify-center p-2 bg-[#1a1817]/80 rounded border border-[#332d29]/40">
                  <span className="text-[9px] tracking-widest text-[#fcfaf7]/40 uppercase font-mono mb-1">Aperture</span>
                  <span className="text-sm font-medium text-[#fcfaf7]/90">{item.cameraSettings.aperture}</span>
                </div>
                <div className="flex flex-col items-center justify-center p-2 bg-[#1a1817]/80 rounded border border-[#332d29]/40">
                  <span className="text-[9px] tracking-widest text-[#fcfaf7]/40 uppercase font-mono mb-1">Shutter</span>
                  <span className="text-sm font-medium text-[#fcfaf7]/90">{item.cameraSettings.shutterSpeed}</span>
                </div>
                <div className="flex flex-col items-center justify-center p-2 bg-[#1a1817]/80 rounded border border-[#332d29]/40">
                  <span className="text-[9px] tracking-widest text-[#fcfaf7]/40 uppercase font-mono mb-1">ISO</span>
                  <span className="text-sm font-medium text-[#fcfaf7]/90">{item.cameraSettings.iso}</span>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center bg-[#1a1817]/80 p-2.5 rounded border border-[#332d29]/40">
                  <span className="text-[9px] tracking-widest text-[#fcfaf7]/40 uppercase font-mono">Body</span>
                  <span className="text-xs font-medium text-[#fcfaf7]/90">{item.cameraSettings.camera}</span>
                </div>
                <div className="flex justify-between items-center bg-[#1a1817]/80 p-2.5 rounded border border-[#332d29]/40">
                  <span className="text-[9px] tracking-widest text-[#fcfaf7]/40 uppercase font-mono">Lens</span>
                  <span className="text-xs font-medium text-[#fcfaf7]/90">{item.cameraSettings.lens}</span>
                </div>
                <div className="flex justify-between items-center bg-[#1a1817]/80 p-2.5 rounded border border-[#332d29]/40">
                  <span className="text-[9px] tracking-widest text-[#fcfaf7]/40 uppercase font-mono">Print Medium</span>
                  <span className="text-xs font-medium text-[#fcfaf7]/80">{item.dimensions}</span>
                </div>
              </div>
            </div>

            {/* Footer advice */}
            <div className="mt-8 pt-4 border-t border-[#332d29] text-[9px] text-[#fcfaf7]/30 text-center font-mono uppercase tracking-widest">
              SHUTTERHAUS ARCHIVE SYSTEM // VOL. ZA
            </div>
          </motion.div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
