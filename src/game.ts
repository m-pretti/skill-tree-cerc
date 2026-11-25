import type { Card } from './types';

/** XP ganho por card concluído. */
export const XP_PER_CARD = 10;
/** Meta diária de XP (missões do dia). */
export const DAILY_XP_GOAL = 30;

/** Dia local no formato AAAA-MM-DD. */
export function localDay(d = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function shiftDay(day: string, delta: number): string {
  const [y, m, d] = day.split('-').map(Number);
  return localDay(new Date(y, m - 1, d + delta));
}

/**
 * Dias seguidos com pelo menos um card concluído.
 * A ofensiva continua viva se o último dia foi hoje ou ontem.
 */
export function computeStreak(cards: Card[], today = localDay()): number {
  const days = new Set(cards.filter((c) => c.status === 'done' && c.concluidoEm).map((c) => c.concluidoEm!));
  let cursor = days.has(today) ? today : shiftDay(today, -1);
  let streak = 0;
  while (days.has(cursor)) {
    streak += 1;
    cursor = shiftDay(cursor, -1);
  }
  return streak;
}

export function doneToday(cards: Card[], today = localDay()): number {
  return cards.filter((c) => c.status === 'done' && c.concluidoEm === today).length;
}

/** Cores das unidades (semanas) do caminho, dentro da paleta CERC. */
export const UNIT_COLORS = ['#1f6fd1', '#13908a', '#0a9cc4', '#5b5fc7', '#0b4f9c', '#2a9d6f'];

export const unitColor = (semana: number) => UNIT_COLORS[(semana - 1) % UNIT_COLORS.length];

/** Deslocamento horizontal do nó no caminho em zigue-zague (px). */
export function pathOffset(index: number, semana: number, amplitude = 72): number {
  const dir = semana % 2 === 0 ? -1 : 1;
  return Math.round(Math.sin((index * Math.PI) / 4) * amplitude * dir);
}
