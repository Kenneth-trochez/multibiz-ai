import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { checkStaffAvailability } from "@/lib/appointments/checkStaffAvailability";
import {
  ensureAiBookingEnabled,
  extractVapiContext,
  resolveBusinessFromCall,
} from "@/lib/vapi/resolveBusinessFromCall";

const HONDURAS_UTC_OFFSET = "-06:00";
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

// ✅ NEW: API key protection (simple)
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

function buildAppointmentIso(date: string, hour: number, minute: number) {
  const hh = String(hour).padStart(2, "0");
  const mm = String(minute).padStart(2, "0");
  return `${date}T${hh}:${mm}:00${HONDURAS_UTC_OFFSET}`;
}

function buildRequestedIso(date: string, time: string) {
  return `${date}T${time}:00${HONDURAS_UTC_OFFSET}`;
}

function toTimeLabel(hour: number, minute: number) {
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

function timeToMinutes(value: string) {
  const [hours, minutes] = String(value).slice(0, 5).split(":").map(Number);
  return hours * 60 + minutes;
}

function getWeekdayKeyFromDate(date: string) {
  const jsDate = new Date(`${date}T12:00:00${HONDURAS_UTC_OFFSET}`);
  return WEEKDAY_KEYS[jsDate.getDay()];
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
    // ✅ NEW: protect endpoint
    const unauthorized = requireVapiKey(request);
    if (unauthorized) return unauthorized;

    const payload = await request.json().catch(() => ({}));
    const { assistantId, phoneNumberId } = extractVapiContext(payload);

    const serviceId = String(payload?.serviceId || "").trim();
    const requestedDate = String(payload?.date || "").trim();
    const requestedTime = String(payload?.time || "").trim(); // optional
    const staffId = String(payload?.staffId || "").trim(); // optional

    if (!serviceId || !requestedDate) {
      throw new Error("serviceId y date son obligatorios");
    }

    const ctx = await resolveBusinessFromCall({
      assistantId,
      phoneNumberId,
    });

    await ensureAiBookingEnabled(ctx.businessId);

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

    if (serviceError || !service) {
      throw new Error("No se encontró el servicio solicitado");
    }
    if (settingsError) {
      throw new Error("No se pudo leer la configuración del negocio");
    }
    if (staffError) {
      throw new Error("No se pudo leer el staff del negocio");
    }

    const timezone = settings?.timezone || "America/Tegucigalpa";
    if (timezone !== "America/Tegucigalpa") {
      throw new Error("Por ahora solo se soporta America/Tegucigalpa");
    }

    const workdayStartTime = String(settings?.workday_start_time || "08:00").slice(0, 5);
    const workdayEndTime = String(settings?.workday_end_time || "17:00").slice(0, 5);
    const workdays = Array.isArray(settings?.workdays)
      ? settings.workdays
      : ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];

    const weekdayKey = getWeekdayKeyFromDate(requestedDate);

    if (!workdays.includes(weekdayKey)) {
      return NextResponse.json({
        ok: true,
        mode: "closed_day",
        available: false,
        date: requestedDate,
        reason: "El negocio no atiende ese día",
        schedule: { timezone, workday_start_time: workdayStartTime, workday_end_time: workdayEndTime, workdays },
      });
    }

    const workdayStartMinutes = timeToMinutes(workdayStartTime);
    const workdayEndMinutes = timeToMinutes(workdayEndTime);

    const allStaff = activeStaff || [];
    if (allStaff.length === 0) {
      throw new Error("No hay staff activo para ofrecer disponibilidad");
    }

    const selectedStaff = staffId
      ? allStaff.filter((member) => member.id === staffId)
      : allStaff;

    if (staffId && selectedStaff.length === 0) {
      throw new Error("El staff seleccionado no existe o no está activo");
    }

    // ✅ CASE 1: user provided a specific time
    if (requestedTime) {
      const requestedMinutes = timeToMinutes(requestedTime);

      if (
        !isTimeInsideWorkday({
          requestedMinutes,
          workdayStartMinutes,
          workdayEndMinutes,
        })
      ) {
        return NextResponse.json({
          ok: true,
          mode: staffId ? "single_time" : "single_time_any_staff",
          available: false,
          requested: {
            date: requestedDate,
            time: requestedTime,
            appointment_at: buildRequestedIso(requestedDate, requestedTime),
          },
          reason: "La hora solicitada está fuera del horario del negocio",
          schedule: { timezone, workday_start_time: workdayStartTime, workday_end_time: workdayEndTime, workdays },
        });
      }

      const appointmentAt = buildRequestedIso(requestedDate, requestedTime);

      // If staffId provided -> check that one staff
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
          requested: { date: requestedDate, time: requestedTime, appointment_at: appointmentAt },
          service: {
            id: service.id,
            name: service.name,
            duration_minutes: Number(service.duration_minutes || 0),
          },
          staff: selectedStaff[0]
            ? { id: selectedStaff[0].id, display_name: selectedStaff[0].display_name, specialty: selectedStaff[0].specialty || null }
            : null,
          conflict: availability.conflict,
        });
      }

      // ✅ NEW: no staffId -> check all staff and return who is available
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
        requested: { date: requestedDate, time: requestedTime, appointment_at: appointmentAt },
        service: {
          id: service.id,
          name: service.name,
          duration_minutes: Number(service.duration_minutes || 0),
        },
        availableStaff,
        schedule: { timezone, workday_start_time: workdayStartTime, workday_end_time: workdayEndTime, workdays },
      });
    }

    // ✅ CASE 2: no time -> return daily slots per staff (your original behavior)
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
        const appointmentAt = buildAppointmentIso(requestedDate, hour, minute);

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

    return NextResponse.json(
      {
        ok: false,
        error: message,
      },
      { status: 400 }
    );
  }
}