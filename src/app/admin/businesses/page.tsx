import { createAdminClient } from "@/lib/supabase/admin";
import { requirePlatformAdmin } from "@/lib/auth/requirePlatformAdmin";
import {
  deleteBusinessAction,
  updateBusinessSubscriptionAction,
} from "../actions/businesses";

type SearchParams = Promise<{
  error?: string;
  success?: string;
}>;

type BusinessRow = {
  id: string;
  name: string;
  slug: string;
  business_type: string;
  logo_url: string | null;
  primary_color: string;
  secondary_color: string;
  default_icon: string;
  phone: string | null;
  address: string | null;
  owner_user_id: string;
  theme: string;
  created_at: string;
  updated_at: string;
};

type SubscriptionPlanRow = {
  id: string;
  code: string;
  name: string;
  description: string | null;
  price_monthly: number;
  active: boolean;
};

type BusinessSubscriptionRow = {
  id: string;
  business_id: string;
  plan_id: string;
  status: "trialing" | "active" | "past_due" | "canceled" | "inactive";
  billing_cycle: "monthly" | "yearly";
  current_period_start: string;
  current_period_end: string | null;
  trial_ends_at: string | null;
  canceled_at: string | null;
  created_at: string;
  updated_at: string;
};

function formatDate(value: string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleString("es-HN");
}

export default async function AdminBusinessesPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  await requirePlatformAdmin();
  const params = await searchParams;

  const supabase = createAdminClient();

  const [businessesResult, plansResult, subscriptionsResult] = await Promise.all([
    supabase
      .from("businesses")
      .select(`
        id,
        name,
        slug,
        business_type,
        logo_url,
        primary_color,
        secondary_color,
        default_icon,
        phone,
        address,
        owner_user_id,
        theme,
        created_at,
        updated_at
      `)
      .order("created_at", { ascending: false }),

    supabase
      .from("subscription_plans")
      .select("id, code, name, description, price_monthly, active")
      .eq("active", true)
      .order("price_monthly", { ascending: true }),

    supabase
      .from("business_subscriptions")
      .select(`
        id,
        business_id,
        plan_id,
        status,
        billing_cycle,
        current_period_start,
        current_period_end,
        trial_ends_at,
        canceled_at,
        created_at,
        updated_at
      `)
      .in("status", ["trialing", "active", "past_due"])
      .order("created_at", { ascending: false }),
  ]);

  const businesses = (businessesResult.data || []) as BusinessRow[];
  const plans = (plansResult.data || []) as SubscriptionPlanRow[];
  const subscriptions = (subscriptionsResult.data || []) as BusinessSubscriptionRow[];

  const error =
    businessesResult.error || plansResult.error || subscriptionsResult.error;

  const planMap = new Map(plans.map((plan) => [plan.id, plan]));
  const subscriptionMap = new Map(
    subscriptions.map((subscription) => [subscription.business_id, subscription])
  );

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="rounded-[2rem] border border-[#e7d8c7] bg-[#fffaf3] p-5 shadow-sm sm:p-6">
        <h2 className="text-2xl font-bold text-[#2f241d] sm:text-3xl">Negocios</h2>
        <p className="mt-2 text-sm text-[#6b5b4d]">
          Administra negocios y su suscripción real del SaaS.
        </p>
      </div>

      {params.error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {params.error}
        </div>
      )}

      {params.success === "subscription_updated" && (
        <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          Suscripción actualizada correctamente.
        </div>
      )}

      {params.success === "business_deleted" && (
        <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          Negocio eliminado correctamente.
        </div>
      )}

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-red-700">
          Error cargando negocios: {error.message}
        </div>
      ) : businesses.length === 0 ? (
        <div className="rounded-[1.5rem] border border-[#e7d8c7] bg-[#fffaf3] p-6 text-[#6b5b4d] shadow-sm">
          No hay negocios registrados.
        </div>
      ) : (
        <div className="space-y-4">
          {businesses.map((business) => {
            const subscription = subscriptionMap.get(business.id);
            const currentPlan = subscription
              ? planMap.get(subscription.plan_id)
              : null;

            return (
              <div
                key={business.id}
                className="rounded-[1.5rem] border border-[#e7d8c7] bg-[#fffaf3] p-4 shadow-sm sm:p-5"
              >
                <div className="flex flex-col gap-4 xl:gap-5 2xl:flex-row 2xl:items-start 2xl:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                      <h3 className="text-base font-semibold text-[#2f241d] sm:text-lg">
                        {business.name}
                      </h3>

                      <span className="rounded-full border border-[#e7d8c7] bg-[#f8efe5] px-3 py-1 text-xs text-[#6b5b4d]">
                        {business.business_type}
                      </span>

                      <span className="rounded-full border border-[#e7d8c7] bg-[#f8efe5] px-3 py-1 text-xs text-[#6b5b4d]">
                        Tema: {business.theme}
                      </span>

                      {currentPlan && (
                        <span className="rounded-full border border-green-200 bg-green-50 px-3 py-1 text-xs text-green-700">
                          Plan: {currentPlan.name} ({currentPlan.code})
                        </span>
                      )}
                    </div>

                    <div className="mt-3 grid gap-2 text-sm text-[#6b5b4d] sm:grid-cols-2">
                      <p className="break-all"><span className="font-medium text-[#3f3128]">Business ID:</span> {business.id}</p>
                      <p className="break-all"><span className="font-medium text-[#3f3128]">Slug:</span> {business.slug}</p>
                      <p className="break-all"><span className="font-medium text-[#3f3128]">Owner user ID:</span> {business.owner_user_id}</p>
                      <p><span className="font-medium text-[#3f3128]">Icono:</span> {business.default_icon}</p>
                      <p><span className="font-medium text-[#3f3128]">Teléfono:</span> {business.phone || "—"}</p>
                      <p><span className="font-medium text-[#3f3128]">Dirección:</span> {business.address || "—"}</p>
                      <p><span className="font-medium text-[#3f3128]">Creado:</span> {formatDate(business.created_at)}</p>
                      <p><span className="font-medium text-[#3f3128]">Actualizado:</span> {formatDate(business.updated_at)}</p>
                      <p><span className="font-medium text-[#3f3128]">Status suscripción:</span> {subscription?.status || "Sin suscripción activa"}</p>
                      <p><span className="font-medium text-[#3f3128]">Ciclo:</span> {subscription?.billing_cycle || "—"}</p>
                      <p><span className="font-medium text-[#3f3128]">Inicio período:</span> {formatDate(subscription?.current_period_start || null)}</p>
                      <p><span className="font-medium text-[#3f3128]">Fin período:</span> {formatDate(subscription?.current_period_end || null)}</p>
                    </div>
                  </div>

                  <div className="grid w-full gap-4 xl:grid-cols-2 2xl:w-auto 2xl:grid-cols-[260px_minmax(320px,420px)]">
                    <div className="rounded-[1.5rem] border border-[#ead9c8] bg-[#fff7ee] p-4">
                      <p className="text-sm font-medium text-[#3f3128]">
                        Branding rápido
                      </p>

                      <div className="mt-3 space-y-3">
                        <div>
                          <p className="mb-1 text-xs text-[#6b5b4d]">Primary</p>
                          <div
                            className="h-10 w-full rounded-xl border border-[#ead9c8]"
                            style={{ backgroundColor: business.primary_color }}
                          />
                        </div>

                        <div>
                          <p className="mb-1 text-xs text-[#6b5b4d]">Secondary</p>
                          <div
                            className="h-10 w-full rounded-xl border border-[#ead9c8]"
                            style={{ backgroundColor: business.secondary_color }}
                          />
                        </div>

                        <div className="pt-1 text-xs text-[#6b5b4d]">
                          {business.logo_url ? "Tiene logo configurado" : "Sin logo"}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="rounded-[1.5rem] border border-[#ead9c8] bg-[#fff7ee] p-4">
                        <p className="mb-3 text-sm font-medium text-[#3f3128]">
                          Administrar suscripción
                        </p>

                        <form action={updateBusinessSubscriptionAction} className="space-y-3">
                          <input type="hidden" name="businessId" value={business.id} />

                          <div>
                            <label className="mb-1 block text-xs text-[#6b5b4d]">
                              Plan
                            </label>
                            <select
                              name="planId"
                              defaultValue={subscription?.plan_id || plans[0]?.id || ""}
                              className="w-full rounded-xl border border-[#d9c6b2] bg-white px-3 py-2 text-sm text-[#2f241d] outline-none"
                            >
                              {plans.map((plan) => (
                                <option key={plan.id} value={plan.id}>
                                  {plan.name} ({plan.code}) - USD{" "}
                                  {Number(plan.price_monthly).toFixed(2)}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div>
                            <label className="mb-1 block text-xs text-[#6b5b4d]">
                              Status
                            </label>
                            <select
                              name="status"
                              defaultValue={subscription?.status || "active"}
                              className="w-full rounded-xl border border-[#d9c6b2] bg-white px-3 py-2 text-sm text-[#2f241d] outline-none"
                            >
                              <option value="trialing">trialing</option>
                              <option value="active">active</option>
                              <option value="past_due">past_due</option>
                              <option value="canceled">canceled</option>
                              <option value="inactive">inactive</option>
                            </select>
                          </div>

                          <div>
                            <label className="mb-1 block text-xs text-[#6b5b4d]">
                              Billing cycle
                            </label>
                            <select
                              name="billingCycle"
                              defaultValue={subscription?.billing_cycle || "monthly"}
                              className="w-full rounded-xl border border-[#d9c6b2] bg-white px-3 py-2 text-sm text-[#2f241d] outline-none"
                            >
                              <option value="monthly">monthly</option>
                              <option value="yearly">yearly</option>
                            </select>
                          </div>

                          <button
                            type="submit"
                            className="w-full rounded-xl bg-[#a56a3a] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#8d582e] sm:w-auto"
                          >
                            Guardar suscripción
                          </button>
                        </form>
                      </div>

                      <div className="rounded-[1.5rem] border border-red-200 bg-red-50 p-4">
                        <p className="text-sm font-semibold text-red-700">
                          Zona de peligro
                        </p>
                        <p className="mt-2 text-sm text-red-700/90">
                          Esto eliminará el negocio y todos sus datos tenant relacionados.
                          No borra usuarios globales.
                        </p>

                        <form action={deleteBusinessAction} className="mt-4 space-y-3">
                          <input type="hidden" name="businessId" value={business.id} />

                          <div>
                            <label className="mb-1 block text-xs font-medium text-red-700">
                              Escribe exactamente el nombre del negocio para confirmar
                            </label>
                            <input
                              type="text"
                              name="confirmationName"
                              placeholder={business.name}
                              className="w-full rounded-xl border border-red-200 bg-white px-3 py-2 text-sm text-[#2f241d] outline-none"
                              required
                            />
                          </div>

                          <button
                            type="submit"
                            className="w-full rounded-xl border border-red-300 bg-red-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-700 sm:w-auto"
                          >
                            Eliminar negocio
                          </button>
                        </form>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}