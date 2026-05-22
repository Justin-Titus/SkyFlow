import { PassengerForm } from '@/components/booking/PassengerForm'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Passenger Details | SkyFlow',
  description: 'Enter your passenger details to complete booking',
}

export default function PassengersPage() {
  return <PassengerForm />
}
