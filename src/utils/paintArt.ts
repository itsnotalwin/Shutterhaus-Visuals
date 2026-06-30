// Seeded random helper to ensure consistency based on a seed
export function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

export function paintArtOnCanvas(canvas: HTMLCanvasElement, type: string, seedValue: number) {
  const w = canvas.width;
  const h = canvas.height;
  const g = canvas.getContext('2d');
  if (!g) return;

  const R = seededRandom(seedValue);

  // Gradient helpers
  const rg = (x0: number, y0: number, r0: number, x1: number, y1: number, r1: number, a: string, b: string) => {
    const gr = g.createRadialGradient(x0, y0, r0, x1, y1, r1);
    gr.addColorStop(0, a);
    gr.addColorStop(1, b);
    return gr;
  };

  const lg = (x0: number, y0: number, x1: number, y1: number, ...st: string[]) => {
    const gr = g.createLinearGradient(x0, y0, x1, y1);
    st.forEach((s, i) => gr.addColorStop(i / (st.length - 1), s));
    return gr;
  };

  // Dark warm artistic canvas backdrop
  g.fillStyle = '#231a12';
  g.fillRect(0, 0, w, h);

  if (type === 'portrait') {
    // Soft vignette and portrait lighting structure
    g.fillStyle = rg(w * 0.5, h * 0.32, 0, w * 0.5, h * 0.32, w * 0.62, 'rgba(78,56,36,1)', 'rgba(24,17,11,1)');
    g.fillRect(0, 0, w, h);
    
    // Abstract facial profile / structure
    g.fillStyle = 'rgba(94, 68, 44, 0.85)';
    g.beginPath();
    g.ellipse(w * 0.5, h * 0.25, w * 0.16, h * 0.17, 0, 0, Math.PI * 2);
    g.fill();
    
    // Abstract shoulders drapes
    g.fillStyle = lg(0, h * 0.4, 0, h * 0.68, 'rgba(80,58,38,0.82)', 'rgba(20,14,9,0.5)');
    g.beginPath();
    g.moveTo(w * 0.36, h * 0.4);
    g.bezierCurveTo(w * 0.36, h * 0.4, w * 0.28, h * 0.54, w * 0.18, h * 0.68);
    g.lineTo(w * 0.82, h * 0.68);
    g.bezierCurveTo(w * 0.72, h * 0.54, w * 0.64, h * 0.4, w * 0.64, h * 0.4);
    g.closePath();
    g.fill();
    
    // Flare flare flare
    g.fillStyle = rg(w * R(), h * R(), 0, w * 0.85, h * 0.1, w * 0.6, 'rgba(217,122,77,0.1)', 'rgba(0,0,0,0)');
    g.fillRect(0, 0, w, h);
    
    // High-contrast atmospheric dark drop
    g.fillStyle = lg(0, h * 0.55, 0, h, 'rgba(0,0,0,0)', 'rgba(15,10,6,0.9)');
    g.fillRect(0, 0, w, h);

  } else if (type === 'editorial') {
    // Studio backdrop with abstract editorial layouts
    g.fillStyle = '#1d150e';
    g.fillRect(0, 0, w, h);
    
    g.fillStyle = lg(0, 0, w, h * 0.6, 'rgba(100,72,46,0.6)', 'rgba(40,29,19,0.32)', 'rgba(0,0,0,0)');
    g.fillRect(0, 0, w, h);
    
    // Studio focus rectangle
    g.strokeStyle = 'rgba(252, 250, 247, 0.08)';
    g.lineWidth = 1;
    g.strokeRect(w * 0.1, h * 0.1, w * 0.8, h * 0.8);
    
    // Concentrated studio light flare
    g.fillStyle = rg(w * 0.5, h * 0.45, 0, w * 0.5, h * 0.45, w * 0.32, 'rgba(110,80,50,0.5)', 'rgba(0,0,0,0)');
    g.fillRect(0, 0, w, h);

  } else if (type === 'commercial') {
    // High-contrast clean spotlight studio layout
    g.fillStyle = lg(0, 0, w, h, 'rgba(58,42,28,1)', 'rgba(28,20,13,1)', 'rgba(15,10,6,1)');
    g.fillRect(0, 0, w, h);
    
    // Baseline horizontal shelf indicator
    g.strokeStyle = 'rgba(252, 250, 247, 0.07)';
    g.lineWidth = 1;
    g.beginPath();
    g.moveTo(0, h * 0.58);
    g.lineTo(w, h * 0.58);
    g.stroke();
    
    // Spotlight reflecting on product plane
    g.fillStyle = rg(w * 0.5, h * 0.42, 0, w * 0.5, h * 0.42, w * 0.32, 'rgba(122,88,55,0.5)', 'rgba(0,0,0,0)');
    g.fillRect(0, 0, w, h);

  } else if (type === 'events') {
    // Warm bokeh circle events overlay
    g.fillStyle = '#16110b';
    g.fillRect(0, 0, w, h);
    
    for (let i = 0; i < 6; i++) {
      const bx = R() * w;
      const by = R() * h;
      const br = (0.04 + R() * 0.06) * w;
      g.fillStyle = rg(bx, by, 0, bx, by, br, 'rgba(217,150,100,0.13)', 'rgba(0,0,0,0)');
      g.fillRect(0, 0, w, h);
    }
    
    g.fillStyle = rg(w * 0.5, h * 0.42, 0, w * 0.5, h * 0.42, w * 0.55, 'rgba(60,44,28,0.42)', 'rgba(0,0,0,0)');
    g.fillRect(0, 0, w, h);

  } else if (type === 'fine-art') {
    // Atmospheric dark desert gradient study
    g.fillStyle = lg(0, 0, 0, h, 'rgba(58,42,28,1)', 'rgba(26,18,12,1)', 'rgba(12,8,5,1)');
    g.fillRect(0, 0, w, h);
    
    // Curved mountain / dune silhouette
    g.save();
    g.globalAlpha = 0.07;
    g.strokeStyle = '#fcfaf7';
    g.lineWidth = 2;
    g.beginPath();
    g.moveTo(0, h * 0.46);
    g.quadraticCurveTo(w * 0.5, h * 0.28, w, h * 0.52);
    g.stroke();
    g.restore();
    
    g.fillStyle = rg(w * 0.4, h * 0.4, 0, w * 0.4, h * 0.4, w * 0.4, 'rgba(80,58,38,0.42)', 'rgba(0,0,0,0)');
    g.fillRect(0, 0, w, h);

  } else {
    // Default architecture style: structural axonometric lines
    g.fillStyle = '#1a130c';
    g.fillRect(0, 0, w, h);
    
    const vx = w * 0.5;
    const vy = h * 0.5;
    g.strokeStyle = 'rgba(252, 250, 247, 0.05)';
    g.lineWidth = 1;
    for (let i = 0; i <= 8; i++) {
      g.beginPath();
      g.moveTo(i * (w / 8), 0);
      g.lineTo(vx, vy);
      g.stroke();
      g.beginPath();
      g.moveTo(0, i * (h / 8));
      g.lineTo(vx, vy);
      g.stroke();
    }
    g.fillStyle = rg(vx, vy, 0, vx, vy, w * 0.4, 'rgba(88,64,40,0.55)', 'rgba(0,0,0,0)');
    g.fillRect(0, 0, w, h);
  }

  // Paint fine photography film grains (white dust particles)
  for (let i = 0; i < w * h * 0.06; i++) {
    g.fillStyle = `rgba(252, 250, 247, ${R() * 0.04})`;
    g.fillRect(R() * w, R() * h, 1, 1);
  }
}
