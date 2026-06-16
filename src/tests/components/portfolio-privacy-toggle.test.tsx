import { fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { PortfolioPanel } from "@/components/planning/portfolio-panel";
import { defaultPhase1Workbook } from "@/lib/phase1/default-workbook";
import { summarizePhase1Portfolio } from "@/lib/phase1/portfolio";
import type { Phase1Workbook } from "@/types/phase1";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() })
}));

function PrivacyHarness() {
  const workbook: Phase1Workbook = {
    ...defaultPhase1Workbook,
    portfolioItems: [
      {
        id: "vti",
        type: "etf",
        name: "Vanguard Total Stock",
        symbol: "VTI",
        accountOwner: "User 1",
        accountType: "Taxable Investment Account",
        taxBucket: "Taxable",
        includedInFire: true,
        unitPrice: 100,
        units: 10,
        balance: 1000
      },
      {
        id: "cash",
        type: "cash",
        name: "Emergency Fund",
        accountOwner: "Joint",
        accountType: "Cash Account",
        taxBucket: "Not Applicable",
        includedInFire: true,
        balance: 500
      }
    ]
  };
  const portfolioSummary = summarizePhase1Portfolio(workbook.portfolioItems);

  return (
    <PortfolioPanel
      workbook={workbook}
      fireResult={null}
      fireError={null}
      portfolioSummary={portfolioSummary}
      status="Local mode. Test ready."
      onChange={() => undefined}
    />
  );
}

describe("PortfolioPanel Hide values toggle", () => {
  afterEach(() => {
    localStorage.clear();
  });

  it("defaults to OFF with all dollar amounts shown", () => {
    render(<PrivacyHarness />);

    expect(screen.getByRole("button", { name: "Hide values" })).toBeInTheDocument();
    // Net worth + assets both $1,500 are shown; no dot mask present yet.
    expect(screen.getAllByText("$1,500").length).toBeGreaterThan(0);
    expect(screen.queryByText("••••")).not.toBeInTheDocument();
  });

  it("masks every dollar amount but keeps percentages when ON", () => {
    render(<PrivacyHarness />);

    fireEvent.click(screen.getByRole("button", { name: "Hide values" }));

    // Currency figures (net worth, assets, table balances, lens totals) masked.
    expect(screen.queryByText("$1,500")).not.toBeInTheDocument();
    expect(screen.queryByText("$1,000")).not.toBeInTheDocument();
    expect(screen.getAllByText("••••").length).toBeGreaterThan(0);

    // Percentages stay visible (lens breakdown owner split is 66.7% / 33.3%).
    const lensBreakdown = screen.getByRole("region", { name: "Portfolio lens breakdown" });
    expect(within(lensBreakdown).getByText("66.7%")).toBeInTheDocument();
    expect(within(lensBreakdown).getByText("33.3%")).toBeInTheDocument();

    // Toggle flips back to showing values.
    fireEvent.click(screen.getByRole("button", { name: "Show values" }));
    expect(screen.getAllByText("$1,500").length).toBeGreaterThan(0);
    expect(screen.queryByText("••••")).not.toBeInTheDocument();
  });

  it("does not persist the hidden state across remounts (per-session only)", () => {
    const { unmount } = render(<PrivacyHarness />);
    fireEvent.click(screen.getByRole("button", { name: "Hide values" }));
    expect(screen.getAllByText("••••").length).toBeGreaterThan(0);
    unmount();

    // A fresh mount (stands in for a page reload) starts shown again.
    render(<PrivacyHarness />);
    expect(screen.getByRole("button", { name: "Hide values" })).toBeInTheDocument();
    expect(screen.getAllByText("$1,500").length).toBeGreaterThan(0);
    expect(screen.queryByText("••••")).not.toBeInTheDocument();
  });
});
