import { PNRCard } from '@/components/booking/PNRCard'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Booking Confirmed | SkyFlow',
  description: 'Your flight booking confirmation',
}

export default async function ConfirmationPage({ params }: { params: Promise<{ pnrCode: string }> }) {
  const { pnrCode } = await params
  return <PNRCard bookingId={pnrCode} isConfirmation={true} />
}
