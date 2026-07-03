import { useState, useEffect } from 'react';

export function useImagePreloader(imageUrls: string[]) {
  const [imagesPreloaded, setImagesPreloaded] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let isCancelled = false;
    let loadedCount = 0;
    
    // Filter out empty URLs just in case
    const validUrls = imageUrls.filter(url => Boolean(url));
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
  }, [imageUrls]);

  return { imagesPreloaded, progress };
}
