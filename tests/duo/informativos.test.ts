import { beforeEach, describe, expect, it, vi } from "vitest";
import { informativosFromRows, informativoUrl } from "@/lib/informativos";
import { informativosOf } from "@/lib/study-plan-view";

describe("Trilha dos Informativos do cronograma", () => {
  it("lê a tabela do Word (Ordem | Tribunal | Informativo) na ordem, sem cabeçalho", () => {
    const html = `<table><thead><tr><th colspan="3"><p><strong>TRILHA DOS INFORMATIVOS STF/STJ 2025 E 2026</strong></p></th></tr>
      <tr><th><p>Ordem a seguir</p></th><th><p>TRIBUNAL</p></th><th><p>INFORMATIVO</p></th></tr></thead><tbody>
      <tr><td><p><strong>2</strong></p></td><td><p><strong>  STF  </strong></p></td><td><p>Informativo <strong>1234</strong></p></td></tr>
      <tr><td><p><strong>1</strong></p></td><td><p><strong>  STF  </strong></p></td><td><p>Informativo <strong>1235</strong></p></td></tr>
      <tr><td><p><strong>3</strong></p></td><td><p><strong>  STJ  </strong></p></td><td><p>Informativo <strong>909</strong></p></td></tr></tbody></table>`;
    expect(informativosOf(html)).toEqual([{ ordem: 1, tribunal: "STF", numero: 1235 }, { ordem: 2, tribunal: "STF", numero: 1234 }, { ordem: 3, tribunal: "STJ", numero: 909 }]);
  });
  it("ignora linhas repetidas e fora do padrão", () => {
    expect(informativosFromRows([["1", "STF", "Informativo 1235"], ["1", "STF", "Informativo 1235"], ["Ordem", "Tribunal", "Informativo"], ["x", "TJRN", "Informativo 10"]])).toHaveLength(1);
  });
  it("link oficial de cada tribunal", () => {
    expect(informativoUrl({ tribunal: "STF", numero: 1235 })).toBe("https://www.stf.jus.br/arquivo/cms/informativoSTF/anexo/Informativo_PDF/Informativo_stf_1235.pdf");
    expect(informativoUrl({ tribunal: "STJ", numero: 909 })).toBe("https://processo.stj.jus.br/SCON/SearchBRS?b=INFJ&tipo=informativo&livre=@COD=%270909%27");
    expect(informativoUrl({ tribunal: "STJ", numero: 838 })).toContain("%270838%27");
  });
});

const student = vi.fn();
let rows: { user_id: string; tribunal: string; numero: number }[] = [];
let failure: { code?: string; message: string } | null = null;
const supabase = { from: () => {
  const filters: [string, unknown][] = [];
  const query = {
    select: () => query,
    eq: (column: string, value: unknown) => {
      filters.push([column, value]);
      if (filters.length === 1 && !deleting) return Promise.resolve(failure ? { data: null, error: failure } : { data: rows.filter((row) => row.user_id === value), error: null });
      if (deleting && filters.length === 3) { rows = rows.filter((row) => !filters.every(([c, v]) => row[c as keyof typeof row] === v)); return Promise.resolve({ error: failure }); }
      return query;
    },
    upsert: async (row: { user_id: string; tribunal: string; numero: number }) => { if (failure) return { error: failure }; rows = rows.filter((other) => !(other.user_id === row.user_id && other.tribunal === row.tribunal && other.numero === row.numero)); rows.push(row); return { error: null }; },
    delete: () => { deleting = true; return query; },
  };
  let deleting = false;
  return query;
} };
vi.mock("@/lib/server/auth", () => ({ requireStudent: () => student() }));
import { GET, PUT } from "@/app/api/informativos/route";
const put = (body: unknown) => PUT(new Request("http://app/api/informativos", { method: "PUT", body: JSON.stringify(body) }));

beforeEach(() => {
  vi.stubEnv("NEXT_PUBLIC_PIPELINE_V2", "true");
  student.mockResolvedValue({ supabase, user: { id: "u1" } });
  rows = []; failure = null;
});

describe("API dos informativos lidos", () => {
  it("marca, lista e desmarca, só do próprio aluno", async () => {
    expect((await put({ tribunal: "STF", numero: 1235, lido: true })).status).toBe(200);
    await put({ tribunal: "STJ", numero: 909, lido: true });
    expect(await (await GET()).json()).toEqual({ disponivel: true, lidos: ["STF-1235", "STJ-909"] });
    await put({ tribunal: "STF", numero: 1235, lido: false });
    expect((await (await GET()).json()).lidos).toEqual(["STJ-909"]);
    expect(rows.every((row) => row.user_id === "u1")).toBe(true);
  });
  it("recusa dados inválidos", async () => {
    expect((await put({ tribunal: "TJRN", numero: 1, lido: true })).status).toBe(400);
    expect((await put({ tribunal: "STF", numero: "1235", lido: true })).status).toBe(400);
    expect((await put({ tribunal: "STF", numero: 1235, lido: "sim" })).status).toBe(400);
    expect(rows).toEqual([]);
  });
  it("sem a migração 0022, a tela recebe 'indisponível'", async () => {
    failure = { code: "PGRST205", message: "Could not find the table 'public.informativos_lidos'" };
    expect(await (await GET()).json()).toEqual({ disponivel: false, lidos: [] });
    expect((await put({ tribunal: "STF", numero: 1, lido: true })).status).toBe(503);
  });
});
