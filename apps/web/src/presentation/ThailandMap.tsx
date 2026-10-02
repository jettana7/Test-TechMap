import type { Technician } from '@technician-map/shared';
import { useEffect, useRef, useState, type PointerEvent } from 'react';
import { INITIAL_VIEW, panBy, toMapPoint, zoomAround, type View } from '../domain/mapView';
import { provinceFill } from '../domain/palette';
import { PROVINCE_NAME as nameOf, has } from '../domain/provinces';
import { MAP_VIEWBOX, PROVINCE_SHAPES } from '../infrastructure/mapData';

const MAX_DOTS = 3;
const DRAG_THRESHOLD = 6;
const { width: W, height: H } = MAP_VIEWBOX;

interface Props {
  readonly technicians: readonly Technician[];
  readonly selected: string | undefined;
  readonly focus: Technician | undefined;
  readonly onSelect: (code: string) => void;
}

export function ThailandMap({ technicians, selected, focus, onSelect }: Props) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [view, setView] = useState<View>(INITIAL_VIEW);
  const viewRef = useRef(view);
  viewRef.current = view;
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const dragged = useRef(0);
  const pinchDistance = useRef(0);

  const zoomAtScreen = (factor: number, clientX: number, clientY: number): void => {
    const el = svgRef.current;
    if (!el) return;
    const p = toMapPoint(viewRef.current, el.getBoundingClientRect(), clientX, clientY, W, H);
    setView(zoomAround(viewRef.current, factor, p.x, p.y, W, H));
  };

  const zoomAtCenter = (factor: number): void => {
    const v = viewRef.current;
    setView(zoomAround(v, factor, v.x + W / v.k / 2, v.y + H / v.k / 2, W, H));
  };

  useEffect(() => {
    const el = svgRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent): void => {
      e.preventDefault();
      const p = toMapPoint(viewRef.current, el.getBoundingClientRect(), e.clientX, e.clientY, W, H);
      setView(zoomAround(viewRef.current, e.deltaY < 0 ? 1.2 : 1 / 1.2, p.x, p.y, W, H));
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, []);

  const distance = (): number => {
    const [a, b] = [...pointers.current.values()];
    return a && b ? Math.hypot(a.x - b.x, a.y - b.y) : 0;
  };

  const onPointerDown = (e: PointerEvent<SVGSVGElement>): void => {
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    dragged.current = 0;
    pinchDistance.current = distance();
  };

  const onPointerMove = (e: PointerEvent<SVGSVGElement>): void => {
    const prev = pointers.current.get(e.pointerId);
    const el = svgRef.current;
    if (!prev || !el) return;
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

    if (pointers.current.size === 2) {
      const d = distance();
      const [a, b] = [...pointers.current.values()];
      if (pinchDistance.current > 0 && a && b) {
        zoomAtScreen(d / pinchDistance.current, (a.x + b.x) / 2, (a.y + b.y) / 2);
      }
      pinchDistance.current = d;
      dragged.current = DRAG_THRESHOLD + 1;
      return;
    }

    dragged.current += Math.abs(e.clientX - prev.x) + Math.abs(e.clientY - prev.y);
    if (dragged.current <= DRAG_THRESHOLD || viewRef.current.k === 1) return;
    if (!el.hasPointerCapture(e.pointerId)) el.setPointerCapture(e.pointerId);
    const { scale } = toMapPoint(viewRef.current, el.getBoundingClientRect(), 0, 0, W, H);
    setView(panBy(viewRef.current, e.clientX - prev.x, e.clientY - prev.y, scale, W, H));
  };

  const onPointerEnd = (e: PointerEvent<SVGSVGElement>): void => {
    pointers.current.delete(e.pointerId);
    pinchDistance.current = 0;
  };

  const baseBy = new Map<string, Technician[]>();
  const countBy = new Map<string, number>();
  for (const t of technicians) {
    for (const code of t.baseProvinces) baseBy.set(code, [...(baseBy.get(code) ?? []), t]);
    for (const code of new Set([...t.baseProvinces, ...t.serviceProvinces])) {
      countBy.set(code, (countBy.get(code) ?? 0) + 1);
    }
  }

  return (
    <div className="mapbox">
      <svg
        ref={svgRef}
        className={`map${view.k > 1 ? ' zoomed' : ''}`}
        viewBox={`${view.x} ${view.y} ${W / view.k} ${H / view.k}`}
        role="group"
        aria-label="แผนที่ประเทศไทย"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerEnd}
        onPointerCancel={onPointerEnd}
      >
        {PROVINCE_SHAPES.map((shape) => {
          const isBase = focus !== undefined && has(focus.baseProvinces, shape.code);
          const isService = focus !== undefined && has(focus.serviceProvinces, shape.code);
          const isSelected = selected === shape.code;
          const dim = focus !== undefined && !isBase && !isService;
          return (
            <path
              key={shape.code}
              d={shape.path}
              fill={isBase ? focus?.color : provinceFill(shape.tone)}
              fillOpacity={dim ? 0.45 : 1}
              stroke={isService && focus ? focus.color : isSelected ? '#111' : '#fff'}
              strokeWidth={isSelected || isService ? 2.5 : 1}
              strokeDasharray={isService ? '6 4' : undefined}
              vectorEffect="non-scaling-stroke"
              className="province"
              onClick={() => {
                if (dragged.current <= DRAG_THRESHOLD) onSelect(shape.code);
              }}
            >
              <title>{nameOf.get(shape.code)}</title>
            </path>
          );
        })}
        {PROVINCE_SHAPES.map((shape) => {
          const dots = (baseBy.get(shape.code) ?? []).slice(0, MAX_DOTS);
          const total = countBy.get(shape.code) ?? 0;
          if (total === 0) return null;
          const extra = (baseBy.get(shape.code)?.length ?? 0) - dots.length;
          return (
            <g key={shape.code} pointerEvents="none">
              {dots.map((t, i) => (
                <circle key={t.id} cx={shape.cx + (i - (dots.length - 1) / 2) * 13} cy={shape.cy - 6} r={5.5} fill={t.color} stroke="#fff" strokeWidth={1.5} />
              ))}
              <text x={shape.cx} y={shape.cy + 12} textAnchor="middle" className="count">
                {extra > 0 ? `+${extra} ` : ''}{total}
              </text>
            </g>
          );
        })}
      </svg>
      <div className="zoomctl">
        <button aria-label="ซูมเข้า" onClick={() => zoomAtCenter(1.5)}>+</button>
        <button aria-label="ซูมออก" onClick={() => zoomAtCenter(1 / 1.5)}>−</button>
        <button aria-label="รีเซ็ตมุมมอง" onClick={() => setView(INITIAL_VIEW)}>⟲</button>
      </div>
    </div>
  );
}
