import { describe, expect, it } from "vitest";
import { googleClient } from "@/lib/auth/google";

const env = (vars: Record<string, string>) => vars as unknown as NodeJS.ProcessEnv;

describe("googleClient", () => {
  // Production has no GOOGLE_* keys; a mounted provider ended every click on
  // /login?error=Configuration. No pair, no provider, no button.
  it("is absent unless both the id and the secret are set", () => {
    expect(googleClient(env({}))).toBeNull();
    expect(googleClient(env({ GOOGLE_CLIENT_ID: "id" }))).toBeNull();
    expect(googleClient(env({ GOOGLE_CLIENT_SECRET: "s" }))).toBeNull();
    expect(googleClient(env({ GOOGLE_CLIENT_ID: " ", GOOGLE_CLIENT_SECRET: "s" }))).toBeNull();
    expect(googleClient(env({ GOOGLE_CLIENT_ID: "id", GOOGLE_CLIENT_SECRET: "s" }))).toEqual({
      clientId: "id",
      clientSecret: "s",
    });
  });
});
