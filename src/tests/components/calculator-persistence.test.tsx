import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { vi } from "vitest";
import { AppModeProvider } from "@/components/app-mode-provider";
import { PlanningToolPanel } from "@/components/planning/planning-tool-panel";
import { TaxCalculator } from "@/components/planning/tax-calculator";
import { defaultPhase1Workbook } from "@/lib/phase1/default-workbook";
import type { Phase1Workbook } from "@/types/phase1";

// Capture every workbook the calculator persistence writes, and control what the
// store hands back on hydration. vi.hoisted so the mock factories (hoisted above
// imports) can reach these.
const harness = vi.hoisted(() => ({
  writes: [] as unknown[],
  storedWorkbook: null as Phase1Workbook | null
}));

vi.mock("@/lib/storage/phase1-store", () => ({
  // The hook reads the persisted workbook on mount via ensurePhase1Workbook.
  ensurePhase1Workbook: () => Promise.resolve(harness.storedWorkbook)
}));

vi.mock("@/lib/storage/use-plan-writer", () => ({
  // The writer applies the mutation against the current stored workbook (default
  // when empty) and records the result, mirroring the real Dexie-backed writer.
  usePlanWorkbookWriter:
    () =>
    (mutate: (workbook: Phase1Workbook) => Phase1Workbook) => {
      const base = harness.storedWorkbook ?? defaultPhase1Workbook;
      const next = mutate(base);
      harness.writes.push(next);
      harness.storedWorkbook = next;
      return Promise.resolve(next);
    }
}));

beforeEach(() => {
  harness.writes = [];
  harness.storedWorkbook = null;
});

describe("calculator persistence (website + app)", () => {
  it("WEBSITE mode: hydrates from a saved snapshot and persists edits (no provider)", async () => {
    // A snapshot exists in storage; the website now restores it like the app.
    harness.storedWorkbook = {
      ...defaultPhase1Workbook,
      calculatorState: {
        tax: {
          inputs: {
            filingStatus: "single",
            w2Wages: 222_222,
            otherOrdinaryIncome: 0,
            traditionalWithdrawals: 0,
            pretaxContributions: 0,
            longTermGains: 0,
            children: 0,
            seniors65: 0,
            stateRatePercent: 0
          },
          result: {},
          capturedAt: "2026-06-15T00:00:00.000Z"
        }
      }
    };

    render(<TaxCalculator />);

    // Stored 222,222 is restored on the website too (no AppModeProvider needed).
    await waitFor(() =>
      expect(screen.getByLabelText("W-2 wages (salary)")).toHaveValue("222222")
    );

    // Editing on the website persists (debounced) just like the app.
    fireEvent.change(screen.getByLabelText("W-2 wages (salary)"), { target: { value: "133000" } });
    await waitFor(
      () => {
        const last = harness.writes.at(-1) as Phase1Workbook | undefined;
        expect(last?.calculatorState?.tax?.inputs.w2Wages).toBe(133000);
      },
      { timeout: 2000 }
    );
  });

  it("APP mode: hydrates inputs from a saved snapshot on mount", async () => {
    harness.storedWorkbook = {
      ...defaultPhase1Workbook,
      calculatorState: {
        tax: {
          inputs: {
            filingStatus: "single",
            w2Wages: 142_000,
            otherOrdinaryIncome: 0,
            traditionalWithdrawals: 0,
            pretaxContributions: 0,
            longTermGains: 0,
            children: 0,
            seniors65: 0,
            stateRatePercent: 5
          },
          result: { totalTax: 33_120 },
          capturedAt: "2026-06-15T00:00:00.000Z"
        }
      }
    };

    render(
      <AppModeProvider initialIsAppMode>
        <TaxCalculator />
      </AppModeProvider>
    );

    await waitFor(() =>
      expect(screen.getByLabelText("W-2 wages (salary)")).toHaveValue("142000")
    );
    // Restored result shows immediately (gate auto-committed) — not "Edit mode".
    expect(screen.getByText(/up to date with your inputs/i)).toBeInTheDocument();
  });

  it("APP mode: persists inputs + result after an edit (debounced)", async () => {
    render(
      <AppModeProvider initialIsAppMode>
        <PlanningToolPanel tool="mortgage" />
      </AppModeProvider>
    );

    // Let the (empty) hydration attempt settle before editing.
    await waitFor(() => expect(screen.getByLabelText("Loan amount")).toHaveValue("500000"));

    fireEvent.change(screen.getByLabelText("Loan amount"), { target: { value: "425000" } });

    await waitFor(
      () => {
        const last = harness.writes.at(-1) as Phase1Workbook | undefined;
        expect(last?.calculatorState?.mortgage?.inputs.loanAmount).toBe(425000);
      },
      { timeout: 2000 }
    );

    const saved = harness.writes.at(-1) as Phase1Workbook;
    // The result summary is captured alongside the inputs (real displayed value).
    expect(saved.calculatorState?.mortgage?.result.monthlyPayment).toBeGreaterThan(0);
  });
});
