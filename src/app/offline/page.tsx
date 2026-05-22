/* eslint-disable */
import { Button } from '@/components/ui/Button'
import { AnimatedBackground } from '@/components/ui/AnimatedBackground'
import Link from 'next/link'

export default function OfflinePage() {
  return (
    <div className="min-h-screen pt-20 pb-16 relative flex items-center justify-center">
      <AnimatedBackground />

      <div className="relative z-10 p-6 flex flex-col items-center text-center max-w-md mx-auto">
        <div className="w-24 h-24 rounded-full bg-slate-800/50 border border-slate-700/50 flex items-center justify-center mb-6 shadow-2xl">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-slate-400">
            <path d="M1 1l22 22M16.72 11.06A10.94 10.94 0 0119 12.55M5 12.55a10.94 10.94 0 015.17-2.39M10.71 5.05A16 16 0 0122.58 9M1.42 9a15.91 15.91 0 014.7-2.88M8.53 16.11a6 6 0 016.95 0M12 20h.01" />
          </svg>
        </div>

        <h1 className="text-3xl font-display font-bold text-white mb-3">You're Offline</h1>
        <p className="text-slate-400 mb-8 leading-relaxed">
          It looks like you've lost your connection. But don't worry, you can still view your saved boarding passes and trips.
        </p>

        <div className="flex gap-4 w-full">
          <Link href="/" className="flex-1">
            <Button variant="secondary" className="w-full">Try Again</Button>
          </Link>
          <Link href="/my-bookings" className="flex-1">
            <Button variant="glow" className="w-full">My Trips</Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
