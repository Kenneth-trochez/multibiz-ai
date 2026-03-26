import { createClient } from "@/lib/supabase/server";
import { getCurrentBusiness } from "@/lib/tenant/getCurrentBusiness";

export async function getCurrentPlan() {
  const ctx = await getCurrentBusiness();

  if (!ctx?.business) return null;

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("business_subscriptions")
    .select(`
      id,
      status,
      plan:subscription_plans(
        id,
        code,
        name,
        features,
        limits
      )
    `)
    .eq("business_id", ctx.business.id)
    .in("status", ["active", "trialing"])
    .maybeSingle();

  if (error || !data) return null;

  const plan = Array.isArray(data.plan) ? data.plan[0] : data.plan;

  return {
    code: plan.code,
    features: plan.features || {},
    limits: plan.limits || {},
  };
}