interface NavBadgeProps {
  count: number
}

export function NavBadge({ count }: NavBadgeProps) {
  if (count <= 0) return null
  return (
    <span className="ml-auto text-xs bg-brand text-white rounded-pill px-1.5 py-0.5 min-w-[1.25rem] text-center leading-none">
      {count}
    </span>
  )
}
