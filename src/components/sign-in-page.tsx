"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession, signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { JoinForm } from "@/components/join-form";

export function SignInPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [mode, setMode] = useState<"signin" | "register">("signin");

  // Already fully authenticated — redirect to home
  if (session?.user?.handle) {
    router.push("/");
    return (
      <main className="mx-auto max-w-xl px-4 py-8">
        <div className="rounded-lg border bg-card p-8 text-center">
          <p className="text-sm text-muted-foreground">Redirecting...</p>
        </div>
      </main>
    );
  }

  if (mode === "register") {
    return (
      <main className="mx-auto max-w-xl px-4 py-8">
        <h1 className="text-2xl font-bold tracking-tight mb-1">
          Join the cohort
        </h1>
        <p className="text-sm text-muted-foreground mb-8">
          Sign in with GitHub, then add your project details. Your profile goes
          live instantly.
        </p>
        <JoinForm />
        <p className="text-xs text-muted-foreground mt-6 text-center">
          Already in the cohort?{" "}
          <button
            className="text-primary hover:underline"
            onClick={() => setMode("signin")}
          >
            Sign in
          </button>
        </p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-xl px-4 py-8">
      <h1 className="text-2xl font-bold tracking-tight mb-1">Sign in</h1>
      <p className="text-sm text-muted-foreground mb-8">
        Sign in with your GitHub account to view the cohort feed, vote, submit
        updates, and post.
      </p>

      <div className="rounded-lg border bg-card p-8 text-center">
        <Button
          size="lg"
          onClick={() => signIn("github", { callbackUrl: "/" })}
          className="w-full sm:w-auto"
        >
          Sign in with GitHub
        </Button>
      </div>

      <p className="text-xs text-muted-foreground mt-6 text-center">
        New here?{" "}
        <button
          className="text-primary hover:underline"
          onClick={() => setMode("register")}
        >
          Join the cohort
        </button>
      </p>
    </main>
  );
}
