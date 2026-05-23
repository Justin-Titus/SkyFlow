'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { cn } from '@/lib/utils'
import { motion, AnimatePresence } from 'framer-motion'

interface PaymentModalProps {
  isOpen: boolean
  onClose: () => void
  totalPrice: number
  flight: {
    flight_no: string
    origin: string
    destination: string
    departs_at: string
  }
  passengers: { name: string; seatNo: string }[]
  onConfirm: () => Promise<void>
}

export function PaymentModal({
  isOpen,
  onClose,
  totalPrice,
  flight,
  passengers,
  onConfirm
}: PaymentModalProps) {
  const [cardNumber, setCardNumber] = useState('')
  const [expiry, setExpiry] = useState('')
  const [cvv, setCvv] = useState('')
  const [cardName, setCardName] = useState('')
  
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isFlipped, setIsFlipped] = useState(false)

  // Reset inputs when opened
  useEffect(() => {
    if (isOpen) {
      setCardNumber('')
      setExpiry('')
      setCvv('')
      setCardName('')
      setError(null)
      setIsProcessing(false)
      setIsFlipped(false)
    }
  }, [isOpen])

  // Card Brand Detection
  const getCardBrand = (num: string) => {
    const cleanNum = num.replace(/\s+/g, '')
    if (cleanNum.startsWith('4')) return 'Visa'
    if (cleanNum.startsWith('5')) return 'Mastercard'
    if (cleanNum.startsWith('3')) return 'Amex'
    if (cleanNum.startsWith('6')) return 'RuPay'
    return 'Generic'
  }

  // Format Card Number (XXXX XXXX XXXX XXXX)
  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, '') // remove non-digits
    if (value.length > 16) value = value.slice(0, 16)
    
    // Add spaces every 4 digits
    const formatted = value.replace(/(\d{4})(?=\d)/g, '$1 ')
    setCardNumber(formatted)
  }

  // Format Expiry Date (MM/YY)
  const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, '') // remove non-digits
    if (value.length > 4) value = value.slice(0, 4)
    
    if (value.length > 2) {
      setExpiry(`${value.slice(0, 2)}/${value.slice(2)}`)
    } else {
      setExpiry(value)
    }
  }

  // Format CVV (3 digits)
  const handleCvvChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, '') // remove non-digits
    if (value.length > 3) value = value.slice(0, 3)
    setCvv(value)
  }

  const handlePay = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    
    // Simple frontend validations
    const cleanCard = cardNumber.replace(/\s+/g, '')
    if (cleanCard.length < 15) {
      setError('Please enter a valid credit card number.')
      return
    }
    if (expiry.length < 5) {
      setError('Please enter a valid expiration date (MM/YY).')
      return
    }
    const [month] = expiry.split('/')
    const m = parseInt(month, 10)
    if (m < 1 || m > 12) {
      setError('Expiration month must be between 01 and 12.')
      return
    }
    if (cvv.length < 3) {
      setError('Please enter a valid 3-digit CVV.')
      return
    }
    if (cardName.trim().length < 3) {
      setError('Please enter the cardholder\'s full name.')
      return
    }

    setIsProcessing(true)

    // Simulate Payment authorization (1.5s delay)
    await new Promise(resolve => setTimeout(resolve, 1500))

    try {
      // Trigger the booking API call
      await onConfirm()
    } catch (err: unknown) {
      setError((err as Error)?.message || 'Payment authorized, but failed to record booking. Please try again.')
      setIsProcessing(false)
    }
  }

  const brand = getCardBrand(cardNumber)

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 overflow-y-auto py-8">
          {/* Background backdrop blur */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 bg-black/80 backdrop-blur-sm" 
            onClick={() => !isProcessing && onClose()} 
          />

          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="relative w-full max-w-4xl rounded-2xl border border-white/8 bg-gradient-to-b from-[#0c0c1c] to-[#080812] shadow-[0_24px_80px_rgba(0,0,0,0.85)] overflow-hidden flex flex-col z-10"
          >
            <div className="h-px bg-gradient-to-r from-transparent via-cyan-500/40 to-transparent" />
            
            {/* Header */}
            <div className="px-6 py-5 border-b border-white/5 flex justify-between items-center flex-shrink-0">
              <div>
                <h2 className="text-xl font-display font-bold text-white flex items-center gap-2">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-cyan-400">
                    <rect x="2" y="5" width="20" height="14" rx="2" />
                    <line x1="2" y1="10" x2="22" y2="10" />
                  </svg>
                  Secure Payment Checkout
                </h2>
                <p className="text-xs text-slate-500 mt-1">Complete your transaction to finalize the booking.</p>
              </div>
              <button 
                onClick={onClose} 
                disabled={isProcessing}
                className="text-slate-500 hover:text-white transition-colors"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            {/* Modal content */}
            <div className="flex-1 overflow-y-auto p-6">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                
                {/* Left Column: Billing & Receipt details (col-span-5) */}
                <div className="md:col-span-5 space-y-5 border-b md:border-b-0 md:border-r border-white/5 pb-6 md:pb-0 md:pr-6">
                  
                  {/* Flight Route Details */}
                  <div className="space-y-3">
                    <div className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Flight Details</div>
                    <div className="bg-white/2 border border-white/5 rounded-xl p-4 space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-slate-500 font-mono">Flight No</span>
                        <span className="text-xs font-mono font-bold text-slate-200">{flight.flight_no}</span>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="text-left">
                          <div className="text-base font-display font-black text-white">{flight.origin}</div>
                          <div className="text-[9px] text-slate-500">Departure</div>
                        </div>
                        
                        <div className="flex-1 flex flex-col items-center px-3">
                          <div className="w-full relative flex items-center justify-center">
                            <div className="w-full border-t border-dashed border-slate-700" />
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" className="text-cyan-400 absolute bg-[#0c0c1c] px-0.5">
                              <path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z"/>
                            </svg>
                          </div>
                        </div>
                        
                        <div className="text-right">
                          <div className="text-base font-display font-black text-white">{flight.destination}</div>
                          <div className="text-[9px] text-slate-500">Arrival</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Passenger Manifest */}
                  <div className="space-y-3">
                    <div className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Passengers & Seats</div>
                    <div className="bg-white/2 border border-white/5 rounded-xl p-4 max-h-36 overflow-y-auto space-y-2.5">
                      {passengers.map((p, idx) => (
                        <div key={idx} className="flex justify-between items-center text-xs">
                          <span className="text-slate-300 font-medium truncate max-w-[150px]">{p.name}</span>
                          <span className="px-2 py-0.5 rounded text-[9px] font-bold font-mono bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 capitalize">
                            Seat {p.seatNo}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Pricing Breakdown */}
                  <div className="space-y-3">
                    <div className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Fare Breakdown</div>
                    <div className="bg-white/2 border border-white/5 rounded-xl p-4 space-y-2.5">
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-400">Base Fare ({passengers.length} x)</span>
                        <span className="text-slate-300 font-mono">₹{Math.floor(totalPrice * 0.85)}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-400">Taxes & Fees</span>
                        <span className="text-slate-300 font-mono">₹{totalPrice - Math.floor(totalPrice * 0.85)}</span>
                      </div>
                      <div className="h-px bg-white/5" />
                      <div className="flex justify-between items-baseline pt-1">
                        <span className="text-xs font-semibold text-slate-200">Amount Payable</span>
                        <span className="text-xl font-display font-extrabold text-cyan-400">₹{totalPrice}</span>
                      </div>
                    </div>
                  </div>

                  {/* SSL / Safe Badge */}
                  <div className="pt-4 border-t border-white/5 space-y-3 no-print">
                    <div className="flex items-start gap-2.5 text-[10px] text-slate-500">
                      <div className="w-5 h-5 rounded-md bg-emerald-500/10 border border-emerald-500/15 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-emerald-400">
                          <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                        </svg>
                      </div>
                      <div>
                        <span className="font-semibold text-slate-300 block">SSL SECURE GATEWAY</span>
                        Your transactions are encrypted with 256-bit SSL protocols.
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-2.5 text-[10px] text-slate-500">
                      <div className="w-5 h-5 rounded-md bg-indigo-500/10 border border-indigo-500/15 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-indigo-400">
                          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                        </svg>
                      </div>
                      <div>
                        <span className="font-semibold text-slate-300 block">FLEXIBLE CANCELLATION</span>
                        Enjoy instant cancellations and automatic refunds according to airline guidelines.
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Column: Payment Input & Card Visualizer (col-span-7) */}
                <div className="md:col-span-7 space-y-6">
                  
                  {/* Live Credit Card Visualizer */}
                  <div className="flex justify-center pt-2">
                    <div className="relative w-full max-w-[340px] h-[200px]" style={{ perspective: 1000 }}>
                      <motion.div
                        animate={{ rotateY: isFlipped ? 180 : 0 }}
                        transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
                        style={{ transformStyle: 'preserve-3d' }}
                        className="w-full h-full relative"
                      >
                        {/* Card Front */}
                        <div
                          style={{ backfaceVisibility: 'hidden' }}
                          className="absolute inset-0 w-full h-full rounded-2xl border border-white/12 bg-gradient-to-br from-indigo-900/60 via-purple-900/40 to-cyan-950/60 shadow-2xl p-5 flex flex-col justify-between overflow-hidden"
                        >
                          {/* Holographic glowing orb background decoration */}
                          <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
                          <div className="absolute -left-10 -top-10 w-40 h-40 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
                          
                          {/* Top row: Chip and Card Brand */}
                          <div className="flex justify-between items-start z-10">
                            {/* Card Chip */}
                            <div className="w-10 h-7 rounded-md bg-gradient-to-r from-amber-400/80 to-amber-200/60 border border-amber-300/30 relative shadow-inner overflow-hidden">
                              <div className="absolute inset-x-2.5 top-0 bottom-0 border-x border-amber-600/30" />
                              <div className="absolute inset-y-2 left-0 right-0 border-y border-amber-600/30" />
                            </div>
                            
                            {/* Brand Label */}
                            <div className="text-sm font-display font-extrabold italic text-slate-400 select-none">
                              {brand === 'Visa' && <span className="text-sky-400 drop-shadow-[0_0_8px_rgba(56,189,248,0.6)]">VISA</span>}
                              {brand === 'Mastercard' && <span className="text-orange-400 drop-shadow-[0_0_8px_rgba(251,146,60,0.6)]">MasterCard</span>}
                              {brand === 'Amex' && <span className="text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.6)]">AMEX</span>}
                              {brand === 'RuPay' && <span className="text-indigo-400 drop-shadow-[0_0_8px_rgba(129,140,248,0.6)]">RuPay</span>}
                              {brand === 'Generic' && <span className="text-slate-500 tracking-wider font-mono text-[10px]">SECURE CARD</span>}
                            </div>
                          </div>

                          {/* Middle row: Card Number */}
                          <div className="z-10 py-2">
                            <div className="text-lg font-mono text-slate-200 tracking-[0.2em] font-semibold text-center select-none">
                              {cardNumber || '•••• •••• •••• ••••'}
                            </div>
                          </div>

                          {/* Bottom row: Card Holder and Expiry */}
                          <div className="flex justify-between items-end z-10">
                            <div className="space-y-0.5 min-w-0 flex-1 pr-4">
                              <div className="text-[8px] uppercase tracking-wider text-slate-500 font-semibold">Cardholder</div>
                              <div className="text-[10px] uppercase tracking-wide text-slate-300 font-semibold font-mono truncate">
                                {cardName || 'YOUR FULL NAME'}
                              </div>
                            </div>
                            <div className="space-y-0.5 text-right flex-shrink-0">
                              <div className="text-[8px] uppercase tracking-wider text-slate-500 font-semibold">Expires</div>
                              <div className="text-[10px] text-slate-300 font-mono font-semibold">
                                {expiry || 'MM/YY'}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Card Back */}
                        <div
                          style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
                          className="absolute inset-0 w-full h-full rounded-2xl border border-white/12 bg-gradient-to-br from-[#0c0c18] via-[#121226] to-[#07070b] shadow-2xl flex flex-col justify-between py-4 overflow-hidden"
                        >
                          {/* Black magnetic strip */}
                          <div className="w-full h-10 bg-black/90 mt-2" />
                          
                          {/* Signature strip and CVV */}
                          <div className="px-5 space-y-1">
                            <div className="text-[7px] uppercase tracking-widest text-slate-600 font-semibold">Authorized Signature</div>
                            <div className="w-full h-8 bg-white/5 border border-white/8 rounded flex items-center justify-end px-3">
                              <div className="text-xs font-mono font-bold text-indigo-300 tracking-widest italic select-none">
                                {cvv ? '•'.repeat(cvv.length) : '•••'}
                              </div>
                            </div>
                          </div>

                          {/* Security message */}
                          <div className="px-5 flex justify-between items-center text-[7px] text-slate-600 select-none">
                            <span>NOT VALID UNLESS SIGNED</span>
                            <span className="font-mono">SECURE CODE CVV</span>
                          </div>
                        </div>
                      </motion.div>
                    </div>
                  </div>

                  {error && (
                    <div className="p-3 rounded-xl bg-red-500/5 border border-red-500/15 text-red-400 text-xs flex items-center gap-2 animate-fade-in">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
                      </svg>
                      {error}
                    </div>
                  )}

                  {/* Card Input Form */}
                  <form id="payment-form" onSubmit={handlePay} className="space-y-4">
                    <Input
                      label="Cardholder Name"
                      placeholder="Name on credit card"
                      value={cardName}
                      onChange={(e) => setCardName(e.target.value)}
                      disabled={isProcessing}
                      required
                      icon={
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
                        </svg>
                      }
                    />

                    <Input
                      label="Card Number"
                      placeholder="4111 2222 3333 4444"
                      value={cardNumber}
                      onChange={handleCardNumberChange}
                      disabled={isProcessing}
                      required
                      icon={
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <rect x="2" y="5" width="20" height="14" rx="2" /><line x1="2" y1="10" x2="22" y2="10" />
                        </svg>
                      }
                    />

                    <div className="grid grid-cols-2 gap-4">
                      <Input
                        label="Expiry Date"
                        placeholder="MM/YY"
                        value={expiry}
                        onChange={handleExpiryChange}
                        disabled={isProcessing}
                        required
                        icon={
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
                          </svg>
                        }
                      />
                      
                      <Input
                        label="CVV"
                        type="password"
                        placeholder="•••"
                        value={cvv}
                        onChange={handleCvvChange}
                        disabled={isProcessing}
                        onFocus={() => setIsFlipped(true)}
                        onBlur={() => setIsFlipped(false)}
                        required
                        icon={
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
                          </svg>
                        }
                      />
                    </div>
                  </form>
                </div>
              </div>
            </div>

            {/* Footer actions */}
            <div className="p-6 border-t border-white/5 bg-[#0a0a14] flex gap-3 flex-shrink-0 mt-auto items-center justify-between no-print">
              <div className="flex items-center gap-1.5 text-[10px] text-slate-500 font-medium">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-emerald-500">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
                SSL Encrypted Checkout
              </div>
              
              <div className="flex gap-2">
                <Button 
                  variant="secondary" 
                  onClick={onClose} 
                  disabled={isProcessing}
                  className="h-10 text-xs"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit"
                  form="payment-form"
                  variant="glow" 
                  isLoading={isProcessing}
                  className="h-10 text-xs px-6"
                >
                  {isProcessing ? 'Processing Securely...' : `Pay ₹${totalPrice}`}
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
