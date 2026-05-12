import Link from "next/link";
import { Rocket } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { WEEKS } from "@/data/weeks";

export function NavHeader() {
  return (
    <header className="border-b bg-card/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-2.5">
        <Link
          href="/"
          className="flex items-center gap-2 shrink-0"
        >
          <Rocket className="size-5 text-primary" />
          <div>
            <span className="text-lg font-bold tracking-tight">Shipyard</span>
            <span className="hidden sm:inline text-xs text-muted-foreground ml-2">
              Cursor Boston
            </span>
          </div>
        </Link>
        <nav className="flex items-center gap-1 overflow-x-auto">
          {WEEKS.map((w) => (
            <Link
              key={w.week}
              href={`/week/${w.week}`}
              className={buttonVariants({ variant: "ghost", size: "xs" })}
            >
              W{w.week}
            </Link>
          ))}
          <Link
            href="/join"
            className={buttonVariants({ variant: "outline", size: "xs" })}
          >
            Sign In
          </Link>
        </nav>
      </div>
    </header>
  );
}
