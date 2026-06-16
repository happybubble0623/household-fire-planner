import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { PlanDocument } from "@/types/plan";

type SupabaseLikeClient = {
  auth: {
    getUser: () => Promise<{
      data: { user: { id: string } | null };
      error: Error | null;
    }>;
  };
  from: (table: "plan_documents") => {
    delete: () => {
      eq: (column: string, value: string) => {
        eq: (column: string, value: string) => PromiseLike<{ error: unknown }>;
      };
    };
  };
};

// Singleton client. A single instance per browser tab is required for auth:
// it owns the persisted session (localStorage) and the onAuthStateChange
// subscription. The OTP code flow establishes the session in-page via
// verifyOtp (no redirect callback), so it does not depend on
// detectSessionInUrl — that option is left on but harmless. Reused by the
// contact form, the auth panel, the session hook, and the workbook sync layer.
let supabaseClient: SupabaseClient | null = null;

export function getSupabaseClient() {
  if (supabaseClient) {
    return supabaseClient;
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    return null;
  }

  // Auth is configured to STAY signed in until the user explicitly signs out:
  //   - persistSession: persist the session to storage (default storage is
  //     localStorage in the browser — NOT sessionStorage/in-memory). Inside the
  //     Capacitor iOS WKWebView, localStorage lives in the default persistent
  //     WKWebsiteDataStore, so it survives app close/relaunch — no native config
  //     needed. (Nothing here uses sessionStorage or sets persistSession:false.)
  //   - autoRefreshToken: keep the access token fresh from the refresh token, so
  //     the session doesn't silently expire while backgrounded; supabase-js also
  //     refreshes on tab/app foreground. Default is true; set explicitly so this
  //     "stay signed in" guarantee can't regress on a default change.
  // The ONLY thing that ends the session is the explicit signOut() in
  // src/lib/auth/use-session.ts (the Sign out button). The Face ID app-lock only
  // blurs/inerts the UI — it never calls signOut or clears the token.
  supabaseClient = createClient(url, anonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true
    }
  });

  return supabaseClient;
}

export async function saveCloudPlan(plan: PlanDocument) {
  const supabase = getSupabaseClient();
  if (!supabase) {
    throw new Error("Supabase is not configured. Guest mode remains available.");
  }

  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) {
    throw new Error("Sign in before saving a cloud plan. Guest mode remains available.");
  }

  const { data, error } = await supabase
    .from("plan_documents")
    .upsert({
      id: plan.id,
      user_id: userData.user.id,
      title: plan.title,
      data: plan,
      updated_at: new Date().toISOString()
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function listCloudPlans() {
  const supabase = getSupabaseClient();
  if (!supabase) {
    return [];
  }

  const { data, error } = await supabase
    .from("plan_documents")
    .select("id,title,updated_at")
    .order("updated_at", { ascending: false });

  if (error) throw error;
  return data;
}

export async function loadLatestCloudPlan(): Promise<PlanDocument | null> {
  const supabase = getSupabaseClient();
  if (!supabase) {
    throw new Error("Supabase is not configured. Guest mode remains available.");
  }

  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) {
    throw new Error("Sign in before loading cloud plans. Guest mode remains available.");
  }

  const { data, error } = await supabase
    .from("plan_documents")
    .select("data")
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return (data?.data as PlanDocument | undefined) ?? null;
}

export async function deleteCloudPlan(
  planId: string,
  client: SupabaseLikeClient | null = getSupabaseClient()
) {
  if (!client) {
    throw new Error("Supabase is not configured. Guest mode remains available.");
  }

  const { data: userData, error: userError } = await client.auth.getUser();
  if (userError || !userData.user) {
    throw new Error("Sign in before deleting a cloud plan. Guest mode remains available.");
  }

  const { error } = await client
    .from("plan_documents")
    .delete()
    .eq("id", planId)
    .eq("user_id", userData.user.id);

  if (error) throw error;
}
