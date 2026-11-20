import { COURSE } from "@/lib/course";

// Data da prova (horário de Brasília), em lib/course.ts. Enquanto o edital não sai, fica null e a tela mostra isso.
export const EXAM_DATE = COURSE.examDate;
export const EXAM_LABEL = COURSE.examLabel;

const dayOf = (date: Date) => date.toLocaleDateString("sv-SE", { timeZone: "America/Sao_Paulo" });

// Dias inteiros até a prova, contados no calendário de Brasília (0 = é hoje; negativo = já passou; null = sem data).
export function daysUntilExam(now: Date, exam: string | null = EXAM_DATE): number | null {
  if (!exam) return null;
  const today = Date.parse(`${dayOf(now)}T00:00:00Z`), target = Date.parse(`${exam}T00:00:00Z`);
  return Math.round((target - today) / 86_400_000);
}

export function examCountdown(now: Date, exam: string | null = EXAM_DATE): string {
  const days = daysUntilExam(now, exam);
  if (days === null) return `Prova pelo ${COURSE.banca}: aguardando o edital`;
  if (days > 1) return `Faltam ${days} dias para a prova`;
  if (days === 1) return "A prova é amanhã";
  if (days === 0) return "A prova é hoje. Boa prova!";
  return "A prova já aconteceu";
}

// Versão curta para o menu lateral.
export function examShort(now: Date, exam: string | null = EXAM_DATE): string {
  const days = daysUntilExam(now, exam);
  if (days === null) return `Banca ${COURSE.banca} · edital em breve`;
  return days > 1 ? `Prova em ${exam!.split("-").reverse().join("/")} · faltam ${days} dias` : examCountdown(now, exam);
}
