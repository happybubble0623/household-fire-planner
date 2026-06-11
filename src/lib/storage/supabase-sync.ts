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

  supabaseClient = createClient(url, anonKey, {
    auth: {
      persistSession: true,
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
