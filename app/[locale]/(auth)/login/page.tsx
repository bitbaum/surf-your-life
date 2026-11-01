import { connection } from "next/server";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { authLabelsFor } from "@bitbaum/accountkit/auth";
import { SignInForm } from "@/components/auth/auth-forms";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { surfMethods } from "@/lib/auth/methods";

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ error?: string }>;
};

/** AccountKit's sign-in form, with every method this deployment offers. */
export default async function LoginPage({ params, searchParams }: Props) {
  // Which methods are offered is the box's env, read per request.
  await connection();
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("auth.login");
  const { error } = await searchParams;
  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("title")}</CardTitle>
        <CardDescription>{t("subtitle")}</CardDescription>
      </CardHeader>
      <CardContent>
        <SignInForm
          labels={authLabelsFor(locale)}
          methods={surfMethods()}
          next={`/${locale}/dashboard`}
          signInPath={`/${locale}/login`}
          initialError={Boolean(error)}
          signUp={t("getStarted")}
        />
      </CardContent>
    </Card>
  );
}
