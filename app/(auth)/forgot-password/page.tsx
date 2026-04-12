import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"

export default function ForgotPasswordPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Password reset</CardTitle>
        <CardDescription>This feature isn&apos;t available yet</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <p className="text-sm text-slate-600">
          Automated password reset is coming soon. In the meantime, please contact us directly and we&apos;ll sort it out.
        </p>
        <Link href="/login">
          <Button variant="outline" className="w-full">Back to sign in</Button>
        </Link>
      </CardContent>
    </Card>
  )
}
