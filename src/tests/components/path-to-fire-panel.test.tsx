import { fireEvent, render, screen, within } from "@testing-library/react";
import { useMemo, useState } from "react";
import { PathToFirePanel } from "@/components/planning/path-to-fire-panel";
import { FireStrategyPanel } from "@/components/planning/fire-strategy-panel";
import { PlanningToolPanel } from "@/components/planning/planning-tool-panel";
import { defaultPhase1Workbook } from "@/lib/phase1/default-workbook";
import { calculatePhase1Fire } from "@/lib/phase1/fire";
import { summarizePhase1Portfolio } from "@/lib/phase1/portfolio";
import type { Phase1FireRuleMode, Phase1Workbook } from "@/types/phase1";

function usePhase1HarnessState(initialMode?: Phase1FireRuleMode, initialWorkbook?: Phase1Workbook) {
  const [workbook, setWorkbook] = useState<Phase1Workbook>(initialWorkbook ?? defaultPhase1Workbook);
  const displayedWorkbook = useMemo(
    () =>
      initialMode
        ? {
            ...workbook,
            fireInputs: { ...workbook.fireInputs, fireRuleMode: initialMode }
          }
        : workbook,
    [initialMode, workbook]
  );
  const portfolioSummary = useMemo(
    () => summarizePhase1Portfolio(displayedWorkbook.portfolioItems),
    [displayedWorkbook.portfolioItems]
  );
  const fireCalculation = useMemo(() => {
    try {
      return {
        fireResult: calculatePhase1Fire(displayedWorkbook.fireInputs),
        fireError: null
      };
    } catch (error) {
      return {
        fireResult: null,
        fireError: error instanceof Error ? error.message : "FIRE inputs are invalid."
      };
    }
  }, [displayedWorkbook.fireInputs]);

  return {
    workbook: displayedWorkbook,
    fireCalculation,
    portfolioSummary,
    setWorkbook
  };
}

function PathToFirePanelHarness() {
  const { workbook, fireCalculation, portfolioSummary, setWorkbook } = usePhase1HarnessState();

  return (
    <PathToFirePanel
      workbook={workbook}
      fireResult={fireCalculation.fireResult}
      fireError={fireCalculation.fireError}
      portfolioSummary={portfolioSummary}
      status="Local mode. Test ready."
      onChange={setWorkbook}
    />
  );
}

function FireStrategyPanelHarness({
  mode,
  initialWorkbook
}: {
  mode: Phase1FireRuleMode;
  initialWorkbook?: Phase1Workbook;
}) {
  const { workbook, fireCalculation, portfolioSummary, setWorkbook } = usePhase1HarnessState(
    mode,
    initialWorkbook
  );

  return (
    <FireStrategyPanel
      mode={mode}
      workbook={workbook}
      fireResult={fireCalculation.fireResult}
      fireError={fireCalculation.fireError}
      portfolioSummary={portfolioSummary}
      status="Local mode. Test ready."
      onChange={setWorkbook}
    />
  );
}

describe("PathToFirePanel", () => {
  it("presents the Aurora home hub with strategy cards, tools, and primary CTAs", () => {
    render(<PathToFirePanelHarness />);

    expect(
      screen.getByRole("heading", {
        name: /Plan your path to early retirement — together, for free/i
      })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Three paths to reach early retirement" })
    ).toBeInTheDocument();

    // Each FIRE mode is reachable (from a strategy card and from the nav
    // dropdown) — every matching link opens the right route in a new tab.
    const expectNewTabLink = (name: RegExp, href: string) => {
      const links = screen.getAllByRole("link", { name });
      const match = links.find((link) => link.getAttribute("href") === href);
      expect(match).toBeTruthy();
      expect(match).toHaveAttribute("target", "_blank");
      expect(match).toHaveAttribute("rel", "noreferrer");
    };

    // Each comparison card has a "Start this path →" link to the right route,
    // opened in a new tab. (The nav dropdown exposes the same routes too.)
    const startLinks = screen.getAllByRole("link", { name: /Start this path/i });
    const expectStartLink = (href: string) => {
      const match = startLinks.find((link) => link.getAttribute("href") === href);
      expect(match).toBeTruthy();
      expect(match).toHaveAttribute("target", "_blank");
      expect(match).toHaveAttribute("rel", "noreferrer");
    };
    expectStartLink("/app/fire-path/withdrawal-rate");
    expectStartLink("/app/fire-path/principal-preserving");
    expectStartLink("/app/fire-path/income-stream");

    // Calculators are reachable from the cards and the nav dropdown.
    expectNewTabLink(/Social Security/i, "/app/fire-path/tools/social-security");
    expectNewTabLink(/Mortgage/i, "/app/fire-path/tools/mortgage");
    expectNewTabLink(/Investment/i, "/app/fire-path/tools/investment");
    expectNewTabLink(/Healthcare/i, "/app/fire-path/tools/healthcare");

    // The hub no longer renders its own bespoke top nav — site navigation
    // (Strategies / Calculators dropdowns, About, account affordance, and the
    // mobile hamburger) now comes from the shared AppShell header, identical to
    // every other page. So the panel itself exposes no nav buttons or links.
    expect(screen.queryByRole("button", { name: /Strategies/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Calculators/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /Start planning/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "About" })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Sign in" })).not.toBeInTheDocument();

    // "Map your path" scrolls to the three-strategy section on this page.
    expect(screen.getByRole("link", { name: /Map your path/i })).toHaveAttribute(
      "href",
      "#strategies"
    );
    // The portfolio CTA routes to the portfolio page.
    expect(screen.getByRole("link", { name: /Track your whole portfolio/i })).toHaveAttribute(
      "href",
      "/app/portfolio-lab"
    );

    expect(screen.queryByLabelText("Current age")).not.toBeInTheDocument();
  });

  it("renders the three FIRE comparison cards with FIRE names, tags, plain-language ideas, three green bullets, and Start links", () => {
    render(<PathToFirePanelHarness />);

    // All three cards carry the full "FIRE" name as a heading.
    const cardSpecs: Array<{ name: string; tag: string; idea: string; href: string; bullets: string[] }> = [
      {
        name: "Portfolio Drawdown FIRE",
        tag: "The 4% rule",
        idea: "Build up your savings, then spend them down gradually.",
        href: "/app/fire-path/withdrawal-rate",
        bullets: ["Simplest, most common", "Works with index funds", "Spend savings gradually"]
      },
      {
        name: "Principal-Preserving FIRE",
        tag: "Live off income",
        idea: "Live off the income your investments produce — without touching your savings.",
        href: "/app/fire-path/principal-preserving",
        bullets: ["Never spend your savings", "Live off investment income", "Good if you've saved a lot"]
      },
      {
        name: "Income Stream FIRE",
        tag: "Income-funded",
        idea: "Cover your costs with steady income like pensions, rentals, or Social Security.",
        href: "/app/fire-path/income-stream",
        bullets: [
          "Uses pension / rental / SS income",
          "No need to sell investments",
          "Good if you have steady income"
        ]
      }
    ];

    for (const spec of cardSpecs) {
      const heading = screen.getByRole("heading", { name: spec.name });
      // The card is the heading's surrounding article-like container.
      const card = heading.closest(".paths-card") as HTMLElement;
      expect(card).toBeTruthy();
      const utils = within(card);
      expect(utils.getByText(spec.tag)).toBeInTheDocument();
      expect(utils.getByText(spec.idea)).toBeInTheDocument();
      for (const bullet of spec.bullets) {
        expect(utils.getByText(bullet)).toBeInTheDocument();
      }
      // Three bullets, all green checks (no red crosses anywhere in the card).
      expect(utils.getAllByRole("listitem")).toHaveLength(3);
      const start = utils.getByRole("link", { name: /Start this path/i });
      expect(start).toHaveAttribute("href", spec.href);
      expect(start).toHaveAttribute("target", "_blank");
      expect(start).toHaveAttribute("rel", "noreferrer");
    }

    // No red crosses (✗) — every bullet is an affirmative green check.
    expect(screen.queryByText("✗")).not.toBeInTheDocument();

    // Only the featured Portfolio Drawdown card carries the "Most popular" badge.
    const badges = screen.getAllByText(/Most popular · Start here/i);
    expect(badges).toHaveLength(1);
    const featuredHeading = screen.getByRole("heading", { name: "Portfolio Drawdown FIRE" });
    expect(featuredHeading.closest(".paths-card")).toHaveClass("featured");
  });

  it("Help me choose: Q1 'Yes' recommends Income Stream FIRE", () => {
    render(<PathToFirePanelHarness />);

    fireEvent.click(screen.getByRole("button", { name: /Help me choose/i }));
    expect(screen.getByText(/Question 1 of 2/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Yes, most of them/i }));

    const result = screen.getByRole("status");
    expect(within(result).getByText("We suggest")).toBeInTheDocument();
    expect(
      within(result).getByRole("heading", { name: "Income Stream FIRE", level: 3 })
    ).toBeInTheDocument();
    expect(
      within(result).getByRole("link", { name: /Start Income Stream FIRE/i })
    ).toHaveAttribute("href", "/app/fire-path/income-stream");
  });

  it("Help me choose: Q1 'No' then Q2 'Yes' recommends Principal-Preserving FIRE", () => {
    render(<PathToFirePanelHarness />);

    fireEvent.click(screen.getByRole("button", { name: /Help me choose/i }));
    fireEvent.click(screen.getByRole("button", { name: /No \/ not really/i }));
    expect(screen.getByText(/Question 2 of 2/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Yes, keep it intact/i }));

    expect(
      screen.getByRole("link", { name: /Start Principal-Preserving FIRE/i })
    ).toHaveAttribute("href", "/app/fire-path/principal-preserving");
  });

  it("Help me choose: Q1 'No' then Q2 'No' recommends Portfolio Drawdown FIRE, with Back and reset working", () => {
    render(<PathToFirePanelHarness />);

    fireEvent.click(screen.getByRole("button", { name: /Help me choose/i }));
    fireEvent.click(screen.getByRole("button", { name: /No \/ not really/i }));

    // Back returns to Q1.
    fireEvent.click(screen.getByRole("button", { name: /^Back$/i }));
    expect(screen.getByText(/Question 1 of 2/i)).toBeInTheDocument();

    // Walk to the drawdown result.
    fireEvent.click(screen.getByRole("button", { name: /No \/ not really/i }));
    fireEvent.click(screen.getByRole("button", { name: /No, spending it is fine/i }));

    const resultLink = screen.getByRole("link", { name: /Start Portfolio Drawdown FIRE/i });
    expect(resultLink).toHaveAttribute("href", "/app/fire-path/withdrawal-rate");
    // Gold fallback line is present.
    expect(
      screen.getByText(/Most people start with/i)
    ).toBeInTheDocument();

    // "See all three again" resets back to Q1.
    fireEvent.click(screen.getByRole("button", { name: /See all three again/i }));
    expect(screen.getByText(/Question 1 of 2/i)).toBeInTheDocument();
  });

  it("shows compact portfolio drawdown summary cards, progress, info icons, and audit table", () => {
    render(<FireStrategyPanelHarness mode="withdrawal_rate" />);

    expect(
      screen.getByRole("heading", { name: "Portfolio Drawdown FIRE" })
    ).toBeInTheDocument();
    expect(screen.getByText("Estimated FIRE age")).toBeInTheDocument();
    expect(screen.getByText("FIRE year")).toBeInTheDocument();
    expect(screen.getByText("Assets at FIRE")).toBeInTheDocument();
    expect(screen.getByText("Implied withdrawal rate")).toBeInTheDocument();
    expect(screen.queryByLabelText("Withdrawal rate")).not.toBeInTheDocument();
    expect(screen.getByLabelText("Annual retirement expenses")).toHaveValue("100,000");
    expect(
      screen.getByLabelText("Retirement expenses are inflation adjusted")
    ).toBeChecked();
    expect(screen.getByLabelText("Annual passive/guaranteed income after FIRE")).toBeInTheDocument();
    expect(
      screen.getByLabelText("Passive/guaranteed income is inflation adjusted")
    ).toBeChecked();
    expect(screen.getByText("Expense Categories (Optional)")).toBeInTheDocument();
    expect(screen.getByText("Income Sources (Optional)")).toBeInTheDocument();
    fireEvent.click(screen.getByText("Expense Categories (Optional)"));
    expect(
      screen.getByLabelText("Use expense categories instead of the simple annual expense amount")
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Expense category")).toHaveValue("housing");
    expect(
      screen.getByText(/Detailed expense categories are saved here but ignored/i)
    ).toBeInTheDocument();
    fireEvent.click(screen.getByText("Income Sources (Optional)"));
    expect(
      screen.getByLabelText("Use income sources instead of the simple passive income amount")
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Income source type")).toHaveValue("social_security");
    expect(screen.queryByLabelText("Claiming age")).not.toBeInTheDocument();
    // The Social Security estimator link no longer lives inside the income-source
    // accordion — calculator navigation moved to the always-visible main-page card.
    expect(
      screen.queryByRole("link", { name: /Estimate with Social Security calculator/i })
    ).not.toBeInTheDocument();
    expect(screen.getByRole("progressbar", { name: "Progress to FIRE" })).toBeInTheDocument();
    expect(screen.getAllByLabelText("About Implied withdrawal rate").length).toBeGreaterThan(0);
    fireEvent.click(screen.getAllByLabelText("About Implied withdrawal rate")[0]);
    expect(screen.getByRole("tooltip")).toHaveTextContent(
      /first-year portfolio draw divided by assets at FIRE/i
    );
    expect(screen.getByRole("table", { name: "Portfolio Drawdown FIRE projection" })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: /^Age$/i })).toBeInTheDocument();
    expect(screen.queryByRole("columnheader", { name: /Year/i })).not.toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: /Investment return/i })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: /Assets withdrawn/i })).toBeInTheDocument();
    expect(screen.queryByRole("columnheader", { name: /Cash flow/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("columnheader", { name: /Stage/i })).not.toBeInTheDocument();
    expect(screen.getByText("Calculation details")).toBeInTheDocument();
    expect(
      screen.getByText(/The app tests each possible FIRE age/i)
    ).toBeInTheDocument();
  });

  it("surfaces all four calculator links on the main page, outside any accordion", () => {
    render(<FireStrategyPanelHarness mode="withdrawal_rate" />);

    // The nav card is always visible — no accordion interaction needed.
    const nav = screen.getByRole("heading", { name: /Refine your estimate with these calculators/i });
    expect(nav).toBeInTheDocument();

    const tools: Array<[RegExp, string]> = [
      [/Social Security benefit calculator/i, "/app/fire-path/tools/social-security"],
      [/Retirement healthcare cost calculator/i, "/app/fire-path/tools/healthcare"],
      [/Mortgage calculator/i, "/app/fire-path/tools/mortgage"],
      [/Investment calculator/i, "/app/fire-path/tools/investment"]
    ];
    for (const [name, href] of tools) {
      const link = screen.getByRole("link", { name });
      expect(link).toHaveAttribute("href", href);
      expect(link).toHaveAttribute("target", "_blank");
      expect(link).toHaveAttribute("rel", "noreferrer");
    }

    // The old contextual links inside the accordions are gone.
    fireEvent.click(screen.getByText("Income Sources (Optional)"));
    fireEvent.click(screen.getByText("Expense Categories (Optional)"));
    expect(
      screen.queryByRole("link", { name: /Estimate with Social Security calculator/i })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: /Estimate your mortgage payment/i })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: /Project portfolio growth/i })
    ).not.toBeInTheDocument();
  });

  it("omits the Investment calculator link in Income Stream mode but keeps the other three", () => {
    render(<FireStrategyPanelHarness mode="income_stream" />);

    expect(
      screen.getByRole("heading", { name: /Refine your estimate with these calculators/i })
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: /Investment calculator/i })
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /Social Security benefit calculator/i })
    ).toHaveAttribute("href", "/app/fire-path/tools/social-security");
    expect(
      screen.getByRole("link", { name: /Retirement healthcare cost calculator/i })
    ).toHaveAttribute("href", "/app/fire-path/tools/healthcare");
    expect(
      screen.getByRole("link", { name: /Mortgage calculator/i })
    ).toHaveAttribute("href", "/app/fire-path/tools/mortgage");
  });

  it("adds optional expense categories above optional income sources and activates them as expense overrides", () => {
    render(<FireStrategyPanelHarness mode="withdrawal_rate" />);

    const expenseSummary = screen.getByText("Expense Categories (Optional)");
    const incomeSummary = screen.getByText("Income Sources (Optional)");
    expect(
      expenseSummary.compareDocumentPosition(incomeSummary) & Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy();

    fireEvent.click(expenseSummary);
    fireEvent.click(
      screen.getByLabelText("Use expense categories instead of the simple annual expense amount")
    );
    fireEvent.change(screen.getByLabelText("Annual expense amount"), {
      target: { value: "42000" }
    });
    fireEvent.change(screen.getByLabelText("Expense start age"), {
      target: { value: "60" }
    });
    fireEvent.click(screen.getByRole("button", { name: "Add Expense Category" }));

    expect(screen.getAllByText("Housing").length).toBeGreaterThan(1);
    expect(screen.getByText("$42,000")).toBeInTheDocument();
    expect(
      screen.getByText(/Detailed expense categories are active and replace/i)
    ).toBeInTheDocument();
  });

  it("shows simplified income stream summary cards, progress, info icons, and audit table", () => {
    render(<FireStrategyPanelHarness mode="income_stream" />);

    expect(
      screen.getByRole("heading", { name: "Income Stream FIRE" })
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Income Stream FIRE age")).toBeInTheDocument();
    expect(screen.queryByLabelText("Current FIRE assets")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Annual savings before FIRE")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Expected annual portfolio return")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Use Portfolio FIRE Assets" })).not.toBeInTheDocument();
    expect(screen.getByText("Income coverage ratio")).toBeInTheDocument();
    expect(screen.getByText("Annual surplus / shortfall")).toBeInTheDocument();
    expect(screen.getByText("First shortfall age")).toBeInTheDocument();
    expect(screen.getByText("Coverage status")).toBeInTheDocument();
    expect(screen.getByRole("progressbar", { name: "Income coverage progress" })).toBeInTheDocument();
    expect(screen.getByLabelText(/About income coverage ratio/i)).toBeInTheDocument();
    expect(screen.getByRole("table", { name: "Income Stream FIRE projection" })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: /^Income$/i })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: /Expenses/i })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: /Surplus \/ shortfall/i })).toBeInTheDocument();
    expect(screen.getByText("Calculation details")).toBeInTheDocument();
    expect(
      screen.getByText(/Income Stream FIRE ignores portfolio return and current assets/i)
    ).toBeInTheDocument();
  });

  it("shows principal-preserving FIRE with a separate cash-generating return field", () => {
    render(<FireStrategyPanelHarness mode="principal_preserving" />);

    expect(
      screen.getByRole("heading", { name: "Principal-Preserving FIRE" })
    ).toBeInTheDocument();
    // The FIRE age is now an output (earliest qualifying age), not a user input.
    expect(screen.queryByLabelText("Principal-Preserving FIRE age")).not.toBeInTheDocument();
    expect(
      screen.getAllByText("Earliest Principal-Preserving FIRE age").length
    ).toBeGreaterThan(0);
    expect(screen.getByLabelText("Current FIRE assets")).toBeInTheDocument();
    expect(screen.getByLabelText("Annual savings before FIRE")).toBeInTheDocument();
    // In Principal-Preserving mode the return is split into spendable yield vs unspent appreciation.
    expect(screen.queryByLabelText("Expected annual portfolio return")).not.toBeInTheDocument();
    expect(screen.getByLabelText("Price appreciation (kept)")).toBeInTheDocument();
    expect(screen.getByLabelText("Cash yield (spendable)")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Use Portfolio FIRE Assets" })).toBeInTheDocument();
    fireEvent.click(screen.getByLabelText("About Cash yield (spendable)"));
    expect(screen.getByRole("tooltip")).toHaveTextContent(/dividends and interest/i);
    expect(screen.getAllByText("Principal floor").length).toBeGreaterThan(0);
    expect(screen.getByText("Spendable income")).toBeInTheDocument();
    expect(screen.getByText("First principal dip age")).toBeInTheDocument();
    expect(screen.getByRole("table", { name: "Principal-Preserving FIRE projection" })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: /Cash yield/i })).toBeInTheDocument();
  });

  it("uses portfolio FIRE assets from the portfolio on Principal-Preserving FIRE", () => {
    const initialWorkbook = {
      ...defaultPhase1Workbook,
      fireInputs: {
        ...defaultPhase1Workbook.fireInputs,
        currentFireAssets: 1
      },
      portfolioItems: [
        {
          id: "vti",
          type: "etf",
          name: "VTI",
          symbol: "VTI",
          taxBucket: "Taxable",
          includedInFire: true,
          unitPrice: 250,
          units: 4,
          balance: 1000
        },
        {
          id: "home",
          type: "home",
          name: "Home",
          taxBucket: "Not Applicable",
          includedInFire: false,
          balance: 500000
        }
      ]
    } satisfies Phase1Workbook;

    render(<FireStrategyPanelHarness mode="principal_preserving" initialWorkbook={initialWorkbook} />);

    expect(screen.getByLabelText("Current FIRE assets")).toHaveValue("1");
    fireEvent.click(screen.getByRole("button", { name: "Use Portfolio FIRE Assets" }));
    expect(screen.getByLabelText("Current FIRE assets")).toHaveValue("1,000");
  });

  it("allows asset appreciation below 3 percent", () => {
    render(<FireStrategyPanelHarness mode="principal_preserving" />);

    fireEvent.change(screen.getByLabelText("Price appreciation (kept)"), {
      target: { value: "1.5" }
    });

    expect(screen.getByLabelText("Price appreciation (kept)")).toHaveValue("1.5");
    expect(screen.queryByText(/return must be/i)).not.toBeInTheDocument();
  });

  it("lets users temporarily clear numeric FIRE fields while entering a replacement value", () => {
    render(<FireStrategyPanelHarness mode="withdrawal_rate" />);

    const currentAgeInput = screen.getByLabelText("Current age") as HTMLInputElement;
    const annualExpensesInput = screen.getByLabelText("Annual retirement expenses");

    expect(currentAgeInput).toHaveValue("40");

    fireEvent.input(currentAgeInput, { target: { value: "" } });
    fireEvent.change(annualExpensesInput, { target: { value: "101000" } });

    expect(currentAgeInput.value).toBe("");

    fireEvent.change(currentAgeInput, { target: { value: "45" } });

    expect(currentAgeInput).toHaveValue("45");
  });

  it("keeps a cleared FIRE numeric field blank after blur until a valid replacement is entered", () => {
    render(<FireStrategyPanelHarness mode="withdrawal_rate" />);

    const currentAgeInput = screen.getByLabelText("Current age") as HTMLInputElement;

    fireEvent.change(currentAgeInput, { target: { value: "" } });
    fireEvent.blur(currentAgeInput);

    expect(currentAgeInput).toHaveValue("");

    fireEvent.focus(currentAgeInput);
    fireEvent.change(currentAgeInput, { target: { value: "45" } });
    fireEvent.blur(currentAgeInput);

    expect(currentAgeInput).toHaveValue("45");
  });

  it("renders app-owned numeric fields as editable text inputs with decimal keyboards", () => {
    render(<FireStrategyPanelHarness mode="withdrawal_rate" />);

    expect(screen.getByLabelText("Current age")).toHaveAttribute("type", "text");
    expect(screen.getByLabelText("Current age")).toHaveAttribute("inputmode", "decimal");
    expect(screen.getByLabelText("Annual retirement expenses")).toHaveAttribute("type", "text");
    expect(screen.getByLabelText("Annual retirement expenses")).toHaveAttribute(
      "inputmode",
      "decimal"
    );

    render(<PlanningToolPanel tool="mortgage" />);

    expect(screen.getByLabelText("Loan amount")).toHaveAttribute("type", "text");
    expect(screen.getByLabelText("Loan amount")).toHaveAttribute("inputmode", "decimal");
  });

  it("labels portfolio drawdown results as survival tested instead of withdrawal-rate target only", () => {
    render(<FireStrategyPanelHarness mode="withdrawal_rate" />);

    expect(screen.getAllByText("Assets at FIRE").length).toBeGreaterThan(0);
    expect(screen.getByRole("columnheader", { name: /Ending assets/i })).toBeInTheDocument();
    expect(screen.queryByText("Simple FIRE number")).not.toBeInTheDocument();
    expect(screen.queryByText("Today's FIRE number")).not.toBeInTheDocument();
    expect(screen.queryByText("FIRE target")).not.toBeInTheDocument();
  });

  it("gates FIRE results behind a Calculate button when inputs change", () => {
    render(<FireStrategyPanelHarness mode="withdrawal_rate" />);

    expect(screen.getByText(/up to date with your inputs/i)).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Annual retirement expenses"), {
      target: { value: "150000" }
    });

    expect(screen.getByText(/Edit mode/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Calculate results" }));

    expect(screen.queryByText(/Edit mode/i)).not.toBeInTheDocument();
    expect(screen.getByText(/up to date with your inputs/i)).toBeInTheDocument();
  });

  it("hides withdrawal-rate-only inputs in Income Stream mode", () => {
    render(<FireStrategyPanelHarness mode="income_stream" />);

    expect(screen.getByLabelText("Annual retirement expenses")).toBeInTheDocument();
    expect(screen.getByLabelText("Annual passive/guaranteed income after FIRE")).toBeInTheDocument();
    expect(screen.queryByLabelText("Annual savings before FIRE")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Withdrawal rate")).not.toBeInTheDocument();
    // Tax mode is now available in all three FIRE modes (Option B).
    expect(screen.getByLabelText("Tax mode")).toBeInTheDocument();
    expect(screen.queryByText("Income-Only FIRE")).not.toBeInTheDocument();
    expect(screen.queryByText("Passive Income Coverage FIRE")).not.toBeInTheDocument();
  });

  it("renders mortgage, investment, and Social Security benefit calculator pages", () => {
    render(<PlanningToolPanel tool="mortgage" />);
    expect(screen.getByRole("heading", { name: "Mortgage calculator" })).toBeInTheDocument();
    expect(screen.getByText("Estimated monthly payment")).toBeInTheDocument();

    render(<PlanningToolPanel tool="investment" />);
    expect(screen.getByRole("heading", { name: "Investment calculator" })).toBeInTheDocument();
    expect(screen.getByText("Projected ending balance")).toBeInTheDocument();

    render(<PlanningToolPanel tool="social-security" />);
    expect(
      screen.getByRole("heading", { name: "Social Security benefit calculator" })
    ).toBeInTheDocument();
    expect(screen.getByText("Credit eligibility")).toBeInTheDocument();
    expect(screen.getByText("At age 62")).toBeInTheDocument();
    expect(screen.getByText("At full retirement age")).toBeInTheDocument();
    expect(screen.getByText("At age 70")).toBeInTheDocument();
    expect(screen.queryByLabelText("Claiming age")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Wage growth assumption")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Marital status")).not.toBeInTheDocument();
    expect(screen.getByText("Improve accuracy with annual earnings")).toBeInTheDocument();
    expect(screen.getByLabelText("Social Security wage for 2010")).toBeInTheDocument();
    expect(screen.getByLabelText("Social Security wage for 2052")).toBeInTheDocument();
    expect(screen.queryByLabelText("Annual earnings by year")).not.toBeInTheDocument();
  });

  it("renders the healthcare cost calculator with phase results and a related-tools footer", () => {
    render(<PlanningToolPanel tool="healthcare" />);

    expect(
      screen.getByRole("heading", { name: "Retirement healthcare cost calculator" })
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Household")).toBeInTheDocument();
    expect(screen.getByLabelText("FIRE / retirement age")).toBeInTheDocument();
    expect(screen.getByLabelText("Annual retirement MAGI")).toBeInTheDocument();
    expect(screen.getByText(/Lifetime net cost/i)).toBeInTheDocument();
    expect(screen.getByText(/Gap years total/i)).toBeInTheDocument();
    expect(screen.getByText(/Medicare total/i)).toBeInTheDocument();
    expect(
      screen.getByRole("table", { name: "Healthcare cost projection" })
    ).toBeInTheDocument();

    // Cross-tool navigation footer links to the other three tools, not itself.
    const footer = screen.getByRole("navigation", { name: "More planning tools" });
    expect(footer).toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: /Retirement healthcare cost calculator/i })
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /Social Security benefit calculator/i })
    ).toHaveAttribute("href", "/app/fire-path/tools/social-security");
  });

  it("recomputes healthcare results when the Calculate gate is clicked", () => {
    render(<PlanningToolPanel tool="healthcare" />);

    expect(screen.getByText(/up to date with your inputs/i)).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Annual retirement MAGI"), {
      target: { value: "200000" }
    });
    expect(screen.getByText(/Edit mode/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Calculate" }));
    expect(screen.getByText(/up to date with your inputs/i)).toBeInTheDocument();
  });

  it("lets users temporarily clear calculator numeric fields while entering a replacement value", () => {
    render(<PlanningToolPanel tool="mortgage" />);

    const loanAmountInput = screen.getByLabelText("Loan amount") as HTMLInputElement;
    const interestRateInput = screen.getByLabelText("Annual interest rate");

    expect(loanAmountInput).toHaveValue("500000");

    fireEvent.input(loanAmountInput, { target: { value: "" } });
    fireEvent.change(interestRateInput, { target: { value: "6.25" } });

    expect(loanAmountInput.value).toBe("");

    fireEvent.change(loanAmountInput, { target: { value: "450000" } });

    expect(loanAmountInput).toHaveValue("450000");
  });

  it("keeps a cleared calculator numeric field blank after blur until a valid replacement is entered", () => {
    render(<PlanningToolPanel tool="mortgage" />);

    const loanAmountInput = screen.getByLabelText("Loan amount") as HTMLInputElement;

    fireEvent.change(loanAmountInput, { target: { value: "" } });
    fireEvent.blur(loanAmountInput);

    expect(loanAmountInput).toHaveValue("");

    fireEvent.focus(loanAmountInput);
    fireEvent.change(loanAmountInput, { target: { value: "450000" } });
    fireEvent.blur(loanAmountInput);

    expect(loanAmountInput).toHaveValue("450000");
  });

  it("shows Social Security ineligible status when projected credits are below 40", () => {
    render(<PlanningToolPanel tool="social-security" />);

    fireEvent.change(screen.getByLabelText("Work start year"), { target: { value: "2026" } });
    fireEvent.change(screen.getByLabelText("Work end year"), { target: { value: "2026" } });
    // Results are gated behind the Calculate button now.
    fireEvent.click(screen.getByRole("button", { name: "Calculate" }));

    expect(screen.getByText("4 / 40 credits")).toBeInTheDocument();
    expect(screen.getAllByText("Not eligible").length).toBeGreaterThanOrEqual(3);
    expect(screen.getAllByText(/Needs 40 Social Security credits/i).length).toBeGreaterThan(0);
  });
});
