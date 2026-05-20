import { Loader2 } from "lucide-react";

export default function Loading() {
  return (
    <div className="grid min-h-[60vh] place-items-center bg-slate-50">
      <div className="flex items-center gap-3 rounded-lg border bg-white px-5 py-4 text-sm font-medium text-slate-700 shadow-soft">
        <Loader2 className="h-5 w-5 animate-spin text-primary" />
        Đang tải dữ liệu...
      </div>
    </div>
  );
}
