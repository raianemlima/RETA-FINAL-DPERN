// Identidade do curso: tudo o que muda de um Reta Final para outro (defensoria, banca, data da prova) fica aqui.
export const COURSE = {
  // Nome curto que aparece no topo das telas, no menu e no PDF do caderno.
  name: "Reta Final DPE-RN",
  defensoria: "DPE-RN",
  defensoriaNome: "Defensoria Pública do Estado do Rio Grande do Norte",
  // Banca contratada (o edital ainda não saiu).
  banca: "Cebraspe",
  // Data da prova (AAAA-MM-DD, horário de Brasília) e como ela aparece por extenso. null enquanto o edital não sair.
  examDate: null as string | null,
  examLabel: null as string | null,
};
export const COURSE_TITLE = `Cursos DUO · ${COURSE.name}`;
