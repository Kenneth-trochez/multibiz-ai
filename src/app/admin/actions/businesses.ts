"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requirePlatformAdmin } from "@/lib/auth/requirePlatformAdmin";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

const ALLOWED_STATUSES = [
  "trialing",
  "active",
  "past_due",
  "canceled",
  "inactive",
] as const;

const ALLOWED_BILLING_CYCLES = ["monthly", "quarterly", "yearly"] as const;

type AllowedStatus = (typeof ALLOWED_STATUSES)[number];
type AllowedBillingCycle = (typeof ALLOWED_BILLING_CYCLES)[number];

function revalidateAdminPages() {
  revalidatePath("/admin");
  revalidatePath("/admin/businesses");
  revalidatePath("/admin/users");
  revalidatePath("/admin/memberships");
  revalidatePath("/admin/subscriptions");
}

async function getActorUserId() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return user?.id ?? null;
}

export async function updateBusinessSubscriptionAction(
  formData: FormData
): Promise<void> {
  await requirePlatformAdmin();

  const businessId = String(formData.get("businessId") || "").trim();
  const planId = String(formData.get("planId") || "").trim();
  const status = String(formData.get("status") || "").trim();
  const billingCycle = String(formData.get("billingCycle") || "").trim();

  if (!businessId || !planId || !status || !billingCycle) {
    redirect("/admin/businesses?error=Datos+incompletos");
  }

  if (!ALLOWED_STATUSES.includes(status as AllowedStatus)) {
    redirect("/admin/businesses?error=Status+invalido");
  }

  if (!ALLOWED_BILLING_CYCLES.includes(billingCycle as AllowedBillingCycle)) {
    redirect("/admin/businesses?error=Ciclo+de+facturacion+invalido");
  }

  const supabase = createAdminClient();
  const actorUserId = await getActorUserId();

  const { data: activeSubscription, error: findError } = await supabase
    .from("business_subscriptions")
    .select(
      "id, business_id, plan_id, status, billing_cycle, provider, provider_subscription_id"
    )
    .eq("business_id", businessId)
    .in("status", ["trialing", "active", "past_due"])
    .maybeSingle();

  if (findError) {
    redirect(
      `/admin/businesses?error=${encodeURIComponent(findError.message)}`
    );
  }

  if (activeSubscription) {
    const oldPlanId = activeSubscription.plan_id;
    const oldStatus = activeSubscription.status;
    const oldBillingCycle = activeSubscription.billing_cycle;

    const { error: updateError } = await supabase
      .from("business_subscriptions")
      .update({
        plan_id: planId,
        status,
        billing_cycle: billingCycle,
      })
      .eq("id", activeSubscription.id);

    if (updateError) {
      redirect(
        `/admin/businesses?error=${encodeURIComponent(updateError.message)}`
      );
    }

    const eventType =
      oldPlanId !== planId
        ? "plan_changed"
        : oldStatus !== status
        ? "status_changed"
        : oldBillingCycle !== billingCycle
        ? "billing_cycle_changed"
        : "subscription_updated";

    await supabase.from("subscription_audit_logs").insert({
      business_id: businessId,
      subscription_id: activeSubscription.id,
      actor_user_id: actorUserId,
      event_type: eventType,
      old_plan_id: oldPlanId,
      new_plan_id: planId,
      old_status: oldStatus,
      new_status: status,
      old_billing_cycle: oldBillingCycle,
      new_billing_cycle: billingCycle,
      provider: activeSubscription.provider || "internal",
      provider_reference: activeSubscription.provider_subscription_id || null,
      notes: "Cambio manual desde panel admin",
      metadata: {
        source: "admin_businesses",
        mode: "update_existing_subscription",
      },
    });
  } else {
    const now = new Date();
    const periodEnd = new Date(now);

    if (billingCycle === "yearly") {
      periodEnd.setFullYear(periodEnd.getFullYear() + 1);
    } else if (billingCycle === "quarterly") {
      periodEnd.setMonth(periodEnd.getMonth() + 3);
    } else {
      periodEnd.setMonth(periodEnd.getMonth() + 1);
    }

    const payload: {
      business_id: string;
      plan_id: string;
      status: string;
      billing_cycle: string;
      started_at: string;
      current_period_start: string;
      current_period_end: string | null;
      canceled_at?: string | null;
      trial_ends_at?: string | null;
    } = {
      business_id: businessId,
      plan_id: planId,
      status,
      billing_cycle: billingCycle,
      started_at: now.toISOString(),
      current_period_start: now.toISOString(),
      current_period_end: status === "inactive" ? null : periodEnd.toISOString(),
    };

    if (status === "canceled") {
      payload.canceled_at = now.toISOString();
    }

    if (status === "trialing") {
      const trialEndsAt = new Date(now);
      trialEndsAt.setDate(trialEndsAt.getDate() + 7);
      payload.trial_ends_at = trialEndsAt.toISOString();
    }

    const { data: insertedSubscription, error: insertError } = await supabase
      .from("business_subscriptions")
      .insert(payload)
      .select("id")
      .single();

    if (insertError || !insertedSubscription) {
      redirect(
        `/admin/businesses?error=${encodeURIComponent(
          insertError?.message || "No se pudo crear la suscripción"
        )}`
      );
    }

    await supabase.from("subscription_audit_logs").insert({
      business_id: businessId,
      subscription_id: insertedSubscription.id,
      actor_user_id: actorUserId,
      event_type: "subscription_created",
      old_plan_id: null,
      new_plan_id: planId,
      old_status: null,
      new_status: status,
      old_billing_cycle: null,
      new_billing_cycle: billingCycle,
      provider: "internal",
      provider_reference: null,
      notes: "Suscripción creada manualmente desde panel admin",
      metadata: {
        source: "admin_businesses",
        mode: "create_subscription",
      },
    });
  }

  revalidateAdminPages();
  redirect("/admin/businesses?success=subscription_updated");
}

export async function deleteBusinessAction(
  formData: FormData
): Promise<void> {
  await requirePlatformAdmin();

  const businessId = String(formData.get("businessId") || "").trim();
  const confirmationName = String(formData.get("confirmationName") || "").trim();

  if (!businessId || !confirmationName) {
    redirect("/admin/businesses?error=Debes+completar+la+confirmacion+de+eliminacion");
  }

  const supabase = createAdminClient();
  const actorUserId = await getActorUserId();

  const { data: business, error: businessError } = await supabase
    .from("businesses")
    .select("id, name")
    .eq("id", businessId)
    .maybeSingle();

  if (businessError || !business) {
    redirect("/admin/businesses?error=No+se+pudo+encontrar+el+negocio");
  }

  if (confirmationName !== business.name) {
    redirect(
      "/admin/businesses?error=El+nombre+de+confirmacion+no+coincide+con+el+negocio"
    );
  }

  await supabase.from("subscription_audit_logs").insert({
    business_id: business.id,
    subscription_id: null,
    actor_user_id: actorUserId,
    event_type: "business_deleted",
    old_plan_id: null,
    new_plan_id: null,
    old_status: null,
    new_status: null,
    old_billing_cycle: null,
    new_billing_cycle: null,
    provider: "internal",
    provider_reference: null,
    notes: `Negocio eliminado manualmente desde panel admin: ${business.name}`,
    metadata: {
      source: "admin_businesses",
      confirmation_name: confirmationName,
    },
  });

  const { error: deleteError } = await supabase
    .from("businesses")
    .delete()
    .eq("id", businessId);

  if (deleteError) {
    redirect(
      `/admin/businesses?error=${encodeURIComponent(deleteError.message)}`
    );
  }

  revalidateAdminPages();
  redirect("/admin/businesses?success=business_deleted");
}