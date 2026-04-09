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

export async function POST(request: Request) {
  try {
    const payload = await request.json().catch(() => ({}));
    const { assistantId, phoneNumberId } = extractVapiContext(payload);

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
    });

    await ensureAiBookingEnabled(ctx.businessId);

    const supabase = createAdminClient();

    const [{ data: service, error: serviceError }, { data: settings, error: settingsError }] =
      await Promise.all([
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
      ]);

    if (serviceError || !service) {
      throw new Error("No se encontró el servicio solicitado");
    }

    if (settingsError) {
      throw new Error("No se pudo leer la configuración del negocio");
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
      });
    }

    const workdayStartMinutes = timeToMinutes(workdayStartTime);
    const workdayEndMinutes = timeToMinutes(workdayEndTime);

    const { data: activeStaff, error: staffError } = await supabase
      .from("staff")
      .select("id, display_name, specialty")
      .eq("business_id", ctx.businessId)
      .eq("active", true)
      .order("display_name", { ascending: true });

    if (staffError) {
      throw new Error("No se pudo leer el staff del negocio");
    }

    const selectedStaff = staffId
      ? (activeStaff || []).filter((member) => member.id === staffId)
      : activeStaff || [];

    if (staffId && selectedStaff.length === 0) {
      throw new Error("El staff seleccionado no existe o no está activo");
    }

    if (requestedTime) {
      if (!staffId) {
        throw new Error("Para validar una hora específica debes enviar staffId");
      }

      const requestedMinutes = timeToMinutes(requestedTime);

      if (
        requestedMinutes < workdayStartMinutes ||
        requestedMinutes >= workdayEndMinutes
      ) {
        return NextResponse.json({
          ok: true,
          mode: "single_time",
          available: false,
          requested: {
            date: requestedDate,
            time: requestedTime,
            appointment_at: buildRequestedIso(requestedDate, requestedTime),
          },
          reason: "La hora solicitada está fuera del horario del negocio",
        });
      }

      const appointmentAt = buildRequestedIso(requestedDate, requestedTime);

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
        service: {
          id: service.id,
          name: service.name,
          duration_minutes: Number(service.duration_minutes || 0),
        },
        conflict: availability.conflict,
      });
    }

    if (selectedStaff.length === 0) {
      throw new Error("No hay staff activo para ofrecer disponibilidad");
    }

    const result = [];

    for (const member of selectedStaff) {
      const slots: Array<{
        time: string;
        appointment_at: string;
      }> = [];

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