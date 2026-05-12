import { JoinForm } from "@/components/join-form";

export default function JoinPage() {
  return (
    <main className="mx-auto max-w-xl px-4 py-8">
      <h1 className="text-2xl font-bold tracking-tight mb-1">
        Join the cohort
      </h1>
      <p className="text-sm text-muted-foreground mb-8">
        Fill this out and we&apos;ll add your profile to the feed. Takes 30
        seconds.
      </p>
      <JoinForm />
    </main>
  );
}
