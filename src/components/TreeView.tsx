import { Fragment } from 'react';
import { NotebookText, Plus } from 'lucide-react';
import type { Card, Status, Tag } from '../types';
import { nextStatus, pad2 } from '../types';
import type { Actions } from '../store';
import { DragOverlay, useCardDrag } from '../dnd';
import { FALLBACK_TAG, StatusButton, TagChip } from './common';

interface Props {
  weeks: number[];
  cards: Card[];
  allCards: Card[];
  eixoMap: Map<string, Tag>;
  trilhaMap: Map<string, Tag>;
  actions: Actions;
  onOpen: (c: Card) => void;
  onNew: (semana: number) => void;
  onStatus: (c: Card, s: Status) => void;
}

function CardBody({ card, eixo, trilha, onStatus }: { card: Card; eixo: Tag; trilha: Tag; onStatus: () => void }) {
  return (
    <>
      <div className="skill-top">
        <h3 title={card.titulo}>{card.titulo}</h3>
        <StatusButton status={card.status} onClick={onStatus} />
      </div>
      <div className="skill-meta">
        <TagChip tags={[eixo, trilha]} />
        {card.nota && (
          <span className="note-hint" title={card.nota}>
            <NotebookText size={14} />
          </span>
        )}
      </div>
    </>
  );
}

export function TreeView({ weeks, cards, allCards, eixoMap, trilhaMap, actions, onOpen, onNew, onStatus }: Props) {
  const nextWeek = (weeks[weeks.length - 1] ?? 0) + 1;

  const { drag, rootRef, overlayRef, start } = useCardDrag<HTMLDivElement>((id, semana, index) => {
    const rest = cards.filter((c) => c.semana === semana && c.id !== id);
    actions.moveCard(id, semana, rest[index]?.id);
  });
  const dragged = drag ? allCards.find((c) => c.id === drag.id) : undefined;
  const slot = drag && <div className="drag-slot" data-drag-placeholder style={{ height: drag.height }} />;

  const renderCard = (c: Card) => {
    const eixo = eixoMap.get(c.eixoId) ?? FALLBACK_TAG;
    const trilha = trilhaMap.get(c.trilhaId) ?? FALLBACK_TAG;
    return (
      <article
        key={c.id}
        data-drag-id={c.id}
        className={`skill-card st-${c.status}`}
        tabIndex={0}
        onPointerDown={start(c.id)}
        onClick={() => onOpen(c)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') onOpen(c);
          if (e.key === ' ') {
            e.preventDefault();
            onStatus(c, nextStatus(c.status));
          }
        }}
      >
        <CardBody card={c} eixo={eixo} trilha={trilha} onStatus={() => onStatus(c, nextStatus(c.status))} />
      </article>
    );
  };

  /** Cards visíveis da semana, com o espaço reservado onde o card arrastado vai cair. */
  const renderCards = (w: number) => {
    const visible = cards.filter((c) => c.semana === w && c.id !== drag?.id);
    const slotAt = drag?.key === w ? drag.index : -1;
    return (
      <>
        {visible.map((c, i) => (
          <Fragment key={c.id}>
            {i === slotAt && slot}
            {renderCard(c)}
          </Fragment>
        ))}
        {slotAt >= visible.length && slot}
        {visible.length === 0 && slotAt < 0 && w !== nextWeek && <p className="week-empty">Nenhum card com esses filtros</p>}
      </>
    );
  };

  return (
    <section className="panel tree-panel">
      <div className="tree-scroll">
        <div className="tree" ref={rootRef}>
          {weeks.map((w) => {
            const weekAll = allCards.filter((c) => c.semana === w);
            const weekDone = weekAll.filter((c) => c.status === 'done').length;
            const complete = weekAll.length > 0 && weekDone === weekAll.length;
            return (
              <div key={w} data-drop-key={w} className={`week ${drag?.key === w ? 'is-over' : ''}`}>
                <header className="week-head">
                  <span className="week-name">Semana {pad2(w)}</span>
                  <span className={`week-count ${complete ? 'complete' : ''}`}>
                    {weekDone}/{weekAll.length}
                  </span>
                  <span className="week-bar">
                    <span style={{ width: weekAll.length ? `${(weekDone / weekAll.length) * 100}%` : 0 }} />
                  </span>
                </header>

                <div className="week-cards">
                  {renderCards(w)}
                  <button type="button" className="week-add" onClick={() => onNew(w)}>
                    <Plus size={15} /> Adicionar
                  </button>
                </div>
              </div>
            );
          })}

          <div data-drop-key={nextWeek} className={`week week-ghost ${drag?.key === nextWeek ? 'is-over' : ''}`}>
            <header className="week-head">
              <span className="week-name">Semana {pad2(nextWeek)}</span>
            </header>
            <div className="week-cards">
              {renderCards(nextWeek)}
              <button type="button" className="ghost-week-btn" onClick={() => onNew(nextWeek)}>
                <Plus size={20} />
                <span>Nova semana</span>
                <small>ou arraste um card para cá</small>
              </button>
            </div>
          </div>
        </div>
      </div>

      {drag && dragged && (
        <DragOverlay drag={drag} overlayRef={overlayRef}>
          <article className={`skill-card st-${dragged.status}`}>
            <CardBody
              card={dragged}
              eixo={eixoMap.get(dragged.eixoId) ?? FALLBACK_TAG}
              trilha={trilhaMap.get(dragged.trilhaId) ?? FALLBACK_TAG}
              onStatus={() => {}}
            />
          </article>
        </DragOverlay>
      )}
    </section>
  );
}
