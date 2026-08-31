"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { DOCUMENT_UPLOAD_MAX_CONTENT, FIELD_MAX_TITLE } from "@/lib/constants";

interface Props {
  onCancel: () => void;
}

export function DocumentUploadForm({ onCancel }: Props) {
  const t = useTranslations("portal.documents");
  const router = useRouter();
  const [form, setForm] = useState({ title: "", content: "" });
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.content.trim()) return;
    setSaving(true);
    try {
      const res = await fetch("/api/portal/documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: form.title || undefined, content: form.content }),
      });
      if (!res.ok) throw new Error();
      toast.success(t("submitSuccess"));
      router.refresh();
      onCancel();
    } catch {
      toast.error(t("submitError"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mb-6 p-4 border border-slate-200 rounded-xl bg-slate-50 flex flex-col gap-4"
    >
      <p className="text-sm font-medium text-slate-700">{t("formTitle")}</p>

      <div>
        <label className="block text-xs font-medium text-slate-600 mb-1">{t("fieldTitle")}</label>
        <input
          type="text"
          value={form.title}
          onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
          maxLength={FIELD_MAX_TITLE}
          placeholder={t("fieldTitlePlaceholder")}
          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-slate-600 mb-1">{t("fieldContent")}</label>
        <textarea
          required
          value={form.content}
          onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))}
          maxLength={DOCUMENT_UPLOAD_MAX_CONTENT}
          placeholder={t("fieldContentPlaceholder")}
          rows={6}
          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white resize-none focus:outline-none focus:ring-2 focus:ring-teal-500"
        />
        <p className="text-xs text-slate-400 mt-1 text-right">
          {form.content.length} / {DOCUMENT_UPLOAD_MAX_CONTENT}
        </p>
      </div>

      <div className="flex gap-2 justify-end">
        <Button type="button" variant="ghost" size="sm" onClick={onCancel} disabled={saving}>
          {t("cancel")}
        </Button>
        <Button type="submit" size="sm" disabled={saving || !form.content.trim()}>
          {saving ? "…" : t("submit")}
        </Button>
      </div>
    </form>
  );
}
