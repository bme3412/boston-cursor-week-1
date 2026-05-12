import { redirect } from "next/navigation";
import { getCurrentWeek } from "@/lib/week";

export default function SubmitPage() {
  redirect(`/week/${getCurrentWeek()}`);
}
