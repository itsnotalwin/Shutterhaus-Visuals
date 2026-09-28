import React from 'react';
import manifest from '../assets/images/variants/manifest.json';

interface ResponsiveImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt?: string;
  title?: string;
  className?: string;
  /**
   * Only the above-the-fold hero should be eager/high-priority. Everything
   * else must lazy-load, otherwise the browser pulls the whole portfolio
   * before the first paint.
   */
  priority?: boolean;
  onLoad?: React.ReactEventHandler<HTMLImageElement>;
  onError?: React.ReactEventHandler<HTMLImageElement>;
}

type Manifest = Record<
  string,
  { widths: Record<string, string>; srcWidth: number; srcHeight: number }
>;

const VARIANTS = manifest as Manifest;

// Vite-resolved URLs for every generated WebP variant, keyed by absolute path.
// A srcSet is resolved against the DOCUMENT url, not against `src`, so a
// relative "variants/foo-400w.webp" would 404 once Vite moved assets into
// /assets/. Going through import.meta.glob makes Vite emit the hashed,
// correctly-rooted URL.
//
// No `query: '?url'` here: that form resolves to a Promise in this Vite
// version, which made variantUrl() return Promise<unknown>.
const VARIANT_URLS = import.meta.glob('/src/assets/images/variants/*.webp', {
  eager: true,
  import: 'default',
}) as Record<string, string>;

function variantUrl(relPath: string): string | undefined {
  const abs = `/src/assets/images/${relPath}`;
  return VARIANT_URLS[abs];
}

/**
 * Map a Vite-resolved asset URL back to its manifest key.
 * data.ts imports images as modules, so at runtime we only have the final URL
 * (e.g. /assets/golden_hour_embrace_1782310479605-HASH.jpg). The base filename
 * is stable across builds; only the hash changes.
 */
function findVariantKey(url: string): string | null {
  if (!url) return null;
  const clean = url.split('?')[0].split('/').pop() || '';
  const stem = clean.replace(/-[A-Za-z0-9_-]{8,}\.[a-z0-9]+$/i, ''); // strip vite hash
  const match = Object.keys(VARIANTS).find(
    (key) => key === clean || key.replace(/\.[a-z0-9]+$/i, '') === stem,
  );
  return match || null;
}

export function ResponsiveImage({
  src,
  alt,
  className,
  title,
  priority = false,
  ...props
}: ResponsiveImageProps) {
  const key = findVariantKey(src);
  const entry = key ? VARIANTS[key] : null;

  // Build a REAL srcSet from actual resized files. The previous version
  // declared 400w/800w/1200w/1600w but pointed every entry at the same ~1MB
  // JPEG, so the browser downloaded the full file regardless of screen size.
  let srcSet: string | undefined;
  if (entry) {
    srcSet = Object.entries(entry.widths)
      .map(([w, path]) => {
        const url = variantUrl(path);
        return url ? `${url} ${w}w` : null;
      })
      .filter(Boolean)
      .join(', ') || undefined;
  } else if (src.includes('images.unsplash.com')) {
    // Remote images: only fabricate widths when the host actually resizes.
    // A custom Google-Drive URL does not, so leave those alone.
    const base = src.split('?')[0];
    srcSet = [
      `${base}?w=400&q=78&auto=format&fit=crop 400w`,
      `${base}?w=800&q=78&auto=format&fit=crop 800w`,
      `${base}?w=1200&q=78&auto=format&fit=crop 1200w`,
      `${base}?w=1600&q=78&auto=format&fit=crop 1600w`,
    ].join(', ');
  }

  const sizes =
    '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1536px) 33vw, 1600px';

  return (
    <img
      src={src}
      srcSet={srcSet}
      sizes={srcSet ? sizes : undefined}
      alt={alt || ''}
      title={title}
      // Intrinsic size stops layout shift while the variant decodes.
      width={entry?.srcWidth}
      height={entry?.srcHeight}
      loading={priority ? 'eager' : 'lazy'}
      fetchPriority={priority ? 'high' : 'auto'}
      decoding={priority ? 'sync' : 'async'}
      className={className || ''}
      {...props}
    />
  );
}
