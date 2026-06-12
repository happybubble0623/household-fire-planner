import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AuthPanel } from "@/components/auth/auth-panel";

const signInWithOtp = vi.fn();
const verifyOtp = vi.fn();
const routerPush = vi.fn();
const routerRefresh = vi.fn();

vi.mock("@/lib/storage/supabase-sync", () => ({
  getSupabaseClient: () => ({
    auth: { signInWithOtp, verifyOtp }
  })
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: routerPush, refresh: routerRefresh })
}));

beforeEach(() => {
  signInWithOtp.mockReset();
  verifyOtp.mockReset();
  routerPush.mockReset();
  routerRefresh.mockReset();
  signInWithOtp.mockResolvedValue({ error: null });
  verifyOtp.mockResolvedValue({ error: null });
  // Reset the per-device daily code-request counter so the cap doesn't bleed
  // across tests (several tests trigger sends).
  window.localStorage.clear();
});

afterEach(() => {
  vi.clearAllMocks();
});

function typeEmail(value = "saver@example.com") {
  fireEvent.change(screen.getByLabelText(/email/i), { target: { value } });
}

describe("AuthPanel OTP flow", () => {
  it("step 1 emails a verification code with shouldCreateUser and reveals the code input", async () => {
    render(<AuthPanel mode="login" />);

    typeEmail();
    fireEvent.click(screen.getByRole("button", { name: /email me a code/i }));

    await waitFor(() =>
      expect(signInWithOtp).toHaveBeenCalledWith({
        email: "saver@example.com",
        options: { shouldCreateUser: true }
      })
    );

    // No magic-link redirect is requested.
    expect(signInWithOtp.mock.calls[0][0].options).not.toHaveProperty(
      "emailRedirectTo"
    );

    expect(await screen.findByLabelText(/verification code/i)).toBeInTheDocument();
    expect(screen.getByText(/emailed a verification code/i)).toBeInTheDocument();
  });

  it("step 2 verifies an 8-digit code via verifyOtp un-truncated and signs the user in", async () => {
    render(<AuthPanel mode="login" />);

    typeEmail();
    fireEvent.click(screen.getByRole("button", { name: /email me a code/i }));

    const codeInput = await screen.findByLabelText(/verification code/i);
    expect(codeInput).toHaveAttribute("autocomplete", "one-time-code");
    expect(codeInput).toHaveAttribute("inputmode", "numeric");

    fireEvent.change(codeInput, { target: { value: "12345678" } });
    fireEvent.click(screen.getByRole("button", { name: /verify code/i }));

    await waitFor(() =>
      expect(verifyOtp).toHaveBeenCalledWith({
        email: "saver@example.com",
        token: "12345678",
        type: "email"
      })
    );

    expect(await screen.findByText(/you're signed in/i)).toBeInTheDocument();
  });

  it("still accepts a 6-digit code and passes it to verifyOtp as-is", async () => {
    render(<AuthPanel mode="login" />);
    typeEmail();
    fireEvent.click(screen.getByRole("button", { name: /email me a code/i }));

    const codeInput = await screen.findByLabelText(/verification code/i);
    fireEvent.change(codeInput, { target: { value: "123456" } });
    fireEvent.click(screen.getByRole("button", { name: /verify code/i }));

    await waitFor(() =>
      expect(verifyOtp).toHaveBeenCalledWith({
        email: "saver@example.com",
        token: "123456",
        type: "email"
      })
    );
  });

  it("strips non-numeric input and caps the code at 8 digits", async () => {
    render(<AuthPanel mode="login" />);
    typeEmail();
    fireEvent.click(screen.getByRole("button", { name: /email me a code/i }));

    const codeInput = await screen.findByLabelText(/verification code/i);
    fireEvent.change(codeInput, { target: { value: "12ab34cd56ef78gh90" } });
    expect((codeInput as HTMLInputElement).value).toBe("12345678");
  });

  it("disables the verify button until the code is a plausible length", async () => {
    render(<AuthPanel mode="login" />);
    typeEmail();
    fireEvent.click(screen.getByRole("button", { name: /email me a code/i }));

    const codeInput = await screen.findByLabelText(/verification code/i);
    const verifyButton = screen.getByRole("button", { name: /verify code/i });

    fireEvent.change(codeInput, { target: { value: "12345" } });
    expect(verifyButton).toBeDisabled();

    fireEvent.change(codeInput, { target: { value: "123456" } });
    expect(verifyButton).toBeEnabled();

    fireEvent.change(codeInput, { target: { value: "12345678" } });
    expect(verifyButton).toBeEnabled();
  });

  it("surfaces an invalid/expired code error and stays on the code step", async () => {
    verifyOtp.mockResolvedValue({
      error: { message: "Token has expired or is invalid" }
    });

    render(<AuthPanel mode="login" />);
    typeEmail();
    fireEvent.click(screen.getByRole("button", { name: /email me a code/i }));

    const codeInput = await screen.findByLabelText(/verification code/i);
    fireEvent.change(codeInput, { target: { value: "000000" } });
    fireEvent.click(screen.getByRole("button", { name: /verify code/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      /expired or is invalid/i
    );
    // Still on the code step so the user can retry.
    expect(screen.getByLabelText(/verification code/i)).toBeInTheDocument();
  });

  it("surfaces a send error (e.g. rate limit) and stays on the email step", async () => {
    signInWithOtp.mockResolvedValue({
      error: { message: "Email rate limit exceeded" }
    });

    render(<AuthPanel mode="login" />);
    typeEmail();
    fireEvent.click(screen.getByRole("button", { name: /email me a code/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      /rate limit/i
    );
    expect(screen.queryByLabelText(/verification code/i)).not.toBeInTheDocument();
  });

  it("resend re-requests a code and change-email returns to step 1", async () => {
    render(<AuthPanel mode="login" />);
    typeEmail();
    fireEvent.click(screen.getByRole("button", { name: /email me a code/i }));

    await screen.findByLabelText(/verification code/i);
    expect(signInWithOtp).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole("button", { name: /resend/i }));
    await waitFor(() => expect(signInWithOtp).toHaveBeenCalledTimes(2));

    fireEvent.click(screen.getByRole("button", { name: /change email/i }));
    expect(screen.queryByLabelText(/verification code/i)).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /email me a code/i })).toBeInTheDocument();
  });

  it("keeps Continue as Guest available as the primary action", () => {
    render(<AuthPanel mode="login" />);
    const guest = screen.getByRole("link", { name: /continue as guest/i });
    expect(guest).toHaveAttribute("href", "/app/fire-path");
  });

  it("redirects to /app/fire-path after a successful verify", async () => {
    render(<AuthPanel mode="login" />);
    typeEmail();
    fireEvent.click(screen.getByRole("button", { name: /email me a code/i }));

    const codeInput = await screen.findByLabelText(/verification code/i);
    fireEvent.change(codeInput, { target: { value: "12345678" } });
    fireEvent.click(screen.getByRole("button", { name: /verify code/i }));

    // Confirmation shows first so the user knows the code worked...
    expect(await screen.findByText(/you're signed in/i)).toBeInTheDocument();

    // ...then we navigate into the app (after the brief confirmation delay).
    await waitFor(() => expect(routerPush).toHaveBeenCalledWith("/app/fire-path"), {
      timeout: 2000
    });
    expect(routerRefresh).toHaveBeenCalled();
  });

  it("does not navigate when the code is invalid", async () => {
    verifyOtp.mockResolvedValue({
      error: { message: "Token has expired or is invalid" }
    });

    render(<AuthPanel mode="login" />);
    typeEmail();
    fireEvent.click(screen.getByRole("button", { name: /email me a code/i }));

    const codeInput = await screen.findByLabelText(/verification code/i);
    fireEvent.change(codeInput, { target: { value: "000000" } });
    fireEvent.click(screen.getByRole("button", { name: /verify code/i }));

    await screen.findByRole("alert");
    expect(routerPush).not.toHaveBeenCalled();
  });

  it("caps sign-in code requests (sends + resends) at 4 per device per day", async () => {
    render(<AuthPanel mode="login" />);
    typeEmail();

    // Initial send (request #1) moves us to the code step.
    fireEvent.click(screen.getByRole("button", { name: /email me a code/i }));
    await screen.findByLabelText(/verification code/i);
    expect(signInWithOtp).toHaveBeenCalledTimes(1);

    // Resends #2, #3, #4 are allowed.
    for (let n = 2; n <= 4; n++) {
      fireEvent.click(screen.getByRole("button", { name: /resend/i }));
      await waitFor(() => expect(signInWithOtp).toHaveBeenCalledTimes(n));
    }

    // The 5th request is blocked client-side — no further send, clear message.
    fireEvent.click(screen.getByRole("button", { name: /resend/i }));
    expect(await screen.findByRole("alert")).toHaveTextContent(
      /maximum of 4 codes today/i
    );
    expect(signInWithOtp).toHaveBeenCalledTimes(4);
  });

  it("counts a today-dated stored tally and blocks the initial send once at the cap", async () => {
    const now = new Date();
    const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(
      now.getDate()
    ).padStart(2, "0")}`;
    window.localStorage.setItem(
      "hfp:code-requests",
      JSON.stringify({ date: today, count: 4 })
    );

    render(<AuthPanel mode="login" />);
    typeEmail();
    fireEvent.click(screen.getByRole("button", { name: /email me a code/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      /maximum of 4 codes today/i
    );
    expect(signInWithOtp).not.toHaveBeenCalled();
    // Still on the email step — the code input never appeared.
    expect(screen.queryByLabelText(/verification code/i)).not.toBeInTheDocument();
  });

  it("ignores a stale counter from a previous day", async () => {
    window.localStorage.setItem(
      "hfp:code-requests",
      JSON.stringify({ date: "2000-01-01", count: 99 })
    );

    render(<AuthPanel mode="login" />);
    typeEmail();
    fireEvent.click(screen.getByRole("button", { name: /email me a code/i }));

    // Yesterday's tally doesn't count today — the send goes through.
    await waitFor(() => expect(signInWithOtp).toHaveBeenCalledTimes(1));
    expect(await screen.findByLabelText(/verification code/i)).toBeInTheDocument();
  });
});
