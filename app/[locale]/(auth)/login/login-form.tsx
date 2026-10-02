"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { useTranslations } from "next-intl";
import { useRouter, Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { GoogleButton } from "@/components/auth/google-button";
import { OrangecatButton } from "@/components/auth/orangecat-button";
import { OtherWaysDisclosure } from "@/components/auth/other-ways-disclosure";

/** Auth.js redirects here with ?error=<type> when an OAuth sign-in fails. */
function OAuthError() {
  const t = useTranslations("auth.login");
  const error = useSearchParams().get("error");
  if (!error || error === "CredentialsSignin") return null;
  return (
    <p role="alert" className="text-sm text-error">
      {error === "OAuthAccountNotLinked" ? t("errorAccountExists") : t("errorOAuth")}
    </p>
  );
}

export function LoginForm({
  orangecatEnabled,
  googleEnabled,
}: {
  orangecatEnabled: boolean;
  googleEnabled: boolean;
}) {
  const t = useTranslations("auth.login");
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await signIn("credentials", { email, password, redirect: false });
    if (res?.error) {
      setError(t("errorInvalid"));
      setLoading(false);
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("title")}</CardTitle>
        <CardDescription>{t("subtitle")}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {orangecatEnabled && <OrangecatButton label={t("orangecat")} hint={t("orangecatHint")} />}
        <Suspense>
          <OAuthError />
        </Suspense>

        <OtherWaysDisclosure summary={t("otherWays")} defaultOpen={!orangecatEnabled}>
          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <Input
              label={t("email")}
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
            />
            <Input
              label={t("password")}
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
            {error && <p className="text-sm text-red-600">{error}</p>}
            <div className="text-right">
              <Link href="/forgot-password" className="text-xs text-teal-600 hover:underline">
                {t("forgotPassword")}
              </Link>
            </div>
            <Button type="submit" disabled={loading} className="w-full">
              {loading ? t("loading") : t("submit")}
            </Button>
          </form>
          {googleEnabled && <GoogleButton />}
        </OtherWaysDisclosure>

        <p className="text-center text-sm text-slate-500">
          {t("noAccount")}{" "}
          <Link href="/register" className="text-teal-600 hover:underline font-medium">
            {t("getStarted")}
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
