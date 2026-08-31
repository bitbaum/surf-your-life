"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { Textarea } from "@/components/ui/textarea";
import { MessageSquare } from "lucide-react";
import { FIELD_MAX_TITLE, FIELD_MAX_MESSAGE } from "@/lib/constants";

interface NewThreadButtonProps {
  clientId: string;
  defaultSubject?: string;
  defaultBody?: string;
  label?: string;
  modalTitle?: string;
}

export function NewThreadButton({
  clientId,
  defaultSubject = "",
  defaultBody = "",
  label,
  modalTitle,
}: NewThreadButtonProps) {
  const router = useRouter();
  const t = useTranslations("admin.clients.newThread");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ subject: defaultSubject, body: defaultBody });
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleClose() {
    // Reset to the prefilled defaults so reopening shows them again
    setForm({ subject: defaultSubject, body: defaultBody });
    setError(null);
    setOpen(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSending(true);
    setError(null);
    try {
      const res = await fetch("/api/threads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, clientId }),
      });
      const json = await res.json();
      if (!json.success)
        throw new Error(typeof json.error === "string" ? json.error : t("failedToSend"));
      router.push(`/admin/messages/${json.data.threadId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("failedToSend"));
    } finally {
      setSending(false);
    }
  }

  return (
    <>
      <Button variant="outline" onClick={() => setOpen(true)}>
        <MessageSquare className="w-4 h-4 mr-2" />
        {label ?? t("button")}
      </Button>

      {open && (
        <Modal title={modalTitle ?? t("title")} onClose={handleClose} closeLabel={t("close")}>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <Input
              label={t("subjectLabel")}
              value={form.subject}
              onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))}
              placeholder={t("subjectPlaceholder")}
              required
              disabled={sending}
              maxLength={FIELD_MAX_TITLE}
            />

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-slate-700">{t("messageLabel")}</label>
              <Textarea
                value={form.body}
                onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))}
                placeholder={t("messagePlaceholder")}
                rows={4}
                required
                disabled={sending}
                maxLength={FIELD_MAX_MESSAGE}
              />
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}

            <div className="flex gap-2 justify-end">
              <Button type="button" variant="outline" onClick={handleClose} disabled={sending}>
                {t("cancel")}
              </Button>
              <Button type="submit" disabled={sending}>
                {sending ? t("sending") : t("send")}
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}
