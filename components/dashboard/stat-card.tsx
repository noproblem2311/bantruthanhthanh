import type { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export function StatCard({
  title,
  value,
  description,
  icon: Icon,
}: {
  title: string;
  value: string | number;
  description?: string;
  icon?: LucideIcon;
}) {
  return (
    <Card>
      <CardContent className="flex items-start justify-between gap-4 p-4">
        <div>
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="mt-2 text-2xl font-semibold">{value}</p>
          {description ? <p className="mt-1 text-xs text-muted-foreground">{description}</p> : null}
        </div>
        {Icon ? (
          <div className="rounded-md bg-primary/10 p-2 text-primary">
            <Icon className="h-5 w-5" />
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
