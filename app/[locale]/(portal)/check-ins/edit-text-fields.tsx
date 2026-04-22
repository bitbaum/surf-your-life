"use client"

import { useTranslations } from "next-intl"
import { FIELD_MAX_JOURNAL } from "@/lib/constants"

interface Props {
  hasJournal: boolean
  journalEntry: string
  setJournalEntry: (v: string) => void
  wins: string
  setWins: (v: string) => void
  challenges: string
  setChallenges: (v: string) => void
  notes: string
  setNotes: (v: string) => void
}

export function EditTextFields({
  hasJournal, journalEntry, setJournalEntry,
  wins, setWins, challenges, setChallenges, notes, setNotes,
}: Props) {
  const t = useTranslations("portal.checkIns")

  if (hasJournal) {
    return (
      <div>
        <label className="text-xs font-medium text-slate-500 uppercase tracking-wide block mb-1.5">
          {t("editJournalLabel")} <span className="text-slate-400 font-normal normal-case">{t("editOptional")}</span>
        </label>
        <textarea
          value={journalEntry}
          onChange={(e) => setJournalEntry(e.target.value)}
          rows={4}
          maxLength={FIELD_MAX_JOURNAL}
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-teal-500"
        />
      </div>
    )
  }

  return (
    <>
      <div>
        <label className="text-xs font-medium text-slate-500 uppercase tracking-wide block mb-1.5">
          {t("editWinsLabel")} <span className="text-slate-400 font-normal normal-case">{t("editOptional")}</span>
        </label>
        <textarea
          value={wins}
          onChange={(e) => setWins(e.target.value)}
          rows={2}
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-teal-500"
        />
      </div>
      <div>
        <label className="text-xs font-medium text-slate-500 uppercase tracking-wide block mb-1.5">
          {t("editChallengesLabel")} <span className="text-slate-400 font-normal normal-case">{t("editOptional")}</span>
        </label>
        <textarea
          value={challenges}
          onChange={(e) => setChallenges(e.target.value)}
          rows={2}
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-teal-500"
        />
      </div>
      <div>
        <label className="text-xs font-medium text-slate-500 uppercase tracking-wide block mb-1.5">
          {t("editNotesLabel")} <span className="text-slate-400 font-normal normal-case">{t("editOptional")}</span>
        </label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-teal-500"
        />
      </div>
    </>
  )
}
