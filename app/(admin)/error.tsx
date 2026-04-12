"use client"

import { useEffect } from "react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function AdminError({ error, reset }: { error: Error; reset: () => void }) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="flex items-center justify-center h-full min-h-[60vh] px-6">
      <div className="text-center max-w-md">
        <h2 className="text-xl font-bold text-slate-900 mb-2">Something went wrong</h2>
        <p className="text-slate-500 mb-6">We couldn&apos;t load this page. Please try again.</p>
        <div className="flex items-center justify-center gap-3">
          <Button onClick={reset}>Try again</Button>
          <Link href="/admin/dashboard">
            <Button variant="outline">Go to dashboard</Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
