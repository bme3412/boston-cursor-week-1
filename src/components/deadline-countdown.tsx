"use client";

import { useEffect, useState } from "react";

function format(diffMs: number): { label: string; urgency: "past" | "soon" | "ok" } {
  if (diffMs <= 0) return { label: "Deadline passed", urgency: "past" };
  const totalMin = Math.floor(diffMs / 60_000);
  const days = Math.floor(totalMin / (60 * 24));
  const hours = Math.floor((totalMin % (60 * 24)) / 60);
  const mins = totalMin % 60;

  let label: string;
  if (days >= 1) label = `${days}d ${hours}h`;
  else if (hours >= 1) label = `${hours}h ${mins}m`;
  else label = `${mins}m`;

  const urgency: "past" | "soon" | "ok" =
    totalMin < 60 * 6 ? "soon" : "ok";
  return { label, urgency };
}

export function DeadlineCountdown({
  deadline,
  className = "",
}: {
  deadline: string;
  className?: string;
}) {
  const target = new Date(deadline).getTime();
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(id);
  }, []);

  const { label, urgency } = format(target - now);
  const color =
    urgency === "past"
      ? "text-muted-foreground"
      : urgency === "soon"
        ? "text-red-600 font-semibold"
        : "text-foreground";

  return <span className={`tabular-nums ${color} ${className}`}>{label}</span>;
}
