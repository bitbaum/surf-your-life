import { connection } from "next/server";
import { orangecatClient } from "@bitbaum/accountkit/orangecat";
import { RegisterPage } from "./register-form";

export default async function Page() {
  // Read the box env per request, never baked in at build time.
  await connection();
  return <RegisterPage orangecatEnabled={orangecatClient() !== null} />;
}
