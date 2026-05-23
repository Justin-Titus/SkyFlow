import { createClient } from '@/lib/supabase/server'
import { FlightResults } from '@/components/flights/FlightResults'
import { getMockFlightsForRoute } from '@/lib/mockFlights'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Search Results | SkyFlow',
  description: 'Select your flight',
}

interface SearchParams {
  origin?: string;
  destination?: string;
  date?: string;
  passengers?: string;
}



export default async function FlightsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const params = await searchParams
  const supabase = await createClient()

  let flightsList = []

  try {
    let query = supabase.from('flights').select('*')

    if (params.origin) {
      query = query.eq('origin', params.origin.toUpperCase())
    }
    if (params.destination) {
      query = query.eq('destination', params.destination.toUpperCase())
    }
    
    if (params.date) {
      const startDate = new Date(params.date)
      const endDate = new Date(startDate)
      endDate.setDate(endDate.getDate() + 1)
      
      query = query.gte('departs_at', startDate.toISOString())
                   .lt('departs_at', endDate.toISOString())
    }

    query = query.eq('status', 'scheduled').order('departs_at', { ascending: true })

    const { data, error } = await query
    if (error) throw error
    flightsList = data || []
    
    // If no database items returned, fallback to centralized mock list
    if (flightsList.length === 0) {
      flightsList = getMockFlightsForRoute(params.origin || 'DEL', params.destination || 'BOM', params.date)
    }
  } catch (err: unknown) {
    const hasPlaceholder = !process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL.includes('placeholder.supabase.co')
    if (!hasPlaceholder) {
      console.warn('Supabase fetch failed, falling back to mock Indian flights database:', (err as Error)?.message || err)
    }
    flightsList = getMockFlightsForRoute(params.origin || 'DEL', params.destination || 'BOM', params.date)
  }

  flightsList = flightsList.filter((flight: import('@/store/flightStore').Flight) => new Date(flight.departs_at).getTime() > Date.now())

  return (
    <div className="flex-1 w-full relative pt-12 pb-24 px-4 bg-[#09090b]">
      {/* Background decoration */}
      <div className="absolute top-0 w-full h-[300px] bg-gradient-to-b from-blue-900/10 to-transparent -z-10" />
      
      <div className="container mx-auto">
        <FlightResults 
          flights={flightsList} 
          searchParams={params} 
        />
      </div>
    </div>
  )
}
