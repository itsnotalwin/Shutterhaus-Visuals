/**
 * Generate real responsive image variants (WebP) from the source JPEGs.
 *
 * WHY
 * ---
 * ResponsiveImage previously fabricated a srcSet like:
 *   "img.jpg 400w, img.jpg 800w, img.jpg 1200w, img.jpg 1600w"
 * pointing every entry at the SAME ~1MB file. That is worse than useless: the
 * browser believes it is choosing a 400w image and downloads 1MB anyway. It
 * also forced loading="eager" on all 7 gallery images, so a phone on 3G pulled
 * the entire 7.6MB portfolio before rendering anything.
 *
 * This script writes genuine resized WebP variants plus a manifest the
 * component can use to build a real srcSet.
 *
 * Run: node scripts/optimize-images.mjs
 * Idempotent: skips a variant that already exists.
 */
import { readdirSync, mkdirSync, existsSync, writeFileSync, statSync } from 'node:fs';
import { join, basename, extname } from 'node:path';
import { execFileSync } from 'node:child_process';

const SRC_DIR = 'src/assets/images';
const OUT_DIR = 'src/assets/images/variants';
const MANIFEST = 'src/assets/images/variants/manifest.json';

// Widths chosen from real breakpoints: 400 (phone), 800 (tablet),
// 1200 (laptop), 1600 (desktop). Never upscale beyond the source.
const WIDTHS = [400, 800, 1200, 1600];
const QUALITY = 78;

mkdirSync(OUT_DIR, { recursive: true });

const sources = readdirSync(SRC_DIR).filter((f) => /\.(jpe?g|png)$/i.test(f));
const manifest = {};
let bytesBefore = 0;
let bytesAfter = 0;
let variantsWritten = 0;

for (const file of sources) {
  const srcPath = join(SRC_DIR, file);
  const stem = basename(file, extname(file));
  bytesBefore += statSync(srcPath).size;

  // Read source width with PIL so we never upscale.
  const probe = execFileSync('python', [
    '-c',
    `from PIL import Image;im=Image.open(r'${srcPath}');print(im.size[0])`,
  ], { encoding: 'utf8' }).trim();
  const srcWidth = parseInt(probe, 10);
  if (!srcWidth) {
    console.warn(`  skip (could not read width): ${file}`);
    continue;
  }

  const entry = {};
  for (const w of WIDTHS) {
    if (w > srcWidth) break; // never upscale
    const outName = `${stem}-${w}w.webp`;
    const outPath = join(OUT_DIR, outName);

    if (!existsSync(outPath)) {
      execFileSync('python', [
        '-c',
        [
          'from PIL import Image',
          `im=Image.open(r'${srcPath}').convert('RGB')`,
          // Only downscale; never stretch a smaller source upward.
          `im=im.resize((${w}, round(im.size[1]*${w}/im.size[0])), Image.LANCZOS) if im.size[0]>${w} else im`,
          `im.save(r'${outPath}','WEBP',quality=${QUALITY},method=6)`,
        ].join(';'),
      ]);
      variantsWritten++;
    }
    entry[w] = `variants/${outName}`;
    bytesAfter += statSync(outPath).size;
  }

  if (Object.keys(entry).length) {
    manifest[file] = { widths: entry, srcWidth, srcHeight: null };
    console.log(`  ${file} -> ${Object.keys(entry).length} variants (source ${srcWidth}px wide)`);
  }
}

// Fill in source heights now that widths are known.
for (const file of Object.keys(manifest)) {
  const h = execFileSync('python', [
    '-c',
    `from PIL import Image;print(Image.open(r'${join(SRC_DIR, file)}').size[1])`,
  ], { encoding: 'utf8' }).trim();
  manifest[file].srcHeight = parseInt(h, 10);
}

writeFileSync(MANIFEST, JSON.stringify(manifest, null, 2));

console.log('');
console.log(`variants written this run: ${variantsWritten}`);
console.log(`source JPEGs total:        ${(bytesBefore / 1024 / 1024).toFixed(2)} MB`);
console.log(`webp variants total:       ${(bytesAfter / 1024 / 1024).toFixed(2)} MB`);
console.log(`manifest:                  ${MANIFEST} (${Object.keys(manifest).length} images)`);
