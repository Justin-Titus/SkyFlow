'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { BookingCard } from '@/components/my-bookings/BookingCard'
import { Button } from '@/components/ui/Button'
import { AnimatedBackground } from '@/components/ui/AnimatedBackground'
import { useRouter } from 'next/navigation'
import { cn, isUuid } from '@/lib/utils'
import { useUserStore } from '@/store/userStore'
import { motion } from 'framer-motion'

type FilterType = 'all' | 'confirmed' | 'completed' | 'cancelled'

export default function MyBookingsPage() {
  const [bookings, setBookings] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<FilterType>('all')
  const router = useRouter()
  const supabase = createClient()

  const fetchBookings = async () => {
    setLoading(true)
    let activeUser = null
    try {
      const { data: { user } } = await supabase.auth.getUser()
      activeUser = user
    } catch (err) {
      console.warn('Supabase auth check failed:', err)
    }

    if (!activeUser) {
      const storeUser = useUserStore.getState().user
      if (storeUser) {
        activeUser = storeUser
      }
    }

    if (!activeUser) {
      router.push('/login')
      return
    }

    let bookingsList: any[] = []

    if (activeUser && isUuid(activeUser.id)) {
      try {
        const { data, error } = await supabase
            .from('bookings')
            .select('*, flights(*), seats(*), passengers(*)')
            .eq('user_id', activeUser.id)
            .order('booked_at', { ascending: false })
        
        if (error) throw error
        bookingsList = data || []
      } catch (err: any) {
        console.warn('Failed to fetch bookings from Supabase, loading locally:', err?.message || err)
        bookingsList = useUserStore.getState().cachedBookings || []
      }
    } else {
      bookingsList = useUserStore.getState().cachedBookings || []
    }

    // Always merge or fallback to localStorage bookings
    try {
      const localBookings = JSON.parse(localStorage.getItem('skyflow_local_bookings') || '[]')
      const localOnly = localBookings.filter((lb: any) => !bookingsList.some((sb: any) => sb.id === lb.id))
      bookingsList = [...bookingsList, ...localOnly]
      // Sort bookingsList by booked_at descending
      bookingsList.sort((a: any, b: any) => new Date(b.booked_at).getTime() - new Date(a.booked_at).getTime())
    } catch (localErr) {
      console.error('Failed to parse local bookings:', localErr)
    }

    useUserStore.getState().setCachedBookings(bookingsList)
    setBookings(bookingsList)
    setLoading(false)
  }

  useEffect(() => { fetchBookings() }, [])

  // Filter bookings based on status and departure times
  const filteredBookings = bookings.filter(b => {
    const isPast = b.flights && new Date(b.flights.departs_at).getTime() < Date.now()
    if (filter === 'all') return true
    if (filter === 'confirmed') {
      return (b.status === 'confirmed' || b.status === 'rescheduled') && !isPast
    }
    if (filter === 'completed') {
      return (b.status === 'confirmed' || b.status === 'rescheduled') && isPast
    }
    if (filter === 'cancelled') {
      return b.status === 'cancelled'
    }
    return false
  })

  const counts = {
    all: bookings.length,
    confirmed: bookings.filter(b => (b.status === 'confirmed' || b.status === 'rescheduled') && !(b.flights && new Date(b.flights.departs_at).getTime() < Date.now())).length,
    completed: bookings.filter(b => (b.status === 'confirmed' || b.status === 'rescheduled') && (b.flights && new Date(b.flights.departs_at).getTime() < Date.now())).length,
    cancelled: bookings.filter(b => b.status === 'cancelled').length,
  }

  return (
    <div className="min-h-screen pt-20 pb-16">
      <AnimatedBackground />

      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-display font-bold text-white tracking-tight">My Trips</h1>
          <p className="text-slate-500 mt-1 text-sm">Manage and review all your bookings.</p>
        </motion.div>

        {/* Filter tabs */}
        {!loading && bookings.length > 0 && (
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.05 }}
            className="flex gap-1 mb-6 bg-white/3 border border-white/6 rounded-xl p-1 w-fit"
          >
            {(['all', 'confirmed', 'completed', 'cancelled'] as FilterType[]).map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={cn(
                  "px-4 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 capitalize",
                  filter === f
                    ? "bg-indigo-600/30 text-white border border-indigo-500/30"
                    : "text-slate-500 hover:text-slate-300"
                )}
              >
                {f}
                <span className={cn(
                  "ml-1.5 text-[10px] font-normal",
                  filter === f ? 'text-indigo-300/70' : 'text-slate-700'
                )}>
                  {counts[f]}
                </span>
              </button>
            ))}
          </motion.div>
        )}

        {/* Loading */}
        {loading && (
          <div className="flex flex-col items-center py-24">
            <div className="w-8 h-8 border border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin mb-4" />
            <p className="text-sm text-slate-600">Loading your trips…</p>
          </div>
        )}

        {/* Empty state */}
        {!loading && bookings.length === 0 && (
          <div className="animate-fade-in-up flex flex-col items-center py-24 text-center">
            <div className="relative w-20 h-20 mb-6">
              <div className="absolute inset-0 rounded-full bg-indigo-500/5 border border-indigo-500/10 animate-radar" />
              <div className="absolute inset-4 rounded-full bg-indigo-500/5 border border-indigo-500/10 animate-radar" style={{ animationDelay: '1s' }} />
              <div className="absolute inset-0 flex items-center justify-center">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor" className="text-slate-700">
                  <path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z"/>
                </svg>
              </div>
            </div>
            <h3 className="text-xl font-display font-semibold text-slate-300 mb-2">No trips yet</h3>
            <p className="text-sm text-slate-600 max-w-xs mb-8">You haven't booked any flights. Start your journey below.</p>
            <Button variant="glow" onClick={() => router.push('/')}>
              Search flights →
            </Button>
          </div>
        )}

        {/* Bookings list */}
        {!loading && filteredBookings.length > 0 && (
          <div className="space-y-3">
            {filteredBookings.map((booking, i) => (
              <motion.div
                key={booking.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: i * 0.05, ease: 'easeOut' }}
              >
                <BookingCard 
                  booking={booking} 
                />
              </motion.div>
            ))}
          </div>
        )}

        {/* Filtered empty state */}
        {!loading && bookings.length > 0 && filteredBookings.length === 0 && (
          <div className="py-16 text-center animate-fade-in">
            <p className="text-slate-600 text-sm">No {filter} trips found.</p>
          </div>
        )}
      </div>
    </div>
  )
}

