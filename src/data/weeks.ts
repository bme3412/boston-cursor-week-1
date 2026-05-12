export type WeekInfo = {
  week: number;
  title: string;
  theme: string;
  brief: string;
  deadline: string;
  deadlineLabel: string;
  format: "vote" | "merge" | "show-and-tell" | "demo-day";
  inspirations: string[];
};

export const WEEKS: WeekInfo[] = [
  {
    week: 1,
    title: "Project Management Build",
    theme: "PM Tool",
    brief:
      "Everyone builds a PM tool. The cohort picks a winner on Friday; the winner runs the cohort PM tool for the rest of the program.",
    deadline: "2026-05-15T17:00:00-04:00",
    deadlineLabel: "Fri, May 15 · 5pm EST",
    format: "vote",
    inspirations: [],
  },
  {
    week: 2,
    title: "Communications Build",
    theme: "Comms Platform",
    brief:
      "Everyone builds a comms platform for the cohort. Same vote-and-pick-a-winner format. Winner runs comms for the rest of the cohort.",
    deadline: "2026-05-22T17:00:00-04:00",
    deadlineLabel: "Fri, May 22 · 5pm EST",
    format: "vote",
    inspirations: [],
  },
  {
    week: 3,
    title: "Vibe Marketing Build",
    theme: "Marketing Platform",
    brief:
      "Everyone builds a marketing platform that does outbound, not just inbound — gets the cohort's work into the public eye AND handles the replies that come back.",
    deadline: "2026-05-29T17:00:00-04:00",
    deadlineLabel: "Fri, May 29 · 5pm EST",
    format: "vote",
    inspirations: [],
  },
  {
    week: 4,
    title: "Ludwitt Education Tool",
    theme: "Education Tool",
    brief:
      "Everyone ships an education tool that gets merged into Ludwitt. No vote — every shipped + merged tool counts. You earn revenue per use when users consume credits via your tool.",
    deadline: "2026-06-05T17:00:00-04:00",
    deadlineLabel: "Fri, Jun 5 · 5pm EST",
    format: "merge",
    inspirations: [],
  },
  {
    week: 5,
    title: "Your Own Startup",
    theme: "Open Week",
    brief:
      "Build whatever YOU want — your own startup project. No vote, no template. Friday is show-and-tell: 3 minutes each on what you built and what's next.",
    deadline: "2026-06-12T17:00:00-04:00",
    deadlineLabel: "Fri, Jun 12 · 5pm EST",
    format: "show-and-tell",
    inspirations: [],
  },
  {
    week: 6,
    title: "Open-Source PR",
    theme: "OSS Contribution",
    brief:
      "Pick a major open-source project and land a merged PR upstream. Friday is demo day with hiring partners — bring your merged PR URL.",
    deadline: "2026-06-19T17:00:00-04:00",
    deadlineLabel: "Fri, Jun 19 · time TBD",
    format: "demo-day",
    inspirations: [],
  },
];

export function getWeekInfo(weekNum: number): WeekInfo | undefined {
  return WEEKS.find((w) => w.week === weekNum);
}
