"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { useAiForm } from "@fleet/ai-forms/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import {
  ENERGY_SCALE,
  PEM_SEVERITY_SCALE,
  SYMPTOM_SCALE,
  FIELD_MAX_JOURNAL,
} from "@/lib/constants";
import { toast } from "sonner";
import { AiFormBar } from "@/components/ui/ai-form-bar";
import { CHECK_IN_FORM } from "@/lib/config/ai-forms";
import { MoodCard } from "./mood-card";
import { EnergyCard } from "./energy-card";
import { ActivityPemCard } from "./activity-pem-card";
import { SleepCard } from "./sleep-card";
import { SymptomsCard } from "./symptoms-card";
import { PageHeader } from "@/components/ui/page-header";

/** Symptom fields, in the order the card renders them. */
const SYMPTOM_FIELDS = [
  "symptomFatigue",
  "symptomBrainFog",
  "symptomPain",
  "symptomStress",
] as const;

/** Read a number out of the shared store, falling back to the slider default. */
const num = (value: unknown, fallback: number) => (typeof value === "number" ? value : fallback);

export default function CheckInPage() {
  const t = useTranslations("portal.checkIn");
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");

  // One store, written by both the person and the assistant — that is what lets
  // a follow-up ("actually the pain was more like an 8") revise what is already
  // here instead of starting over. It replaces the per-form useState object.
  //
  // Sliders deliberately start empty rather than at their default. The default
  // is what the control shows, not something the person said, and seeding it
  // would make the form permanently non-empty — so every instruction would be
  // treated as a refinement and the first description would never fill anything.
  const form = useAiForm({
    target: CHECK_IN_FORM.key,
    fields: CHECK_IN_FORM.fields,
    // Unanswered is not the same as "no". Starting at null keeps that
    // distinction all the way to the database.
    initialValues: { orthostaticSymptoms: null },
    onApplied: (_values, changed) => {
      // The symptoms card is collapsed until it holds something. If the
      // assistant scored a symptom, open it — otherwise it writes values into a
      // section nobody can see.
      if (SYMPTOM_FIELDS.some((field) => changed.includes(field))) {
        form.setValue("trackSymptoms", true);
      }
    },
  });

  const v = form.values;
  const activityLevel = (v.activityLevel as string) || null;
  const trackSymptoms = v.trackSymptoms === true;
  const showPem = activityLevel === "moderate" || activityLevel === "active";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const mood = String(v.mood ?? "");
    if (!mood) {
      setError(t("errorMoodRequired"));
      return;
    }
    setLoading(true);
    setError("");

    const pemFlag = v.pemFlag === true;
    const journalEntry = String(v.journalEntry ?? "").trim();

    try {
      const res = await fetch("/api/check-in", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mood,
          energyLevel: num(v.energyLevel, ENERGY_SCALE.default),
          sleepHours: typeof v.sleepHours === "number" ? v.sleepHours : null,
          sleepQuality: typeof v.sleepQuality === "number" ? v.sleepQuality : null,
          activityLevel,
          pemFlag: showPem ? pemFlag : false,
          pemSeverity: showPem && pemFlag ? num(v.pemSeverity, PEM_SEVERITY_SCALE.default) : null,
          orthostaticSymptoms:
            typeof v.orthostaticSymptoms === "boolean" ? v.orthostaticSymptoms : null,
          journalEntry: journalEntry || null,
          symptomFatigue: trackSymptoms ? num(v.symptomFatigue, SYMPTOM_SCALE.default) : null,
          symptomBrainFog: trackSymptoms ? num(v.symptomBrainFog, SYMPTOM_SCALE.default) : null,
          symptomPain: trackSymptoms ? num(v.symptomPain, SYMPTOM_SCALE.default) : null,
          stressLevel: trackSymptoms ? num(v.symptomStress, SYMPTOM_SCALE.default) : null,
        }),
      });

      if (!res.ok) {
        if (res.status === 409) {
          toast.info(t("alreadyDoneBody"));
          router.push("/dashboard");
        } else {
          setError(t("error"));
          toast.error(t("error"));
        }
        return;
      }

      toast.success(t("submitSuccess"));
      router.push("/dashboard");
      router.refresh();
    } catch {
      setError(t("error"));
      toast.error(t("error"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <PageHeader title={t("title")} description={t("subtitle")} />

      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        <AiFormBar
          form={form}
          fillPlaceholder={t("aiFillPlaceholder")}
          refinePlaceholder={t("aiRefinePlaceholder")}
        />

        <MoodCard value={String(v.mood ?? "")} onChange={(mood) => form.setValue("mood", mood)} />
        <EnergyCard
          value={num(v.energyLevel, ENERGY_SCALE.default)}
          onChange={(energy) => form.setValue("energyLevel", energy)}
        />

        <ActivityPemCard
          activityLevel={activityLevel}
          setActivityLevel={(level) => form.setValue("activityLevel", level)}
          pemFlag={v.pemFlag === true}
          setPemFlag={(flag) => form.setValue("pemFlag", flag)}
          pemSeverity={num(v.pemSeverity, PEM_SEVERITY_SCALE.default)}
          setPemSeverity={(severity) => form.setValue("pemSeverity", severity)}
          orthostaticSymptoms={
            typeof v.orthostaticSymptoms === "boolean" ? v.orthostaticSymptoms : null
          }
          setOrthostaticSymptoms={(value) => form.setValue("orthostaticSymptoms", value)}
        />

        <SleepCard
          sleep={typeof v.sleepHours === "number" ? String(v.sleepHours) : ""}
          // A number input reports "" while being cleared, and Number("") is 0 —
          // which would silently record a night of no sleep.
          setSleep={(value) => form.setValue("sleepHours", value === "" ? "" : Number(value))}
          sleepQuality={typeof v.sleepQuality === "number" ? v.sleepQuality : null}
          setSleepQuality={(quality) => form.setValue("sleepQuality", quality)}
        />

        {/* Journal */}
        <Card>
          <CardHeader>
            <CardTitle>{t("journalCard")}</CardTitle>
            <CardDescription>{t("journalDescription")}</CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea
              value={String(v.journalEntry ?? "")}
              onChange={(e) => form.setValue("journalEntry", e.target.value)}
              placeholder={t("journalPlaceholder")}
              maxLength={FIELD_MAX_JOURNAL}
              rows={4}
            />
          </CardContent>
        </Card>

        <SymptomsCard
          trackSymptoms={trackSymptoms}
          setTrackSymptoms={(track) => form.setValue("trackSymptoms", track)}
          symptoms={{
            fatigue: num(v.symptomFatigue, SYMPTOM_SCALE.default),
            brainFog: num(v.symptomBrainFog, SYMPTOM_SCALE.default),
            pain: num(v.symptomPain, SYMPTOM_SCALE.default),
            stress: num(v.symptomStress, SYMPTOM_SCALE.default),
          }}
          setSymptoms={(next) => {
            form.setValues({
              symptomFatigue: next.fatigue,
              symptomBrainFog: next.brainFog,
              symptomPain: next.pain,
              symptomStress: next.stress,
            });
          }}
        />

        {error && <p className="text-sm text-error">{error}</p>}

        <Button type="submit" disabled={loading} size="lg">
          {loading ? t("loading") : t("submit")}
        </Button>
      </form>
    </div>
  );
}
