"use client"

import { useTranslations } from "next-intl"
import { PASSWORD_MIN_LENGTH } from "@/lib/constants"

type Props = { password: string }

function computeScore(password: string): number {
  if (password.length === 0) return 0
  let score = 0
  if (password.length >= PASSWORD_MIN_LENGTH) score++
  if (/[A-Z]/.test(password)) score++
  if (/[a-z]/.test(password)) score++
  if (/[0-9]/.test(password)) score++
  if (/[^A-Za-z0-9]/.test(password)) score++
  // Max is 5 checks but we map to 0-4
  return Math.min(4, score > 0 ? score - 1 : 0)
}

const COLORS = [
  "bg-red-500",
  "bg-orange-400",
  "bg-yellow-400",
  "bg-teal-500",
] as const
const TEXT_COLORS = [
  "text-red-600",
  "text-orange-500",
  "text-yellow-600",
  "text-teal-600",
] as const

export function PasswordStrength({ password }: Props) {
  const t = useTranslations("auth.passwordStrength")
  if (password.length === 0) return null

  const score = computeScore(password)
  const labels = [t("weak"), t("fair"), t("good"), t("strong")] as const

  return (
    <div className="flex flex-col gap-1.5 mt-1">
      <div className="flex gap-1">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className={`h-1 flex-1 rounded-full transition-all duration-300 ${
              i <= score ? COLORS[score] : "bg-slate-200"
            }`}
          />
        ))}
      </div>
      <p className={`text-xs font-medium ${TEXT_COLORS[score]}`}>
        {labels[score]}
      </p>
    </div>
  )
}
