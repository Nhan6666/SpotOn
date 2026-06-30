import { BookingListFeature } from "@/features/admin/booking-list/BookingListFeature";

export default async function BookingListPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <BookingListFeature branchId={id} />;
}
