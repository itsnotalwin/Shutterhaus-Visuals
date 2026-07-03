import { PortfolioItem, Service, Testimonial, PricingPackage } from './types';
import img1 from './assets/images/golden_hour_embrace_1782310479605.jpg';
import img2 from './assets/images/confident_gaze_portrait_1782310494064.jpg';
import img3 from './assets/images/family_generations_1782310506742.jpg';
import img4 from './assets/images/matric_elegance_1782310520668.jpg';
import img5 from './assets/images/intimate_shadows_boudoir_1782310533874.jpg';
import img6 from './assets/images/editorial_edge_1782310547540.jpg';
import img7 from './assets/images/unspoken_frame_boudoir_1782310561368.jpg';
import img8 from './assets/images/family_essence_1782310575087.jpg';
import img9 from './assets/images/event_celebration_1782310588063.jpg';

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
  },
  {
    id: 'svc-4',
    num: '04',
    name: 'Studio & Boudoir',
    detail: 'Professional studio lighting and tasteful, empowering boudoir sessions focused on elegance, contrast, and confidence.',
    bullets: ['Professional Headshots', 'Sultry Boudoir', 'Creative Studio Concepts', 'Editorial Profiles']
  }
];

export const PORTFOLIO_DATA: PortfolioItem[] = [
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
    id: 'port-5',
    title: 'Intimate Shadows',
    category: 'boudoir',
    year: '2024',
    location: 'Private Studio',
    imageUrl: img5,
    description: 'A tasteful, empowering fine-art boudoir portrait exploring the interplay of soft natural light and deep shadows.',
    dimensions: 'Private Collection',
    cameraSettings: {
      camera: 'Fujifilm GFX 100S',
      lens: 'GF 63mm f/2.8 R WR',
      aperture: 'f/2.8',
      shutterSpeed: '1/125s',
      iso: '400'
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
    id: 'port-7',
    title: 'The Unspoken Frame',
    category: 'boudoir',
    year: '2023',
    location: 'Cape Town, ZA',
    imageUrl: img7,
    description: 'A raw, emotive boudoir portrait focusing on silhouette and dramatic lighting.',
    dimensions: 'Private Collection',
    cameraSettings: {
      camera: 'Sony A7R IV',
      lens: 'Sony FE 35mm f/1.4 GM',
      aperture: 'f/2.0',
      shutterSpeed: '1/200s',
      iso: '400'
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
  },
  {
    id: 'pkg-5',
    name: 'Sultry Boudoir',
    priceZar: 3500,
    duration: '2 Hours',
    imagesCount: '25 retouched photos',
    features: [
      'Private indoor studio session',
      'Professional posing & creative guidance',
      'Sensual high-contrast lighting setups',
      'Private online gallery',
      '7-day confidential delivery',
      'Includes professional retouching'
    ],
    isPopular: false,
    idealFor: 'Intimate, empowering, confidential and beautifully raw personal boudoir sessions.'
  }
];

