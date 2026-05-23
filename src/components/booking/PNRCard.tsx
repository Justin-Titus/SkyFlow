'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import { AnimatedBackground } from '@/components/ui/AnimatedBackground'
import { format, differenceInMinutes } from 'date-fns'
import { cn, isUuid } from '@/lib/utils'
import { useFlightStore } from '@/store/flightStore'
import dynamic from 'next/dynamic'
import { AnimatePresence } from 'framer-motion'

const CancelDialog = dynamic(
  () => import('@/components/my-bookings/CancelDialog').then(mod => mod.CancelDialog),
  { ssr: false }
)
const RescheduleDialog = dynamic(
  () => import('@/components/my-bookings/RescheduleDialog').then(mod => mod.RescheduleDialog),
  { ssr: false }
)

interface PNRCardProps {
  bookingId: string;
  isConfirmation?: boolean;
}

export function PNRCard({ bookingId, isConfirmation = false }: PNRCardProps) {
  const router = useRouter()
  const [booking, setBooking] = useState<import('@/store/userStore').Booking | null>(null)
  const [loading, setLoading] = useState(true)
  const [revealed, setRevealed] = useState(false)
  const [rescheduleOpen, setRescheduleOpen] = useState(false)
  const [cancelOpen, setCancelOpen] = useState(false)

  const fetchBooking = useCallback(async () => {
    const loadLocalBooking = () => {
      try {
        const localBookings = JSON.parse(localStorage.getItem('skyflow_local_bookings') || '[]')
        const matched = localBookings.find((b: import('@/store/userStore').Booking) => 
          b.id === bookingId || 
          (b.pnr_code && b.pnr_code.toUpperCase() === bookingId.toUpperCase())
        )
        if (matched) {
          setBooking(matched)
          return true
        } else {
          // Last resort: mock custom details using store state if matching the active ID
          const store = useFlightStore.getState()
          if (store.selectedFlight && store.selectedSeat) {
            const expectedPnr = bookingId.toUpperCase().startsWith('PNR-')
              ? bookingId
              : `PNR-${(bookingId.split('-').pop() || bookingId).substring(0, 6).toUpperCase()}`
            
            setBooking({
              id: bookingId,
              flight_id: store.selectedFlight.id,
              seat_id: store.selectedSeat.id,
              status: 'confirmed',
              booked_at: new Date().toISOString(),
              pnr_code: expectedPnr,
              total_price: store.selectedFlight.base_price + store.selectedSeat.extra_fee,
              flights: store.selectedFlight,
              seats: store.selectedSeat,
              passengers: [
                {
                  full_name: store.passengerData?.full_name || 'Passenger Name',
                  passport_no: store.passengerData?.passport_no || 'X987654321',
                  nationality: store.passengerData?.nationality || 'IN',
                  dob: store.passengerData?.dob || '1990-01-01'
                }
              ]
            })
            return true
          }
        }
      } catch (localErr) {
        console.error('Local fallback retrieval failed:', localErr)
      }
      return false
    };

    const isMock = bookingId.startsWith('mock-') || 
                   !process.env.NEXT_PUBLIC_SUPABASE_URL || 
                   process.env.NEXT_PUBLIC_SUPABASE_URL.includes('placeholder.supabase.co');

    if (isMock) {
      loadLocalBooking()
      setLoading(false)
      setTimeout(() => setRevealed(true), 100)
      return
    }

    try {
      const supabase = createClient()
      let query = supabase.from('bookings').select('*, flights(*), seats(*), passengers(*)')
      
      if (isUuid(bookingId)) {
        query = query.eq('id', bookingId)
      } else {
        query = query.eq('pnr_code', bookingId.toUpperCase())
      }
      
      const { data, error } = await query.single()
      
      if (error) throw error
      if (data) {
        setBooking(data)
      } else {
        throw new Error('Booking not found in database')
      }
    } catch (err: unknown) {
      console.warn('Booking fetch from Supabase failed, searching locally:', (err as Error)?.message || err)
      loadLocalBooking()
    } finally {
      setLoading(false)
      // Trigger reveal animation after data loads
      setTimeout(() => setRevealed(true), 100)
    }
  }, [bookingId])

  useEffect(() => {
    fetchBooking()
  }, [fetchBooking])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <AnimatedBackground />
        <div className="text-center animate-fade-in">
          <div className="w-10 h-10 border border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm text-slate-500">Generating your boarding pass…</p>
        </div>
      </div>
    )
  }

  if (!booking) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4">
        <AnimatedBackground />
        <p className="text-slate-500 mb-4">Booking not found.</p>
        <Button variant="outline" onClick={() => router.push('/')}>Return home</Button>
      </div>
    )
  }

  const flight = booking.flights || booking.flight
  
  if (!flight) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4">
        <AnimatedBackground />
        <p className="text-slate-500 mb-4">Flight details not found.</p>
        <Button variant="outline" onClick={() => router.push('/')}>Return home</Button>
      </div>
    )
  }
  const seatsList = booking.seats_list || (booking.seats ? [booking.seats] : [])
  const passengers = booking.passengers || []

  // Ensure 100% consistency between the passenger manifest list and the tear-off stub
  const assignedPassengers = passengers.map((p: import('@/store/flightStore').PassengerFormData & { seat_number?: string, seat_class?: string }, idx: number) => {
    const matchedSeat = seatsList[idx] || seatsList[0] || {}
    const seatNumber = matchedSeat.seat_number || p.seat_number || '—'
    const seatClass = matchedSeat.class || p.seat_class || 'economy'
    return {
      ...p,
      seatNumber,
      seatClass
    }
  })

  const departs = new Date(flight.departs_at)
  const arrives = new Date(flight.arrives_at)
  const diffMins = differenceInMinutes(arrives, departs)

  const isPast = departs.getTime() < Date.now()
  const canCancel = !isPast && differenceInMinutes(departs, new Date()) > 120 && (booking.status === 'confirmed' || booking.status === 'rescheduled')
  const showManageActions = (booking.status === 'confirmed' || booking.status === 'rescheduled') && !isPast

  const getStatus = () => {
    if (booking.status === 'cancelled') {
      return { dot: 'bg-red-400', label: 'Cancelled', text: 'text-red-400' }
    }
    if (isPast) {
      return { dot: 'bg-slate-500', label: 'Completed', text: 'text-slate-400' }
    }
    if (booking.status === 'rescheduled') {
      return { dot: 'bg-amber-400', label: 'Rescheduled', text: 'text-amber-400' }
    }
    return { dot: 'bg-emerald-400', label: 'Confirmed', text: 'text-emerald-400' }
  }
  const statusInfo = getStatus()

  return (
    <div className="min-h-screen pt-20 pb-16 px-4 flex flex-col items-center">
      <AnimatedBackground />
      
      {/* Page Header / Back Link or Success Header */}
      {!isConfirmation ? (
        <div className={cn(
          "w-full max-w-xl mb-6 flex items-center justify-between transition-all duration-700 no-print",
          revealed ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
        )}>
          <button 
            onClick={() => router.push('/my-bookings')}
            className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-white transition-colors group"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="transition-transform group-hover:-translate-x-0.5">
              <line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" />
            </svg>
            Back to My Trips
          </button>
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-widest font-mono">Ticket Details</span>
        </div>
      ) : (
        /* Success header */
        <div className={cn(
          "text-center mb-10 transition-all duration-700 no-print",
          revealed ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
        )}>
          <div className="relative inline-flex items-center justify-center w-16 h-16 mb-4">
            <div className="absolute inset-0 rounded-full bg-emerald-500/10 border border-emerald-500/20 animate-radar" />
            <div className="absolute inset-0 rounded-full bg-emerald-500/5 animate-radar" style={{ animationDelay: '1s' }} />
            <div className="w-16 h-16 rounded-full bg-emerald-500/15 border border-emerald-500/25 flex items-center justify-center">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-emerald-400">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
          </div>
          <h1 className="text-3xl font-display font-bold text-white mb-1">You're booked!</h1>
          <p className="text-slate-500 text-sm">A confirmation has been sent to your account.</p>
        </div>
      )}

      {/* Boarding Pass */}
      <div className={cn(
        "w-full max-w-xl transition-all duration-700 print-card",
        revealed ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
      )} style={{ transitionDelay: '150ms' }}>
        <div className="relative">
          {/* Main ticket body */}
          <div className="rounded-t-2xl border border-white/8 bg-gradient-to-br from-[#0e0e1c] to-[#0a0a14] overflow-hidden">
            {/* Top band */}
            <div className="h-1.5 bg-gradient-to-r from-indigo-600 via-cyan-500 to-violet-600" />

            {/* Boarding pass content */}
            <div className="p-6 sm:p-8">
              {/* Airline + PNR */}
              <div className="flex items-start justify-between mb-8">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-600 to-cyan-600 flex items-center justify-center shadow-[0_0_12px_rgba(99,102,241,0.3)]">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="white">
                      <path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z"/>
                    </svg>
                  </div>
                  <div>
                    <div className="font-display font-bold text-white">SkyFlow Air</div>
                    <div className="text-[10px] text-slate-600 font-mono">{flight.flight_no}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] text-slate-600 uppercase tracking-widest mb-1">Booking Ref</div>
                  <div className="font-mono text-2xl font-bold text-gradient-cyan">{booking.pnr_code}</div>
                </div>
              </div>

              {/* Route */}
              <div className="flex items-center justify-between mb-8">
                <div>
                  <div className="text-5xl font-display font-black text-white tracking-tight">{flight.origin}</div>
                  <div className="text-xs text-slate-500 mt-1">{format(departs, 'HH:mm')} · {format(departs, 'dd MMM')}</div>
                </div>
                <div className="flex-1 px-6 flex flex-col items-center gap-2">
                  <div className="text-[10px] text-slate-600 font-mono">{Math.floor(diffMins / 60)}h {diffMins % 60}m</div>
                  <div className="w-full relative flex items-center gap-1">
                    <div className="w-1.5 h-1.5 rounded-full border border-slate-600 flex-shrink-0" />
                    <div className="flex-1 border-t border-dashed border-slate-700" />
                    <svg className="text-indigo-400 flex-shrink-0" width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z"/>
                    </svg>
                    <div className="flex-1 border-t border-dashed border-slate-700" />
                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 flex-shrink-0" />
                  </div>
                  <div className="text-[10px] text-indigo-500 font-medium">Non-stop</div>
                </div>
                <div className="text-right">
                  <div className="text-5xl font-display font-black text-white tracking-tight">{flight.destination}</div>
                  <div className="text-xs text-slate-500 mt-1">{format(arrives, 'HH:mm')} · {format(arrives, 'dd MMM')}</div>
                </div>
              </div>

              {/* Details grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                {[
                  { label: 'Class', value: seatsList[0]?.class || 'Economy', capitalize: true },
                  { label: 'Total Paid', value: `₹${booking.total_price}` },
                  { label: 'Passengers', value: passengers.length },
                  { label: 'Booking Date', value: format(new Date(booking.booked_at || Date.now()), 'dd MMM yyyy') },
                ].map(item => (
                  <div key={item.label}>
                    <div className="text-[9px] text-slate-600 uppercase tracking-widest mb-1">{item.label}</div>
                    <div className={cn("text-xs font-semibold text-slate-200 truncate", item.capitalize && "capitalize")}>
                      {item.value}
                    </div>
                  </div>
                ))}
              </div>

              {/* Passengers & Seats list */}
              <div className="mt-6 pt-6 border-t border-white/5">
                <div className="text-[9px] text-slate-600 uppercase tracking-widest mb-3">Passenger & Seat Manifest</div>
                <div className="space-y-2">
                  {assignedPassengers.map((p: import('@/store/flightStore').PassengerFormData & { seatNumber: string, seatClass: string }, idx: number) => {
                    return (
                      <div key={idx} className="flex items-center justify-between bg-white/2 rounded-xl px-4 py-2.5 border border-white/5">
                        <div className="flex items-center gap-3">
                          <div className="w-5 h-5 rounded-full bg-slate-800 text-[10px] text-slate-400 font-bold font-mono flex items-center justify-center">
                            {idx + 1}
                          </div>
                          <span className="text-xs font-semibold text-slate-200">{p.full_name}</span>
                          <span className="text-[10px] text-slate-500">({p.nationality})</span>
                        </div>
                        <span className={cn(
                          "px-2 py-0.5 rounded text-[10px] font-bold font-mono capitalize",
                          p.seatClass === 'first' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/20' :
                          p.seatClass === 'business' ? 'bg-violet-500/20 text-violet-300 border border-violet-500/20' :
                          'bg-indigo-500/20 text-indigo-300 border border-indigo-500/20'
                        )}>
                          Seat {p.seatNumber}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>

            </div>
          </div>

          {/* Perforation line */}
          <div className="relative h-6 border-x border-white/8 bg-[#080810] flex items-center">
            <div className="absolute left-0 -translate-x-1/2 w-6 h-6 rounded-full bg-[#050508] border border-white/8" />
            <div className="absolute right-0 translate-x-1/2 w-6 h-6 rounded-full bg-[#050508] border border-white/8" />
            <div className="w-full border-t border-dashed border-white/8 mx-4" />
          </div>

          {/* Tear-off stub */}
          <div className="rounded-b-2xl border border-white/8 border-t-0 bg-gradient-to-b from-[#0a0a14] to-[#080810] px-6 sm:px-8 py-5">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-[9px] text-slate-700 uppercase tracking-widest mb-1">Boarding</div>
                <div className="text-lg font-display font-bold text-white">{booking.pnr_code}</div>
              </div>
              <div className="text-right">
                <div className="text-[9px] text-slate-700 uppercase tracking-widest mb-1">Seat(s)</div>
                <div className="text-lg font-display font-bold text-indigo-300">
                  {assignedPassengers.map((p: import('@/store/flightStore').PassengerFormData & { seatNumber?: string }) => p.seatNumber).filter((s: string | undefined): s is string => s !== undefined && s !== '—').join(', ') || 
                   seatsList.map((s: import('@/store/flightStore').Seat) => s.seat_number).join(', ') ||
                   '—'}
                </div>
              </div>
              <div className="text-right">
                <div className="text-[9px] text-slate-700 uppercase tracking-widest mb-1">Status</div>
                <div className="flex items-center gap-1.5">
                  <span className={cn("w-1.5 h-1.5 rounded-full", statusInfo.dot, booking.status !== 'cancelled' && !isPast && "animate-pulse")} />
                  <span className={cn("text-xs font-semibold", statusInfo.text)}>{statusInfo.label}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Manage Booking Actions */}
      {showManageActions && (
        <div className={cn(
          "w-full max-w-xl mt-6 p-4 rounded-2xl border border-white/5 bg-white/2 flex gap-3 transition-all duration-700 no-print",
          revealed ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
        )} style={{ transitionDelay: '220ms' }}>
          <Button
            variant="outline"
            className="flex-1 border-red-500/20 text-red-400 hover:bg-red-500/10 hover:border-red-500/30"
            disabled={!canCancel}
            onClick={() => setCancelOpen(true)}
          >
            Cancel Trip
          </Button>
          <Button
            variant="glow"
            className="flex-1"
            disabled={!canCancel}
            onClick={() => setRescheduleOpen(true)}
          >
            Reschedule Flight
          </Button>
        </div>
      )}

      {/* Action buttons */}
      <div className={cn(
        "flex gap-3 mt-6 w-full max-w-xl flex-col sm:flex-row transition-all duration-700 action-buttons-container no-print",
        revealed ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
      )} style={{ transitionDelay: '300ms' }}>
        {isConfirmation && (
          <Button variant="secondary" className="flex-1" onClick={() => router.push('/')}>
            Book another
          </Button>
        )}
        <Button variant="outline" className="flex-1 gap-2 justify-center" onClick={() => window.print()}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polyline points="6 9 6 2 18 2 18 9"/>
            <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/>
            <rect x="6" y="14" width="12" height="8"/>
          </svg>
          Print Pass
        </Button>
        <Button variant="glow" className="flex-1 justify-center" onClick={() => router.push('/my-bookings')}>
          {isConfirmation ? 'My trips →' : 'Back to My Trips'}
        </Button>
      </div>

      <AnimatePresence>
        {rescheduleOpen && (
          <RescheduleDialog
            booking={booking}
            bookingId={booking.id}
            currentFlightId={flight.id}
            origin={flight.origin}
            destination={flight.destination}
            seatClass={booking.seats_list?.[0]?.class || booking.seats?.class || 'economy'}
            open={rescheduleOpen}
            onOpenChange={setRescheduleOpen}
            onSuccess={fetchBooking}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {cancelOpen && (
          <CancelDialog
            bookingId={booking.id}
            flightDate={flight.departs_at}
            open={cancelOpen}
            onOpenChange={setCancelOpen}
            onSuccess={fetchBooking}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
