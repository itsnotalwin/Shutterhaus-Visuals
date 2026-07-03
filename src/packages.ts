export interface LocalPackage {
  id: string;
  name: string;
  priceZar: number;
  priceRetainerZar: number;
  duration: string;
  imagesCount: string;
  features: string[];
  isPopular: boolean;
  idealFor: string;
}

export const LOCAL_PACKAGES: LocalPackage[] = [
  {
    id: "pkg-1",
    name: "Natural Light Basic",
    priceZar: 1000,
    priceRetainerZar: 800,
    duration: "45 Min &bull; Outdoor Only",
    imagesCount: "15 edited images",
    features: [
      "15 High-res edited images",
      "Strictly natural light",
      "1 Outfit setup (No changes)",
      "7 Day standard turnaround",
      "Pixieset online gallery",
    ],
    isPopular: true,
    idealFor:
      "Simple, high-quality outdoor portraits using pure natural light.",
  },
  {
    id: "pkg-2",
    name: "Matric Farewell",
    priceZar: 2200,
    priceRetainerZar: 1760,
    duration: "1.5 Hours &bull; 1 location",
    imagesCount: "25 retouched photos",
    features: [
      "25 High-res edited images",
      "Solo & partner portraits",
      "Pixieset online gallery",
      "5 Day fast turnaround",
      "Creative direction support",
    ],
    isPopular: false,
    idealFor: "Capturing the elegance and milestone of your graduation night.",
  },
  {
    id: "pkg-3",
    name: "Family Shoots",
    priceZar: 3200,
    priceRetainerZar: 2560,
    duration: "1.5 Hours &bull; Outdoor Location",
    imagesCount: "35 retouched photos",
    features: [
      "35 High-res edited images",
      "Up to 6 family members",
      "Pixieset online gallery",
      "7 Day standard turnaround",
      "Full family & group combinations",
    ],
    isPopular: false,
    idealFor:
      "Timeless family portraiture captured in a beautiful natural setting.",
  },
  {
    id: "pkg-4",
    name: "Studio Portraiture",
    priceZar: 5500,
    priceRetainerZar: 4400,
    duration: "1 Hour &bull; Private Studio",
    imagesCount: "25 edited images",
    features: [
      "25 High-res edited images",
      "1 Outfit setup",
      "Pixieset online gallery",
      "5 Day fast turnaround",
      "Fine-art color grading",
    ],
    isPopular: false,
    idealFor:
      "Standard couples, individual headshots, and professional personal lookbooks.",
  },
  {
    id: "pkg-5",
    name: "Sultry Boudoir",
    priceZar: 6500,
    priceRetainerZar: 5200,
    duration: "2 Hours &bull; Private Studio",
    imagesCount: "20 retouched photos",
    features: [
      "20 Premium retouched assets",
      "Professional posing & creative guidance",
      "Sensual high-contrast lighting setups",
      "Private online gallery",
      "7-day confidential delivery",
    ],
    isPopular: false,
    idealFor:
      "Intimate, empowering, confidential and beautifully raw personal boudoir sessions.",
  }
];
