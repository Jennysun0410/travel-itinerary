import { redirect } from 'next/navigation';

interface Props { params: { id: string } }

export default function TripPage({ params }: Props) {
  redirect(`/trips/${params.id}/orders`);
}
