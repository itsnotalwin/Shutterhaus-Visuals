import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
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
  ExternalLink,
  ArrowRight,
  Home,
  CheckCircle2,
  Phone
} from 'lucide-react';
import { ShutterhausLogo } from './components/ShutterhausLogo';
import alwinImg from './assets/alwin.jpg';

export default function StandaloneBusinessCard() {
  const [isFlipped, setIsFlipped] = useState(false);
  const [copiedText, setCopiedText] = useState<string | null>(null);
  const [isSharing, setIsSharing] = useState(false);
  const [activeTab, setActiveTab] = useState<'card' | 'info'>('card');

  // Trigger brief rotation reminder after loading
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsFlipped(true);
      setTimeout(() => setIsFlipped(false), 1200);
    }, 1500);
    return () => clearTimeout(timer);
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
TEL;TYPE=CELL,VOICE:+27730958363
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
      text: 'Connect with Alwin, Studio Founder & Lead Photographer of Shutterhaus Visuals.',
      url: cardUrl
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        console.log('Error sharing:', err);
      }
    } else {
      navigator.clipboard.writeText(cardUrl);
      setIsSharing(true);
      setTimeout(() => setIsSharing(false), 2000);
    }
  };

  return (
    <div className="min-h-screen bg-cocoa text-alabaster flex flex-col justify-between p-6 relative overflow-hidden font-sans select-text">
      {/* Decorative ambient background lights */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] aspect-square rounded-full bg-accent-light/5 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] aspect-square rounded-full bg-accent-dark/5 blur-[120px] pointer-events-none" />

      {/* Header Logo */}
      <header className="w-full max-w-md mx-auto flex justify-between items-center z-10 py-4 border-b border-sand/10">
        <a href="https://itsnotalwin.github.io/Shutterhaus-Visuals" className="text-sand/90 hover:text-alabaster transition-colors flex items-center gap-2 font-mono text-[10px] tracking-widest uppercase">
          <ShutterhausLogo variant="horizontal" iconSize={20} />
        </a>
        <a 
          href="https://itsnotalwin.github.io/Shutterhaus-Visuals" 
          className="text-[10px] font-mono tracking-widest text-[#9a9088] hover:text-alabaster transition-colors flex items-center gap-1 uppercase"
        >
          <Home className="w-3.5 h-3.5" />
          <span>Home</span>
        </a>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col items-center justify-center py-10 z-10 w-full max-w-md mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="w-full flex flex-col items-center"
        >
          {/* Quick tab filters for interactive view */}
          <div className="flex bg-[#1a1817]/60 border border-sand/10 p-1 rounded-full mb-8 text-[10px] font-mono uppercase tracking-widest">
            <button
              onClick={() => setActiveTab('card')}
              className={`px-4 py-1.5 rounded-full transition-all duration-300 ${
                activeTab === 'card' 
                  ? 'bg-accent-dark text-cocoa font-bold' 
                  : 'text-[#9a9088] hover:text-alabaster'
              }`}
            >
              Interactive Card
            </button>
            <button
              onClick={() => setActiveTab('info')}
              className={`px-4 py-1.5 rounded-full transition-all duration-300 ${
                activeTab === 'info' 
                  ? 'bg-accent-dark text-cocoa font-bold' 
                  : 'text-[#9a9088] hover:text-alabaster'
              }`}
            >
              Studio Profile
            </button>
          </div>

          <AnimatePresence mode="wait">
            {activeTab === 'card' ? (
              <motion.div
                key="card-view"
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.96 }}
                transition={{ duration: 0.4 }}
                className="w-full flex flex-col items-center"
              >
                {/* Card Wrapper (Fade Transition) */}
                <div className="w-full relative h-[310px] sm:h-[280px] group">
                  <AnimatePresence mode="wait">
                    {!isFlipped ? (
                      <motion.div
                        key="front"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.4 }}
                        className="absolute inset-0 w-full h-full cursor-pointer"
                        onClick={() => setIsFlipped(true)}
                      >
                        {/* FRONT SIDE */}
                        <div 
                          className="absolute inset-0 w-full h-full p-5 sm:p-8 rounded-2xl bg-gradient-to-br from-surface-2 to-cocoa border border-sand/20 flex flex-col justify-between shadow-2xl overflow-hidden"
                        >
                      {/* Decorative corner accents */}
                      <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-sand/20 rounded-tl-2xl" />
                      <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-sand/20 rounded-tr-2xl" />
                      <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-sand/20 rounded-bl-2xl" />
                      <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-sand/20 rounded-br-2xl" />

                      {/* Watermark Logo */}
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
                            src="https://drive.google.com/thumbnail?id=1dGo1hDouUsBn3CLQsB5cz-Ji40wzxgAI&sz=w400"
                            alt="Alwin Profile" 
                            fetchpriority="high"
                            className="w-full h-full object-cover filter grayscale contrast-[1.15] hover:grayscale-0 transition-all duration-500"
                            referrerPolicy="no-referrer"
                            onError={(e: any) => {
                              (e.target as HTMLImageElement).src = alwinImg;
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
                  </motion.div>
                ) : (
                  <motion.div
                    key="back"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.4 }}
                    className="absolute inset-0 w-full h-full cursor-pointer"
                    onClick={() => setIsFlipped(false)}
                  >
                    {/* BACK SIDE */}
                    <div 
                      className="absolute inset-0 w-full h-full p-4 sm:p-8 rounded-2xl bg-gradient-to-br from-cocoa to-surface-2 border border-accent-dark/20 flex flex-col justify-between shadow-2xl overflow-hidden"
                    >
                      {/* Back Header */}
                      <div className="flex justify-between items-center pb-2.5 border-b border-sand/10">
                        <div className="flex items-center gap-2">
                          <ShutterhausLogo variant="mark" iconSize={20} className="text-accent-dark" />
                          <div>
                            <h4 className="font-serif italic text-xs sm:text-sm text-alabaster leading-none">Shutterhaus</h4>
                            <span className="text-[7px] sm:text-[8px] font-mono tracking-widest text-[#9a9088] uppercase">Visuals</span>
                          </div>
                        </div>
                        <span className="text-[7px] sm:text-[8px] font-mono text-accent-dark bg-accent-dark/10 px-2 py-0.5 rounded uppercase tracking-widest">
                          Direct Contact
                        </span>
                      </div>

                      {/* Back Content Grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 sm:gap-3 my-auto text-alabaster text-left">
                        {/* Email */}
                        <div 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCopy('itsnotalwin@gmail.com', 'email');
                          }}
                          className="flex items-center gap-2 p-1.5 sm:p-2 rounded-lg bg-surface-1/40 hover:bg-surface-1/80 border border-sand/5 transition-all duration-200 group/item cursor-pointer"
                        >
                          <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-md bg-[#272421] flex items-center justify-center text-accent-dark shrink-0">
                            <Mail className="w-3 sm:w-3.5 h-3 sm:h-3.5" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-[6px] sm:text-[7px] font-mono uppercase tracking-wider text-[#9a9088]">Email</p>
                            <p className="text-[9px] sm:text-xs truncate font-medium hover:text-accent-dark transition-colors">
                              itsnotalwin@gmail.com
                            </p>
                          </div>
                          <div className="opacity-0 sm:group-hover/item:opacity-100 transition-opacity pr-1 text-accent-dark">
                            {copiedText === 'email' ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
                          </div>
                        </div>

                        {/* Phone */}
                        <div 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCopy('+27730958363', 'phone');
                          }}
                          className="flex items-center gap-2 p-1.5 sm:p-2 rounded-lg bg-surface-1/40 hover:bg-surface-1/80 border border-sand/5 transition-all duration-200 group/item cursor-pointer"
                        >
                          <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-md bg-[#272421] flex items-center justify-center text-accent-dark shrink-0">
                            <Phone className="w-3 sm:w-3.5 h-3 sm:h-3.5" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-[6px] sm:text-[7px] font-mono uppercase tracking-wider text-[#9a9088]">Phone</p>
                            <p className="text-[9px] sm:text-xs truncate font-medium hover:text-accent-dark transition-colors">
                              +27 73 095 8363
                            </p>
                          </div>
                          <div className="opacity-0 sm:group-hover/item:opacity-100 transition-opacity pr-1 text-accent-dark">
                            {copiedText === 'phone' ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
                          </div>
                        </div>

                        {/* Website */}
                        <a
                          href="https://shutterhausvisuals.mypixieset.com/"
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="flex items-center gap-2 p-1.5 sm:p-2 rounded-lg bg-surface-1/40 hover:bg-surface-1/80 border border-sand/5 transition-all duration-200 group/item cursor-pointer"
                        >
                          <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-md bg-[#272421] flex items-center justify-center text-accent-dark shrink-0">
                            <Globe className="w-3 sm:w-3.5 h-3 sm:h-3.5" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-[6px] sm:text-[7px] font-mono uppercase tracking-wider text-[#9a9088]">Website</p>
                            <p className="text-[9px] sm:text-xs truncate font-medium hover:text-accent-dark transition-colors flex items-center gap-0.5">
                              mypixieset.com <ExternalLink className="w-1.5 sm:w-2 h-1.5 sm:h-2 text-[#9a9088]" />
                            </p>
                          </div>
                        </a>

                        {/* Instagram */}
                        <a
                          href="https://www.instagram.com/shutterhausvisuals/"
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="flex items-center gap-2 p-1.5 sm:p-2 rounded-lg bg-surface-1/40 hover:bg-surface-1/80 border border-sand/5 transition-all duration-200 group/item cursor-pointer"
                        >
                          <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-md bg-[#272421] flex items-center justify-center text-accent-dark shrink-0">
                            <Instagram className="w-3 sm:w-3.5 h-3 sm:h-3.5" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-[6px] sm:text-[7px] font-mono uppercase tracking-wider text-[#9a9088]">Instagram</p>
                            <p className="text-[9px] sm:text-xs truncate font-medium hover:text-accent-dark transition-colors flex items-center gap-0.5">
                              @shutterhausvisuals <ExternalLink className="w-1.5 sm:w-2 h-1.5 sm:h-2 text-[#9a9088]" />
                            </p>
                          </div>
                        </a>

                        {/* Location */}
                        <div 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCopy('Kempton Park, Gauteng, South Africa', 'location');
                          }}
                          className="flex items-center gap-2 p-1.5 sm:p-2 rounded-lg bg-surface-1/40 hover:bg-surface-1/80 border border-sand/5 transition-all duration-200 group/item cursor-pointer sm:col-span-2"
                        >
                          <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-md bg-[#272421] flex items-center justify-center text-accent-dark shrink-0">
                            <MapPin className="w-3 sm:w-3.5 h-3 sm:h-3.5" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-[6px] sm:text-[7px] font-mono uppercase tracking-wider text-[#9a9088]">Location</p>
                            <p className="text-[9px] sm:text-xs truncate font-medium">
                              Kempton Park, South Africa
                            </p>
                          </div>
                          <div className="opacity-0 sm:group-hover/item:opacity-100 transition-opacity pr-1 text-accent-dark">
                            {copiedText === 'location' ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
                          </div>
                        </div>
                      </div>

                      {/* Back Footer */}
                      <div className="flex justify-between items-center text-[7px] sm:text-[8px] font-mono text-[#9a9088] pt-2 border-t border-sand/10">
                        <span>© 2026 Shutterhaus Visuals</span>
                        <span className="uppercase tracking-widest text-accent-dark hover:underline flex items-center gap-1">
                          Tap to flip <RotateCw className="w-2.5 h-2.5" />
                        </span>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
                <p className="text-[9px] font-mono text-[#9a9088] uppercase tracking-wider text-center mt-4">
                  Tap the card above to flip
                </p>
              </motion.div>
            ) : (
              <motion.div
                key="info-view"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.4 }}
                className="w-full bg-surface-2 p-6 rounded-2xl border border-sand/10 space-y-6"
              >
                <div className="space-y-2">
                  <span className="text-[8px] font-mono text-accent-dark uppercase tracking-widest block">Est. 2024</span>
                  <h3 className="font-serif text-xl italic font-light text-alabaster">Fine-Art and Editorial Photography Studio</h3>
                  <p className="text-xs text-[#9a9088] leading-relaxed font-light">
                    Shutterhaus Visuals is dedicated to archival studies in light, contrast, and raw human connection. We specialize in intimate portraiture, premium editorial campaigns, elegant boudoir, and curated milestone events.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-2 border-t border-sand/10">
                  <div className="space-y-1">
                    <span className="text-[7px] font-mono uppercase tracking-widest text-[#9a9088] block">Location</span>
                    <span className="text-xs font-semibold block text-sand">Kempton Park, South Africa</span>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[7px] font-mono uppercase tracking-widest text-[#9a9088] block">Obsession</span>
                    <span className="text-xs font-semibold block text-sand">Perfect natural light</span>
                  </div>
                </div>

                <div className="space-y-3 pt-4 border-t border-sand/10">
                  <span className="text-[8px] font-mono text-[#9a9088] uppercase tracking-widest block">Core Deliverables</span>
                  <ul className="text-xs text-[#9a9088] space-y-2">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-accent-dark shrink-0" />
                      <span>Curated high-contrast fine art gallery outputs</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-accent-dark shrink-0" />
                      <span>Dedicated bespoke editorial consultation</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-accent-dark shrink-0" />
                      <span>Archival digital preservation archives</span>
                    </li>
                  </ul>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Toast / Copy Alerts */}
          <div className="h-10 mt-2 flex items-center justify-center">
            <AnimatePresence>
              {copiedText && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="px-3 py-1.5 bg-green-900/30 border border-green-700/40 text-green-400 text-[10px] font-mono uppercase tracking-wider rounded-lg flex items-center gap-1.5 shadow-lg"
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
                  className="px-3 py-1.5 bg-accent-dark/10 border border-accent-dark/30 text-accent-dark text-[10px] font-mono uppercase tracking-wider rounded-lg flex items-center gap-1.5 shadow-lg"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Card page link copied!</span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Action triggers */}
          <div className="grid grid-cols-2 gap-4 w-full mt-2">
            <button
              onClick={handleDownloadVCard}
              className="flex items-center justify-center gap-2 px-5 py-3.5 bg-accent-light hover:bg-accent-light/90 text-white text-[10px] font-mono uppercase tracking-widest font-bold rounded-xl transition-all duration-300 shadow-lg cursor-hover"
            >
              <Download className="w-4 h-4 shrink-0" />
              <span>Save Contact</span>
            </button>

            <button
              onClick={handleShare}
              className="flex items-center justify-center gap-2 px-5 py-3.5 bg-[#1a1817] hover:bg-[#242120] text-alabaster text-[10px] font-mono uppercase tracking-widest font-bold rounded-xl border border-sand/10 transition-all duration-300 shadow-lg cursor-hover"
            >
              <Share2 className="w-4 h-4 shrink-0" />
              <span>Share Card</span>
            </button>
          </div>

          {/* Return button */}
          <a
            href="https://itsnotalwin.github.io/Shutterhaus-Visuals"
            className="w-full mt-6 flex items-center justify-center gap-2 px-5 py-3.5 bg-transparent border border-sand/20 hover:border-sand/40 text-alabaster text-[10px] font-mono uppercase tracking-widest font-bold rounded-xl transition-all duration-300 cursor-hover group"
          >
            <span>View Full Portfolio Website</span>
            <ArrowRight className="w-3.5 h-3.5 text-accent-dark group-hover:translate-x-1 transition-transform" />
          </a>
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="w-full max-w-md mx-auto text-center py-4 border-t border-sand/10 mt-8 z-10">
        <p className="text-[8px] font-mono text-[#9a9088] uppercase tracking-widest">
          Designed with artistic intent &bull; Shutterhaus Visuals &copy; 2026
        </p>
      </footer>
    </div>
  );
}
