import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { requirePlatformAdmin } from "@/lib/auth/requirePlatformAdmin";

type SearchParams = Promise<{
  page?: string;
}>;

type BusinessRow = {
  id: string;
  name: string;
  slug: string;
};

type PlanRow = {
  id: string;
  code: string;
  name: string;
};

type SubscriptionRow = {
  id: string;
  business_id: string;
  plan_id: string;
  status: string;
  billing_cycle: string;
  provider: string | null;
  provider_subscription_id: string | null;
  updated_at: string;
};

type AuditLogRow = {
  id: string;
  business_id: string;
  subscription_id: string | null;
  actor_user_id: string | null;
  event_type: string;
  old_plan_id: string | null;
  new_plan_id: string | null;
  old_status: string | null;
  new_status: string | null;
  old_billing_cycle: string | null;
  new_billing_cycle: string | null;
  provider: string | null;
  provider_reference: string | null;
  notes: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
};

function formatDate(value: string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleString("es-HN");
}

function eventBadgeClasses(eventType: string) {
  if (
    eventType === "payment_succeeded" ||
    eventType === "subscription_created" ||
    eventType === "plan_changed"
  ) {
    return "border-green-200 bg-green-50 text-green-700";
  }

  if (eventType === "payment_failed" || eventType === "business_deleted") {
    return "border-red-200 bg-red-50 text-red-700";
  }

  if (
    eventType === "status_changed" ||
    eventType === "billing_cycle_changed"
  ) {
    return "border-blue-200 bg-blue-50 text-blue-700";
  }

  return "border-[#e7d8c7] bg-[#f8efe5] text-[#6b5b4d]";
}

export default async function AdminSubscriptionsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  await requirePlatformAdmin();
  const params = await searchParams;

  const currentPage = Math.max(1, Number(params.page || "1") || 1);
  const logsPerBusiness = 2;

  const supabase = createAdminClient();

  const [businessesResult, plansResult, subscriptionsResult, logsResult] =
    await Promise.all([
      supabase
        .from("businesses")
        .select("id, name, slug")
        .order("created_at", { ascending: false }),

      supabase.from("subscription_plans").select("id, code, name"),

      supabase
        .from("business_subscriptions")
        .select(
          "id, business_id, plan_id, status, billing_cycle, provider, provider_subscription_id, updated_at"
        )
        .order("updated_at", { ascending: false }),

      supabase
        .from("subscription_audit_logs")
        .select(
          "id, business_id, subscription_id, actor_user_id, event_type, old_plan_id, new_plan_id, old_status, new_status, old_billing_cycle, new_billing_cycle, provider, provider_reference, notes, metadata, created_at"
        )
        .order("created_at", { ascending: false }),
    ]);

  const error =
    businessesResult.error ||
    plansResult.error ||
    subscriptionsResult.error ||
    logsResult.error;

  const businesses = (businessesResult.data || []) as BusinessRow[];
  const plans = (plansResult.data || []) as PlanRow[];
  const subscriptions = (subscriptionsResult.data || []) as SubscriptionRow[];
  const logs = (logsResult.data || []) as AuditLogRow[];

  const planMap = new Map(plans.map((plan) => [plan.id, plan]));
  const subscriptionMap = new Map(
    subscriptions.map((subscription) => [subscription.business_id, subscription])
  );

  const logsByBusiness = new Map<string, AuditLogRow[]>();
  for (const log of logs) {
    const current = logsByBusiness.get(log.business_id) || [];
    current.push(log);
    logsByBusiness.set(log.business_id, current);
  }

  let hasAnyNextPage = false;

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="rounded-[2rem] border border-[#e7d8c7] bg-[#fffaf3] p-5 shadow-sm sm:p-6">
        <h2 className="text-2xl font-bold text-[#2f241d] sm:text-3xl">
          Logs de suscripciones
        </h2>
        <p className="mt-2 text-sm text-[#6b5b4d]">
          Auditoría de cambios de plan, estado, ciclo de cobro y futuros eventos
          de pago.
        </p>
      </div>

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-red-700">
          Error cargando logs de suscripciones: {error.message}
        </div>
      ) : businesses.length === 0 ? (
        <div className="rounded-[1.5rem] border border-[#e7d8c7] bg-[#fffaf3] p-6 text-[#6b5b4d] shadow-sm">
          No hay negocios registrados.
        </div>
      ) : (
        <>
          <div className="space-y-4 sm:space-y-5">
            {businesses.map((business) => {
              const subscription = subscriptionMap.get(business.id);
              const currentPlan = subscription
                ? planMap.get(subscription.plan_id)
                : null;
              const businessLogs = logsByBusiness.get(business.id) || [];

              const totalPagesForBusiness = Math.max(
                1,
                Math.ceil(businessLogs.length / logsPerBusiness)
              );

              const safePage = Math.min(currentPage, totalPagesForBusiness);
              const start = (safePage - 1) * logsPerBusiness;
              const end = start + logsPerBusiness;
              const visibleLogs = businessLogs.slice(start, end);

              if (safePage < totalPagesForBusiness) {
                hasAnyNextPage = true;
              }

              return (
                <section
                  key={business.id}
                  className="rounded-[1.5rem] border border-[#e7d8c7] bg-[#fffaf3] p-4 shadow-sm sm:p-5"
                >
                  <div className="border-b border-[#ead9c8] pb-4">
                    <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                      <h3 className="text-lg font-semibold text-[#2f241d] sm:text-xl">
                        {business.name}
                      </h3>

                      <span className="rounded-full border border-[#e7d8c7] bg-[#f8efe5] px-3 py-1 text-xs text-[#6b5b4d]">
                        {business.slug}
                      </span>

                      {currentPlan && (
                        <span className="rounded-full border border-green-200 bg-green-50 px-3 py-1 text-xs text-green-700">
                          Plan actual: {currentPlan.name} ({currentPlan.code})
                        </span>
                      )}
                    </div>

                    <div className="mt-3 grid gap-2 text-sm text-[#6b5b4d] sm:grid-cols-2 xl:grid-cols-4">
                      <p className="break-all">
                        <span className="font-medium text-[#3f3128]">
                          Business ID:
                        </span>{" "}
                        {business.id}
                      </p>
                      <p>
                        <span className="font-medium text-[#3f3128]">
                          Status:
                        </span>{" "}
                        {subscription?.status || "—"}
                      </p>
                      <p>
                        <span className="font-medium text-[#3f3128]">
                          Billing cycle:
                        </span>{" "}
                        {subscription?.billing_cycle || "—"}
                      </p>
                      <p>
                        <span className="font-medium text-[#3f3128]">
                          Provider:
                        </span>{" "}
                        {subscription?.provider || "internal"}
                      </p>
                    </div>
                  </div>

                  {businessLogs.length === 0 ? (
                    <div className="pt-4 text-sm text-[#6b5b4d]">
                      Este negocio aún no tiene logs de suscripción.
                    </div>
                  ) : (
                    <div className="space-y-3 pt-5">
                      {visibleLogs.map((log) => {
                        const oldPlan = log.old_plan_id
                          ? planMap.get(log.old_plan_id)
                          : null;
                        const newPlan = log.new_plan_id
                          ? planMap.get(log.new_plan_id)
                          : null;

                        return (
                          <div
                            key={log.id}
                            className="rounded-[1.25rem] border border-[#ead9c8] bg-[#fff7ee] p-4"
                          >
                            <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
                              <div className="min-w-0 flex-1">
                                <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                                  <span
                                    className={`rounded-full border px-3 py-1 text-xs ${eventBadgeClasses(
                                      log.event_type
                                    )}`}
                                  >
                                    {log.event_type}
                                  </span>

                                  <span className="text-xs text-[#6b5b4d]">
                                    {formatDate(log.created_at)}
                                  </span>
                                </div>

                                <div className="mt-3 grid gap-2 text-sm text-[#6b5b4d] sm:grid-cols-2">
                                  <p>
                                    <span className="font-medium text-[#3f3128]">
                                      Plan:
                                    </span>{" "}
                                    {oldPlan || newPlan
                                      ? `${oldPlan?.code || "—"} → ${
                                          newPlan?.code || "—"
                                        }`
                                      : "—"}
                                  </p>

                                  <p>
                                    <span className="font-medium text-[#3f3128]">
                                      Status:
                                    </span>{" "}
                                    {(log.old_status || "—") +
                                      " → " +
                                      (log.new_status || "—")}
                                  </p>

                                  <p>
                                    <span className="font-medium text-[#3f3128]">
                                      Ciclo:
                                    </span>{" "}
                                    {(log.old_billing_cycle || "—") +
                                      " → " +
                                      (log.new_billing_cycle || "—")}
                                  </p>

                                  <p className="break-all">
                                    <span className="font-medium text-[#3f3128]">
                                      Provider ref:
                                    </span>{" "}
                                    {log.provider_reference || "—"}
                                  </p>

                                  <p>
                                    <span className="font-medium text-[#3f3128]">
                                      Provider:
                                    </span>{" "}
                                    {log.provider || "internal"}
                                  </p>

                                  <p className="break-all">
                                    <span className="font-medium text-[#3f3128]">
                                      Actor user ID:
                                    </span>{" "}
                                    {log.actor_user_id || "—"}
                                  </p>
                                </div>

                                {log.notes && (
                                  <div className="mt-3 rounded-xl border border-[#ead9c8] bg-white px-3 py-2 text-sm text-[#6b5b4d]">
                                    <span className="font-medium text-[#3f3128]">
                                      Nota:
                                    </span>{" "}
                                    {log.notes}
                                  </div>
                                )}
                              </div>

                              <div className="w-full rounded-[1.25rem] border border-[#ead9c8] bg-white p-4 xl:max-w-xs">
                                <p className="text-sm font-medium text-[#3f3128]">
                                  Resumen rápido
                                </p>

                                <div className="mt-3 space-y-2 text-sm text-[#6b5b4d]">
                                  <p>
                                    <span className="font-medium text-[#3f3128]">
                                      Subscription ID:
                                    </span>
                                  </p>
                                  <p className="break-all text-xs">
                                    {log.subscription_id || "—"}
                                  </p>

                                  <p>
                                    <span className="font-medium text-[#3f3128]">
                                      Log ID:
                                    </span>
                                  </p>
                                  <p className="break-all text-xs">{log.id}</p>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}

                      <div className="flex flex-col gap-3 border-t border-[#ead9c8] pt-4 sm:flex-row sm:items-center sm:justify-between">
                        <p className="text-sm text-[#6b5b4d]">
                          Página {safePage} de {totalPagesForBusiness}
                        </p>

                        <div className="flex items-center gap-2">
                          <Link
                            href={`/admin/subscriptions?page=${safePage - 1}`}
                            className={`rounded-xl px-4 py-2 text-sm font-medium transition ${
                              safePage <= 1
                                ? "pointer-events-none border border-[#ead9c8] bg-[#f8efe5] text-[#b09b8a] opacity-60"
                                : "border border-[#d9c6b2] bg-white text-[#2f241d] hover:bg-[#f3e5d8]"
                            }`}
                          >
                            ← Anterior
                          </Link>

                          <Link
                            href={`/admin/subscriptions?page=${safePage + 1}`}
                            className={`rounded-xl px-4 py-2 text-sm font-medium transition ${
                              safePage >= totalPagesForBusiness
                                ? "pointer-events-none border border-[#ead9c8] bg-[#f8efe5] text-[#b09b8a] opacity-60"
                                : "border border-[#d9c6b2] bg-white text-[#2f241d] hover:bg-[#f3e5d8]"
                            }`}
                          >
                            Siguiente →
                          </Link>
                        </div>
                      </div>
                    </div>
                  )}
                </section>
              );
            })}
          </div>

          <div className="flex flex-col gap-3 border-t border-[#ead9c8] pt-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-[#6b5b4d]">
              Navegación global de logs: página {currentPage}
            </p>

            <div className="flex items-center gap-2">
              <Link
                href={`/admin/subscriptions?page=${currentPage - 1}`}
                className={`rounded-xl px-4 py-2 text-sm font-medium transition ${
                  currentPage <= 1
                    ? "pointer-events-none border border-[#ead9c8] bg-[#f8efe5] text-[#b09b8a] opacity-60"
                    : "border border-[#d9c6b2] bg-white text-[#2f241d] hover:bg-[#f3e5d8]"
                }`}
              >
                ← Anterior
              </Link>

              <Link
                href={`/admin/subscriptions?page=${currentPage + 1}`}
                className={`rounded-xl px-4 py-2 text-sm font-medium transition ${
                  !hasAnyNextPage
                    ? "pointer-events-none border border-[#ead9c8] bg-[#f8efe5] text-[#b09b8a] opacity-60"
                    : "border border-[#d9c6b2] bg-white text-[#2f241d] hover:bg-[#f3e5d8]"
                }`}
              >
                Siguiente →
              </Link>
            </div>
          </div>
        </>
      )}
    </div>
  );
}