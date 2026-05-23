import { SearchForm } from '@/components/flights/SearchForm'
import { AnimatedBackground } from '@/components/ui/AnimatedBackground'
import { Badge } from '@/components/ui/Badge'
import Link from 'next/link'
import { Zap, ShieldCheck, Ticket, MapPin } from 'lucide-react'

const FEATURES = [
  { icon: Zap, label: 'Real-time seat maps' },
  { icon: ShieldCheck, label: 'Atomic reservations' },
  { icon: Ticket, label: 'Instant confirmation' },
]

const RECOMMENDATIONS = [
  { code: 'BOM', city: 'Mumbai', origin: 'DEL', price: '4,999', duration: '2h 10m' },
  { code: 'DEL', city: 'Delhi', origin: 'BLR', price: '5,899', duration: '2h 40m' },
  { code: 'MAA', city: 'Chennai', origin: 'BOM', price: '3,499', duration: '1h 50m' },
  { code: 'HYD', city: 'Hyderabad', origin: 'CCU', price: '4,799', duration: '2h 05m' },
]

export default function Home() {
  return (
    <div className="flex-1 min-h-screen flex flex-col relative overflow-x-hidden">
      <AnimatedBackground variant="hero" />

      {/* Hero Section */}
      <div className="flex-1 flex flex-col items-center justify-center pt-28 pb-20 px-4 max-w-7xl mx-auto w-full">
        
        {/* Badge pill */}
        <div className="mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-indigo-500/20 bg-indigo-500/5 text-sm font-medium text-indigo-300 backdrop-blur-sm">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-400" />
            </span>
            Premium Indian Domestic Flight Network
          </div>
        </div>

        {/* Main headline */}
        <div className="text-center mb-6 max-w-4xl">
          <h1 className="text-5xl sm:text-6xl md:text-[80px] font-display font-bold tracking-tight leading-[0.95] text-white mb-6">
            Fly with
            <br />
            <span className="text-gradient-cyan">precision.</span>
          </h1>
          <p className="text-lg sm:text-xl text-slate-400 max-w-xl mx-auto leading-relaxed">
            Search, select seats, and soar — the modern Indian domestic booking experience.
          </p>
        </div>

        {/* Feature pills */}
        <div className="animate-fade-in-up flex flex-wrap items-center justify-center gap-3 mb-12" style={{ animationDelay: '160ms' }}>
          {FEATURES.map((f, idx) => {
            const Icon = f.icon
            return (
              <span key={idx} className="inline-flex items-center gap-2 text-xs text-slate-400 bg-white/3 border border-white/6 px-3 py-1.5 rounded-full">
                <Icon className="w-3.5 h-3.5 text-indigo-400" />
                {f.label}
              </span>
            )
          })}
        </div>

        {/* Search form card */}
        <div className="w-full max-w-5xl mb-16 z-20 relative">
          <div className="relative rounded-3xl overflow-hidden">
            {/* Gradient border */}
            <div className="absolute inset-0 rounded-3xl p-px bg-gradient-to-br from-indigo-500/30 via-transparent to-cyan-500/20 pointer-events-none z-10" style={{ borderRadius: 'inherit' }}>
              <div className="absolute inset-0 rounded-3xl bg-[#090910]" />
            </div>
            
            <div className="relative z-20 p-5 sm:p-7 bg-gradient-to-b from-[#0c0c16] to-[#090910] rounded-3xl border border-indigo-500/12 shadow-[0_24px_80px_rgba(0,0,0,0.6),0_0_0_1px_rgba(99,102,241,0.08)]">
              <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-[0.15em] mb-5 flex items-center gap-2">
                <span className="w-4 h-px bg-slate-700" />
                Flight Booking Terminal
                <span className="flex-1 h-px bg-slate-700/50" />
              </div>
              <SearchForm />
            </div>
          </div>
        </div>

        {/* Featured / Popular Routes Section */}
        <div className="w-full max-w-5xl mb-16">
          <h2 className="text-[10px] font-semibold text-slate-400 uppercase tracking-[0.15em] mb-6 flex items-center gap-2">
            <span className="w-4 h-px bg-slate-700" />
            POPULAR DOMESTIC ROUTES
            <span className="flex-1 h-px bg-slate-700/50" />
          </h2>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {RECOMMENDATIONS.map((r, i) => (
              <Link 
                key={r.code}
                href={`/flights?origin=${r.origin}&destination=${r.code}&date=&passengers=1`}
                className="group relative rounded-2xl border border-white/5 bg-gradient-to-br from-[#0c0c18] to-[#08080f] p-5 hover:border-indigo-500/20 hover:shadow-[0_0_30px_rgba(99,102,241,0.06)] transition-all duration-300 flex flex-col justify-between h-40 overflow-hidden"
              >
                {/* Backlight glow */}
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/0 via-indigo-600/0 to-indigo-600/0 group-hover:to-indigo-600/5 transition-all duration-500" />
                
                <div className="flex justify-between items-start">
                  <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <Badge variant="cyan" className="text-[9px] font-mono">{r.origin} → {r.code}</Badge>
                </div>
                
                <div>
                  <h3 className="text-white font-display font-semibold text-lg group-hover:text-indigo-400 transition-colors">
                    {r.city}
                  </h3>
                  <div className="flex items-baseline justify-between mt-1">
                    <span className="text-[10px] text-slate-400 font-mono">{r.duration}</span>
                    <span className="text-sm font-semibold text-slate-300 group-hover:text-white transition-colors">
                      from ₹{r.price}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Airport network feed removed */}

      </div>
    </div>
  )
}
