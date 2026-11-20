import { NextResponse } from "next/server";
import { requireStudent } from "@/lib/server/auth";
import { ApiError, handleRoute, readJson } from "@/lib/server/http";

export const dynamic = "force-dynamic";

const missingTable = (error: { code?: string; message?: string }) => error.code === "42P01" || error.code === "PGRST205" || (/informativos_lidos/.test(error.message ?? "") && /(does not exist|could not find)/i.test(error.message ?? ""));

// Informativos que o aluno já leu (Trilha dos Informativos STF/STJ).
export function GET() {
  return handleRoute("informativos.lidos", async () => {
    const { supabase, user } = await requireStudent();
    const { data, error } = await supabase.from("informativos_lidos").select("tribunal, numero").eq("user_id", user.id);
    if (error) {
      if (missingTable(error)) return NextResponse.json({ disponivel: false, lidos: [] });
      throw new Error(`Falha ao ler os informativos lidos: ${error.message}`);
    }
    return NextResponse.json({ disponivel: true, lidos: (data ?? []).map((row) => `${row.tribunal}-${row.numero}`) }, { headers: { "cache-control": "private, no-store" } });
  });
}

// Marca ou desmarca um informativo como lido.
export function PUT(request: Request) {
  return handleRoute("informativos.marcar", async () => {
    const { supabase, user } = await requireStudent();
    const body = await readJson(request);
    const tribunal = body.tribunal === "STF" || body.tribunal === "STJ" ? body.tribunal : null;
    const numero = typeof body.numero === "number" && Number.isInteger(body.numero) && body.numero > 0 && body.numero < 100000 ? body.numero : null;
    if (!tribunal || !numero) throw new ApiError(400, "invalid_request", "Informativo inválido.");
    if (typeof body.lido !== "boolean") throw new ApiError(400, "invalid_request", "Informe se o informativo foi lido.");
    const { error } = body.lido
      ? await supabase.from("informativos_lidos").upsert({ user_id: user.id, tribunal, numero, lido_em: new Date().toISOString() }, { onConflict: "user_id,tribunal,numero" })
      : await supabase.from("informativos_lidos").delete().eq("user_id", user.id).eq("tribunal", tribunal).eq("numero", numero);
    if (error) {
      if (missingTable(error)) throw new ApiError(503, "unavailable", "A marcação de informativos ainda não está disponível.");
      throw new Error(`Falha ao salvar o informativo: ${error.message}`);
    }
    return NextResponse.json({ tribunal, numero, lido: body.lido });
  });
}
