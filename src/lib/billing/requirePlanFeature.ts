import { redirect } from "next/navigation";
import { getCurrentPlan } from "./getCurrentPlan";

export async function requirePlanFeature(feature: string) {
  const plan = await getCurrentPlan();

  if (!plan) {
    redirect("/dashboard/upgrade?error=No+se+pudo+leer+el+plan+actual");
  }

  if (!plan.features?.[feature]) {
    redirect(`/dashboard/upgrade?feature=${encodeURIComponent(feature)}`);
  }

  return plan;
}