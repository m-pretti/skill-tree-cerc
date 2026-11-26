import { Fragment } from 'react';
import { GripVertical, Pencil } from 'lucide-react';
import type { Card, Status, Tag } from '../types';
import { STATUS_LABEL, STATUS_ORDER, nextStatus, pad2 } from '../types';
import type { Actions } from '../store';
import { DragOverlay, useCardDrag } from '../dnd';
import { FALLBACK_TAG, StatusButton, TagChip } from './common';

interface Props {
  weeks: number[];
  cards: Card[];
  eixoMap: Map<string, Tag>;
  trilhaMap: Map<string, Tag>;
  actions: Actions;
  onOpen: (c: Card) => void;
  onStatus: (c: Card, s: Status) => void;
}

export function ListView({ weeks, cards, eixoMap, trilhaMap, actions, onOpen, onStatus }: Props) {
  const groups = weeks.map((w) => ({ w, items: cards.filter((c) => c.semana === w) })).filter((g) => g.items.length);

  const { drag, rootRef, overlayRef, start } = useCardDrag<HTMLElement>((id, semana, index) => {
    const rest = cards.filter((c) => c.semana === semana && c.id !== id);
    actions.moveCard(id, semana, rest[index]?.id);
  });
  const dragged = drag ? cards.find((c) => c.id === drag.id) : undefined;
  const slot = drag && <li className="drag-slot" data-drag-placeholder style={{ height: drag.height }} />;

  const rowContent = (c: Card) => (
    <>
      <span className="drag-grip" title="Arraste para reordenar">
        <GripVertical size={15} />
      </span>
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
    </>
  );

  return (
    <section className="panel list-panel" ref={rootRef}>
      {!groups.length && <p className="empty">Nenhum card encontrado com esses filtros.</p>}
      {groups.map(({ w, items }) => {
        const done = items.filter((c) => c.status === 'done').length;
        const visible = items.filter((c) => c.id !== drag?.id);
        const slotAt = drag?.key === w ? drag.index : -1;
        return (
          <div key={w} className={`list-group ${drag?.key === w ? 'is-over' : ''}`} data-drop-key={w}>
            <h3 className="list-week">
              Semana {pad2(w)} <span>{done}/{items.length}</span>
            </h3>
            <ul>
              {visible.map((c, i) => (
                <Fragment key={c.id}>
                  {i === slotAt && slot}
                  <li data-drag-id={c.id} className={`list-row st-${c.status}`} onPointerDown={start(c.id)}>
                    {rowContent(c)}
                  </li>
                </Fragment>
              ))}
              {slotAt >= visible.length && slot}
            </ul>
          </div>
        );
      })}

      {drag && dragged && (
        <DragOverlay drag={drag} overlayRef={overlayRef}>
          <div className={`list-row st-${dragged.status}`}>{rowContent(dragged)}</div>
        </DragOverlay>
      )}
    </section>
  );
}
