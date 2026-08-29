import type { ReactNode } from "react";
import { tenantParams } from "@/lib/tenant";

export function generateStaticParams() {
  return tenantParams();
}

/**
 * Nothing renders here: the `<html>` element depends on the locale, so the real layout lives
 * one segment deeper. This file exists to pin the tenant's static params.
 */
export default function TenantLayout({ children }: { children: ReactNode }) {
  return children;
}
