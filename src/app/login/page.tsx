import type { Metadata } from "next";
import { AuthPanel } from "@/components/auth/auth-panel";

export const metadata: Metadata = {
  title: { absolute: "Sign in — Plan My FIRE" },
  description:
    "Plan My FIRE works without an account. Sign in only if you want to sync your plan across devices. Continue as guest to keep everything local.",
  alternates: { canonical: "/login" },
  robots: { index: false, follow: false }
};

export default function LoginPage() {
  return (
    <div className="mx-auto flex min-h-screen w-full max-w-lg flex-col justify-center px-4 py-12">
      <AuthPanel mode="login" />
    </div>
  );
}
