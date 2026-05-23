'use client'

import { Flight, useFlightStore } from '@/store/flightStore'
import { FlightCard } from './FlightCard'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { AnimatedBackground } from '@/components/ui/AnimatedBackground'
import { format } from 'date-fns'
import { useState, useEffect } from 'react'

interface FlightResultsProps {
  flights: Flight[];
  searchParams: {
    origin?: string;
    destination?: string;
    date?: string;
    passengers?: string;
  }
}

export function FlightResults({ flights, searchParams }: FlightResultsProps) {
  const router = useRouter()
  const { setSelectedFlight, setCurrentStep, setSearchQuery } = useFlightStore()

  // Filters & Sorting state
  const [sortBy, setSortBy] = useState<'price_asc' | 'price_desc' | 'duration_asc' | 'departs_asc'>('price_asc')
  const [aircraftFilter, setAircraftFilter] = useState<'all' | 'boeing' | 'airbus'>('all')
  const [maxPrice, setMaxPrice] = useState<number>(12000)

  // Dynamically adapt price slider max range based on available flights
  useEffect(() => {
    if (flights.length > 0) {
      const highest = Math.max(...flights.map(f => f.base_price))
      // Add 10% buffer and round up to nearest 500
      const bufferMax = Math.ceil((highest * 1.1) / 500) * 500
      setMaxPrice(bufferMax)
    }
  }, [flights])

  const handleSelectFlight = (flight: Flight) => {
    setSearchQuery({
      origin: searchParams.origin || flight.origin,
      destination: searchParams.destination || flight.destination,
      date: searchParams.date || flight.departs_at.split('T')[0],
      passengers: parseInt(searchParams.passengers || '1', 10)
    })
    setSelectedFlight(flight)
    setCurrentStep('seats')
    router.push(`/booking/${flight.id}`)
  }

  const dateDisplay = searchParams.date ? format(new Date(searchParams.date), 'EEE, MMM d') : ''

  // Filter flights
  const filteredFlights = flights.filter(flight => {
    const matchesAircraft = 
      aircraftFilter === 'all' || 
      (aircraftFilter === 'boeing' && flight.aircraft_type.toLowerCase().includes('boeing')) ||
      (aircraftFilter === 'airbus' && flight.aircraft_type.toLowerCase().includes('airbus'));
    const matchesPrice = flight.base_price <= maxPrice;
    return matchesAircraft && matchesPrice;
  })

  // Sort flights
  const sortedFlights = [...filteredFlights].sort((a, b) => {
    if (sortBy === 'price_asc') return a.base_price - b.base_price
    if (sortBy === 'price_desc') return b.base_price - a.base_price
    
    if (sortBy === 'duration_asc') {
      const durA = new Date(a.arrives_at).getTime() - new Date(a.departs_at).getTime()
      const durB = new Date(b.arrives_at).getTime() - new Date(b.departs_at).getTime()
      return durA - durB
    }
    
    if (sortBy === 'departs_asc') {
      return new Date(a.departs_at).getTime() - new Date(b.departs_at).getTime()
    }
    return 0
  })

  return (
    <div className="min-h-screen pt-24 pb-20 px-4">
      <AnimatedBackground variant="minimal" />

      <div className="max-w-3xl mx-auto">
        {/* Header breadcrumb */}
        <div className="animate-fade-in-up mb-8">
          <div className="flex items-center gap-2 text-xs text-slate-600 mb-4 font-mono">
            <button onClick={() => router.push('/')} className="hover:text-indigo-400 transition-colors">Home</button>
            <span>/</span>
            <span className="text-slate-500">
              {searchParams.origin} → {searchParams.destination}
            </span>
          </div>
          
          <div className="flex items-end justify-between gap-4 flex-wrap">
            <div>
              <h1 className="text-3xl font-display font-bold text-white tracking-tight">
                {searchParams.origin}
                <span className="text-slate-600 mx-3">→</span>
                {searchParams.destination}
              </h1>
              <p className="text-slate-500 mt-1 text-sm">
                {dateDisplay} · {searchParams.passengers} passenger{Number(searchParams.passengers) > 1 ? 's' : ''}
              </p>
            </div>
            {flights.length > 0 && (
              <span className="text-xs bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-3 py-1.5 rounded-full font-medium">
                {flights.length} flight{flights.length !== 1 ? 's' : ''} found
              </span>
            )}
          </div>
        </div>

        {/* Filters Dashboard Card */}
        {flights.length > 0 && (
          <div className="mb-6 p-4 rounded-2xl border border-white/6 bg-[#0c0c16]/50 backdrop-blur-md flex flex-col md:flex-row md:items-center justify-between gap-5 animate-fade-in-up" style={{ animationDelay: '50ms' }}>
            {/* Sort Dropdown */}
            <div className="flex flex-col gap-1.5 flex-1 min-w-[150px]">
              <span className="text-[9px] font-semibold text-slate-500 uppercase tracking-widest font-mono">Sort by</span>
              <div className="relative">
                <select
                  value={sortBy}
                  onChange={e => setSortBy(e.target.value as 'price_asc' | 'price_desc' | 'duration_asc' | 'departs_asc')}
                  className="w-full h-9 px-3 pr-8 rounded-lg border border-white/8 bg-slate-900/60 text-xs text-slate-300 focus:outline-none focus:border-indigo-500/40 cursor-pointer appearance-none"
                >
                  <option value="price_asc">Price: Low to High</option>
                  <option value="price_desc">Price: High to Low</option>
                  <option value="duration_asc">Duration: Shortest</option>
                  <option value="departs_asc">Departure: Earliest</option>
                </select>
                <div className="absolute right-3 top-2.5 pointer-events-none text-slate-600">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                    <path d="m6 9 6 6 6-6"/>
                  </svg>
                </div>
              </div>
            </div>

            {/* Aircraft Filter */}
            <div className="flex flex-col gap-1.5 flex-1 min-w-[150px]">
              <span className="text-[9px] font-semibold text-slate-500 uppercase tracking-widest font-mono">Aircraft</span>
              <div className="relative">
                <select
                  value={aircraftFilter}
                  onChange={e => setAircraftFilter(e.target.value as 'all' | 'boeing' | 'airbus')}
                  className="w-full h-9 px-3 pr-8 rounded-lg border border-white/8 bg-slate-900/60 text-xs text-slate-300 focus:outline-none focus:border-indigo-500/40 cursor-pointer appearance-none"
                >
                  <option value="all">All Fleets</option>
                  <option value="boeing">Boeing only</option>
                  <option value="airbus">Airbus only</option>
                </select>
                <div className="absolute right-3 top-2.5 pointer-events-none text-slate-600">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                    <path d="m6 9 6 6 6-6"/>
                  </svg>
                </div>
              </div>
            </div>

            {/* Max Budget Slider */}
            <div className="flex flex-col gap-1.5 flex-1 min-w-[200px]">
              <div className="flex justify-between items-center text-[9px] font-semibold text-slate-500 uppercase tracking-widest font-mono">
                <span>Max Budget</span>
                <span className="text-xs font-mono font-bold text-indigo-400">₹{maxPrice.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex items-center gap-3 h-9">
                <input
                  type="range"
                  min={3000}
                  max={maxPrice}
                  step={500}
                  value={maxPrice}
                  onChange={e => setMaxPrice(Number(e.target.value))}
                  className="w-full accent-indigo-500 bg-white/10 h-1.5 rounded-lg cursor-pointer"
                />
              </div>
            </div>
          </div>
        )}

        {/* Results */}
        {sortedFlights.length === 0 ? (
          <div className="animate-fade-in-up flex flex-col items-center justify-center py-24 text-center">
            {/* Empty state illustration */}
            <div className="relative w-24 h-24 mb-6">
              <div className="absolute inset-0 rounded-full bg-indigo-500/5 border border-indigo-500/10 animate-radar" />
              <div className="absolute inset-4 rounded-full bg-indigo-500/5 border border-indigo-500/10 animate-radar" style={{ animationDelay: '1s' }} />
              <div className="absolute inset-0 flex items-center justify-center">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-slate-600">
                  <path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z" fill="currentColor"/>
                </svg>
              </div>
            </div>
            <h3 className="text-xl font-display font-bold text-slate-300 mb-2">No flights found</h3>
            <p className="text-sm text-slate-600 max-w-sm mb-8">
              No flights match your filter criteria. Try adjusting your budget or selecting a different fleet.
            </p>
            <Button variant="outline" onClick={() => {
              setAircraftFilter('all')
              if (flights.length > 0) {
                const highest = Math.max(...flights.map(f => f.base_price))
                const bufferMax = Math.ceil((highest * 1.1) / 500) * 500
                setMaxPrice(bufferMax)
              } else {
                setMaxPrice(12000)
              }
            }}>
              Reset Filters
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {sortedFlights.map((flight, index) => (
              <FlightCard 
                key={flight.id}
                flight={flight} 
                onSelect={handleSelectFlight}
                index={index}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
