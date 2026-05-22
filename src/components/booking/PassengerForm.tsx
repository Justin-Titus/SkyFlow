'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useFlightStore, PassengerFormData } from '@/store/flightStore'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { AnimatedBackground } from '@/components/ui/AnimatedBackground'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'
import dynamic from 'next/dynamic'

const PaymentModal = dynamic(
  () => import('@/components/booking/PaymentModal').then(mod => mod.PaymentModal),
  { ssr: false }
)

const STEPS = ['Seat', 'Passenger', 'Confirm']

function ProgressSteps({ current }: { current: number }) {
  return (
    <div className="flex items-center gap-0 mb-10">
      {STEPS.map((step, i) => (
        <div key={step} className="flex items-center">
          <div className="flex items-center gap-2">
            <div className={cn(
              "w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold border transition-all duration-300",
              i < current ? 'bg-indigo-500 border-indigo-500 text-white' :
              i === current ? 'bg-indigo-500/20 border-indigo-500/50 text-indigo-300' :
              'bg-white/3 border-white/8 text-slate-600'
            )}>
              {i < current ? '✓' : i + 1}
            </div>
            <span className={cn(
              "text-xs font-medium transition-colors",
              i === current ? 'text-indigo-300' : i < current ? 'text-slate-400' : 'text-slate-700'
            )}>
              {step}
            </span>
          </div>
          {i < STEPS.length - 1 && (
            <div className={cn(
              "w-8 h-px mx-2 transition-colors",
              i < current ? 'bg-indigo-500/50' : 'bg-white/5'
            )} />
          )}
        </div>
      ))}
    </div>
  )
}

export function PassengerForm() {
  const router = useRouter()
  const { selectedFlight, selectedSeat, selectedSeats, passengerDataList, setPassengerDataList, setCurrentStep } = useFlightStore()

  // Use selectedSeats if populated, fallback to single selectedSeat
  const activeSeats = selectedSeats && selectedSeats.length > 0 ? selectedSeats : (selectedSeat ? [selectedSeat] : [])
  const passengerCount = activeSeats.length

  const [formDataList, setFormDataList] = useState<PassengerFormData[]>(() => {
    if (passengerDataList && passengerDataList.length === passengerCount) {
      return passengerDataList
    }
    return Array.from({ length: passengerCount }, () => ({
      full_name: '', passport_no: '', nationality: '', dob: ''
    }))
  })

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isPaymentOpen, setIsPaymentOpen] = useState(false)

  const handleFormChange = (index: number, field: keyof PassengerFormData, value: string) => {
    const newList = [...formDataList]
    newList[index] = { ...newList[index], [field]: value }
    setFormDataList(newList)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    
    // Quick validation
    for (let i = 0; i < formDataList.length; i++) {
      const data = formDataList[i]
      if (!data.full_name.trim()) {
        setError(`Please enter the full legal name for Passenger ${i + 1}.`)
        return
      }
      if (!data.dob) {
        setError(`Please enter the date of birth for Passenger ${i + 1}.`)
        return
      }
      if (!data.passport_no.trim()) {
        setError(`Please enter the passport number for Passenger ${i + 1}.`)
        return
      }
      if (!data.nationality.trim()) {
        setError(`Please enter the nationality for Passenger ${i + 1}.`)
        return
      }
    }

    setPassengerDataList(formDataList)
    setIsPaymentOpen(true)
  }

  const handleCompleteBooking = async () => {
    setLoading(true)
    setError(null)

    try {
      if (!selectedFlight || activeSeats.length === 0) throw new Error('Missing flight or seat selections')
      const totalPrice = selectedFlight.base_price * passengerCount + activeSeats.reduce((acc, s) => acc + s.extra_fee, 0)

      const payload = {
        flightId: selectedFlight.id,
        totalPrice,
        passengers: formDataList.map((formData, idx) => {
          if (!activeSeats[idx]) {
            throw new Error('Passenger and seat count mismatch')
          }
          return {
            seatId: activeSeats[idx].id,
            passengerData: formData
          }
        })
      }

      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      const data = await res.json()
      if (!res.ok || !data.success) throw new Error(data.error || 'Booking failed')

      // Save booking in local storage array for robust PNRCard + MyBookings lookups
      try {
        const localBookingObj = {
          id: data.booking_id,
          pnr_code: data.pnr_code,
          status: 'confirmed',
          booked_at: new Date().toISOString(),
          total_price: totalPrice,
          flight_id: selectedFlight.id,
          seats: activeSeats[0], // fallback single seat object for backward compatibility
          seats_list: activeSeats, // array of all seats selected
          flights: selectedFlight,
          passengers: formDataList.map((formData, idx) => ({
            id: `passenger-${data.booking_id}-${idx}`,
            booking_id: data.booking_id,
            full_name: formData.full_name,
            nationality: formData.nationality,
            dob: formData.dob,
            seat_number: activeSeats[idx].seat_number,
            seat_class: activeSeats[idx].class
          }))
        }
        const existing = JSON.parse(localStorage.getItem('skyflow_local_bookings') || '[]')
        existing.push(localBookingObj)
        localStorage.setItem('skyflow_local_bookings', JSON.stringify(existing))
      } catch (storeErr) {
        console.error('Failed to store local fallback booking:', storeErr)
      }

      // Close the modal upon success
      setIsPaymentOpen(false)

      setCurrentStep('confirmation')
      router.push(`/booking/confirmation/${data.pnr_code}`)
    } catch (err: any) {
      setError(err.message)
      throw err // rethrow to let the payment modal catch and handle it
    } finally {
      setLoading(false)
    }
  }

  if (!selectedFlight || activeSeats.length === 0) return null
  const totalPrice = selectedFlight.base_price * passengerCount + activeSeats.reduce((acc, s) => acc + s.extra_fee, 0)

  return (
    <div className="min-h-screen pt-20">
      <AnimatedBackground />

      <div className="max-w-5xl mx-auto px-4 py-10">
        <button onClick={() => router.back()} className="flex items-center gap-2 text-xs text-slate-600 hover:text-indigo-400 transition-colors mb-6 font-medium">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M19 12H5M5 12l7 7M5 12l7-7" />
          </svg>
          Back to seat map
        </button>

        <ProgressSteps current={1} />

        <div className="grid lg:grid-cols-[1fr_300px] gap-6">
          {/* Form */}
          <div className="animate-fade-in-up">
            <div className="rounded-2xl border border-white/6 bg-gradient-to-b from-[#0c0c18] to-[#090912] overflow-hidden">
              {/* Form header */}
              <div className="px-6 py-5 border-b border-white/5">
                <h1 className="text-xl font-display font-bold text-white">Passenger Details</h1>
                <p className="text-xs text-slate-500 mt-1">Information must match travel documents exactly.</p>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-8">
                {formDataList.map((formData, idx) => {
                  const assignedSeat = activeSeats[idx]
                  return (
                    <div key={idx} className={cn("space-y-5", idx > 0 && "pt-8 border-t border-white/5")}>
                      <div className="flex items-center justify-between">
                        <div className="text-xs font-bold text-indigo-400 uppercase tracking-widest flex items-center gap-2">
                          <div className="w-5 h-5 rounded-full bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-[10px] text-white font-mono">
                            {idx + 1}
                          </div>
                          Passenger {idx + 1} Details
                        </div>
                        {assignedSeat && (
                          <span className={cn(
                            "px-2 py-0.5 rounded text-[10px] font-bold font-mono",
                            assignedSeat.class === 'first' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/20' :
                            assignedSeat.class === 'business' ? 'bg-violet-500/20 text-violet-300 border border-violet-500/20' :
                            'bg-indigo-500/20 text-indigo-300 border border-indigo-500/20'
                          )}>
                            Seat {assignedSeat.seat_number} · {assignedSeat.class}
                          </span>
                        )}
                      </div>

                      {/* Personal Info Section */}
                      <div className="grid sm:grid-cols-2 gap-4">
                        <Input
                          label="Full Legal Name"
                          placeholder="As on passport"
                          value={formData.full_name}
                          onChange={(e) => handleFormChange(idx, 'full_name', e.target.value)}
                          required
                          icon={
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z"/>
                            </svg>
                          }
                        />
                        <Input
                          label="Date of Birth"
                          type="date"
                          value={formData.dob}
                          onChange={(e) => handleFormChange(idx, 'dob', e.target.value)}
                          className="[color-scheme:dark]"
                          required
                        />
                      </div>

                      {/* Travel Document Section */}
                      <div className="grid sm:grid-cols-2 gap-4">
                        <Input
                          label="Passport Number"
                          placeholder="e.g. A12345678"
                          value={formData.passport_no}
                          onChange={(e) => handleFormChange(idx, 'passport_no', e.target.value)}
                          required
                          icon={
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <rect x="3" y="3" width="18" height="18" rx="2"/>
                              <circle cx="12" cy="10" r="3"/>
                              <path d="M7 21v-1a5 5 0 0 1 10 0v1"/>
                            </svg>
                          }
                        />
                        <Input
                          label="Nationality"
                          placeholder="e.g. Indian"
                          value={formData.nationality}
                          onChange={(e) => handleFormChange(idx, 'nationality', e.target.value)}
                          required
                          icon={
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20M2 12h20"/>
                            </svg>
                          }
                        />
                      </div>
                    </div>
                  )
                })}

                {error && (
                  <div className="flex items-start gap-3 p-4 rounded-xl bg-red-500/5 border border-red-500/15 text-red-400 text-sm">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="flex-shrink-0 mt-0.5">
                      <circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/>
                    </svg>
                    {error}
                  </div>
                )}

                <div className="pt-4">
                  <Button type="submit" variant="glow" className="w-full h-11">
                    Proceed to Payment →
                  </Button>
                  <p className="text-[10px] text-slate-700 text-center mt-3">
                    Your payment details are secure. Proceeding will open the checkout page.
                  </p>
                </div>
              </form>
            </div>
          </div>

          {/* Right: Order summary */}
          <div className="animate-fade-in-up" style={{ animationDelay: '100ms' }}>
            <div className="rounded-2xl border border-white/6 bg-gradient-to-b from-[#0c0c18] to-[#090912] overflow-hidden sticky top-24">
              <div className="px-5 py-4 border-b border-white/5">
                <div className="text-[10px] text-slate-600 uppercase tracking-widest font-semibold mb-3">Order Summary</div>
                <div className="flex items-center gap-2 text-white font-semibold">
                  <span className="font-display">{selectedFlight.origin}</span>
                  <span className="text-indigo-400 text-sm">→</span>
                  <span className="font-display">{selectedFlight.destination}</span>
                </div>
                <div className="text-xs text-slate-600 mt-0.5">{format(new Date(selectedFlight.departs_at), 'EEE, MMM d · HH:mm')}</div>
              </div>

              <div className="px-5 py-4 border-b border-white/5">
                <div className="text-[10px] text-slate-600 uppercase tracking-widest font-semibold mb-2">Selected Seats</div>
                <div className="space-y-2.5">
                  {activeSeats.map((assignedSeat, idx) => (
                    <div key={idx} className="flex items-center justify-between text-xs">
                      <span className="text-slate-500">Passenger {idx + 1}</span>
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-slate-300 font-bold">{assignedSeat.seat_number}</span>
                        <span className="text-[10px] text-slate-600 capitalize">({assignedSeat.class})</span>
                        {assignedSeat.extra_fee > 0 && (
                          <span className="text-[10px] text-amber-400 font-mono">+₹{assignedSeat.extra_fee}</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="px-5 py-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Base fare ({passengerCount}x)</span>
                  <span className="font-mono text-slate-300">₹{selectedFlight.base_price * passengerCount}</span>
                </div>
                {activeSeats.some(s => s.extra_fee > 0) && (
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Seat upgrades</span>
                    <span className="font-mono text-amber-400">
                      +₹{activeSeats.reduce((acc, s) => acc + s.extra_fee, 0)}
                    </span>
                  </div>
                )}
                <div className="pt-3 border-t border-white/5 flex justify-between items-baseline">
                  <span className="text-xs text-slate-500 uppercase tracking-wider">Total</span>
                  <span className="text-2xl font-display font-bold text-white">₹{totalPrice}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Modal */}
      <PaymentModal
        isOpen={isPaymentOpen}
        onClose={() => setIsPaymentOpen(false)}
        totalPrice={totalPrice}
        flight={{
          flight_no: selectedFlight.flight_no,
          origin: selectedFlight.origin,
          destination: selectedFlight.destination,
          departs_at: selectedFlight.departs_at
        }}
        passengers={formDataList.map((formData, idx) => ({
          name: formData.full_name,
          seatNo: activeSeats[idx]?.seat_number || 'N/A'
        }))}
        onConfirm={handleCompleteBooking}
      />
    </div>
  )
}
