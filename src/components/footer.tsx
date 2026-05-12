import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t mt-auto">
      <div className="mx-auto max-w-6xl px-4 py-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground">
        <div>
          Built in Boston &middot; Cursor Boston Cohort 1 &middot; Summer 2026
        </div>
        <div className="flex items-center gap-4">
          <Link
            href="/feed"
            className="hover:text-foreground transition-colors"
          >
            Feed
          </Link>
          <Link
            href="/join"
            className="hover:text-foreground transition-colors"
          >
            Sign In
          </Link>
          <a
            href="https://www.cursorboston.com"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-foreground transition-colors"
          >
            cursorboston.com
          </a>
          <a
            href="https://discord.gg/Wsncg8YYqc"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-foreground transition-colors"
          >
            Discord
          </a>
        </div>
      </div>
    </footer>
  );
}
