"use client";

/**
 * AiFormBar — the one control for AI form assistance.
 *
 * Generic on purpose: it knows nothing about check-ins, only about a
 * `UseAiForm` store, so every form that adopts the hook gets the same
 * affordance from one implementation.
 *
 * The part that matters is the second turn. The bar stays available after a
 * fill, so "pain was more like an 8" applies to what is already in the form
 * instead of starting over. `useAiForm` infers fill vs refine from whether the
 * form is empty, so there is no mode for the person to get wrong.
 *
 * Rendering is local to this app — the package ships no markup — and uses the
 * semantic tokens from globals.css, not raw palette colours.
 */

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Sparkles, Loader2, Undo2 } from "lucide-react";
import type { UseAiForm } from "@fleet/ai-forms/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { FIELD_MAX_MEDIUM } from "@/lib/constants";

interface Props {
  form: UseAiForm;
  /** What to describe, shown while the form is still empty. */
  fillPlaceholder: string;
  /** What to change, shown once the form has content. */
  refinePlaceholder: string;
}

export function AiFormBar({ form, fillPlaceholder, refinePlaceholder }: Props) {
  const t = useTranslations("aiForm");
  const [instruction, setInstruction] = useState("");

  const isRefining = !form.isEmpty;

  async function submit() {
    const text = instruction.trim();
    if (!text || form.busy) return;
    const result = await form.ask(text);
    // Keep the text on failure so it can be edited rather than retyped.
    if (result.ok) setInstruction("");
  }

  return (
    <Card className="border-brand-dim bg-brand-subtle">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-brand" />
          <CardTitle className="text-base text-brand-darker">
            {isRefining ? t("refineTitle") : t("fillTitle")}
          </CardTitle>
        </div>
        <CardDescription className="text-brand-body">
          {isRefining ? t("refineHint") : t("fillHint")}
        </CardDescription>
      </CardHeader>

      <CardContent className="flex flex-col gap-3">
        <Textarea
          value={instruction}
          onChange={(e) => setInstruction(e.target.value)}
          placeholder={isRefining ? refinePlaceholder : fillPlaceholder}
          disabled={form.busy}
          rows={2}
          maxLength={FIELD_MAX_MEDIUM}
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
              e.preventDefault();
              void submit();
            }
          }}
        />

        {form.error && (
          <p role="alert" className="text-xs text-error">
            {form.error}
          </p>
        )}

        <div className="flex items-center gap-2">
          <Button
            type="button"
            size="sm"
            onClick={() => void submit()}
            disabled={form.busy || !instruction.trim()}
          >
            {form.busy ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Sparkles className="w-3.5 h-3.5" />
            )}
            {form.busy ? t("working") : isRefining ? t("refineSubmit") : t("fillSubmit")}
          </Button>

          {/* An AI edit that cannot be taken back is one nobody can safely try. */}
          {form.canUndo && (
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={form.undo}
              disabled={form.busy}
            >
              <Undo2 className="w-3.5 h-3.5" />
              {t("undo")}
            </Button>
          )}

          {form.changed.length > 0 && (
            <span className="ml-auto text-xs text-brand-body">
              {t("changedFields", { count: form.changed.length })}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
