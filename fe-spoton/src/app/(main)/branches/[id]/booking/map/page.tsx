import { TableMapFeature } from "@/features/booking/TableMapFeature";

export default async function TableMapPage({
  params,
}: {
  params: { id: string };
}) {
  // We can fetch initial branch details here if needed
  return <TableMapFeature branchId={params.id} />;
}
