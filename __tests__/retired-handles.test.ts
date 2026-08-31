import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

// ─── No retired GitHub handle may appear in a file that resolves code ────────
//
// The account behind this project has been renamed twice (g-but →
// maonakamoto → catomean → bitbaum). Each rename was chased by hand and each
// time something was missed: the workflows were repointed while
// `@fleet/ai-forms` stayed pinned to `github:catomean/ai-forms` for four more
// commits. That pin is not cosmetic — GitHub serves a retired handle via a 301
// only until somebody else claims it, and `pnpm install --frozen-lockfile`
// runs in CI and on the deploy box. A reclaimed handle would put a stranger's
// tarball into the build with no diff to review.
//
// So the invariant is asserted instead of remembered: the files that pull code
// or select a workflow must name the CURRENT owner. The next rename fails here
// rather than in production.

const CURRENT_OWNER = "bitbaum";
const RETIRED_OWNERS = ["g-but", "maonakamoto", "catomean"];

// .mailmap is deliberately excluded: mapping retired identities to the current
// one is exactly what that file is for.
const SCANNED = [
  "package.json",
  "pnpm-lock.yaml",
  "pnpm-workspace.yaml",
  ...readdirSync(join(process.cwd(), ".github", "workflows"))
    .filter((f) => f.endsWith(".yml") || f.endsWith(".yaml"))
    .map((f) => join(".github", "workflows", f)),
];

describe("retired GitHub handles", () => {
  it("scans the files that actually resolve code", () => {
    // A path typo would make every assertion below vacuously true.
    expect(SCANNED.length).toBeGreaterThan(4);
    expect(SCANNED.some((f) => f.startsWith(".github/workflows"))).toBe(true);
  });

  it.each(SCANNED)("%s names no retired owner", (file) => {
    const contents = readFileSync(join(process.cwd(), file), "utf8");
    const found = RETIRED_OWNERS.filter((owner) => contents.includes(owner));
    expect(found, `${file} still references retired handle(s): ${found.join(", ")}`).toEqual([]);
  });

  it("still pins the shared dependency at the current owner", () => {
    // Guards against the opposite failure: dropping the dependency entirely,
    // or renaming it to something that resolves nowhere, would pass the scan.
    const pkg = JSON.parse(readFileSync(join(process.cwd(), "package.json"), "utf8"));
    expect(pkg.dependencies["@fleet/ai-forms"]).toContain(`github:${CURRENT_OWNER}/`);
  });
});
