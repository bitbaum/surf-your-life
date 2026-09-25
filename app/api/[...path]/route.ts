/**
 * Unknown /api/* paths answer a JSON 404 in the shared error shape.
 *
 * Without this catch-all an unmatched API path fell through to the ROOT
 * not-found page, outside the locale layout, which rendered next-intl without
 * its provider and answered 500 — so a typo'd endpoint read as a server fault.
 * Next matches every real route under app/api before a catch-all, so this only
 * ever sees paths that exist nowhere else.
 */
import { notFound } from "@/lib/api";

function handler() {
  return notFound();
}

export const GET = handler;
export const HEAD = handler;
export const POST = handler;
export const PUT = handler;
export const PATCH = handler;
export const DELETE = handler;
export const OPTIONS = handler;
