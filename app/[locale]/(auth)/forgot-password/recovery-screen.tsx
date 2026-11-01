"use client";

import type { ComponentProps } from "react";
import { RecoveryForm } from "@/components/auth/auth-forms";
import { useRouter } from "@/i18n/navigation";

type Props = Omit<ComponentProps<typeof RecoveryForm>, "onBack">;

export function RecoveryScreen(props: Props) {
  const router = useRouter();
  return <RecoveryForm {...props} onBack={() => router.push("/login")} />;
}
