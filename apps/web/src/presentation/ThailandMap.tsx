import type { Technician } from '@technician-map/shared';
import { provinceFill } from '../domain/palette';
import { PROVINCE_NAME as nameOf, has } from '../domain/provinces';
import { MAP_VIEWBOX, PROVINCE_SHAPES } from '../infrastructure/mapData';

const MAX_DOTS = 3;

interface Props {
  readonly technicians: readonly Technician[];
  readonly selected: string | undefined;
  readonly focus: Technician | undefined;
  readonly onSelect: (code: string) => void;
}

export function ThailandMap({ technicians, selected, focus, onSelect }: Props) {
  const baseBy = new Map<string, Technician[]>();
  const countBy = new Map<string, number>();
  for (const t of technicians) {
    for (const code of t.baseProvinces) baseBy.set(code, [...(baseBy.get(code) ?? []), t]);
    for (const code of new Set([...t.baseProvinces, ...t.serviceProvinces])) {
      countBy.set(code, (countBy.get(code) ?? 0) + 1);
    }
  }

  return (
    <svg
      className="map"
      viewBox={`0 0 ${MAP_VIEWBOX.width} ${MAP_VIEWBOX.height}`}
      role="group"
      aria-label="แผนที่ประเทศไทย"
    >
      {PROVINCE_SHAPES.map((shape) => {
        const isBase = focus !== undefined && has(focus.baseProvinces, shape.code);
        const isService = focus !== undefined && has(focus.serviceProvinces, shape.code);
        const fill = isBase ? focus?.color : provinceFill(shape.tone);
        const dim = focus !== undefined && !isBase && !isService;
        return (
          <path
            key={shape.code}
            d={shape.path}
            fill={fill}
            fillOpacity={dim ? 0.45 : 1}
            stroke={isService && focus ? focus.color : selected === shape.code ? '#111' : '#fff'}
            strokeWidth={selected === shape.code || isService ? 4 : 1.5}
            strokeDasharray={isService ? '8 5' : undefined}
            className="province"
            onClick={() => onSelect(shape.code)}
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
  );
}
