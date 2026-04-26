import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requirePlatformAdmin } from "@/lib/auth/requirePlatformAdmin";

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

export async function POST() {
  try {
    await requirePlatformAdmin();

    const supabase = createAdminClient();

    const { data: version, error: versionError } = await supabase
      .from("mobile_app_versions")
      .select("latest_version, minimum_supported_version, apk_url, message")
      .eq("platform", "android")
      .maybeSingle();

    if (versionError || !version) {
      return NextResponse.json(
        { ok: false, error: "No hay configuración de versión móvil" },
        { status: 404 }
      );
    }

    const { data: tokens, error: tokensError } = await supabase
      .from("mobile_push_tokens")
      .select("id, expo_push_token, app_version, platform, is_active")
      .eq("platform", "android")
      .eq("is_active", true);

    if (tokensError) {
      throw new Error(tokensError.message);
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

    const sent: any[] = [];
    const failed: any[] = [];

    for (const token of outdated) {
      try {
        const result = await sendExpoPush({
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

        sent.push({
          tokenId: token.id,
          appVersion: token.app_version,
          result,
        });
      } catch (error) {
        failed.push({
          tokenId: token.id,
          appVersion: token.app_version,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    return NextResponse.json({
      ok: true,
      latestVersion: version.latest_version,
      minimumSupportedVersion: version.minimum_supported_version,
      totalTokens: tokens?.length || 0,
      outdatedCount: outdated.length,
      sentCount: sent.length,
      failedCount: failed.length,
      sent,
      failed,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}