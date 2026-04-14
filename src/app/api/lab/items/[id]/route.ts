import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const supabase = await createClient();
    const { id } = await context.params;
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
      .eq("id", id)
      .eq("business_id", businessId)
      .maybeSingle();

    if (error) {
      return NextResponse.json(
        { error: "Error al obtener el registro", details: error.message },
        { status: 500 }
      );
    }

    if (!data) {
      return NextResponse.json(
        { error: "Registro no encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json({ data }, { status: 200 });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Error inesperado";

    return NextResponse.json(
      { error: "No se pudo obtener el registro", details: message },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest, context: RouteContext) {
  try {
    const supabase = await createClient();
    const { id } = await context.params;
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
      .update({
        title,
        description,
        status,
      })
      .eq("id", id)
      .eq("business_id", businessId)
      .select("*")
      .maybeSingle();

    if (error) {
      return NextResponse.json(
        { error: "Error al actualizar el registro", details: error.message },
        { status: 500 }
      );
    }

    if (!data) {
      return NextResponse.json(
        { error: "Registro no encontrado o sin permisos" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { message: "Registro actualizado correctamente", data },
      { status: 200 }
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Error inesperado";

    return NextResponse.json(
      { error: "No se pudo actualizar el registro", details: message },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const supabase = await createClient();
    const { id } = await context.params;
    const businessId = request.nextUrl.searchParams.get("business_id");

    if (!businessId) {
      return NextResponse.json(
        { error: "business_id es obligatorio" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("api_lab_items")
      .delete()
      .eq("id", id)
      .eq("business_id", businessId)
      .select("id")
      .maybeSingle();

    if (error) {
      return NextResponse.json(
        { error: "Error al eliminar el registro", details: error.message },
        { status: 500 }
      );
    }

    if (!data) {
      return NextResponse.json(
        { error: "Registro no encontrado o sin permisos" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { message: "Registro eliminado correctamente", id: data.id },
      { status: 200 }
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Error inesperado";

    return NextResponse.json(
      { error: "No se pudo eliminar el registro", details: message },
      { status: 500 }
    );
  }
}