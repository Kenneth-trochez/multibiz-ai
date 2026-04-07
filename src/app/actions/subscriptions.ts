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
  const billingCycle = String(formData.get("billingCycle") || "monthly").trim();

  if (!planCode) {
    redirect("/dashboard/profile?error=Plan+inválido");
  }

  if (!["monthly", "quarterly", "yearly"].includes(billingCycle)) {
    redirect("/dashboard/profile?error=Ciclo+de+facturación+inválido");
  }

  const { supabase, membership, user } = await getCurrentMembership();

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
      .select("id, business_id, plan_id, status, billing_cycle")
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

  const nowIso = new Date().toISOString();

  if (!currentSubscription) {
    const { data: insertedSubscription, error: insertError } = await supabase
      .from("business_subscriptions")
      .insert({
        business_id: membership.business_id,
        plan_id: planRow.id,
        status: "active",
        billing_cycle: billingCycle,
        started_at: nowIso,
        current_period_start: nowIso,
      })
      .select("id")
      .single();

    if (insertError || !insertedSubscription) {
      redirect(
        `/dashboard/profile?error=${encodeURIComponent(
          insertError?.message || "No se pudo crear la suscripción"
        )}`
      );
    }

    await supabase.from("subscription_audit_logs").insert({
      business_id: membership.business_id,
      subscription_id: insertedSubscription.id,
      actor_user_id: user.id,
      event_type: "subscription_created",
      new_plan_id: planRow.id,
      new_status: "active",
      new_billing_cycle: billingCycle,
      notes: `Suscripción creada con ciclo ${billingCycle}`,
    });
  } else {
    const { error: updateError } = await supabase
      .from("business_subscriptions")
      .update({
        plan_id: planRow.id,
        status: "active",
        billing_cycle: billingCycle,
        current_period_start: nowIso,
      })
      .eq("id", currentSubscription.id);

    if (updateError) {
      redirect(
        `/dashboard/profile?error=${encodeURIComponent(updateError.message)}`
      );
    }

    await supabase.from("subscription_audit_logs").insert({
      business_id: membership.business_id,
      subscription_id: currentSubscription.id,
      actor_user_id: user.id,
      event_type: "plan_changed",
      old_plan_id: currentSubscription.plan_id,
      new_plan_id: planRow.id,
      old_status: currentSubscription.status,
      new_status: "active",
      old_billing_cycle: currentSubscription.billing_cycle,
      new_billing_cycle: billingCycle,
      notes: `Plan/ciclo actualizado a ${planCode} (${billingCycle})`,
    });
  }

  revalidatePath("/dashboard/profile");
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/products");
  revalidatePath("/dashboard/sales");
  revalidatePath("/dashboard/balance");
  revalidatePath("/dashboard/staff");
  revalidatePath("/dashboard/upgrade");
  redirect("/dashboard/profile?success=plan_updated");
}