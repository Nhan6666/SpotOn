import React from "react";
import { LiveMapFeature } from "../../../../../../features/admin/live-map/LiveMapFeature";

export default async function LiveMapPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <LiveMapFeature branchId={id} />;
}
