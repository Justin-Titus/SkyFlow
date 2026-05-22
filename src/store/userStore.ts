/* eslint-disable */
import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { Session, User } from '@supabase/supabase-js'

export type Booking = {
  id: string;
  flight_id: string;
  seat_id: string;
  status: 'confirmed' | 'rescheduled' | 'cancelled';
  booked_at: string;
  total_price: number;
  pnr_code: string;
  flight?: any; // Will flesh this out later
  seat?: any;
}

interface UserStore {
  session: Session | null;
  user: User | null;
  cachedBookings: Booking[];
  
  setSession: (session: Session | null) => void;
  setUser: (user: User | null) => void;
  setCachedBookings: (bookings: Booking[]) => void;
  logout: () => void;
}

export const useUserStore = create<UserStore>()(
  persist(
    (set) => ({
      session: null,
      user: null,
      cachedBookings: [],
      
      setSession: (session) => set({ session, user: session?.user || null }),
      setUser: (user) => set({ user }),
      setCachedBookings: (cachedBookings) => set({ cachedBookings }),
      logout: () => set({ session: null, user: null, cachedBookings: [] }),
    }),
    {
      name: 'user-storage',
      storage: createJSONStorage(() => localStorage),
      // We only want to persist the session (and maybe cached bookings for offline mode)
      partialize: (state) => ({
        session: state.session,
        cachedBookings: state.cachedBookings,
      }),
    }
  )
)
