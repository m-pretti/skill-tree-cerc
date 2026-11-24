import { useRef } from 'react';
import { CircleCheck, CircleDashed, Download, Layers, LoaderCircle, RotateCcw, Upload } from 'lucide-react';
import type { Card } from '../types';
import { computeLevel } from '../level';

interface Props {
  cards: Card[];
  onReset: () => void;
  onExport: () => void;
  onImport: (file: File) => void;
}

export function ProgressPanel({ cards, onReset, onExport, onImport }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const done = cards.filter((c) => c.status === 'done').length;
  const doing = cards.filter((c) => c.status === 'doing').length;
  const todo = cards.length - done - doing;
  const total = cards.length;
  const { level, inLevel, need, pct } = computeLevel(done);
  const journey = total ? Math.round((done / total) * 100) : 0;

  const stats = [
    { label: 'Concluídos', value: done, icon: <CircleCheck size={14} />, cls: 'st-done' },
    { label: 'Em curso', value: doing, icon: <LoaderCircle size={14} />, cls: 'st-doing' },
    { label: 'Pendentes', value: todo, icon: <CircleDashed size={14} />, cls: 'st-todo' },
    { label: 'Total', value: total, icon: <Layers size={14} />, cls: 'st-total' },
  ];

  return (
    <section className="panel hero">
      <div className="hero-top">
        <div>
          <p className="eyebrow">CERC · Skill Tree</p>
          <h1 className="level-title">
            Level {level}
            <span className="level-sub">
              — {inLevel}/{need} cards para o próximo level
            </span>
          </h1>
        </div>
        <div className="hero-actions">
          <button type="button" className="ghost-btn" onClick={onExport} title="Baixar backup em JSON">
            <Download size={15} /> Exportar
          </button>
          <button type="button" className="ghost-btn" onClick={() => fileRef.current?.click()} title="Restaurar de um backup JSON">
            <Upload size={15} /> Importar
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            hidden
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) onImport(f);
              e.target.value = '';
            }}
          />
          <button type="button" className="ghost-btn" onClick={onReset}>
            <RotateCcw size={15} /> Zerar progresso
          </button>
        </div>
      </div>

      <div className="progress-head">
        <span>Progresso do Level {level}</span>
        <strong>{pct}%</strong>
      </div>
      <div className="progress" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
        <div className="progress-fill" style={{ width: `${pct}%` }} />
      </div>
      <p className="progress-note">
        {done} de {total} cards concluídos ({journey}% da jornada). Cada level exige um card a mais que o anterior.
      </p>

      <div className="stats">
        {stats.map((s) => (
          <div key={s.label} className={`stat ${s.cls}`}>
            <span className="stat-label">
              {s.icon} {s.label}
            </span>
            <span className="stat-value">{s.value}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
