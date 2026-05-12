import type { GitHubEvent } from "./types";

const EVENT_LABELS: Record<string, string> = {
  PushEvent: "Pushed to",
  PullRequestEvent: "Pull request on",
  CreateEvent: "Created branch in",
  DeleteEvent: "Deleted branch in",
  IssuesEvent: "Issue on",
  IssueCommentEvent: "Commented on",
  WatchEvent: "Starred",
  ForkEvent: "Forked",
  ReleaseEvent: "Released in",
  PullRequestReviewEvent: "Reviewed PR on",
  PullRequestReviewCommentEvent: "Reviewed PR on",
  CommitCommentEvent: "Commented on commit in",
  MemberEvent: "Membership change in",
  PublicEvent: "Made public",
  GollumEvent: "Updated wiki in",
};

export function humanizeEvent(event: GitHubEvent): string {
  const label = EVENT_LABELS[event.type] ?? event.type.replace(/Event$/, "") + " on";
  const repo = event.repo.name;
  return `${label} ${repo}`;
}

const EVENT_ICONS: Record<string, string> = {
  PushEvent: "commit",
  PullRequestEvent: "pr",
  CreateEvent: "create",
  IssuesEvent: "issue",
  IssueCommentEvent: "comment",
  WatchEvent: "star",
  ForkEvent: "fork",
  ReleaseEvent: "release",
  DeleteEvent: "delete",
};

export type EventIcon = "commit" | "pr" | "create" | "issue" | "comment" | "star" | "fork" | "release" | "delete" | "default";

export function getEventIcon(type: string): EventIcon {
  return (EVENT_ICONS[type] as EventIcon) ?? "default";
}

/** Group events by date string (e.g. "May 12") */
export function groupEventsByDate(
  events: GitHubEvent[]
): { date: string; events: GitHubEvent[] }[] {
  const groups = new Map<string, GitHubEvent[]>();

  for (const event of events) {
    const date = new Date(event.created_at).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
    const existing = groups.get(date);
    if (existing) {
      existing.push(event);
    } else {
      groups.set(date, [event]);
    }
  }

  return Array.from(groups.entries()).map(([date, events]) => ({
    date,
    events,
  }));
}
