import { useState, useEffect, FormEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Calendar as CalendarIcon, 
  Clock, 
  Check, 
  ChevronLeft, 
  ChevronRight, 
  Sparkles, 
  Ticket, 
  Trash2,
  Mail,
  User,
  MessageSquare
} from 'lucide-react';
import { Booking } from '../types';

interface BookingCalendarProps {
  onAddBooking: (booking: Booking) => void;
  bookings: Booking[];
  onDeleteBooking: (id: string) => void;
  preSelectedPackage?: string;
}

export default function BookingCalendar({ 
  onAddBooking, 
  bookings, 
  onDeleteBooking,
  preSelectedPackage 
}: BookingCalendarProps) {
  // Use June 2026 as default to match the user's simulation date (or dynamic)
  const today = new Date(2026, 5, 23); // June 23, 2026
  const [currentDate, setCurrentDate] = useState(today);
  const [selectedDate, setSelectedDate] = useState<Date | null>(today);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string | null>(null);
  
  // Form states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [shootType, setShootType] = useState(preSelectedPackage || 'Couples & Families');

  useEffect(() => {
    if (preSelectedPackage) {
      setShootType(preSelectedPackage);
    }
  }, [preSelectedPackage]);
  const [vision, setVision] = useState('');
  const [isBookedSuccess, setIsBookedSuccess] = useState(false);
  const [lastBookingId, setLastBookingId] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);

  // Keep track of bookings made in this browser session/device to prevent privacy leaks
  const [myBookingIds, setMyBookingIds] = useState<string[]>(() => {
    const saved = localStorage.getItem('shutterhaus_my_booking_ids');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return [];
      }
    }
    return ['book-preseed-1']; // Pre-seed with the initial professional booking
  });

  const mySessions = bookings.filter(b => myBookingIds.includes(b.id));

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const getDaysInMonth = (y: number, m: number) => new Date(y, m + 1, 0).getDate();
  const getFirstDayOfMonth = (y: number, m: number) => new Date(y, m, 1).getDay();

  const daysInMonth = getDaysInMonth(year, month);
  const firstDayIndex = getFirstDayOfMonth(year, month);

  // Generate day items for grid
  const days = [];
  for (let i = 0; i < firstDayIndex; i++) {
    days.push(null); // padding for empty cells
  }
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(new Date(year, month, i));
  }

  const [gcalEvents, setGcalEvents] = useState<any[]>([]);

  useEffect(() => {
    const token = typeof window !== 'undefined' ? sessionStorage.getItem('googleAccessToken') : null;
    if (token) {
      const fetchGcal = async () => {
        try {
          const res = await fetch(
            `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${new Date().toISOString()}&orderBy=startTime&singleEvents=true&maxResults=50`,
            {
              headers: {
                'Authorization': `Bearer ${token}`,
              },
            }
          );
          if (res.ok) {
            const data = await res.json();
            setGcalEvents(data.items || []);
          }
        } catch (err) {
          console.warn("BookingCalendar: Failed to fetch GCal events:", err);
        }
      };
      fetchGcal();
    }
  }, [bookings]);

  const parseSlotToTimes = (date: Date, slotTime: string) => {
    try {
      const year = date.getFullYear();
      const monthIndex = date.getMonth();
      const day = date.getDate();
      
      const timeParts = slotTime.split(' ');
      const hhmm = timeParts[0].split(':');
      let hour = parseInt(hhmm[0], 10);
      const min = hhmm[1] ? parseInt(hhmm[1], 10) : 0;
      const ampm = timeParts[1] ? timeParts[1].toUpperCase() : 'AM';
      
      if (ampm === 'PM' && hour < 12) hour += 12;
      if (ampm === 'AM' && hour === 12) hour = 0;
      
      const startDate = new Date(year, monthIndex, day, hour, min, 0);
      const endDate = new Date(startDate.getTime() + 2 * 60 * 60 * 1000); // 2 hours
      
      return {
        start: startDate.toISOString(),
        end: endDate.toISOString()
      };
    } catch (e) {
      return null;
    }
  };

  const isSlotBlocked = (date: Date, slotTime: string) => {
    const dateString = date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
    
    // Check local Firestore bookings
    const isBookedInFirestore = bookings.some(b => 
      b.date === dateString && 
      b.timeSlot === slotTime
    );
    
    if (isBookedInFirestore) return true;

    // Check Google Calendar events if they overlap
    if (gcalEvents && gcalEvents.length > 0) {
      const slotTimes = parseSlotToTimes(date, slotTime);
      if (slotTimes) {
        const slotStart = new Date(slotTimes.start).getTime();
        const slotEnd = new Date(slotTimes.end).getTime();

        return gcalEvents.some(event => {
          const eventStartStr = event.start?.dateTime || event.start?.date;
          const eventEndStr = event.end?.dateTime || event.end?.date;
          if (!eventStartStr || !eventEndStr) return false;

          const eventStart = new Date(eventStartStr).getTime();
          const eventEnd = new Date(eventEndStr).getTime();

          // Overlap check
          return (slotStart < eventEnd) && (slotEnd > eventStart);
        });
      }
    }

    return false;
  };

  // Determine availability status deterministically based on date
  const getAvailabilityStatus = (date: Date) => {
    // Past dates
    if (date < new Date(2026, 5, 23)) {
      return { label: 'Fully Booked', color: 'text-gray-400 dark:text-gray-600 bg-gray-500/5', status: 'past' };
    }
    
    const dateString = date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });

    const blockedSlotsCount = [
      '09:00 AM',
      '11:30 AM',
      '02:00 PM',
      '04:30 PM'
    ].filter(time => isSlotBlocked(date, time)).length;

    if (blockedSlotsCount >= 4) {
      return { label: 'Fully Booked', color: 'text-red-500 bg-red-500/10 border-red-500/20', status: 'booked' };
    }

    if (blockedSlotsCount === 3) {
      return { label: '1 Slot Available', color: 'text-accent-light dark:text-accent-dark bg-accent-light/10 border-accent-light/20', status: 'limited' };
    }

    if (blockedSlotsCount === 2) {
      return { label: '2 Slots Available', color: 'text-accent-light dark:text-accent-dark bg-accent-light/10 border-accent-light/20', status: 'limited' };
    }

    if (blockedSlotsCount === 1) {
      return { label: '3 Slots Available', color: 'text-green-600 dark:text-green-400 bg-green-500/10 border-green-500/20', status: 'available' };
    }

    return { label: 'Available', color: 'text-green-600 dark:text-green-400 bg-green-500/10 border-green-500/20', status: 'available' };
  };

  const handlePrevMonth = () => {
    const prev = new Date(year, month - 1, 1);
    // Don't go before today's month
    if (prev >= new Date(2026, 4, 1)) {
      setCurrentDate(prev);
    }
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const timeSlots = [
    { time: '09:00 AM', desc: 'Morning Natural Softlight' },
    { time: '11:30 AM', desc: 'Crisp Midday Architectural High Key' },
    { time: '02:00 PM', desc: 'Pre-Sunset Directional Warmth' },
    { time: '04:30 PM', desc: 'Golden Hour & Twilight Splay' }
  ];

  const handleBookingSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!selectedDate || !selectedTimeSlot || !name.trim() || !email.trim()) return;

    const formattedDate = selectedDate.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });

    const bookingId = `book-${Date.now()}`;
    const newBooking: Booking = {
      id: bookingId,
      name: name.trim(),
      email: email.trim(),
      service: shootType,
      date: formattedDate,
      timeSlot: selectedTimeSlot,
      vision: vision.trim() || 'Custom fine-art session',
      timestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) + ' · ' + new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      status: 'Pending Review',
      rawStatus: 'pending'
    };

    onAddBooking(newBooking);
    const updatedIds = [...myBookingIds, bookingId];
    setMyBookingIds(updatedIds);
    localStorage.setItem('shutterhaus_my_booking_ids', JSON.stringify(updatedIds));

    setLastBookingId(bookingId);
    setIsBookedSuccess(true);
    
    // Reset forms partly
    setName('');
    setEmail('');
    setVision('');
  };

  const handleCancelBooking = (id: string) => {
    onDeleteBooking(id);
    const updatedIds = myBookingIds.filter(item => item !== id);
    setMyBookingIds(updatedIds);
    localStorage.setItem('shutterhaus_my_booking_ids', JSON.stringify(updatedIds));
  };

  const activeSuccessBooking = bookings.find(b => b.id === lastBookingId);

  return (
    <div id="booking-assistant" className="border border-sand dark:border-dark-border p-6 md:p-8 bg-oatmeal dark:bg-surface-1/40 space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center border-b border-sand dark:border-dark-border pb-4">
        <span className="text-[10px] font-mono uppercase tracking-widest text-espresso dark:text-alabaster font-bold flex items-center gap-2">
          <CalendarIcon className="w-4 h-4 text-accent-light dark:text-accent-dark" />
          <span>Real-time Booking Assistant</span>
        </span>
        
        {mySessions.length > 0 && (
          <button
            type="button"
            onClick={() => setShowHistory(!showHistory)}
            className={`px-3 py-1.5 text-[9px] font-mono uppercase border transition-all cursor-hover flex items-center gap-1.5 font-bold ${
              showHistory 
                ? 'bg-accent-light text-white dark:bg-accent-dark dark:text-black border-accent-light dark:border-accent-dark' 
                : 'border-sand dark:border-dark-border text-espresso dark:text-alabaster hover:bg-sand/30'
            }`}
          >
            <Ticket className="w-3.5 h-3.5" />
            <span>My Bookings ({mySessions.length})</span>
          </button>
        )}
      </div>

      {/* Booking History Drawer */}
      <AnimatePresence>
        {showHistory && mySessions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-4 overflow-hidden border-b border-sand dark:border-dark-border pb-6"
          >
            <div className="flex justify-between items-center">
              <span className="text-[9px] font-mono tracking-wider text-[#7c7265] dark:text-[#9a9088] uppercase font-bold">
                Your Confirmed Shoot Schedule
              </span>
              <span className="text-[9px] font-mono text-accent-light dark:text-accent-dark font-bold uppercase">
                Offline Local-Vault Secured
              </span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[300px] overflow-y-auto pr-2 scrollbar-none">
              {mySessions.map((book) => (
                <div 
                  key={book.id} 
                  className="p-4 bg-[#ece2d0]/30 dark:bg-surface-2 border border-sand dark:border-dark-border text-[11px] font-mono space-y-3 relative group/booking hover:border-accent-light/40 dark:hover:border-accent-dark/40 transition-colors"
                >
                  <button
                    onClick={() => handleCancelBooking(book.id)}
                    className="absolute top-3 right-3 opacity-0 group-hover/booking:opacity-100 p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-all cursor-hover"
                    title="Cancel Booking"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                  
                  <div className="flex justify-between border-b border-sand dark:border-dark-border/40 pb-2">
                    <span className="font-bold text-accent-light dark:text-accent-dark uppercase text-[10px]">
                      {book.service}
                    </span>
                    <span className="text-espresso/60 dark:text-alabaster/60">{book.timestamp}</span>
                  </div>

                  <div className="space-y-1 font-sans">
                    <p className="text-xs font-semibold text-espresso dark:text-alabaster flex items-center gap-1.5">
                      <CalendarIcon className="w-3.5 h-3.5 text-accent-light dark:text-accent-dark" />
                      <span>{book.date}</span>
                    </p>
                    <p className="text-xs text-espresso/80 dark:text-alabaster/80 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-accent-light dark:text-accent-dark" />
                      <span>{book.timeSlot}</span>
                    </p>
                  </div>

                  {book.vision && (
                    <p className="font-sans font-light text-[11px] text-espresso/70 dark:text-alabaster/70 bg-oatmeal/20 dark:bg-black/10 p-2 border border-sand/50 dark:border-dark-border/30 italic">
                      "{book.vision}"
                    </p>
                  )}

                  <div className="flex items-center gap-1 text-[9px] font-bold uppercase">
                    {book.status === 'Confirmed' ? (
                      <>
                        <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                        <span className="text-green-600 dark:text-green-400">Confirmed · Digital Pass Active</span>
                      </>
                    ) : (
                      <>
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                        <span className="text-amber-600 dark:text-amber-400">Pending Review · Vault Hold</span>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        {isBookedSuccess && activeSuccessBooking ? (
          <motion.div
            key="success-receipt"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            className="border-2 border-dashed border-accent-light/40 dark:border-accent-dark/40 bg-oatmeal dark:bg-surface-2 p-6 md:p-8 space-y-6 text-center max-w-xl mx-auto"
          >
            <div className="w-12 h-12 bg-green-500/10 text-green-600 dark:text-green-400 rounded-full flex items-center justify-center mx-auto text-xl font-bold">
              <Check className="w-6 h-6" />
            </div>

            <div className="space-y-2">
              <span className="text-[10px] font-mono uppercase tracking-widest text-accent-light dark:text-accent-dark font-bold block">
                {activeSuccessBooking.status === 'Confirmed' ? 'Session Confirmed' : 'Booking Requested'}
              </span>
              <h3 className="text-xl md:text-2xl font-serif italic text-espresso dark:text-alabaster">
                {activeSuccessBooking.status === 'Confirmed' ? 'We are locked in.' : 'Request Submitted.'}
              </h3>
              <p className="text-xs text-[#7c7265] dark:text-[#9a9088] font-sans max-w-sm mx-auto leading-relaxed">
                {activeSuccessBooking.status === 'Confirmed'
                  ? 'Your bespoke photo shoot session has been secured in our schedule. A confirmation copy is saved in your offline portal logs.'
                  : 'Your bespoke photo shoot request has been submitted to the vault. Our admin will review and confirm your slot shortly.'}
              </p>
            </div>

            {/* Custom Digital Ticket */}
            <div className="border border-sand dark:border-dark-border bg-oatmeal dark:bg-surface-1 p-5 text-left font-mono text-[11px] space-y-4 relative overflow-hidden">
              {/* Ticket cutouts */}
              <div className="absolute top-1/2 -left-3 w-6 h-6 rounded-full bg-oatmeal dark:bg-surface-2 border border-sand dark:border-dark-border -translate-y-1/2"></div>
              <div className="absolute top-1/2 -right-3 w-6 h-6 rounded-full bg-oatmeal dark:bg-surface-2 border border-sand dark:border-dark-border -translate-y-1/2"></div>

              <div className="flex justify-between items-baseline border-b border-sand dark:border-dark-border pb-2.5">
                <span className="text-[12px] font-bold text-accent-light dark:text-accent-dark uppercase">
                  SHUTTERHAUS PASS
                </span>
                <span className="text-[9px] text-[#7c7265] dark:text-[#9a9088] uppercase">
                  #{activeSuccessBooking.id.toUpperCase()}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4 py-1.5">
                <div>
                  <p className="text-[8px] uppercase tracking-wider text-[#7c7265] dark:text-[#9a9088]">Client</p>
                  <p className="text-xs font-bold text-espresso dark:text-alabaster truncate">{activeSuccessBooking.name}</p>
                </div>
                <div>
                  <p className="text-[8px] uppercase tracking-wider text-[#7c7265] dark:text-[#9a9088]">Session Type</p>
                  <p className="text-xs font-bold text-espresso dark:text-alabaster truncate">{activeSuccessBooking.service}</p>
                </div>
                <div>
                  <p className="text-[8px] uppercase tracking-wider text-[#7c7265] dark:text-[#9a9088]">Scheduled Date</p>
                  <p className="text-xs font-bold text-espresso dark:text-alabaster">{activeSuccessBooking.date}</p>
                </div>
                <div>
                  <p className="text-[8px] uppercase tracking-wider text-[#7c7265] dark:text-[#9a9088]">Assigned Slot</p>
                  <p className="text-xs font-bold text-espresso dark:text-alabaster">{activeSuccessBooking.timeSlot}</p>
                </div>
              </div>

              <div className="border-t border-sand dark:border-dark-border/40 pt-2.5 flex justify-between items-center text-[9px] font-bold uppercase text-green-600 dark:text-green-400">
                {activeSuccessBooking.status === 'Confirmed' ? (
                  <span className="text-green-600 dark:text-green-400">STATUS: SECURED & GUARANTEED</span>
                ) : (
                  <span className="text-amber-600 dark:text-amber-400">STATUS: PENDING REVIEW</span>
                )}
                <span>Q3 2026 RELEASE</span>
              </div>
            </div>

            <div className="flex gap-3 justify-center pt-2">
              <button
                type="button"
                onClick={() => setIsBookedSuccess(false)}
                className="px-5 py-2.5 border border-sand dark:border-dark-border hover:border-espresso dark:hover:border-alabaster text-espresso dark:text-alabaster text-[10px] font-mono tracking-widest uppercase transition-all font-bold cursor-hover"
              >
                Book Another Slot
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowHistory(true);
                  setIsBookedSuccess(false);
                }}
                className="px-5 py-2.5 bg-accent-light dark:bg-accent-dark text-white dark:text-black text-[10px] font-mono tracking-widest uppercase transition-all font-bold cursor-hover"
              >
                View Booking Log
              </button>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="calendar-flow"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start"
          >
            {/* Calendar grid view */}
            <div className="lg:col-span-7 space-y-6">
              {/* Calendar Navigator */}
              <div className="flex justify-between items-center">
                <div className="space-y-1">
                  <span className="text-[9px] font-mono uppercase tracking-widest text-[#7c7265] dark:text-[#9a9088] block">
                    Choose Your Preferred Date
                  </span>
                  <h3 className="text-lg md:text-xl font-serif text-espresso dark:text-alabaster font-semibold">
                    {monthNames[month]} {year}
                  </h3>
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handlePrevMonth}
                    disabled={month === 5 && year === 2026} // Don't go before June 2026
                    className="w-8 h-8 border border-sand dark:border-dark-border hover:border-accent-light dark:hover:border-accent-dark flex items-center justify-center transition-colors disabled:opacity-30 disabled:pointer-events-none cursor-hover"
                    title="Previous Month"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={handleNextMonth}
                    className="w-8 h-8 border border-sand dark:border-dark-border hover:border-accent-light dark:hover:border-accent-dark flex items-center justify-center transition-colors cursor-hover"
                    title="Next Month"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Day Labels */}
              <div className="grid grid-cols-7 gap-1.5 text-center text-[10px] font-mono uppercase font-bold text-[#7c7265] dark:text-[#9a9088] border-b border-sand/40 dark:border-dark-border/40 pb-2">
                <span>Sun</span>
                <span>Mon</span>
                <span>Tue</span>
                <span>Wed</span>
                <span>Thu</span>
                <span>Fri</span>
                <span>Sat</span>
              </div>

              {/* Days Grid */}
              <div className="grid grid-cols-7 gap-1.5">
                {days.map((date, idx) => {
                  if (!date) {
                    return <div key={`empty-${idx}`} className="aspect-square bg-transparent"></div>;
                  }

                  const isSelected = selectedDate && date.getDate() === selectedDate.getDate() && date.getMonth() === selectedDate.getMonth() && date.getFullYear() === selectedDate.getFullYear();
                  const isCurrentDay = date.getDate() === today.getDate() && date.getMonth() === today.getMonth() && date.getFullYear() === today.getFullYear();
                  
                  const statusInfo = getAvailabilityStatus(date);
                  const isBooked = statusInfo.status === 'booked';
                  const isPast = statusInfo.status === 'past';

                  return (
                    <button
                      key={`day-${date.getDate()}`}
                      type="button"
                      disabled={isPast}
                      onClick={() => {
                        setSelectedDate(date);
                        setSelectedTimeSlot(null); // Reset timeslot on day change
                      }}
                      className={`group relative aspect-square p-1.5 border flex flex-col justify-between transition-all ${
                        isPast 
                          ? 'border-sand/20 dark:border-dark-border/10 opacity-30 cursor-not-allowed bg-transparent'
                          : isSelected
                            ? 'border-accent-light bg-accent-light/[0.04] dark:border-accent-dark dark:bg-accent-dark/[0.04]'
                            : isBooked
                              ? 'border-red-500/20 bg-red-500/[0.01]'
                              : 'border-sand dark:border-dark-border hover:border-accent-light dark:hover:border-accent-dark hover:bg-accent-light/[0.02] dark:hover:bg-accent-dark/[0.01]'
                      } cursor-hover`}
                    >
                      <div className="flex justify-between items-start w-full">
                        <span className={`text-[11px] font-mono ${
                          isPast 
                            ? 'text-gray-400 line-through' 
                            : isSelected 
                              ? 'text-accent-light dark:text-accent-dark font-bold' 
                              : 'text-espresso dark:text-alabaster'
                        }`}>
                          {date.getDate()}
                        </span>
                        {isCurrentDay && (
                          <span className="w-1 h-1 rounded-full bg-accent-light dark:bg-accent-dark" title="Today"></span>
                        )}
                      </div>

                      {/* Dot indicator for status */}
                      <div className="w-full flex items-center justify-center pb-0.5">
                        <span className={`w-1 h-1 rounded-full ${
                          isPast 
                            ? 'bg-gray-300' 
                            : isBooked 
                              ? 'bg-red-500' 
                              : statusInfo.status === 'limited' 
                                ? 'bg-accent-light dark:bg-accent-dark' 
                                : 'bg-green-500'
                        }`}></span>
                      </div>

                      {/* Hover tooltip with status details */}
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 px-2 py-1 bg-espresso dark:bg-surface-2 text-white dark:text-alabaster text-[9px] font-mono uppercase tracking-wider rounded shadow-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 whitespace-nowrap">
                        {statusInfo.label}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Legends */}
              <div className="flex justify-start gap-4 flex-wrap text-[9px] font-mono uppercase text-[#7c7265] dark:text-[#9a9088] pt-2">
                <span className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                  <span>Available slots</span>
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-accent-light dark:bg-accent-dark"></span>
                  <span>Last Slot Remaining</span>
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
                  <span>Fully Booked / Closed</span>
                </span>
              </div>
            </div>

            {/* Shoot Type & Slot Selection Form */}
            <div className="lg:col-span-5 space-y-6">
              {selectedDate ? (
                <div className="space-y-6">
                  {/* Selected date label */}
                  <div className="border-b border-sand dark:border-dark-border pb-3">
                    <span className="text-[9px] font-mono uppercase tracking-widest text-[#7c7265] dark:text-[#9a9088] block">
                      Target Session Date
                    </span>
                    <h4 className="text-md md:text-lg font-serif italic text-accent-light dark:text-accent-dark font-semibold">
                      {selectedDate.toLocaleDateString('en-US', {
                        weekday: 'long',
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </h4>
                  </div>

                  {/* Availability status line */}
                  {getAvailabilityStatus(selectedDate).status === 'booked' ? (
                    <div className="p-4 bg-red-500/5 border border-red-500/20 text-xs font-mono text-red-600 dark:text-red-400">
                      We are fully booked on this date. Please pick another available calendar block.
                    </div>
                  ) : (
                    <>
                      {/* Select time slots */}
                      <div className="space-y-3">
                        <label className="text-[9px] tracking-wider uppercase font-mono text-[#7c7265] dark:text-[#9a9088] block">
                          Select Time Block
                        </label>
                        <div className="grid grid-cols-1 gap-2.5">
                          {timeSlots.map((slot) => {
                            const isSlotSelected = selectedTimeSlot === slot.time;
                            const isBlocked = isSlotBlocked(selectedDate, slot.time);
                            return (
                              <button
                                key={slot.time}
                                type="button"
                                disabled={isBlocked}
                                onClick={() => setSelectedTimeSlot(slot.time)}
                                className={`p-3 text-left border flex flex-col justify-center transition-all ${
                                  isBlocked
                                    ? 'border-red-500/20 bg-red-500/[0.02] opacity-60 cursor-not-allowed'
                                    : isSlotSelected
                                      ? 'border-accent-light bg-accent-light/[0.04] dark:border-accent-dark dark:bg-accent-dark/[0.04]'
                                      : 'border-sand dark:border-dark-border hover:border-accent-light dark:hover:border-accent-dark hover:bg-sand/10 dark:hover:bg-surface-2/40'
                                } cursor-hover`}
                              >
                                <div className="flex justify-between items-baseline">
                                  <span className={`text-[11px] font-mono font-bold ${
                                    isBlocked
                                      ? 'text-red-500 line-through'
                                      : isSlotSelected
                                        ? 'text-accent-light dark:text-accent-dark'
                                        : 'text-espresso dark:text-alabaster'
                                  }`}>
                                    {slot.time}
                                  </span>
                                  <span className={`text-[8px] font-mono uppercase tracking-wider ${
                                    isBlocked ? 'text-red-500 font-bold' : 'text-[#7c7265] dark:text-[#9a9088]'
                                  }`}>
                                    {isBlocked ? 'Locked / Booked' : 'Open Block'}
                                  </span>
                                </div>
                                <span className={`text-[10px] font-sans mt-1 ${
                                  isBlocked ? 'text-red-500/60 line-through' : 'text-espresso/70 dark:text-alabaster/70'
                                }`}>
                                  {isBlocked ? 'This slot is approved & locked by another client.' : slot.desc}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Confirming slot form */}
                      {selectedTimeSlot && (
                        <form onSubmit={handleBookingSubmit} className="space-y-4 pt-4 border-t border-sand dark:border-dark-border/40">
                          {/* Name Input */}
                          <div className="flex flex-col gap-1.5">
                            <label className="text-[9px] tracking-wider uppercase font-mono text-[#7c7265] dark:text-[#9a9088]">
                              Your Name
                            </label>
                            <div className="relative">
                              <User className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#7c7265] dark:text-[#9a9088]" />
                              <input
                                type="text"
                                required
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="e.g. Nadia Kamga"
                                className="w-full bg-transparent border-b border-sand dark:border-dark-border focus:border-accent-light dark:focus:border-accent-dark outline-none py-2 pl-8 text-xs font-sans text-espresso dark:text-alabaster"
                              />
                            </div>
                          </div>

                          {/* Email Input */}
                          <div className="flex flex-col gap-1.5">
                            <label className="text-[9px] tracking-wider uppercase font-mono text-[#7c7265] dark:text-[#9a9088]">
                              Email Address
                            </label>
                            <div className="relative">
                              <Mail className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#7c7265] dark:text-[#9a9088]" />
                              <input
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="you@email.com"
                                className="w-full bg-transparent border-b border-sand dark:border-dark-border focus:border-accent-light dark:focus:border-accent-dark outline-none py-2 pl-8 text-xs font-sans text-espresso dark:text-alabaster"
                              />
                            </div>
                          </div>

                          {/* Shoot Type Select */}
                          <div className="flex flex-col gap-1.5">
                            <label className="text-[9px] tracking-wider uppercase font-mono text-[#7c7265] dark:text-[#9a9088]">
                              Shoot Category
                            </label>
                            <select
                              value={shootType}
                              onChange={(e) => setShootType(e.target.value)}
                              className="bg-transparent border-b border-sand dark:border-dark-border focus:border-accent-light dark:focus:border-accent-dark outline-none py-2 text-xs cursor-pointer font-mono text-espresso dark:text-alabaster [&>option]:bg-oatmeal [&>option]:dark:bg-[#1a1817] [&>option]:text-espresso [&>option]:dark:text-alabaster"
                            >
                              <option value="Natural Light Basic">Natural Light Basic (R850)</option>
                              <option value="Matric Farewell">Matric Farewell (R1,800)</option>
                              <option value="Family Shoots">Family Shoots (R2,500)</option>
                              <option value="Studio Portraiture">Studio Portraiture (R1,850)</option>
                              <option value="Sultry Boudoir">Sultry Boudoir (R3,500)</option>
                              <option value="Editorial Elite">Editorial Elite (R8,500)</option>
                            </select>
                          </div>

                          {/* Vision Input */}
                          <div className="flex flex-col gap-1.5">
                            <label className="text-[9px] tracking-wider uppercase font-mono text-[#7c7265] dark:text-[#9a9088]">
                              Session Vision
                            </label>
                            <textarea
                              value={vision}
                              onChange={(e) => setVision(e.target.value)}
                              placeholder="Describe your desired theme, location, mood, or outfit styles..."
                              className="bg-transparent border border-sand dark:border-dark-border focus:border-accent-light dark:focus:border-accent-dark outline-none p-3 text-xs h-20 resize-none font-sans text-espresso dark:text-alabaster"
                            />
                          </div>

                          {/* Lock In Button */}
                          <button
                            type="submit"
                            className="w-full py-3 mt-2 bg-accent-light dark:bg-accent-dark hover:opacity-95 text-white dark:text-black text-[10px] tracking-widest font-mono uppercase font-bold flex items-center justify-center gap-1.5 cursor-hover"
                          >
                            <span>Lock In Session</span>
                            <Sparkles className="w-3.5 h-3.5 shrink-0" />
                          </button>
                        </form>
                      )}
                    </>
                  )}
                </div>
              ) : (
                <div className="text-center py-12 border border-dashed border-sand dark:border-dark-border flex flex-col items-center justify-center p-6 text-espresso/60 dark:text-alabaster/60 space-y-3">
                  <CalendarIcon className="w-8 h-8 text-[#7c7265] dark:text-[#9a9088]" />
                  <p className="text-xs font-mono uppercase tracking-wider">
                    Select a calendar block to secure custom curation
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
