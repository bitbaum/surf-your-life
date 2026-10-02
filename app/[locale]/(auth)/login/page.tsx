import { connection } from "next/server";
import { isGoogleEnabled, isOrangecatEnabled } from "@/lib/auth/provider";
import { LoginForm } from "./login-form";

export default async function LoginPage() {
  // Read the box env per request, never baked in at build time.
  await connection();
  return <LoginForm orangecatEnabled={isOrangecatEnabled()} googleEnabled={isGoogleEnabled()} />;
}
