// Curated flair catalog. Members pick from these IDs; the page renders the
// emoji + label using the matching catalog entry. Keep IDs stable — they're
// what gets persisted to cohort.json.

export type FlairColor =
  | "orange"
  | "blue"
  | "green"
  | "purple"
  | "pink"
  | "yellow"
  | "red"
  | "slate";

export type FlairGroup =
  | "sports"
  | "tech"
  | "interests"
  | "boston"
  | "vibe";

export type Flair = {
  id: string;
  emoji: string;
  label: string;
  group: FlairGroup;
  color: FlairColor;
};

export const FLAIR_CATALOG: Flair[] = [
  // Sports
  { id: "world-cup",  emoji: "⚽", label: "World Cup",    group: "sports",    color: "green"  },
  { id: "nba",        emoji: "🏀", label: "NBA",          group: "sports",    color: "orange" },
  { id: "nfl",        emoji: "🏈", label: "NFL",          group: "sports",    color: "red"    },
  { id: "mlb",        emoji: "⚾", label: "Baseball",     group: "sports",    color: "blue"   },
  { id: "running",    emoji: "🏃", label: "Running",      group: "sports",    color: "blue"   },
  { id: "climbing",   emoji: "🧗", label: "Climbing",     group: "sports",    color: "orange" },

  // Tech
  { id: "ai",         emoji: "🧠", label: "AI",           group: "tech",      color: "purple" },
  { id: "shipping",   emoji: "🚀", label: "Shipping",     group: "tech",      color: "green"  },
  { id: "oss",        emoji: "💻", label: "Open Source",  group: "tech",      color: "slate"  },
  { id: "hackathons", emoji: "⚡", label: "Hackathons",   group: "tech",      color: "yellow" },
  { id: "design",     emoji: "🎨", label: "Design",       group: "tech",      color: "pink"   },
  { id: "data",       emoji: "📊", label: "Data",         group: "tech",      color: "blue"   },

  // Interests
  { id: "coffee",     emoji: "☕", label: "Coffee",       group: "interests", color: "orange" },
  { id: "gaming",     emoji: "🎮", label: "Gaming",       group: "interests", color: "purple" },
  { id: "music",      emoji: "🎵", label: "Music",        group: "interests", color: "pink"   },
  { id: "reading",    emoji: "📚", label: "Reading",      group: "interests", color: "blue"   },
  { id: "cooking",    emoji: "🍳", label: "Cooking",      group: "interests", color: "yellow" },
  { id: "dogs",       emoji: "🐕", label: "Dogs",         group: "interests", color: "yellow" },
  { id: "cats",       emoji: "🐈", label: "Cats",         group: "interests", color: "slate"  },

  // Boston
  { id: "boston",     emoji: "🦞", label: "Boston",       group: "boston",    color: "red"    },
  { id: "celtics",    emoji: "🍀", label: "Celtics",      group: "boston",    color: "green"  },
  { id: "bruins",     emoji: "🐻", label: "Bruins",       group: "boston",    color: "yellow" },
  { id: "redsox",     emoji: "🧦", label: "Red Sox",      group: "boston",    color: "red"    },

  // Vibe
  { id: "indie",      emoji: "🌱", label: "Indie Hacker", group: "vibe",      color: "green"  },
  { id: "founder",    emoji: "🦄", label: "Founder",      group: "vibe",      color: "purple" },
  { id: "student",    emoji: "🎓", label: "Student",      group: "vibe",      color: "blue"   },
  { id: "mentor",     emoji: "🧭", label: "Mentor",       group: "vibe",      color: "slate"  },
];

export const FLAIR_BY_ID: Record<string, Flair> = Object.fromEntries(
  FLAIR_CATALOG.map((f) => [f.id, f])
);

export const FLAIR_GROUP_LABEL: Record<FlairGroup, string> = {
  sports: "Sports",
  tech: "Tech",
  interests: "Interests",
  boston: "Boston",
  vibe: "Vibe",
};

export const FLAIR_GROUP_ORDER: FlairGroup[] = [
  "sports",
  "tech",
  "interests",
  "boston",
  "vibe",
];

// Tailwind v4 classes are listed as full literal strings so the JIT scanner
// picks them up at build time. Don't construct these dynamically.
export const FLAIR_COLOR_CLASSES: Record<FlairColor, string> = {
  orange: "bg-orange-100 text-orange-900 ring-orange-300 dark:bg-orange-950/60 dark:text-orange-200 dark:ring-orange-800",
  blue:   "bg-blue-100 text-blue-900 ring-blue-300 dark:bg-blue-950/60 dark:text-blue-200 dark:ring-blue-800",
  green:  "bg-green-100 text-green-900 ring-green-300 dark:bg-green-950/60 dark:text-green-200 dark:ring-green-800",
  purple: "bg-purple-100 text-purple-900 ring-purple-300 dark:bg-purple-950/60 dark:text-purple-200 dark:ring-purple-800",
  pink:   "bg-pink-100 text-pink-900 ring-pink-300 dark:bg-pink-950/60 dark:text-pink-200 dark:ring-pink-800",
  yellow: "bg-yellow-100 text-yellow-900 ring-yellow-300 dark:bg-yellow-950/60 dark:text-yellow-200 dark:ring-yellow-800",
  red:    "bg-red-100 text-red-900 ring-red-300 dark:bg-red-950/60 dark:text-red-200 dark:ring-red-800",
  slate:  "bg-slate-100 text-slate-900 ring-slate-300 dark:bg-slate-900/60 dark:text-slate-200 dark:ring-slate-700",
};

export const MAX_FLAIR = 6;

export function normalizeFlair(ids: unknown): string[] {
  if (!Array.isArray(ids)) return [];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of ids) {
    if (typeof raw !== "string") continue;
    if (seen.has(raw)) continue;
    if (!FLAIR_BY_ID[raw]) continue;
    seen.add(raw);
    out.push(raw);
    if (out.length >= MAX_FLAIR) break;
  }
  return out;
}
