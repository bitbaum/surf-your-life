import Link from "next/link";
import "./globals.css";

/**
 * Last-resort 404 for a path outside every locale. It renders under the ROOT
 * layout, which has no <html>, no locale and no intl provider — so this page
 * brings its own document and must not use next-intl (doing so threw and turned
 * every such 404 into a 500). Unknown localized paths get the translated page
 * via app/[locale]/[...rest]; unknown API paths get JSON via app/api/[...path].
 */
export default function RootNotFound() {
  return (
    <html lang="de">
      <body className="min-h-screen bg-surface flex flex-col items-center justify-center px-6 text-center">
        <h1 className="text-6xl font-bold text-ink mb-4">404</h1>
        <p className="text-xl text-ink-muted mb-10">Seite nicht gefunden · Page not found</p>
        <Link
          href="/"
          className="inline-flex items-center justify-center min-h-11 px-4 rounded-lg bg-brand text-ink-on-overlay text-sm font-medium hover:bg-brand-hover transition-colors"
        >
          Startseite · Home
        </Link>
      </body>
    </html>
  );
}
