import { PNRCard } from '@/components/booking/PNRCard'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Ticket Details | SkyFlow',
  description: 'View your flight ticket details',
}

export default async function TicketDetailsPage({ params }: { params: Promise<{ pnrCode: string }> }) {
  const { pnrCode } = await params
  return <PNRCard bookingId={pnrCode} isConfirmation={false} />
}
