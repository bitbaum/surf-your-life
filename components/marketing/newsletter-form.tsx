"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CheckCircle } from "lucide-react";

export function NewsletterForm() {
  const t = useTranslations("landing.newsletter");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(false);
    const res = await fetch("/api/leads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, source: "newsletter" }),
    });
    setLoading(false);
    if (res.ok) {
      setSuccess(true);
    } else {
      setError(true);
    }
  }

  if (success) {
    return (
      <div className="flex items-center justify-center gap-2 text-brand font-medium">
        <CheckCircle className="w-5 h-5" />
        {t("success")}
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
      <div className="flex-1">
        <Input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={t("placeholder")}
          aria-label={t("placeholder")}
        />
      </div>
      <Button type="submit" disabled={loading}>
        {loading ? t("loading") : t("submit")}
      </Button>
      {error && <p className="text-xs text-error-vivid mt-1 w-full">{t("error")}</p>}
    </form>
  );
}
