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

function getAmountByCycle(priceMonthly: number, billingCycle: string) {
  const monthly = Number(priceMonthly || 0);

  switch (billingCycle) {
    case "quarterly":
      return monthly * 3;
    case "yearly":
      return monthly * 12;
    case "monthly":
    default:
      return monthly;
  }
}

export async function startPlanCheckoutAction(formData: FormData): Promise<void> {
  const planCode = String(formData.get("planCode") || "").trim();
  const billingCycle = String(formData.get("billingCycle") || "monthly").trim();

  if (!planCode) {
    redirect("/dashboard/profile?error=Plan+inválido");
  }

  if (!["monthly", "quarterly", "yearly"].includes(billingCycle)) {
    redirect("/dashboard/profile?error=Ciclo+de+facturación+inválido");
  }

  const { supabase, user, membership } = await getCurrentMembership();

  if (membership.role !== "owner") {
    redirect("/dashboard/profile?error=Solo+el+owner+puede+mejorar+el+plan");
  }

  const { data: targetPlan, error: targetPlanError } = await supabase
    .from("subscription_plans")
    .select("id, code, name, price_monthly, active")
    .eq("code", planCode)
    .eq("active", true)
    .maybeSingle();

  if (targetPlanError || !targetPlan) {
    redirect("/dashboard/profile?error=No+se+encontró+el+plan+seleccionado");
  }

  const { data: currentSubscription } = await supabase
    .from("business_subscriptions")
    .select(`
      id,
      billing_cycle,
      plan:subscription_plans(
        id,
        code
      )
    `)
    .eq("business_id", membership.business_id)
    .in("status", ["active", "trialing", "past_due"])
    .maybeSingle();

  const currentPlan = currentSubscription?.plan
    ? Array.isArray(currentSubscription.plan)
      ? currentSubscription.plan[0]
      : currentSubscription.plan
    : null;

  if (
    currentPlan?.code === targetPlan.code &&
    currentSubscription?.billing_cycle === billingCycle
  ) {
    redirect("/dashboard/profile?error=Ese+ya+es+tu+plan+y+ciclo+actual");
  }

  const checkoutAmount = getAmountByCycle(
    Number(targetPlan.price_monthly || 0),
    billingCycle
  );

  const { data: pendingSession } = await supabase
    .from("subscription_checkout_sessions")
    .select("id")
    .eq("business_id", membership.business_id)
    .eq("target_plan_id", targetPlan.id)
    .eq("status", "pending")
    .maybeSingle();

  let checkoutSessionId = pendingSession?.id || null;

  if (!checkoutSessionId) {
    const { data: insertedSession, error: insertSessionError } = await supabase
      .from("subscription_checkout_sessions")
      .insert({
        business_id: membership.business_id,
        target_plan_id: targetPlan.id,
        provider: "internal",
        status: "pending",
        amount: checkoutAmount,
        currency: "USD",
        billing_cycle: billingCycle,
        created_by_user_id: user.id,
      })
      .select("id")
      .single();

    if (insertSessionError || !insertedSession) {
      redirect(
        `/dashboard/profile?error=${encodeURIComponent(
          insertSessionError?.message || "No se pudo iniciar el checkout"
        )}`
      );
    }

    checkoutSessionId = insertedSession.id;
  } else {
    const { error: updatePendingError } = await supabase
      .from("subscription_checkout_sessions")
      .update({
        amount: checkoutAmount,
        billing_cycle: billingCycle,
      })
      .eq("id", checkoutSessionId);

    if (updatePendingError) {
      redirect(
        `/dashboard/profile?error=${encodeURIComponent(
          updatePendingError.message || "No se pudo actualizar la sesión de checkout"
        )}`
      );
    }
  }

  revalidatePath("/dashboard/profile");
  revalidatePath(`/dashboard/checkout/${checkoutSessionId}`);
  redirect(`/dashboard/checkout/${checkoutSessionId}`);
}

export async function updateCheckoutSessionCycleAction(
  formData: FormData
): Promise<void> {
  const sessionId = String(formData.get("sessionId") || "").trim();
  const billingCycle = String(formData.get("billingCycle") || "monthly").trim();

  if (!sessionId) {
    redirect("/dashboard/profile?error=Sesión+de+checkout+inválida");
  }

  if (!["monthly", "quarterly", "yearly"].includes(billingCycle)) {
    redirect("/dashboard/profile?error=Ciclo+de+facturación+inválido");
  }

  const { supabase, membership } = await getCurrentMembership();

  if (membership.role !== "owner") {
    redirect("/dashboard/profile?error=Solo+el+owner+puede+modificar+el+checkout");
  }

  const { data: session, error: sessionError } = await supabase
    .from("subscription_checkout_sessions")
    .select(`
      id,
      business_id,
      status,
      target_plan_id,
      plan:subscription_plans(
        id,
        price_monthly
      )
    `)
    .eq("id", sessionId)
    .eq("business_id", membership.business_id)
    .maybeSingle();

  if (sessionError || !session) {
    redirect("/dashboard/profile?error=No+se+encontró+la+sesión+de+checkout");
  }

  if (session.status !== "pending") {
    redirect("/dashboard/profile?error=La+sesión+ya+no+está+pendiente");
  }

  const targetPlan = session.plan
    ? Array.isArray(session.plan)
      ? session.plan[0]
      : session.plan
    : null;

  if (!targetPlan) {
    redirect("/dashboard/profile?error=No+se+pudo+leer+el+plan+de+la+sesión");
  }

  const updatedAmount = getAmountByCycle(
    Number(targetPlan.price_monthly || 0),
    billingCycle
  );

  const { error: updateError } = await supabase
    .from("subscription_checkout_sessions")
    .update({
      amount: updatedAmount,
      billing_cycle: billingCycle,
    })
    .eq("id", session.id);

  if (updateError) {
    redirect(
      `/dashboard/profile?error=${encodeURIComponent(
        updateError.message || "No se pudo actualizar el checkout"
      )}`
    );
  }

  revalidatePath(`/dashboard/checkout/${session.id}`);
  redirect(`/dashboard/checkout/${session.id}`);
}