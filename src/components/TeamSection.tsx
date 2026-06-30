import { useEffect, useRef, useState } from 'react';
import { paintArtOnCanvas } from '../utils/paintArt';

interface TeamMember {
  id: string;
  name: string;
  role: string;
  type: string;
  query: string;
}

const TEAM_MEMBERS: TeamMember[] = [
  {
    id: 'alwin',
    name: 'Alwin',
    role: 'Lead Photographer & Founder',
    type: 'portrait',
    query: 'male portrait warm studio professional photography'
  },
  {
    id: 'anika',
    name: 'Anika van der Berg',
    role: 'Editorial & Fine Art Lead',
    type: 'editorial',
    query: 'female photographer warm studio portrait'
  },
  {
    id: 'kwame',
    name: 'Kwame Osei',
    role: 'Commercial & Events Lead',
    type: 'commercial',
    query: 'male photographer warm tone dramatic'
  }
];

export default function TeamSection() {
  const canvasRefs = useRef<{ [key: string]: HTMLCanvasElement | null }>({});
  const [images, setImages] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    // Render high quality fallback canvases instantly
    TEAM_MEMBERS.forEach((m, idx) => {
      const cv = canvasRefs.current[m.id];
      if (cv) {
        paintArtOnCanvas(cv, m.type, idx + 42);
      }
    });

    // Let's fetch warm photographer portraits dynamically from Pexels as a premium upgrade
    const KEY = 'V93Pu2iE5a9K2SqS8OlSvSFjPqNniXiK9kx1e9t9v24JoTtJa0Vg3jWR';
    TEAM_MEMBERS.forEach(async (m) => {
      try {
        const response = await fetch(
          `https://api.pexels.com/v1/search?query=${encodeURIComponent(m.query)}&per_page=1&page=1`,
          { headers: { Authorization: KEY } }
        );
        if (response.ok) {
          const data = await response.json();
          if (data.photos && data.photos[0]) {
            const url = data.photos[0].src.portrait || data.photos[0].src.large;
            if (url) {
              setImages((prev) => ({ ...prev, [m.id]: url }));
            }
          }
        }
      } catch (e) {
        console.error('Failed to load team image from Pexels, using beautiful canvas fallback.', e);
      }
    });
  }, []);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {TEAM_MEMBERS.map((m) => {
        const isLoaded = !!images[m.id];
        return (
          <div key={m.id} className="group space-y-4">
            <div className="relative aspect-[3/4] overflow-hidden border border-sand dark:border-dark-border bg-oatmeal dark:bg-surface-2">
              
              {/* Fallback procedural painting */}
              <canvas
                ref={(el) => (canvasRefs.current[m.id] = el)}
                width={380}
                height={500}
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-1000 ease-out group-hover:scale-[1.04]"
              />

              {/* Dynamic Pexels photo */}
              {(isLoaded || m.id === 'alwin') && (
                <img
                  src={m.id === 'alwin' ? '/alwin.jpg' : images[m.id]}
                  alt={m.name}
                  referrerPolicy="no-referrer"
                  className="absolute inset-0 w-full h-full object-cover filter grayscale sepia-[0.2] saturate-[0.9] contrast-[1.02] brightness-[0.95] transition-all duration-1000 ease-out group-hover:scale-[1.04] group-hover:grayscale-0 group-hover:sepia-0 group-hover:saturate-100"
                  onError={(e) => {
                    if (m.id === 'alwin') {
                      (e.target as HTMLImageElement).src = images['alwin'] || "https://images.unsplash.com/photo-1540573133985-87b6da6d54a9?q=80&w=800&auto=format&fit=crop";
                    }
                  }}
                />
              )}
              
              {/* Overlay visual vignette */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent pointer-events-none" />
            </div>

            <div className="space-y-1">
              <h4 className="font-serif italic text-lg tracking-tight text-espresso dark:text-alabaster">
                {m.name}
              </h4>
              <p className="text-[10px] font-mono uppercase text-[#7c7265] dark:text-[#9a9088] tracking-widest">
                {m.role}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
