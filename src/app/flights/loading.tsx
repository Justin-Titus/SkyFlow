import { AnimatedBackground } from '@/components/ui/AnimatedBackground'

function FlightCardSkeleton({ delay = 0 }: { delay?: number }) {
  return (
    <div
      className="rounded-2xl border border-white/5 bg-gradient-to-br from-[#0c0c16] to-[#09090f] overflow-hidden animate-pulse"
      style={{ animationDelay: `${delay}ms` }}
    >
      {/* Top accent line */}
      <div className="h-px bg-white/5" />

      <div className="p-5 sm:p-6 flex flex-col sm:flex-row gap-5">
        {/* Left: route info */}
        <div className="flex-1 space-y-4">
          <div className="flex items-center justify-between">
            <div className="h-3.5 w-24 bg-white/5 rounded" />
            <div className="h-5 w-16 bg-white/5 rounded-full" />
          </div>

          {/* Route display */}
          <div className="flex items-center gap-4">
            <div className="space-y-1.5">
              <div className="h-8 w-14 bg-white/8 rounded" />
              <div className="h-3 w-10 bg-white/4 rounded" />
              <div className="h-2.5 w-16 bg-white/3 rounded" />
            </div>

            <div className="flex-1 flex flex-col items-center gap-1.5">
              <div className="h-2.5 w-12 bg-white/4 rounded" />
              <div className="w-full h-px bg-white/5" />
              <div className="h-2 w-14 bg-white/3 rounded" />
            </div>

            <div className="space-y-1.5 text-right">
              <div className="h-8 w-14 bg-white/8 rounded ml-auto" />
              <div className="h-3 w-10 bg-white/4 rounded ml-auto" />
              <div className="h-2.5 w-16 bg-white/3 rounded ml-auto" />
            </div>
          </div>
        </div>

        {/* Right: price + CTA */}
        <div className="sm:w-36 flex-shrink-0 sm:border-l sm:border-white/5 sm:pl-5 flex flex-col justify-center gap-3">
          <div className="h-3 w-16 bg-white/4 rounded" />
          <div className="h-8 w-20 bg-white/8 rounded" />
          <div className="h-9 w-full bg-indigo-500/10 rounded-xl border border-indigo-500/10" />
        </div>
      </div>
    </div>
  )
}

export default function FlightsLoading() {
  return (
    <div className="min-h-screen pt-24 pb-20 px-4">
      <AnimatedBackground variant="minimal" />

      <div className="max-w-3xl mx-auto">
        {/* Header skeleton */}
        <div className="mb-8 animate-pulse">
          <div className="flex items-center gap-2 mb-4">
            <div className="h-3 w-12 bg-white/5 rounded" />
            <div className="h-3 w-4 bg-white/3 rounded" />
            <div className="h-3 w-24 bg-white/5 rounded" />
          </div>
          <div className="flex items-end justify-between gap-4">
            <div>
              <div className="h-9 w-48 bg-white/8 rounded mb-2" />
              <div className="h-4 w-40 bg-white/4 rounded" />
            </div>
            <div className="h-7 w-28 bg-indigo-500/10 border border-indigo-500/10 rounded-full" />
          </div>
        </div>

        {/* Filter card skeleton */}
        <div className="mb-6 p-4 rounded-2xl border border-white/5 bg-[#0c0c16]/50 flex flex-col md:flex-row gap-5 animate-pulse">
          {[0, 1, 2].map((i) => (
            <div key={i} className="flex-1 space-y-2">
              <div className="h-2.5 w-16 bg-white/4 rounded" />
              <div className="h-9 bg-white/5 rounded-lg border border-white/5" />
            </div>
          ))}
        </div>

        {/* Flight card skeletons */}
        <div className="space-y-3">
          {[0, 80, 160, 240, 320].map((delay, i) => (
            <FlightCardSkeleton key={i} delay={delay} />
          ))}
        </div>
      </div>
    </div>
  )
}
