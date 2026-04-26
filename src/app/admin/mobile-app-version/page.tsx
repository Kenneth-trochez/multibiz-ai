import Link from "next/link";
import { BellRing, CheckCircle2, Download, Smartphone, XCircle } from "lucide-react";
import { createAdminClient } from "@/lib/supabase/admin";
import { requirePlatformAdmin } from "@/lib/auth/requirePlatformAdmin";
import {
  notifyOutdatedMobileAppUsersAction,
  updateMobileAppVersionAction,
} from "../actions/mobile-app-version";

type SearchParams = Promise<{
  error?: string;
  success?: string;
  sent?: string;
  failed?: string;
  outdated?: string;
}>;

type MobileAppVersionRow = {
  latest_version: string;
  minimum_supported_version: string;
  apk_url: string;
  message: string;
  updated_at: string;
};

type MobilePushTokenRow = {
  id: string;
  business_id: string;
  user_id: string;
  role: string;
  expo_push_token: string;
  platform: string;
  app_version: string | null;
  is_active: boolean;
  last_seen_at: string;
};

type BusinessRow = {
  id: string;
  name: string;
  slug: string;
};

type ProfileRow = {
  id: string;
  email: string | null;
  full_name: string | null;
};

function formatDate(value: string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleString("es-HN");
}

function compareVersions(current: string, minimum: string) {
  const currentParts = current.split(".").map(Number);
  const minimumParts = minimum.split(".").map(Number);
  const length = Math.max(currentParts.length, minimumParts.length);

  for (let i = 0; i < length; i++) {
    const currentValue = currentParts[i] || 0;
    const minimumValue = minimumParts[i] || 0;

    if (currentValue < minimumValue) return -1;
    if (currentValue > minimumValue) return 1;
  }

  return 0;
}

function versionStatusClasses(isOutdated: boolean) {
  return isOutdated
    ? "border-red-200 bg-red-50 text-red-700"
    : "border-green-200 bg-green-50 text-green-700";
}

export default async function AdminMobileAppVersionPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  await requirePlatformAdmin();
  const params = await searchParams;

  const supabase = createAdminClient();

  const [
    versionResult,
    tokensResult,
    businessesResult,
    profilesResult,
  ] = await Promise.all([
    supabase
      .from("mobile_app_versions")
      .select("latest_version, minimum_supported_version, apk_url, message, updated_at")
      .eq("platform", "android")
      .maybeSingle(),

    supabase
      .from("mobile_push_tokens")
      .select(
        "id, business_id, user_id, role, expo_push_token, platform, app_version, is_active, last_seen_at"
      )
      .eq("platform", "android")
      .order("last_seen_at", { ascending: false }),

    supabase.from("businesses").select("id, name, slug"),

    supabase.from("profiles").select("id, email, full_name"),
  ]);

  const version = versionResult.data as MobileAppVersionRow | null;
  const tokens = (tokensResult.data || []) as MobilePushTokenRow[];
  const businesses = (businessesResult.data || []) as BusinessRow[];
  const profiles = (profilesResult.data || []) as ProfileRow[];

  const error =
    versionResult.error ||
    tokensResult.error ||
    businessesResult.error ||
    profilesResult.error;

  const businessMap = new Map(businesses.map((business) => [business.id, business]));
  const profileMap = new Map(profiles.map((profile) => [profile.id, profile]));

  const minimumSupportedVersion = version?.minimum_supported_version || "0.0.0";

  const activeTokens = tokens.filter((token) => token.is_active);
  const outdatedTokens = activeTokens.filter((token) =>
    compareVersions(token.app_version || "0.0.0", minimumSupportedVersion) < 0
  );
  const updatedTokens = activeTokens.filter((token) =>
    compareVersions(token.app_version || "0.0.0", minimumSupportedVersion) >= 0
  );

  const versionGroups = new Map<string, number>();

  for (const token of activeTokens) {
    const key = token.app_version || "Sin versión";
    versionGroups.set(key, (versionGroups.get(key) || 0) + 1);
  }

  const versionRows = [...versionGroups.entries()].sort((a, b) =>
    a[0].localeCompare(b[0])
  );

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="rounded-[2rem] border border-[#e7d8c7] bg-[#fffaf3] p-5 shadow-sm sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h2 className="text-2xl font-bold text-[#2f241d] sm:text-3xl">
              App móvil
            </h2>
            <p className="mt-2 text-sm text-[#6b5b4d]">
              Control de versión, dispositivos activos y notificación de actualización.
            </p>
          </div>

          <Link
            href="/app-download"
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#d9c6b2] bg-white px-4 py-2 text-sm font-medium text-[#2f241d] transition hover:bg-[#f3e5d8]"
          >
            <Download className="h-4 w-4" />
            Página descarga
          </Link>
        </div>
      </div>

      {params.error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {params.error}
        </div>
      )}

      {params.success === "version_updated" && (
        <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          Configuración de versión actualizada correctamente.
        </div>
      )}

      {params.success === "update_notified" && (
        <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          Notificación enviada. Desactualizados: {params.outdated || "0"} · Enviadas:{" "}
          {params.sent || "0"} · Fallidas: {params.failed || "0"}.
        </div>
      )}

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-red-700">
          Error cargando estado móvil: {error.message}
        </div>
      ) : (
        <>
          <section className="grid gap-4 md:grid-cols-4">
            <div className="rounded-[1.5rem] border border-[#e7d8c7] bg-[#fffaf3] p-5 shadow-sm">
              <p className="text-sm text-[#6b5b4d]">Última versión</p>
              <p className="mt-2 text-3xl font-bold text-[#2f241d]">
                {version?.latest_version || "—"}
              </p>
            </div>

            <div className="rounded-[1.5rem] border border-[#e7d8c7] bg-[#fffaf3] p-5 shadow-sm">
              <p className="text-sm text-[#6b5b4d]">Versión mínima</p>
              <p className="mt-2 text-3xl font-bold text-[#2f241d]">
                {version?.minimum_supported_version || "—"}
              </p>
            </div>

            <div className="rounded-[1.5rem] border border-[#e7d8c7] bg-[#fffaf3] p-5 shadow-sm">
              <p className="text-sm text-[#6b5b4d]">Dispositivos activos</p>
              <p className="mt-2 text-3xl font-bold text-[#2f241d]">
                {activeTokens.length}
              </p>
            </div>

            <div className="rounded-[1.5rem] border border-red-200 bg-red-50 p-5 shadow-sm">
              <p className="text-sm text-red-700">Desactualizados</p>
              <p className="mt-2 text-3xl font-bold text-red-700">
                {outdatedTokens.length}
              </p>
            </div>
          </section>

          <section className="grid gap-4 xl:grid-cols-[0.85fr_1.15fr]">
            <div className="rounded-[1.5rem] border border-[#e7d8c7] bg-[#fffaf3] p-5 shadow-sm">
              <h3 className="text-lg font-semibold text-[#2f241d]">
                Configuración Android
              </h3>
              <p className="mt-1 text-sm text-[#6b5b4d]">
                Esta configuración controla el bloqueo de versiones viejas en la app.
              </p>

              <form action={updateMobileAppVersionAction} className="mt-5 space-y-4">
                <input type="hidden" name="platform" value="android" />

                <div>
                  <label className="mb-1 block text-sm font-medium text-[#3f3128]">
                    Última versión disponible
                  </label>
                  <input
                    type="text"
                    name="latestVersion"
                    defaultValue={version?.latest_version || "1.0.0"}
                    className="w-full rounded-xl border border-[#d9c6b2] bg-white px-3 py-2 text-sm text-[#2f241d] outline-none"
                    placeholder="1.0.1"
                    required
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-[#3f3128]">
                    Versión mínima permitida
                  </label>
                  <input
                    type="text"
                    name="minimumSupportedVersion"
                    defaultValue={version?.minimum_supported_version || "1.0.0"}
                    className="w-full rounded-xl border border-[#d9c6b2] bg-white px-3 py-2 text-sm text-[#2f241d] outline-none"
                    placeholder="1.0.1"
                    required
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-[#3f3128]">
                    URL APK
                  </label>
                  <input
                    type="url"
                    name="apkUrl"
                    defaultValue={version?.apk_url || ""}
                    className="w-full rounded-xl border border-[#d9c6b2] bg-white px-3 py-2 text-sm text-[#2f241d] outline-none"
                    placeholder="https://github.com/.../multibiz-ai-latest.apk"
                    required
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-[#3f3128]">
                    Mensaje de actualización
                  </label>
                  <textarea
                    name="message"
                    defaultValue={
                      version?.message ||
                      "Hay una nueva versión de MultiBiz AI. Actualiza para continuar."
                    }
                    rows={4}
                    className="w-full rounded-xl border border-[#d9c6b2] bg-white px-3 py-2 text-sm text-[#2f241d] outline-none"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full rounded-xl bg-[#a56a3a] px-4 py-2.5 text-sm font-medium text-white transition hover:bg-[#8d582e]"
                >
                  Guardar configuración
                </button>
              </form>

              <form action={notifyOutdatedMobileAppUsersAction} className="mt-3">
                <button
                  type="submit"
                  disabled={outdatedTokens.length === 0}
                  className={`inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition ${
                    outdatedTokens.length === 0
                      ? "cursor-not-allowed bg-zinc-200 text-zinc-500"
                      : "bg-[#4b7bec] text-white hover:bg-[#3867d6]"
                  }`}
                >
                  <BellRing className="h-4 w-4" />
                  Notificar actualización a desactualizados
                </button>
              </form>

              <p className="mt-3 text-xs leading-5 text-[#6b5b4d]">
                El botón solo envía push a dispositivos activos cuya versión sea menor que la mínima.
              </p>
            </div>

            <div className="space-y-4">
              <div className="rounded-[1.5rem] border border-[#e7d8c7] bg-[#fffaf3] p-5 shadow-sm">
                <h3 className="text-lg font-semibold text-[#2f241d]">
                  Versiones instaladas
                </h3>

                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  {versionRows.length === 0 ? (
                    <p className="text-sm text-[#6b5b4d]">No hay dispositivos registrados.</p>
                  ) : (
                    versionRows.map(([appVersion, count]) => {
                      const isOutdated =
                        compareVersions(appVersion === "Sin versión" ? "0.0.0" : appVersion, minimumSupportedVersion) < 0;

                      return (
                        <div
                          key={appVersion}
                          className={`rounded-xl border px-4 py-3 text-sm ${versionStatusClasses(isOutdated)}`}
                        >
                          <div className="flex items-center justify-between gap-3">
                            <span className="font-semibold">{appVersion}</span>
                            <span>{count} dispositivo(s)</span>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              <div className="rounded-[1.5rem] border border-[#e7d8c7] bg-[#fffaf3] p-5 shadow-sm">
                <h3 className="text-lg font-semibold text-[#2f241d]">
                  Dispositivos
                </h3>
                <p className="mt-1 text-sm text-[#6b5b4d]">
                  Tokens registrados desde la app móvil.
                </p>

                <div className="mt-4 space-y-3">
                  {activeTokens.length === 0 ? (
                    <p className="text-sm text-[#6b5b4d]">No hay dispositivos activos.</p>
                  ) : (
                    activeTokens.map((token) => {
                      const business = businessMap.get(token.business_id);
                      const profile = profileMap.get(token.user_id);
                      const appVersion = token.app_version || "0.0.0";
                      const isOutdated =
                        compareVersions(appVersion, minimumSupportedVersion) < 0;

                      return (
                        <div
                          key={token.id}
                          className="rounded-[1.25rem] border border-[#ead9c8] bg-[#fff7ee] p-4"
                        >
                          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <span
                                  className={`rounded-full border px-3 py-1 text-xs ${versionStatusClasses(isOutdated)}`}
                                >
                                  {isOutdated ? "Desactualizada" : "Actualizada"}
                                </span>

                                <span className="rounded-full border border-[#e7d8c7] bg-white px-3 py-1 text-xs text-[#6b5b4d]">
                                  {token.role}
                                </span>
                              </div>

                              <div className="mt-3 grid gap-2 text-sm text-[#6b5b4d] sm:grid-cols-2">
                                <p>
                                  <span className="font-medium text-[#3f3128]">Versión:</span>{" "}
                                  {token.app_version || "—"}
                                </p>
                                <p>
                                  <span className="font-medium text-[#3f3128]">Último uso:</span>{" "}
                                  {formatDate(token.last_seen_at)}
                                </p>
                                <p className="break-all">
                                  <span className="font-medium text-[#3f3128]">Usuario:</span>{" "}
                                  {profile?.email || profile?.full_name || token.user_id}
                                </p>
                                <p className="break-all">
                                  <span className="font-medium text-[#3f3128]">Negocio:</span>{" "}
                                  {business?.name || token.business_id}
                                </p>
                              </div>
                            </div>

                            <div className="rounded-xl border border-[#ead9c8] bg-white px-3 py-2 text-xs text-[#6b5b4d] lg:max-w-xs">
                              <p className="font-medium text-[#3f3128]">Token ID</p>
                              <p className="mt-1 break-all">{token.id}</p>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
