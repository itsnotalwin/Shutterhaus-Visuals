import React, { useState, useRef, useEffect } from 'react';

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
    // For local assets (no dynamic resize), we just map the same source to different widths to satisfy the structure
    return `${url} 400w, ${url} 800w, ${url} 1200w, ${url} 1600w`;
  };

  const srcSet = isInView ? generateSrcSet(src) : undefined;
  const sizes = isInView ? "(max-width: 640px) 400px, (max-width: 1024px) 800px, (max-width: 1536px) 1200px, 1600px" : undefined;

  return (
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
  );
}

