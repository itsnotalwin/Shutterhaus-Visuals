import React, { useState, useRef, useEffect } from 'react';
import { Camera } from 'lucide-react';

interface ResponsiveImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt?: string;
  title?: string;
  className?: string;
  onLoad?: React.ReactEventHandler<HTMLImageElement>;
  onError?: React.ReactEventHandler<HTMLImageElement>;
}

export function ResponsiveImage({ src, alt, className, title, ...props }: ResponsiveImageProps) {
  const [isInView, setIsInView] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    if (imgRef.current?.complete && isInView) {
      setIsLoaded(true);
    }
  }, [isInView]);

  useEffect(() => {
    // Intersection Observer for prefetching/lazy loading
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      {
        rootMargin: '600px 0px', // Prefetch before it enters the viewport (background pre-loading logic)
        threshold: 0.01,
      }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    // Fallback: load anyway after a delay to ensure they are available in the background
    const idleTimer = setTimeout(() => {
      setIsInView(true);
    }, 2500);

    return () => {
      observer.disconnect();
      clearTimeout(idleTimer);
    };
  }, []);

  // Responsive srcSet logic
  const generateSrcSet = (url: string) => {
    if (url.includes('unsplash.com')) {
      const base = url.split('?')[0];
      return `${base}?w=400&q=80&auto=format 400w, 
              ${base}?w=800&q=80&auto=format 800w, 
              ${base}?w=1200&q=80&auto=format 1200w, 
              ${base}?w=1600&q=80&auto=format 1600w`;
    }
    // For Firebasestorage or other CDNs, if we had resizing extensions, we'd do it here.
    return `${url} 400w, ${url} 800w, ${url} 1200w, ${url} 1600w`;
  };

  // Construct a low-res URL for blur-up placeholder
  const getLowResUrl = (url: string) => {
    if (!url) return '';
    if (url.includes('unsplash.com')) {
      const base = url.split('?')[0];
      return `${base}?w=40&q=20&blur=5&auto=format`;
    }
    if (url.includes('drive.google.com')) {
      if (url.includes('&sz=')) {
        return url.replace(/&sz=w\d+/, '&sz=w40');
      }
      return `${url}&sz=w40`;
    }
    return '';
  };

  const srcSet = isInView ? generateSrcSet(src) : undefined;
  const sizes = isInView ? "(max-width: 640px) 400px, (max-width: 1024px) 800px, (max-width: 1536px) 1200px, 1600px" : undefined;
  const lowResSrc = getLowResUrl(src);

  const isAbsolute = className?.includes('absolute');
  const wrapperClass = `relative overflow-hidden ${isAbsolute ? 'absolute inset-0 w-full h-full' : 'w-full h-full'}`;

  // Custom inline luxury SVGs (represented as lightweight data URIs for instant render)
  const lightSvg = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 10 10' preserveAspectRatio='none'><defs><linearGradient id='g' x1='0%25' y1='0%25' x2='100%25' y2='100%25'><stop offset='0%25' stop-color='%23f4f1eb'/><stop offset='50%25' stop-color='%23ece9e0'/><stop offset='100%25' stop-color='%23dedad0'/></linearGradient></defs><rect width='100%25' height='100%25' fill='url(%23g)'/></svg>";
  const darkSvg = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 10 10' preserveAspectRatio='none'><defs><linearGradient id='g' x1='0%25' y1='0%25' x2='100%25' y2='100%25'><stop offset='0%25' stop-color='%232e2a27'/><stop offset='50%25' stop-color='%231c1917'/><stop offset='100%25' stop-color='%23110f0e'/></linearGradient></defs><rect width='100%25' height='100%25' fill='url(%23g)'/></svg>";

  return (
    <div className={wrapperClass}>
      {/* 1. Shimmer Skeleton Screen + Low-Res Blur-up Overlay */}
      <div 
        className={`absolute inset-0 w-full h-full z-10 transition-all duration-[800ms] ease-out flex items-center justify-center bg-sand/10 dark:bg-surface-2/40 ${
          isLoaded ? 'opacity-0 pointer-events-none scale-105' : 'opacity-100 scale-100'
        }`}
      >
        {/* Instant base64 blurred background gradient (light & dark mode matched) */}
        <div 
          style={{ backgroundImage: `url("${lightSvg}")` }}
          className="absolute inset-0 w-full h-full bg-cover bg-center filter blur-xl scale-110 dark:hidden"
        />
        <div 
          style={{ backgroundImage: `url("${darkSvg}")` }}
          className="absolute inset-0 w-full h-full bg-cover bg-center filter blur-xl scale-110 hidden dark:block"
        />

        {/* Dynamic Low-res asset Blurred Image (Unsplash / Google Drive) */}
        {lowResSrc && isInView && (
          <img
            src={lowResSrc}
            alt=""
            className="absolute inset-0 w-full h-full object-cover filter blur-md scale-110 opacity-85 transition-opacity duration-500"
          />
        )}

        {/* Ambient subtle shimmer overlay */}
        <div className="absolute inset-0 animate-shimmer opacity-45 dark:opacity-30" />
        
        {/* Subtle, premium, low-opacity camera/aperture vector icon representing active capture */}
        <Camera className="w-5 h-5 text-espresso/15 dark:text-alabaster/15 relative z-20 animate-pulse" />
      </div>

      {/* 2. Main High-Resolution Image */}
      <img
        ref={imgRef}
        src={isInView ? src : "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1 1'%3E%3C/svg%3E"}
        srcSet={srcSet}
        sizes={sizes}
        alt={alt || ''}
        title={title}
        className={`transition-all duration-[1000ms] ease-out ${
          isLoaded ? 'opacity-100 filter blur-0 scale-100' : 'opacity-0 filter blur-md scale-[1.02]'
        } ${className || ''}`}
        onLoad={(e) => {
          setIsLoaded(true);
          if (props.onLoad) props.onLoad(e);
        }}
        {...props}
      />
    </div>
  );
}


