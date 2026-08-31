"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TechniqueForm } from "./technique-form";

export function TechniqueCreateButton() {
  const t = useTranslations("admin.techniques");
  const router = useRouter();
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setOpen(true)} className="flex items-center gap-2 flex-shrink-0">
        <Plus className="w-4 h-4" />
        {t("new")}
      </Button>

      {open && (
        <TechniqueForm
          onClose={() => setOpen(false)}
          onSaved={() => {
            setOpen(false);
            router.refresh();
          }}
        />
      )}
    </>
  );
}
