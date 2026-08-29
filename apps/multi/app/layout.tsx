import type { ReactNode } from "react";
import "./globals.css";

/**
 * The root layout only sets up the skeleton. The `<html>` tag and everything specific
 * to a tenant (lang, theme, metadata) lives in `app/[tenant]/layout.tsx` — because
 * that is the first place the tenant is known.
 */
export default function RootLayout({ children }: { children: ReactNode }) {
  return children;
}
