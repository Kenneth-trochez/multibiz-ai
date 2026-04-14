import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const businessId = request.nextUrl.searchParams.get("business_id");

    if (!businessId) {
      return NextResponse.json(
        { error: "business_id es obligatorio" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("api_lab_items")
      .select("*")
      .eq("business_id", businessId)
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json(
        { error: "Error al obtener los registros", details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ data }, { status: 200 });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Error inesperado";

    return NextResponse.json(
      { error: "No se pudieron obtener los registros", details: message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await request.json();

    const businessId =
      typeof body.business_id === "string" ? body.business_id.trim() : "";
    const title = typeof body.title === "string" ? body.title.trim() : "";
    const description =
      typeof body.description === "string" ? body.description.trim() : null;
    const status = body.status === "inactive" ? "inactive" : "active";

    if (!businessId) {
      return NextResponse.json(
        { error: "El campo business_id es obligatorio" },
        { status: 400 }
      );
    }

    if (!title) {
      return NextResponse.json(
        { error: "El campo title es obligatorio" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("api_lab_items")
      .insert({
        business_id: businessId,
        title,
        description,
        status,
      })
      .select("*")
      .single();

    if (error) {
      return NextResponse.json(
        { error: "Error al crear el registro", details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { message: "Registro creado correctamente", data },
      { status: 201 }
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Error inesperado";

    return NextResponse.json(
      { error: "No se pudo crear el registro", details: message },
      { status: 500 }
    );
  }
}