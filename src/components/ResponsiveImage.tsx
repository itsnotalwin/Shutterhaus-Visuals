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

  return (
    <div className={wrapperClass}>
      {/* 1. Shimmer Skeleton Screen + Low-Res Blur-up Overlay */}
      <div 
        className={`absolute inset-0 w-full h-full z-10 transition-opacity duration-700 ease-out flex items-center justify-center bg-sand/10 dark:bg-surface-2/40 animate-shimmer ${
          isLoaded ? 'opacity-0 pointer-events-none' : 'opacity-100'
        }`}
      >
        {/* Low-res Blurred Image */}
        {lowResSrc && isInView && (
          <img
            src={lowResSrc}
            alt=""
            className="absolute inset-0 w-full h-full object-cover filter blur-lg scale-110 opacity-70 transition-all duration-300"
          />
        )}
        
        {/* Subtle, premium, low-opacity camera/aperture vector icon to represent photography loading */}
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
        className={`transition-all duration-[900ms] ease-out ${isLoaded ? 'opacity-100' : 'opacity-0'} ${className || ''}`}
        onLoad={(e) => {
          setIsLoaded(true);
          if (props.onLoad) props.onLoad(e);
        }}
        {...props}
      />
    </div>
  );
}


