export type Category = 'all' | 'portrait' | 'boudoir' | 'family' | 'event' | 'editorial';

export interface PortfolioItem {
  id: string;
  title: string;
  category: Exclude<Category, 'all'>;
  year: string;
  location: string;
  imageUrl: string;
  description: string;
  dimensions: string;
  cameraSettings: {
    camera: string;
    lens: string;
    aperture: string;
    shutterSpeed: string;
    iso: string;
  };
}

export interface Service {
  id: string;
  num: string;
  name: string;
  detail: string;
  bullets: string[];
}

export interface Testimonial {
  id: string;
  stars: number;
  text: string;
  author: string;
  role: string;
}

export interface Message {
  id: string;
  name: string;
  email: string;
  service: string;
  text: string;
  timestamp: string;
}

export interface Booking {
  id: string;
  name: string;
  email: string;
  service: string;
  date: string;
  timeSlot: string;
  vision: string;
  timestamp: string;
  status: 'Confirmed' | 'Pending Review';
  rawStatus?: string;
}

export interface PricingPackage {
  id: string;
  name: string;
  priceZar: number | string;
  duration: string;
  imagesCount: string;
  features: string[];
  isPopular: boolean;
  idealFor: string;
}
