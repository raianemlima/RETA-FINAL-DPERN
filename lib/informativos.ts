// Trilha dos Informativos STF/STJ do cronograma (Reta Final DPE-RN): uma tabela "Ordem | Tribunal | Informativo" no
// Word do cronograma. O app a transforma numa lista em que o aluno marca cada informativo como lido.
export type Tribunal = "STF" | "STJ";
export type Informativo = { ordem: number; tribunal: Tribunal; numero: number };

export const informativoKey = (item: { tribunal: Tribunal; numero: number }) => `${item.tribunal}-${item.numero}`;

// Página oficial de cada informativo: o PDF do STF (mesmo endereço que o cronograma usa) e a pesquisa do STJ por código.
export function informativoUrl(item: { tribunal: Tribunal; numero: number }): string {
  if (item.tribunal === "STF") return `https://www.stf.jus.br/arquivo/cms/informativoSTF/anexo/Informativo_PDF/Informativo_stf_${item.numero}.pdf`;
  return `https://processo.stj.jus.br/SCON/SearchBRS?b=INFJ&tipo=informativo&livre=@COD=%27${String(item.numero).padStart(4, "0")}%27`;
}

export const isInformativosTitle = (title: string) => /informativos/i.test(title);

// Linhas da tabela (texto de cada célula): "1 | STF | Informativo 1235". Cabeçalho e linhas fora do padrão ficam de fora.
export function informativosFromRows(rows: string[][]): Informativo[] {
  const out: Informativo[] = []; const seen = new Set<string>();
  for (const cells of rows) {
    const text = cells.map((cell) => cell.replace(/\s+/g, " ").trim());
    const tribunal = text.find((cell) => /^(STF|STJ)$/i.test(cell))?.toUpperCase() as Tribunal | undefined;
    const numero = Number(/(\d{2,5})\s*$/.exec(text.find((cell) => /informativo/i.test(cell)) ?? "")?.[1]);
    const ordem = Number(/^\d{1,4}$/.exec(text[0] ?? "")?.[0]);
    if (!tribunal || !numero) continue;
    const item = { ordem: ordem || out.length + 1, tribunal, numero };
    if (seen.has(informativoKey(item))) continue;
    seen.add(informativoKey(item)); out.push(item);
  }
  return out.sort((a, b) => a.ordem - b.ordem);
}
