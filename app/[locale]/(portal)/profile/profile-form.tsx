"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { PROFILE_WIZARD_STEPS } from "@/lib/constants";
import {
  type FormState,
  toFormState,
  calcProgress,
  isStepComplete,
  buildPayload,
} from "./profile-form.helpers";
import type { Profile } from "@/lib/db/schema";
import { StepYou } from "./steps/step-you";
import { StepChallenges } from "./steps/step-challenges";
import { StepStory } from "./steps/step-story";
import { StepHealth } from "./steps/step-health";
import { StepLifestyle } from "./steps/step-lifestyle";
import { WizardProgress } from "./wizard-progress";

export function ProfileForm({
  profile,
  initialName,
}: {
  profile: Profile | null;
  initialName: string;
}) {
  const t = useTranslations("portal.profile");
  const [step, setStep] = useState(0); // 0-indexed
  const [form, setForm] = useState<FormState>(toFormState(profile, initialName));
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  const totalSteps = PROFILE_WIZARD_STEPS.length;
  const pct = calcProgress(form);

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setSaved(false);
  }

  function toggleConcern(value: string) {
    setForm((prev) => {
      const next = prev.mainConcerns.includes(value)
        ? prev.mainConcerns.filter((c) => c !== value)
        : [...prev.mainConcerns, value];
      return { ...prev, mainConcerns: next };
    });
    setSaved(false);
  }

  function updateDob(field: "dobDay" | "dobMonth" | "dobYear", value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
    setSaved(false);
  }

  async function autoSave(f: FormState) {
    try {
      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildPayload(f)),
      });
      if (res.ok) setSaved(true);
    } catch {
      // auto-save is best-effort; step navigation still proceeds
    }
  }

  async function handleNext() {
    setLoading(true);
    try {
      await autoSave(form);
      setStep((s) => s + 1);
    } finally {
      setLoading(false);
    }
  }

  async function handleBack() {
    setLoading(true);
    try {
      await autoSave(form);
      setStep((s) => s - 1);
    } finally {
      setLoading(false);
    }
  }

  async function handleFinish(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await autoSave(form);
    } finally {
      setLoading(false);
    }
  }

  const stepTitles = PROFILE_WIZARD_STEPS.map((s) => t(s.key as Parameters<typeof t>[0]));
  const stepsCompleted = PROFILE_WIZARD_STEPS.map((_, i) => isStepComplete(form, i));

  return (
    <form onSubmit={handleFinish} className="flex flex-col gap-6 pb-16">
      <WizardProgress
        step={step}
        totalSteps={totalSteps}
        pct={pct}
        saved={saved}
        stepTitles={stepTitles}
        stepsCompleted={stepsCompleted}
      />

      {/* Step title */}
      <div>
        <h2 className="text-xl font-bold text-slate-900">{stepTitles[step]}</h2>
      </div>

      {/* Active step */}
      {step === 0 && <StepYou form={form} onChange={set} updateDob={updateDob} />}
      {step === 1 && <StepChallenges form={form} onToggle={toggleConcern} />}
      {step === 2 && <StepStory form={form} onChange={set} />}
      {step === 3 && <StepHealth form={form} onChange={set} />}
      {step === 4 && <StepLifestyle form={form} onChange={set} />}

      {/* Navigation */}
      <div className="flex items-center justify-between pt-2">
        <Button
          type="button"
          variant="outline"
          onClick={handleBack}
          disabled={loading || step === 0}
        >
          ← {t("back")}
        </Button>
        {step < totalSteps - 1 ? (
          <Button type="button" onClick={handleNext} disabled={loading}>
            {loading ? t("saving") : t("next")} →
          </Button>
        ) : (
          <Button type="submit" disabled={loading}>
            {loading ? t("saving") : t("saveAndFinish")}
          </Button>
        )}
      </div>
    </form>
  );
}
