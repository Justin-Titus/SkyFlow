'use client'

import { Seat } from '@/store/flightStore'
import { cn } from '@/lib/utils'
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/Tooltip'

interface SeatMapProps {
  seats: Seat[]
  selectedSeats: Seat[]
  onSelectSeat: (seat: Seat) => void
}

const CLASS_CONFIG = {
  first: {
    label: 'First Class',
    color: 'available: bg-amber-500/10 border-amber-500/25 text-amber-300 hover:bg-amber-500/20 hover:border-amber-500/50 hover:shadow-[0_0_12px_rgba(245,158,11,0.2)]',
    selected: 'bg-amber-500 border-amber-400 text-white shadow-[0_0_20px_rgba(245,158,11,0.5)] scale-105',
    dot: 'bg-amber-400',
    icon: '👑',
  },
  business: {
    label: 'Business',
    color: 'available: bg-violet-500/10 border-violet-500/25 text-violet-300 hover:bg-violet-500/20 hover:border-violet-500/50 hover:shadow-[0_0_12px_rgba(139,92,246,0.2)]',
    selected: 'bg-violet-500 border-violet-400 text-white shadow-[0_0_20px_rgba(139,92,246,0.5)] scale-105',
    dot: 'bg-violet-400',
    icon: '💼',
  },
  economy: {
    label: 'Economy',
    color: 'available: bg-indigo-500/8 border-indigo-500/20 text-indigo-300 hover:bg-indigo-500/16 hover:border-indigo-500/40 hover:shadow-[0_0_10px_rgba(99,102,241,0.15)]',
    selected: 'bg-indigo-500 border-indigo-400 text-white shadow-[0_0_20px_rgba(99,102,241,0.5)] scale-105',
    dot: 'bg-indigo-400',
    icon: null,
  },
}

function SeatButton({ seat, isSelected, onSelect }: { seat: Seat; isSelected: boolean; onSelect: (s: Seat) => void }) {
  const config = CLASS_CONFIG[seat.class]
  
  if (!seat.is_available) {
    return (
      <Tooltip>
        <TooltipTrigger>
          <div 
            className="w-9 h-10 rounded-t-lg rounded-b-sm border border-white/4 bg-white/2 flex items-center justify-center opacity-30 cursor-not-allowed relative"
          >
            <div className="w-3 h-0.5 bg-slate-600 rotate-45 absolute" />
            <div className="w-3 h-0.5 bg-slate-600 -rotate-45 absolute" />
          </div>
        </TooltipTrigger>
        <TooltipContent side="top" className="whitespace-nowrap">
          <span className="font-semibold">{seat.seat_number}</span>
          <span className="text-zinc-400"> · Occupied · </span>
          <span className="capitalize">{config.label}</span>
          {seat.extra_fee > 0 && (
            <span className="text-amber-400 ml-1">(+₹{seat.extra_fee})</span>
          )}
        </TooltipContent>
      </Tooltip>
    )
  }

  return (
    <button
      type="button"
      onClick={() => onSelect(seat)}
      title={`Seat ${seat.seat_number} – ${seat.class}${seat.extra_fee > 0 ? ` (+₹${seat.extra_fee})` : ''}`}
      className={cn(
        "w-9 h-10 rounded-t-lg rounded-b-sm border text-[9px] font-bold transition-all duration-200 relative flex flex-col items-center justify-center gap-px",
        isSelected ? config.selected : cn(
          "bg-white/3 border-white/8 text-slate-500",
          "hover:bg-indigo-500/10 hover:border-indigo-500/30 hover:text-indigo-300 hover:shadow-[0_0_10px_rgba(99,102,241,0.15)]",
          seat.class === 'first' && "hover:bg-amber-500/10 hover:border-amber-500/30 hover:text-amber-300 hover:shadow-[0_0_10px_rgba(245,158,11,0.15)]",
          seat.class === 'business' && "hover:bg-violet-500/10 hover:border-violet-500/30 hover:text-violet-300 hover:shadow-[0_0_10px_rgba(139,92,246,0.15)]",
        )
      )}
    >
      {seat.seat_number}
      {isSelected && (
        <div className="w-1 h-1 rounded-full bg-white/80 animate-pulse" />
      )}
    </button>
  )
}

export function SeatMap({ seats, selectedSeats, onSelectSeat }: SeatMapProps) {
  const rowMap = new Map<number, Seat[]>()
  let maxRow = 0
  
  seats.forEach(seat => {
    const m = seat.seat_number.match(/^(\d+)([A-Z])$/)
    if (m) {
      const rn = parseInt(m[1], 10)
      maxRow = Math.max(maxRow, rn)
      if (!rowMap.has(rn)) rowMap.set(rn, [])
      rowMap.get(rn)!.push(seat)
    }
  })

  rowMap.forEach(rs => rs.sort((a, b) => a.seat_number.localeCompare(b.seat_number)))
  const rows = Array.from({ length: maxRow }, (_, i) => i + 1)

  const totalSeats = seats.length
  const availableSeats = seats.filter(s => s.is_available).length

  return (
    <div className="flex flex-col">
      {/* Legend */}
      <div className="flex flex-wrap gap-3 mb-6 px-2">
        {Object.entries(CLASS_CONFIG).map(([cls, cfg]) => (
          <div key={cls} className="flex items-center gap-2 text-xs text-slate-500">
            <div className={cn("w-3 h-3 rounded-sm border", 
              cls === 'first' ? 'bg-amber-500/15 border-amber-500/30' :
              cls === 'business' ? 'bg-violet-500/15 border-violet-500/30' :
              'bg-indigo-500/10 border-indigo-500/25'
            )} />
            {cfg.label}
          </div>
        ))}
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <div className="w-3 h-3 rounded-sm border border-white/5 bg-white/2 relative overflow-hidden">
            <div className="w-full h-0.5 bg-slate-700 rotate-45 absolute top-1/2 left-0" />
          </div>
          Occupied
        </div>
      </div>

      {/* Availability bar */}
      <div className="mb-6 px-2">
        <div className="flex justify-between text-xs text-slate-600 mb-1.5">
          <span>{availableSeats} seats available</span>
          <span className="font-mono">{totalSeats - availableSeats}/{totalSeats} taken</span>
        </div>
        <div className="h-1 bg-white/4 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-indigo-500 to-cyan-500 rounded-full transition-all duration-700"
            style={{ width: `${totalSeats > 0 ? (availableSeats / totalSeats) * 100 : 0}%` }}
          />
        </div>
      </div>

      {/* Fuselage header */}
      <div className="relative flex justify-center mb-4">
        <div className="w-32 h-6 rounded-t-full border-t border-x border-white/8 bg-gradient-to-b from-white/3 to-transparent flex items-center justify-center">
          <div className="text-[9px] text-slate-600 uppercase tracking-widest font-mono">CABIN</div>
        </div>
      </div>

      {/* Seat grid */}
      <div className="bg-gradient-to-b from-[#0a0a12] to-[#080810] rounded-2xl border border-white/5 p-4 overflow-y-auto max-h-[60vh]">
        <div className="flex flex-col gap-2">
          {rows.map(rowNum => {
            const rowSeats = rowMap.get(rowNum) || []
            if (!rowSeats.length) return null
            
            const currentClass = rowSeats[0]?.class
            const prevClass = rowMap.get(rowNum - 1)?.[0]?.class
            const showDivider = rowNum > 1 && prevClass !== currentClass

            return (
              <div key={rowNum}>
                {showDivider && (
                  <div className="flex items-center gap-2 my-3">
                    <div className="flex-1 h-px bg-gradient-to-r from-transparent via-white/6 to-transparent" />
                    <span className={cn(
                      "text-[9px] uppercase tracking-[0.15em] font-semibold px-2 py-0.5 rounded-full border",
                      currentClass === 'business' ? 'text-violet-400 border-violet-500/20 bg-violet-500/5' : 'text-indigo-400 border-indigo-500/20 bg-indigo-500/5'
                    )}>
                      {CLASS_CONFIG[currentClass as keyof typeof CLASS_CONFIG]?.label}
                    </span>
                    <div className="flex-1 h-px bg-gradient-to-l from-transparent via-white/6 to-transparent" />
                  </div>
                )}
                
                <div className="flex items-center gap-2 justify-center">
                  {/* Left seats A B C */}
                  <div className="flex gap-1.5">
                    {['A', 'B', 'C'].map(col => {
                      const seat = rowSeats.find(s => s.seat_number === `${rowNum}${col}`)
                      if (!seat) return <div key={col} className="w-9 h-10" />
                      return (
                        <SeatButton key={seat.id} seat={seat} isSelected={selectedSeats.some(s => s?.id === seat.id)} onSelect={onSelectSeat} />
                      )
                    })}
                  </div>
                  
                  {/* Aisle */}
                  <div className="w-6 flex items-center justify-center flex-shrink-0">
                    <span className="text-[9px] font-mono text-slate-700">{rowNum}</span>
                  </div>
                  
                  {/* Right seats D E F */}
                  <div className="flex gap-1.5">
                    {['D', 'E', 'F'].map(col => {
                      const seat = rowSeats.find(s => s.seat_number === `${rowNum}${col}`)
                      if (!seat) return <div key={col} className="w-9 h-10" />
                      return (
                        <SeatButton key={seat.id} seat={seat} isSelected={selectedSeats.some(s => s?.id === seat.id)} onSelect={onSelectSeat} />
                      )
                    })}
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Fuselage footer */}
        <div className="flex justify-center mt-4">
          <div className="w-40 h-8 rounded-b-full border-b border-x border-white/6 bg-gradient-to-t from-white/2 to-transparent" />
        </div>
      </div>
    </div>
  )
}
