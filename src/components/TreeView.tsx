import { useState, type DragEvent } from 'react';
import { NotebookText, Plus } from 'lucide-react';
import type { Card, Status, Tag } from '../types';
import { nextStatus, pad2 } from '../types';
import type { Actions } from '../store';
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

const DRAG_TYPE = 'text/x-skill-card';

export function TreeView({ weeks, cards, allCards, eixoMap, trilhaMap, actions, onOpen, onNew, onStatus }: Props) {
  const [dragId, setDragId] = useState<string | null>(null);
  const [overWeek, setOverWeek] = useState<number | null>(null);
  const nextWeek = (weeks[weeks.length - 1] ?? 0) + 1;

  const readId = (e: DragEvent) => e.dataTransfer.getData(DRAG_TYPE) || dragId;
  const endDrag = () => {
    setDragId(null);
    setOverWeek(null);
  };

  return (
    <section className="panel tree-panel">
      <div className="tree-scroll">
        <div className="tree">
          {weeks.map((w) => {
            const items = cards.filter((c) => c.semana === w);
            const weekAll = allCards.filter((c) => c.semana === w);
            const weekDone = weekAll.filter((c) => c.status === 'done').length;
            const complete = weekAll.length > 0 && weekDone === weekAll.length;
            return (
              <div
                key={w}
                className={`week ${overWeek === w ? 'is-over' : ''}`}
                onDragOver={(e) => {
                  if (!dragId) return;
                  e.preventDefault();
                  setOverWeek(w);
                }}
                onDragLeave={(e) => {
                  if (!e.currentTarget.contains(e.relatedTarget as Node)) setOverWeek((cur) => (cur === w ? null : cur));
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  const id = readId(e);
                  if (id) actions.moveCard(id, w);
                  endDrag();
                }}
              >
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
                  {items.map((c) => {
                    const eixo = eixoMap.get(c.eixoId) ?? FALLBACK_TAG;
                    const trilha = trilhaMap.get(c.trilhaId) ?? FALLBACK_TAG;
                    return (
                      <article
                        key={c.id}
                        className={`skill-card st-${c.status} ${dragId === c.id ? 'dragging' : ''}`}
                        draggable
                        tabIndex={0}
                        onDragStart={(e) => {
                          e.dataTransfer.setData(DRAG_TYPE, c.id);
                          e.dataTransfer.effectAllowed = 'move';
                          setDragId(c.id);
                        }}
                        onDragEnd={endDrag}
                        onDragOver={(e) => {
                          if (!dragId) return;
                          e.preventDefault();
                        }}
                        onDrop={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          const id = readId(e);
                          if (id) actions.moveCard(id, w, c.id);
                          endDrag();
                        }}
                        onClick={() => onOpen(c)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') onOpen(c);
                          if (e.key === ' ') {
                            e.preventDefault();
                            onStatus(c, nextStatus(c.status));
                          }
                        }}
                      >
                        <div className="skill-top">
                          <h3 title={c.titulo}>{c.titulo}</h3>
                          <StatusButton status={c.status} onClick={() => onStatus(c, nextStatus(c.status))} />
                        </div>
                        <div className="skill-meta">
                          <TagChip tags={[eixo, trilha]} />
                          {c.nota && (
                            <span className="note-hint" title={c.nota}>
                              <NotebookText size={14} />
                            </span>
                          )}
                        </div>
                      </article>
                    );
                  })}
                  {items.length === 0 && <p className="week-empty">Nenhum card com esses filtros</p>}
                  <button type="button" className="week-add" onClick={() => onNew(w)}>
                    <Plus size={15} /> Adicionar
                  </button>
                </div>
              </div>
            );
          })}

          <div
            className={`week week-ghost ${overWeek === nextWeek ? 'is-over' : ''}`}
            onDragOver={(e) => {
              if (!dragId) return;
              e.preventDefault();
              setOverWeek(nextWeek);
            }}
            onDragLeave={() => setOverWeek((cur) => (cur === nextWeek ? null : cur))}
            onDrop={(e) => {
              e.preventDefault();
              const id = readId(e);
              if (id) actions.moveCard(id, nextWeek);
              endDrag();
            }}
          >
            <header className="week-head">
              <span className="week-name">Semana {pad2(nextWeek)}</span>
            </header>
            <button type="button" className="ghost-week-btn" onClick={() => onNew(nextWeek)}>
              <Plus size={20} />
              <span>Nova semana</span>
              <small>ou arraste um card para cá</small>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
