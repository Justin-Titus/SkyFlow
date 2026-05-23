import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { cn, isUuid } from '@/lib/utils'
import { Booking } from '@/store/userStore'
import { createClient } from '@/lib/supabase/client'
import { useFlightStore } from '@/store/flightStore'
import { getMockAlternativeFlights } from '@/lib/mockFlights'
import { motion } from 'framer-motion'
import { format } from 'date-fns'

const supabase = createClient()

interface RescheduleDialogProps {
  bookingId: string;
  currentFlightId: string;
  origin: string;
  destination: string;
  seatClass: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  booking?: Booking;
}

export function RescheduleDialog({ bookingId, currentFlightId, origin, destination, seatClass, open, onOpenChange, onSuccess, booking }: RescheduleDialogProps) {
  const [loading, setLoading] = useState(false)
  const [flights, setFlights] = useState<import('@/store/flightStore').Flight[]>([])
  const [selectedFlightId, setSelectedFlightId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [currentBooking, setCurrentBooking] = useState<Booking | null>(null)
  
  // Payment states
  const [cardName, setCardName] = useState('')
  const [cardNumber, setCardNumber] = useState('')
  const [expiry, setExpiry] = useState('')
  const [cvv, setCvv] = useState('')

  const router = useRouter()
  const scrollContainerRef = useRef<HTMLDivElement>(null)

  // Scroll to top when flight is selected to bring payment form into view
  useEffect(() => {
    if (selectedFlightId && scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = 0
    }
  }, [selectedFlightId])

  // Load current booking details
  useEffect(() => {
    if (open) {
      if (booking) {
        setCurrentBooking(booking)
      } else if (bookingId) {
        try {
          const localBookings = JSON.parse(localStorage.getItem('skyflow_local_bookings') || '[]')
          const matched = localBookings.find((b: Booking) => b.id === bookingId)
          if (matched) {
            setCurrentBooking(matched)
          }
        } catch (e) {
          console.error('Failed to read current booking details:', e)
        }
      }
    }
  }, [open, booking, bookingId])

  const fetchAlternativeFlights = useCallback(async () => {
    setLoading(true)
    setError(null)

    if (!isUuid(currentFlightId)) {
      const mockList = getMockAlternativeFlights(origin, destination, currentFlightId)
      setFlights(mockList)
      setLoading(false)
      return
    }

    try {
      const { data, error } = await supabase
        .from('flights')
        .select(`
          *,
          seats(id, class, is_available)
        `)
        .eq('origin', origin)
        .eq('destination', destination)
        .neq('id', currentFlightId)
        .gt('departs_at', new Date().toISOString())
        .order('departs_at', { ascending: true })

      if (error) throw error
      
      const availableFlights = (data || []).filter(f => {
        const availableSeats = f.seats.filter((s: { class: string; is_available: boolean }) => s.class === seatClass && s.is_available)
        return availableSeats.length > 0
      })

      setFlights(availableFlights)
    } catch (err: unknown) {
      console.warn('Flight lookup failed:', (err as Error)?.message || err)
      const mockList = getMockAlternativeFlights(origin, destination, currentFlightId)
      setFlights(mockList)
    } finally {
      setLoading(false)
    }
  }, [origin, destination, currentFlightId, seatClass, supabase])

  useEffect(() => {
    if (open) {
      fetchAlternativeFlights()
      setSelectedFlightId(null)
      setCardName('')
      setCardNumber('')
      setExpiry('')
      setCvv('')
      setError(null)
    }
  }, [open, fetchAlternativeFlights])

  const selectedFlight = flights.find(f => f.id === selectedFlightId)
  const currentFlightBasePrice = Number(currentBooking?.flights?.base_price) || 0
  const selectedFlightBasePrice = Number(selectedFlight?.base_price) || 0
  
  const passengerCount = currentBooking?.passengers?.length || currentBooking?.seats_list?.length || 1
  const priceDiff = selectedFlightBasePrice - currentFlightBasePrice
  const totalUpgradeFee = priceDiff > 0 ? priceDiff * passengerCount : 0

  const isPaymentValid = cardName.trim().length >= 3 && cardNumber.replace(/\s+/g, '').length === 16 && expiry.length === 5 && cvv.length === 3
  const isConfirmDisabled = !selectedFlightId || (totalUpgradeFee > 0 && !isPaymentValid)

  const handleReschedule = async () => {
    if (!selectedFlightId) return
    setLoading(true)
    setError(null)
    
    try {
      // Validate payment if there is an upgrade fee
      if (totalUpgradeFee > 0) {
        const cleanCard = cardNumber.replace(/\s+/g, '')
        if (cleanCard.length !== 16 || expiry.length !== 5 || cvv.length !== 3 || cardName.trim().length < 3) {
          throw new Error('Please fill in all credit card details correctly.')
        }
        
        const [month] = expiry.split('/')
        const m = parseInt(month, 10)
        if (m < 1 || m > 12) {
          throw new Error('Expiration month must be between 01 and 12.')
        }

        // Validate expiry date is not in the past
        const parts = expiry.split('/')
        if (parts.length !== 2) {
          throw new Error('Invalid expiration date format')
        }
        const [monthStr, yearStr] = parts
        const expiryMonth = parseInt(monthStr, 10)
        const expiryYearShort = parseInt(yearStr, 10)

        // Convert 2-digit year to 4-digit year (assume 20xx for 00-99)
        const currentYear = new Date().getFullYear()
        const currentYearShort = currentYear % 100
        let expiryYear = 2000 + expiryYearShort
        if (expiryYearShort < currentYearShort) {
          expiryYear = 2100 + expiryYearShort
        }

        // Check if card is expired (compare with current month/year)
        const now = new Date()
        const expiryDate = new Date(expiryYear, expiryMonth, 0) // Last day of expiry month
        if (expiryDate < now) {
          throw new Error('Credit card has expired')
        }

        // Simulate payment authorization delay
        await new Promise(resolve => setTimeout(resolve, 1500))
      }

      const res = await fetch(`/api/bookings/${bookingId}/reschedule`, { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newFlightId: selectedFlightId })
      })
      let data
      const text = await res.text()
      try {
        data = text ? JSON.parse(text) : null
      } catch {
        throw new Error(text || 'Failed to parse response')
      }
      if (!res.ok || !data.success) throw new Error(data.error || 'Failed to reschedule')
      
      // Update local storage bookings list for robust fallback syncing
      try {
        const localBookings = JSON.parse(localStorage.getItem('skyflow_local_bookings') || '[]')
        const idx = localBookings.findIndex((b: Booking) => b.id === bookingId)
        if (idx !== -1 && selectedFlight) {
          localBookings[idx].status = 'rescheduled'
          localBookings[idx].flight_id = selectedFlight.id
          
          localBookings[idx].flights = {
            id: selectedFlight.id,
            flight_no: selectedFlight.flight_no,
            origin: selectedFlight.origin,
            destination: selectedFlight.destination,
            departs_at: selectedFlight.departs_at,
            arrives_at: selectedFlight.arrives_at,
            aircraft_type: selectedFlight.aircraft_type,
            base_price: selectedFlight.base_price,
            status: selectedFlight.status || 'scheduled'
          }

          const currentSeatClass = localBookings[idx].seats_list?.[0]?.class || localBookings[idx].seats?.class || 'economy'
          
          // Generate realistic seat numbers for the passenger count
          const newSeatsList: import('@/store/flightStore').Seat[] = []
          const rowStart = currentSeatClass === 'first' ? 1 : currentSeatClass === 'business' ? 3 : 8
          const seatLetters = currentSeatClass === 'first' ? ['A', 'F'] : currentSeatClass === 'business' ? ['A', 'C', 'D', 'F'] : ['A', 'B', 'C', 'D', 'E', 'F']
          
          for (let pIdx = 0; pIdx < passengerCount; pIdx++) {
            const row = rowStart + Math.floor(pIdx / seatLetters.length)
            const letter = seatLetters[pIdx % seatLetters.length]
            const seatNo = `${row}${letter}`
            
            newSeatsList.push({
              id: `seat-${selectedFlight.id}-rescheduled-${pIdx}`,
              flight_id: selectedFlight.id,
              seat_number: seatNo,
              class: currentSeatClass,
              extra_fee: 0,
              is_available: false
            })
          }

          localBookings[idx].seats = newSeatsList[0]
          localBookings[idx].seats_list = newSeatsList
          
          // Update passengers' seat assignments to remain consistent and eliminate mismatches
          if (localBookings[idx].passengers) {
            localBookings[idx].passengers = localBookings[idx].passengers.map((p: import('@/store/flightStore').PassengerFormData, pIdx: number) => ({
              ...p,
              seat_number: newSeatsList[pIdx]?.seat_number || newSeatsList[0].seat_number,
              seat_class: currentSeatClass
            }))
          }

          localBookings[idx].total_price = Number(localBookings[idx].total_price) + totalUpgradeFee
          localStorage.setItem('skyflow_local_bookings', JSON.stringify(localBookings))
        }
      } catch (localErr) {
        console.error('Failed to update local bookings for reschedule:', localErr)
      }

      useFlightStore.getState().resetBooking()
      onSuccess()
      onOpenChange(false)
      router.refresh()
    } catch (err: unknown) {
      setError((err as Error)?.message || 'Failed to reschedule booking. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="absolute inset-0 bg-black/70 backdrop-blur-sm" 
        onClick={() => !loading && onOpenChange(false)} 
      />
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        transition={{ duration: 0.25, ease: "easeOut" }}
        className="relative w-full max-w-lg rounded-2xl border border-white/8 bg-gradient-to-b from-[#0e0e1c] to-[#0a0a14] shadow-[0_24px_80px_rgba(0,0,0,0.7)] overflow-hidden max-h-[85vh] flex flex-col z-10"
      >
            <div className="h-px bg-gradient-to-r from-transparent via-indigo-500/40 to-transparent" />
            
            <div className="p-6 flex-shrink-0 border-b border-white/5 bg-white/[0.01]">
              <div className="flex items-center gap-2 mb-3">
                <span className={cn(
                  "text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider font-mono",
                  !selectedFlightId 
                    ? "bg-indigo-500/10 text-indigo-400 border border-indigo-500/15" 
                    : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/15"
                )}>
                  {!selectedFlightId ? "Step 1: Select Flight" : "Step 1: Completed"}
                </span>
                <span className="text-slate-700 text-xs">→</span>
                <span className={cn(
                  "text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider font-mono",
                  !selectedFlightId
                    ? "bg-white/5 text-slate-500 border border-white/5"
                    : totalUpgradeFee > 0
                      ? "bg-amber-500/10 text-amber-400 border border-amber-500/15 animate-pulse"
                      : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/15"
                )}>
                  {totalUpgradeFee > 0 ? "Step 2: Upgrade Payment" : "Step 2: Confirm Reschedule"}
                </span>
              </div>
              <h2 className="text-xl font-display font-bold text-white mb-1">
                {!selectedFlightId ? "Reschedule Flight" : (totalUpgradeFee > 0 ? "Upgrade Payment" : "Confirm Reschedule")}
              </h2>
              <p className="text-xs text-slate-400">
                {!selectedFlightId 
                  ? `Select a new flight from ${origin} to ${destination} in ${seatClass} class.` 
                  : (totalUpgradeFee > 0 
                      ? "Please complete the secure payment below to confirm your new flight." 
                      : "Review your selected flight and confirm changes below.")}
              </p>
            </div>

            <div ref={scrollContainerRef} className="flex-1 overflow-y-auto px-6 py-6 space-y-4">
              {error && <div className="p-3 rounded-xl bg-red-500/5 border border-red-500/15 text-red-400 text-xs">{error}</div>}
              
              {!selectedFlightId ? (
                <>
                  {loading && flights.length === 0 ? (
                    <div className="py-8 text-center text-slate-500 text-sm animate-pulse">Loading available flights...</div>
                  ) : flights.length === 0 ? (
                    <div className="py-8 text-center text-slate-500 text-sm border rounded-xl border-dashed border-white/10">
                      No alternative flights available at this time.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {flights.map(f => {
                        const diff = Number(f.base_price) - currentFlightBasePrice
                        return (
                          <button
                            key={f.id}
                            onClick={() => setSelectedFlightId(f.id)}
                            className="w-full text-left p-4 rounded-xl border bg-white/1 border-white/5 text-slate-400 hover:bg-white/2 hover:border-white/10 transition-all duration-200"
                          >
                            <div className="flex justify-between items-center mb-2">
                              <span className="text-xs font-semibold font-mono text-slate-200">{f.flight_no}</span>
                              <span className="text-xs font-semibold text-slate-200 font-mono">
                                {diff > 0 ? `+₹${diff * passengerCount}` : 'Free reschedule'}
                              </span>
                            </div>
                            <div className="flex items-center gap-4 text-xs font-mono">
                              <div>
                                <div>{f.departs_at ? format(new Date(f.departs_at), 'HH:mm') : ''}</div>
                                <div className="text-[10px] text-slate-600">Departs</div>
                              </div>
                              <div className="text-slate-600 font-sans">→</div>
                              <div>
                                <div>{f.arrives_at ? format(new Date(f.arrives_at), 'HH:mm') : ''}</div>
                                <div className="text-[10px] text-slate-600">Arrives</div>
                              </div>
                              <div className="ml-auto text-[10px] text-slate-500">{f.aircraft_type}</div>
                            </div>
                          </button>
                        )
                      })}
                    </div>
                  )}
                </>
              ) : (
                <div className="space-y-5">
                  {/* Compact Selected Flight Banner */}
                  <div className="flex items-center justify-between p-3.5 rounded-xl border border-indigo-500/15 bg-indigo-600/5 relative overflow-hidden">
                    <div className="absolute top-0 left-0 bottom-0 w-1 bg-gradient-to-b from-indigo-500 to-purple-600" />
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 pl-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-white font-mono bg-white/5 px-2 py-0.5 rounded border border-white/5">
                          {selectedFlight?.flight_no}
                        </span>
                        <div className="text-xs font-mono">
                          <span className="text-slate-200 font-semibold">
                            {selectedFlight?.departs_at ? format(new Date(selectedFlight.departs_at), 'HH:mm') : ''}
                          </span>
                          <span className="text-slate-500 mx-1.5">→</span>
                          <span className="text-slate-200 font-semibold">
                            {selectedFlight?.arrives_at ? format(new Date(selectedFlight.arrives_at), 'HH:mm') : ''}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-600" />
                        <span className={cn(
                          "text-xs font-bold font-mono px-2 py-0.5 rounded",
                          totalUpgradeFee > 0 
                            ? "bg-amber-500/10 text-amber-400 border border-amber-500/15" 
                            : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/15"
                        )}>
                          {totalUpgradeFee > 0 ? `+₹${totalUpgradeFee}` : 'Free Reschedule'}
                        </span>
                      </div>
                    </div>
                    <button 
                      onClick={() => setSelectedFlightId(null)}
                      className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold transition-all flex items-center gap-1 bg-indigo-500/5 hover:bg-indigo-500/10 px-2.5 py-1.5 rounded-lg border border-indigo-500/10 shadow-sm"
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="M19 12H5M5 12l7 7M5 12l7-7" />
                      </svg>
                      Change
                    </button>
                  </div>

                  {totalUpgradeFee > 0 ? (
                    <div className="space-y-4">
                      {/* Visual Credit Card Preview */}
                      <div className="relative w-full aspect-[1.586/1] rounded-2xl bg-gradient-to-br from-[#1d1d36] via-[#15152a] to-[#0e0e1c] border border-white/10 p-5 flex flex-col justify-between shadow-[0_12px_32px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.05)] overflow-hidden group">
                        {/* Glow effects */}
                        <div className="absolute -top-12 -right-12 w-40 h-40 bg-indigo-500/10 rounded-full blur-2xl group-hover:bg-indigo-500/15 transition-all duration-500 pointer-events-none" />
                        <div className="absolute -bottom-12 -left-12 w-40 h-40 bg-purple-500/10 rounded-full blur-2xl group-hover:bg-purple-500/15 transition-all duration-500 pointer-events-none" />
                        
                        {/* Top Row: Brand & Chip */}
                        <div className="flex justify-between items-start">
                          {/* Chip */}
                          <div className="w-10 h-8 rounded-md bg-gradient-to-br from-amber-400/80 to-amber-500/60 p-1.5 shadow-inner relative flex items-center justify-center">
                            <div className="w-full h-full border border-amber-600/30 rounded flex flex-wrap gap-0.5 p-0.5">
                              <div className="w-1.5 h-1.5 border-r border-b border-amber-600/20" />
                              <div className="w-1.5 h-1.5 border-b border-amber-600/20" />
                              <div className="w-1.5 h-1.5 border-l border-b border-amber-600/20" />
                              <div className="w-1.5 h-1.5 border-r border-amber-600/20" />
                              <div className="w-1.5 h-1.5 border-amber-600/20" />
                              <div className="w-1.5 h-1.5 border-l border-amber-600/20" />
                            </div>
                          </div>
                          {/* Brand Logo */}
                          <div className="text-right">
                            <span className="text-xs font-bold tracking-widest text-white/90 font-display">SKYFLOW</span>
                            <div className="text-[7px] text-slate-500 uppercase tracking-widest font-mono">Premium Pay</div>
                          </div>
                        </div>

                        {/* Card Number */}
                        <div className="my-auto py-2">
                          <div className="text-base sm:text-lg font-mono tracking-[0.18em] text-white font-medium drop-shadow-md select-none text-center">
                            {cardNumber || "•••• •••• •••• ••••"}
                          </div>
                        </div>

                        {/* Bottom Row: Cardholder & Expiry */}
                        <div className="flex justify-between items-end">
                          <div className="space-y-0.5 max-w-[70%]">
                            <div className="text-[7px] text-slate-500 uppercase tracking-wider font-semibold">Cardholder</div>
                            <div className="text-[10px] sm:text-xs font-mono font-medium tracking-wide text-white/90 truncate uppercase select-none">
                              {cardName || "Your Name"}
                            </div>
                          </div>
                          <div className="text-right space-y-0.5">
                            <div className="text-[7px] text-slate-500 uppercase tracking-wider font-semibold">Expires</div>
                            <div className="text-[10px] sm:text-xs font-mono font-medium text-white/90 select-none">
                              {expiry || "MM/YY"}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Card Inputs Form */}
                      <div className="p-4 rounded-xl border border-white/8 bg-gradient-to-b from-[#111124] to-[#0d0d1a] space-y-4">
                        <div className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-indigo-400">
                            <rect x="2" y="5" width="20" height="14" rx="2" ry="2"/>
                            <line x1="2" y1="10" x2="22" y2="10"/>
                          </svg>
                          Card Information
                        </div>
                        <div className="space-y-3">
                          <Input
                            label="Cardholder Name"
                            placeholder="Name on card"
                            value={cardName}
                            onChange={(e) => setCardName(e.target.value)}
                            disabled={loading}
                            required
                          />
                          <Input
                            label="Card Number"
                            placeholder="4111 2222 3333 4444"
                            value={cardNumber}
                            onChange={(e) => {
                              let val = e.target.value.replace(/\D/g, '').slice(0, 16)
                              setCardNumber(val.replace(/(\d{4})(?=\d)/g, '$1 '))
                            }}
                            disabled={loading}
                            required
                          />
                          <div className="grid grid-cols-2 gap-4">
                            <Input
                              label="Expiry Date"
                              placeholder="MM/YY"
                              value={expiry}
                              onChange={(e) => {
                                let val = e.target.value.replace(/\D/g, '').slice(0, 4)
                                if (val.length > 2) {
                                  setExpiry(`${val.slice(0, 2)}/${val.slice(2)}`)
                                } else {
                                  setExpiry(val)
                                }
                              }}
                              disabled={loading}
                              required
                            />
                            <Input
                              label="CVV"
                              type="password"
                              placeholder="•••"
                              value={cvv}
                              onChange={(e) => setCvv(e.target.value.replace(/\D/g, '').slice(0, 3))}
                              disabled={loading}
                              required
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 rounded-xl border border-emerald-500/10 bg-emerald-500/5 text-xs text-slate-400 flex items-start gap-2.5">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-emerald-400 mt-0.5 flex-shrink-0">
                        <circle cx="12" cy="12" r="10"/>
                        <path d="m9 12 2 2 4-4"/>
                      </svg>
                      <div>
                        <div className="font-bold text-emerald-400 mb-0.5">Free Rescheduling Available</div>
                        No additional fare or taxes apply for this flight selection. Click below to confirm rescheduling.
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
 
            <div className="p-6 flex gap-3 flex-shrink-0 mt-auto bg-[#0a0a14] border-t border-white/5">
              <Button variant="secondary" className="flex-1" onClick={() => onOpenChange(false)} disabled={loading}>
                Cancel
              </Button>
              <Button 
                variant="glow" 
                className="flex-1" 
                onClick={handleReschedule} 
                isLoading={loading} 
                disabled={isConfirmDisabled}
              >
                {!selectedFlightId ? 'Select a Flight' : (totalUpgradeFee > 0 ? `Pay & Confirm (₹${totalUpgradeFee})` : 'Confirm Changes')}
              </Button>
            </div>
          </motion.div>
        </div>
  )
}
