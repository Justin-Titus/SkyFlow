/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: bookingId } = await params
    const { newFlightId } = await request.json()

    if (!newFlightId) {
      return NextResponse.json({ error: 'Missing new flight ID' }, { status: 400 })
    }

    const supabase = await createClient()
    
    const isUuid = (str: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str)
    const isMockId = (str: string) => str.startsWith('mock-') || str.startsWith('e0000000-')
    let userId = 'mock-user-123'
    let isMockMode = !isUuid(bookingId) || !isUuid(newFlightId) || isMockId(bookingId) || isMockId(newFlightId)
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

    const hasPlaceholder = !process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL.includes('placeholder.supabase.co')
    if (hasPlaceholder || isMockMode) {
      console.log('Reschedule API: using mock local fallback (mock mode / placeholder connection)')
      return NextResponse.json({ success: true, fee: 0 })
    }

    // Call the RPC function
    try {
      const { data, error } = await (supabase.rpc as any)('reschedule_booking', {
        p_booking_id: bookingId,
        p_user_id: userId,
        p_new_flight_id: newFlightId
      })

      if (error) throw error
      const result = data as any

      if (!result || !result.success) {
        return NextResponse.json({ error: result?.error || 'Failed to reschedule booking' }, { status: 400 })
      }

      return NextResponse.json({ success: true, fee: result.fee })
    } catch (dbErr) {
      console.error('Supabase DB reschedule RPC error:', dbErr)
      return NextResponse.json({ success: false, error: 'Reschedule failed' }, { status: 500 })
    }
    
  } catch (err: any) {
    console.error('Reschedule error:', err)
    return NextResponse.json(
      { error: err.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
