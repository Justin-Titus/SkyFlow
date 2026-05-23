import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const pnr = searchParams.get('pnr')
    const bookingId = searchParams.get('id')

    if (!pnr && !bookingId) {
      return NextResponse.json({ error: 'Provide pnr or id query param' }, { status: 400 })
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    let query = supabase
      .from('bookings')
      .select('*, flights(*), seats(*), passengers(*)')
      .eq('user_id', user.id)

    if (pnr) {
      query = query.eq('pnr_code', pnr.toUpperCase())
    } else if (bookingId) {
      query = query.eq('id', bookingId)
    }

    const { data, error } = await query.single()
    if (error || !data) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true, booking: data })
  } catch (error: unknown) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

function generateMockUUID(): string {
  const chars = '0123456789abcdef'
  let randomPart = ''
  for (let i = 0; i < 12; i++) {
    randomPart += chars[Math.floor(Math.random() * chars.length)]
  }
  return `e0000000-0000-4000-a000-${randomPart}`
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    
    let userId = 'mock-user-123'
    let isMockMode = false
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        userId = user.id
      } else {
        isMockMode = true
      }
    } catch (err) {
      console.warn('Auth check failed, using mock user:', err)
      isMockMode = true
    }

    const body = await request.json()
    const { flightId, seatId, passengerData, totalPrice, passengers } = body

    if (!flightId || (!seatId && !passengers) || (!passengerData && !passengers) || !totalPrice) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const passengerAssignments = passengers || [{ seatId, passengerData }]

    const isUuid = (str: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str)
    const hasMockIds = !isUuid(flightId) || passengerAssignments.some((a: { seatId: string }) => !isUuid(a.seatId))
    if (hasMockIds) {
      isMockMode = true
    }

    const hasPlaceholder = !process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL.includes('placeholder.supabase.co')
    if (hasPlaceholder || isMockMode) {
      console.log('Booking API: using mock local fallback (mock mode / placeholder connection)')
      const mockBookingId = generateMockUUID()
      const mockPnr = `PNR-${Math.random().toString(36).substring(2, 8).toUpperCase()}`
      return NextResponse.json({
        success: true,
        booking_id: mockBookingId,
        pnr_code: mockPnr
      })
    }

    // Call the RPC function for atomic reservation with fallback
    try {
      let firstBookingId = null
      let firstPnr = null

      for (const assignment of passengerAssignments) {
        const { data, error } = await supabase.rpc('reserve_seat', {
          p_user_id: userId,
          p_flight_id: flightId,
          p_seat_id: assignment.seatId,
          p_passenger_name: assignment.passengerData.full_name,
          p_passport_no: assignment.passengerData.passport_no,
          p_nationality: assignment.passengerData.nationality,
          p_dob: assignment.passengerData.dob,
          p_total_price: totalPrice / passengerAssignments.length
        })

        if (error) throw error
        const result = data as unknown as { success: boolean, booking_id?: string, pnr_code?: string, error?: string }

        if (!result || !result.success) {
          return NextResponse.json({ error: result?.error || 'Failed to reserve seat. It might be already taken.' }, { status: 400 })
        }

        if (!firstBookingId) {
          firstBookingId = result.booking_id
          firstPnr = result.pnr_code
        }
      }

      return NextResponse.json({ 
        success: true, 
        booking_id: firstBookingId,
        pnr_code: firstPnr 
      })
    } catch (dbErr) {
      console.error('Supabase DB booking RPC error:', dbErr)
      const errorMessage = dbErr instanceof Error ? dbErr.message : 'Booking failed'
      return NextResponse.json({ success: false, error: errorMessage }, { status: 500 })
    }
    
  } catch (err: unknown) {
    console.error('Booking Error:', err)
    return NextResponse.json({ error: (err as Error)?.message || 'Internal Server Error' }, { status: 500 })
  }
}
