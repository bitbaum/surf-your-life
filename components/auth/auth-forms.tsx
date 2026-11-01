"use client";

import {
  AccountPanel as SharedAccountPanel,
  PasswordRecoveryForm,
  SignInForm as SharedSignInForm,
  SignUpForm as SharedSignUpForm,
  type AuthClasses,
} from "@bitbaum/accountkit/auth/react";
// Types only: the runtime half of this entry point pulls in node:crypto.
import type { AuthLabels, SignInMethods } from "@bitbaum/accountkit/auth";
import type { ComponentProps } from "react";
import { Link } from "@/i18n/navigation";
import { authClient } from "@/lib/auth/client";

const BUTTON =
  "inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-element px-4 py-2 text-center text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50";

/** AccountKit's shared forms in Surf Your Life's look (components/ui). */
export const AUTH_CLASSES: Partial<AuthClasses> = {
  stack: "flex flex-col gap-3",
  field: "flex flex-col gap-1.5",
  label: "text-sm font-medium text-ink-soft",
  input:
    "flex h-10 w-full rounded-element border border-border bg-surface px-3 py-2 text-sm placeholder:text-ink-faint focus:outline-none focus:ring-2 focus:ring-brand-ring focus:border-transparent disabled:cursor-not-allowed disabled:opacity-50",
  hint: "text-xs text-slate-500",
  notice: "rounded-element bg-surface-subtle p-3 text-sm text-ink",
  error: "text-sm text-error",
  button: `${BUTTON} bg-brand text-white hover:bg-brand-hover focus-visible:ring-brand-ring`,
  buttonQuiet: `${BUTTON} border border-border bg-surface text-ink hover:bg-surface-subtle focus-visible:ring-border-strong`,
  link: "text-teal-600 hover:underline font-medium",
  divider: "text-center text-xs text-slate-500",
  section: "flex flex-col gap-4 rounded-card border border-border bg-surface p-6",
  sectionTitle: "font-semibold text-ink",
};

type Common = {
  labels: AuthLabels;
  methods: SignInMethods;
  /** Where to land, localised (/de/dashboard). */
  next: string;
  /** This locale's sign-in page (/de/login): where failed round trips return. */
  signInPath: string;
};

export function SignInForm({
  signUp,
  ...props
}: Common & { initialError: boolean; signUp: string }) {
  return (
    <SharedSignInForm
      {...props}
      client={authClient}
      classes={AUTH_CLASSES}
      signUpLink={
        <Link href="/register" className="text-teal-600 hover:underline font-medium">
          {signUp}
        </Link>
      }
    />
  );
}

export function SignUpForm({ signIn, ...props }: Common & { signUpPath: string; signIn: string }) {
  return (
    <SharedSignUpForm
      {...props}
      client={authClient}
      classes={AUTH_CLASSES}
      signInLink={
        <Link href="/login" className="text-teal-600 hover:underline font-medium">
          {signIn}
        </Link>
      }
    />
  );
}

export function RecoveryForm(
  props: Pick<
    ComponentProps<typeof PasswordRecoveryForm>,
    "methods" | "next" | "onBack" | "labels" | "signInPath"
  >,
) {
  return <PasswordRecoveryForm {...props} client={authClient} classes={AUTH_CLASSES} />;
}

export function AccountPanel(
  props: Pick<
    ComponentProps<typeof SharedAccountPanel>,
    "user" | "linked" | "methods" | "accountPath" | "homePath" | "labels"
  >,
) {
  return <SharedAccountPanel {...props} client={authClient} classes={AUTH_CLASSES} />;
}
