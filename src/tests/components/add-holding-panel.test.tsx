import { fireEvent, render, screen, within } from "@testing-library/react";
import { useMemo, useState } from "react";
import { AddHoldingPanel } from "@/components/planning/add-holding-panel";
import { defaultPhase1Workbook } from "@/lib/phase1/default-workbook";
import { summarizePhase1Portfolio } from "@/lib/phase1/portfolio";
import type { Phase1PortfolioItem, Phase1Workbook } from "@/types/phase1";

const routerPush = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: routerPush })
}));

// Renders the dedicated Add/Edit page with shared workbook state, plus a small
// debug list of items so tests can observe that a save actually updated the row.
function AddHoldingPanelHarness({ initialItems }: { initialItems: Phase1PortfolioItem[] }) {
  const [workbook, setWorkbook] = useState<Phase1Workbook>({
    ...defaultPhase1Workbook,
    portfolioItems: initialItems
  });
  const portfolioSummary = useMemo(
    () => summarizePhase1Portfolio(workbook.portfolioItems),
    [workbook.portfolioItems]
  );

  return (
    <>
      <AddHoldingPanel
        workbook={workbook}
        fireResult={null}
        fireError={null}
        portfolioSummary={portfolioSummary}
        status="Local mode. Test ready."
        onChange={setWorkbook}
      />
      <ul aria-label="debug-items">
        {workbook.portfolioItems.map((item) => (
          <li key={item.id}>
            {item.name}: {item.balance}
          </li>
        ))}
      </ul>
    </>
  );
}

const emergencyFund: Phase1PortfolioItem = {
  id: "cash-1",
  type: "cash",
  name: "Emergency Fund",
  accountOwner: "User 1",
  accountType: "Cash Account",
  taxBucket: "Not Applicable",
  includedInFire: true,
  balance: 10000
};

describe("AddHoldingPanel", () => {
  beforeEach(() => {
    routerPush.mockClear();
    // The form scrolls itself into view when an edit loads; jsdom has no layout.
    Element.prototype.scrollIntoView = vi.fn();
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => Response.json({ symbols: [], warning: null }))
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    window.history.replaceState({}, "", "/");
  });

  it("loads ?edit=<id> into the shared form and returns to the portfolio on save", async () => {
    window.history.replaceState({}, "", "/app/portfolio-lab/add?edit=cash-1");

    render(<AddHoldingPanelHarness initialItems={[{ ...emergencyFund }]} />);

    // Page + form both reflect edit mode, pre-loaded with the existing row.
    expect(await screen.findByRole("heading", { name: "Edit holding" })).toBeInTheDocument();
    expect(
      await screen.findByRole("heading", { name: "Edit portfolio row" })
    ).toBeInTheDocument();
    expect(await screen.findByDisplayValue("Emergency Fund")).toBeInTheDocument();
    expect(screen.getByLabelText("Balance")).toHaveValue("10000");

    fireEvent.change(screen.getByLabelText("Balance"), { target: { value: "12000" } });
    fireEvent.click(screen.getByRole("button", { name: "Save Row" }));

    // The existing row is updated in place (no duplicate added)...
    expect(screen.getByText("Emergency Fund: 12000")).toBeInTheDocument();
    expect(within(screen.getByLabelText("debug-items")).getAllByRole("listitem")).toHaveLength(1);
    // ...and the user is sent back to the portfolio.
    expect(routerPush).toHaveBeenCalledWith("/app/portfolio-lab");
  });

  it("adds a new holding (no edit param) without navigating away", () => {
    window.history.replaceState({}, "", "/app/portfolio-lab/add");

    render(<AddHoldingPanelHarness initialItems={[]} />);

    expect(screen.getByRole("heading", { name: "Add holdings" })).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Type"), { target: { value: "cash" } });
    fireEvent.change(screen.getByLabelText("Name"), { target: { value: "Brokerage Cash" } });
    fireEvent.change(screen.getByLabelText("Balance"), { target: { value: "2500" } });
    fireEvent.click(screen.getByRole("button", { name: "Add Portfolio Row" }));

    expect(screen.getByText("Brokerage Cash: 2500")).toBeInTheDocument();
    expect(screen.getByText(/Added Brokerage Cash\./)).toBeInTheDocument();
    expect(routerPush).not.toHaveBeenCalled();
  });
});
