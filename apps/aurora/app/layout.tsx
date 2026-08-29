import type { ReactNode } from "react";
import "./globals.css";

/**
 * The `<html>` element depends on the locale, so the real layout lives one segment deeper.
 */
export default function RootLayout({ children }: { children: ReactNode }) {
  return children;
}
