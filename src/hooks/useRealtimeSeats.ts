'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Seat, useFlightStore } from '@/store/flightStore'
import { isUuid } from '@/lib/utils'

const generateMockSeats = (flightId: string): Seat[] => {
  const mockSeats: Seat[] = []
  const cols = ['A', 'B', 'C', 'D', 'E', 'F']
  
  for (let row = 1; row <= 25; row++) {
    let seatClass: 'first' | 'business' | 'economy' = 'economy'
    let extraFee = 0
    
    if (row <= 2) {
      seatClass = 'first'
      extraFee = 4500
    } else if (row <= 5) {
      seatClass = 'business'
      extraFee = 2500
    } else if (row === 12 || row === 13) {
      seatClass = 'economy'
      extraFee = 850 // Exit Row premium extra legroom
    } else if (row <= 8) {
      seatClass = 'economy'
      extraFee = 350 // Front row economy seat selection
    }
    
    for (const col of cols) {
      // First and Business are 2-2 configuration (omit B and E)
      if ((seatClass === 'first' || seatClass === 'business') && (col === 'B' || col === 'E')) {
        continue
      }
      
      const seatNo = `${row}${col}`
      // Use a deterministic seed for availability based on seat number
      // (same seed every render, 30% occupied to keep some seats available)
      const charSum = seatNo.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0)
      const isAvailable = (charSum % 10) > 2 // ~70% available

      mockSeats.push({
        id: `${flightId}__seat__${seatNo}`,
        flight_id: flightId,
        seat_number: seatNo,
        class: seatClass,
        extra_fee: extraFee,
        is_available: isAvailable
      })
    }
  }
  return mockSeats
}


export function useRealtimeSeats(flightId: string) {
  const [seats, setSeats] = useState<Seat[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lockedSeats, setLockedSeats] = useState<Record<string, { sessionId: string; timestamp: number }>>({})
  
  // Generate a stable unique session ID for this page load / hook instance
  const [mySessionId] = useState(() => Math.random().toString(36).substring(2, 12))
  
  const supabase = createClient()
  const localChannelRef = useRef<any>(null)
  const supabaseChannelRef = useRef<any>(null)

  // Overlay booked seats from localStorage
  const overlayLocalBookings = useCallback((seatList: Seat[]): Seat[] => {
    try {
      const bookingsStr = localStorage.getItem('skyflow_local_bookings')
      if (!bookingsStr) return seatList
      const bookings = JSON.parse(bookingsStr)
      const bookedSeatIds: string[] = []
      for (const b of bookings) {
        if (b.flight_id === flightId && b.status !== 'cancelled') {
          if (b.seats_list && Array.isArray(b.seats_list)) {
            b.seats_list.forEach((s: any) => bookedSeatIds.push(s.id))
          } else if (b.seats && b.seats.id) {
            bookedSeatIds.push(b.seats.id)
          }
        }
      }
      
      if (bookedSeatIds.length === 0) return seatList
      return seatList.map(seat => {
        if (bookedSeatIds.includes(seat.id)) {
          return { ...seat, is_available: false }
        }
        return seat
      })
    } catch (e) {
      console.warn('Error reading local bookings for seat availability:', e)
      return seatList
    }
  }, [flightId])

  // Broadcast lock state to peers (Supabase + Local BroadcastChannel)
  const broadcastLock = useCallback((seatId: string, locked: boolean) => {
    const payload = { seatId, locked, sessionId: mySessionId, timestamp: Date.now() }
    
    // 1. Local window/tab BroadcastChannel
    try {
      if (localChannelRef.current) {
        localChannelRef.current.postMessage({ type: 'seat_lock', payload })
      }
    } catch (e) {
      // fail silently
    }

    // 2. Supabase Realtime Broadcast
    try {
      if (supabaseChannelRef.current) {
        supabaseChannelRef.current.send({
          type: 'broadcast',
          event: 'seat_lock',
          payload
        })
      }
    } catch (e) {
      // fail silently
    }
  }, [mySessionId])

  useEffect(() => {
    let isMounted = true

    // Initialize BroadcastChannel for cross-tab local sync
    const localChannelName = `skyflow_seat_locks_${flightId}`
    let localChannel: any = null
    try {
      localChannel = new BroadcastChannel(localChannelName)
      localChannelRef.current = localChannel
    } catch (e) {
      console.warn('BroadcastChannel not supported:', e)
    }

    // Initialize Supabase Broadcast Channel for cross-user/cross-session sync
    const supabaseBroadcastChannel = supabase.channel(`seats_locks_broadcast_${flightId}`)
    supabaseChannelRef.current = supabaseBroadcastChannel

    // Setup helper to handle lock updates from peers
    const handleSeatLockMsg = (payload: { seatId: string; locked: boolean; sessionId: string; timestamp: number }) => {
      if (payload.sessionId === mySessionId) return
      setLockedSeats(prev => {
        const next = { ...prev }
        if (payload.locked) {
          next[payload.seatId] = { sessionId: payload.sessionId, timestamp: payload.timestamp }
        } else {
          delete next[payload.seatId]
        }
        return next
      })
    }

    // Setup helper to respond to peer requests for active locks
    const handleRequestLocksMsg = (payload: { sessionId: string }) => {
      if (payload.sessionId === mySessionId) return
      // Get current selected seats from the store and broadcast locks for them
      const storeSelectedSeats = useFlightStore.getState().selectedSeats
      storeSelectedSeats.forEach(seat => {
        const p = { seatId: seat.id, locked: true, sessionId: mySessionId, timestamp: Date.now() }
        try {
          localChannel?.postMessage({ type: 'seat_lock', payload: p })
        } catch (e) {}
        try {
          supabaseBroadcastChannel.send({
            type: 'broadcast',
            event: 'seat_lock',
            payload: p
          })
        } catch (e) {}
      })
    }

    // Configure BroadcastChannel listener
    if (localChannel) {
      localChannel.onmessage = (event: any) => {
        const { type, payload } = event.data
        if (type === 'seat_lock') {
          handleSeatLockMsg(payload)
        } else if (type === 'request_locks') {
          handleRequestLocksMsg(payload)
        }
      }
    }

    // Configure Supabase broadcast listeners
    supabaseBroadcastChannel
      .on('broadcast', { event: 'seat_lock' }, ({ payload }) => {
        handleSeatLockMsg(payload)
      })
      .on('broadcast', { event: 'request_locks' }, ({ payload }) => {
        handleRequestLocksMsg(payload)
      })
      .subscribe()

    // Query initial locks from online peers
    const requestLocksPayload = { sessionId: mySessionId }
    try {
      localChannel?.postMessage({ type: 'request_locks', payload: requestLocksPayload })
    } catch (e) {}
    try {
      supabaseBroadcastChannel.send({
        type: 'broadcast',
        event: 'request_locks',
        payload: requestLocksPayload
      })
    } catch (e) {}

    // Fetch actual seat configuration
    const fetchSeats = async () => {
      if (!isUuid(flightId)) {
        if (isMounted) {
          setSeats(overlayLocalBookings(generateMockSeats(flightId)))
          setLoading(false)
          setError(null)

          // Set error when fetch fails
        }
        return
      }

      try {
        setLoading(true)
          setError(null)
        const { data, error } = await supabase
          .from('seats')
          .select('*')
          .eq('flight_id', flightId)
          .order('seat_number')

        if (error) throw error
        
        if (isMounted) {
          if (data && data.length > 0) {
            setSeats(overlayLocalBookings(data as Seat[]))
          } else {
            setSeats(overlayLocalBookings(generateMockSeats(flightId)))
          }
          setLoading(false)
        }
      } catch (err: any) {
        console.warn('Seats fetch failed, falling back to mock cabin map:', err?.message || err)
        if (isMounted) {
          setSeats(overlayLocalBookings(generateMockSeats(flightId)))
          setLoading(false)
        }
      }
    }

    fetchSeats()

    // Subscribe to hard changes in the database seats table (e.g. final bookings)
    let seatsChannel: any = null
    if (isUuid(flightId)) {
      seatsChannel = supabase
        .channel(`seats_changes_${flightId}`)
        .on(
          'postgres_changes',
          {
            event: '*', 
            schema: 'public',
            table: 'seats',
            filter: `flight_id=eq.${flightId}`
          },
          (payload) => {
            if (!isMounted) return

            if (payload.eventType === 'UPDATE') {
              const updatedSeat = payload.new as Seat
              setSeats((prevSeats) => {
                const mapped = prevSeats.map(seat => 
                  seat.id === updatedSeat.id ? updatedSeat : seat
                )
                return overlayLocalBookings(mapped)
              })
            } else if (payload.eventType === 'INSERT') {
              setSeats((prev) => overlayLocalBookings([...prev, payload.new as Seat]))
            }
          }
        )
        .subscribe()
    }

    // Pruning interval for expired locks (locks older than 5 minutes)
    const pruneInterval = setInterval(() => {
      setLockedSeats(prev => {
        const now = Date.now()
        const next = { ...prev }
        let changed = false
        for (const [seatId, lock] of Object.entries(next)) {
          if (now - lock.timestamp > 300000) { // 5 minutes
            delete next[seatId]
            changed = true
          }
        }
        return changed ? next : prev
      })
    }, 5000)

    // Heartbeat interval to refresh our selected seat locks on other clients
    const heartbeatInterval = setInterval(() => {
      const storeSelectedSeats = useFlightStore.getState().selectedSeats
      storeSelectedSeats.forEach(seat => {
        const p = { seatId: seat.id, locked: true, sessionId: mySessionId, timestamp: Date.now() }
        try {
          localChannel?.postMessage({ type: 'seat_lock', payload: p })
        } catch (e) {}
        try {
          supabaseBroadcastChannel.send({
            type: 'broadcast',
            event: 'seat_lock',
            payload: p
          })
        } catch (e) {}
      })
    }, 30000)

    return () => {
      isMounted = false
      clearInterval(pruneInterval)
      clearInterval(heartbeatInterval)
      try {
        localChannel?.close()
      } catch (e) {}
      try {
        supabase.removeChannel(seatsChannel)
      } catch (e) {}
      try {
        supabase.removeChannel(supabaseBroadcastChannel)
      } catch (e) {}
    }
  }, [flightId, supabase, mySessionId, overlayLocalBookings])

  // Process and map active overrides for locks
  const activeSeats = seats.map(seat => {
    const lock = lockedSeats[seat.id]
    // A seat is locked if another session has it locked, and that lock is less than 5 minutes old
    const isLockedByOther = lock && lock.sessionId !== mySessionId && (Date.now() - lock.timestamp < 300000)
    if (isLockedByOther) {
      return { ...seat, is_available: false }
    }
    return seat
  })

  return { seats: activeSeats, loading, error, mySessionId, broadcastLock }
}
