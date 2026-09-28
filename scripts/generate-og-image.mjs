/**
 * Generate the Open Graph share image (1200x630) from real portfolio work.
 *
 * WHY
 * ---
 * index.html pointed og:image / twitter:image at a stock Unsplash photo of a
 * camera. Every WhatsApp, Facebook and iMessage share of the site therefore
 * showed a stranger's photograph instead of Alwin's work. That is the first
 * thing a potential client sees, and it looked generic/borrowed.
 *
 * This bakes a 1200x630 crop from an actual Shutterhaus frame into
 * public/og-image.jpg so the meta tags can point at a stable, self-hosted URL
 * (social scrapers cannot reliably fetch a relative ./assets/ hashed URL).
 *
 * Run: node scripts/generate-og-image.mjs
 * Idempotent: skips regeneration if the output already exists.
 */
import { existsSync, mkdirSync, statSync } from 'node:fs';
import { execFileSync } from 'node:child_process';

const SOURCE = 'src/assets/images/golden_hour_embrace_1782310479605.jpg';
const OUT_DIR = 'public';
const OUT = 'public/og-image.jpg';
const W = 1200;
const H = 630;

mkdirSync(OUT_DIR, { recursive: true });

if (existsSync(OUT)) {
  console.log(`${OUT} already exists (${(statSync(OUT).size / 1024).toFixed(0)} KB) - skipping.`);
  console.log('Delete the file and re-run to regenerate.');
  process.exit(0);
}

// Centre-crop to the 1.91:1 OG ratio, then resize to exactly 1200x630.
execFileSync('python', [
  '-c',
  [
    'from PIL import Image, ImageEnhance',
    `im=Image.open(r'${SOURCE}').convert('RGB')`,
    `target=${W}/${H}`,
    `sw,sh=im.size`,
    // Scale so the image covers the target box, then centre-crop the overflow.
    `scale=max(${W}/sw, ${H}/sh)`,
    `nw,nh=round(sw*scale), round(sh*scale)`,
    `im=im.resize((nw,nh), Image.LANCZOS)`,
    `left=(nw-${W})//2; top=(nh-${H})//2`,
    `im=im.crop((left, top, left+${W}, top+${H}))`,
    // Slightly darken so white overlay text stays legible on the share card.
    `im=ImageEnhance.Brightness(im).enhance(0.72)`,
    `im=ImageEnhance.Contrast(im).enhance(1.05)`,
    `im.save(r'${OUT}','JPEG',quality=84,optimize=True,progressive=True)`,
  ].join(';'),
]);

const size = statSync(OUT).size;
console.log(`wrote ${OUT} (${W}x${H}, ${(size / 1024).toFixed(0)} KB)`);
console.log('source:', SOURCE);
console.log('');
console.log('Point index.html at:');
console.log(`  <meta property="og:image" content="https://itsnotalwin.github.io/Shutterhaus-Visuals/og-image.jpg" />`);
