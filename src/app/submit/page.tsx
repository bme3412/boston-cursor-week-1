import { SubmitForm } from "@/components/submit-form";

export default function SubmitPage() {
  return (
    <main className="mx-auto max-w-xl px-4 py-8">
      <h1 className="text-2xl font-bold tracking-tight mb-1">
        Submit your weekly update
      </h1>
      <p className="text-sm text-muted-foreground mb-8">
        What did you ship this week? Add your Loom and deploy link for Friday.
      </p>
      <SubmitForm />
    </main>
  );
}
