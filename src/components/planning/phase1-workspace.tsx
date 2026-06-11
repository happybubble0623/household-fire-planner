"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { calculatePhase1Fire } from "@/lib/phase1/fire";
import { defaultPhase1Workbook } from "@/lib/phase1/default-workbook";
import { normalizePhase1Workbook } from "@/lib/phase1/workbook";
import { summarizePhase1Portfolio } from "@/lib/phase1/portfolio";
import { ensurePhase1Workbook, savePhase1Workbook } from "@/lib/storage/phase1-store";
import type { Phase1Workbook } from "@/types/phase1";
import { PathToFirePanel } from "@/components/planning/path-to-fire-panel";
import { FireStrategyPanel } from "@/components/planning/fire-strategy-panel";
import { PortfolioPanel } from "@/components/planning/portfolio-panel";

type Phase1WorkspaceProps = {
  activeTab: "fire" | "portfolio";
  fireView?: "home" | "withdrawal" | "income" | "principal";
};

export type Phase1PanelProps = {
  workbook: Phase1Workbook;
  fireResult: ReturnType<typeof calculatePhase1Fire> | null;
  fireError: string | null;
  portfolioSummary: ReturnType<typeof summarizePhase1Portfolio>;
  status: string;
  onChange: React.Dispatch<React.SetStateAction<Phase1Workbook>>;
};

export function Phase1Workspace({ activeTab, fireView = "home" }: Phase1WorkspaceProps) {
  const [workbook, setWorkbook] = useState<Phase1Workbook>(defaultPhase1Workbook);
  const [ready, setReady] = useState(false);
  const [status, setStatus] = useState("Local mode. Loading saved workbook...");
  const latestWorkbookRef = useRef(workbook);
  const readyRef = useRef(ready);
  const mountedRef = useRef(true);
  const saveInFlightRef = useRef(false);
  const saveQueuedRef = useRef(false);

  const handleWorkbookChange: Phase1PanelProps["onChange"] = (nextWorkbook) => {
    setWorkbook((currentWorkbook) => {
      const updatedWorkbook = normalizePhase1Workbook(
        typeof nextWorkbook === "function" ? nextWorkbook(currentWorkbook) : nextWorkbook
      );

      latestWorkbookRef.current = updatedWorkbook;
      return updatedWorkbook;
    });
  };

  const portfolioSummary = useMemo(
    () => summarizePhase1Portfolio(workbook.portfolioItems),
    [workbook.portfolioItems]
  );

  const fireCalculation = useMemo(() => {
    try {
      return {
        fireResult: calculatePhase1Fire(workbook.fireInputs),
        fireError: null
      };
    } catch (error) {
      return {
        fireResult: null,
        fireError: error instanceof Error ? error.message : "FIRE inputs are invalid."
      };
    }
  }, [workbook.fireInputs]);

  const flushLatestWorkbook = useCallback(
    async ({ updateStatus = true }: { updateStatus?: boolean } = {}) => {
      if (saveInFlightRef.current) {
        saveQueuedRef.current = true;
        return;
      }

      saveInFlightRef.current = true;

      try {
        let shouldContinue = true;

        while (shouldContinue) {
          saveQueuedRef.current = false;
          const workbookToSave = latestWorkbookRef.current;

          if (updateStatus && mountedRef.current) {
            setStatus("Local mode. Saving...");
          }

          try {
            await savePhase1Workbook(workbookToSave);

            if (updateStatus && mountedRef.current && !saveQueuedRef.current) {
              setStatus("Local mode. Saved on this device.");
            }
          } catch {
            if (updateStatus && mountedRef.current && !saveQueuedRef.current) {
              setStatus("Local mode. Autosave failed.");
            }
          }

          shouldContinue = saveQueuedRef.current;
        }
      } finally {
        saveInFlightRef.current = false;
      }
    },
    []
  );

  useEffect(() => {
    mountedRef.current = true;

    ensurePhase1Workbook()
      .then((savedWorkbook) => {
        if (!mountedRef.current) return;
        const normalizedWorkbook = normalizePhase1Workbook(savedWorkbook);
        latestWorkbookRef.current = normalizedWorkbook;
        readyRef.current = true;
        setWorkbook(normalizedWorkbook);
        setReady(true);
        setStatus("Local mode. Autosave ready.");
      })
      .catch(() => {
        if (!mountedRef.current) return;
        readyRef.current = true;
        setReady(true);
        setStatus("Local mode. Autosave unavailable in this browser.");
      });

    return () => {
      mountedRef.current = false;

      if (readyRef.current) {
        void flushLatestWorkbook({ updateStatus: false });
      }
    };
  }, [flushLatestWorkbook]);

  useEffect(() => {
    if (!ready) return;

    const timeout = window.setTimeout(() => {
      if (!mountedRef.current) return;

      void flushLatestWorkbook();
    }, 500);

    return () => window.clearTimeout(timeout);
  }, [flushLatestWorkbook, ready, workbook]);

  const panelProps: Phase1PanelProps = {
    workbook,
    fireResult: fireCalculation.fireResult,
    fireError: fireCalculation.fireError,
    portfolioSummary,
    status,
    onChange: handleWorkbookChange
  };

  if (!ready) {
    return (
      <section className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
          <p className="text-sm font-medium text-gray-500">Household FIRE Planner</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-gray-900">
            Loading local workbook
          </h1>
          <p className="mt-4 text-sm leading-relaxed text-gray-500">{status}</p>
        </div>
      </section>
    );
  }

  return (
    <section className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {activeTab === "fire" && fireView === "home" ? <PathToFirePanel {...panelProps} /> : null}
      {activeTab === "fire" && fireView === "withdrawal" ? (
        <FireStrategyPanel {...panelProps} mode="withdrawal_rate" />
      ) : null}
      {activeTab === "fire" && fireView === "income" ? (
        <FireStrategyPanel {...panelProps} mode="income_stream" />
      ) : null}
      {activeTab === "fire" && fireView === "principal" ? (
        <FireStrategyPanel {...panelProps} mode="principal_preserving" />
      ) : null}
      {activeTab === "portfolio" ? <PortfolioPanel {...panelProps} /> : null}
    </section>
  );
}
