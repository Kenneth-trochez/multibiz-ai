import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendPushToBusinessMembers } from "@/lib/notifications/sendPushToBusinessMembers";

type BusinessRow = {
  id: string;
  name: string;
};

type SettingsRow = {
  business_id: string;
  timezone: string | null;
};

const DEFAULT_TIMEZONE = "America/Tegucigalpa";

function getLocalDateParts(timezone: string, date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);

  const get = (type: string) => parts.find((p) => p.type === type)?.value || "";

  return {
    year: Number(get("year")),
    month: Number(get("month")),
    day: Number(get("day")),
  };
}

function getYearMonth(year: number, month: number) {
  return `${year}-${String(month).padStart(2, "0")}`;
}

function addMonths(year: number, month: number, offset: number) {
  const date = new Date(Date.UTC(year, month - 1 + offset, 1));
  return {
    year: date.getUTCFullYear(),
    month: date.getUTCMonth() + 1,
    key: getYearMonth(date.getUTCFullYear(), date.getUTCMonth() + 1),
  };
}

function isLastDayOfMonth(year: number, month: number, day: number) {
  const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
  return day === lastDay;
}

function toLocalMonthStartUtcIso(
  year: number,
  month: number,
  timezone: string
) {
  const localDate = `${year}-${String(month).padStart(2, "0")}-01`;

  const initialUtc = new Date(`${localDate}T00:00:00.000Z`);

  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(initialUtc);

  const get = (type: string) => parts.find((p) => p.type === type)?.value || "0";

  const asIfUtc = Date.UTC(
    Number(get("year")),
    Number(get("month")) - 1,
    Number(get("day")),
    Number(get("hour")),
    Number(get("minute")),
    Number(get("second"))
  );

  const offsetMs = asIfUtc - initialUtc.getTime();

  return new Date(initialUtc.getTime() - offsetMs).toISOString();
}

function getMonthRangeUtc(year: number, month: number, timezone: string) {
  const next = addMonths(year, month, 1);

  return {
    startIso: toLocalMonthStartUtcIso(year, month, timezone),
    endIso: toLocalMonthStartUtcIso(next.year, next.month, timezone),
    startDate: `${year}-${String(month).padStart(2, "0")}-01`,
    endDate: `${next.year}-${String(next.month).padStart(2, "0")}-01`,
  };
}

function monthLabel(targetMonth: string) {
  const [year, month] = targetMonth.split("-").map(Number);

  return new Intl.DateTimeFormat("es-HN", {
    month: "long",
    year: "numeric",
  }).format(new Date(Date.UTC(year, month - 1, 1)));
}

async function countRows(
  supabase: ReturnType<typeof createAdminClient>,
  table: string,
  businessId: string,
  column: string,
  start: string,
  end: string
) {
  const { count, error } = await supabase
    .from(table)
    .select("id", { count: "exact", head: true })
    .eq("business_id", businessId)
    .gte(column, start)
    .lt(column, end);

  if (error) throw new Error(`${table}: ${error.message}`);

  return count || 0;
}

async function deleteRows(
  supabase: ReturnType<typeof createAdminClient>,
  table: string,
  businessId: string,
  column: string,
  start: string,
  end: string
) {
  const { error } = await supabase
    .from(table)
    .delete()
    .eq("business_id", businessId)
    .gte(column, start)
    .lt(column, end);

  if (error) throw new Error(`${table}: ${error.message}`);
}

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get("authorization") || "";
    const expected = `Bearer ${process.env.CRON_SECRET || ""}`;

    if (!process.env.CRON_SECRET) {
      return NextResponse.json(
        { ok: false, error: "Missing CRON_SECRET" },
        { status: 500 }
      );
    }

    if (authHeader !== expected) {
      return NextResponse.json(
        { ok: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const url = new URL(request.url);
    const dryRun = url.searchParams.get("dryRun") === "true";

    const supabase = createAdminClient();

    const { data: businesses, error: businessesError } = await supabase
      .from("businesses")
      .select("id, name");

    if (businessesError) {
      throw new Error(businessesError.message);
    }

    const { data: settingsRows, error: settingsError } = await supabase
      .from("business_settings")
      .select("business_id, timezone");

    if (settingsError) {
      throw new Error(settingsError.message);
    }

    const settingsByBusinessId = new Map<string, SettingsRow>();

    for (const row of (settingsRows || []) as SettingsRow[]) {
      settingsByBusinessId.set(row.business_id, row);
    }

    const results: any[] = [];

    for (const business of (businesses || []) as BusinessRow[]) {
      const settings = settingsByBusinessId.get(business.id);
      const timezone = settings?.timezone || DEFAULT_TIMEZONE;

      const local = getLocalDateParts(timezone);

      const shouldWarn = true;
      const shouldCleanup =true;

      const warningTarget = addMonths(local.year, local.month, -1);
      const cleanupTarget = addMonths(local.year, local.month, -2);

      const businessResult: any = {
        businessId: business.id,
        businessName: business.name,
        timezone,
        localDate: `${local.year}-${String(local.month).padStart(2, "0")}-${String(
          local.day
        ).padStart(2, "0")}`,
        warning: null,
        cleanup: null,
      };

      if (shouldWarn) {
        const targetMonth = warningTarget.key;

        const { error: runError } = dryRun
          ? { error: null }
          : await supabase.from("monthly_retention_runs").insert({
              business_id: business.id,
              action: "warning_sent",
              target_month: targetMonth,
            });

        const duplicate =
          runError &&
          (runError.code === "23505" ||
            runError.message?.toLowerCase().includes("duplicate"));

        if (!runError || duplicate) {
          if (!duplicate && !dryRun) {
            const title = "Exporta tus registros";
            const body = `Los registros de ${monthLabel(
              targetMonth
            )} se eliminarán pronto. Exporta tu balance a Excel para guardar una copia.`;

            await supabase.from("business_alerts").insert({
              business_id: business.id,
              type: "monthly_retention_warning",
              title,
              message: body,
              severity: "warning",
              metadata: {
                targetMonth,
                dryRun: false,
              },
            });

            await sendPushToBusinessMembers({
              businessId: business.id,
              title,
              body,
              data: {
                type: "monthly_retention_warning",
                targetMonth,
              },
            });
          }

          businessResult.warning = {
            targetMonth,
            status: duplicate ? "already_sent" : dryRun ? "dry_run" : "sent",
          };
        } else {
          throw new Error(`warning ${business.id}: ${runError.message}`);
        }
      }

      if (shouldCleanup) {
        const targetMonth = cleanupTarget.key;
        const range = getMonthRangeUtc(
          cleanupTarget.year,
          cleanupTarget.month,
          timezone
        );

        const counts = {
          appointments: await countRows(
            supabase,
            "appointments",
            business.id,
            "appointment_at",
            range.startIso,
            range.endIso
          ),
          sales: await countRows(
            supabase,
            "sales",
            business.id,
            "sale_at",
            range.startIso,
            range.endIso
          ),
          ai_usage_logs: await countRows(
            supabase,
            "ai_usage_logs",
            business.id,
            "usage_date",
            range.startDate,
            range.endDate
          ),
          ai_call_details: await countRows(
            supabase,
            "ai_call_details",
            business.id,
            "created_at",
            range.startIso,
            range.endIso
          ),
        };

        const { error: runError } = dryRun
          ? { error: null }
          : await supabase.from("monthly_retention_runs").insert({
              business_id: business.id,
              action: "cleanup_done",
              target_month: targetMonth,
            });

        const duplicate =
          runError &&
          (runError.code === "23505" ||
            runError.message?.toLowerCase().includes("duplicate"));

        if (!runError || duplicate) {
          if (!duplicate && !dryRun) {
            await deleteRows(
              supabase,
              "appointments",
              business.id,
              "appointment_at",
              range.startIso,
              range.endIso
            );

            await deleteRows(
              supabase,
              "sales",
              business.id,
              "sale_at",
              range.startIso,
              range.endIso
            );

            await deleteRows(
              supabase,
              "ai_usage_logs",
              business.id,
              "usage_date",
              range.startDate,
              range.endDate
            );

            await deleteRows(
              supabase,
              "ai_call_details",
              business.id,
              "created_at",
              range.startIso,
              range.endIso
            );

            await supabase.from("business_alerts").insert({
              business_id: business.id,
              type: "monthly_retention_cleanup_done",
              title: "Limpieza mensual completada",
              message: `Se eliminaron los registros antiguos de ${monthLabel(
                targetMonth
              )}.`,
              severity: "info",
              metadata: {
                targetMonth,
                counts,
              },
            });
          }

          businessResult.cleanup = {
            targetMonth,
            range,
            counts,
            status: duplicate ? "already_done" : dryRun ? "dry_run" : "deleted",
          };
        } else {
          throw new Error(`cleanup ${business.id}: ${runError.message}`);
        }
      }

      results.push(businessResult);
    }

    return NextResponse.json({
      ok: true,
      dryRun,
      businessesProcessed: results.length,
      results,
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