import { Pencil } from 'lucide-react';
import type { Card, Status, Tag } from '../types';
import { STATUS_LABEL, STATUS_ORDER, nextStatus, pad2 } from '../types';
import { FALLBACK_TAG, StatusButton, TagChip } from './common';

interface Props {
  weeks: number[];
  cards: Card[];
  eixoMap: Map<string, Tag>;
  trilhaMap: Map<string, Tag>;
  onOpen: (c: Card) => void;
  onStatus: (c: Card, s: Status) => void;
}

export function ListView({ weeks, cards, eixoMap, trilhaMap, onOpen, onStatus }: Props) {
  const groups = weeks.map((w) => ({ w, items: cards.filter((c) => c.semana === w) })).filter((g) => g.items.length);

  if (!groups.length) {
    return (
      <section className="panel list-panel">
        <p className="empty">Nenhum card encontrado com esses filtros.</p>
      </section>
    );
  }

  return (
    <section className="panel list-panel">
      {groups.map(({ w, items }) => {
        const done = items.filter((c) => c.status === 'done').length;
        return (
          <div key={w} className="list-group">
            <h3 className="list-week">
              Semana {pad2(w)} <span>{done}/{items.length}</span>
            </h3>
            <ul>
              {items.map((c) => (
                <li key={c.id} className={`list-row st-${c.status}`}>
                  <StatusButton status={c.status} onClick={() => onStatus(c, nextStatus(c.status))} />
                  <button type="button" className="list-title" onClick={() => onOpen(c)}>
                    <span>{c.titulo}</span>
                    {c.nota && <small>{c.nota}</small>}
                  </button>
                  <TagChip tags={[eixoMap.get(c.eixoId) ?? FALLBACK_TAG]} />
                  <TagChip tags={[trilhaMap.get(c.trilhaId) ?? FALLBACK_TAG]} />
                  <select
                    className={`status-select st-${c.status}`}
                    value={c.status}
                    onChange={(e) => onStatus(c, e.target.value as Status)}
                    aria-label={`Status de ${c.titulo}`}
                  >
                    {STATUS_ORDER.map((s) => (
                      <option key={s} value={s}>
                        {STATUS_LABEL[s]}
                      </option>
                    ))}
                  </select>
                  <button type="button" className="icon-btn" onClick={() => onOpen(c)} aria-label={`Editar ${c.titulo}`}>
                    <Pencil size={16} />
                  </button>
                </li>
              ))}
            </ul>
          </div>
        );
      })}
    </section>
  );
}
