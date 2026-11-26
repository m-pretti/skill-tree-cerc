import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
  type RefObject,
} from 'react';
import { createPortal, flushSync } from 'react-dom';

/**
 * Arrastar e soltar com pointer events (mouse e toque).
 *
 * Marcação esperada dentro do elemento raiz (`rootRef`, que precisa ser `position: relative`):
 * - `data-drop-key="<n>"` em cada área que recebe cards (uma semana);
 * - `data-drag-id="<id>"` em cada card arrastável, na ordem em que aparecem;
 * - `data-drag-placeholder` no espaço reservado que a view renderiza em `drag.key` / `drag.index`.
 *
 * Enquanto o card é arrastado ele sai da lista e segue o ponteiro num overlay; os outros cards
 * deslizam (FLIP) para abrir espaço, e ao soltar o overlay voa até o espaço reservado.
 */

export interface DragState {
  id: string;
  /** Área e posição (entre os cards visíveis, sem contar o arrastado) onde o card vai cair. */
  key: number;
  index: number;
  originKey: number;
  originIndex: number;
  width: number;
  height: number;
  /** Animação final, do ponteiro até o espaço reservado. */
  dropping: boolean;
}

type Point = { x: number; y: number };

const EDGE = 90; // px da borda em que o auto-scroll começa
const MAX_SPEED = 26; // px por frame no limite da borda (ou além dela)
const TOUCH_DELAY = 260; // toque longo para começar a arrastar sem roubar o scroll da página
const DURATION = 220;
const EASE = 'cubic-bezier(0.2, 0.8, 0.2, 1)';
const NO_DRAG = 'select, input, textarea, .status-btn, .icon-btn, [data-no-drag]';

const reducedMotion = () =>
  typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;

/** Posição de layout dentro da raiz, ignorando scroll e transforms em andamento. */
function layoutPos(el: HTMLElement, root: HTMLElement): Point {
  let x = 0;
  let y = 0;
  let n: HTMLElement | null = el;
  while (n && n !== root) {
    x += n.offsetLeft;
    y += n.offsetTop;
    n = n.offsetParent as HTMLElement | null;
  }
  return { x, y };
}

function rootOrigin(root: HTMLElement): Point {
  const r = root.getBoundingClientRect();
  return { x: r.left + root.clientLeft, y: r.top + root.clientTop };
}

/** Velocidade do auto-scroll: cresce perto da borda e é máxima fora da área visível. */
function edgeSpeed(toStart: number, toEnd: number): number {
  const speed = (d: number) => Math.ceil(MAX_SPEED * Math.min(1, (EDGE - d) / EDGE) ** 2);
  if (toStart < EDGE) return -speed(toStart);
  if (toEnd < EDGE) return speed(toEnd);
  return 0;
}

function scrollParents(el: HTMLElement): HTMLElement[] {
  const out: HTMLElement[] = [];
  for (let n = el.parentElement; n && n !== document.body && n !== document.documentElement; n = n.parentElement) {
    const s = getComputedStyle(n);
    if (/(auto|scroll|overlay)/.test(s.overflowX + s.overflowY)) out.push(n);
  }
  return out;
}

export function useCardDrag<T extends HTMLElement>(onDrop: (id: string, key: number, index: number) => void) {
  const rootRef = useRef<T>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const [drag, setDrag] = useState<DragState | null>(null);

  const onDropRef = useRef(onDrop);
  onDropRef.current = onDrop;
  const busy = useRef(false); // um gesto em andamento (inclui a espera do toque longo e a animação final)
  const active = useRef(false); // card de fato sendo arrastado
  const paintRef = useRef<(() => void) | null>(null);
  const positions = useRef(new Map<string, Point>());
  const animations = useRef(new Map<string, Animation>());

  // Depois de iniciado, o arraste por toque não pode rolar a página.
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const block = (e: TouchEvent) => {
      if (active.current && e.cancelable) e.preventDefault();
    };
    root.addEventListener('touchmove', block, { passive: false });
    return () => {
      root.removeEventListener('touchmove', block);
      document.body.classList.remove('is-card-dragging');
    };
  }, []);

  // Posiciona o overlay assim que ele monta.
  useLayoutEffect(() => {
    if (drag && !drag.dropping) paintRef.current?.();
  }, [drag]);

  // FLIP: quem mudou de lugar desliza da posição antiga para a nova.
  useLayoutEffect(() => {
    const root = rootRef.current;
    const map = positions.current;
    if (!root || !drag) {
      map.clear();
      return;
    }
    const animate = !reducedMotion();
    const o = rootOrigin(root);
    root.querySelectorAll<HTMLElement>('[data-drag-id], [data-drag-placeholder]').forEach((el) => {
      const id = el.dataset.dragId ?? `slot:${el.closest<HTMLElement>('[data-drop-key]')?.dataset.dropKey}`;
      const p = layoutPos(el, root);
      const prev = map.get(id);
      map.set(id, p);
      if (!animate || !prev || (prev.x === p.x && prev.y === p.y)) return;
      // Parte de onde o elemento está agora na tela (inclui uma animação anterior ainda rodando).
      const r = el.getBoundingClientRect();
      const sx = prev.x - p.x + (r.left - o.x - p.x);
      const sy = prev.y - p.y + (r.top - o.y - p.y);
      animations.current.get(id)?.cancel();
      animations.current.set(
        id,
        el.animate([{ transform: `translate(${sx}px, ${sy}px)` }, { transform: 'none' }], { duration: DURATION, easing: EASE }),
      );
    });
  }, [drag]);

  const start = useCallback(
    (id: string) => (e: ReactPointerEvent<HTMLElement>) => {
      if (busy.current || e.button !== 0 || !e.isPrimary) return;
      if ((e.target as HTMLElement).closest(NO_DRAG)) return;
      const el = e.currentTarget;
      const root = rootRef.current;
      const container = el.closest<HTMLElement>('[data-drop-key]');
      if (!root || !container) return;

      busy.current = true;
      const pointerId = e.pointerId;
      const isMouse = e.pointerType === 'mouse';
      if (isMouse) e.preventDefault(); // evita seleção de texto
      const origin: Point = { x: e.clientX, y: e.clientY };
      const pointer: Point = { ...origin };
      let grab: Point = { x: 0, y: 0 };
      let state: DragState | null = null;
      let scrollers: HTMLElement[] = [];
      let frame = 0;
      let timer = 0;

      const commit = (next: DragState) => {
        state = next;
        setDrag(next);
      };

      const paint = () => {
        const o = overlayRef.current;
        if (o) o.style.transform = `translate3d(${pointer.x - grab.x}px, ${pointer.y - grab.y}px, 0)`;
      };
      paintRef.current = paint;

      const hitTest = () => {
        if (!state || state.dropping) return;
        const o = rootOrigin(root);
        const px = pointer.x - o.x;
        const py = pointer.y - o.y;
        // A semana é a que está sob o ponteiro; a posição, pelo centro do card arrastado.
        const cy = pointer.y - grab.y + state.height / 2 - o.y;
        let best: HTMLElement | null = null;
        let bestDist = Infinity;
        for (const c of Array.from(root.querySelectorAll<HTMLElement>('[data-drop-key]'))) {
          const p = layoutPos(c, root);
          const dx = Math.max(p.x - px, 0, px - (p.x + c.offsetWidth));
          const dy = Math.max(p.y - py, 0, py - (p.y + c.offsetHeight));
          const d = dx * dx + dy * dy;
          if (d < bestDist) {
            bestDist = d;
            best = c;
          }
        }
        if (!best) return;
        const key = Number(best.dataset.dropKey);
        let index = 0;
        for (const item of Array.from(best.querySelectorAll<HTMLElement>('[data-drag-id]'))) {
          if (layoutPos(item, root).y + item.offsetHeight / 2 < cy) index++;
        }
        if (key !== state.key || index !== state.index) commit({ ...state, key, index });
      };

      const autoScroll = () => {
        frame = requestAnimationFrame(autoScroll);
        if (!state || state.dropping) return;
        // Só rola na direção para onde o card foi levado (não dispara se o arraste já começa na borda).
        const allow = (s: number, axis: 'x' | 'y') =>
          (s < 0 ? pointer[axis] < origin[axis] - 8 : pointer[axis] > origin[axis] + 8) ? s : 0;
        let moved = false;
        for (const sc of scrollers) {
          const r = sc.getBoundingClientRect();
          if (sc.scrollWidth > sc.clientWidth) {
            const s = allow(edgeSpeed(pointer.x - Math.max(r.left, 0), Math.min(r.right, innerWidth) - pointer.x), 'x');
            if (s) {
              const before = sc.scrollLeft;
              sc.scrollLeft += s;
              moved ||= sc.scrollLeft !== before;
            }
          }
          if (sc.scrollHeight > sc.clientHeight) {
            const s = allow(edgeSpeed(pointer.y - Math.max(r.top, 0), Math.min(r.bottom, innerHeight) - pointer.y), 'y');
            if (s) {
              const before = sc.scrollTop;
              sc.scrollTop += s;
              moved ||= sc.scrollTop !== before;
            }
          }
        }
        const sy = allow(edgeSpeed(pointer.y, innerHeight - pointer.y), 'y');
        const sx = allow(edgeSpeed(pointer.x, innerWidth - pointer.x), 'x');
        if (sx || sy) {
          const before = { x: scrollX, y: scrollY };
          scrollBy(sx, sy);
          moved ||= scrollX !== before.x || scrollY !== before.y;
        }
        if (moved) hitTest();
      };

      const activate = () => {
        const rect = el.getBoundingClientRect();
        const items = Array.from(container.querySelectorAll<HTMLElement>('[data-drag-id]'));
        const index = Math.max(0, items.indexOf(el));
        const key = Number(container.dataset.dropKey);
        grab = { x: origin.x - rect.left, y: origin.y - rect.top };
        scrollers = scrollParents(root);
        positions.current.clear();
        active.current = true;
        document.body.classList.add('is-card-dragging');
        window.getSelection()?.removeAllRanges();
        if (!isMouse) navigator.vibrate?.(12);
        commit({ id, key, index, originKey: key, originIndex: index, width: rect.width, height: rect.height, dropping: false });
        frame = requestAnimationFrame(autoScroll);
      };

      const onMove = (ev: PointerEvent) => {
        if (ev.pointerId !== pointerId) return;
        pointer.x = ev.clientX;
        pointer.y = ev.clientY;
        if (!state) {
          const dist = Math.hypot(pointer.x - origin.x, pointer.y - origin.y);
          if (!isMouse) {
            if (dist > 10) finish(true); // era um scroll, não um arraste
            return;
          }
          if (dist >= 5) activate();
          return;
        }
        if (ev.cancelable) ev.preventDefault();
        paint();
        hitTest();
      };
      const onUp = (ev: PointerEvent) => {
        if (ev.pointerId === pointerId) finish(ev.type === 'pointercancel');
      };
      const onKey = (ev: KeyboardEvent) => {
        if (ev.key === 'Escape' && state) {
          ev.preventDefault();
          finish(true);
        }
      };
      const onScroll = () => hitTest();
      const onContextMenu = (ev: Event) => {
        if (state) ev.preventDefault();
      };
      const blockClick = (ev: MouseEvent) => {
        ev.stopPropagation();
        ev.preventDefault();
      };

      const listen = (add: boolean) => {
        const m = add ? window.addEventListener : window.removeEventListener;
        m('pointermove', onMove, { passive: false } as AddEventListenerOptions);
        m('pointerup', onUp);
        m('pointercancel', onUp);
        m('keydown', onKey);
        m('scroll', onScroll, true);
        m('contextmenu', onContextMenu);
      };

      const finish = (cancel: boolean) => {
        clearTimeout(timer);
        cancelAnimationFrame(frame);
        listen(false);
        const s: DragState | null = state;
        if (!s) {
          busy.current = false;
          return;
        }
        // O pointerup depois de arrastar não deve abrir o card.
        window.addEventListener('click', blockClick, true);
        setTimeout(() => window.removeEventListener('click', blockClick, true), 0);

        const target = cancel ? { ...s, key: s.originKey, index: s.originIndex } : s;
        flushSync(() => commit({ ...target, dropping: true }));

        const done = () => {
          state = null;
          active.current = false;
          busy.current = false;
          document.body.classList.remove('is-card-dragging');
          if (target.key !== target.originKey || target.index !== target.originIndex) {
            onDropRef.current(target.id, target.key, target.index);
          }
          setDrag(null);
        };

        const overlay = overlayRef.current;
        const slot = root.querySelector<HTMLElement>('[data-drag-placeholder]');
        if (!overlay || !slot || reducedMotion()) return done();
        // Destino pela posição de layout: o espaço reservado pode estar no meio da própria animação.
        const o = rootOrigin(root);
        const p = layoutPos(slot, root);
        const anim = overlay.animate(
          [{ transform: overlay.style.transform }, { transform: `translate3d(${o.x + p.x}px, ${o.y + p.y}px, 0)` }],
          { duration: DURATION, easing: EASE, fill: 'forwards' },
        );
        anim.onfinish = done;
        anim.oncancel = done;
      };

      listen(true);
      if (!isMouse) timer = window.setTimeout(activate, TOUCH_DELAY);
    },
    [],
  );

  return { drag, rootRef: rootRef as RefObject<T>, overlayRef, start };
}

/** Cópia do card que segue o ponteiro, fora do fluxo da página. */
export function DragOverlay({
  drag,
  overlayRef,
  children,
}: {
  drag: DragState;
  overlayRef: RefObject<HTMLDivElement>;
  children: ReactNode;
}) {
  return createPortal(
    <div
      ref={overlayRef}
      className={`drag-overlay ${drag.dropping ? 'is-dropping' : ''}`}
      style={{ width: drag.width, height: drag.height }}
      aria-hidden="true"
    >
      {children}
    </div>,
    document.body,
  );
}
