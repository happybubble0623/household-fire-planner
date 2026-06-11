import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { useMemo, useState } from "react";
import { PortfolioPanel } from "@/components/planning/portfolio-panel";
import { defaultPhase1Workbook } from "@/lib/phase1/default-workbook";
import { summarizePhase1Portfolio } from "@/lib/phase1/portfolio";
import type { Phase1Workbook } from "@/types/phase1";

function PortfolioPanelHarness() {
  const [workbook, setWorkbook] = useState<Phase1Workbook>({
    ...defaultPhase1Workbook,
    portfolioItems: []
  });
  const portfolioSummary = useMemo(
    () => summarizePhase1Portfolio(workbook.portfolioItems),
    [workbook.portfolioItems]
  );

  return (
    <PortfolioPanel
      workbook={workbook}
      fireResult={null}
      fireError={null}
      portfolioSummary={portfolioSummary}
      status="Local mode. Test ready."
      onChange={setWorkbook}
    />
  );
}

describe("PortfolioPanel", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        Response.json({
          symbols: [
            {
              symbol: "AAPL",
              name: "Apple Inc",
              exchange: "US",
              currency: "USD",
              type: "stock"
            },
            {
              symbol: "VTI",
              name: "Vanguard Total Stock Market ETF",
              exchange: "US",
              currency: "USD",
              type: "etf"
            },
            {
              symbol: "BND",
              name: "Vanguard Total Bond Market ETF",
              exchange: "US",
              currency: "USD",
              type: "etf"
            },
            {
              symbol: "VFIAX.US",
              name: "Vanguard 500 Index Fund",
              exchange: "US",
              currency: "USD",
              type: "mutual_fund"
            },
            {
              symbol: "BTC-USD.CC",
              name: "Bitcoin USD",
              exchange: "CC",
              currency: "USD",
              type: "crypto"
            }
          ],
          warning: null
        })
      )
    );
  });

  afterEach(() => {
    localStorage.clear();
    vi.unstubAllGlobals();
  });

  it("uses one mixed market holding picker and leaves price entry to EOD refresh", async () => {
    render(<PortfolioPanelHarness />);

    const typeSelect = screen.getByLabelText("Type");
    expect(typeSelect).toHaveDisplayValue("Market Holding");
    expect(screen.queryByRole("option", { name: "Stock" })).not.toBeInTheDocument();
    expect(screen.queryByRole("option", { name: "ETF" })).not.toBeInTheDocument();
    expect(screen.queryByRole("option", { name: "Mutual Fund" })).not.toBeInTheDocument();
    expect(screen.queryByRole("option", { name: "Crypto" })).not.toBeInTheDocument();

    const holdingInput = screen.getByLabelText("Holding");
    fireEvent.change(holdingInput, { target: { value: "aap" } });

    await waitFor(() => expect(fetch).toHaveBeenCalledTimes(1));
    expect(String(vi.mocked(fetch).mock.calls[0][0])).toBe("/api/symbols?query=aap");

    fireEvent.click(await screen.findByRole("button", { name: /AAPL Apple Inc Stock/i }));
    expect(holdingInput).toHaveValue("AAPL - Apple Inc");
    expect(screen.queryByLabelText("Unit Price")).not.toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Units"), { target: { value: "3" } });
    fireEvent.click(screen.getByRole("button", { name: "Add Portfolio Row" }));

    expect(await screen.findByText("Apple Inc")).toBeInTheDocument();
    expect(screen.getByText("AAPL")).toBeInTheDocument();

    const holdingRow = screen.getByLabelText("Select Apple Inc").closest("tr");
    expect(holdingRow).not.toBeNull();
    expect(within(holdingRow!).getByText("Market Holding")).toBeInTheDocument();
    expect(within(holdingRow!).getByText("Stock")).toBeInTheDocument();
  });

  it("uses text-mode numeric portfolio inputs so wheel scrolling cannot step values", () => {
    render(<PortfolioPanelHarness />);

    const unitsInput = screen.getByLabelText("Units");
    expect(unitsInput).toHaveAttribute("type", "text");
    expect(unitsInput).toHaveAttribute("inputmode", "decimal");

    fireEvent.change(screen.getByLabelText("Type"), { target: { value: "cash" } });

    const balanceInput = screen.getByLabelText("Balance");
    expect(balanceInput).toHaveAttribute("type", "text");
    expect(balanceInput).toHaveAttribute("inputmode", "decimal");
  });

  it("explains that market holdings need units before EOD refresh can calculate value", async () => {
    render(<PortfolioPanelHarness />);

    fireEvent.change(screen.getByLabelText("Holding"), { target: { value: "aap" } });
    fireEvent.click(await screen.findByRole("button", { name: /AAPL Apple Inc Stock/i }));
    fireEvent.click(screen.getByRole("button", { name: "Add Portfolio Row" }));

    expect(
      screen.getByText("Enter units for this market holding before saving.")
    ).toBeInTheDocument();
  });

  it("adds a plan-only market holding without a public ticker and skips EOD refresh", () => {
    render(<PortfolioPanelHarness />);

    fireEvent.click(screen.getByLabelText("No public ticker / plan-only holding"));
    expect(screen.queryByLabelText("Holding")).not.toBeInTheDocument();
    expect(screen.getByLabelText("Balance")).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Name"), {
      target: { value: "Vanguard Institutional 500 Index Trust Unit A" }
    });
    fireEvent.change(screen.getByLabelText("Holding Type"), {
      target: { value: "stock" }
    });
    fireEvent.change(screen.getByLabelText("Account Type"), {
      target: { value: "Traditional 401(k)" }
    });
    fireEvent.change(screen.getByLabelText("Balance"), {
      target: { value: "12345" }
    });
    fireEvent.click(screen.getByRole("button", { name: "Add Portfolio Row" }));

    expect(
      screen.getByText("Added plan-only holding. EOD refresh will skip this row.")
    ).toBeInTheDocument();

    const holdingRow = screen
      .getByLabelText("Select Vanguard Institutional 500 Index Trust Unit A")
      .closest("tr");
    expect(holdingRow).not.toBeNull();
    expect(within(holdingRow!).getByText("Market Holding")).toBeInTheDocument();
    expect(within(holdingRow!).getByText("Stock")).toBeInTheDocument();
    expect(within(holdingRow!).getByText("Traditional 401(k)")).toBeInTheDocument();
    expect(within(holdingRow!).getByText("Tax-Deferred / Pre-tax")).toBeInTheDocument();
    expect(within(holdingRow!).getByText("$12,345")).toBeInTheDocument();

    vi.mocked(fetch).mockClear();
    fireEvent.click(screen.getByRole("button", { name: "Refresh EOD Prices" }));

    expect(fetch).not.toHaveBeenCalled();
    expect(
      screen.getByText("No market-priced rows with symbols and units to refresh.")
    ).toBeInTheDocument();
  });

  it("offers direct-balance name suggestions while allowing custom names and defaulting FIRE to yes", () => {
    render(<PortfolioPanelHarness />);

    const typeSelect = screen.getByLabelText("Type");
    fireEvent.change(typeSelect, { target: { value: "home" } });

    const nameInput = screen.getByLabelText("Name");
    expect(nameInput).toHaveAttribute("list", "portfolio-name-options-home");
    expect(
      document.querySelector('datalist#portfolio-name-options-home option[value="Primary Residence"]')
    ).not.toBeNull();
    expect(screen.getByRole("checkbox", { name: "Include in FIRE" })).toBeChecked();

    fireEvent.change(nameInput, { target: { value: "Custom Cabin" } });
    expect(nameInput).toHaveValue("Custom Cabin");

    fireEvent.change(typeSelect, { target: { value: "liability" } });
    expect(screen.getByLabelText("Name")).toHaveAttribute(
      "list",
      "portfolio-name-options-liability"
    );
    expect(
      document.querySelector('datalist#portfolio-name-options-liability option[value="Mortgage"]')
    ).not.toBeNull();
    expect(screen.getByRole("checkbox", { name: "Include in FIRE" })).toBeChecked();

    fireEvent.change(typeSelect, { target: { value: "other_asset" } });
    expect(screen.getByLabelText("Name")).toHaveAttribute(
      "list",
      "portfolio-name-options-other_asset"
    );
    expect(
      document.querySelector('datalist#portfolio-name-options-other_asset option[value="Vehicle"]')
    ).not.toBeNull();
    expect(screen.getByRole("checkbox", { name: "Include in FIRE" })).toBeChecked();
  });

  it("creates a collection and adds selected holdings without a separate allocation view", () => {
    render(<PortfolioPanelHarness />);

    addDirectBalanceHolding({
      type: "cash",
      name: "Emergency Fund",
      balance: "10000",
      accountOwner: "Joint",
      accountType: "Cash Account"
    });
    addDirectBalanceHolding({
      type: "home",
      name: "Primary Home",
      balance: "40000"
    });

    fireEvent.change(screen.getByLabelText("Collection name"), {
      target: { value: "FIRE Core" }
    });
    fireEvent.change(screen.getByLabelText("Collection purpose"), {
      target: { value: "Core retirement assets" }
    });
    fireEvent.click(screen.getByRole("button", { name: "Create Collection" }));

    fireEvent.click(screen.getByLabelText("Select Emergency Fund"));
    fireEvent.click(screen.getByLabelText("Select Primary Home"));
    fireEvent.change(screen.getByLabelText("Add selected rows to collection"), {
      target: { value: "collection-fire-core" }
    });
    fireEvent.click(screen.getByRole("button", { name: "Add Selected To Collection" }));

    expect(screen.getAllByText("FIRE Core").length).toBeGreaterThan(0);
    expect(screen.getByText("2 rows assigned")).toBeInTheDocument();
    expect(screen.queryByText(/\$50,000\.00/)).not.toBeInTheDocument();
    expect(screen.queryByText("20.0% of this collection")).not.toBeInTheDocument();
    expect(screen.queryByText("80.0% of this collection")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Remove Emergency Fund from FIRE Core" })).not.toBeInTheDocument();

    const emergencyRow = screen.getByLabelText("Select Emergency Fund").closest("tr");
    expect(emergencyRow).not.toBeNull();
    expect(within(emergencyRow!).getByText("FIRE Core")).toBeInTheDocument();
  });

  it("forces home and liability rows to household shared ownership", () => {
    render(<PortfolioPanelHarness />);

    fireEvent.click(screen.getByRole("button", { name: "User 2" }));
    fireEvent.change(screen.getByLabelText("Type"), { target: { value: "home" } });

    expect(screen.queryByRole("group", { name: "Account Owner" })).not.toBeInTheDocument();
    expect(screen.getByText("Household shared")).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Name"), { target: { value: "Primary Home" } });
    fireEvent.change(screen.getByLabelText("Balance"), { target: { value: "400000" } });
    fireEvent.click(screen.getByRole("button", { name: "Add Portfolio Row" }));

    const homeRow = screen.getByLabelText("Select Primary Home").closest("tr");
    expect(homeRow).not.toBeNull();
    expect(within(homeRow!).getByText("Household shared")).toBeInTheDocument();
    expect(within(homeRow!).getByText("Real Estate / Home")).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Type"), { target: { value: "liability" } });
    fireEvent.change(screen.getByLabelText("Name"), { target: { value: "Mortgage" } });
    fireEvent.change(screen.getByLabelText("Balance"), { target: { value: "250000" } });
    fireEvent.click(screen.getByRole("button", { name: "Add Portfolio Row" }));

    const liabilityRow = screen.getByLabelText("Select Mortgage").closest("tr");
    expect(liabilityRow).not.toBeNull();
    expect(within(liabilityRow!).getByText("Household shared")).toBeInTheDocument();
    expect(within(liabilityRow!).getByText("Liability / Loan")).toBeInTheDocument();
  });

  it("uses owner and account type presets with sticky auto-filled tax treatment", () => {
    render(<PortfolioPanelHarness />);

    expect(screen.queryByLabelText("Account Name")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "User 1" })).toHaveAttribute(
      "aria-pressed",
      "true"
    );
    expect(screen.getByRole("button", { name: "User 2" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Joint" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Child" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "User 2" }));
    fireEvent.change(screen.getByLabelText("Account Type"), {
      target: { value: "Roth IRA" }
    });
    expect(screen.getByLabelText("Tax Treatment")).toHaveDisplayValue("Roth / After-tax");

    fireEvent.change(screen.getByLabelText("Tax Treatment"), {
      target: { value: "Other" }
    });
    expect(screen.getByLabelText("Tax Treatment")).toHaveDisplayValue("Other");

    fireEvent.change(screen.getByLabelText("Type"), { target: { value: "cash" } });
    fireEvent.change(screen.getByLabelText("Name"), { target: { value: "Sweep Cash" } });
    fireEvent.change(screen.getByLabelText("Balance"), { target: { value: "2500" } });
    fireEvent.click(screen.getByRole("button", { name: "Add Portfolio Row" }));

    expect(screen.getByRole("button", { name: "User 2" })).toHaveAttribute(
      "aria-pressed",
      "true"
    );
    expect(screen.getByLabelText("Account Type")).toHaveDisplayValue("Roth IRA");
    expect(screen.getByLabelText("Tax Treatment")).toHaveDisplayValue("Other");
    expect(screen.getByLabelText("Name")).toHaveValue("");
    expect(screen.getByLabelText("Balance")).toHaveValue("");

    const holdingRow = screen.getByLabelText("Select Sweep Cash").closest("tr");
    expect(holdingRow).not.toBeNull();
    expect(within(holdingRow!).getByText("User 2")).toBeInTheDocument();
    expect(within(holdingRow!).getByText("Roth IRA")).toBeInTheDocument();
    expect(within(holdingRow!).getByText("Other")).toBeInTheDocument();
  });

  it("shows filter-controlled summary stats and allocation visuals", () => {
    function DashboardHarness() {
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
          },
          {
            id: "home",
            type: "home",
            name: "Primary Home",
            accountOwner: "User 2",
            accountType: "Real Estate / Home",
            taxBucket: "Property / Other",
            includedInFire: false,
            balance: 3000
          },
          {
            id: "mortgage",
            type: "liability",
            name: "Mortgage",
            accountOwner: "Joint",
            accountType: "Liability / Loan",
            taxBucket: "Not Applicable",
            includedInFire: true,
            balance: -200
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

    render(<DashboardHarness />);

    expect(screen.getByRole("heading", { name: "Portfolio overview" })).toBeInTheDocument();
    expect(screen.getByLabelText("Portfolio scope")).toHaveDisplayValue("All portfolio");
    expect(screen.getByLabelText("Analyze by")).toHaveDisplayValue("Account owner");
    expect(screen.getByLabelText("Allocation view")).toHaveDisplayValue(
      "Market Holding Risk Exposure"
    );
    expect(screen.getByLabelText("Portfolio allocation visual")).toBeInTheDocument();
    expect(screen.getByText("Analyzed net worth")).toBeInTheDocument();
    expect(screen.getByText("$4,300")).toBeInTheDocument();

    const selectedAllocation = screen.getByRole("region", {
      name: "Selected portfolio allocation"
    });
    expect(within(selectedAllocation).getByText("ETF")).toBeInTheDocument();
    expect(within(selectedAllocation).getByText("Cash")).toBeInTheDocument();
    expect(within(selectedAllocation).queryByText("Home")).not.toBeInTheDocument();
    expect(within(selectedAllocation).queryByText("Liabilities")).not.toBeInTheDocument();
    const lensBreakdown = screen.getByRole("region", { name: "Portfolio lens breakdown" });
    expect(within(lensBreakdown).getByText("User 1")).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Portfolio scope"), {
      target: { value: "fire" }
    });

    expect(screen.getAllByText("$1,300").length).toBeGreaterThan(0);
    expect(within(selectedAllocation).queryByText("Home")).not.toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Allocation view"), {
      target: { value: "holdings" }
    });

    expect(within(selectedAllocation).getByText("VTI")).toBeInTheDocument();
  });

  it("answers owner comparison, owner risk exposure, and tax-deferred holding allocation", () => {
    function AllocationLensHarness() {
      const workbook: Phase1Workbook = {
        ...defaultPhase1Workbook,
        portfolioItems: [
          {
            id: "vti-user-1",
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
            id: "tsla-user-1",
            type: "stock",
            name: "Tesla",
            symbol: "TSLA",
            accountOwner: "User 1",
            accountType: "Traditional 401(k)",
            taxBucket: "Tax-Deferred / Pre-tax",
            includedInFire: true,
            unitPrice: 150,
            units: 1,
            balance: 150
          },
          {
            id: "btc-user-1",
            type: "crypto",
            name: "Bitcoin",
            symbol: "BTC",
            accountOwner: "User 1",
            accountType: "Traditional 401(k)",
            taxBucket: "Tax-Deferred / Pre-tax",
            includedInFire: true,
            unitPrice: 50,
            units: 1,
            balance: 50
          },
          {
            id: "cash-user-2",
            type: "cash",
            name: "Emergency Fund",
            accountOwner: "User 2",
            accountType: "Cash Account",
            taxBucket: "Not Applicable",
            includedInFire: true,
            balance: 200
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

    render(<AllocationLensHarness />);

    expect(screen.getByLabelText("Analyze by")).toHaveDisplayValue("Account owner");
    const lensBreakdown = screen.getByRole("region", { name: "Portfolio lens breakdown" });
    expect(within(lensBreakdown).getByText("User 1")).toBeInTheDocument();
    expect(within(lensBreakdown).getByText("85.7%")).toBeInTheDocument();
    expect(within(lensBreakdown).getByText("User 2")).toBeInTheDocument();
    expect(within(lensBreakdown).getByText("14.3%")).toBeInTheDocument();

    const user1FocusChip = within(lensBreakdown).getByText("User 1").closest("button");
    expect(user1FocusChip).not.toBeNull();

    fireEvent.click(user1FocusChip!);
    expect(screen.getByLabelText("Focus")).toHaveDisplayValue("User 1");

    expect(screen.getAllByText("$1,200").length).toBeGreaterThan(0);
    const selectedAllocation = screen.getByRole("region", {
      name: "Selected portfolio allocation"
    });
    expect(within(selectedAllocation).getByText("ETF")).toBeInTheDocument();
    expect(within(selectedAllocation).getByText("Stock")).toBeInTheDocument();
    expect(within(selectedAllocation).getByText("Crypto")).toBeInTheDocument();
    expect(within(selectedAllocation).queryByText("Market Holdings")).not.toBeInTheDocument();

    fireEvent.click(user1FocusChip!);
    expect(screen.getByLabelText("Focus")).toHaveDisplayValue("All selected scope");

    fireEvent.change(screen.getByLabelText("Analyze by"), {
      target: { value: "taxTreatment" }
    });
    fireEvent.change(screen.getByLabelText("Focus"), {
      target: { value: "Tax-Deferred / Pre-tax" }
    });
    fireEvent.change(screen.getByLabelText("Allocation view"), {
      target: { value: "holdings" }
    });

    expect(screen.getAllByText("$200").length).toBeGreaterThan(0);
    expect(within(selectedAllocation).getByText("TSLA")).toBeInTheDocument();
    expect(within(selectedAllocation).getByText("75.0%")).toBeInTheDocument();
    expect(within(selectedAllocation).getByText("BTC")).toBeInTheDocument();
    expect(within(selectedAllocation).getByText("25.0%")).toBeInTheDocument();
  });

  it("keeps specific holdings allocation view in a fixed-height scroll area", () => {
    function LongAllocationHarness() {
      const portfolioItems: Phase1Workbook["portfolioItems"] = Array.from(
        { length: 18 },
        (_, index) => {
          const number = String(index + 1).padStart(2, "0");

          return {
            id: `stock-${number}`,
            type: "stock",
            name: `Company ${number}`,
            symbol: `T${number}`,
            accountOwner: "User 1",
            accountType: "Taxable Investment Account",
            taxBucket: "Taxable",
            includedInFire: true,
            unitPrice: 100,
            units: index + 1,
            balance: (index + 1) * 100
          };
        }
      );
      const workbook: Phase1Workbook = {
        ...defaultPhase1Workbook,
        portfolioItems
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

    render(<LongAllocationHarness />);

    fireEvent.change(screen.getByLabelText("Allocation view"), {
      target: { value: "holdings" }
    });

    const selectedAllocation = screen.getByRole("region", {
      name: "Selected portfolio allocation"
    });
    const allocationList = within(selectedAllocation).getByRole("list", {
      name: "Selected allocation segments"
    });

    expect(allocationList).toHaveClass("max-h-80");
    expect(allocationList).toHaveClass("overflow-auto");
    expect(within(allocationList).getByText("T18")).toBeInTheDocument();
  });

  it("shows market holding risk exposure with bond/fixed-income ETFs and cash", () => {
    function RiskExposureHarness() {
      const workbook: Phase1Workbook = {
        ...defaultPhase1Workbook,
        portfolioItems: [
          {
            id: "aapl",
            type: "stock",
            name: "Apple",
            symbol: "AAPL",
            accountOwner: "User 1",
            accountType: "Taxable Investment Account",
            taxBucket: "Taxable",
            includedInFire: true,
            unitPrice: 100,
            units: 10,
            balance: 1000
          },
          {
            id: "vti",
            type: "etf",
            name: "Vanguard Total Stock Market ETF",
            symbol: "VTI",
            accountOwner: "User 1",
            accountType: "Taxable Investment Account",
            taxBucket: "Taxable",
            includedInFire: true,
            unitPrice: 200,
            units: 5,
            balance: 1000
          },
          {
            id: "bond-etf",
            type: "etf",
            name: "Vanguard Total Bond Market ETF",
            symbol: "BND",
            accountOwner: "User 1",
            accountType: "Traditional 401(k)",
            taxBucket: "Tax-Deferred / Pre-tax",
            includedInFire: true,
            unitPrice: 75,
            units: 10,
            balance: 750
          },
          {
            id: "fund",
            type: "mutual_fund",
            name: "Vanguard 500 Index Fund",
            symbol: "VFIAX.US",
            accountOwner: "User 2",
            accountType: "Roth IRA",
            taxBucket: "Roth / After-tax",
            includedInFire: true,
            unitPrice: 500,
            units: 1,
            balance: 500
          },
          {
            id: "btc",
            type: "crypto",
            name: "Bitcoin",
            symbol: "BTC-USD.CC",
            accountOwner: "User 2",
            accountType: "Crypto Account / Wallet",
            taxBucket: "Taxable",
            includedInFire: true,
            unitPrice: 100000,
            units: 0.01,
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
            balance: 250
          },
          {
            id: "home",
            type: "home",
            name: "Primary Home",
            accountOwner: "Household shared",
            accountType: "Real Estate / Home",
            taxBucket: "Property / Other",
            includedInFire: false,
            balance: 500000
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

    render(<RiskExposureHarness />);

    const selectedAllocation = screen.getByRole("region", {
      name: "Selected portfolio allocation"
    });
    expect(within(selectedAllocation).getByText("Stock")).toBeInTheDocument();
    expect(within(selectedAllocation).getByText("ETF")).toBeInTheDocument();
    expect(within(selectedAllocation).getByText("Mutual Fund")).toBeInTheDocument();
    expect(within(selectedAllocation).getByText("Crypto")).toBeInTheDocument();
    expect(within(selectedAllocation).getByText("Bond / Fixed Income")).toBeInTheDocument();
    expect(within(selectedAllocation).getByText("Cash")).toBeInTheDocument();
    expect(within(selectedAllocation).queryByText("Home")).not.toBeInTheDocument();
  });

  it("lets users hide detailed holding table columns and persists preferences locally", () => {
    const { unmount } = render(<PortfolioPanelHarness />);

    addDirectBalanceHolding({
      type: "cash",
      name: "Emergency Fund",
      balance: "10000"
    });
    expect(screen.getByRole("button", { name: "Sort by Tax Treatment" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Table columns" }));
    const settings = screen.getByRole("region", { name: "Detailed holdings table settings" });
    fireEvent.click(within(settings).getByLabelText("Tax Treatment"));

    expect(
      screen.queryByRole("button", { name: "Sort by Tax Treatment" })
    ).not.toBeInTheDocument();
    unmount();

    render(<PortfolioPanelHarness />);
    expect(
      screen.queryByRole("button", { name: "Sort by Tax Treatment" })
    ).not.toBeInTheDocument();
  });

  it("batch deletes selected detailed holdings", () => {
    render(<PortfolioPanelHarness />);

    addDirectBalanceHolding({
      type: "cash",
      name: "Emergency Fund",
      balance: "10000"
    });
    addDirectBalanceHolding({
      type: "other_asset",
      name: "Private Investment",
      balance: "5000"
    });

    fireEvent.click(screen.getByLabelText("Select Emergency Fund"));
    fireEvent.click(screen.getByLabelText("Select Private Investment"));
    fireEvent.click(screen.getByRole("button", { name: "Delete selected" }));

    expect(screen.queryByLabelText("Select Emergency Fund")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Select Private Investment")).not.toBeInTheDocument();
    expect(screen.getByText("Deleted 2 selected row(s).")).toBeInTheDocument();
  });

  it("selects and clears all visible detailed holdings from the header checkbox", () => {
    render(<PortfolioPanelHarness />);

    addDirectBalanceHolding({
      type: "cash",
      name: "Emergency Fund",
      balance: "10000"
    });
    addDirectBalanceHolding({
      type: "other_asset",
      name: "Private Investment",
      balance: "5000"
    });

    const selectAll = screen.getByLabelText("Select all visible holdings");
    fireEvent.click(selectAll);

    expect(screen.getByLabelText("Select Emergency Fund")).toBeChecked();
    expect(screen.getByLabelText("Select Private Investment")).toBeChecked();
    expect(screen.getByText("2 selected")).toBeInTheDocument();

    fireEvent.click(selectAll);

    expect(screen.getByLabelText("Select Emergency Fund")).not.toBeChecked();
    expect(screen.getByLabelText("Select Private Investment")).not.toBeChecked();
    expect(screen.queryByText("2 selected")).not.toBeInTheDocument();
  });

  it("keeps long detailed holdings tables manageable with search, scroll, and selected-only filtering", () => {
    function LongHoldingsHarness() {
      const portfolioItems: Phase1Workbook["portfolioItems"] = Array.from(
        { length: 12 },
        (_, index) => {
          const number = String(index + 1).padStart(2, "0");

          return {
            id: `holding-${number}`,
            type: "cash",
            name: `Holding ${number}`,
            accountOwner: index % 2 === 0 ? "User 1" : "User 2",
            accountType: "Cash Account",
            taxBucket: "Not Applicable",
            includedInFire: true,
            balance: (index + 1) * 100
          };
        }
      );
      const workbook: Phase1Workbook = {
        ...defaultPhase1Workbook,
        portfolioItems
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

    render(<LongHoldingsHarness />);

    expect(screen.getByLabelText("Search detailed holdings")).toBeInTheDocument();
    expect(screen.queryByLabelText("Rows per page")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Previous holdings page" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Next holdings page" })).not.toBeInTheDocument();
    expect(getDetailedHoldingRowNames()).toHaveLength(12);
    expect(screen.getByText("Showing 12 matching rows")).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Search detailed holdings"), {
      target: { value: "Holding 12" }
    });

    expect(getDetailedHoldingRowNames()).toEqual(["Holding 12"]);
    expect(screen.getByText("Showing 1 matching row")).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Search detailed holdings"), {
      target: { value: "" }
    });
    fireEvent.click(screen.getByLabelText("Select Holding 03"));
    fireEvent.click(screen.getByLabelText("Show selected only"));

    expect(getDetailedHoldingRowNames()).toEqual(["Holding 03"]);
    expect(screen.getByText("Showing 1 matching row")).toBeInTheDocument();
  });

  it("sorts detailed holdings by column headers", () => {
    render(<PortfolioPanelHarness />);

    addDirectBalanceHolding({
      type: "cash",
      name: "Large Cash",
      balance: "10000"
    });
    addDirectBalanceHolding({
      type: "other_asset",
      name: "Small Asset",
      balance: "5000"
    });

    fireEvent.click(screen.getByRole("button", { name: "Sort by Balance" }));
    expect(getDetailedHoldingRowNames()).toEqual(["Small Asset", "Large Cash"]);

    fireEvent.click(screen.getByRole("button", { name: "Sort by Balance" }));
    expect(getDetailedHoldingRowNames()).toEqual(["Large Cash", "Small Asset"]);

    fireEvent.click(screen.getByRole("button", { name: "Sort by Name/Symbol" }));
    expect(getDetailedHoldingRowNames()).toEqual(["Large Cash", "Small Asset"]);
  });

  it("keeps provider EOD warnings as a small note instead of the main status", async () => {
    function RefreshWarningHarness() {
      const [workbook, setWorkbook] = useState<Phase1Workbook>({
        ...defaultPhase1Workbook,
        portfolioItems: [
          {
            id: "aapl",
            type: "stock",
            name: "Apple",
            symbol: "AAPL",
            taxBucket: "Taxable",
            includedInFire: true,
            units: 2,
            balance: 0
          },
          {
            id: "vti",
            type: "etf",
            name: "Vanguard Total Stock",
            symbol: "VTI",
            taxBucket: "Taxable",
            includedInFire: true,
            units: 3,
            balance: 0
          },
          {
            id: "btc",
            type: "crypto",
            name: "Bitcoin",
            symbol: "BTC-USD.CC",
            taxBucket: "Taxable",
            includedInFire: true,
            units: 0.1,
            balance: 0
          }
        ]
      });
      const portfolioSummary = useMemo(
        () => summarizePhase1Portfolio(workbook.portfolioItems),
        [workbook.portfolioItems]
      );

      return (
        <PortfolioPanel
          workbook={workbook}
          fireResult={null}
          fireError={null}
          portfolioSummary={portfolioSummary}
          status="Local mode. Test ready."
          onChange={setWorkbook}
        />
      );
    }

    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        Response.json({
          prices: [
            {
              symbol: "AAPL",
              closePrice: 200,
              priceDate: "2026-06-07",
              source: "eodhd_eod",
              warning: "Market data may be delayed, stale, estimated, or manually entered."
            },
            {
              symbol: "VTI",
              closePrice: 300,
              priceDate: "2026-06-07",
              source: "eodhd_eod",
              warning: "Market data may be delayed, stale, estimated, or manually entered."
            },
            {
              symbol: "BTC-USD.CC",
              closePrice: 100000,
              priceDate: "2026-06-07",
              source: "eodhd_eod",
              warning: "Market data may be delayed, stale, estimated, or manually entered."
            }
          ],
          warning:
            "End-of-day prices fetched. Market data may be delayed, stale, estimated, or manually entered."
        })
      )
    );

    render(<RefreshWarningHarness />);

    fireEvent.click(screen.getByRole("button", { name: "Refresh EOD Prices" }));

    expect(await screen.findByText("3 prices updated")).toBeInTheDocument();
    expect(
      screen.queryByText(
        "EOD refresh updated 3 symbol(s), with warning: End-of-day prices fetched. Market data may be delayed, stale, estimated, or manually entered."
      )
    ).not.toBeInTheDocument();
    expect(
      screen.getByTitle(
        "End-of-day prices fetched. Market data may be delayed, stale, estimated, or manually entered."
      )
    ).toBeInTheDocument();
  });

  it("rejects duplicate collection names on create without mutating collections", () => {
    render(<PortfolioPanelHarness />);

    fireEvent.change(screen.getByLabelText("Collection name"), {
      target: { value: "FIRE Core" }
    });
    fireEvent.click(screen.getByRole("button", { name: "Create Collection" }));
    fireEvent.change(screen.getByLabelText("Collection name"), {
      target: { value: " fire core " }
    });
    fireEvent.click(screen.getByRole("button", { name: "Create Collection" }));

    expect(screen.getByText("A collection with this name already exists.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Delete collection FIRE Core" })).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Delete collection fire core" })
    ).not.toBeInTheDocument();
  });

  it("deletes a collection without deleting the underlying holding", () => {
    render(<PortfolioPanelHarness />);

    addDirectBalanceHolding({
      type: "cash",
      name: "Emergency Fund",
      balance: "10000"
    });
    fireEvent.change(screen.getByLabelText("Collection name"), {
      target: { value: "Cash Reserve" }
    });
    fireEvent.click(screen.getByRole("button", { name: "Create Collection" }));
    fireEvent.click(screen.getByLabelText("Select Emergency Fund"));
    fireEvent.change(screen.getByLabelText("Add selected rows to collection"), {
      target: { value: "collection-cash-reserve" }
    });
    fireEvent.click(screen.getByRole("button", { name: "Add Selected To Collection" }));

    fireEvent.click(screen.getByRole("button", { name: "Delete collection Cash Reserve" }));

    expect(screen.getAllByText("Emergency Fund").length).toBeGreaterThan(0);
    expect(
      screen.queryByRole("button", { name: "Delete collection Cash Reserve" })
    ).not.toBeInTheDocument();
    const holdingRow = screen.getByLabelText("Select Emergency Fund").closest("tr");
    expect(holdingRow).not.toBeNull();
    expect(within(holdingRow!).getByText("No collections")).toBeInTheDocument();
  });

  it("renames a collection while membership stays visible in the holdings table", () => {
    render(<PortfolioPanelHarness />);

    addDirectBalanceHolding({
      type: "cash",
      name: "Emergency Fund",
      balance: "10000"
    });
    addDirectBalanceHolding({
      type: "other_asset",
      name: "Brokerage IOU",
      balance: "5000"
    });

    fireEvent.change(screen.getByLabelText("Collection name"), {
      target: { value: "Original Name" }
    });
    fireEvent.click(screen.getByRole("button", { name: "Create Collection" }));
    fireEvent.click(screen.getByLabelText("Select Emergency Fund"));
    fireEvent.click(screen.getByLabelText("Select Brokerage IOU"));
    fireEvent.change(screen.getByLabelText("Add selected rows to collection"), {
      target: { value: "collection-original-name" }
    });
    fireEvent.click(screen.getByRole("button", { name: "Add Selected To Collection" }));

    fireEvent.click(screen.getByRole("button", { name: "Edit collection Original Name" }));
    const editNameInput = screen.getByLabelText("Edit collection name");
    fireEvent.change(editNameInput, { target: { value: "Core Assets" } });
    fireEvent.click(screen.getByRole("button", { name: "Save Collection" }));

    expect(screen.getAllByText("Core Assets").length).toBeGreaterThan(0);
    expect(screen.queryByText("Original Name")).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Remove Brokerage IOU from Core Assets" })
    ).not.toBeInTheDocument();
    const emergencyRow = screen.getByLabelText("Select Emergency Fund").closest("tr");
    const iouRow = screen.getByLabelText("Select Brokerage IOU").closest("tr");
    expect(emergencyRow).not.toBeNull();
    expect(iouRow).not.toBeNull();
    expect(within(emergencyRow!).getByText("Core Assets")).toBeInTheDocument();
    expect(within(iouRow!).getByText("Core Assets")).toBeInTheDocument();
  });

  it("rejects duplicate collection names on rename without mutating collections", () => {
    render(<PortfolioPanelHarness />);

    fireEvent.change(screen.getByLabelText("Collection name"), {
      target: { value: "Core Assets" }
    });
    fireEvent.click(screen.getByRole("button", { name: "Create Collection" }));
    fireEvent.change(screen.getByLabelText("Collection name"), {
      target: { value: "Growth Assets" }
    });
    fireEvent.click(screen.getByRole("button", { name: "Create Collection" }));

    fireEvent.click(screen.getByRole("button", { name: "Edit collection Growth Assets" }));
    fireEvent.change(screen.getByLabelText("Edit collection name"), {
      target: { value: " core assets " }
    });
    fireEvent.click(screen.getByRole("button", { name: "Save Collection" }));

    expect(screen.getByText("A collection with this name already exists.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Delete collection Core Assets" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Delete collection Growth Assets" })).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Delete collection core assets" })
    ).not.toBeInTheDocument();
  });

  it("preserves imported collection memberships and merges collection names case-insensitively", async () => {
    render(<PortfolioPanelHarness />);

    fireEvent.change(screen.getByLabelText("Collection name"), {
      target: { value: "core" }
    });
    fireEvent.click(screen.getByRole("button", { name: "Create Collection" }));

    const csvInput = document.querySelector(
      'input[accept=".csv,text/csv"]'
    ) as HTMLInputElement;
    const file = new File(
      [
        [
          "type,name,symbol,tax_bucket,include_in_fire,unit_price,units,balance,collections",
          "etf,Vanguard Total Stock,VTI,Taxable,yes,300,10,,Core; Growth",
          "stock,Apple,AAPL,Taxable,yes,200,5,,core"
        ].join("\n")
      ],
      "portfolio.csv",
      { type: "text/csv" }
    );

    fireEvent.change(csvInput, { target: { files: [file] } });

    await waitFor(() =>
      expect(screen.getByText("Imported 2 valid row(s).")).toBeInTheDocument()
    );
    const vanguardRow = screen.getByLabelText("Select Vanguard Total Stock").closest("tr");
    const appleRow = screen.getByLabelText("Select Apple").closest("tr");
    expect(vanguardRow).not.toBeNull();
    expect(appleRow).not.toBeNull();
    expect(within(vanguardRow!).getByText("core")).toBeInTheDocument();
    expect(within(vanguardRow!).getByText("Growth")).toBeInTheDocument();
    expect(within(appleRow!).getByText("core")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Delete collection core" })).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Delete collection Core" })
    ).not.toBeInTheDocument();
  });

  it("does not refresh market rows that have a symbol but no units", async () => {
    function BalanceOnlyMarketHarness() {
      const [workbook, setWorkbook] = useState<Phase1Workbook>({
        ...defaultPhase1Workbook,
        portfolioItems: [
          {
            id: "vfiax",
            type: "mutual_fund",
            name: "Vanguard 500 Index Fund",
            symbol: "VFIAX.US",
            taxBucket: "Taxable",
            includedInFire: true,
            balance: 10000
          }
        ]
      });
      const portfolioSummary = useMemo(
        () => summarizePhase1Portfolio(workbook.portfolioItems),
        [workbook.portfolioItems]
      );

      return (
        <PortfolioPanel
          workbook={workbook}
          fireResult={null}
          fireError={null}
          portfolioSummary={portfolioSummary}
          status="Local mode. Test ready."
          onChange={setWorkbook}
        />
      );
    }

    render(<BalanceOnlyMarketHarness />);

    fireEvent.click(screen.getByRole("button", { name: "Refresh EOD Prices" }));

    expect(fetch).not.toHaveBeenCalled();
    expect(
      await screen.findByText("No market-priced rows with symbols and units to refresh.")
    ).toBeInTheDocument();
    expect(screen.getAllByText("$10,000").length).toBeGreaterThan(0);
  });
});

function addDirectBalanceHolding({
  type,
  name,
  balance,
  accountOwner = "",
  accountType = ""
}: {
  type: "cash" | "home" | "liability" | "other_asset";
  name: string;
  balance: string;
  accountOwner?: string;
  accountType?: string;
}) {
  fireEvent.change(screen.getByLabelText("Type"), { target: { value: type } });
  fireEvent.change(screen.getByLabelText("Name"), { target: { value: name } });
  fireEvent.change(screen.getByLabelText("Balance"), { target: { value: balance } });
  if (accountOwner) {
    fireEvent.click(screen.getByRole("button", { name: accountOwner }));
  }
  if (accountType) {
    fireEvent.change(screen.getByLabelText("Account Type"), { target: { value: accountType } });
  }
  fireEvent.click(screen.getByRole("button", { name: "Add Portfolio Row" }));
}

function getDetailedHoldingRowNames() {
  return screen
    .getAllByLabelText(/^Select /)
    .filter(
      (checkbox) => checkbox.getAttribute("aria-label") !== "Select all visible holdings"
    )
    .map((checkbox) => checkbox.closest("tr"))
    .filter((row): row is HTMLTableRowElement => row !== null)
    .map((row) => {
      const nameCellText = row.cells[3]?.textContent ?? "";
      return nameCellText.replace(/\s+/g, " ").trim();
    });
}
