import { TableMapFeature } from "@/features/booking/TableMapFeature";

export default async function TableMapPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <TableMapFeature branchId={id} />;
}
