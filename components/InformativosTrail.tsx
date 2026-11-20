"use client";

import { type Informativo, informativoKey, informativoUrl } from "@/lib/informativos";

// Trilha dos Informativos STF/STJ: a lista do cronograma, na ordem, com o próximo da vez em destaque.
export function InformativosTrail({ itens, lidos, salvando, onToggle }: { itens: Informativo[]; lidos: Set<string>; salvando: string | null; onToggle: (item: Informativo) => void }) {
  const feitos = itens.filter((item) => lidos.has(informativoKey(item))).length;
  const proximo = itens.find((item) => !lidos.has(informativoKey(item)));
  return <section className="inf-trail" aria-label="Trilha dos Informativos">
    <div className="plan-progress">
      <div className="plan-progress-row"><strong>{feitos === itens.length ? "Trilha concluída! Volte para o início e revise. 🎉" : `${feitos} de ${itens.length} informativos lidos`}</strong></div>
      <div className="plan-progress-bar" role="progressbar" aria-label="Informativos lidos" aria-valuemin={0} aria-valuemax={itens.length} aria-valuenow={feitos}><span style={{ width: `${Math.round((100 * feitos) / itens.length)}%` }} /></div>
    </div>
    {proximo && <div className="inf-next">
      <p className="eyebrow">Próximo da vez · {proximo.ordem}º</p>
      <p className="inf-next-title"><span className={`inf-court inf-${proximo.tribunal.toLowerCase()}`}>{proximo.tribunal}</span> Informativo {proximo.numero}</p>
      <div className="plan-links">
        <a className="button primary" href={informativoUrl(proximo)} target="_blank" rel="noopener noreferrer">Abrir no site do {proximo.tribunal} ↗</a>
        <button type="button" className="button" disabled={salvando === informativoKey(proximo)} onClick={() => onToggle(proximo)}>✓ Marcar como lido</button>
      </div>
    </div>}
    <details className="plan-general">
      <summary>Ver os {itens.length} informativos da trilha</summary>
      <ol className="inf-list">
        {itens.map((item) => {
          const key = informativoKey(item); const lido = lidos.has(key);
          return <li key={key} className={lido ? "is-done" : undefined}>
            <button type="button" className={`plan-check inf-check${lido ? " is-on" : ""}`} aria-pressed={lido} aria-label={`${item.tribunal} Informativo ${item.numero}: lido`} disabled={salvando === key} onClick={() => onToggle(item)}><span className="plan-check-box" aria-hidden="true">{lido ? "✓" : ""}</span></button>
            <span className="inf-order">{item.ordem}</span>
            <span className={`inf-court inf-${item.tribunal.toLowerCase()}`}>{item.tribunal}</span>
            <a href={informativoUrl(item)} target="_blank" rel="noopener noreferrer">Informativo {item.numero} ↗</a>
          </li>;
        })}
      </ol>
    </details>
  </section>;
}
