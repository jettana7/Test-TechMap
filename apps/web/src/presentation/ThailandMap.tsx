import type { Technician } from '@technician-map/shared';
import { useEffect, useRef, useState, type PointerEvent } from 'react';
import { useI18n } from '../application/I18nContext';
import { INITIAL_VIEW, focusAt, panBy, toMapPoint, zoomAround, type View } from '../domain/mapView';
import { provinceFill } from '../domain/palette';
import { has } from '../domain/provinces';
import { MAP_VIEWBOX, PROVINCE_SHAPES } from '../infrastructure/mapData';

const MAX_DOTS = 3;
const DRAG_THRESHOLD = 6;
const { width: W, height: H } = MAP_VIEWBOX;

type MapMode = 'normal' | 'coverage';

interface Props {
  readonly technicians: readonly Technician[];
  readonly selected: string | undefined;
  readonly focus: Technician | undefined;
  readonly onSelect: (code: string) => void;
  readonly onClearProvince: () => void;
  readonly onClearFocus: () => void;
}

export function ThailandMap({
  technicians,
  selected,
  focus,
  onSelect,
  onClearProvince,
  onClearFocus,
}: Props) {
  const { t, label } = useI18n();
  const svgRef = useRef<SVGSVGElement>(null);
  const [view, setView] = useState<View>(INITIAL_VIEW);
  const [mapMode, setMapMode] = useState<MapMode>('normal');
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
    if (selected !== undefined) {
      const shape = PROVINCE_SHAPES.find((s) => s.code === selected);
      if (shape) {
        setView(focusAt(shape.cx, shape.cy, 2.5, W, H));
        return;
      }
    }
    if (focus !== undefined) {
      const codes = [...focus.baseProvinces, ...focus.serviceProvinces];
      const shapes = PROVINCE_SHAPES.filter((s) => has(codes, s.code));
      if (shapes.length > 0) {
        const cx = shapes.reduce((sum, s) => sum + s.cx, 0) / shapes.length;
        const cy = shapes.reduce((sum, s) => sum + s.cy, 0) / shapes.length;
        setView(focusAt(cx, cy, shapes.length <= 3 ? 2.2 : 1.6, W, H));
        return;
      }
    }
    setView(INITIAL_VIEW);
  }, [selected, focus]);

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
  for (const tech of technicians) {
    for (const code of tech.baseProvinces) baseBy.set(code, [...(baseBy.get(code) ?? []), tech]);
    for (const code of new Set([...tech.baseProvinces, ...tech.serviceProvinces])) {
      countBy.set(code, (countBy.get(code) ?? 0) + 1);
    }
  }

  const coveredCount = PROVINCE_SHAPES.filter((s) => (countBy.get(s.code) ?? 0) > 0).length;
  const uncoveredCount = PROVINCE_SHAPES.length - coveredCount;

  return (
    <div className="mapbox">
      <div className="map-topbar">
        <div className="map-mode-switch" role="group" aria-label={t('mapLabel')}>
          <button
            type="button"
            className={`mode-btn ${mapMode === 'normal' ? 'active' : ''}`}
            onClick={() => setMapMode('normal')}
          >
            🗺️ {t('mapModeNormal')}
          </button>
          <button
            type="button"
            className={`mode-btn ${mapMode === 'coverage' ? 'active' : ''}`}
            onClick={() => setMapMode('coverage')}
          >
            🔍 {t('mapModeCoverage')}
          </button>
        </div>

        {mapMode === 'coverage' && (
          <span className="coverage-badge">
            {t('coverageSummary', { covered: coveredCount, empty: uncoveredCount })}
          </span>
        )}

        <div className="map-pills">
          {selected && (
            <button type="button" className="map-chip" onClick={onClearProvince}>
              📍 {t('mapViewingProvince', { prov: label(selected) })} ×
            </button>
          )}
          {focus && (
            <button type="button" className="map-chip" onClick={onClearFocus}>
              <span className="color-dot" style={{ background: focus.color }} aria-hidden="true" />
              {t('mapViewingTech', { name: focus.nickname, code: focus.code })} ×
            </button>
          )}
        </div>
      </div>

      <div className="map-canvas">
        <svg
          ref={svgRef}
          className={`map${view.k > 1 ? ' zoomed' : ''}`}
          viewBox={`${view.x} ${view.y} ${W / view.k} ${H / view.k}`}
          role="group"
          aria-label={t('mapLabel')}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerEnd}
          onPointerCancel={onPointerEnd}
        >
          {PROVINCE_SHAPES.map((shape) => {
            const total = countBy.get(shape.code) ?? 0;
            const isBase = focus !== undefined && has(focus.baseProvinces, shape.code);
            const isService = focus !== undefined && has(focus.serviceProvinces, shape.code);
            const isSelected = selected === shape.code;
            const dim = focus !== undefined && !isBase && !isService;

            let fill = provinceFill(shape.tone);
            if (isBase && focus) {
              fill = focus.color;
            } else if (mapMode === 'coverage' && !focus) {
              fill = total > 0 ? '#86efac' : '#fca5a5';
            }

            return (
              <path
                key={shape.code}
                d={shape.path}
                fill={fill}
                fillOpacity={dim ? 0.38 : 1}
                stroke={isService && focus ? focus.color : isSelected ? '#0f172a' : '#fff'}
                strokeWidth={isSelected || isService ? 2.6 : 1}
                strokeDasharray={isService ? '6 4' : undefined}
                vectorEffect="non-scaling-stroke"
                className="province"
                onClick={() => {
                  if (dragged.current <= DRAG_THRESHOLD) onSelect(shape.code);
                }}
              >
                <title>
                  {label(shape.code)} ({total})
                </title>
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
                {dots.map((tech, i) => (
                  <circle
                    key={tech.id}
                    cx={shape.cx + (i - (dots.length - 1) / 2) * 13}
                    cy={shape.cy - 6}
                    r={5.5}
                    fill={tech.color}
                    fillOpacity={tech.available !== false ? 1 : 0.55}
                    stroke="#fff"
                    strokeWidth={1.5}
                    strokeDasharray={tech.available !== false ? undefined : '2 1.5'}
                  />
                ))}
                <text x={shape.cx} y={shape.cy + 12} textAnchor="middle" className="count">
                  {extra > 0 ? `+${extra} ` : ''}
                  {total}
                </text>
              </g>
            );
          })}
        </svg>

        <div className="zoomctl">
          <button type="button" aria-label={t('zoomIn')} onClick={() => zoomAtCenter(1.5)}>
            +
          </button>
          <button type="button" aria-label={t('zoomOut')} onClick={() => zoomAtCenter(1 / 1.5)}>
            −
          </button>
          <button type="button" aria-label={t('zoomReset')} onClick={() => setView(INITIAL_VIEW)}>
            ⟲
          </button>
        </div>
      </div>

      <div className="map-legend">
        {focus ? (
          <>
            <span className="legend-item">
              <span className="legend-swatch solid" style={{ background: focus.color }} />
              {t('legendFocusBase')}
            </span>
            <span className="legend-item">
              <span className="legend-swatch dashed" style={{ borderColor: focus.color }} />
              {t('legendFocusService')}
            </span>
          </>
        ) : mapMode === 'coverage' ? (
          <>
            <span className="legend-item">
              <span className="legend-swatch solid" style={{ background: '#86efac' }} />
              {t('legendCovered')}
            </span>
            <span className="legend-item">
              <span className="legend-swatch solid" style={{ background: '#fca5a5' }} />
              {t('legendUncovered')}
            </span>
          </>
        ) : (
          <>
            <span className="legend-item">
              <span className="legend-dot" />
              {t('legendBaseDot')}
            </span>
            <span className="legend-item">
              <span className="legend-num">1</span>
              {t('legendTotalCount')}
            </span>
          </>
        )}
      </div>
    </div>
  );
}
