"use client";

import { useState } from "react";
import { ChevronRight } from "lucide-react";

export function CollapsibleSection({
  label,
  count,
  variant = "default",
  children,
}: {
  label: string;
  count: number;
  variant?: "default" | "warning";
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);

  const bg =
    variant === "warning"
      ? "rounded-lg border border-amber-200 bg-amber-50 px-4 py-3"
      : "";

  return (
    <div className={bg}>
      <button
        className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
        onClick={() => setOpen((o) => !o)}
      >
        <ChevronRight
          className={`size-4 transition-transform ${open ? "rotate-90" : ""}`}
        />
        {label} ({count})
      </button>
      {open && <div className="mt-3">{children}</div>}
    </div>
  );
}
