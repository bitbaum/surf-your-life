"use client";

import { createContext, useContext } from "react";
import type { AiConsentState } from "@/lib/domain/ai-consent";

/**
 * The signed-in client's AI consent, read once by the portal layout so client
 * components (the check-in form) can say that AI is off. Display only — every
 * AI route checks consent again on the server.
 */
const AiConsentContext = createContext<AiConsentState>("unasked");

export function AiConsentProvider({
  state,
  children,
}: {
  state: AiConsentState;
  children: React.ReactNode;
}) {
  return <AiConsentContext.Provider value={state}>{children}</AiConsentContext.Provider>;
}

export function useAiConsent(): AiConsentState {
  return useContext(AiConsentContext);
}
