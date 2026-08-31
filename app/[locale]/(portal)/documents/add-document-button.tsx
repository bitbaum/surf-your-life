"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DocumentUploadForm } from "./document-upload-form";

export function AddDocumentButton() {
  const t = useTranslations("portal.documents");
  const [open, setOpen] = useState(false);

  if (open) {
    return <DocumentUploadForm onCancel={() => setOpen(false)} />;
  }

  return (
    <Button size="sm" onClick={() => setOpen(true)}>
      <Plus className="w-3.5 h-3.5 mr-1.5" />
      {t("addDocument")}
    </Button>
  );
}
