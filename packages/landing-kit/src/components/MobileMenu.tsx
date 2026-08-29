"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef, type ReactNode } from "react";

/**
 * Closes the mobile menu when a link inside it navigates.
 *
 * The menu is a `<details>` element so it works without JavaScript, but client-side navigation
 * does not remount the header — the panel stays open over the page the visitor just asked for.
 * Watching the pathname and closing the element is the enhancement on top: it changes nothing
 * about how the menu opens, so the no-JS behaviour is untouched.
 */
export function MobileMenu({ className, children }: { className?: string; children: ReactNode }) {
  const details = useRef<HTMLDetailsElement>(null);
  const pathname = usePathname();

  useEffect(() => {
    const element = details.current;
    if (element?.open) element.open = false;
  }, [pathname]);

  return (
    <details ref={details} className={className}>
      {children}
    </details>
  );
}
