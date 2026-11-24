import { useEffect, useMemo, useState } from 'react';
import { createSeed } from './seed';
import { uid, type AppState, type Card, type Status, type Tag, type TagKind } from './types';

const STORAGE_KEY = 'cerc-skill-tree:v1';

export function isValidState(x: unknown): x is AppState {
  if (!x || typeof x !== 'object') return false;
  const s = x as AppState;
  return (
    Array.isArray(s.cards) &&
    Array.isArray(s.eixos) &&
    Array.isArray(s.trilhas) &&
    s.cards.every((c) => typeof c.id === 'string' && typeof c.titulo === 'string' && typeof c.semana === 'number')
  );
}

function loadState(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (isValidState(parsed)) return parsed;
    }
  } catch {
    /* storage indisponível: usa os dados iniciais */
  }
  return createSeed();
}

export type CardDraft = Omit<Card, 'id'>;

export const hasNote = (c: { nota?: string }) => Boolean(c.nota?.trim());

export function useSkillTree() {
  const [state, setState] = useState<AppState>(loadState);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      /* ignora */
    }
  }, [state]);

  const actions = useMemo(
    () => ({
      addCard(draft: CardDraft) {
        setState((s) => ({ ...s, cards: [...s.cards, { ...draft, id: uid() }] }));
      },
      updateCard(id: string, patch: Partial<CardDraft>) {
        setState((s) => ({ ...s, cards: s.cards.map((c) => (c.id === id ? { ...c, ...patch } : c)) }));
      },
      /** Concluir exige anotação: sem nota, a mudança para "done" é ignorada. */
      setStatus(id: string, status: Status) {
        setState((s) => ({
          ...s,
          cards: s.cards.map((c) => (c.id === id && (status !== 'done' || hasNote(c)) ? { ...c, status } : c)),
        }));
      },
      deleteCard(id: string) {
        setState((s) => ({ ...s, cards: s.cards.filter((c) => c.id !== id) }));
      },
      /** Move um card para a semana, opcionalmente antes de outro card. */
      moveCard(id: string, semana: number, beforeId?: string) {
        setState((s) => {
          const card = s.cards.find((c) => c.id === id);
          if (!card || beforeId === id) return s;
          const rest = s.cards.filter((c) => c.id !== id);
          let idx = beforeId ? rest.findIndex((c) => c.id === beforeId) : -1;
          if (idx < 0) {
            const last = rest.reduce((acc, c, i) => (c.semana === semana ? i : acc), -1);
            idx = last === -1 ? rest.length : last + 1;
          }
          rest.splice(idx, 0, { ...card, semana });
          return { ...s, cards: rest };
        });
      },
      resetProgress() {
        setState((s) => ({ ...s, cards: s.cards.map((c) => ({ ...c, status: 'todo' as Status })) }));
      },
      addTag(kind: TagKind, nome: string, cor: string) {
        setState((s) => ({ ...s, [kind]: [...s[kind], { id: uid(), nome, cor }] }));
      },
      updateTag(kind: TagKind, id: string, patch: Partial<Omit<Tag, 'id'>>) {
        setState((s) => ({ ...s, [kind]: s[kind].map((t) => (t.id === id ? { ...t, ...patch } : t)) }));
      },
      deleteTag(kind: TagKind, id: string) {
        setState((s) => {
          const field = kind === 'eixos' ? 'eixoId' : 'trilhaId';
          if (s.cards.some((c) => c[field] === id)) return s;
          return { ...s, [kind]: s[kind].filter((t) => t.id !== id) };
        });
      },
      replaceState(next: AppState) {
        setState(next);
      },
      restoreSeed() {
        setState(createSeed());
      },
    }),
    [],
  );

  return [state, actions] as const;
}

export type Actions = ReturnType<typeof useSkillTree>[1];
