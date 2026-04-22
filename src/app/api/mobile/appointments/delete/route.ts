import { NextResponse } from "next/server";
import { getMobileRequestContext } from "@/lib/mobile/getMobileRequestContext";
import { deleteAppointmentService } from "@/lib/appointments/deleteAppointmentService";

export async function POST(request: Request) {
  try {
    const ctx = await getMobileRequestContext(request);
    const body = await request.json();

    const businessId = String(body.businessId || "").trim();
    const appointmentId = String(body.appointment_id || "").trim();

    if (!businessId || businessId !== ctx.business.id) {
      return NextResponse.json(
        { ok: false, error: "Business inválido" },
        { status: 403 }
      );
    }

    const result = await deleteAppointmentService({
      businessId,
      appointmentId,
    });

    return NextResponse.json({
      ok: true,
      appointmentId: result.appointmentId,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "No se pudo eliminar la cita";

    const status =
      message === "Unauthorized"
        ? 401
        : message === "Forbidden"
          ? 403
          : 400;

    return NextResponse.json({ ok: false, error: message }, { status });
  }
}