import type { ZodType } from "zod";
import { z } from "zod";
import { GitHubUserSchema, GitHubEventSchema } from "./types";
import type { GitHubUser, GitHubEvent } from "./types";

const BASE = "https://api.github.com";

async function gh<T>(path: string, schema: ZodType<T>): Promise<T> {
  const headers: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
  };

  const token = process.env.GITHUB_TOKEN;
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(`${BASE}${path}`, {
    headers,
    next: { revalidate: 3600 },
  });

  if (!res.ok) {
    throw new Error(`GitHub API ${res.status} on ${path}`);
  }

  const data = await res.json();
  return schema.parse(data);
}

export function fetchUser(handle: string): Promise<GitHubUser> {
  return gh(`/users/${handle}`, GitHubUserSchema);
}

export function fetchRecentEvents(handle: string): Promise<GitHubEvent[]> {
  return gh(`/users/${handle}/events/public`, z.array(GitHubEventSchema));
}
