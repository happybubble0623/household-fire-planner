import { render, screen } from "@testing-library/react";
import { vi } from "vitest";
import { AppModeProvider } from "@/components/app-mode-provider";
import { AppLockProvider } from "@/components/app-lock/app-lock-provider";

const isAppLockEnabled = vi.fn();
const onAppResume = vi.fn(() => () => {});

vi.mock("@/lib/app-lock", () => ({
  isAppLockEnabled: () => isAppLockEnabled(),
  onAppResume: (cb: () => void) => onAppResume(cb),
  authenticate: vi.fn()
}));

beforeEach(() => {
  isAppLockEnabled.mockReset();
  onAppResume.mockClear();
});

describe("AppLockProvider", () => {
  it("renders children and never locks on the website (not app mode)", () => {
    // Even if a pref somehow says enabled, web mode must never lock.
    isAppLockEnabled.mockReturnValue(true);
    render(
      <AppLockProvider>
        <p>website content</p>
      </AppLockProvider>
    );
    expect(screen.getByText("website content")).toBeVisible();
    expect(screen.queryByRole("dialog", { name: /app locked/i })).not.toBeInTheDocument();
    // No native subscription on the website.
    expect(onAppResume).not.toHaveBeenCalled();
  });

  it("does not lock in app mode when the pref is OFF", () => {
    isAppLockEnabled.mockReturnValue(false);
    render(
      <AppModeProvider initialIsAppMode>
        <AppLockProvider>
          <p>app content</p>
        </AppLockProvider>
      </AppModeProvider>
    );
    expect(screen.getByText("app content")).toBeInTheDocument();
    expect(screen.queryByRole("dialog", { name: /app locked/i })).not.toBeInTheDocument();
    // Resume subscription is wired in app mode.
    expect(onAppResume).toHaveBeenCalled();
  });

  it("locks on launch in app mode when the pref is ON", () => {
    isAppLockEnabled.mockReturnValue(true);
    render(
      <AppModeProvider initialIsAppMode>
        <AppLockProvider>
          <p>app content</p>
        </AppLockProvider>
      </AppModeProvider>
    );
    expect(screen.getByRole("dialog", { name: /app locked/i })).toBeInTheDocument();
  });
});
