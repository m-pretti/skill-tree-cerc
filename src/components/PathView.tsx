import { useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import {
  BookOpen,
  Boxes,
  Check,
  Crown,
  Flame,
  NotebookText,
  Pencil,
  Play,
  Plus,
  Server,
  Star,
  Target,
  Trophy,
  Zap,
} from 'lucide-react';
import type { Card, Status, Tag } from '../types';
import { pad2 } from '../types';
import { computeLevel } from '../level';
import { DAILY_XP_GOAL, XP_PER_CARD, computeStreak, doneToday, pathOffset, unitColor } from '../game';
import { FALLBACK_TAG } from './common';

interface Props {
  weeks: number[];
  cards: Card[];
  allCards: Card[];
  eixos: Tag[];
  eixoMap: Map<string, Tag>;
  trilhaMap: Map<string, Tag>;
  onOpen: (c: Card) => void;
  onNew: (semana: number) => void;
  onStatus: (c: Card, s: Status) => void;
  backup: ReactNode;
}

const EIXO_ICON: Record<string, typeof Star> = { infra: Server, stack: Boxes, estudo: BookOpen };

function NodeIcon({ card }: { card: Card }) {
  if (card.status === 'done') return <Check size={34} strokeWidth={3.4} />;
  const Icon = EIXO_ICON[card.eixoId] ?? Star;
  return <Icon size={30} strokeWidth={2.6} />;
}

export function PathView({ weeks, cards, allCards, eixos, eixoMap, trilhaMap, onOpen, onNew, onStatus, backup }: Props) {
  const [openId, setOpenId] = useState<string | null>(null);

  // Fecha o balão ao clicar fora ou apertar Esc.
  useEffect(() => {
    if (!openId) return;
    const onDown = (e: MouseEvent) => {
      if (!(e.target as Element).closest?.('.path-row.is-open')) setOpenId(null);
    };
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpenId(null);
    document.addEventListener('mousedown', onDown);
    window.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      window.removeEventListener('keydown', onKey);
    };
  }, [openId]);

  // O "próximo passo": primeiro card em curso, senão o primeiro a fazer.
  const nextId = useMemo(
    () => (cards.find((c) => c.status === 'doing') ?? cards.find((c) => c.status === 'todo'))?.id,
    [cards],
  );

  const nextWeek = (weeks[weeks.length - 1] ?? 0) + 1;

  return (
    <div className="path-layout">
      <section className="path-col">
        <Hud cards={allCards} weeks={weeks} />

        {weeks.map((w) => {
          const items = cards.filter((c) => c.semana === w);
          const weekAll = allCards.filter((c) => c.semana === w);
          const weekDone = weekAll.filter((c) => c.status === 'done').length;
          const complete = weekAll.length > 0 && weekDone === weekAll.length;
          const color = unitColor(w);
          return (
            <div key={w} className="unit" style={{ '--u': color } as CSSProperties}>
              <header className="unit-banner">
                <div>
                  <p className="unit-kicker">Semana {pad2(w)}</p>
                  <h2 className="unit-title">
                    {complete ? 'Unidade dominada!' : `${weekDone} de ${weekAll.length} skills`}
                  </h2>
                  <div className="unit-bar" aria-hidden>
                    <span style={{ width: weekAll.length ? `${(weekDone / weekAll.length) * 100}%` : 0 }} />
                  </div>
                </div>
                <button type="button" className="unit-add" onClick={() => onNew(w)} title={`Adicionar card na semana ${pad2(w)}`}>
                  <Plus size={20} strokeWidth={3} />
                </button>
              </header>

              <ol className="path">
                {items.map((c, i) => {
                  const eixo = eixoMap.get(c.eixoId) ?? FALLBACK_TAG;
                  const trilha = trilhaMap.get(c.trilhaId) ?? FALLBACK_TAG;
                  const isOpen = openId === c.id;
                  const isNext = c.id === nextId;
                  return (
                    <li
                      key={c.id}
                      className={`path-row ${isOpen ? 'is-open' : ''} ${isNext ? 'has-bubble' : ''}`}
                      style={{ '--x': `${pathOffset(i, w)}px` } as CSSProperties}
                    >
                      <div className="node-wrap">
                        {isNext && !isOpen && (
                          <span className="node-bubble">{c.status === 'doing' ? 'Continuar' : 'Começar'}</span>
                        )}
                        <button
                          type="button"
                          className={`node st-${c.status} ${isNext ? 'is-next' : ''}`}
                          onClick={() => setOpenId(isOpen ? null : c.id)}
                          aria-expanded={isOpen}
                          aria-label={`${c.titulo} — ${c.status === 'done' ? 'concluído' : c.status === 'doing' ? 'em curso' : 'a fazer'}`}
                        >
                          <NodeIcon card={c} />
                        </button>
                        <span className="node-label">{c.titulo}</span>
                      </div>

                      {isOpen && (
                        <div className="node-pop" role="dialog" aria-label={c.titulo}>
                          <p className="pop-kicker">
                            {eixo.nome} · {trilha.nome}
                          </p>
                          <h3>{c.titulo}</h3>
                          {c.nota ? (
                            <p className="pop-note">
                              <NotebookText size={14} /> {c.nota}
                            </p>
                          ) : (
                            <p className="pop-note muted">
                              {c.status === 'done' ? 'Concluído antes da regra de anotação.' : 'Ao concluir, registre o que aprendeu.'}
                            </p>
                          )}
                          <div className="pop-actions">
                            {c.status === 'todo' && (
                              <button type="button" className="pop-primary" onClick={() => onStatus(c, 'doing')}>
                                <Play size={16} strokeWidth={3} /> Começar
                              </button>
                            )}
                            {c.status === 'doing' && (
                              <button
                                type="button"
                                className="pop-primary"
                                onClick={() => {
                                  setOpenId(null);
                                  onStatus(c, 'done');
                                }}
                              >
                                <Check size={16} strokeWidth={3} /> Concluir +{XP_PER_CARD} XP
                              </button>
                            )}
                            {c.status === 'done' && (
                              <button type="button" className="pop-primary" onClick={() => onOpen(c)}>
                                <NotebookText size={16} strokeWidth={2.6} /> Revisar
                              </button>
                            )}
                            <button
                              type="button"
                              className="pop-secondary"
                              onClick={() => {
                                setOpenId(null);
                                onOpen(c);
                              }}
                            >
                              <Pencil size={15} strokeWidth={2.6} /> Editar
                            </button>
                          </div>
                        </div>
                      )}
                    </li>
                  );
                })}

                {items.length === 0 && <li className="path-empty">Nenhum card com esses filtros</li>}

                <li className="path-row" style={{ '--x': '0px' } as CSSProperties}>
                  <div className="node-wrap">
                    <span className={`node trophy ${complete ? 'is-won' : ''}`} aria-hidden>
                      <Trophy size={34} strokeWidth={2.6} />
                    </span>
                    <span className="node-label">{complete ? 'Semana concluída!' : `${weekDone}/${weekAll.length} para o troféu`}</span>
                  </div>
                </li>
              </ol>
            </div>
          );
        })}

        <button type="button" className="path-new-week" onClick={() => onNew(nextWeek)}>
          <Plus size={20} strokeWidth={3} /> Começar a Semana {pad2(nextWeek)}
        </button>
      </section>

      <Sidebar cards={allCards} weeks={weeks} eixos={eixos} backup={backup} />
    </div>
  );
}

/* ---------- HUD (barra superior) ---------- */

function useWeekTrophies(cards: Card[], weeks: number[]) {
  return weeks.filter((w) => {
    const all = cards.filter((c) => c.semana === w);
    return all.length > 0 && all.every((c) => c.status === 'done');
  }).length;
}

function Hud({ cards, weeks }: { cards: Card[]; weeks: number[] }) {
  const done = cards.filter((c) => c.status === 'done').length;
  const xp = done * XP_PER_CARD;
  const { level } = computeLevel(done);
  const streak = computeStreak(cards);
  const trophies = useWeekTrophies(cards, weeks);

  // Animação "+10 XP" quando o XP sobe.
  const prevXp = useRef(xp);
  const [gain, setGain] = useState<{ n: number; key: number } | null>(null);
  useEffect(() => {
    if (xp > prevXp.current) setGain({ n: xp - prevXp.current, key: Date.now() });
    prevXp.current = xp;
  }, [xp]);
  useEffect(() => {
    if (!gain) return;
    const t = setTimeout(() => setGain(null), 1400);
    return () => clearTimeout(t);
  }, [gain]);

  return (
    <div className="hud">
      <span className={`hud-item streak ${streak ? 'on' : ''}`} title="Ofensiva: dias seguidos concluindo cards">
        <Flame size={22} strokeWidth={2.6} /> {streak}
      </span>
      <span className="hud-item xp" title="XP total">
        <Zap size={22} strokeWidth={2.6} /> {xp}
        {gain && (
          <em key={gain.key} className="xp-gain">
            +{gain.n}
          </em>
        )}
      </span>
      <span className="hud-item level" title="Level atual">
        <Crown size={22} strokeWidth={2.6} /> {level}
      </span>
      <span className="hud-item trophies" title="Semanas concluídas">
        <Trophy size={21} strokeWidth={2.6} /> {trophies}
      </span>
    </div>
  );
}

/* ---------- Barra lateral ---------- */

function Meter({ value, max, color }: { value: number; max: number; color?: string }) {
  const pct = max ? Math.min(100, (value / max) * 100) : 0;
  return (
    <div className="meter" style={color ? ({ '--m': color } as CSSProperties) : undefined}>
      <div className="meter-track">
        <span style={{ width: `${pct}%` }} />
      </div>
      <b>
        {value}/{max}
      </b>
    </div>
  );
}

function Sidebar({ cards, weeks, eixos, backup }: { cards: Card[]; weeks: number[]; eixos: Tag[]; backup: ReactNode }) {
  const done = cards.filter((c) => c.status === 'done').length;
  const { level, inLevel, need } = computeLevel(done);
  const today = doneToday(cards);
  const streak = computeStreak(cards);

  const openWeek = weeks.find((w) => {
    const all = cards.filter((c) => c.semana === w);
    return all.length > 0 && all.some((c) => c.status !== 'done');
  });
  const openWeekAll = openWeek ? cards.filter((c) => c.semana === openWeek) : [];
  const openWeekDone = openWeekAll.filter((c) => c.status === 'done').length;

  const quests = [
    { icon: <Zap size={22} />, cls: 'q-xp', label: `Ganhe ${DAILY_XP_GOAL} XP hoje`, value: today * XP_PER_CARD, max: DAILY_XP_GOAL },
    { icon: <Target size={22} />, cls: 'q-card', label: 'Conclua 1 card hoje', value: Math.min(today, 1), max: 1 },
    ...(openWeek
      ? [
          {
            icon: <Trophy size={22} />,
            cls: 'q-week',
            label: `Feche a Semana ${pad2(openWeek)}`,
            value: openWeekDone,
            max: openWeekAll.length,
          },
        ]
      : []),
  ];

  return (
    <aside className="path-side">
      <div className="side-card level-card">
        <div className="level-badge">
          <Crown size={28} strokeWidth={2.6} />
          <span>{level}</span>
        </div>
        <div className="level-info">
          <h3>Level {level}</h3>
          <p>
            Faltam <b>{need - inLevel}</b> {need - inLevel === 1 ? 'card' : 'cards'} para o Level {level + 1}
          </p>
          <Meter value={inLevel} max={need} color="#ffb020" />
        </div>
      </div>

      <div className="side-card">
        <div className="side-head">
          <h3>Missões do dia</h3>
          <span className={`streak-pill ${streak ? 'on' : ''}`}>
            <Flame size={15} strokeWidth={2.8} /> {streak} {streak === 1 ? 'dia' : 'dias'}
          </span>
        </div>
        <ul className="quests">
          {quests.map((q) => (
            <li key={q.label} className={q.value >= q.max ? 'is-done' : ''}>
              <span className={`quest-icon ${q.cls}`}>{q.icon}</span>
              <div>
                <p>{q.label}</p>
                <Meter value={q.value} max={q.max} />
              </div>
            </li>
          ))}
        </ul>
      </div>

      <div className="side-card">
        <div className="side-head">
          <h3>Domínio por eixo</h3>
        </div>
        <ul className="eixo-list">
          {eixos.map((e) => {
            const all = cards.filter((c) => c.eixoId === e.id);
            if (!all.length) return null;
            const d = all.filter((c) => c.status === 'done').length;
            const Icon = EIXO_ICON[e.id] ?? Star;
            return (
              <li key={e.id} style={{ '--tag': e.cor } as CSSProperties}>
                <span className="eixo-icon">
                  <Icon size={18} strokeWidth={2.6} />
                </span>
                <div>
                  <p>{e.nome}</p>
                  <Meter value={d} max={all.length} color={e.cor} />
                </div>
              </li>
            );
          })}
        </ul>
      </div>

      <div className="side-backup">{backup}</div>
    </aside>
  );
}
