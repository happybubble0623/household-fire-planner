import { fireEvent, render, screen, within } from "@testing-library/react";
import { vi } from "vitest";
import { AppShell } from "@/components/layout/app-shell";

// Drive the active route. The home hub is "/app/fire-path".
let pathname = "/app/fire-path";
vi.mock("next/navigation", () => ({
  usePathname: () => pathname
}));

describe("AppShell header", () => {
  it("renders the shared top banner on the home hub, identical to other pages", () => {
    pathname = "/app/fire-path";
    render(
      <AppShell>
        <div>home content</div>
      </AppShell>
    );

    // The single banner is present (no second/duplicate nav on the home page).
    const header = screen.getByRole("banner");
    expect(header).toBeInTheDocument();

    // Brand links back to the hub, and the primary nav exposes the same
    // Strategies / Calculators dropdowns, Portfolio, and About as everywhere.
    const primaryNavs = screen.getAllByRole("navigation", { name: "Primary navigation" });
    const desktopNav = primaryNavs[0];
    expect(within(desktopNav).getByRole("button", { name: /Strategies/i })).toBeInTheDocument();
    expect(within(desktopNav).getByRole("button", { name: /Calculators/i })).toBeInTheDocument();
    expect(within(desktopNav).getByRole("link", { name: "Portfolio Tracker" })).toHaveAttribute(
      "href",
      "/app/portfolio-lab"
    );
    expect(within(desktopNav).getByRole("link", { name: "About" })).toHaveAttribute(
      "href",
      "/about"
    );

    // The home content renders below the header.
    expect(screen.getByText("home content")).toBeInTheDocument();
  });

  it("exposes a working mobile hamburger on the home hub that toggles the mobile menu", () => {
    pathname = "/app/fire-path";
    render(
      <AppShell>
        <div>home content</div>
      </AppShell>
    );

    const toggle = screen.getByRole("button", { name: /Open navigation menu/i });
    expect(toggle).toHaveAttribute("aria-expanded", "false");
    // The mobile nav panel is collapsed until the hamburger is pressed.
    expect(screen.queryByRole("navigation", { name: "Primary navigation" })).toBeTruthy();
    expect(document.getElementById("mobile-navigation")).toBeNull();

    fireEvent.click(toggle);

    const closeToggle = screen.getByRole("button", { name: /Close navigation menu/i });
    expect(closeToggle).toHaveAttribute("aria-expanded", "true");
    const mobilePanel = document.getElementById("mobile-navigation");
    expect(mobilePanel).not.toBeNull();
    // Mobile menu carries the same destinations.
    expect(within(mobilePanel as HTMLElement).getByRole("link", { name: "Portfolio Tracker" })).toHaveAttribute(
      "href",
      "/app/portfolio-lab"
    );

    fireEvent.click(closeToggle);
    expect(screen.getByRole("button", { name: /Open navigation menu/i })).toHaveAttribute(
      "aria-expanded",
      "false"
    );
    expect(document.getElementById("mobile-navigation")).toBeNull();
  });
});
