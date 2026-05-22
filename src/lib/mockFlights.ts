/**
 * Centralized mock flight database.
 *
 * All mock flight data (search results, rescheduling alternatives, seat fallbacks,
 * booking confirmations) must be derived from this single source of truth so that
 * IDs, flight numbers, prices and schedules are always consistent across the app.
 */

export type MockFlight = {
  id: string
  flight_no: string
  origin: string
  destination: string
  departs_at: string
  arrives_at: string
  aircraft_type: string
  status: 'scheduled'
  base_price: number
}

// Fixed airline templates (deterministic, not randomized)
const AIRLINES = [
  { code: '6E', aircraft: 'Airbus A321neo',           basePrice: 4200, suffix: '2012' },
  { code: 'AI', aircraft: 'Boeing 787-8 Dreamliner',  basePrice: 5900, suffix: '805'  },
  { code: 'UK', aircraft: 'Airbus A320neo',            basePrice: 6200, suffix: '985'  },
  { code: 'QP', aircraft: 'Boeing 737 MAX 8',          basePrice: 3800, suffix: '1102' },
  { code: 'SG', aircraft: 'Boeing 737-900ER',          basePrice: 4100, suffix: '8152' },
]

// Departure time slots (UTC hours)
const TIME_SLOTS = [
  { depHour: 6,  depMin: 0  },
  { depHour: 9,  depMin: 30 },
  { depHour: 13, depMin: 15 },
  { depHour: 17, depMin: 45 },
  { depHour: 21, depMin: 0  },
]

/** Real-world approximate durations between popular domestic routes (minutes) */
function getRouteDuration(org: string, dest: string): number {
  const key = [org, dest].sort().join('-')
  const durations: Record<string, number> = {
    'BLR-DEL': 165,
    'BOM-DEL': 135,
    'BOM-MAA': 110,
    'CCU-DEL': 130,
    'CCU-HYD': 125,
    'DEL-MAA': 160,
    'BLR-BOM': 105,
    'HYD-MAA': 75,
  }
  return durations[key] ?? 120
}

/**
 * Return deterministic flights for a given route + date.
 *
 * IDs are stable: `mock-{index}-{org}-{dest}-{dateISO}` — they only change
 * when the date changes, which is correct behaviour (each day has its own
 * inventory of departures).
 */
export function getMockFlightsForRoute(
  origin: string,
  destination: string,
  dateStr?: string
): MockFlight[] {
  const org  = origin.toUpperCase()
  const dest = destination.toUpperCase()

  // Resolve the date: default to 10 days from now if not provided
  let targetDate: Date
  if (dateStr) {
    // Validate YYYY-MM-DD format
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      throw new Error(`Invalid date format: ${dateStr}. Expected YYYY-MM-DD`)
    }
    // Parse as local date — avoid timezone-shifting by creating from parts
    const parts = dateStr.split('-').map(Number)
    if (parts.length !== 3 || !parts.every(p => !isNaN(p))) {
      throw new Error(`Could not parse date: ${dateStr}`)
    }
    // Create date from year, month-1 (0-indexed), day
    targetDate = new Date(parts[0], parts[1] - 1, parts[2])
  } else {
    const d = new Date()
    d.setDate(d.getDate() + 10)
    targetDate = d
  }

  const durationMins = getRouteDuration(org, dest)

  return TIME_SLOTS.map((slot, index) => {
    const airline = AIRLINES[index % AIRLINES.length]

    const depDate = new Date(
      targetDate.getFullYear(),
      targetDate.getMonth(),
      targetDate.getDate(),
      slot.depHour,
      slot.depMin,
      0,
      0
    )
    const arrDate = new Date(depDate.getTime() + durationMins * 60_000)

    // Stable date string for ID
    const dateISO = `${targetDate.getFullYear()}-${String(targetDate.getMonth() + 1).padStart(2, '0')}-${String(targetDate.getDate()).padStart(2, '0')}`

    return {
      id:           `mock-${index + 1}-${org.toLowerCase()}-${dest.toLowerCase()}-${dateISO}`,
      flight_no:    `${airline.code}-${airline.suffix}`,
      origin:       org,
      destination:  dest,
      departs_at:   depDate.toISOString(),
      arrives_at:   arrDate.toISOString(),
      aircraft_type: airline.aircraft,
      status:       'scheduled' as const,
      base_price:   airline.basePrice,
    }
  })
}

/**
 * Look up a single mock flight by its stable ID.
 * Returns `undefined` if the ID does not look like a mock flight ID.
 */
export function getMockFlightById(id: string): MockFlight | undefined {
  // ID format: mock-{idx}-{org}-{dest}-{YYYY-MM-DD}
  const match = id.match(/^mock-(\d+)-([a-z]+)-([a-z]+)-(\d{4}-\d{2}-\d{2})$/)
  if (!match) return undefined

  const [, , org, dest, dateISO] = match
  const flights = getMockFlightsForRoute(org, dest, dateISO)
  return flights.find(f => f.id === id)
}

/**
 * Return alternative mock flights for rescheduling.
 * Excludes the current flight and returns remaining flights on the same route
 * for a date 3 days in the future (a sensible default when DB is not available).
 */
export function getMockAlternativeFlights(
  origin: string,
  destination: string,
  currentFlightId: string
): MockFlight[] {
  const futureDate = new Date()
  futureDate.setDate(futureDate.getDate() + 3)
  const dateISO = `${futureDate.getFullYear()}-${String(futureDate.getMonth() + 1).padStart(2, '0')}-${String(futureDate.getDate()).padStart(2, '0')}`

  return getMockFlightsForRoute(origin, destination, dateISO).filter(
    f => f.id !== currentFlightId
  )
}
