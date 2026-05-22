'use client'

import { Flight } from '@/store/flightStore'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { format, differenceInMinutes } from 'date-fns'
import { cn } from '@/lib/utils'
import { motion } from 'framer-motion'

interface FlightCardProps {
  flight: Flight;
  onSelect: (flight: Flight) => void;
  index?: number;
}

export function FlightCard({ flight, onSelect, index = 0 }: FlightCardProps) {
  const departs = new Date(flight.departs_at)
  const arrives = new Date(flight.arrives_at)
  const diffMins = differenceInMinutes(arrives, departs)
  const durationHours = Math.floor(diffMins / 60)
  const durationMins = diffMins % 60

  const getAirlineName = (flightNo: string): string => {
    const code = flightNo.split('-')[0].toUpperCase()
    const airlines: Record<string, string> = {
      '6E': 'IndiGo',
      'AI': 'Air India',
      'UK': 'Vistara',
      'QP': 'Akasa Air',
      'SG': 'SpiceJet',
      'IX': 'Air India Express',
      'G8': 'GoFirst',
    }
    return airlines[code] || 'SkyFlow Air'
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05, ease: 'easeOut' }}
      className="group relative rounded-2xl border border-white/5 bg-gradient-to-br from-[#0c0c16] to-[#0a0a14] hover:border-indigo-500/25 transition-all duration-300 hover:shadow-[0_0_40px_rgba(99,102,241,0.08)] overflow-hidden cursor-pointer"
      onClick={() => onSelect(flight)}
    >
      {/* Top accent line on hover */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-indigo-500/0 to-transparent group-hover:via-indigo-500/40 transition-all duration-500" />
      
      <div className="p-5 sm:p-6 flex flex-col sm:flex-row items-stretch sm:items-center gap-5">
        
        {/* Airline info */}
        <div className="flex items-center gap-3 sm:w-48 flex-shrink-0">
          <div className="relative w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600/20 to-indigo-600/5 border border-indigo-500/15 flex items-center justify-center flex-shrink-0 group-hover:border-indigo-500/30 transition-colors">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" className="text-indigo-400">
              <path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z"/>
            </svg>
          </div>
          <div className="min-w-0">
            <div className="font-semibold text-sm text-slate-200 truncate">{getAirlineName(flight.flight_no)}</div>
            <div className="text-xs text-slate-600 mt-0.5 font-mono">{flight.flight_no} · {flight.aircraft_type}</div>
          </div>
        </div>

        {/* Route timeline */}
        <div className="flex-1 flex items-center gap-4 min-w-0">
          {/* Depart */}
          <div className="text-center flex-shrink-0">
            <div className="text-2xl font-display font-bold text-white tabular-nums">{format(departs, 'HH:mm')}</div>
            <div className="text-xs font-semibold text-slate-400 mt-0.5">{flight.origin}</div>
            <div className="text-[10px] text-slate-600">{format(departs, 'MMM d')}</div>
          </div>

          {/* Route line */}
          <div className="flex-1 flex flex-col items-center gap-1.5 min-w-[80px]">
            <div className="text-[10px] text-slate-600 font-mono">{durationHours}h {durationMins}m</div>
            <div className="w-full relative flex items-center">
              <div className="w-1.5 h-1.5 rounded-full bg-slate-600 flex-shrink-0" />
              {/* Animated dashed route line */}
              <div className="flex-1 relative h-px mx-1 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-slate-700 via-indigo-500/40 to-slate-700" />
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-indigo-400 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" 
                  style={{ backgroundSize: '200% 100%', animation: 'shimmer 1.5s linear infinite' }} />
              </div>
              <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 flex-shrink-0 group-hover:shadow-[0_0_6px_rgba(99,102,241,0.8)] transition-all duration-300" />
            </div>
            <Badge variant="cyan" className="text-[9px] px-2">Non-stop</Badge>
          </div>

          {/* Arrive */}
          <div className="text-center flex-shrink-0">
            <div className="text-2xl font-display font-bold text-white tabular-nums">{format(arrives, 'HH:mm')}</div>
            <div className="text-xs font-semibold text-slate-400 mt-0.5">{flight.destination}</div>
            <div className="text-[10px] text-slate-600">{format(arrives, 'MMM d')}</div>
          </div>
        </div>

        {/* Price & CTA */}
        <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center sm:w-36 flex-shrink-0 border-t sm:border-t-0 sm:border-l border-white/5 pt-4 sm:pt-0 sm:pl-5 gap-3">
          <div>
            <div className="text-[10px] text-slate-600 uppercase tracking-wider mb-0.5 hidden sm:block">From</div>
            <div className="text-2xl font-display font-bold text-white">₹{flight.base_price}</div>
            <div className="text-[10px] text-slate-600">per person</div>
          </div>
          <Button 
            variant="default" 
            size="sm"
            className="w-full sm:w-full justify-center"
            onClick={(e) => { e.stopPropagation(); onSelect(flight) }}
          >
            Select
          </Button>
        </div>
      </div>
    </motion.div>
  )
}
