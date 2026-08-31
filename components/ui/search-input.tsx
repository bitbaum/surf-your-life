"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useCallback, useRef } from "react";
import { Search } from "lucide-react";

interface Props {
  placeholder?: string;
  defaultValue?: string;
  queryParam?: string;
}

export function SearchInput({
  placeholder = "Search…",
  defaultValue = "",
  queryParam = "q",
}: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        const params = new URLSearchParams(searchParams.toString());
        const value = e.target.value.trim();
        if (value) {
          params.set(queryParam, value);
        } else {
          params.delete(queryParam);
        }
        params.delete("page");
        router.push(`${pathname}?${params.toString()}`);
      }, 300);
    },
    [router, pathname, searchParams, queryParam],
  );

  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-faint pointer-events-none" />
      <input
        type="search"
        defaultValue={defaultValue}
        onChange={handleChange}
        placeholder={placeholder}
        className="w-full pl-9 pr-4 py-2 text-sm rounded-element border border-border bg-surface text-ink-soft placeholder-ink-faint focus:outline-none focus:ring-2 focus:ring-brand-ring"
      />
    </div>
  );
}
