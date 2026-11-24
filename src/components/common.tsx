import { useEffect, type CSSProperties, type ReactNode } from 'react';
import { Check, Circle, LoaderCircle, X } from 'lucide-react';
import type { Status, Tag } from '../types';
import { STATUS_LABEL } from '../types';

export const FALLBACK_TAG: Tag = { id: '?', nome: '—', cor: '#8A9BB0' };

export function StatusIcon({ status, size = 15 }: { status: Status; size?: number }) {
  if (status === 'done') return <Check size={size} strokeWidth={2.4} />;
  if (status === 'doing') return <LoaderCircle size={size} strokeWidth={2.2} />;
  return <Circle size={size} strokeWidth={1.8} />;
}

export function StatusButton({ status, onClick }: { status: Status; onClick: () => void }) {
  return (
    <button
      type="button"
      className={`status-btn st-${status}`}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      title={`${STATUS_LABEL[status]} — clique para avançar`}
      aria-label={`Status: ${STATUS_LABEL[status]}. Avançar status`}
    >
      <StatusIcon status={status} />
    </button>
  );
}

export function TagChip({ tags, children }: { tags: Tag[]; children?: ReactNode }) {
  const main = tags[0] ?? FALLBACK_TAG;
  return (
    <span className="chip" style={{ '--tag': main.cor } as CSSProperties}>
      {tags.map((t) => t.nome).join(' | ')}
      {children}
    </span>
  );
}

export function Modal({
  title,
  onClose,
  children,
  footer,
  wide,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
  wide?: boolean;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className={`modal ${wide ? 'modal-wide' : ''}`} role="dialog" aria-modal="true" aria-label={title}>
        <header className="modal-head">
          <h2>{title}</h2>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Fechar">
            <X size={18} />
          </button>
        </header>
        <div className="modal-body">{children}</div>
        {footer && <footer className="modal-foot">{footer}</footer>}
      </div>
    </div>
  );
}
