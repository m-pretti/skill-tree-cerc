import { useState, type FormEvent } from 'react';
import { Trash2 } from 'lucide-react';
import type { Card, Status, Tag } from '../types';
import { STATUS_LABEL, STATUS_ORDER } from '../types';
import type { CardDraft } from '../store';
import { Modal, StatusIcon } from './common';

interface Props {
  card?: Card;
  /** Abre já com este status selecionado (ex.: ao tentar concluir sem anotação). */
  initialStatus?: Status;
  defaultSemana: number;
  eixos: Tag[];
  trilhas: Tag[];
  onSave: (draft: CardDraft) => void;
  onDelete?: () => void;
  onClose: () => void;
}

export function CardModal({ card, initialStatus, defaultSemana, eixos, trilhas, onSave, onDelete, onClose }: Props) {
  const [titulo, setTitulo] = useState(card?.titulo ?? '');
  const [semana, setSemana] = useState(card?.semana ?? defaultSemana);
  const [eixoId, setEixoId] = useState(card?.eixoId ?? eixos[0]?.id ?? '');
  const [trilhaId, setTrilhaId] = useState(card?.trilhaId ?? trilhas[0]?.id ?? '');
  const [status, setStatus] = useState<Status>(initialStatus ?? card?.status ?? 'todo');
  const [nota, setNota] = useState(card?.nota ?? '');

  // Concluir exige anotação. Cards que já estavam concluídos sem nota (antes da regra) continuam válidos.
  const legacyDone = card?.status === 'done' && !card.nota?.trim();
  const needsNote = status === 'done' && !nota.trim() && !legacyDone;
  const canSave = titulo.trim().length > 0 && semana >= 1 && eixoId && trilhaId && !needsNote;

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!canSave) return;
    const trimmedNota = nota.trim();
    onSave({ titulo: titulo.trim(), semana, eixoId, trilhaId, status, nota: trimmedNota || undefined });
  };

  return (
    <Modal
      title={card ? 'Editar card' : 'Novo card'}
      onClose={onClose}
      footer={
        <>
          {onDelete && (
            <button
              type="button"
              className="danger-btn"
              onClick={() => {
                if (confirm(`Excluir o card "${card?.titulo}"?`)) onDelete();
              }}
            >
              <Trash2 size={16} /> Excluir
            </button>
          )}
          <span className="spacer" />
          <button type="button" className="outline-btn" onClick={onClose}>
            Cancelar
          </button>
          <button type="submit" form="card-form" className="primary-btn" disabled={!canSave}>
            Salvar
          </button>
        </>
      }
    >
      <form id="card-form" className="form" onSubmit={submit}>
        <label className="field">
          <span>Título</span>
          <input autoFocus={!initialStatus} value={titulo} onChange={(e) => setTitulo(e.target.value)} placeholder="Ex.: Circuit Breaker" />
        </label>

        <div className="field-row">
          <label className="field">
            <span>Semana</span>
            <input type="number" min={1} value={semana} onChange={(e) => setSemana(Math.max(1, Number(e.target.value) || 1))} />
          </label>
          <label className="field">
            <span>Eixo</span>
            <select value={eixoId} onChange={(e) => setEixoId(e.target.value)}>
              {eixos.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.nome}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>Trilha</span>
            <select value={trilhaId} onChange={(e) => setTrilhaId(e.target.value)}>
              {trilhas.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.nome}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="field">
          <span>Status</span>
          <div className="status-picker" role="radiogroup" aria-label="Status">
            {STATUS_ORDER.map((s) => (
              <button
                key={s}
                type="button"
                role="radio"
                aria-checked={status === s}
                className={`st-${s} ${status === s ? 'on' : ''}`}
                onClick={() => setStatus(s)}
              >
                <StatusIcon status={s} size={16} /> {STATUS_LABEL[s]}
              </button>
            ))}
          </div>
        </div>

        <label className={`field ${needsNote ? 'field-required' : ''}`}>
          <span>Anotação{status === 'done' && !legacyDone ? ' *' : ''}</span>
          <textarea
            rows={4}
            autoFocus={initialStatus === 'done'}
            value={nota}
            onChange={(e) => setNota(e.target.value)}
            placeholder={status === 'done' ? 'O que você aprendeu? Resumo, links, pontos-chave…' : 'Links, resumo, pontos-chave…'}
            aria-invalid={needsNote}
          />
          {needsNote && <small className="field-hint">Escreva uma anotação para marcar o card como concluído.</small>}
        </label>
      </form>
    </Modal>
  );
}
