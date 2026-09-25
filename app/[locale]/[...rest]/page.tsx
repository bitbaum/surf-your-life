import { notFound } from "next/navigation";

/**
 * An unknown path under a locale renders [locale]/not-found.tsx — inside the
 * locale layout, so it has the intl provider and the visitor's language. Without
 * this, Next falls back to the root not-found page, which has neither.
 */
export default function UnknownLocalizedPath() {
  notFound();
}
