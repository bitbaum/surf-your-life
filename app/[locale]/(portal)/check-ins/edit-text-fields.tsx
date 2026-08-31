"use client";

import { useTranslations } from "next-intl";
import { Textarea } from "@/components/ui/textarea";
import { FIELD_MAX_JOURNAL, COMPACT_LABEL_CLS } from "@/lib/constants";

interface Props {
  hasJournal: boolean;
  journalEntry: string;
  setJournalEntry: (v: string) => void;
  wins: string;
  setWins: (v: string) => void;
  challenges: string;
  setChallenges: (v: string) => void;
  notes: string;
  setNotes: (v: string) => void;
}

export function EditTextFields({
  hasJournal,
  journalEntry,
  setJournalEntry,
  wins,
  setWins,
  challenges,
  setChallenges,
  notes,
  setNotes,
}: Props) {
  const t = useTranslations("portal.checkIns");

  if (hasJournal) {
    return (
      <div>
        <label className={`${COMPACT_LABEL_CLS} block mb-1.5`}>
          {t("editJournalLabel")}{" "}
          <span className="text-slate-400 font-normal normal-case">{t("editOptional")}</span>
        </label>
        <Textarea
          value={journalEntry}
          onChange={(e) => setJournalEntry(e.target.value)}
          rows={4}
          maxLength={FIELD_MAX_JOURNAL}
        />
      </div>
    );
  }

  return (
    <>
      <div>
        <label className={`${COMPACT_LABEL_CLS} block mb-1.5`}>
          {t("editWinsLabel")}{" "}
          <span className="text-slate-400 font-normal normal-case">{t("editOptional")}</span>
        </label>
        <Textarea value={wins} onChange={(e) => setWins(e.target.value)} rows={2} />
      </div>
      <div>
        <label className={`${COMPACT_LABEL_CLS} block mb-1.5`}>
          {t("editChallengesLabel")}{" "}
          <span className="text-slate-400 font-normal normal-case">{t("editOptional")}</span>
        </label>
        <Textarea value={challenges} onChange={(e) => setChallenges(e.target.value)} rows={2} />
      </div>
      <div>
        <label className={`${COMPACT_LABEL_CLS} block mb-1.5`}>
          {t("editNotesLabel")}{" "}
          <span className="text-slate-400 font-normal normal-case">{t("editOptional")}</span>
        </label>
        <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} />
      </div>
    </>
  );
}
