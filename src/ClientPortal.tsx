import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { LogOut, Calendar, Clock, Camera } from 'lucide-react';
import { auth, db } from './firebase';
import { onAuthStateChanged, signInWithPopup, GoogleAuthProvider, signOut, User } from 'firebase/auth';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { Booking } from './types';

export default function ClientPortal() {
  const [user, setUser] = useState<User | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (user) {
      const q = query(collection(db, 'bookings'), where('email', '==', user.email));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const bookedItems: Booking[] = [];
        snapshot.forEach((doc) => {
          bookedItems.push({ id: doc.id, ...doc.data() } as Booking);
        });
        setBookings(bookedItems);
      });
      return () => unsubscribe();
    }
  }, [user]);

  const handleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error: any) {
      console.error("Login failed", error);
      alert("Login failed: " + error.message);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Logout failed", error);
    }
  };

  if (loading) return <div className="min-h-screen bg-oatmeal flex items-center justify-center text-espresso font-mono uppercase tracking-widest text-xs">Loading...</div>;

  if (!user) {
    return (
      <div className="min-h-screen bg-oatmeal dark:bg-cocoa flex items-center justify-center p-6 text-espresso dark:text-alabaster font-sans">
        <div className="max-w-md w-full bg-white dark:bg-surface-1 p-8 border border-sand dark:border-dark-border text-center space-y-6">
          <h1 className="text-xl font-serif font-light italic tracking-tighter">SHUTTERHAUS VISUALS</h1>
          <p className="text-xs font-mono uppercase tracking-widest text-[#7c7265] dark:text-[#9a9088]">Client Portal</p>
          <button 
            onClick={handleLogin}
            className="w-full py-3 bg-accent-light dark:bg-accent-dark text-white dark:text-cocoa text-[10px] tracking-widest font-mono uppercase font-bold hover:opacity-95 transition-all flex justify-center items-center gap-2"
          >
            <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="w-4 h-4">
              <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
              <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
              <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
              <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
              <path fill="none" d="M0 0h48v48H0z"></path>
            </svg>
            Sign In with Google
          </button>
          <Link to="/" className="block mt-4 text-[10px] font-mono tracking-widest uppercase hover:underline">Return to Home</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-oatmeal dark:bg-cocoa text-espresso dark:text-alabaster font-sans">
      <nav className="border-b border-sand dark:border-dark-border bg-white dark:bg-surface-1 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-lg font-serif italic tracking-tighter">Client Portal</h1>
            <span className="hidden md:block text-[10px] font-mono uppercase tracking-widest text-[#7c7265] dark:text-[#9a9088]">
              {user.email}
            </span>
          </div>
          <div className="flex items-center gap-6">
            <Link to="/" className="text-xs font-mono uppercase tracking-widest hover:text-accent-light dark:hover:text-accent-dark transition-colors">
              Main Site
            </Link>
            <button 
              onClick={handleLogout}
              className="text-xs font-mono uppercase tracking-widest flex items-center gap-2 hover:text-accent-light dark:hover:text-accent-dark transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              Sign Out
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 py-12">
        <h2 className="text-3xl font-light tracking-tight mb-8">Your Bookings</h2>
        
        {bookings.length === 0 ? (
          <div className="bg-white dark:bg-surface-1 border border-sand dark:border-dark-border p-12 text-center">
            <p className="text-[#7c7265] dark:text-[#9a9088] font-mono uppercase tracking-widest text-xs mb-4">No bookings found</p>
            <a href="/#services" className="inline-block bg-accent-light dark:bg-accent-dark text-white py-3 px-6 text-[10px] font-mono uppercase tracking-widest">
              Explore Services
            </a>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {bookings.map((booking) => (
              <motion.div 
                key={booking.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white dark:bg-surface-1 border border-sand dark:border-dark-border p-6 flex flex-col justify-between"
              >
                <div>
                  <div className="flex justify-between items-start mb-4">
                    <span className="text-[10px] font-mono uppercase tracking-widest bg-sand/30 dark:bg-dark-border/30 px-2 py-1">
                      {booking.status || 'Pending'}
                    </span>
                    <Camera className="w-4 h-4 text-accent-light dark:text-accent-dark" />
                  </div>
                  <h3 className="text-xl font-medium mb-2">{booking.service}</h3>
                  <div className="space-y-2 mt-4 text-sm text-[#7c7265] dark:text-[#9a9088]">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      <span>{booking.date}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      <span>{booking.timeSlot}</span>
                    </div>
                  </div>
                  {booking.vision && (
                    <div className="mt-6 pt-4 border-t border-sand dark:border-dark-border">
                      <p className="text-xs font-mono uppercase tracking-widest text-[#7c7265] mb-2">Your Vision</p>
                      <p className="text-sm italic">{booking.vision}</p>
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
