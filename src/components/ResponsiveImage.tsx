import React from 'react';

interface ResponsiveImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt?: string;
  title?: string;
  className?: string;
  priority?: boolean;
  onLoad?: React.ReactEventHandler<HTMLImageElement>;
  onError?: React.ReactEventHandler<HTMLImageElement>;
}

export function ResponsiveImage({ src, alt, className, title, priority = true, ...props }: ResponsiveImageProps) {
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

  const srcSet = generateSrcSet(src);
  const sizes = "(max-width: 640px) 400px, (max-width: 1024px) 800px, (max-width: 1536px) 1200px, 1600px";

  return (
    <img
      src={src}
      srcSet={srcSet}
      sizes={sizes}
      alt={alt || ''}
      title={title}
      loading="eager"
      decoding="sync"
      fetchPriority="high"
      className={className || ''}
      {...props}
    />
  );
}



