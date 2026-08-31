"use client";

import { useState } from "react";
import { useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { Program } from "@/lib/db/schema";
import type { ProgramPhase } from "@/lib/domain/program";
import { ProgramViewCard } from "./program-view-card";
import { ProgramBasicFields } from "./program-basic-fields";
import { ProgramProgramPhaseEditor } from "./program-phase-editor";

interface Props {
  program: Program;
}

export function EditProgramForm({ program }: Props) {
  const t = useTranslations("admin.programs");
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const initialProgramPhases = Array.isArray(program.phaseConfig)
    ? (program.phaseConfig as ProgramPhase[]).sort((a, b) => a.week - b.week)
    : [];

  const [form, setForm] = useState({
    title: program.title,
    description: program.description ?? "",
    durationWeeks: program.durationWeeks ? String(program.durationWeeks) : "",
    targetConcern: program.targetConcern ?? "",
    isTemplate: program.isTemplate,
  });
  const [phases, setProgramPhases] = useState<ProgramPhase[]>(initialProgramPhases);

  function set(field: string, value: string | boolean) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function addProgramPhase() {
    const nextWeek = phases.length > 0 ? Math.max(...phases.map((p) => p.week)) + 1 : 1;
    setProgramPhases((prev) => [...prev, { week: nextWeek, title: "", guidance: "" }]);
  }

  function updateProgramPhase(index: number, field: keyof ProgramPhase, value: string | number) {
    setProgramPhases((prev) => prev.map((p, i) => (i === index ? { ...p, [field]: value } : p)));
  }

  function removeProgramPhase(index: number) {
    setProgramPhases((prev) => prev.filter((_, i) => i !== index));
  }

  function handleCancel() {
    setForm({
      title: program.title,
      description: program.description ?? "",
      durationWeeks: program.durationWeeks ? String(program.durationWeeks) : "",
      targetConcern: program.targetConcern ?? "",
      isTemplate: program.isTemplate,
    });
    setProgramPhases(initialProgramPhases);
    setError("");
    setEditing(false);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");

    try {
      const res = await fetch(`/api/admin/programs/${program.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title.trim(),
          description: form.description.trim() || undefined,
          durationWeeks: form.durationWeeks ? parseInt(form.durationWeeks) : null,
          targetConcern: form.targetConcern || null,
          isTemplate: form.isTemplate,
          phaseConfig: phases.length > 0 ? phases : null,
        }),
      });
      const data = await res.json();
      if (!data.success) {
        setError(data.error ?? t("saveError"));
        return;
      }
      setEditing(false);
      router.refresh();
    } catch {
      setError(t("saveError"));
    } finally {
      setSaving(false);
    }
  }

  if (!editing) {
    return (
      <ProgramViewCard
        program={program}
        phases={initialProgramPhases}
        onEdit={() => setEditing(true)}
      />
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("editTitle")}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSave} className="flex flex-col gap-5">
          <ProgramBasicFields form={form} onChange={set} />
          <ProgramProgramPhaseEditor
            phases={phases}
            onAdd={addProgramPhase}
            onUpdate={updateProgramPhase}
            onRemove={removeProgramPhase}
          />

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex items-center gap-3 pt-2">
            <Button type="submit" disabled={saving || !form.title.trim()}>
              {saving ? t("editSaving") : t("editSave")}
            </Button>
            <Button type="button" variant="outline" onClick={handleCancel}>
              {t("cancel")}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
