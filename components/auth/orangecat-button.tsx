"use client";

import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";

interface OrangecatButtonProps {
  label: string;
  /** One line under the button naming the ways in, e.g. "Google, GitHub or email". */
  hint: string;
  callbackUrl?: string;
}

/** The primary way in: "Sign in with OrangeCat" (provider id "orangecat"). */
export function OrangecatButton({ label, hint, callbackUrl = "/dashboard" }: OrangecatButtonProps) {
  return (
    <div className="flex flex-col gap-2">
      <Button
        size="lg"
        className="w-full whitespace-normal px-4"
        onClick={() => signIn("orangecat", { callbackUrl })}
      >
        {label}
      </Button>
      <p className="text-center text-xs text-ink-soft">{hint}</p>
    </div>
  );
}
