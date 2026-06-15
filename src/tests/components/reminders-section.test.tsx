import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { vi } from "vitest";
import { AppModeProvider } from "@/components/app-mode-provider";
import { RemindersSection } from "@/components/more/reminders-section";

const enableMonthlyReminder = vi.fn();
const disableReminder = vi.fn();
let stored = false;

vi.mock("@/lib/notifications", () => ({
  isReminderEnabled: () => stored,
  enableMonthlyReminder: () => enableMonthlyReminder(),
  disableReminder: () => disableReminder()
}));

beforeEach(() => {
  stored = false;
  enableMonthlyReminder.mockReset();
  disableReminder.mockReset();
});

describe("RemindersSection", () => {
  it("renders nothing on the website (not app mode)", () => {
    const { container } = render(<RemindersSection />);
    expect(container).toBeEmptyDOMElement();
  });

  it("shows an OFF-by-default toggle in app mode", () => {
    render(
      <AppModeProvider initialIsAppMode>
        <RemindersSection />
      </AppModeProvider>
    );
    const toggle = screen.getByRole("switch", { name: /monthly check-in reminder/i });
    expect(toggle).toHaveAttribute("aria-checked", "false");
  });

  it("enables on toggle when permission is granted", async () => {
    enableMonthlyReminder.mockResolvedValue("enabled");
    render(
      <AppModeProvider initialIsAppMode>
        <RemindersSection />
      </AppModeProvider>
    );
    fireEvent.click(screen.getByRole("switch", { name: /monthly check-in reminder/i }));
    await waitFor(() =>
      expect(screen.getByRole("switch")).toHaveAttribute("aria-checked", "true")
    );
    expect(enableMonthlyReminder).toHaveBeenCalledTimes(1);
  });

  it("surfaces an iOS Settings hint when permission is denied", async () => {
    enableMonthlyReminder.mockResolvedValue("denied");
    render(
      <AppModeProvider initialIsAppMode>
        <RemindersSection />
      </AppModeProvider>
    );
    fireEvent.click(screen.getByRole("switch", { name: /monthly check-in reminder/i }));
    await waitFor(() => expect(screen.getByText(/iOS Settings/i)).toBeInTheDocument());
    expect(screen.getByRole("switch")).toHaveAttribute("aria-checked", "false");
  });
});
