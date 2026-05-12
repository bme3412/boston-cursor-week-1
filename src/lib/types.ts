import { z } from "zod";

// ── GitHub User ──────────────────────────────────────────────────────────────

export const GitHubUserSchema = z.object({
  login: z.string(),
  name: z.nullable(z.string()),
  bio: z.nullable(z.string()),
  avatar_url: z.url(),
  html_url: z.url(),
  public_repos: z.number(),
  followers: z.number(),
});

export type GitHubUser = z.infer<typeof GitHubUserSchema>;

// ── GitHub Event ─────────────────────────────────────────────────────────────

export const GitHubEventSchema = z.object({
  type: z.string(),
  repo: z.object({
    name: z.string(),
    url: z.string(), // API url, not always a valid browser url
  }),
  created_at: z.string(),
  payload: z.record(z.string(), z.unknown()),
});

export type GitHubEvent = z.infer<typeof GitHubEventSchema>;

// ── Weekly Update ────────────────────────────────────────────────────────────

export const WeeklyUpdateSchema = z.object({
  week: z.number(),
  shipped: z.string(),
  loomUrl: z.string().optional(),
  deployUrl: z.string().optional(),
  repoUrl: z.string().optional(),
  submittedAt: z.string(),
});

export type WeeklyUpdate = z.infer<typeof WeeklyUpdateSchema>;

// ── Cohort Member ───────────────────────────────────────────────────────────

export const MemberSchema = z.object({
  handle: z.string(),
  projectName: z.string(),
  projectDescription: z.string(),
  projectUrl: z.string().optional(),
  repoUrl: z.string().optional(),
  tags: z.array(z.string()).default([]),
  joinedWeek: z.number().default(1),
  updates: z.array(WeeklyUpdateSchema).default([]),
  pinHash: z.string().optional(),
});

export type Member = z.infer<typeof MemberSchema>;

// ── Vote ────────────────────────────────────────────────────────────────────

export const VoteSchema = z.object({
  voter: z.string(),
  week: z.number(),
  candidate: z.string(),
  votedAt: z.string(),
});

export type Vote = z.infer<typeof VoteSchema>;

// ── Cohort ──────────────────────────────────────────────────────────────────

export const CohortSchema = z.object({
  programName: z.string(),
  currentWeek: z.number(),
  weekStartDate: z.string(),
  members: z.array(MemberSchema),
  votes: z.array(VoteSchema).default([]),
});

export type Cohort = z.infer<typeof CohortSchema>;

// ── Composed Profile ─────────────────────────────────────────────────────────

export type Profile = {
  user: GitHubUser;
  recentEvents: GitHubEvent[];
  member: Member | null;
  fetchedAt: string;
};
