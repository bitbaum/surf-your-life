import { connection } from "next/server";
import { isGoogleEnabled, isOrangecatEnabled } from "@/lib/auth/provider";
import { RegisterPage } from "./register-form";

export default async function Page() {
  // Read the box env per request, never baked in at build time.
  await connection();
  return <RegisterPage orangecatEnabled={isOrangecatEnabled()} googleEnabled={isGoogleEnabled()} />;
}
