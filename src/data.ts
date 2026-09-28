import { PortfolioItem, Service, Testimonial, PricingPackage } from './types';
import img1 from './assets/images/golden_hour_embrace_1782310479605.jpg';
import img2 from './assets/images/confident_gaze_portrait_1782310494064.jpg';
import img3 from './assets/images/family_generations_1782310506742.jpg';
import img4 from './assets/images/matric_elegance_1782310520668.jpg';
import img6 from './assets/images/editorial_edge_1782310547540.jpg';
import img8 from './assets/images/family_essence_1782310575087.jpg';
import img9 from './assets/images/event_celebration_1782310588063.jpg';

// CHANELLE editorial series — real EXIF pulled from the source files
// (Canon EOS 4000D, EF-S18-55mm f/3.5-5.6 IS STM), not invented gear.
import chanVerdant from './assets/images/chanelle_verdant_gaze.jpg';
import chanNoir from './assets/images/chanelle_noir_confidence.jpg';
import chanSoft from './assets/images/chanelle_soft_light.jpg';
import chanWind from './assets/images/chanelle_wind_street.jpg';
import chanGarden from './assets/images/chanelle_garden_thought.jpg';
import chanStairs from './assets/images/chanelle_steel_stairs.jpg';
import chanWinter from './assets/images/chanelle_golden_winter.jpg';
import chanLowlight from './assets/images/chanelle_lowlight_studio.jpg';

// Uncropped originals for the lightbox (whole composition, not the grid crop).
import chanVerdantFull from './assets/images/chanelle_verdant_gaze_full.jpg';
import chanNoirFull from './assets/images/chanelle_noir_confidence_full.jpg';
import chanSoftFull from './assets/images/chanelle_soft_light_full.jpg';
import chanWindFull from './assets/images/chanelle_wind_street_full.jpg';
import chanGardenFull from './assets/images/chanelle_garden_thought_full.jpg';
import chanStairsFull from './assets/images/chanelle_steel_stairs_full.jpg';
import chanWinterFull from './assets/images/chanelle_golden_winter_full.jpg';
import chanLowlightFull from './assets/images/chanelle_lowlight_studio_full.jpg';

export const SERVICES_DATA: Service[] = [
  {
    id: 'svc-1',
    num: '01',
    name: 'Portrait & Lifestyle',
    detail: 'Intimate, raw, and character-driven outdoor and lifestyle portraits, capturing genuine moments in natural environments.',
    bullets: ['Couples & Engagements', 'Individual Portraits', 'Lifestyle Shoots', 'Maternity']
  },
  {
    id: 'svc-2',
    num: '02',
    name: 'Family & Heritage',
    detail: 'Timeless family photography honoring connection and legacy — authentic, heartwarming group and candid shots.',
    bullets: ['Multi-generational', 'Newborn & Babies', 'Candid Family Days', 'Pet Photography']
  },
  {
    id: 'svc-3',
    num: '03',
    name: 'Events & Occasions',
    detail: 'Documenting the joy and high energy of your milestone celebrations with a cinematic, unobtrusive approach.',
    bullets: ['Matric Farewells', 'Birthdays & Anniversaries', 'Intimate Weddings', 'Corporate Functions']
  }
];

export const PORTFOLIO_DATA: PortfolioItem[] = [
  // --- CHANELLE editorial series (2025) ---------------------------------
  // Settings below are read from each file's own EXIF, not invented.
  {
    id: 'chanelle-verdant-gaze',
    title: 'Verdant Gaze',
    category: 'editorial',
    year: '2025',
    location: 'Kempton Park, ZA',
    imageUrl: chanVerdant,
    fullImageUrl: chanVerdantFull,
    description: 'Direct gaze against a saturated green wall, hand raised to the frame — a study in colour confidence and stillness.',
    dimensions: 'Digital & 8"x10" Print',
    cameraSettings: {
      camera: 'Canon EOS 4000D',
      lens: 'EF-S18-55mm f/3.5-5.6 IS STM',
      aperture: 'f/8',
      shutterSpeed: '1/60s',
      iso: '1600'
    }
  },
  {
    id: 'chanelle-noir-confidence',
    title: 'Noir Confidence',
    category: 'editorial',
    year: '2025',
    location: 'Johannesburg, ZA',
    imageUrl: chanNoir,
    fullImageUrl: chanNoirFull,
    description: 'High-contrast monochrome street portrait, leather and denim rendered in deep shadow and hard winter light.',
    dimensions: 'Digital & 11"x14" Print',
    cameraSettings: {
      camera: 'Canon EOS 4000D',
      lens: 'EF-S18-55mm f/3.5-5.6 IS STM',
      aperture: 'f/5.6',
      shutterSpeed: '1/1250s',
      iso: '100'
    }
  },
  {
    id: 'chanelle-soft-light',
    title: 'Soft Light',
    category: 'portrait',
    year: '2025',
    location: 'Johannesburg, ZA',
    imageUrl: chanSoft,
    fullImageUrl: chanSoftFull,
    description: 'Warm falloff across the face, hand resting at the throat — an intimate beauty portrait held in a single breath.',
    dimensions: 'Digital & 8"x10" Print',
    cameraSettings: {
      camera: 'Canon EOS 4000D',
      lens: 'EF-S18-55mm f/3.5-5.6 IS STM',
      aperture: 'f/5.6',
      shutterSpeed: '1/250s',
      iso: '100'
    }
  },
  {
    id: 'chanelle-wind-street',
    title: 'Wind Street',
    category: 'editorial',
    year: '2025',
    location: 'Johannesburg, ZA',
    imageUrl: chanWind,
    fullImageUrl: chanWindFull,
    description: 'Winter wind caught mid-gesture, monochrome frame holding the raw edge of a street portrait.',
    dimensions: 'Digital & 11"x14" Print',
    cameraSettings: {
      camera: 'Canon EOS 4000D',
      lens: 'EF-S18-55mm f/3.5-5.6 IS STM',
      aperture: 'f/5.6',
      shutterSpeed: '1/1250s',
      iso: '100'
    }
  },
  {
    id: 'chanelle-garden-thought',
    title: 'Garden Thought',
    category: 'portrait',
    year: '2026',
    location: 'Gauteng, ZA',
    imageUrl: chanGarden,
    fullImageUrl: chanGardenFull,
    description: 'Long lens, low sun, subject turned from the light — a quiet portrait suspended in late-summer warmth.',
    dimensions: 'Digital & 8"x10" Print',
    cameraSettings: {
      camera: 'Canon EOS 4000D',
      lens: 'EF-S18-55mm f/3.5-5.6 IS STM',
      aperture: 'f/5.6',
      shutterSpeed: '1/30s',
      iso: '100'
    }
  },
  {
    id: 'chanelle-steel-stairs',
    title: 'Steel Stairs',
    category: 'editorial',
    year: '2025',
    location: 'Johannesburg, ZA',
    imageUrl: chanStairs,
    fullImageUrl: chanStairsFull,
    description: 'Seated against painted steel, wide open at f/4 — architectural lines holding a still, unguarded frame.',
    dimensions: 'Digital & 8"x10" Print',
    cameraSettings: {
      camera: 'Canon EOS 4000D',
      lens: 'EF-S18-55mm f/3.5-5.6 IS STM',
      aperture: 'f/4',
      shutterSpeed: '1/500s',
      iso: '100'
    }
  },
  {
    id: 'chanelle-golden-winter',
    title: 'Golden Winter',
    category: 'portrait',
    year: '2025',
    location: 'Johannesburg, ZA',
    imageUrl: chanWinter,
    fullImageUrl: chanWinterFull,
    description: 'Backlit winter sun flaring behind the shoulder, hair rimmed in gold against a cold city street.',
    dimensions: 'Digital & 8"x10" Print',
    cameraSettings: {
      camera: 'Canon EOS 4000D',
      lens: 'EF-S18-55mm f/3.5-5.6 IS STM',
      aperture: 'f/5.6',
      shutterSpeed: '1/400s',
      iso: '100'
    }
  },
  {
    id: 'chanelle-lowlight-studio',
    title: 'Lowlight',
    category: 'editorial',
    year: '2026',
    location: 'Kempton Park, ZA',
    imageUrl: chanLowlight,
    fullImageUrl: chanLowlightFull,
    description: 'Pushed to ISO 1600 in a dim structure, grain and falloff doing the work that light could not.',
    dimensions: 'Digital & 11"x14" Print',
    cameraSettings: {
      camera: 'Canon EOS 4000D',
      lens: 'EF-S18-55mm f/3.5-5.6 IS STM',
      aperture: 'f/7.1',
      shutterSpeed: '1/60s',
      iso: '1600'
    }
  },

  // --- Existing collections --------------------------------------------
  {
    id: 'port-1',
    title: 'Golden Hour Embrace',
    category: 'portrait',
    year: '2024',
    location: 'Kempton Park, ZA',
    imageUrl: img1,
    description: 'An intimate, sun-drenched outdoor couple session capturing pure connection and natural emotion.',
    dimensions: 'Digital & 8"x10" Print',
    cameraSettings: {
      camera: 'Sony A7R V',
      lens: 'Sony FE 50mm f/1.2 GM',
      aperture: 'f/1.4',
      shutterSpeed: '1/1000s',
      iso: '100'
    }
  },
  {
    id: 'port-2',
    title: 'The Confident Gaze',
    category: 'portrait',
    year: '2024',
    location: 'Studio Alpha',
    imageUrl: img2,
    description: 'A striking studio portrait utilizing a clean, single-light setup to emphasize facial structure and depth.',
    dimensions: '24" x 36" Archival Print',
    cameraSettings: {
      camera: 'Leica M11',
      lens: 'Leica Summilux-M 50mm f/1.4 ASPH',
      aperture: 'f/2.8',
      shutterSpeed: '1/250s',
      iso: '100'
    }
  },
  {
    id: 'port-3',
    title: 'Generations',
    category: 'family',
    year: '2024',
    location: 'Johannesburg, ZA',
    imageUrl: img3,
    description: 'A timeless family portrait highlighting the warmth, legacy, and joy of multi-generational connection.',
    dimensions: '30" x 45" Metal Print',
    cameraSettings: {
      camera: 'Hasselblad X2D 100C',
      lens: 'XCD 45mm f/4',
      aperture: 'f/5.6',
      shutterSpeed: '1/200s',
      iso: '100'
    }
  },
  {
    id: 'port-4',
    title: 'Matric Elegance',
    category: 'event',
    year: '2023',
    location: 'Pretoria, ZA',
    imageUrl: img4,
    description: 'A cinematic capture of a matric farewell dress, blending formal elegance with a modern editorial aesthetic.',
    dimensions: 'Digital Gallery',
    cameraSettings: {
      camera: 'Sony A7R IV',
      lens: 'Sony FE 85mm f/1.4 GM',
      aperture: 'f/1.4',
      shutterSpeed: '1/500s',
      iso: '200'
    }
  },
  {
    id: 'port-6',
    title: 'Editorial Edge',
    category: 'editorial',
    year: '2024',
    location: 'Cape Town, ZA',
    imageUrl: img6,
    description: 'A conceptual fashion piece examining the motion of flowing silk textiles in high-contrast studio setups.',
    dimensions: 'Print Campaign',
    cameraSettings: {
      camera: 'Hasselblad H6D-100c',
      lens: 'HC 120mm f/4 II Macro',
      aperture: 'f/8.0',
      shutterSpeed: '1/250s',
      iso: '100'
    }
  },
  {
    id: 'port-8',
    title: 'Family Essence',
    category: 'family',
    year: '2024',
    location: 'Stellenbosch, ZA',
    imageUrl: img8,
    description: 'A genuine, unposed moment shared between family members in an open, natural field.',
    dimensions: '20" x 30" Print',
    cameraSettings: {
      camera: 'Canon EOS R5',
      lens: 'RF 50mm f/1.2L USM',
      aperture: 'f/1.8',
      shutterSpeed: '1/800s',
      iso: '100'
    }
  },
  {
    id: 'port-9',
    title: 'The Celebration',
    category: 'event',
    year: '2023',
    location: 'Sandton, ZA',
    imageUrl: img9,
    description: 'Joyous, high-energy event coverage capturing authentic celebration.',
    dimensions: 'Digital Gallery',
    cameraSettings: {
      camera: 'Nikon Z9',
      lens: 'NIKKOR Z 24-70mm f/2.8 S',
      aperture: 'f/2.8',
      shutterSpeed: '1/250s',
      iso: '1600'
    }
  }
];

export const TESTIMONIALS_DATA: Testimonial[] = [
  {
    id: 'testi-1',
    stars: 5,
    text: '“Shutterhaus completely redefined how we present our brand. Their photographic approach is not just standard imagery — it is an artistic statement. Every single photograph carries weight, story, and a stunning presence.”',
    author: 'Nadia Kamga',
    role: 'Creative Director, Atelier Noir'
  },
  {
    id: 'testi-2',
    stars: 5,
    text: '“Their obsessive attention to light, angle, and detail is unlike anything we have ever experienced in our 12 years of luxury publishing. They are silent observers who capture the exact soul of a space.”',
    author: 'Marcus Vance',
    role: 'Chief Editor, HABITAT Magazine'
  },
  {
    id: 'testi-3',
    stars: 5,
    text: '“Working with the team on our global commercial roll-out was seamless. They operate with absolute focus, delivering a highly polished portfolio of assets that drastically exceeded our expectations.”',
    author: 'Lerato Modise',
    role: 'VP of Marketing, Element South Africa'
  }
];

export const PRICING_PACKAGES_DATA: PricingPackage[] = [
  {
    id: 'pkg-1',
    name: 'Natural Light Basic',
    priceZar: 850,
    duration: '1 Hour',
    imagesCount: '20 edited photos',
    features: [
      'Strictly natural light',
      '1 Outfit setup (No changes)',
      'Outdoor-only location (Kempton Park areas)',
      '1 Professional photographer',
      'Pixieset online gallery access',
      '7-day standard delivery turnaround'
    ],
    isPopular: false,
    idealFor: 'Simple, high-quality outdoor portraits using pure natural light.'
  },
  {
    id: 'pkg-2',
    name: 'Matric Farewell',
    priceZar: 1800,
    duration: '1.5 Hours',
    imagesCount: '30 retouched photos',
    features: [
      'Capturing solo & partner portraits',
      'On-location at your venue or home',
      'Creative direction & posing guidance',
      'Pixieset online gallery for sharing',
      '5-day fast turnaround delivery',
      'High-res digital download rights'
    ],
    isPopular: false,
    idealFor: 'High school graduates capturing their milestone matric dance memories in style.'
  },
  {
    id: 'pkg-3',
    name: 'Family Shoots',
    priceZar: 2500,
    duration: '1.5 Hours',
    imagesCount: '40 retouched photos',
    features: [
      'Up to 6 family members included',
      'Outdoor location or lifestyle home',
      'Full family, sibling, and group combinations',
      'Fine-art color grading and skin retouching',
      'Pixieset online gallery access',
      '1-week standard delivery turnaround'
    ],
    isPopular: true,
    idealFor: 'Cozy family portraiture, capturing multi-generational connection and joy.'
  },
  {
    id: 'pkg-4',
    name: 'Studio Portraiture',
    priceZar: 1850,
    duration: '1 Hour',
    imagesCount: '25 edited photos',
    features: [
      '1 Lead photographer',
      'Private studio environment',
      '1 Outfit setup',
      'Fine-art color grading and skin retouching',
      'Private online gallery access',
      '5-day fast turnaround'
    ],
    isPopular: false,
    idealFor: 'Standard couples, individual headshots, and professional personal lookbooks.'
  }
];

