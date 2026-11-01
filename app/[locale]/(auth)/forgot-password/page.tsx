import { connection } from "next/server";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { authLabelsFor } from "@bitbaum/accountkit/auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "@/i18n/navigation";
import { surfMethods } from "@/lib/auth/methods";
import { RecoveryScreen } from "./recovery-screen";

type Props = { params: Promise<{ locale: string }> };

/**
 * "Forgot your password?": AccountKit's recovery form. The mailed link lands
 * on the sign-in page, which sets the new password. Every other way in is one
 * tap away.
 */
export default async function ForgotPasswordPage({ params }: Props) {
  // Recovery needs account mail, which is the box's env.
  await connection();
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("auth.forgotPassword");
  const methods = surfMethods();
  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("title")}</CardTitle>
        <CardDescription>{t("subtitle")}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {methods.passwordReset ? (
          <RecoveryScreen
            labels={authLabelsFor(locale)}
            methods={methods}
            next={`/${locale}/dashboard`}
            signInPath={`/${locale}/login`}
          />
        ) : (
          <p role="status" className="text-sm text-error">
            {t("unavailable")}
          </p>
        )}
        <p className="text-center text-sm">
          <Link href="/login" className="text-teal-600 hover:underline font-medium">
            {t("otherWays")}
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
