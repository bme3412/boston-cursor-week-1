import { JoinForm } from "@/components/join-form";

export default function JoinPage() {
  return (
    <main className="mx-auto max-w-xl px-4 py-8">
      <h1 className="text-2xl font-bold tracking-tight mb-1">
        Join the cohort
      </h1>
      <p className="text-sm text-muted-foreground mb-8">
        Add yourself to the Cursor Boston feed. Takes 30 seconds &mdash; your
        profile goes live instantly.
      </p>
      <JoinForm />
    </main>
  );
}
