import { useState, useEffect } from 'react';

/**
 * Preload ONLY the first few images (the above-the-fold ones).
 *
 * Why the cap: the previous version preloaded the ENTIRE portfolio — it
 * appended a `<link rel=preload>` AND constructed an `Image()` for every item,
 * so a phone pulled all ~7.6MB of full-resolution JPEGs before first paint,
 * making `loading="lazy"` on the gallery useless. Browsers also warn that
 * preloading more than a handful of resources defeats the point of preloading.
 *
 * `limit` defaults to 1: only the hero. Gallery items lazy-load as they scroll
 * into view via ResponsiveImage's real srcSet.
 */
export function useImagePreloader(imageUrls: string[], limit = 1) {
  const [imagesPreloaded, setImagesPreloaded] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let isCancelled = false;
    let loadedCount = 0;

    const validUrls = imageUrls.filter(url => Boolean(url)).slice(0, limit);
    const totalImages = validUrls.length;

    if (totalImages === 0) {
      setImagesPreloaded(true);
      return;
    }

    setImagesPreloaded(false);
    setProgress(0);

    const loadImages = async () => {
      const promises = validUrls.map((url) => {
        return new Promise<void>((resolve) => {
          // Add standard preload link header
          let link = document.querySelector(`link[href="${url}"]`);
          if (!link) {
            link = document.createElement('link');
            link.setAttribute('rel', 'preload');
            link.setAttribute('as', 'image');
            link.setAttribute('href', url);
            document.head.appendChild(link);
          }

          // Preload into cache via Image constructor
          const img = new Image();
          img.src = url;
          img.onload = () => {
            if (isCancelled) return;
            loadedCount++;
            setProgress((loadedCount / totalImages) * 100);
            resolve();
          };
          img.onerror = () => {
            // Resolve on error so we don't block the rest of the images
            if (isCancelled) return;
            loadedCount++;
            setProgress((loadedCount / totalImages) * 100);
            resolve();
          };
        });
      });

      await Promise.all(promises);

      if (!isCancelled) {
        setImagesPreloaded(true);
      }
    };

    loadImages();

    return () => {
      isCancelled = true;
    };
  }, [imageUrls, limit]);

  return { imagesPreloaded, progress };
}
