import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { enforceAiUsagePolicy } from "@/lib/billing/enforceAiUsagePolicy";
import { checkStaffAvailability } from "@/lib/appointments/checkStaffAvailability";
import {
  ensureAiBookingEnabled,
  extractVapiContext,
  resolveBusinessFromCall,
} from "@/lib/vapi/resolveBusinessFromCall";

const SLOT_INTERVAL_MINUTES = 30;

const WEEKDAY_KEYS = [
  "sunday",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
] as const;

function requireVapiKey(request: Request) {
  const key = request.headers.get("x-vapi-key") || "";
  const expected = process.env.VAPI_INTERNAL_KEY || "";

  if (!expected) {
    return NextResponse.json(
      { ok: false, error: "Server misconfigured: missing VAPI_INTERNAL_KEY" },
      { status: 500 }
    );
  }

  if (key !== expected) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  return null;
}

function getDateTimePartsInTimezone(date: Date, timezone: string) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);

  const year = Number(parts.find((p) => p.type === "year")?.value ?? "0");
  const month = Number(parts.find((p) => p.type === "month")?.value ?? "0");
  const day = Number(parts.find((p) => p.type === "day")?.value ?? "0");
  const hour = Number(parts.find((p) => p.type === "hour")?.value ?? "0");
  const minute = Number(parts.find((p) => p.type === "minute")?.value ?? "0");
  const second = Number(parts.find((p) => p.type === "second")?.value ?? "0");

  return { year, month, day, hour, minute, second };
}

function buildAppointmentIso(
  date: string,
  hour: number,
  minute: number,
  timezone: string
) {
  const hh = String(hour).padStart(2, "0");
  const mm = String(minute).padStart(2, "0");
  return buildRequestedIso(date, `${hh}:${mm}`, timezone);
}

function buildRequestedIso(date: string, time: string, timezone: string) {
  const [year, month, day] = date.split("-").map(Number);
  const [hour, minute] = time.split(":").map(Number);

  let guess = new Date(Date.UTC(year, month - 1, day, hour, minute, 0));

  for (let i = 0; i < 3; i += 1) {
    const local = getDateTimePartsInTimezone(guess, timezone);

    const targetLocalMs = Date.UTC(year, month - 1, day, hour, minute, 0);
    const currentLocalMs = Date.UTC(
      local.year,
      local.month - 1,
      local.day,
      local.hour,
      local.minute,
      local.second
    );

    const diffMs = targetLocalMs - currentLocalMs;

    if (diffMs === 0) break;

    guess = new Date(guess.getTime() + diffMs);
  }

  return guess.toISOString();
}

function toTimeLabel(hour: number, minute: number) {
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

function timeToMinutes(value: string) {
  const [hours, minutes] = String(value).slice(0, 5).split(":").map(Number);
  return hours * 60 + minutes;
}

function getWeekdayKeyFromDate(date: string, timezone: string) {
  const localNoonIso = buildRequestedIso(date, "12:00", timezone);
  const jsDate = new Date(localNoonIso);
  return WEEKDAY_KEYS[jsDate.getUTCDay()];
}

function isTimeInsideWorkday(params: {
  requestedMinutes: number;
  workdayStartMinutes: number;
  workdayEndMinutes: number;
}) {
  const { requestedMinutes, workdayStartMinutes, workdayEndMinutes } = params;
  return !(requestedMinutes < workdayStartMinutes || requestedMinutes >= workdayEndMinutes);
}

export async function POST(request: Request) {
  try {
    const unauthorized = requireVapiKey(request);
    if (unauthorized) return unauthorized;

    const payload = await request.json().catch(() => ({}));
    const { assistantId, phoneNumberId, callId } = extractVapiContext(payload);

    const serviceId = String(payload?.serviceId || "").trim();
    const requestedDate = String(payload?.date || "").trim();
    const requestedTime = String(payload?.time || "").trim();
    const staffId = String(payload?.staffId || "").trim();

    if (!serviceId || !requestedDate) {
      throw new Error("serviceId y date son obligatorios");
    }

    const ctx = await resolveBusinessFromCall({
      assistantId,
      phoneNumberId,
      callId,
    });

    await ensureAiBookingEnabled(ctx.businessId);

    const usagePolicy = await enforceAiUsagePolicy(ctx.businessId);

    if (!usagePolicy.allowed) {
      return NextResponse.json(
        {
          ok: false,
          error: usagePolicy.warning,
          usage: usagePolicy,
        },
        { status: 402 }
      );
    }

    const supabase = createAdminClient();

    const [
      { data: service, error: serviceError },
      { data: settings, error: settingsError },
      { data: activeStaff, error: staffError },
    ] = await Promise.all([
      supabase
        .from("services")
        .select("id, name, duration_minutes, active")
        .eq("business_id", ctx.businessId)
        .eq("id", serviceId)
        .eq("active", true)
        .maybeSingle(),

      supabase
        .from("business_settings")
        .select("timezone, workday_start_time, workday_end_time, workdays")
        .eq("business_id", ctx.businessId)
        .maybeSingle(),

      supabase
        .from("staff")
        .select("id, display_name, specialty, active")
        .eq("business_id", ctx.businessId)
        .eq("active", true)
        .order("display_name", { ascending: true }),
    ]);

    if (serviceError || !service) throw new Error("No se encontró el servicio solicitado");
    if (settingsError) throw new Error("No se pudo leer la configuración del negocio");
    if (staffError) throw new Error("No se pudo leer el staff del negocio");

    const timezone = settings?.timezone || "America/Tegucigalpa";

    const workdayStartTime = String(settings?.workday_start_time || "08:00").slice(0, 5);
    const workdayEndTime = String(settings?.workday_end_time || "17:00").slice(0, 5);
    const workdays = Array.isArray(settings?.workdays)
      ? settings.workdays
      : ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];

    const weekdayKey = getWeekdayKeyFromDate(requestedDate, timezone);

    if (!workdays.includes(weekdayKey)) {
      return NextResponse.json({
        ok: true,
        mode: "closed_day",
        available: false,
        date: requestedDate,
        reason: "El negocio no atiende ese día",
        usage: usagePolicy,
        schedule: {
          timezone,
          workday_start_time: workdayStartTime,
          workday_end_time: workdayEndTime,
          workdays,
        },
      });
    }

    const workdayStartMinutes = timeToMinutes(workdayStartTime);
    const workdayEndMinutes = timeToMinutes(workdayEndTime);

    const allStaff = activeStaff || [];
    if (allStaff.length === 0) throw new Error("No hay staff activo para ofrecer disponibilidad");

    const selectedStaff = staffId ? allStaff.filter((m) => m.id === staffId) : allStaff;
    if (staffId && selectedStaff.length === 0) {
      throw new Error("El staff seleccionado no existe o no está activo");
    }

    if (requestedTime) {
      const requestedMinutes = timeToMinutes(requestedTime);

      if (!isTimeInsideWorkday({ requestedMinutes, workdayStartMinutes, workdayEndMinutes })) {
        return NextResponse.json({
          ok: true,
          mode: staffId ? "single_time" : "single_time_any_staff",
          available: false,
          requested: {
            date: requestedDate,
            time: requestedTime,
            appointment_at: buildRequestedIso(requestedDate, requestedTime, timezone),
          },
          reason: "La hora solicitada está fuera del horario del negocio",
          usage: usagePolicy,
          schedule: {
            timezone,
            workday_start_time: workdayStartTime,
            workday_end_time: workdayEndTime,
            workdays,
          },
        });
      }

      const appointmentAt = buildRequestedIso(requestedDate, requestedTime, timezone);

      if (staffId) {
        const availability = await checkStaffAvailability({
          businessId: ctx.businessId,
          staffId,
          serviceId,
          appointmentAt,
        });

        return NextResponse.json({
          ok: true,
          mode: "single_time",
          available: availability.available,
          requested: {
            date: requestedDate,
            time: requestedTime,
            appointment_at: appointmentAt,
          },
          usage: usagePolicy,
          service: {
            id: service.id,
            name: service.name,
            duration_minutes: Number(service.duration_minutes || 0),
          },
          staff: selectedStaff[0]
            ? {
                id: selectedStaff[0].id,
                display_name: selectedStaff[0].display_name,
                specialty: selectedStaff[0].specialty || null,
              }
            : null,
          conflict: availability.conflict,
        });
      }

      const checks = await Promise.all(
        selectedStaff.map(async (member) => {
          const availability = await checkStaffAvailability({
            businessId: ctx.businessId,
            staffId: member.id,
            serviceId,
            appointmentAt,
          });
          return { member, availability };
        })
      );

      const availableStaff = checks
        .filter((x) => x.availability.available)
        .map((x) => ({
          id: x.member.id,
          display_name: x.member.display_name,
          specialty: x.member.specialty || null,
        }));

      return NextResponse.json({
        ok: true,
        mode: "single_time_any_staff",
        available: availableStaff.length > 0,
        requested: {
          date: requestedDate,
          time: requestedTime,
          appointment_at: appointmentAt,
        },
        usage: usagePolicy,
        service: {
          id: service.id,
          name: service.name,
          duration_minutes: Number(service.duration_minutes || 0),
        },
        availableStaff,
        schedule: {
          timezone,
          workday_start_time: workdayStartTime,
          workday_end_time: workdayEndTime,
          workdays,
        },
      });
    }

    const result = [];

    for (const member of selectedStaff) {
      const slots: Array<{ time: string; appointment_at: string }> = [];

      for (
        let totalMinutes = workdayStartMinutes;
        totalMinutes < workdayEndMinutes;
        totalMinutes += SLOT_INTERVAL_MINUTES
      ) {
        const hour = Math.floor(totalMinutes / 60);
        const minute = totalMinutes % 60;
        const appointmentAt = buildAppointmentIso(
          requestedDate,
          hour,
          minute,
          timezone
        );

        const availability = await checkStaffAvailability({
          businessId: ctx.businessId,
          staffId: member.id,
          serviceId,
          appointmentAt,
        });

        if (availability.available) {
          slots.push({
            time: toTimeLabel(hour, minute),
            appointment_at: appointmentAt,
          });
        }
      }

      result.push({
        staff: {
          id: member.id,
          display_name: member.display_name,
          specialty: member.specialty || null,
        },
        slots,
      });
    }

    return NextResponse.json({
      ok: true,
      mode: "daily_slots",
      business: {
        id: ctx.business.id,
        name: ctx.business.name,
        slug: ctx.business.slug,
      },
      usage: usagePolicy,
      service: {
        id: service.id,
        name: service.name,
        duration_minutes: Number(service.duration_minutes || 0),
      },
      schedule: {
        timezone,
        workday_start_time: workdayStartTime,
        workday_end_time: workdayEndTime,
        workdays,
      },
      date: requestedDate,
      availability: result,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "No se pudo validar la disponibilidad";

    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}