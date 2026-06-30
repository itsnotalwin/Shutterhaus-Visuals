import { useState, useRef, DragEvent, ChangeEvent, FormEvent } from 'react';
import { Upload, X, Check, Eye, AlertCircle, Sparkles } from 'lucide-react';
import { PortfolioItem, Category } from '../types';

interface ImageUploaderProps {
  onAddPhoto: (photo: PortfolioItem) => void;
  onClose: () => void;
}

export default function ImageUploader({ onAddPhoto, onClose }: ImageUploaderProps) {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<Exclude<Category, 'all'>>('portrait');
  const [location, setLocation] = useState('');
  const [year, setYear] = useState('2026');
  const [description, setDescription] = useState('');
  
  // Camera Settings
  const [camera, setCamera] = useState('Leica M11');
  const [lens, setLens] = useState('50mm f/1.4 Summilux');
  const [aperture, setAperture] = useState('f/1.4');
  const [shutterSpeed, setShutterSpeed] = useState('1/250s');
  const [iso, setIso] = useState('64');
  const [dimensions, setDimensions] = useState('24" x 36" Fine Art Print');
  
  // Image URL state
  const [imageUrl, setImageUrl] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle Drag & Drop
  const handleDrag = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      processFile(file);
    }
  };

  // Process selected file
  const processFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file (PNG, JPG, WEBP).');
      return;
    }

    setError(null);
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
    setImageUrl(objectUrl);
  };

  // Handle manual file selection
  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  // Handle image URL input manually
  const handleUrlChange = (url: string) => {
    setImageUrl(url);
    setPreviewUrl(url);
  };

  // Submit
  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!imageUrl) {
      setError('Please provide an image by uploading a file or entering a URL.');
      return;
    }
    if (!title.trim()) {
      setError('A title is required for your photography piece.');
      return;
    }

    const newItem: PortfolioItem = {
      id: `custom-${Date.now()}`,
      title: title.trim(),
      category,
      year: year || '2026',
      location: location.trim() || 'Custom Location',
      imageUrl,
      description: description.trim() || 'A custom photographic addition to the Shutterhaus gallery.',
      dimensions: dimensions || 'Archival Print',
      cameraSettings: {
        camera: camera || 'Unknown Camera',
        lens: lens || 'Unknown Lens',
        aperture: aperture || 'f/2.8',
        shutterSpeed: shutterSpeed || '1/125s',
        iso: iso || '100'
      }
    };

    onAddPhoto(newItem);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#121110]/80 backdrop-blur-sm animate-fade-in">
      <div 
        className="w-full max-w-2xl bg-oatmeal dark:bg-surface-1 border border-sand dark:border-dark-border text-espresso dark:text-alabaster rounded-none overflow-hidden max-h-[90vh] flex flex-col shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-4 border-b border-sand dark:border-dark-border bg-oatmeal/50 dark:bg-surface-1/50">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-espresso dark:text-alabaster" />
            <h3 className="text-sm font-medium tracking-widest uppercase font-mono">
              Insert Custom Photograph
            </h3>
          </div>
          <button 
            onClick={onClose}
            className="p-1 hover:opacity-70 transition-opacity"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {error && (
            <div className="flex items-start gap-2 bg-red-500/10 border border-red-500/30 p-3 text-xs text-red-600 dark:text-red-400">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Image source section: Upload or URL */}
          <div className="space-y-3">
            <span className="text-[10px] tracking-widest uppercase font-mono text-espresso/60 dark:text-alabaster/40 block">
              01 // Visual Asset Source
            </span>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Drag & Drop Area */}
              <div
                onDragEnter={handleDrag}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border border-dashed p-6 text-center cursor-pointer transition-all flex flex-col items-center justify-center min-h-[140px] ${
                  dragActive 
                    ? 'border-espresso dark:border-alabaster bg-sand/30 dark:bg-surface-2/30' 
                    : 'border-sand dark:border-dark-border hover:bg-sand/10 dark:hover:bg-surface-2/10'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <Upload className="w-6 h-6 mb-2 text-espresso/50 dark:text-alabaster/50" />
                <p className="text-[11px] font-mono leading-relaxed">
                  Drag & drop image file or <span className="underline font-bold">browse</span>
                </p>
                <p className="text-[9px] text-espresso/40 dark:text-alabaster/40 mt-1 uppercase">
                  PNG, JPG, WEBP up to 5MB
                </p>
              </div>

              {/* Preview or URL Input */}
              <div className="border border-sand dark:border-dark-border p-4 flex flex-col justify-between min-h-[140px]">
                {previewUrl ? (
                  <div className="relative w-full h-24 bg-black/5 dark:bg-black/20 flex items-center justify-center overflow-hidden border border-sand/50 dark:border-dark-border/50">
                    <img 
                      src={previewUrl} 
                      alt="Preview" 
                      className="max-h-full max-w-full object-contain"
                      referrerPolicy="no-referrer"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setPreviewUrl(null);
                        setImageUrl('');
                      }}
                      className="absolute top-1 right-1 p-1 bg-black/60 hover:bg-black text-white rounded-full transition-colors"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2 h-full flex flex-col justify-center">
                    <label className="text-[9px] tracking-wider uppercase font-mono text-espresso/50 dark:text-alabaster/40">
                      Or paste dynamic image URL
                    </label>
                    <input
                      type="url"
                      value={imageUrl}
                      onChange={(e) => handleUrlChange(e.target.value)}
                      placeholder="https://images.unsplash.com/photo-..."
                      className="w-full bg-transparent border-b border-sand dark:border-dark-border focus:border-espresso dark:focus:border-alabaster outline-none py-1.5 text-xs font-mono"
                    />
                  </div>
                )}
                
                <div className="text-[9px] text-espresso/40 dark:text-alabaster/40 uppercase font-mono mt-2">
                  Status: {previewUrl ? 'Asset Loaded ✓' : 'Awaiting Asset...'}
                </div>
              </div>
            </div>
          </div>

          {/* Details Section */}
          <div className="space-y-4">
            <span className="text-[10px] tracking-widest uppercase font-mono text-espresso/60 dark:text-alabaster/40 block">
              02 // Artwork specifications
            </span>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-[9px] tracking-wider uppercase font-mono text-espresso/50 dark:text-alabaster/40">
                  Artwork Title *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Shadow Play I"
                  className="bg-transparent border-b border-sand dark:border-dark-border focus:border-espresso dark:focus:border-alabaster outline-none py-1.5 text-xs"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[9px] tracking-wider uppercase font-mono text-espresso/50 dark:text-alabaster/40">
                  Curated Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as Exclude<Category, 'all'>)}
                  className="bg-transparent border-b border-sand dark:border-dark-border focus:border-espresso dark:focus:border-alabaster outline-none py-1.5 text-xs cursor-pointer font-mono text-espresso dark:text-alabaster [&>option]:bg-oatmeal [&>option]:dark:bg-surface-1 [&>option]:text-espresso [&>option]:dark:text-alabaster"
                >
                  <option value="portrait">Portrait</option>
                  <option value="editorial">Editorial / Fashion</option>
                  <option value="commercial">Commercial / Product</option>
                  <option value="architecture">Architectural / Space</option>
                  <option value="fine-art">Fine Art / Minimalist</option>
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[9px] tracking-wider uppercase font-mono text-espresso/50 dark:text-alabaster/40">
                  Location / Region
                </label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g. Cape Town, South Africa"
                  className="bg-transparent border-b border-sand dark:border-dark-border focus:border-espresso dark:focus:border-alabaster outline-none py-1.5 text-xs"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[9px] tracking-wider uppercase font-mono text-espresso/50 dark:text-alabaster/40">
                  Production Year
                </label>
                <input
                  type="text"
                  value={year}
                  onChange={(e) => setYear(e.target.value)}
                  placeholder="e.g. 2026"
                  className="bg-transparent border-b border-sand dark:border-dark-border focus:border-espresso dark:focus:border-alabaster outline-none py-1.5 text-xs font-mono"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[9px] tracking-wider uppercase font-mono text-espresso/50 dark:text-alabaster/40">
                Brief Context / Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe the mood, intent, or background of the shot..."
                className="bg-transparent border border-sand dark:border-dark-border focus:border-espresso dark:focus:border-alabaster outline-none p-2 text-xs h-16 resize-none"
              />
            </div>
          </div>

          {/* EXIF Data Section */}
          <div className="space-y-4 pt-2">
            <span className="text-[10px] tracking-widest uppercase font-mono text-espresso/60 dark:text-alabaster/40 block border-t border-sand dark:border-dark-border/40 pt-4">
              03 // EXIF photographic specifications
            </span>

            <div className="grid grid-cols-2 md:grid-cols-5 gap-3 font-mono">
              <div className="flex flex-col gap-1">
                <label className="text-[8px] uppercase text-espresso/50 dark:text-alabaster/40">Camera</label>
                <input
                  type="text"
                  value={camera}
                  onChange={(e) => setCamera(e.target.value)}
                  placeholder="Leica M11"
                  className="bg-transparent border-b border-sand dark:border-dark-border focus:border-espresso dark:focus:border-alabaster outline-none py-1 text-[11px]"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[8px] uppercase text-espresso/50 dark:text-alabaster/40">Lens</label>
                <input
                  type="text"
                  value={lens}
                  onChange={(e) => setLens(e.target.value)}
                  placeholder="50mm f/1.4"
                  className="bg-transparent border-b border-sand dark:border-dark-border focus:border-espresso dark:focus:border-alabaster outline-none py-1 text-[11px]"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[8px] uppercase text-espresso/50 dark:text-alabaster/40">Aperture</label>
                <input
                  type="text"
                  value={aperture}
                  onChange={(e) => setAperture(e.target.value)}
                  placeholder="f/1.4"
                  className="bg-transparent border-b border-sand dark:border-dark-border focus:border-espresso dark:focus:border-alabaster outline-none py-1 text-[11px]"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[8px] uppercase text-espresso/50 dark:text-alabaster/40">Shutter</label>
                <input
                  type="text"
                  value={shutterSpeed}
                  onChange={(e) => setShutterSpeed(e.target.value)}
                  placeholder="1/250s"
                  className="bg-transparent border-b border-sand dark:border-dark-border focus:border-espresso dark:focus:border-alabaster outline-none py-1 text-[11px]"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[8px] uppercase text-espresso/50 dark:text-alabaster/40">ISO</label>
                <input
                  type="text"
                  value={iso}
                  onChange={(e) => setIso(e.target.value)}
                  placeholder="64"
                  className="bg-transparent border-b border-sand dark:border-dark-border focus:border-espresso dark:focus:border-alabaster outline-none py-1 text-[11px]"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[9px] tracking-wider uppercase font-mono text-espresso/50 dark:text-alabaster/40">
                Print / Medium Dimension
              </label>
              <input
                type="text"
                value={dimensions}
                onChange={(e) => setDimensions(e.target.value)}
                placeholder="e.g. 24&quot; x 36&quot; Archival Fine Art Print"
                className="bg-transparent border-b border-sand dark:border-dark-border focus:border-espresso dark:focus:border-alabaster outline-none py-1 text-xs"
              />
            </div>
          </div>
        </form>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-sand dark:border-dark-border bg-oatmeal/50 dark:bg-surface-1/50 flex justify-between items-center gap-4">
          <p className="text-[9px] text-espresso/40 dark:text-alabaster/40 uppercase font-mono max-w-[280px] leading-snug">
            * Custom additions are saved in local cache and prepended to your current visual grid.
          </p>
          <div className="flex gap-3 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-mono uppercase tracking-widest hover:opacity-70 transition-opacity border border-sand dark:border-dark-border bg-transparent"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              className="px-5 py-2 text-xs font-mono uppercase tracking-widest font-bold bg-espresso dark:bg-alabaster text-oatmeal dark:text-cocoa hover:opacity-90 transition-opacity border border-espresso dark:border-alabaster flex items-center gap-1.5"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Insert Photo</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
