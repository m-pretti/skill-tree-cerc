/**
 * Level 1 exige 3 cards; cada level seguinte exige um card a mais que o anterior.
 * Ex.: 47 concluídos → Level 8, 5/10 para o próximo.
 */
export const FIRST_LEVEL_COST = 3;

export interface LevelInfo {
  level: number;
  inLevel: number;
  need: number;
  pct: number;
}

export function computeLevel(done: number): LevelInfo {
  let level = 1;
  let need = FIRST_LEVEL_COST;
  let rest = done;
  while (rest >= need) {
    rest -= need;
    level += 1;
    need = level + FIRST_LEVEL_COST - 1;
  }
  return { level, inLevel: rest, need, pct: Math.round((rest / need) * 100) };
}
