import { TemplateEditorFeature } from "@/features/admin/map-templates/TemplateEditorFeature";

export default async function TemplateEditorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <TemplateEditorFeature templateId={id} />;
}
