import { Link } from "@/i18n/navigation";
import { Waves } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center px-6 text-center">
      <div className="w-12 h-12 rounded-xl bg-teal-600 flex items-center justify-center mb-8">
        <Waves className="w-6 h-6 text-white" />
      </div>
      <h1 className="text-6xl font-bold text-slate-900 mb-4">404</h1>
      <p className="text-xl text-slate-500 mb-2">Page not found</p>
      <p className="text-slate-400 mb-10 max-w-sm">
        The page you&apos;re looking for doesn&apos;t exist or has been moved.
      </p>
      <Link
        href="/"
        className="inline-flex items-center justify-center h-10 px-4 py-2 rounded-lg bg-teal-600 text-white text-sm font-medium hover:bg-teal-700 transition-colors"
      >
        Go home
      </Link>
    </div>
  );
}
