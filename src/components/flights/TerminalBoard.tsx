'use client'

import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'
import { format, addMinutes, subMinutes } from 'date-fns'

interface FlightDeparture {
  flightNo: string;
  destination: string;
  time: string;
  gate: string;
  status: 'BOARDING' | 'ON TIME' | 'DELAYED' | 'GATE OPEN' | 'DEPARTED';
  airline: string;
}

function TerminalClock() {
  const [terminalTime, setTerminalTime] = useState('')

  useEffect(() => {
    // Update terminal clock
    const updateClock = () => {
      const now = new Date()
      setTerminalTime(now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }))
    }
    updateClock()
    const timer = setInterval(updateClock, 1000)
    return () => clearInterval(timer)
  }, [])

  return (
    <div className="flex items-center gap-2 font-mono text-xs text-indigo-400 bg-indigo-500/5 border border-indigo-500/10 px-3 py-1 rounded-full shadow-[0_0_15px_rgba(99,102,241,0.05)]">
      <span className="text-slate-400 text-[10px] uppercase tracking-wider">TERMINAL TIME</span>
      <span className="font-bold tracking-widest">{terminalTime || '--:--:--'}</span>
    </div>
  )
}

export function TerminalBoard() {
  const [departures, setDepartures] = useState<FlightDeparture[]>([])

  useEffect(() => {
    const generateRealtimeFlights = (): FlightDeparture[] => {
      const now = new Date()
      return [
        { flightNo: '6E-2012', destination: 'MUMBAI (BOM)',    time: format(subMinutes(now, 45), 'HH:mm'), gate: 'T2-A4', status: 'DEPARTED',   airline: 'IndiGo' },
        { flightNo: 'AI-805',  destination: 'BENGALURU (BLR)', time: format(subMinutes(now, 5), 'HH:mm'),  gate: 'T3-B2', status: 'BOARDING',   airline: 'Air India' },
        { flightNo: 'UK-985',  destination: 'CHENNAI (MAA)',   time: format(addMinutes(now, 25), 'HH:mm'), gate: 'T1-C7', status: 'GATE OPEN',  airline: 'Vistara' },
        { flightNo: 'QP-1102', destination: 'KOLKATA (CCU)',   time: format(addMinutes(now, 55), 'HH:mm'), gate: 'T2-A9', status: 'DELAYED',    airline: 'Akasa Air' },
        { flightNo: 'SG-8152', destination: 'HYDERABAD (HYD)', time: format(addMinutes(now, 110), 'HH:mm'), gate: 'T3-D1', status: 'ON TIME',    airline: 'SpiceJet' },
      ]
    }

    setDepartures(generateRealtimeFlights())

    // Random status changes to simulate real-time operations
    const interval = setInterval(() => {
      setDepartures(prev => {
        if (prev.length === 0) return prev
        return prev.map(f => {
          if (Math.random() > 0.7) {
            const statuses: FlightDeparture['status'][] = ['BOARDING', 'ON TIME', 'DELAYED', 'GATE OPEN', 'DEPARTED']
            const nextStatus = statuses[Math.floor(Math.random() * statuses.length)]
            return { ...f, status: nextStatus }
          }
          return f
        })
      })
    }, 8000)

    return () => clearInterval(interval)
  }, [])

  const statusColors = {
    'BOARDING': 'text-amber-400 border-amber-400/20 bg-amber-400/5 shadow-[0_0_8px_rgba(245,158,11,0.15)]',
    'GATE OPEN': 'text-cyan-400 border-cyan-400/20 bg-cyan-400/5 shadow-[0_0_8px_rgba(6,182,212,0.15)]',
    'ON TIME': 'text-emerald-400 border-emerald-400/20 bg-emerald-400/5 shadow-[0_0_8px_rgba(16,185,129,0.15)]',
    'DELAYED': 'text-rose-400 border-rose-400/20 bg-rose-400/5 shadow-[0_0_8px_rgba(244,63,94,0.15)]',
    'DEPARTED': 'text-slate-500 border-slate-700/20 bg-slate-800/10'
  }

  return (
    <div className="w-full rounded-2xl border border-white/5 bg-gradient-to-b from-[#0a0a14] to-[#07070c] overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
      {/* Board Header */}
      <div className="px-5 py-4 border-b border-white/5 bg-white/[0.01] flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div className="relative w-2.5 h-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-400" />
          </div>
          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-[0.2em] font-mono">
            LIVE DEPARTURES BOARD
          </span>
        </div>
        
        {/* Terminal Clock */}
        <TerminalClock />
      </div>

      {/* Grid Content */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[600px]">
          <thead>
            <tr className="border-b border-white/5 bg-white/[0.005]">
              <th className="px-6 py-3.5 text-[9px] font-semibold text-slate-400 uppercase tracking-widest font-mono">Flight</th>
              <th className="px-6 py-3.5 text-[9px] font-semibold text-slate-400 uppercase tracking-widest font-mono">Destination</th>
              <th className="px-6 py-3.5 text-[9px] font-semibold text-slate-400 uppercase tracking-widest font-mono">Sch. Time</th>
              <th className="px-6 py-3.5 text-[9px] font-semibold text-slate-400 uppercase tracking-widest font-mono">Gate</th>
              <th className="px-6 py-3.5 text-[9px] font-semibold text-slate-400 uppercase tracking-widest font-mono">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5 font-mono">
            {departures.length === 0 ? (
              // Shimmering skeleton rows during hydration / initial load
              Array.from({ length: 5 }).map((_, idx) => (
                <tr key={idx} className="animate-pulse">
                  <td className="px-6 py-4"><div className="h-4 bg-white/5 rounded w-16" /></td>
                  <td className="px-6 py-4"><div className="h-4 bg-white/5 rounded w-36" /></td>
                  <td className="px-6 py-4"><div className="h-4 bg-white/5 rounded w-12" /></td>
                  <td className="px-6 py-4"><div className="h-4 bg-white/5 rounded w-16" /></td>
                  <td className="px-6 py-4"><div className="h-5 bg-white/5 rounded w-20" /></td>
                </tr>
              ))
            ) : (
              departures.map((flight) => (
                <tr 
                  key={flight.flightNo} 
                  className={cn(
                    "hover:bg-white/[0.01] transition-all duration-150 group",
                    flight.status === 'DEPARTED' && 'opacity-40'
                  )}
                >
                  {/* Flight Code */}
                  <td className="px-6 py-4 text-xs font-semibold text-slate-300 group-hover:text-indigo-400 transition-colors">
                    {flight.flightNo}
                  </td>
                  
                  {/* Destination */}
                  <td className="px-6 py-4 text-xs font-bold text-white tracking-wide">
                    {flight.destination}
                  </td>
                  
                  {/* Time */}
                  <td className="px-6 py-4 text-xs text-slate-400">
                    {flight.time}
                  </td>
                  
                  {/* Gate */}
                  <td className="px-6 py-4 text-xs text-slate-400">
                    {flight.gate}
                  </td>
                  
                  {/* Status Indicator Badge */}
                  <td className="px-6 py-4">
                    <span className={cn(
                      "inline-block px-2.5 py-0.5 rounded text-[9px] font-semibold tracking-wider border",
                      statusColors[flight.status]
                    )}>
                      {flight.status}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
