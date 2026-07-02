import { useState, useEffect, useRef, MouseEvent, FormEvent } from "react";
import { Link } from "react-router-dom";
import { flushSync } from "react-dom";
import { motion, AnimatePresence, useScroll, useTransform } from "motion/react";
import {
  Sun,
  Moon,
  Plus,
  Trash2,
  ArrowUpRight,
  Mail,
  Phone,
  MapPin,
  MessageSquare,
  Send,
  Star,
  CheckCircle2,
  ChevronRight,
  Menu,
  X,
  Info,
  Sliders,
  Sparkles,
  Camera,
  RotateCcw,
} from "lucide-react";

import { PortfolioItem, Category, Message, Booking } from "./types";
import { PORTFOLIO_DATA, SERVICES_DATA } from "./data";
import Lightbox from "./components/Lightbox";
import ImageUploader from "./components/ImageUploader";
import BookingCalendar from "./components/BookingCalendar";
import { ShutterhausLogo } from "./components/ShutterhausLogo";
import { StartupScreen } from "./components/StartupScreen";
import { ResponsiveImage } from "./components/ResponsiveImage";
import { paintArtOnCanvas } from "./utils/paintArt";
import { db } from "./firebase";
import {
  collection,
  onSnapshot,
  query,
  setDoc,
  doc,
  deleteDoc,
} from "firebase/firestore";

// Standard South African Johannesburg & Kempton Park Pricing packages aligned to standard R (ZAR)
interface LocalPackage {
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

const LOCAL_PACKAGES: LocalPackage[] = [
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
    isPopular: false,
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
    isPopular: true,
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
  },
  {
    id: "pkg-6",
    name: "Editorial Elite",
    priceZar: 32500,
    priceRetainerZar: 26000,
    duration: "Full Day &bull; Studio & On-Location",
    imagesCount: "60 magazine-grade assets",
    features: [
      "60 Magazine-grade retouched assets",
      "Full wardrobe provision (3-4 designer outfits)",
      "Professional Makeup & Hair Stylist on-site",
      "Full commercial usage rights",
      "1 Framed A2 Archival Print",
      "Priority 48-hour digital delivery",
    ],
    isPopular: false,
    idealFor:
      "High-end personal branding, editorial publication, or luxury fashion portfolios with full wardrobe support.",
  },
];

export default function App() {
  // Theme state
  const [theme, setTheme] = useState<"light" | "dark">(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("shutterhaus_theme");
      if (saved === "light" || saved === "dark") return saved;
      return window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light";
    }
    return "light";
  });

  // Portfolio items state (persistent in cache with auto-upgrade sync for updated default items)
  const [portfolio, setPortfolio] = useState<PortfolioItem[]>(() => {
    const saved = localStorage.getItem("shutterhaus_portfolio");
    if (saved) {
      try {
        let items: PortfolioItem[] = JSON.parse(saved);
        // Map cached items: if they are default items, replace with the latest definitions to fix obsolete content like Submerged Echoes
        items = items.map((item) => {
          const defaultMatch = PORTFOLIO_DATA.find((p) => p.id === item.id);
          if (
            defaultMatch &&
            (item.title === "Submerged Echoes" ||
              defaultMatch.title !== item.title ||
              defaultMatch.imageUrl !== item.imageUrl)
          ) {
            return defaultMatch;
          }
          return item;
        });
        return items;
      } catch (e) {
        console.error(
          "Failed to parse portfolio from cache, using default.",
          e,
        );
      }
    }
    return PORTFOLIO_DATA;
  });

  // Filter category
  const [selectedCategory, setSelectedCategory] = useState<Category>("all");

  // Lightbox index state
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  // Custom photo upload modal state
  const [isUploadOpen, setIsUploadOpen] = useState(false);

  // Mobile drawer menu state
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Responsive screen states for portfolio collapsible view
  const [isMobile, setIsMobile] = useState(false);
  const [portfolioExpanded, setPortfolioExpanded] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Hero backgrounds (cyclable) & Parallax
  const [heroBgIndex, setHeroBgIndex] = useState<number>(0);
  const { scrollY } = useScroll();
  const heroParallaxY = useTransform(scrollY, [0, 1000], ["0%", "15%"]);

  // Contact form state
  const [formName, setFormName] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formService, setFormService] = useState(
    "Portrait — Natural Light Basic (R850)",
  );
  const [formMessage, setFormMessage] = useState("");
  const [formSuccess, setFormSuccess] = useState(false);
  const [preSelectedPackage, setPreSelectedPackage] =
    useState("Couples & Families");

  // Sent Messages outbox state for persistent message tracking!
  const [sentMessages, setSentMessages] = useState<Message[]>(() => {
    const saved = localStorage.getItem("shutterhaus_messages");
    return saved ? JSON.parse(saved) : [];
  });
  const [showInbox, setShowInbox] = useState(false);

  // Bookings scheduling state
  const [bookings, setBookings] = useState<Booking[]>(() => {
    const saved = localStorage.getItem("shutterhaus_bookings");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Failed to parse bookings from cache.", e);
      }
    }
    // Preseed a default confirmed booking for professional dynamic feedback on first load
    return [
      {
        id: "book-preseed-1",
        name: "Dumi Masondo",
        email: "dumi.m@gmail.com",
        service: "Matric Farewell",
        date: "Jul 4, 2026",
        timeSlot: "04:30 PM",
        vision: "Sunset forest portrait shoot with matric dance partners.",
        timestamp: "02:14 PM · Jun 22, 2026",
        status: "Confirmed",
      },
    ];
  });

  // Navigation scroll style trigger
  const [scrolled, setScrolled] = useState(false);

  // Pricing mode state: false = Standard packages, true = Retainer packages (20% discount)
  const [isRetainer, setIsRetainer] = useState(false);

  // Stats counting animation
  const [animatedStats, setAnimatedStats] = useState({
    projects: 0,
    years: 0,
    countries: 0,
  });

  // Portfolio image loader tracking (fallbacks to canvases dynamically)
  const canvasRefs = useRef<{ [key: string]: HTMLCanvasElement | null }>({});

  // Sync theme
  useEffect(() => {
    const root = document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
      root.setAttribute("data-theme", "dark");
    } else {
      root.classList.remove("dark");
      root.setAttribute("data-theme", "light");
    }
    localStorage.setItem("shutterhaus_theme", theme);
  }, [theme]);

  // Smooth premium cross-fade theme toggle
  const toggleTheme = () => {
    const newTheme = theme === "dark" ? "light" : "dark";
    if (!document.startViewTransition) {
      setTheme(newTheme);
      return;
    }
    document.startViewTransition(() => {
      flushSync(() => {
        setTheme(newTheme);
      });
    });
  };

  // Sync portfolio items
  useEffect(() => {
    localStorage.setItem("shutterhaus_portfolio", JSON.stringify(portfolio));
  }, [portfolio]);

  // Sync with Firestore portfolio
  useEffect(() => {
    const q = query(collection(db, "portfolio"));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        if (!snapshot.empty) {
          const firestorePortfolio = snapshot.docs.map(
            (doc) => doc.data() as PortfolioItem,
          );
          setPortfolio(firestorePortfolio);
        } else {
          setPortfolio([]);
        }
      },
      (error) => {
        console.log("Using local portfolio cache. Firestore error:", error);
      },
    );
    return () => unsubscribe();
  }, []);

  // Sync with Firestore bookings in real-time
  useEffect(() => {
    const q = query(collection(db, "bookings"));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const firestoreBookings = snapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            name: data.clientName || data.name || "Anonymous Client",
            email: data.clientEmail || data.email || "",
            service: data.package || data.service || "Photography Session",
            date: data.date || "",
            timeSlot: data.time || data.timeSlot || "",
            vision: data.vision || "",
            timestamp: data.timestamp || "",
            status:
              ["approved", "Confirmed", "shooting", "retouching", "delivered"].includes(data.status)
                ? "Confirmed"
                : "Pending Review",
            rawStatus: data.status || "pending",
          } as Booking;
        });
        setBookings(firestoreBookings);
      },
      (error) => {
        console.log("Using local bookings cache. Firestore error:", error);
      },
    );
    return () => unsubscribe();
  }, []);

  // Sync outbox messages
  useEffect(() => {
    localStorage.setItem("shutterhaus_messages", JSON.stringify(sentMessages));
  }, [sentMessages]);

  // Sync bookings
  useEffect(() => {
    localStorage.setItem("shutterhaus_bookings", JSON.stringify(bookings));
  }, [bookings]);

  // Handle scroll trigger
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 60);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Stats incremental count animation when section is in viewport
  useEffect(() => {
    let started = false;
    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting && !started) {
          started = true;
          const duration = 1500;
          const startTime = performance.now();

          const animate = (now: number) => {
            const elapsed = now - startTime;
            const progress = Math.min(elapsed / duration, 1);
            // Cubic ease out
            const ease = 1 - Math.pow(1 - progress, 3);

            setAnimatedStats({
              projects: Math.floor(ease * 340),
              years: Math.floor(ease * 6),
              countries: Math.floor(ease * 12),
            });

            if (progress < 1) {
              requestAnimationFrame(animate);
            }
          };
          requestAnimationFrame(animate);
        }
      },
      { threshold: 0.1 },
    );

    const el = document.getElementById("about");
    if (el) observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Paint original canvas background representations instantly
  useEffect(() => {
    portfolio.forEach((p, idx) => {
      const cv = canvasRefs.current[p.id];
      if (cv) {
        paintArtOnCanvas(cv, p.category, idx + 1);
      }
    });
  }, [portfolio.length]);

  // Select package for booking and pre-populate contact form
  const handleSelectPackageForBooking = (
    packageName: string,
    detailsString: string,
  ) => {
    // Map custom/old packages to our updated set of shoot categories for consistency
    let mappedPackage = "Natural Light Basic";
    if (packageName.includes("Matric")) mappedPackage = "Matric Farewell";
    else if (packageName.includes("Family")) mappedPackage = "Family Shoots";
    else if (packageName.includes("Studio"))
      mappedPackage = "Studio Portraiture";
    else if (packageName.includes("Boudoir")) mappedPackage = "Sultry Boudoir";
    else if (packageName.includes("Editorial"))
      mappedPackage = "Editorial Elite";
    else if (
      packageName.includes("Natural Light") ||
      packageName.includes("Basic")
    )
      mappedPackage = "Natural Light Basic";

    setPreSelectedPackage(mappedPackage);
    setFormService(packageName);
    setFormMessage(
      `Hi Alwin,\n\nI would like to lock in the "${packageName}" setup.\n\nProject Context / Details:\n${detailsString}\n\nPlease verify availability in Kempton Park / Gauteng region!`,
    );

    // Smooth scroll to booking-assistant calendar
    const bookingSection = document.getElementById("booking-assistant");
    if (bookingSection) {
      bookingSection.scrollIntoView({ behavior: "smooth" });
    } else {
      const contactSection = document.getElementById("contact");
      if (contactSection) {
        contactSection.scrollIntoView({ behavior: "smooth" });
      }
    }
  };

  // Add custom photo to state
  const handleAddPhoto = (newPhoto: PortfolioItem) => {
    setPortfolio([newPhoto, ...portfolio]);
  };

  // Delete custom uploaded portfolio photo
  const handleDeletePhoto = (e: MouseEvent, id: string) => {
    e.stopPropagation();
    if (
      confirm(
        "Are you sure you want to remove this custom image from your curated gallery?",
      )
    ) {
      const updated = portfolio.filter((p) => p.id !== id);
      setPortfolio(updated);
      setHeroBgIndex(0);
    }
  };

  // Restore factory portfolio default
  const handleResetPortfolio = () => {
    if (
      confirm(
        "Reset gallery back to default Shutterhaus curation? This will remove all your custom uploads.",
      )
    ) {
      setPortfolio(PORTFOLIO_DATA);
      setHeroBgIndex(0);
      localStorage.removeItem("shutterhaus_portfolio");
    }
  };

  // Contact form submission
  const handleFormSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formEmail.trim() || !formMessage.trim()) return;

    const newMessage: Message = {
      id: `msg-${Date.now()}`,
      name: formName.trim(),
      email: formEmail.trim(),
      service: formService,
      text: formMessage.trim(),
      timestamp:
        new Date().toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
        }) +
        " · " +
        new Date().toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        }),
    };

    try {
      await setDoc(doc(db, "messages", newMessage.id), {
        id: newMessage.id,
        name: newMessage.name,
        email: newMessage.email,
        service: newMessage.service,
        budget: "Not specified",
        message: newMessage.text,
        date: newMessage.timestamp,
      });
    } catch (err) {
      console.error("Failed to save message to Firestore", err);
    }

    setSentMessages([newMessage, ...sentMessages]);
    setFormSuccess(true);

    // Reset inputs
    setFormName("");
    setFormEmail("");
    setFormMessage("");

    setTimeout(() => {
      setFormSuccess(false);
    }, 6000);
  };

  const handleDeleteMessage = (id: string) => {
    setSentMessages(sentMessages.filter((m) => m.id !== id));
  };

  const handleAddBooking = async (newBooking: Booking) => {
    try {
      await setDoc(doc(db, "bookings", newBooking.id), {
        id: newBooking.id,
        clientName: newBooking.name,
        clientEmail: newBooking.email,
        clientPhone: "Not provided",
        company: "Not provided",
        date: newBooking.date,
        time: newBooking.timeSlot,
        duration: "1h",
        package: newBooking.service,
        vision: newBooking.vision,
        status: "pending",
      });
    } catch (err) {
      console.error("Failed to save booking to Firestore", err);
    }
    setBookings([newBooking, ...bookings]);
  };

  const handleDeleteBooking = async (id: string) => {
    try {
      await deleteDoc(doc(db, "bookings", id));
    } catch (err) {
      console.error("Failed to delete booking from Firestore", err);
    }
    setBookings(bookings.filter((b) => b.id !== id));
  };

  const [activeContactTab, setActiveContactTab] = useState<
    "booking" | "message"
  >("booking");

  // Filtered portfolio items matching selected Category tab
  const filteredItems = portfolio.filter((item) =>
    selectedCategory === "all" ? true : item.category === selectedCategory,
  );

  // Limit mobile display if not expanded to show only 1 or 2 images on mobile
  const displayedItems =
    isMobile && !portfolioExpanded ? filteredItems.slice(0, 2) : filteredItems;

  return (
    <div className="min-h-screen bg-oatmeal dark:bg-cocoa text-espresso dark:text-alabaster relative transition-colors duration-500 pb-12 overflow-x-hidden">
      <StartupScreen />
      {/* Subtle photography film grain texture */}
      <div className="film-grain" />

      {/* Fluid Dual Easing Cursor */}

      {/* NAV BAR */}
      <nav
        id="nav"
        className={`fixed top-0 left-0 right-0 z-40 transition-all duration-500 py-5 px-6 md:px-12 border-b flex justify-between items-center ${
          scrolled
            ? "bg-oatmeal/90 dark:bg-cocoa/90 backdrop-blur-md border-sand dark:border-dark-border py-4 shadow-sm"
            : "bg-transparent border-transparent"
        }`}
      >
        <a
          href="#hero"
          className="hover:opacity-80 transition-opacity cursor-hover"
        >
          <ShutterhausLogo variant="horizontal" iconSize={26} />
        </a>

        {/* Desktop Links */}
        <div className="hidden md:flex items-center gap-10">
          <ul className="flex items-center gap-8 text-[10px] tracking-[0.2em] uppercase font-mono">
            <li>
              <a
                href="#services"
                className="text-[#7c7265] dark:text-[#9a9082] hover:text-espresso dark:hover:text-alabaster transition-colors"
              >
                Services
              </a>
            </li>
            <li>
              <a
                href="#work"
                className="text-[#7c7265] dark:text-[#9a9082] hover:text-espresso dark:hover:text-alabaster transition-colors"
              >
                Work
              </a>
            </li>
            <li>
              <a
                href="#pricing"
                className="text-[#7c7265] dark:text-[#9a9082] hover:text-espresso dark:hover:text-alabaster transition-colors"
              >
                Pricing
              </a>
            </li>
            <li>
              <a
                href="#about"
                className="text-[#7c7265] dark:text-[#9a9082] hover:text-espresso dark:hover:text-alabaster transition-colors"
              >
                About
              </a>
            </li>
            <li>
              <a
                href="#contact"
                className="text-[#7c7265] dark:text-[#9a9082] hover:text-espresso dark:hover:text-alabaster transition-colors"
              >
                Contact
              </a>
            </li>
            <li>
              <Link
                to="/client"
                className="text-[#7c7265] dark:text-[#9a9082] hover:text-espresso dark:hover:text-alabaster transition-colors flex items-center gap-1"
              >
                Client Portal
              </Link>
            </li>
          </ul>

          <div className="h-4 w-[1px] bg-sand dark:bg-dark-border" />

          {/* Theme & custom triggers */}
          <div className="flex items-center gap-4">
            <button
              onClick={toggleTheme}
              className="w-9 h-9 border border-sand dark:border-dark-border rounded-full flex items-center justify-center hover:border-accent-light dark:hover:border-accent-dark hover:scale-105 transition-all duration-300 cursor-hover"
              title="Toggle theme"
            >
              {theme === "dark" ? (
                <Sun className="w-3.5 h-3.5 text-alabaster" />
              ) : (
                <Moon className="w-3.5 h-3.5 text-espresso" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile menu toggle */}
        <div className="flex items-center gap-3 md:hidden">
          <button
            onClick={toggleTheme}
            className="w-9 h-9 border border-sand dark:border-dark-border rounded-full flex items-center justify-center"
          >
            {theme === "dark" ? (
              <Sun className="w-3.5 h-3.5" />
            ) : (
              <Moon className="w-3.5 h-3.5" />
            )}
          </button>
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="w-9 h-9 border border-sand dark:border-dark-border flex flex-col justify-center gap-1.5 p-2"
          >
            <span
              className={`block h-[1px] w-full bg-espresso dark:bg-alabaster transition-transform ${isMobileMenuOpen ? "rotate-45 translate-y-2" : ""}`}
            />
            <span
              className={`block h-[1px] w-3/4 bg-espresso dark:bg-alabaster self-end transition-opacity ${isMobileMenuOpen ? "opacity-0" : ""}`}
            />
            <span
              className={`block h-[1px] w-full bg-espresso dark:bg-alabaster transition-transform ${isMobileMenuOpen ? "-rotate-45 -translate-y-2" : ""}`}
            />
          </button>
        </div>
      </nav>

      {/* Mobile menu drawer */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed inset-x-0 top-[70px] z-30 bg-oatmeal dark:bg-[#121110] border-b border-sand dark:border-dark-border p-6 flex flex-col gap-6 md:hidden shadow-lg"
          >
            <ul className="flex flex-col gap-4 text-xs font-mono tracking-[0.2em] uppercase">
              <li>
                <a
                  href="#services"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="block py-1.5 border-b border-sand/30 dark:border-dark-border/30"
                >
                  01 // Services
                </a>
              </li>
              <li>
                <a
                  href="#work"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="block py-1.5 border-b border-sand/30 dark:border-dark-border/30"
                >
                  02 // Curated Work
                </a>
              </li>
              <li>
                <a
                  href="#pricing"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="block py-1.5 border-b border-sand/30 dark:border-dark-border/30"
                >
                  03 // Pricing & Estimations
                </a>
              </li>
              <li>
                <a
                  href="#about"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="block py-1.5 border-b border-sand/30 dark:border-dark-border/30"
                >
                  04 // Team & About
                </a>
              </li>
              <li>
                <a
                  href="#contact"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="block py-1.5 border-b border-sand/30 dark:border-dark-border/30"
                >
                  05 // Bookings
                </a>
              </li>
              <li>
                <Link
                  to="/client"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="block py-1.5"
                >
                  06 // Client Portal
                </Link>
              </li>
            </ul>
          </motion.div>
        )}
      </AnimatePresence>

      {/* HERO SECTION */}
      <header
        id="hero"
        className="min-h-screen relative flex flex-col justify-end px-6 md:px-[var(--px)] pb-12 pt-32 overflow-hidden"
      >
        {/* Absolute Background Image Viewport */}
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-t from-oatmeal via-oatmeal/50 to-oatmeal/20 dark:from-cocoa dark:via-cocoa/45 dark:to-cocoa/10 z-10" />
          <motion.img
            key={heroBgIndex}
            style={{ y: heroParallaxY }}
            initial={{ scale: 1.1, opacity: 0 }}
            animate={{ scale: 1, opacity: theme === "dark" ? 0.22 : 0.3 }}
            transition={{ duration: 1.4, ease: "easeOut" }}
            src={portfolio[heroBgIndex % portfolio.length]?.imageUrl}
            alt="Lead photography artwork study"
            referrerPolicy="no-referrer"
            className="w-full h-[120%] -top-[10%] relative object-cover filter grayscale sepia-[0.1] contrast-[1.04] will-change-transform"
          />
        </div>

        {/* Hero typography & grid details */}
        <div className="relative z-10 max-w-7xl mx-auto w-full space-y-12">
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <span className="text-[10px] md:text-[11px] font-mono tracking-[0.25em] text-espresso/60 dark:text-alabaster/55 uppercase block">
                Johannesburg, South Africa
              </span>
              <span className="text-[9px] font-mono tracking-widest text-[#7c7265] dark:text-[#9a9088] uppercase block">
                Est. 2019 &bull; Portrait &bull; Editorial &bull; Campaigns
              </span>
            </div>

            {/* Cycle cover indicator */}
            <div className="hidden sm:flex flex-col gap-1 items-end">
              <span className="text-[9px] font-mono tracking-wider text-[#7c7265] dark:text-[#9a9088] uppercase">
                Active Cover Frame
              </span>
              <button
                onClick={() =>
                  setHeroBgIndex((prev) => (prev + 1) % portfolio.length)
                }
                className="text-[10px] font-mono uppercase font-bold text-accent-light dark:text-accent-dark hover:underline flex items-center gap-1 cursor-hover"
              >
                <span>
                  Frame #
                  {String((heroBgIndex % portfolio.length) + 1).padStart(
                    2,
                    "0",
                  )}
                </span>
                <span>→</span>
              </button>
            </div>
          </div>

          {/* Large Serif italic title with offsets */}
          <h1 className="text-[11vw] sm:text-[11.5vw] font-serif font-light italic leading-[0.82] tracking-tighter text-espresso dark:text-alabaster select-none uppercase">
            <span className="block translate-x-0 font-extralight">SHUTTER</span>
            <span className="block translate-x-[14%] text-accent-light dark:text-accent-dark">
              HAUS
            </span>
            <span className="block translate-x-[28%] font-extralight text-espresso/70 dark:text-alabaster/70">
              VISUALS
            </span>
          </h1>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 pt-8 border-t border-sand dark:border-dark-border/60">
            <div className="md:col-span-8">
              <p className="text-xs md:text-[13px] text-espresso/70 dark:text-alabaster/70 leading-relaxed font-light max-w-[480px]">
                Where light meets intention. photography that documents the
                high-contrast narratives only silence is patient enough to hold.
              </p>
            </div>
            <div className="md:col-span-4 flex justify-start md:justify-end items-end">
              <a
                href="#work"
                className="px-5 py-3 border border-accent-light dark:border-accent-dark text-accent-light dark:text-accent-dark text-[10px] font-mono tracking-widest uppercase hover:bg-accent-light hover:text-white dark:hover:bg-accent-dark dark:hover:text-cocoa transition-all font-bold cursor-hover"
              >
                <span>View Portfolio</span>
                <ArrowUpRight className="w-3.5 h-3.5 inline-block ml-1.5 -mt-0.5" />
              </a>
            </div>
          </div>
        </div>

        {/* Scrolling text prompt */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 pointer-events-none hidden md:flex">
          <span className="text-[9px] font-mono tracking-widest text-[#7c7265] dark:text-[#9a9088] uppercase">
            Scroll to descend
          </span>
          <div className="w-[1px] h-8 bg-gradient-to-b from-[#7c7265] to-transparent" />
        </div>
      </header>

      {/* MANIFESTO SECTION */}
      <section className="px-6 md:px-12 py-20 bg-oatmeal dark:bg-surface-1/30">
        <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
          <div className="md:col-span-2 text-6xl md:text-8xl font-serif text-accent-light/30 dark:text-accent-dark/30 leading-none">
            ”
          </div>
          <div className="md:col-span-10">
            <p className="font-serif font-light italic text-xl md:text-3xl leading-relaxed text-espresso dark:text-alabaster">
              We don't chase trends. We chase{" "}
              <em className="text-accent-light dark:text-accent-dark not-italic">
                light
              </em>{" "}
              — the kind that falls once, means something, and is gone before
              you can ask it to wait. Six years, Johannesburg roots, one
              obsession.
            </p>
          </div>
        </div>
      </section>

      {/* BRAND SEAL ARCHITECTURE */}
      <section className="py-28 bg-oatmeal dark:bg-cocoa border-t border-sand dark:border-dark-border/40 flex justify-center items-center overflow-hidden">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="px-6"
        >
          <ShutterhausLogo variant="stacked" />
        </motion.div>
      </section>

      {/* SERVICES SECTION */}
      <section
        id="services"
        className="px-6 md:px-12 py-24 border-t border-sand dark:border-dark-border max-w-7xl mx-auto relative"
      >
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-end mb-16">
          <div className="lg:col-span-5 space-y-2">
            <span className="text-[10px] font-mono tracking-[0.2em] text-[#7c7265] dark:text-[#9a9088] uppercase block">
              01 — What we shoot
            </span>
            <h2 className="text-3xl md:text-5xl font-serif italic font-light tracking-tight text-espresso dark:text-alabaster">
              Crafted for
              <br />
              every frame.
            </h2>
          </div>
          <div className="lg:col-span-7">
            <p className="text-xs md:text-sm text-[#7c7265] dark:text-[#9a9088] leading-relaxed max-w-[560px] font-light">
              From intimate studio portraiture to high-concept commercial
              spreads — every discipline, executed with spatial precision.
              Select any service line to begin custom curation.
            </p>
          </div>
        </div>

        {/* Interactive service list lines */}
        <div className="border-t border-sand dark:border-dark-border relative">
          {SERVICES_DATA.map((svc) => (
            <div
              key={svc.id}
              className="svrow border-b border-sand dark:border-dark-border py-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 transition-all duration-300 ease-expo cursor-hover"
              onClick={() =>
                handleSelectPackageForBooking(
                  svc.name,
                  `Disciplines: ${svc.bullets.join(", ")}`,
                )
              }
            >
              <div className="flex items-baseline gap-6 md:gap-12">
                <span className="text-[11px] font-mono text-accent-light dark:text-accent-dark font-bold">
                  {svc.num}
                </span>
                <h3 className="text-xl md:text-3xl font-serif italic font-light text-espresso dark:text-alabaster transition-colors duration-300 group-hover:text-accent-light">
                  {svc.name}
                </h3>
              </div>
              <p className="text-xs text-[#7c7265] dark:text-[#9a9088] font-light max-w-sm md:text-right leading-relaxed">
                {svc.detail}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* PORTFOLIO WORK SECTION */}
      <section
        id="work"
        className="px-6 md:px-12 py-24 border-t border-sand dark:border-dark-border max-w-7xl mx-auto"
      >
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-12">
          <div>
            <span className="text-[10px] font-mono tracking-[0.2em] text-[#7c7265] dark:text-[#9a9088] uppercase block mb-3">
              02 — Selected Curation
            </span>
            <h2 className="text-3xl md:text-5xl font-serif italic font-light tracking-tight text-espresso dark:text-alabaster">
              The portfolio.
            </h2>
          </div>

          <div className="flex items-center gap-4 text-[9px] font-mono uppercase bg-[#ece2d0]/20 dark:bg-[#1a1817]/40 border border-sand dark:border-dark-border p-2.5">
            <span className="font-bold text-accent-light dark:text-accent-dark">
              Curation Count: {portfolio.length}
            </span>
          </div>
        </div>

        {/* Category filtering buttons */}
        <div className="filters flex gap-1 mb-8 overflow-x-auto border-b border-sand dark:border-dark-border text-[10px] tracking-widest font-mono uppercase scrollbar-none">
          {(
            [
              "all",
              "portrait",
              "boudoir",
              "family",
              "event",
              "editorial",
            ] as Category[]
          ).map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`fb px-5 py-3 border-b-2 transition-colors cursor-hover whitespace-nowrap ${
                selectedCategory === cat
                  ? "border-accent-light text-accent-light dark:border-accent-dark dark:text-accent-dark font-bold"
                  : "border-transparent text-[#7c7265] dark:text-[#9a9088] hover:text-espresso dark:hover:text-alabaster"
              }`}
            >
              {cat === "all" ? "All Work" : cat.replace("-", " ")}
            </button>
          ))}
        </div>

        {/* Dynamic Pure CSS Masonry Grid */}
        <div className="masonry gap-4">
          <AnimatePresence mode="popLayout">
            {displayedItems.map((item) => {
              const originalIndex = filteredItems.findIndex(
                (i) => i.id === item.id,
              );
              // Assign varied organic aspect ratios to create a beautiful high-end staggered masonry flow
              const aspectClass =
                originalIndex % 3 === 0
                  ? "aspect-[4/5]"
                  : originalIndex % 3 === 1
                    ? "aspect-[3/2]"
                    : "aspect-square";

              return (
                <motion.div
                  key={item.id}
                  layout
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.4 }}
                  onClick={() => setLightboxIndex(originalIndex)}
                  className="gi group relative break-inside-avoid mb-4 border border-sand dark:border-dark-border hover:border-accent-light/50 dark:hover:border-accent-dark/50 bg-[#ece2d0]/10 dark:bg-surface-2 cursor-zoom-in overflow-hidden transition-all duration-300"
                >
                  <div className={`relative ${aspectClass} overflow-hidden`}>
                    {/* Fallback procedural canvas rendering */}
                    <canvas
                      ref={(el) => (canvasRefs.current[item.id] = el)}
                      width={320}
                      height={400}
                      className="gi-art absolute inset-0 w-full h-full object-cover transition-transform duration-[900ms] ease-expo"
                    />

                    {/* Loaded Unsplash/Custom image */}
                    <ResponsiveImage
                      src={item.imageUrl || ''}
                      alt={item.title}
                      title={`${item.title} - ${item.cameraSettings?.camera} ${item.cameraSettings?.lens} - ${item.cameraSettings?.aperture} ${item.cameraSettings?.shutterSpeed} ISO ${item.cameraSettings?.iso}`}
                      className="absolute inset-0 w-full h-full object-cover transition-all duration-[900ms] ease-expo filter grayscale contrast-[1.05] group-hover:scale-105 group-hover:grayscale-0 group-hover:contrast-100"
                    />

                    {/* Delete action for custom uploaded photographs */}
                    {item.id.startsWith("custom-") && (
                      <button
                        onClick={(e) => handleDeletePhoto(e, item.id)}
                        className="absolute top-3 right-3 z-30 p-2 bg-red-600/90 hover:bg-red-700 text-white rounded-none transition-colors duration-200 shadow-md cursor-hover"
                        title="Remove custom photo"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}

                    {/* Hover detail overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-5 z-20">
                      <div className="space-y-1 transform translate-y-3 group-hover:translate-y-0 transition-transform duration-300">
                        <p className="text-[10px] font-mono text-accent-light dark:text-accent-dark font-bold uppercase tracking-widest">
                          {item.location}
                        </p>
                        <h4 className="text-sm font-serif italic text-white font-medium">
                          {item.title}
                        </h4>
                        <div className="flex gap-3 items-center pt-1 border-t border-white/10 text-[9px] font-mono text-white/50">
                          <span className="flex items-center gap-1">
                            <Sliders className="w-2.5 h-2.5" />
                            <span>{item.cameraSettings.aperture}</span>
                          </span>
                          <span>{item.cameraSettings.shutterSpeed}</span>
                          <span>ISO {item.cameraSettings.iso}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

        {isMobile && filteredItems.length > 2 && (
          <div className="text-center mt-8">
            <button
              onClick={() => setPortfolioExpanded(!portfolioExpanded)}
              className="px-6 py-3 border border-espresso dark:border-alabaster text-espresso dark:text-alabaster text-[10px] font-mono uppercase tracking-widest hover:bg-espresso hover:text-white dark:hover:bg-alabaster dark:hover:text-cocoa transition-all font-bold cursor-hover"
            >
              {portfolioExpanded
                ? "Collapse Gallery"
                : `View Full Gallery (${filteredItems.length} photos)`}
            </button>
          </div>
        )}

        {filteredItems.length === 0 && (
          <div className="text-center py-20 border border-dashed border-sand dark:border-dark-border bg-sand/10 dark:bg-surface-1/10 font-mono">
            <span className="text-xs uppercase text-[#7c7265] dark:text-[#9a9088] block mb-4">
              No photographic assets match this segment
            </span>
            <button
              onClick={() => setSelectedCategory("all")}
              className="px-5 py-2.5 bg-accent-light dark:bg-accent-dark text-white dark:text-cocoa text-[10px] font-mono uppercase tracking-widest hover:opacity-95 transition-all font-bold cursor-hover"
            >
              Reset Filter
            </button>
          </div>
        )}
      </section>

      {/* ABOUT & LEAD PHOTOGRAPHER SECTION */}
      <section
        id="about"
        className="px-6 md:px-12 py-24 border-t border-sand dark:border-dark-border max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center"
      >
        {/* Curved portrait wrap */}
        <div className="lg:col-span-5 relative group overflow-hidden border border-sand dark:border-dark-border aspect-[3/4] bg-oatmeal dark:bg-surface-2">
          <ResponsiveImage
            src="https://drive.google.com/thumbnail?id=1dGo1hDouUsBn3CLQsB5cz-Ji40wzxgAI&sz=w1000"
            alt="Lead photographer Alwin"
            className="w-full h-full object-cover filter grayscale contrast-110 sepia-[0.1] group-hover:scale-[1.03]"
            onError={(e: any) => {
              (e.target as HTMLImageElement).src =
                "https://images.unsplash.com/photo-1540573133985-87b6da6d54a9?q=80&w=800&auto=format&fit=crop";
            }}
          />
          <div className="absolute bottom-4 left-4 right-4 bg-oatmeal/90 dark:bg-cocoa/90 border border-sand dark:border-dark-border p-4 z-20 font-mono">
            <p className="text-[9px] uppercase tracking-wider text-accent-light dark:text-accent-dark font-bold">
              Studio Founder
            </p>
            <span className="text-xs font-semibold uppercase block mt-1">
              Alwin &bull; Est. 2019
            </span>
          </div>
        </div>

        {/* Narrative & stats counters */}
        <div className="lg:col-span-7 space-y-8">
          <div className="space-y-2">
            <span className="text-[10px] font-mono tracking-[0.2em] text-[#7c7265] dark:text-[#9a9088] uppercase block">
              03 — The eye behind the lens
            </span>
            <blockquote className="text-xl md:text-3xl font-serif italic font-light leading-relaxed text-espresso dark:text-alabaster">
              "Light is the{" "}
              <em className="text-accent-light dark:text-accent-dark not-italic">
                language
              </em>
              . I just know how to listen."
            </blockquote>
          </div>

          <div className="text-xs md:text-sm text-[#7c7265] dark:text-[#9a9088] leading-relaxed font-light space-y-4 font-sans">
            <p>
              SHUTTERHAUS VISUALS is a Johannesburg-based studio rooted in the
              belief that a great image never begs for attention — it earns it.
              We blend technical precision with instinct honed over years of
              shooting across Africa and beyond.
            </p>
            <p>
              We operate exclusively on professional platforms to produce images
              of supreme density, depth, and spatial hierarchy. Our physical
              works appear in publications, campaigns, galleries and living
              rooms across two continents.
            </p>
          </div>

          {/* Seeded Counting Stats Grid */}
          <div className="grid grid-cols-3 gap-6 pt-8 border-t border-sand dark:border-dark-border font-mono">
            <div className="space-y-1">
              <span className="text-2xl md:text-4xl font-serif italic text-accent-light dark:text-accent-dark block">
                {animatedStats.projects}+
              </span>
              <p className="text-[9px] uppercase text-[#7c7265] dark:text-[#9a9088] tracking-widest">
                Completed Projects
              </p>
            </div>
            <div className="space-y-1">
              <span className="text-2xl md:text-4xl font-serif italic text-accent-light dark:text-accent-dark block">
                {animatedStats.years}+
              </span>
              <p className="text-[9px] uppercase text-[#7c7265] dark:text-[#9a9088] tracking-widest">
                Years Active
              </p>
            </div>
            <div className="space-y-1">
              <span className="text-2xl md:text-4xl font-serif italic text-accent-light dark:text-accent-dark block">
                {animatedStats.countries}
              </span>
              <p className="text-[9px] uppercase text-[#7c7265] dark:text-[#9a9088] tracking-widest">
                Countries Shot
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* PRICING & INVESTMENT SECTION */}
      <section
        id="pricing"
        className="px-6 md:px-12 py-24 border-t border-sand dark:border-dark-border max-w-7xl mx-auto space-y-16"
      >
        <div className="space-y-4">
          <span className="text-[10px] font-mono uppercase tracking-[0.25em] text-[#7c7265] dark:text-[#9a9088] block">
            04 — Investment
          </span>
          <h2 className="text-3xl md:text-5xl font-serif italic font-light text-espresso dark:text-alabaster">
            Simple, honest pricing.
          </h2>

          {/* Package Type standard vs retainer switcher */}
          <div className="flex items-center gap-4 pt-4 flex-wrap">
            <span
              className={`text-[10px] font-mono uppercase tracking-widest ${!isRetainer ? "text-espresso dark:text-alabaster font-bold" : "text-[#7c7265] dark:text-[#9a9088]"}`}
            >
              Standard Session
            </span>
            <button
              onClick={() => setIsRetainer(!isRetainer)}
              className={`w-12 h-6 flex items-center transition-colors rounded-full border border-sand dark:border-dark-border p-1 ${
                isRetainer
                  ? "bg-accent-light/10 border-accent-light/40 dark:bg-accent-dark/20 dark:border-accent-dark/40"
                  : "bg-transparent"
              }`}
              title="Toggle retainer discount mode"
            >
              <div
                className={`w-4 h-4 bg-accent-light dark:bg-accent-dark rounded-full transition-transform duration-300 ${
                  isRetainer ? "translate-x-6" : "translate-x-0"
                }`}
              />
            </button>
            <span
              className={`text-[10px] font-mono uppercase tracking-widest ${isRetainer ? "text-accent-light dark:text-accent-dark font-bold" : "text-[#7c7265] dark:text-[#9a9088]"}`}
            >
              Retainer Base
            </span>
            <span className="px-2 py-0.5 border border-accent-light/30 text-accent-light dark:border-accent-dark/30 text-[8px] font-mono uppercase">
              Save 20% on monthly contracts
            </span>
          </div>
        </div>

        {/* Curation package lists */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 font-mono text-xs">
          {LOCAL_PACKAGES.map((pkg) => {
            const price = isRetainer ? pkg.priceRetainerZar : pkg.priceZar;
            const detailsString = `Rate Mode: ${isRetainer ? "Retainer 20%" : "Standard"}\nDetails: ${pkg.imagesCount}\nDuration: ${pkg.duration}\nIncludes: ${pkg.features.join(", ")}`;
            return (
              <div
                key={pkg.id}
                className={`p-6 flex flex-col justify-between min-h-[400px] transition-all duration-300 border border-sand dark:border-dark-border hover:border-accent-light/50 dark:hover:border-accent-dark/50 ${
                  pkg.isPopular
                    ? "bg-accent-light/[0.03] dark:bg-accent-dark/[0.03] ring-1 ring-accent-light/20 dark:ring-accent-dark/20"
                    : "bg-[#ece2d0]/10 dark:bg-surface-2/20"
                }`}
              >
                <div className="space-y-4">
                  {pkg.isPopular && (
                    <span className="text-[8px] font-mono uppercase tracking-widest text-accent-light dark:text-accent-dark border border-accent-light/40 px-2 py-0.5 inline-block font-bold">
                      Recommended
                    </span>
                  )}
                  <h4 className="font-serif italic text-lg text-espresso dark:text-alabaster">
                    {pkg.name}
                  </h4>
                  <div className="space-y-0.5">
                    <p className="text-2xl font-serif italic font-bold text-accent-light dark:text-accent-dark">
                      R {price.toLocaleString("en-ZA")}
                    </p>
                    <p
                      className="text-[9px] text-[#7c7265] dark:text-[#9a9088] uppercase"
                      dangerouslySetInnerHTML={{ __html: pkg.duration }}
                    ></p>
                  </div>
                  <p className="text-[10px] text-[#7c7265] dark:text-[#9a9088] leading-relaxed font-sans font-light min-h-[44px]">
                    {pkg.idealFor}
                  </p>
                  <ul className="space-y-2 pt-4 border-t border-sand/40 dark:border-dark-border/40 text-[10px]">
                    {pkg.features.map((f, fidx) => (
                      <li
                        key={fidx}
                        className="text-[#7c7265] dark:text-[#9a9088] font-light leading-tight"
                      >
                        — {f}
                      </li>
                    ))}
                  </ul>
                </div>

                <button
                  onClick={() =>
                    handleSelectPackageForBooking(pkg.name, detailsString)
                  }
                  className={`w-full py-2.5 mt-8 text-[9px] font-mono uppercase tracking-widest transition-all font-bold cursor-hover ${
                    pkg.isPopular
                      ? "bg-accent-light dark:bg-accent-dark text-white dark:text-cocoa"
                      : "border border-sand dark:border-dark-border hover:bg-espresso hover:text-oatmeal dark:hover:bg-alabaster dark:hover:text-cocoa"
                  }`}
                >
                  Book package
                </button>
              </div>
            );
          })}
        </div>
      </section>

      {/* CONTACT & DISPATCHED OUTBOX SECTION */}
      <section
        id="contact"
        className="px-6 md:px-12 py-24 border-t border-sand dark:border-dark-border max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16"
      >
        <div className="lg:col-span-5 space-y-10">
          <div className="space-y-2">
            <span className="text-[10px] font-mono uppercase tracking-widest text-[#7c7265] dark:text-[#9a9088] block">
              05 — Get in touch
            </span>
            <h2 className="text-3xl md:text-5xl font-serif italic font-light leading-[1.08] text-espresso dark:text-alabaster">
              Let's build
              <br />
              something
              <br />
              extraordinary.
            </h2>
          </div>

          <div className="space-y-6 font-mono text-[11px]">
            <div>
              <p className="text-[8px] uppercase tracking-wider text-[#7c7265] dark:text-[#9a9088] mb-1">
                Email
              </p>
              <a
                href="mailto:hello@shutterhausvisuals.com"
                className="text-xs font-bold hover:text-accent-light dark:hover:text-accent-dark transition-colors"
              >
                hello@shutterhausvisuals.com
              </a>
            </div>
            <div>
              <p className="text-[8px] uppercase tracking-wider text-[#7c7265] dark:text-[#9a9088] mb-1">
                Phone
              </p>
              <a
                href="tel:+27110000000"
                className="text-xs font-bold hover:text-accent-light dark:hover:text-accent-dark transition-colors"
              >
                +27 11 000 0000
              </a>
            </div>
            <div>
              <p className="text-[8px] uppercase tracking-wider text-[#7c7265] dark:text-[#9a9088] mb-1">
                Studio
              </p>
              <p className="text-xs leading-relaxed text-espresso dark:text-alabaster">
                44 Fox Street, Maboneng
                <br />
                Johannesburg, 2094
              </p>
            </div>
            <div>
              <p className="text-[8px] uppercase tracking-wider text-[#7c7265] dark:text-[#9a9088] mb-1">
                Availability
              </p>
              <p className="text-xs text-accent-light dark:text-accent-dark font-bold">
                Booking Q3 2026 onwards
              </p>
            </div>
          </div>

          {/* Social spill triggers */}
          <div className="flex gap-2 flex-wrap pt-4">
            <a
              href="#"
              className="inline-flex items-center gap-1.5 border border-sand dark:border-dark-border px-3.5 py-2 text-[10px] font-mono uppercase text-[#7c7265] dark:text-[#9a9088] hover:border-accent-light hover:text-accent-light dark:hover:border-accent-dark dark:hover:text-accent-dark transition-colors cursor-hover"
            >
              Instagram
            </a>
            <a
              href="#"
              className="inline-flex items-center gap-1.5 border border-sand dark:border-dark-border px-3.5 py-2 text-[10px] font-mono uppercase text-[#7c7265] dark:text-[#9a9088] hover:border-accent-light hover:text-accent-light dark:hover:border-accent-dark dark:hover:text-accent-dark transition-colors cursor-hover"
            >
              LinkedIn
            </a>
            <a
              href="https://pixieset.com"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 border border-sand dark:border-dark-border bg-oatmeal/50 dark:bg-surface-1/40 px-3.5 py-2 text-[10px] font-mono uppercase text-accent-light dark:text-accent-dark hover:border-accent-light dark:hover:border-accent-dark transition-colors cursor-hover"
            >
              Pixieset Gallery
            </a>
          </div>
        </div>

        {/* Messaging outbox and input dispatch */}
        <div className="lg:col-span-7 space-y-8">
          {/* Custom high-contrast layout tab selector */}
          <div className="flex border border-sand dark:border-dark-border p-1 bg-oatmeal/60 dark:bg-surface-2/60">
            <button
              onClick={() => setActiveContactTab("booking")}
              className={`flex-1 py-2.5 text-center text-[10px] font-mono uppercase font-bold tracking-wider transition-all cursor-hover ${
                activeContactTab === "booking"
                  ? "bg-accent-light text-white dark:bg-accent-dark dark:text-cocoa shadow-sm"
                  : "text-[#7c7265] dark:text-[#9a9088] hover:text-espresso dark:hover:text-alabaster"
              }`}
            >
              Real-Time Booking Calendar
            </button>
            <button
              onClick={() => setActiveContactTab("message")}
              className={`flex-1 py-2.5 text-center text-[10px] font-mono uppercase font-bold tracking-wider transition-all cursor-hover ${
                activeContactTab === "message"
                  ? "bg-accent-light text-white dark:bg-accent-dark dark:text-cocoa shadow-sm"
                  : "text-[#7c7265] dark:text-[#9a9088] hover:text-espresso dark:hover:text-alabaster"
              }`}
            >
              General Message Inquiry
            </button>
          </div>

          <AnimatePresence mode="wait">
            {activeContactTab === "booking" ? (
              <motion.div
                key="booking-calendar-tab"
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                transition={{ duration: 0.2 }}
              >
                <BookingCalendar
                  onAddBooking={handleAddBooking}
                  bookings={bookings}
                  onDeleteBooking={handleDeleteBooking}
                  preSelectedPackage={preSelectedPackage}
                />
              </motion.div>
            ) : (
              <motion.div
                key="message-form-tab"
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                transition={{ duration: 0.2 }}
                className="border border-sand dark:border-dark-border p-6 md:p-8 bg-oatmeal dark:bg-surface-1/40 space-y-6"
              >
                <div className="flex justify-between items-center border-b border-sand dark:border-dark-border pb-4">
                  <span className="text-[10px] font-mono uppercase tracking-widest text-espresso dark:text-alabaster font-bold flex items-center gap-1.5">
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>Send a message</span>
                  </span>

                  {/* Message history log trigger */}
                  {sentMessages.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setShowInbox(!showInbox)}
                      className={`px-2.5 py-1 text-[9px] font-mono uppercase border transition-all cursor-hover ${
                        showInbox
                          ? "bg-accent-light text-white dark:bg-accent-dark dark:text-cocoa border-accent-light dark:border-accent-dark"
                          : "border-sand dark:border-dark-border text-espresso dark:text-alabaster hover:bg-sand/30"
                      }`}
                    >
                      History logs ({sentMessages.length})
                    </button>
                  )}
                </div>

                {/* Outbox drawer rendering log */}
                <AnimatePresence>
                  {showInbox && sentMessages.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="space-y-4 overflow-hidden border-b border-sand dark:border-dark-border pb-6"
                    >
                      <span className="text-[9px] font-mono tracking-wider text-[#7c7265] dark:text-[#9a9088] uppercase block">
                        Dispatched Outbox Records (Local Cache)
                      </span>

                      <div className="max-h-[220px] overflow-y-auto space-y-3 pr-2 scrollbar-none">
                        {sentMessages.map((msg) => (
                          <div
                            key={msg.id}
                            className="p-3.5 bg-oatmeal dark:bg-surface-2 border border-sand dark:border-dark-border text-[11px] font-mono space-y-2 relative group/msg"
                          >
                            <button
                              onClick={() => handleDeleteMessage(msg.id)}
                              className="absolute top-2.5 right-2.5 opacity-0 group-hover/msg:opacity-100 p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-all cursor-hover"
                              title="Delete message record"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>

                            <div className="flex justify-between text-[9px] text-[#7c7265] dark:text-[#9a9088] uppercase border-b border-sand/50 dark:border-dark-border/40 pb-1.5">
                              <span>
                                {msg.name} ({msg.service})
                              </span>
                              <span>{msg.timestamp}</span>
                            </div>
                            <p className="font-sans font-light text-espresso/80 dark:text-alabaster/80 leading-relaxed italic">
                              "{msg.text}"
                            </p>
                            <div className="text-[9px] text-accent-light dark:text-accent-dark font-bold leading-none">
                              Status: Dispatched &bull; Awaiting Review
                            </div>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* FORM */}
                <form onSubmit={handleFormSubmit} className="space-y-5">
                  {formSuccess && (
                    <div className="flex items-start gap-2.5 bg-green-500/10 border border-green-500/30 p-4 text-xs text-green-700 dark:text-green-400 font-mono">
                      <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                      <span>
                        Message dispatched successfully! A record has been
                        logged in your local Outbox history for absolute
                        verification.
                      </span>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[9px] tracking-wider uppercase font-mono text-[#7c7265] dark:text-[#9a9088]">
                        Your Name
                      </label>
                      <input
                        type="text"
                        required
                        value={formName}
                        onChange={(e) => setFormName(e.target.value)}
                        placeholder="e.g. Nadia Kamga"
                        className="bg-transparent border-b border-sand dark:border-dark-border focus:border-accent-light dark:focus:border-accent-dark outline-none py-2 text-xs"
                      />
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-[9px] tracking-wider uppercase font-mono text-[#7c7265] dark:text-[#9a9088]">
                        Email Address
                      </label>
                      <input
                        type="email"
                        required
                        value={formEmail}
                        onChange={(e) => setFormEmail(e.target.value)}
                        placeholder="you@email.com"
                        className="bg-transparent border-b border-sand dark:border-dark-border focus:border-accent-light dark:focus:border-accent-dark outline-none py-2 text-xs"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[9px] tracking-wider uppercase font-mono text-[#7c7265] dark:text-[#9a9088]">
                      Service required
                    </label>
                    <select
                      value={formService}
                      onChange={(e) => setFormService(e.target.value)}
                      className="bg-transparent border-b border-sand dark:border-dark-border focus:border-accent-light dark:focus:border-accent-dark outline-none py-2 text-xs cursor-pointer font-mono text-espresso dark:text-alabaster [&>option]:bg-oatmeal [&>option]:dark:bg-[#1a1817] [&>option]:text-espresso [&>option]:dark:text-alabaster"
                    >
                      <option value="Portrait — Natural Light Basic (R850)">
                        Portrait — Natural Light Basic (R850)
                      </option>
                      <option value="Event — Matric Farewell (R1,800)">
                        Event — Matric Farewell (R1,800)
                      </option>
                      <option value="Family — Family Shoots (R2,500)">
                        Family — Family Shoots (R2,500)
                      </option>
                      <option value="Portrait — Studio Portraiture (R1,850)">
                        Portrait — Studio Portraiture (R1,850)
                      </option>
                      <option value="Portrait — Sultry Boudoir (R3,500)">
                        Portrait — Sultry Boudoir (R3,500)
                      </option>
                      <option value="Editorial Elite (R8,500)">
                        Editorial Elite (R8,500)
                      </option>
                      <option value="Events — Corporate Booking">
                        Events & Occasions Coverage
                      </option>
                      <option value="Commercial — Campaign Booking">
                        Commercial & Brand Campaigns
                      </option>
                      <option value="Editorial — Series Curation">
                        Editorial & Fine Art Series
                      </option>
                      <option value="Custom Bespoke Campaign">
                        Custom Bespoke Campaign Calculator
                      </option>
                    </select>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[9px] tracking-wider uppercase font-mono text-[#7c7265] dark:text-[#9a9088]">
                      Your Vision
                    </label>
                    <textarea
                      required
                      value={formMessage}
                      onChange={(e) => setFormMessage(e.target.value)}
                      placeholder="Describe your project, mood, references, or timeline..."
                      className="bg-transparent border border-sand dark:border-dark-border focus:border-accent-light dark:focus:border-accent-dark outline-none p-3 text-xs h-28 resize-none"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full md:w-auto px-6 py-3 bg-accent-light dark:bg-accent-dark hover:opacity-95 text-white dark:text-cocoa text-[10px] tracking-widest font-mono uppercase font-bold flex items-center justify-center gap-1.5 cursor-hover"
                  >
                    <span>Send Message</span>
                    <Send className="w-3.5 h-3.5 shrink-0" />
                  </button>
                </form>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="px-6 md:px-12 py-8 border-t border-sand dark:border-dark-border max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
        <p className="text-[10px] text-[#7c7265] dark:text-[#9a9088] font-mono uppercase tracking-wider text-center md:text-left">
          © 2026 SHUTTERHAUS VISUALS &bull; Structured in Johannesburg, South
          Africa.
        </p>

        {/* Shutterhaus overlapping circles back-to-top branding mark */}
        <a
          href="#hero"
          className="group/ft flex items-center justify-center transition-transform hover:scale-110"
          title="Back to top"
        >
          <ShutterhausLogo
            variant="mark"
            iconSize={36}
            className="text-[#7c7265] dark:text-[#9a9088] hover:text-accent-light dark:hover:text-accent-dark transition-colors duration-500"
          />
        </a>

        <ul className="flex gap-6 text-[10px] font-mono uppercase tracking-wider text-[#7c7265] dark:text-[#9a9088]">
          <li>
            <a
              href="#"
              className="hover:text-espresso dark:hover:text-alabaster"
            >
              Instagram
            </a>
          </li>
          <li>
            <a
              href="#"
              className="hover:text-espresso dark:hover:text-alabaster"
            >
              LinkedIn
            </a>
          </li>
          <li>
            <a
              href="https://pixieset.com"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-espresso dark:hover:text-alabaster"
            >
              Pixieset
            </a>
          </li>
          <li>
            <Link
              to="/admin"
              className="hover:text-accent-light dark:hover:text-accent-dark"
            >
              Admin Login
            </Link>
          </li>
        </ul>
      </footer>

      {/* INTERACTIVE LIGHTBOX */}
      {lightboxIndex !== null && (
        <Lightbox
          item={filteredItems[lightboxIndex]}
          onClose={() => setLightboxIndex(null)}
          onNext={() =>
            setLightboxIndex((lightboxIndex + 1) % filteredItems.length)
          }
          onPrev={() =>
            setLightboxIndex(
              (lightboxIndex - 1 + filteredItems.length) % filteredItems.length,
            )
          }
        />
      )}

      {/* DYNAMIC IMAGE UPLOADER MODAL */}
      {isUploadOpen && (
        <ImageUploader
          onAddPhoto={handleAddPhoto}
          onClose={() => setIsUploadOpen(false)}
        />
      )}
    </div>
  );
}
