import Link from "next/link";
import { getDictionary } from "@landing/kit";

export default function NotFound() {
  const dict = getDictionary("en");

  return (
    <main className="site-container flex flex-1 flex-col items-center justify-center gap-5 py-32 text-center">
      <p className="text-sm font-semibold uppercase tracking-wider text-muted">{dict.notFound.code}</p>
      <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">{dict.notFound.heading}</h1>
      <p className="max-w-md text-muted">{dict.notFound.body}</p>
      <Link
        href="/"
        className="mt-2 rounded-pill bg-accent px-6 py-3 text-sm font-semibold text-accent-fg"
      >
        {dict.notFound.goHome}
      </Link>
    </main>
  );
}
