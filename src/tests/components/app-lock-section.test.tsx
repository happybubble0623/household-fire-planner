import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { vi } from "vitest";
import { AppModeProvider } from "@/components/app-mode-provider";
import { AppLockSection } from "@/components/more/app-lock-section";

const isBiometricAvailable = vi.fn();
const setAppLockEnabled = vi.fn();
let stored = false;

vi.mock("@/lib/app-lock", () => ({
  isAppLockEnabled: () => stored,
  isBiometricAvailable: () => isBiometricAvailable(),
  setAppLockEnabled: (v: boolean) => setAppLockEnabled(v)
}));

beforeEach(() => {
  stored = false;
  isBiometricAvailable.mockReset();
  setAppLockEnabled.mockReset();
});

describe("AppLockSection", () => {
  it("renders nothing on the website (not app mode)", () => {
    const { container } = render(<AppLockSection />);
    expect(container).toBeEmptyDOMElement();
  });

  it("shows an OFF-by-default toggle in app mode", () => {
    render(
      <AppModeProvider initialIsAppMode>
        <AppLockSection />
      </AppModeProvider>
    );
    const toggle = screen.getByRole("switch", { name: /app lock/i });
    expect(toggle).toHaveAttribute("aria-checked", "false");
  });

  it("enables + persists when Face ID is available", async () => {
    isBiometricAvailable.mockResolvedValue(true);
    render(
      <AppModeProvider initialIsAppMode>
        <AppLockSection />
      </AppModeProvider>
    );
    fireEvent.click(screen.getByRole("switch", { name: /app lock/i }));
    await waitFor(() =>
      expect(screen.getByRole("switch")).toHaveAttribute("aria-checked", "true")
    );
    expect(setAppLockEnabled).toHaveBeenCalledWith(true);
  });

  it("stays off + hints when Face ID is unavailable", async () => {
    isBiometricAvailable.mockResolvedValue(false);
    render(
      <AppModeProvider initialIsAppMode>
        <AppLockSection />
      </AppModeProvider>
    );
    fireEvent.click(screen.getByRole("switch", { name: /app lock/i }));
    await waitFor(() => expect(screen.getByText(/iOS Settings/i)).toBeInTheDocument());
    expect(screen.getByRole("switch")).toHaveAttribute("aria-checked", "false");
    expect(setAppLockEnabled).not.toHaveBeenCalled();
  });

  it("disables + clears the pref when toggled off", async () => {
    stored = true;
    render(
      <AppModeProvider initialIsAppMode>
        <AppLockSection />
      </AppModeProvider>
    );
    await waitFor(() =>
      expect(screen.getByRole("switch")).toHaveAttribute("aria-checked", "true")
    );
    fireEvent.click(screen.getByRole("switch", { name: /app lock/i }));
    await waitFor(() =>
      expect(screen.getByRole("switch")).toHaveAttribute("aria-checked", "false")
    );
    expect(setAppLockEnabled).toHaveBeenCalledWith(false);
  });
});
