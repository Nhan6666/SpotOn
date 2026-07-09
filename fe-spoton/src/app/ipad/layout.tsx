export default function IpadLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-slate-900 font-sans selection:bg-blue-500/30">
      {children}
    </div>
  );
}
