import { redirect } from "next/navigation";

// Optional account creation is the same passwordless magic-link flow as sign
// in, so /signup just points at /login (which keeps "Continue as Guest" primary).
export default function SignupPage() {
  redirect("/login");
}
