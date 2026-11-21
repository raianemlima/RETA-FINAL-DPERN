// Importa o banco de questões do repositório REVIEW-RAI para data/questoes.json.
// Uso: node scripts/questoes/importar.mjs /caminho/para/review-rai
import { readFileSync, readdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const root = process.argv[2];
if (!root) { console.error("Informe o caminho do repositório REVIEW-RAI."); process.exit(1); }
const dir = join(root, "ferramentas", "conteudo", "dados", "simulados");

// Matérias com nomes diferentes em cada edital agrupadas numa disciplina só (é por ela que o aluno filtra).
const RULES = [
  [/execu[cç][aã]o penal|execu[cç][oõ]es penais/i, "Execução Penal"], [/processual penal/i, "Direito Processual Penal"], [/legisla[cç][aã]o penal/i, "Direito Penal"],
  [/processual civil/i, "Direito Processual Civil"], [/criminologia/i, "Criminologia"], [/^direito penal/i, "Direito Penal"],
  [/constitucional/i, "Direito Constitucional"], [/administrativ|financeiro|tribut[aá]rio/i, "Direito Administrativo, Financeiro e Tributário"],
  [/^direito civil/i, "Direito Civil"], [/consumidor/i, "Direito do Consumidor"], [/crian[cç]a|adolescente/i, "Direito da Criança e do Adolescente"],
  [/humanos|antidiscrimina/i, "Direitos Humanos"], [/difusos|coletivos|ambiental|urban[ií]stic|sanit[aá]ri/i, "Direitos Difusos e Coletivos"],
  [/institucion|defensoria|\bdpe\b/i, "Princípios Institucionais da Defensoria"], [/filosofia|sociologia|human[ií]stica/i, "Filosofia e Sociologia do Direito"],
  [/portugu/i, "Língua Portuguesa"], [/internacional/i, "Direito Internacional"], [/empresarial|previdenci|eleitoral/i, "Outros ramos do Direito"],
];
const discipline = (materia) => RULES.find(([pattern]) => pattern.test(materia))?.[1] ?? "Outras matérias";
const clean = (text) => (text ?? "").replace(/\s+\n/g, "\n").replace(/[ \t]+/g, " ").trim();

// Ficam só as provas de Defensoria do Cebraspe (banca contratada para o próximo concurso da DPE-RN), de qualquer ano:
// hoje, a própria DPE-RN 2015. Provas de MP, TJ e de servidores ficam de fora. Questão Certo/Errado do Cebraspe entra
// com as alternativas C e E.
const keep = (question) => /cebraspe|cespe/i.test(question.banca) && /^Defensor/i.test(question.cargo);

const out = [];
for (const file of readdirSync(dir).filter((name) => name.endsWith(".json") && !name.includes("correcoes")).sort()) {
  const exam = JSON.parse(readFileSync(join(dir, file), "utf8"));
  for (const q of exam.questoes) {
    const fonte = q.fonte ?? `${exam.nome} · ${exam.cargo}`;
    const [concurso, ...cargo] = fonte.split(" · ");
    const year = /(20\d\d)/.exec(concurso) ?? /(20\d\d)/.exec(exam.nome);
    // Certo/Errado (Cebraspe): sem alternativas no arquivo, vira "C — Certo" e "E — Errado"; o gabarito, C ou E.
    const certoErrado = !q.alternativas || !Object.keys(q.alternativas).length;
    const raw = certoErrado ? ({ certo: "C", c: "C", errado: "E", e: "E" })[String(q.gabarito ?? "").trim().toLowerCase()] : q.gabarito;
    const gabarito = /^[A-E]$/.test(raw ?? "") ? raw : null;
    const alternativas = certoErrado ? { C: "Certo", E: "Errado" } : q.alternativas;
    const question = {
      id: `${exam.id}-${q.n}`, concurso: concurso.trim(), orgao: (/\b(DPE-[A-Z]{2}|DPU)\b/.exec(concurso) ?? [null, concurso.trim()])[1],
      ano: year ? Number(year[1]) : null, banca: exam.banca, cargo: (cargo.join(" · ") || exam.cargo).trim(),
      disciplina: discipline(q.materia), materia: clean(q.materia), assunto: q.assunto ? clean(q.assunto).replace(/\.$/, "") : null,
      enunciado: clean(q.enunciado), alternativas: Object.fromEntries(Object.entries(alternativas).map(([letter, text]) => [letter, clean(text)])),
      gabarito, anulada: !gabarito, comentario: q.comentario ? clean(q.comentario) : null,
    };
    if (keep(question)) out.push(question);
  }
}
writeFileSync(join(process.cwd(), "data", "questoes.json"), JSON.stringify(out));
console.log(`${out.length} questões importadas de ${dir}`);
