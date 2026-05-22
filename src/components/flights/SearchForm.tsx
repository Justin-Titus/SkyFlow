'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useFlightStore } from '@/store/flightStore'
import { Button } from '@/components/ui/Button'
import { format, addDays } from 'date-fns'
import { cn } from '@/lib/utils'
import { motion } from 'framer-motion'

const AIRPORTS = [
  { code: 'DEL', city: 'Delhi', country: 'IN' },
  { code: 'BOM', city: 'Mumbai', country: 'IN' },
  { code: 'BLR', city: 'Bengaluru', country: 'IN' },
  { code: 'MAA', city: 'Chennai', country: 'IN' },
  { code: 'CCU', city: 'Kolkata', country: 'IN' },
  { code: 'HYD', city: 'Hyderabad', country: 'IN' },
  { code: 'GOI', city: 'Goa', country: 'IN' },
  { code: 'PNQ', city: 'Pune', country: 'IN' },
]

const selectClass = "w-full h-full bg-transparent text-white text-sm appearance-none focus:outline-none cursor-pointer"

function FieldWrapper({ 
  label, 
  children, 
  className, 
  onClick,
  htmlFor
}: { 
  label: string; 
  children: React.ReactNode; 
  className?: string; 
  onClick?: () => void;
  htmlFor?: string;
}) {
  return (
    <div onClick={onClick} className={cn("relative group flex-1 min-w-0 cursor-pointer", className)}>
      <div className="absolute inset-0 rounded-xl border border-white/6 bg-white/2 group-hover:border-indigo-500/20 group-focus-within:border-indigo-500/40 group-focus-within:bg-indigo-500/4 transition-all duration-200 pointer-events-none" />
      <div className="relative px-4 py-3 h-16 flex flex-col justify-between">
        {htmlFor ? (
          <label 
            htmlFor={htmlFor} 
            className="text-[10px] font-semibold text-slate-400 uppercase tracking-[0.1em] group-focus-within:text-indigo-400 transition-colors select-none cursor-pointer"
          >
            {label}
          </label>
        ) : (
          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-[0.1em] group-focus-within:text-indigo-400 transition-colors select-none pointer-events-none">
            {label}
          </span>
        )}
        {children}
      </div>
    </div>
  )
}

function Divider() {
  return (
    <div className="relative z-10 flex-shrink-0 w-8 flex items-center justify-center">
      <div className="w-px h-8 bg-white/6" />
    </div>
  )
}

export function SearchForm() {
  const router = useRouter()
  const setSearchQuery = useFlightStore((state) => state.setSearchQuery)
  
  const dateInputRef = useRef<HTMLInputElement>(null)
  
  const [origin, setOrigin] = useState('DEL')
  const [destination, setDestination] = useState('BOM')
  const [date, setDate] = useState(format(addDays(new Date(), 10), 'yyyy-MM-dd'))
  const [passengers, setPassengers] = useState(1)
  const [error, setError] = useState<string | null>(null)

  const handleDateClick = () => {
    try {
      dateInputRef.current?.showPicker()
    } catch (e) {
      dateInputRef.current?.focus()
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (origin === destination) {
      setError('Origin and destination airports cannot be the same.')
      return
    }
    const todayStr = format(new Date(), 'yyyy-MM-dd')
    if (date < todayStr) {
      setError('Departure date cannot be in the past.')
      return
    }
    setError(null)
    setSearchQuery({ origin, destination, date, passengers })
    router.push(`/flights?origin=${origin}&destination=${destination}&date=${date}&passengers=${passengers}`)
  }

  const originAirport = AIRPORTS.find(a => a.code === origin)
  const destAirport = AIRPORTS.find(a => a.code === destination)

  return (
    <form onSubmit={handleSearch}>
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2"
        >
          <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
          </svg>
          <span className="font-semibold">{error}</span>
        </motion.div>
      )}
      <div className="flex flex-col sm:flex-row gap-2">
        {/* From / To Row */}
        <div className="flex-1 flex rounded-xl overflow-hidden border border-white/6 bg-white/2 divide-x divide-white/5">
          {/* From */}
          <FieldWrapper label="From" className="flex-1 border-0 rounded-none" htmlFor="origin-select">
            <div className="flex items-end gap-2">
              <span className="text-xl font-display font-bold text-white leading-none">{origin}</span>
              <span className="text-xs text-slate-400 pb-0.5 truncate">{originAirport?.city}</span>
            </div>
            <select
              id="origin-select"
              value={origin}
              onChange={e => { setOrigin(e.target.value); if (e.target.value !== destination) setError(null); }}
              className="absolute inset-0 opacity-0 cursor-pointer"
            >
              {AIRPORTS.map(a => (
                <option key={a.code} value={a.code}>{a.code} — {a.city}</option>
              ))}
            </select>
          </FieldWrapper>

          {/* Swap icon */}
          <div className="flex-shrink-0 flex items-center justify-center w-10 bg-white/2">
            <button
              type="button"
              onClick={() => { const t = origin; setOrigin(destination); setDestination(t); setError(null); }}
              aria-label="Swap origin and destination"
              className="w-6 h-6 rounded-full bg-white/5 hover:bg-indigo-500/20 border border-white/8 hover:border-indigo-500/30 flex items-center justify-center transition-all duration-200 text-slate-400 hover:text-indigo-400"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M8 3L4 7l4 4M4 7h16M16 21l4-4-4-4M20 17H4" />
              </svg>
            </button>
          </div>

          {/* To */}
          <FieldWrapper label="To" className="flex-1 border-0 rounded-none" htmlFor="destination-select">
            <div className="flex items-end gap-2">
              <span className="text-xl font-display font-bold text-white leading-none">{destination}</span>
              <span className="text-xs text-slate-400 pb-0.5 truncate">{destAirport?.city}</span>
            </div>
            <select
              id="destination-select"
              value={destination}
              onChange={e => { setDestination(e.target.value); if (e.target.value !== origin) setError(null); }}
              className="absolute inset-0 opacity-0 cursor-pointer"
            >
              {AIRPORTS.map(a => (
                <option key={a.code} value={a.code}>{a.code} — {a.city}</option>
              ))}
            </select>
          </FieldWrapper>
        </div>

        {/* Date + Passengers + Button */}
        <div className="flex gap-2">
          <FieldWrapper label="Date" className="min-w-[140px]" onClick={handleDateClick} htmlFor="date-input">
            <span className="text-sm font-semibold text-white pointer-events-none">
              {date ? format(new Date(date), 'MMM dd, yyyy') : 'Select'}
            </span>
            <input
              type="date"
              id="date-input"
              ref={dateInputRef}
              value={date}
              onChange={e => { setDate(e.target.value); const todayStr = format(new Date(), 'yyyy-MM-dd'); if (e.target.value >= todayStr) setError(null); }}
              min={format(new Date(), 'yyyy-MM-dd')}
              className="absolute inset-0 opacity-0 cursor-pointer pointer-events-auto"
              required
            />
          </FieldWrapper>

          <FieldWrapper label="Passengers" className="w-[110px] flex-none" htmlFor="passengers-select">
            <span className="text-sm font-semibold text-white">{passengers} {passengers === 1 ? 'Adult' : 'Adults'}</span>
            <select
              id="passengers-select"
              value={passengers}
              onChange={e => setPassengers(Number(e.target.value))}
              className="absolute inset-0 opacity-0 cursor-pointer"
            >
              {[1,2,3,4,5,6].map(n => (
                <option key={n} value={n}>{n} {n === 1 ? 'Adult' : 'Adults'}</option>
              ))}
            </select>
          </FieldWrapper>

          <Button 
            type="submit" 
            variant="glow" 
            className="h-16 px-6 rounded-xl flex-shrink-0 font-semibold"
            aria-label="Search flights"
          >
            <svg className="w-4 h-4 sm:mr-2" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
            </svg>
            <span className="hidden sm:inline">Search</span>
          </Button>
        </div>
      </div>
    </form>
  )
}
