/* eslint-disable */
'use client'

import { useRouter } from 'next/navigation'
import { Badge } from '@/components/ui/Badge'
import { Booking } from '@/store/userStore'
import { Seat } from '@/store/flightStore'
import { format, differenceInMinutes } from 'date-fns'
import { cn } from '@/lib/utils'

interface BookingCardProps {
  booking: Booking;
}

export function BookingCard({ booking }: BookingCardProps) {
  const router = useRouter()
  const flight = booking.flights || booking.flight
  
  if (!flight) return null;
  const seatsList = booking.seats_list || (booking.seats ? [booking.seats] : [])
  const seatNumbers = seatsList.map((s: Seat) => s.seat_number).join(', ')
  const seatClass = seatsList[0]?.class || 'economy'

  const departs = new Date(flight.departs_at)
  const arrives = new Date(flight.arrives_at)
  const isPast = departs.getTime() < Date.now()
  const diffMins = differenceInMinutes(arrives, departs)
  const canCancel = !isPast && differenceInMinutes(departs, new Date()) > 120 && (booking.status === 'confirmed' || booking.status === 'rescheduled')

  const getStatus = () => {
    if (booking.status === 'cancelled') {
      return { variant: 'danger' as const, dot: 'bg-red-400', label: 'Cancelled' }
    }
    if (isPast) {
      return { variant: 'outline' as const, dot: 'bg-slate-500', label: 'Completed' }
    }
    if (booking.status === 'rescheduled') {
      return { variant: 'warning' as const, dot: 'bg-amber-400', label: 'Rescheduled' }
    }
    return { variant: 'success' as const, dot: 'bg-emerald-400', label: 'Confirmed' }
  }
  const status = getStatus()

  return (
    <>
      <div 
        onClick={() => router.push(`/my-bookings/${booking.pnr_code}`)}
        className={cn(
          "group relative rounded-2xl border bg-gradient-to-br from-[#0c0c16] to-[#09090f] overflow-hidden transition-all duration-300 cursor-pointer hover:scale-[1.005] hover:border-indigo-500/20 active:scale-[0.995]",
          booking.status === 'cancelled' ? 'border-white/4 opacity-60' :
          isPast ? 'border-white/5 opacity-75' :
          'border-white/6 hover:border-indigo-500/30 hover:shadow-[0_0_30px_rgba(99,102,241,0.08)]'
        )}
      >
        {/* Top gradient accent */}
        <div className={cn(
          "h-0.5",
          booking.status === 'cancelled' ? 'bg-gradient-to-r from-transparent via-red-500/30 to-transparent' :
          isPast ? 'bg-gradient-to-r from-transparent via-slate-500/20 to-transparent' :
          booking.status === 'confirmed' ? 'bg-gradient-to-r from-transparent via-indigo-500/50 to-transparent' :
          'bg-gradient-to-r from-transparent via-amber-500/40 to-transparent'
        )} />

        <div className="p-5 sm:p-6 flex flex-col sm:flex-row gap-5">
          {/* Route info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-md bg-indigo-500/10 border border-indigo-500/15 flex items-center justify-center flex-shrink-0">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor" className="text-indigo-400">
                    <path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z"/>
                  </svg>
                </div>
                <span className="text-xs text-slate-600 font-mono">{flight.flight_no}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="flex items-center gap-1.5 text-[10px] font-semibold text-slate-500">
                  PNR:
                </span>
                <span className="font-mono text-sm font-bold text-white/70">{booking.pnr_code}</span>
                <Badge variant={status.variant}>{status.label}</Badge>
              </div>
            </div>

            {/* Route display */}
            <div className="flex items-center gap-4">
              <div>
                <div className="text-3xl font-display font-black text-white tabular-nums">{format(departs, 'HH:mm')}</div>
                <div className="text-xs font-semibold text-slate-400 mt-0.5">{flight.origin}</div>
                <div className="text-[10px] text-slate-600">{format(departs, 'EEE, MMM d')}</div>
              </div>
              
              <div className="flex-1 flex flex-col items-center gap-1.5">
                <div className="text-[10px] text-slate-700 font-mono">{Math.floor(diffMins / 60)}h {diffMins % 60}m</div>
                <div className="w-full relative flex items-center gap-1">
                  <div className="w-1.5 h-1.5 rounded-full border border-slate-600 flex-shrink-0" />
                  <div className="flex-1 border-t border-dashed border-slate-800" />
                  <div className="w-1.5 h-1.5 rounded-full bg-indigo-500/60 flex-shrink-0" />
                </div>
                <span className="text-[9px] text-slate-700">Non-stop</span>
              </div>

              <div className="text-right">
                <div className="text-3xl font-display font-black text-white tabular-nums">{format(arrives, 'HH:mm')}</div>
                <div className="text-xs font-semibold text-slate-400 mt-0.5">{flight.destination}</div>
                <div className="text-[10px] text-slate-600">{format(arrives, 'EEE, MMM d')}</div>
              </div>
            </div>
          </div>

          {/* Right: Details */}
          <div className="sm:w-40 flex-shrink-0 sm:border-l sm:border-white/5 sm:pl-5 flex flex-col justify-center">
            <div className="space-y-4">
               <div>
                <div className="text-[9px] text-slate-500 uppercase tracking-widest font-semibold">Seat(s)</div>
                <div className="text-sm font-semibold text-white mt-0.5">{seatNumbers || '—'}</div>
                <div className="text-[10px] text-slate-400 capitalize">{seatClass} class</div>
              </div>
              <div>
                <div className="text-[9px] text-slate-500 uppercase tracking-widest font-semibold">Total Paid</div>
                <div className="text-sm font-semibold text-white mt-0.5">₹{booking.total_price}</div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </>
  )
}
