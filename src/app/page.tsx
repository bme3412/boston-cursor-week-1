import { getMembersByActivity } from "@/lib/data";
import { MemberGrid } from "@/components/member-grid";

export default async function Home() {
  const members = await getMembersByActivity();

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <MemberGrid members={members} />
    </main>
  );
}
