import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  Mail, 
  MapPin, 
  Globe, 
  Instagram, 
  Download, 
  Copy, 
  Check, 
  Sparkles, 
  Share2, 
  RotateCw,
  ExternalLink
} from 'lucide-react';
import { ShutterhausLogo } from './ShutterhausLogo';
import alwinImg from '../assets/alwin.jpg';

interface DigitalBusinessCardProps {
  onClose: () => void;
}

export default function DigitalBusinessCard({ onClose }: DigitalBusinessCardProps) {
  const [isFlipped, setIsFlipped] = useState(false);
  const [copiedText, setCopiedText] = useState<string | null>(null);
  const [isSharing, setIsSharing] = useState(false);

  // Lock scroll when open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(label);
    setTimeout(() => setCopiedText(null), 2000);
  };

  const handleDownloadVCard = () => {
    const vcardText = `BEGIN:VCARD
VERSION:3.0
FN:Alwin (Shutterhaus Visuals)
ORG:Shutterhaus Visuals
TITLE:Studio Founder & Lead Photographer
EMAIL;TYPE=PREF,INTERNET:itsnotalwin@gmail.com
URL:https://shutterhausvisuals.mypixieset.com
ADR;TYPE=WORK,POSTAL,PARCEL:;;Kempton Park;Gauteng;;South Africa
NOTE:Fine-art and editorial photography studio. Established 2024.
END:VCARD`;

    const blob = new Blob([vcardText], { type: 'text/vcard;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'Alwin_Shutterhaus_Visuals.vcf');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleShare = async () => {
    const cardUrl = "https://itsnotalwin.github.io/Shutterhaus-Visuals/card";
    const shareData = {
      title: 'Shutterhaus Visuals - Alwin',
      text: 'Check out Shutterhaus Visuals, a premium fine-art and editorial photography studio in Kempton Park, South Africa.',
      url: cardUrl
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        console.log('Error sharing:', err);
      }
    } else {
      // Fallback: Copy URL to clipboard
      navigator.clipboard.writeText(cardUrl);
      setIsSharing(true);
      setTimeout(() => setIsSharing(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop overlay */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-cocoa/80 backdrop-blur-md cursor-zoom-out"
      />

      {/* Modal Container */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 w-full max-w-lg flex flex-col items-center"
      >
        {/* Header close button */}
        <button
          onClick={onClose}
          className="absolute -top-12 right-0 p-2 text-alabaster/60 hover:text-alabaster transition-colors duration-200 cursor-hover"
          title="Close Card"
        >
          <X className="w-5 h-5" />
        </button>

        {/* 3D Card Wrapper */}
        <div className="w-full relative h-[250px] sm:h-[280px] perspective-1000 group">
          <motion.div
            animate={{ rotateY: isFlipped ? 180 : 0 }}
            transition={{ duration: 0.6, ease: [0.25, 1, 0.5, 1] }}
            style={{ transformStyle: 'preserve-3d' }}
            className="w-full h-full relative cursor-pointer"
            onClick={() => setIsFlipped(!isFlipped)}
          >
            {/* FRONT SIDE (Minimal & Elegant) */}
            <div 
              style={{ backfaceVisibility: 'hidden' }}
              className="absolute inset-0 w-full h-full p-6 sm:p-8 rounded-2xl bg-gradient-to-br from-surface-2 to-cocoa border border-sand/20 flex flex-col justify-between shadow-2xl overflow-hidden"
            >
              {/* Decorative premium corner accents */}
              <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-sand/20 rounded-tl-2xl" />
              <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-sand/20 rounded-tr-2xl" />
              <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-sand/20 rounded-bl-2xl" />
              <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-sand/20 rounded-br-2xl" />

              {/* Shutterhaus background watermark pattern */}
              <div className="absolute -right-12 -bottom-12 opacity-5 pointer-events-none">
                <ShutterhausLogo variant="mark" iconSize={180} />
              </div>

              {/* Front Header */}
              <div className="flex justify-between items-start z-10">
                <div className="text-sand">
                  <ShutterhausLogo variant="horizontal" iconSize={20} />
                </div>
                <span className="text-[8px] font-mono tracking-widest text-[#9a9088] uppercase bg-sand/10 px-2 py-0.5 rounded border border-sand/10">
                  Est. 2024
                </span>
              </div>

              {/* Front Body */}
              <div className="z-10 my-auto flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
                {/* Elegant Profile Picture Frame */}
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full border-2 border-accent-dark/40 overflow-hidden shrink-0 bg-surface-1 shadow-2xl relative">
                  <img 
                    src={alwinImg} 
                    alt="Alwin Profile" 
                    className="w-full h-full object-cover filter grayscale contrast-[1.15] hover:grayscale-0 transition-all duration-500"
                    referrerPolicy="no-referrer"
                    onError={(e: any) => {
                      (e.target as HTMLImageElement).src =
                        "https://drive.google.com/thumbnail?id=1dGo1hDouUsBn3CLQsB5cz-Ji40wzxgAI&sz=w1000";
                    }}
                  />
                </div>
                <div>
                  <h3 className="font-serif italic text-2xl sm:text-3xl text-alabaster font-light tracking-wide flex items-center justify-center sm:justify-start gap-2">
                    Alwin
                    <Sparkles className="w-4 h-4 text-accent-dark animate-pulse" />
                  </h3>
                  <p className="text-[9px] sm:text-[10px] font-mono tracking-[0.25em] text-accent-dark uppercase mt-1">
                    Founder & Lead Photographer
                  </p>
                </div>
              </div>

              {/* Front Footer */}
              <div className="flex justify-between items-end z-10 text-[8px] sm:text-[9px] font-mono text-[#9a9088]">
                <div className="flex items-center gap-1">
                  <MapPin className="w-2.5 h-2.5 text-accent-dark" />
                  <span>Kempton Park, South Africa</span>
                </div>
                <span className="uppercase tracking-widest text-accent-dark hover:underline flex items-center gap-1">
                  Tap to flip <RotateCw className="w-2.5 h-2.5" />
                </span>
              </div>
            </div>

            {/* BACK SIDE (Detailed Contact) */}
            <div 
              style={{ 
                backfaceVisibility: 'hidden',
                transform: 'rotateY(180deg)'
              }}
              className="absolute inset-0 w-full h-full p-6 sm:p-8 rounded-2xl bg-gradient-to-br from-cocoa to-surface-2 border border-accent-dark/20 flex flex-col justify-between shadow-2xl overflow-hidden"
            >
              {/* Back Header */}
              <div className="flex justify-between items-center pb-3 border-b border-sand/10">
                <div className="flex items-center gap-2">
                  <ShutterhausLogo variant="mark" iconSize={22} className="text-accent-dark" />
                  <div>
                    <h4 className="font-serif italic text-sm text-alabaster leading-none">Shutterhaus</h4>
                    <span className="text-[8px] font-mono tracking-widest text-[#9a9088] uppercase">Visuals</span>
                  </div>
                </div>
                <span className="text-[8px] font-mono text-accent-dark bg-accent-dark/10 px-2 py-0.5 rounded uppercase tracking-widest">
                  Direct Contact
                </span>
              </div>

              {/* Back Content Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 my-auto text-alabaster text-left">
                {/* Email */}
                <div 
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCopy('itsnotalwin@gmail.com', 'email');
                  }}
                  className="flex items-center gap-2.5 p-2 rounded-lg bg-surface-1/40 hover:bg-surface-1/80 border border-sand/5 transition-all duration-200 group/item cursor-pointer"
                >
                  <div className="w-7 h-7 rounded-md bg-[#272421] flex items-center justify-center text-accent-dark shrink-0">
                    <Mail className="w-3.5 h-3.5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[7px] font-mono uppercase tracking-wider text-[#9a9088]">Email</p>
                    <p className="text-[10px] sm:text-xs truncate font-medium hover:text-accent-dark transition-colors">
                      itsnotalwin@gmail.com
                    </p>
                  </div>
                  <div className="opacity-0 group-hover/item:opacity-100 transition-opacity pr-1 text-accent-dark">
                    {copiedText === 'email' ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
                  </div>
                </div>

                {/* Website */}
                <a
                  href="https://shutterhausvisuals.mypixieset.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="flex items-center gap-2.5 p-2 rounded-lg bg-surface-1/40 hover:bg-surface-1/80 border border-sand/5 transition-all duration-200 group/item cursor-pointer"
                >
                  <div className="w-7 h-7 rounded-md bg-[#272421] flex items-center justify-center text-accent-dark shrink-0">
                    <Globe className="w-3.5 h-3.5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[7px] font-mono uppercase tracking-wider text-[#9a9088]">Website</p>
                    <p className="text-[10px] sm:text-xs truncate font-medium hover:text-accent-dark transition-colors flex items-center gap-0.5">
                      mypixieset.com <ExternalLink className="w-2 h-2 text-[#9a9088]" />
                    </p>
                  </div>
                </a>

                {/* Location */}
                <div 
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCopy('Kempton Park, Gauteng, South Africa', 'location');
                  }}
                  className="flex items-center gap-2.5 p-2 rounded-lg bg-surface-1/40 hover:bg-surface-1/80 border border-sand/5 transition-all duration-200 group/item cursor-pointer"
                >
                  <div className="w-7 h-7 rounded-md bg-[#272421] flex items-center justify-center text-accent-dark shrink-0">
                    <MapPin className="w-3.5 h-3.5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[7px] font-mono uppercase tracking-wider text-[#9a9088]">Location</p>
                    <p className="text-[10px] sm:text-xs truncate font-medium">
                      Kempton Park, South Africa
                    </p>
                  </div>
                  <div className="opacity-0 group-hover/item:opacity-100 transition-opacity pr-1 text-accent-dark">
                    {copiedText === 'location' ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
                  </div>
                </div>

                {/* Instagram */}
                <a
                  href="https://www.instagram.com/shutterhausvisuals/"
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="flex items-center gap-2.5 p-2 rounded-lg bg-surface-1/40 hover:bg-surface-1/80 border border-sand/5 transition-all duration-200 group/item cursor-pointer"
                >
                  <div className="w-7 h-7 rounded-md bg-[#272421] flex items-center justify-center text-accent-dark shrink-0">
                    <Instagram className="w-3.5 h-3.5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[7px] font-mono uppercase tracking-wider text-[#9a9088]">Instagram</p>
                    <p className="text-[10px] sm:text-xs truncate font-medium hover:text-accent-dark transition-colors flex items-center gap-0.5">
                      @shutterhausvisuals <ExternalLink className="w-2 h-2 text-[#9a9088]" />
                    </p>
                  </div>
                </a>
              </div>

              {/* Back Footer */}
              <div className="flex justify-between items-center text-[8px] font-mono text-[#9a9088] pt-2 border-t border-sand/10">
                <span>© 2026 Shutterhaus Visuals</span>
                <span className="uppercase tracking-widest text-accent-dark hover:underline flex items-center gap-1">
                  Tap to flip <RotateCw className="w-2.5 h-2.5" />
                </span>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Dynamic Status Notifications */}
        <AnimatePresence>
          {copiedText && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mt-4 px-3 py-1.5 bg-green-900/35 border border-green-700/50 text-green-400 text-[10px] font-mono uppercase tracking-wider rounded-lg flex items-center gap-1.5"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Copied {copiedText} to clipboard</span>
            </motion.div>
          )}

          {isSharing && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mt-4 px-3 py-1.5 bg-accent-dark/10 border border-accent-dark/30 text-accent-dark text-[10px] font-mono uppercase tracking-wider rounded-lg flex items-center gap-1.5"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Link copied for sharing!</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Action Triggers Grid */}
        <div className="grid grid-cols-2 gap-4 w-full mt-6 sm:mt-8">
          <button
            onClick={handleDownloadVCard}
            className="flex items-center justify-center gap-2 px-5 py-3.5 bg-accent-light dark:bg-accent-dark hover:bg-accent-light/90 dark:hover:bg-accent-dark/90 text-white dark:text-cocoa text-[10px] font-mono uppercase tracking-widest font-bold rounded-xl transition-all duration-300 shadow-lg cursor-hover"
          >
            <Download className="w-4 h-4 shrink-0" />
            <span>Save Contact</span>
          </button>

          <button
            onClick={handleShare}
            className="flex items-center justify-center gap-2 px-5 py-3.5 bg-surface-1 hover:bg-surface-2 text-alabaster text-[10px] font-mono uppercase tracking-widest font-bold rounded-xl border border-sand/10 transition-all duration-300 shadow-lg cursor-hover"
          >
            <Share2 className="w-4 h-4 shrink-0" />
            <span>Share Card</span>
          </button>
        </div>

        {/* Micro-tips instruction */}
        <p className="text-[9px] font-mono text-[#9a9088] uppercase tracking-wider text-center mt-4">
          Click the card above to rotate in 3D
        </p>
      </motion.div>
    </div>
  );
}
