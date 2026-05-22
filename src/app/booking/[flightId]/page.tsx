'use client'

import { useEffect, useState, use } from 'react'
import { useRouter } from 'next/navigation'
import { useFlightStore, Seat } from '@/store/flightStore'
import { useRealtimeSeats } from '@/hooks/useRealtimeSeats'
import { SeatMap } from '@/components/booking/SeatMap'
import { Button } from '@/components/ui/Button'
import { AnimatedBackground } from '@/components/ui/AnimatedBackground'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'

export default function SeatSelectionPage({ params }: { params: Promise<{ flightId: string }> }) {
  const router = useRouter()
  const { flightId } = use(params)
  const { searchQuery, selectedFlight, selectedSeat, setSelectedSeat, setSelectedSeats, currentStep } = useFlightStore()
  
  const { seats, loading, error, broadcastLock } = useRealtimeSeats(flightId)
  
  const passengerCount = searchQuery?.passengers || 1
  const [activePassengerIndex, setActivePassengerIndex] = useState(0)
  const [selectedSeatsList, setSelectedSeatsList] = useState<(Seat | null)[]>(() => {
    return Array(passengerCount).fill(null)
  })

  useEffect(() => {
    if (!selectedFlight && !loading) {
      router.push('/')
      return
    }
    if (selectedFlight && new Date(selectedFlight.departs_at).getTime() <= Date.now()) {
      router.push('/')
      return
    }
  }, [selectedFlight, loading, router])

  // Cleanup seat locks when closing tab, refreshing, or navigating away
  useEffect(() => {
    const releaseAllSelectedLocks = () => {
      selectedSeatsList.forEach(seat => {
        if (seat) {
          broadcastLock(seat.id, false)
        }
      })
    }

    window.addEventListener('beforeunload', releaseAllSelectedLocks)
    window.addEventListener('unload', releaseAllSelectedLocks)

    return () => {
      window.removeEventListener('beforeunload', releaseAllSelectedLocks)
      window.removeEventListener('unload', releaseAllSelectedLocks)
      
      // If we are unmounting and no seats are in the flight store, release locks
      const finalSelectedSeats = useFlightStore.getState().selectedSeats
      if (finalSelectedSeats.length === 0) {
        releaseAllSelectedLocks()
      }
    }
  }, [selectedSeatsList, broadcastLock])

  const handleSelectSeat = (seat: Seat) => {
    const newSeatsList = [...selectedSeatsList]
    const alreadyIndex = newSeatsList.findIndex(s => s?.id === seat.id)
    
    // If clicking the active passenger's already selected seat, deselect it
    if (alreadyIndex === activePassengerIndex) {
      newSeatsList[activePassengerIndex] = null
      setSelectedSeatsList(newSeatsList)
      broadcastLock(seat.id, false)
      return
    }
    
    // If the seat is already assigned to a different passenger, unassign it
    if (alreadyIndex !== -1) {
      newSeatsList[alreadyIndex] = null
    }
    
    // Release active passenger's old seat lock if they had one
    const oldSeat = selectedSeatsList[activePassengerIndex]
    if (oldSeat) {
      broadcastLock(oldSeat.id, false)
    }
    
    // Assign the clicked seat to the active passenger
    newSeatsList[activePassengerIndex] = seat
    setSelectedSeatsList(newSeatsList)
    
    // Broadcast lock state for the new seat
    broadcastLock(seat.id, true)
    
    // Automatically select the next passenger index who doesn't have a seat yet
    const nextEmptyIndex = newSeatsList.findIndex((s, idx) => s === null && idx !== activePassengerIndex)
    if (nextEmptyIndex !== -1) {
      setActivePassengerIndex(nextEmptyIndex)
    }
  }

  const handleContinue = () => {
    const seatsToProceed = selectedSeatsList.filter((s): s is Seat => s !== null)
    if (seatsToProceed.length === passengerCount) {
      setSelectedSeats(seatsToProceed)
      setSelectedSeat(seatsToProceed[0]) // Fallback for single-seat usage
      router.push(`/booking/${flightId}/passengers`)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <AnimatedBackground />
        <div className="text-center animate-fade-in">
          <div className="w-10 h-10 border border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm text-slate-500">Loading cabin map…</p>
        </div>
      </div>
    )
  }

  if (!selectedFlight) return null

  const isAllSeatsSelected = selectedSeatsList.filter(Boolean).length === passengerCount
  const totalPrice = selectedFlight.base_price * passengerCount + selectedSeatsList.reduce((acc, s) => acc + (s?.extra_fee || 0), 0)

  return (
    <div className="min-h-screen pt-20">
      <AnimatedBackground />

      <div className="max-w-6xl mx-auto px-4 py-8 flex flex-col lg:flex-row gap-8">

        {/* Left: Seat map & Passenger Picker */}
        <div className="flex-1 animate-fade-in-up">
          {/* Page header */}
          <div className="mb-6">
            <button onClick={() => router.back()} className="flex items-center gap-2 text-xs text-slate-600 hover:text-indigo-400 transition-colors mb-4 font-medium">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M19 12H5M5 12l7 7M5 12l7-7" />
              </svg>
              Back to flights
            </button>
            <div className="flex items-baseline gap-3 mb-1">
              <h1 className="text-2xl font-display font-bold text-white">Select your seats</h1>
            </div>
            <p className="text-sm text-slate-500">
              {selectedFlight.origin} → {selectedFlight.destination} · {selectedFlight.flight_no} · {passengerCount} Passenger{passengerCount > 1 ? 's' : ''}
            </p>
          </div>

          {/* Passenger Selector Bar */}
          <div className="mb-6 p-4 rounded-2xl border border-white/6 bg-gradient-to-b from-[#0c0c18]/80 to-[#08080f]/80 backdrop-blur-md">
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
              Assign seat per passenger
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
              {Array.from({ length: passengerCount }).map((_, idx) => {
                const assignedSeat = selectedSeatsList[idx]
                const isActive = activePassengerIndex === idx
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setActivePassengerIndex(idx)}
                    className={cn(
                      "flex items-center justify-between p-3 rounded-xl border transition-all duration-200 text-left",
                      isActive
                        ? "bg-indigo-600/10 border-indigo-500/40 text-white shadow-[0_0_15px_rgba(99,102,241,0.12)]"
                        : "bg-white/1 border-white/5 text-slate-400 hover:bg-white/2"
                    )}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className={cn(
                        "w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold font-mono",
                        isActive ? "bg-indigo-500 text-white" : "bg-slate-800 text-slate-400"
                      )}>
                        {idx + 1}
                      </div>
                      <div>
                        <div className="text-xs font-semibold text-slate-200">Passenger {idx + 1}</div>
                        <div className="text-[9px] text-slate-500">Seat Assignment</div>
                      </div>
                    </div>
                    {assignedSeat ? (
                      <span className={cn(
                        "px-2 py-0.5 rounded text-[10px] font-bold font-mono",
                        assignedSeat.class === 'first' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/20' :
                        assignedSeat.class === 'business' ? 'bg-violet-500/20 text-violet-300 border border-violet-500/20' :
                        'bg-indigo-500/20 text-indigo-300 border border-indigo-500/20'
                      )}>
                        {assignedSeat.seat_number}
                      </span>
                    ) : (
                      <span className="text-[9px] text-rose-400/80 italic font-medium">Select seat</span>
                    )}
                  </button>
                )
              })}
            </div>
          </div>
          
          <SeatMap 
            seats={seats} 
            selectedSeats={selectedSeatsList.filter((s): s is Seat => s !== null)} 
            onSelectSeat={handleSelectSeat}
          />
        </div>

        {/* Right: Sticky summary */}
        <div className="lg:w-72 flex-shrink-0">
          <div className="sticky top-24">
            <div className="rounded-2xl border border-white/6 bg-gradient-to-b from-[#0c0c18] to-[#090912] overflow-hidden animate-fade-in-up" style={{ animationDelay: '100ms' }}>
              {/* Header */}
              <div className="px-5 py-4 border-b border-white/5">
                <div className="text-[10px] font-semibold text-slate-600 uppercase tracking-widest mb-2">Your Flight</div>
                <div className="flex items-center gap-3">
                  <div className="text-2xl font-display font-bold text-white">{selectedFlight.origin}</div>
                  <div className="flex-1 flex items-center">
                    <div className="flex-1 h-px bg-gradient-to-r from-white/5 via-indigo-500/30 to-white/5" />
                    <svg className="mx-2 text-indigo-400 flex-shrink-0" width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z"/>
                    </svg>
                    <div className="flex-1 h-px bg-gradient-to-l from-white/5 via-indigo-500/30 to-white/5" />
                  </div>
                  <div className="text-2xl font-display font-bold text-white">{selectedFlight.destination}</div>
                </div>
                <div className="text-xs text-slate-600 mt-1.5">
                  {format(new Date(selectedFlight.departs_at), 'EEE, MMM d · HH:mm')}
                </div>
              </div>

              {/* Selected seats list summary */}
              <div className="px-5 py-4 border-b border-white/5">
                <div className="text-[10px] font-semibold text-slate-600 uppercase tracking-widest mb-2">Selected Seats</div>
                <div className="space-y-2">
                  {selectedSeatsList.map((assignedSeat, idx) => (
                    <div key={idx} className="flex items-center justify-between">
                      <span className="text-xs text-slate-400">Pax {idx + 1}</span>
                      {assignedSeat ? (
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] font-mono text-slate-300">{assignedSeat.seat_number} ({assignedSeat.class})</span>
                          {assignedSeat.extra_fee > 0 && (
                            <span className="text-[10px] text-amber-400 font-semibold font-mono">+₹{assignedSeat.extra_fee}</span>
                          )}
                        </div>
                      ) : (
                        <span className="text-[10px] text-slate-600 italic">Pending assignment</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Pricing */}
              <div className="px-5 py-4 border-b border-white/5 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Base fare ({passengerCount}x)</span>
                  <span className="text-slate-300 font-mono">₹{selectedFlight.base_price * passengerCount}</span>
                </div>
                {selectedSeatsList.some(s => s && s.extra_fee > 0) && (
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Seat upgrades</span>
                    <span className="text-amber-400 font-mono">
                      +₹{selectedSeatsList.reduce((acc, s) => acc + (s?.extra_fee || 0), 0)}
                    </span>
                  </div>
                )}
              </div>

              <div className="px-5 py-4">
                <div className="flex justify-between items-baseline mb-5">
                  <span className="text-xs text-slate-500 uppercase tracking-wider">Total</span>
                  <span className="text-2xl font-display font-bold text-white">₹{totalPrice}</span>
                </div>
                <Button 
                  variant="glow"
                  className="w-full h-11"
                  disabled={!isAllSeatsSelected}
                  onClick={handleContinue}
                >
                  Continue →
                </Button>
                {!isAllSeatsSelected && (
                  <p className="text-[10px] text-slate-600 text-center mt-2">Assign seats for all passengers to proceed</p>
                )}
              </div>
            </div>

            {/* Realtime indicator */}
            <div className="mt-3 flex items-center gap-2 text-[10px] text-slate-600 justify-center">
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-400" />
              </span>
              Live seat availability
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
