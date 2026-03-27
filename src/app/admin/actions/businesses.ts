"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requirePlatformAdmin } from "@/lib/auth/requirePlatformAdmin";
import { createAdminClient } from "@/lib/supabase/admin";

const ALLOWED_STATUSES = [
  "trialing",
  "active",
  "past_due",
  "canceled",
  "inactive",
] as const;

const ALLOWED_BILLING_CYCLES = ["monthly", "yearly"] as const;

type AllowedStatus = (typeof ALLOWED_STATUSES)[number];
type AllowedBillingCycle = (typeof ALLOWED_BILLING_CYCLES)[number];

function revalidateAdminPages() {
  revalidatePath("/admin");
  revalidatePath("/admin/businesses");
  revalidatePath("/admin/users");
  revalidatePath("/admin/memberships");
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

  const { data: activeSubscription, error: findError } = await supabase
    .from("business_subscriptions")
    .select("id, business_id, status")
    .eq("business_id", businessId)
    .in("status", ["trialing", "active", "past_due"])
    .maybeSingle();

  if (findError) {
    redirect(
      `/admin/businesses?error=${encodeURIComponent(findError.message)}`
    );
  }

  if (activeSubscription) {
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
  } else {
    const now = new Date();
    const periodEnd = new Date(now);

    if (billingCycle === "yearly") {
      periodEnd.setFullYear(periodEnd.getFullYear() + 1);
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

    const { error: insertError } = await supabase
      .from("business_subscriptions")
      .insert(payload);

    if (insertError) {
      redirect(
        `/admin/businesses?error=${encodeURIComponent(insertError.message)}`
      );
    }
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