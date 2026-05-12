import { getMembersByActivity } from "@/lib/data";
import { MemberGrid } from "@/components/member-grid";

export default async function Home() {
  const members = await getMembersByActivity();

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight">
          Cursor Boston Cohort 1
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          100 builders, 6 weeks, shipping from Boston. See what everyone&apos;s working on.
        </p>
      </div>
      <MemberGrid members={members} />
    </main>
  );
}
