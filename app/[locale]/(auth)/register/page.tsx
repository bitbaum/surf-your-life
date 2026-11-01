import { connection } from "next/server";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { authLabelsFor } from "@bitbaum/accountkit/auth";
import { SignUpForm } from "@/components/auth/auth-forms";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { surfMethods } from "@/lib/auth/methods";

type Props = { params: Promise<{ locale: string }> };

/**
 * AccountKit's sign-up: an email and a password (or any other method), and
 * the new client lands on their profile to begin the program.
 */
export default async function RegisterPage({ params }: Props) {
  await connection();
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("auth.register");
  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("title")}</CardTitle>
        <CardDescription>{t("subtitle")}</CardDescription>
      </CardHeader>
      <CardContent>
        <SignUpForm
          labels={authLabelsFor(locale)}
          methods={surfMethods()}
          next={`/${locale}/profile`}
          signInPath={`/${locale}/login`}
          signUpPath={`/${locale}/register`}
          signIn={t("signIn")}
        />
      </CardContent>
    </Card>
  );
}
