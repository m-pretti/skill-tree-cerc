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

/** Cores pastéis das unidades (semanas): fundo suave, tom médio e texto. */
export interface UnitColor {
  soft: string;
  base: string;
  ink: string;
}

export const UNIT_COLORS: UnitColor[] = [
  { soft: '#e3eefa', base: '#b5d0f0', ink: '#2d5784' }, // azul
  { soft: '#ddf2ea', base: '#a8dcc8', ink: '#256b56' }, // menta
  { soft: '#ebe7f8', base: '#c8bfee', ink: '#544893' }, // lavanda
  { soft: '#fdebdd', base: '#f5c7a6', ink: '#8c522b' }, // pêssego
  { soft: '#dcf1f6', base: '#a6d7e5', ink: '#23667a' }, // céu
  { soft: '#f9e3ea', base: '#efbacb', ink: '#8a3d58' }, // rosa
];

export const unitColor = (semana: number) => UNIT_COLORS[(semana - 1) % UNIT_COLORS.length];

/** Deslocamento horizontal do nó no caminho em zigue-zague (px). */
export function pathOffset(index: number, semana: number, amplitude = 72): number {
  const dir = semana % 2 === 0 ? -1 : 1;
  return Math.round(Math.sin((index * Math.PI) / 4) * amplitude * dir);
}
