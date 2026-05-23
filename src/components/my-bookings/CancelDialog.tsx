import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'
import { useFlightStore } from '@/store/flightStore'
import { motion } from 'framer-motion'

interface CancelDialogProps {
  bookingId: string;
  flightDate: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function CancelDialog({ bookingId, flightDate, open, onOpenChange, onSuccess }: CancelDialogProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const handleCancel = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/bookings/${bookingId}/cancel`, { method: 'POST' })
      let data
      const text = await res.text()
      try {
        data = text ? JSON.parse(text) : null
      } catch {
        throw new Error(text || 'Failed to parse response')
      }
      if (!res.ok || !data.success) throw new Error(data.error || 'Failed to cancel')
      
      try {
        const localBookings = JSON.parse(localStorage.getItem('skyflow_local_bookings') || '[]')
        const idx = localBookings.findIndex((b: import('@/store/userStore').Booking) => b.id === bookingId)
        if (idx !== -1) {
          localBookings[idx].status = 'cancelled'
          localStorage.setItem('skyflow_local_bookings', JSON.stringify(localBookings))
        }
      } catch (localErr) {
        console.error('Failed to update local cancellation:', localErr)
      }

      useFlightStore.getState().resetBooking()
      onSuccess()
      onOpenChange(false)
      router.refresh()
    } catch (err: unknown) {
      setError((err as Error)?.message || 'Failed to cancel booking')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      {/* Backdrop */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={() => !loading && onOpenChange(false)}
      />

      {/* Dialog */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        transition={{ duration: 0.25, ease: "easeOut" }}
        className="relative w-full max-w-md rounded-2xl border border-white/8 bg-gradient-to-b from-[#0e0e1c] to-[#0a0a14] shadow-[0_24px_80px_rgba(0,0,0,0.7)] overflow-hidden z-10"
      >
        {/* Top danger accent */}
        <div className="h-px bg-gradient-to-r from-transparent via-red-500/40 to-transparent" />

        <div className="p-6">
          {/* Icon */}
          <div className="w-12 h-12 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-5">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-red-400">
              <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0zM12 9v4M12 17h.01"/>
            </svg>
          </div>

          <h2 className="text-xl font-display font-bold text-white mb-2">Cancel booking?</h2>
          <p className="text-sm text-slate-500 mb-6">
            This action cannot be undone. Your seat will be released and any refund will be processed per our cancellation policy.
          </p>

          {error && (
            <div className="mb-4 p-3 rounded-xl bg-red-500/5 border border-red-500/15 text-red-400 text-xs">
              {error}
            </div>
          )}

          <div className="flex gap-3">
            <Button
              variant="secondary"
              className="flex-1"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Keep booking
            </Button>
            <Button
              variant="danger"
              className="flex-1"
              onClick={handleCancel}
              isLoading={loading}
            >
              Cancel trip
            </Button>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
