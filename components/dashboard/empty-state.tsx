export function EmptyState({ title, description }: { title: string; description?: string }) {
  return (
    <div className="rounded-lg border border-dashed bg-white p-8 text-center">
      <p className="font-medium text-slate-900">{title}</p>
      {description ? <p className="mt-1 text-sm text-muted-foreground">{description}</p> : null}
    </div>
  );
}
