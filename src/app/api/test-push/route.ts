import { NextResponse } from "next/server";
import { sendPushToBusinessMembers } from "@/lib/notifications/sendPushToBusinessMembers";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const businessId = String(body.businessId || "").trim();

    if (!businessId) {
      return NextResponse.json(
        { error: "businessId es requerido" },
        { status: 400 }
      );
    }

    const result = await sendPushToBusinessMembers({
      businessId,
      title: "Prueba de notificación",
      body: "Esta es una notificación push real de prueba.",
      data: {
        type: "test_push",
      },
    });

    return NextResponse.json({
      ok: true,
      result,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Error desconocido",
      },
      { status: 500 }
    );
  }
}