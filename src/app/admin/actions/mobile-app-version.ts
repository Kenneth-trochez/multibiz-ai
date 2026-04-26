"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requirePlatformAdmin } from "@/lib/auth/requirePlatformAdmin";
import { createAdminClient } from "@/lib/supabase/admin";

function clean(value: FormDataEntryValue | null) {
  return String(value || "").trim();
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

async function sendExpoPush({
  token,
  title,
  body,
  data,
}: {
  token: string;
  title: string;
  body: string;
  data: Record<string, string>;
}) {
  const response = await fetch("https://exp.host/--/api/v2/push/send", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Accept-Encoding": "gzip, deflate",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      to: token,
      sound: "default",
      title,
      body,
      data,
    }),
  });

  if (!response.ok) {
    throw new Error(`Expo push error: ${response.status}`);
  }

  return response.json();
}

export async function updateMobileAppVersionAction(
  formData: FormData
): Promise<void> {
  await requirePlatformAdmin();

  const platform = clean(formData.get("platform")) || "android";
  const latestVersion = clean(formData.get("latestVersion"));
  const minimumSupportedVersion = clean(formData.get("minimumSupportedVersion"));
  const apkUrl = clean(formData.get("apkUrl"));
  const message =
    clean(formData.get("message")) ||
    "Hay una nueva versión de MultiBiz AI. Actualiza para continuar.";

  if (!latestVersion || !minimumSupportedVersion || !apkUrl) {
    redirect("/admin/mobile-app-version?error=Datos+incompletos");
  }

  const supabase = createAdminClient();

  const { data: existing, error: findError } = await supabase
    .from("mobile_app_versions")
    .select("id")
    .eq("platform", platform)
    .maybeSingle();

  if (findError) {
    redirect(
      `/admin/mobile-app-version?error=${encodeURIComponent(findError.message)}`
    );
  }

  if (existing) {
    const { error } = await supabase
      .from("mobile_app_versions")
      .update({
        latest_version: latestVersion,
        minimum_supported_version: minimumSupportedVersion,
        apk_url: apkUrl,
        message,
        updated_at: new Date().toISOString(),
      })
      .eq("id", existing.id);

    if (error) {
      redirect(
        `/admin/mobile-app-version?error=${encodeURIComponent(error.message)}`
      );
    }
  } else {
    const { error } = await supabase.from("mobile_app_versions").insert({
      platform,
      latest_version: latestVersion,
      minimum_supported_version: minimumSupportedVersion,
      apk_url: apkUrl,
      message,
    });

    if (error) {
      redirect(
        `/admin/mobile-app-version?error=${encodeURIComponent(error.message)}`
      );
    }
  }

  revalidatePath("/admin");
  revalidatePath("/admin/mobile-app-version");
  redirect("/admin/mobile-app-version?success=version_updated");
}

export async function notifyOutdatedMobileAppUsersAction(): Promise<void> {
  await requirePlatformAdmin();

  const supabase = createAdminClient();

  const { data: version, error: versionError } = await supabase
    .from("mobile_app_versions")
    .select("latest_version, minimum_supported_version, apk_url, message")
    .eq("platform", "android")
    .maybeSingle();

  if (versionError || !version) {
    redirect("/admin/mobile-app-version?error=No+hay+configuracion+de+version+movil");
  }

  const { data: tokens, error: tokensError } = await supabase
    .from("mobile_push_tokens")
    .select("id, expo_push_token, app_version, platform, is_active")
    .eq("platform", "android")
    .eq("is_active", true);

  if (tokensError) {
    redirect(
      `/admin/mobile-app-version?error=${encodeURIComponent(tokensError.message)}`
    );
  }

  const outdated = (tokens || []).filter((token) => {
    const appVersion = token.app_version || "0.0.0";

    return (
      token.expo_push_token &&
      compareVersions(appVersion, version.minimum_supported_version) < 0
    );
  });

  const title = "Actualización requerida";
  const body =
    version.message ||
    `Hay una nueva versión de MultiBiz AI (${version.latest_version}). Actualiza para continuar.`;

  let sentCount = 0;
  let failedCount = 0;

  for (const token of outdated) {
    try {
      await sendExpoPush({
        token: token.expo_push_token,
        title,
        body,
        data: {
          type: "app_update_required",
          apkUrl: version.apk_url,
          latestVersion: version.latest_version,
          minimumSupportedVersion: version.minimum_supported_version,
        },
      });

      sentCount += 1;
    } catch {
      failedCount += 1;
    }
  }

  revalidatePath("/admin/mobile-app-version");

  redirect(
    `/admin/mobile-app-version?success=update_notified&sent=${sentCount}&failed=${failedCount}&outdated=${outdated.length}`
  );
}
