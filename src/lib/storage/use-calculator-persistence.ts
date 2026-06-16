"use client";

import { useEffect, useRef, useState } from "react";
import { usePlanWorkbookWriter } from "@/lib/storage/use-plan-writer";
import { ensurePhase1Workbook } from "@/lib/storage/phase1-store";
import { applyCalculatorSnapshot } from "@/lib/phase1/plan-mappings";
import type {
  Phase1CalculatorKey,
  Phase1CalculatorResultSummary,
  Phase1CalculatorState
} from "@/types/phase1";

// How long to wait after the last input change before persisting. Coalesces a
// burst of keystrokes / toggles into a single Dexie write (+ best-effort cloud
// push when signed in).
const PERSIST_DEBOUNCE_MS = 600;

type InputsFor<K extends Phase1CalculatorKey> = NonNullable<Phase1CalculatorState[K]>["inputs"];

/**
 * Calculator persistence. Lets a calculator remember its inputs and a small
 * summary of its result so returning to the tool restores the last session —
 * saved locally (Dexie) and, when signed in, synced to the account via the
 * existing workbook sync. Runs in BOTH website and app mode.
 *
 * SSR-safe: every Dexie read/write happens inside a `useEffect`, so nothing
 * touches `window`/IndexedDB during server rendering.
 *
 * - On mount: if the workbook holds a saved snapshot for `toolKey`,
 *   `applyInputs` rehydrates the calculator's input state. `commitResult` (a
 *   calculator's Calculate-gate `recalculate`) is then fired so the restored
 *   result shows immediately instead of an "Edit mode" prompt.
 * - On change (debounced, after hydration): the current inputs + result summary
 *   are written into `calculatorState[toolKey]` through the same workbook writer
 *   the "Use in my plan" buttons use, so it persists to Dexie and rides cloud
 *   sync. The `hydratedRef` guard keeps the calculator's transient default state
 *   from clobbering a saved snapshot before hydration completes.
 */
export function useCalculatorPersistence<K extends Phase1CalculatorKey>({
  toolKey,
  inputs,
  applyInputs,
  result,
  commitResult
}: {
  toolKey: K;
  inputs: InputsFor<K>;
  applyInputs: (inputs: InputsFor<K>) => void;
  result: Phase1CalculatorResultSummary;
  commitResult?: () => void;
}): void {
  const writeWorkbook = usePlanWorkbookWriter();

  // Refs keep the latest callbacks without re-running the mount-only hydration
  // effect when they change identity each render. Kept current in an effect (not
  // during render) so they never go stale for the async hydration callback.
  const applyInputsRef = useRef(applyInputs);
  const commitResultRef = useRef(commitResult);
  useEffect(() => {
    applyInputsRef.current = applyInputs;
    commitResultRef.current = commitResult;
  });

  // Gates persistence until the initial hydration attempt has finished, so the
  // calculator's transient default state can never clobber a saved snapshot.
  const hydratedRef = useRef(false);
  // Bumped after a snapshot is applied, to drive a one-shot result commit on the
  // render that already reflects the restored inputs (so the gate isn't stale).
  const [committedTick, setCommittedTick] = useState(0);

  // Hydrate once on mount.
  useEffect(() => {
    let cancelled = false;

    void (async () => {
      try {
        const workbook = await ensurePhase1Workbook();
        const snapshot = workbook.calculatorState?.[toolKey];
        if (!cancelled && snapshot) {
          applyInputsRef.current(snapshot.inputs as InputsFor<K>);
          setCommittedTick((tick) => tick + 1);
        }
      } catch {
        // Local-first: a failed read just means we start from the calculator's
        // own defaults. Persistence below still runs once the user edits.
      } finally {
        if (!cancelled) hydratedRef.current = true;
      }
    })();

    return () => {
      cancelled = true;
    };
    // toolKey is stable per calculator; intentionally mount-once per tool.
  }, [toolKey]);

  // After a snapshot's inputs are applied, recompute the gated result so the
  // restored figure displays immediately. Runs on the render that already has
  // the rehydrated inputs, so `recalculate` commits the right values.
  useEffect(() => {
    if (committedTick === 0) return;
    commitResultRef.current?.();
  }, [committedTick]);

  // Persist on change (debounced, after hydration). Serializing the inputs +
  // result gives a stable change signal and lets us skip redundant writes of
  // identical content.
  const serialized = JSON.stringify({ inputs, result });
  const lastSerializedRef = useRef<string | null>(null);

  useEffect(() => {
    if (!hydratedRef.current) return;
    if (serialized === lastSerializedRef.current) return;

    const handle = setTimeout(() => {
      lastSerializedRef.current = serialized;
      void writeWorkbook((workbook) =>
        applyCalculatorSnapshot(workbook, toolKey, {
          inputs,
          result,
          capturedAt: new Date().toISOString()
        } as NonNullable<Phase1CalculatorState[K]>)
      );
    }, PERSIST_DEBOUNCE_MS);

    return () => clearTimeout(handle);
  }, [toolKey, serialized, inputs, result, writeWorkbook]);
}
