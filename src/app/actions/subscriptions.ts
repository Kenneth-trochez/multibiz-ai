"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

async function getCurrentMembership() {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect("/login");
  }

  const { data: membership, error: membershipError } = await supabase
    .from("business_members")
    .select("business_id, role, user_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (membershipError || !membership) {
    redirect("/dashboard?error=No+tienes+un+negocio+activo");
  }

  return { supabase, user, membership };
}

export async function changePlanAction(formData: FormData): Promise<void> {
  const planCode = String(formData.get("planCode") || "").trim();

  if (!planCode) {
    redirect("/dashboard/profile?error=Plan+inválido");
  }

  const { supabase, membership } = await getCurrentMembership();

  if (membership.role !== "owner") {
    redirect("/dashboard/profile?error=Solo+el+owner+puede+cambiar+el+plan");
  }

  const { data: planRow, error: planError } = await supabase
    .from("subscription_plans")
    .select("id, code, active")
    .eq("code", planCode)
    .eq("active", true)
    .maybeSingle();

  if (planError || !planRow) {
    redirect("/dashboard/profile?error=No+se+encontró+el+plan+seleccionado");
  }

  const { data: currentSubscription, error: currentSubscriptionError } =
    await supabase
      .from("business_subscriptions")
      .select("id, business_id")
      .eq("business_id", membership.business_id)
      .in("status", ["active", "trialing", "past_due"])
      .maybeSingle();

  if (currentSubscriptionError) {
    redirect(
      `/dashboard/profile?error=${encodeURIComponent(
        currentSubscriptionError.message
      )}`
    );
  }

  if (!currentSubscription) {
    const { error: insertError } = await supabase
      .from("business_subscriptions")
      .insert({
        business_id: membership.business_id,
        plan_id: planRow.id,
        status: "active",
        billing_cycle: "monthly",
        started_at: new Date().toISOString(),
        current_period_start: new Date().toISOString(),
      });

    if (insertError) {
      redirect(
        `/dashboard/profile?error=${encodeURIComponent(insertError.message)}`
      );
    }
  } else {
    const { error: updateError } = await supabase
      .from("business_subscriptions")
      .update({
        plan_id: planRow.id,
        status: "active",
        current_period_start: new Date().toISOString(),
      })
      .eq("id", currentSubscription.id);

    if (updateError) {
      redirect(
        `/dashboard/profile?error=${encodeURIComponent(updateError.message)}`
      );
    }
  }

  revalidatePath("/dashboard/profile");
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/products");
  revalidatePath("/dashboard/sales");
  revalidatePath("/dashboard/balance");
  revalidatePath("/dashboard/staff");

  redirect("/dashboard/profile?success=plan_updated");
}