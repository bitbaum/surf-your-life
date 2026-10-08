// Every date field in the app comes through the shared Input: a date is shown
// in words in the app's own field styling with the real input still on top;
// every other type stays the plain input it always was.
import { createElement as h } from "react";
import { renderToString } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { Input } from "@/components/ui/input";

describe("Input with a date type", () => {
  it("shows the day in words, keeps the real input and its label", () => {
    const html = renderToString(
      h(Input, {
        label: "Start",
        type: "date",
        value: "2026-10-11",
        onChange: () => {},
        required: true,
      }),
    );
    expect(html).toMatch(/Oct 11, 2026|11 Oct 2026/);
    expect(html).toMatch(/<input[^>]*type="date"/);
    expect(html).toMatch(/<input[^>]*id="start"/);
    expect(html).toMatch(/<input[^>]*required/);
    expect(html).toMatch(/<label[^>]*for="start"/);
  });

  it("puts the app's field classes on the visible box", () => {
    const html = renderToString(
      h(Input, {
        type: "datetime-local",
        value: "2026-10-11T14:30",
        onChange: () => {},
        className: "mine",
      }),
    );
    expect(html).toMatch(/<span class="wk-input [^"]*h-10[^"]*rounded-element[^"]*mine"/);
  });

  it("marks an error on the real input", () => {
    const html = renderToString(
      h(Input, { type: "date", value: "", onChange: () => {}, error: "Required" }),
    );
    expect(html).toMatch(/<input[^>]*aria-invalid="true"/);
    expect(html).toContain("Required");
  });

  it("leaves other types plain", () => {
    const html = renderToString(h(Input, { type: "text", value: "x", onChange: () => {} }));
    expect(html).not.toMatch(/wk-input/);
    expect(html).toMatch(/<input[^>]*type="text"/);
  });
});
