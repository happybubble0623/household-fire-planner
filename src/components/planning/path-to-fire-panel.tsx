"use client";

import { FireHubStatic } from "@/components/planning/fire-hub-static";
import type { Phase1PanelProps } from "@/components/planning/phase1-workspace";
import { useIsAppMode } from "@/components/app-mode-provider";

// Thin client wrapper around the shared, server-renderable FireHubStatic. The
// hub markup now lives in FireHubStatic so the public homepage "/" can
// server-render the exact same content for SEO + instant first paint. Here we
// just supply the live app-mode flag and workbook status from the surrounding
// client workspace; the markup stays in one place so the two pages never drift.
export function PathToFirePanel({ status }: Phase1PanelProps) {
  const isAppMode = useIsAppMode();
  return <FireHubStatic isAppMode={isAppMode} status={status} />;
}
