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
          className="flex items-center gap-2 text-lg font-bold tracking-tight shrink-0"
        >
          <Rocket className="size-5 text-primary" />
          Shipyard
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
            Join
          </Link>
        </nav>
      </div>
    </header>
  );
}
