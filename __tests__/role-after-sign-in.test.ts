import { afterEach, describe, expect, it } from "vitest";
import { roleAfterSignIn } from "@/lib/auth/claims";

describe("roleAfterSignIn", () => {
  const before = process.env.ADMIN_EMAILS;
  afterEach(() => {
    process.env.ADMIN_EMAILS = before;
  });

  it("promotes a listed address at a password sign-in", () => {
    process.env.ADMIN_EMAILS = "boss@example.test";
    expect(roleAfterSignIn("credentials", "Boss@Example.test", "client")).toBe("admin");
  });

  it("never demotes: a practitioner stays a practitioner with ADMIN_EMAILS set", () => {
    process.env.ADMIN_EMAILS = "boss@example.test";
    expect(roleAfterSignIn("credentials", "pract@example.test", "practitioner")).toBe(
      "practitioner",
    );
    expect(roleAfterSignIn("credentials", "other@example.test", "admin")).toBe("admin");
  });

  it("never promotes on an OrangeCat sign-in, whose address is unverified", () => {
    process.env.ADMIN_EMAILS = "boss@example.test";
    expect(roleAfterSignIn("orangecat", "boss@example.test", "client")).toBe("client");
  });

  it("keeps the stored role when ADMIN_EMAILS is not set", () => {
    process.env.ADMIN_EMAILS = "";
    expect(roleAfterSignIn("credentials", "boss@example.test", "practitioner")).toBe(
      "practitioner",
    );
  });
});
