"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { Pencil, Trash2 } from "lucide-react";
import type { CheckIn } from "@/lib/db/schema";
import { EditCheckInModal } from "./edit-check-in-modal";

interface Props {
  checkInId: string;
  checkIn: CheckIn;
}

export function CheckInActions({ checkInId, checkIn }: Props) {
  const t = useTranslations("portal.checkIns");
  const router = useRouter();
  const [mode, setMode] = useState<"idle" | "confirmDelete" | "edit">("idle");
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  async function handleDelete() {
    setDeleting(true);
    setError("");
    try {
      const res = await fetch(`/api/check-in/${checkInId}`, { method: "DELETE" });
      if (!res.ok) {
        setError(t("deleteError"));
        return;
      }
      router.refresh();
    } catch {
      setError(t("deleteError"));
    } finally {
      setDeleting(false);
    }
  }

  if (mode === "confirmDelete") {
    return (
      <div className="mt-3 flex items-center gap-3 flex-wrap">
        <span className="text-sm text-slate-600">{t("confirmDelete")}</span>
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="text-sm font-medium text-red-600 hover:text-red-700 disabled:opacity-50"
        >
          {deleting ? t("deleting") : t("yesDelete")}
        </button>
        <button
          onClick={() => setMode("idle")}
          className="text-sm text-slate-400 hover:text-slate-600"
        >
          {t("actionCancel")}
        </button>
        {error && <span className="text-xs text-red-500">{error}</span>}
      </div>
    );
  }

  if (mode === "edit") {
    return (
      <EditCheckInModal
        checkIn={checkIn}
        checkInId={checkInId}
        onSave={() => {
          setMode("idle");
          router.refresh();
        }}
        onCancel={() => setMode("idle")}
      />
    );
  }

  return (
    <div className="flex items-center gap-2 mt-2">
      <button
        onClick={() => setMode("edit")}
        className="flex items-center gap-1 text-xs text-slate-400 hover:text-teal-600 transition-colors"
        title={t("editAction")}
      >
        <Pencil className="w-3.5 h-3.5" />
        {t("editAction")}
      </button>
      <button
        onClick={() => setMode("confirmDelete")}
        className="flex items-center gap-1 text-xs text-slate-400 hover:text-red-500 transition-colors"
        title={t("deleteAction")}
      >
        <Trash2 className="w-3.5 h-3.5" />
        {t("deleteAction")}
      </button>
    </div>
  );
}
