export interface View { readonly k: number; readonly x: number; readonly y: number }
export interface Box { readonly left: number; readonly top: number; readonly width: number; readonly height: number }

export const MIN_K = 1;
export const MAX_K = 8;
export const INITIAL_VIEW: View = { k: 1, x: 0, y: 0 };

const clampK = (k: number): number => Math.min(MAX_K, Math.max(MIN_K, k));

/** บังคับให้กรอบที่มองอยู่ไม่หลุดออกนอกแผนที่ */
export function clampView(v: View, W: number, H: number): View {
  const k = clampK(v.k);
  return {
    k,
    x: Math.min(W - W / k, Math.max(0, v.x)),
    y: Math.min(H - H / k, Math.max(0, v.y)),
  };
}

/** ซูมโดยคงจุด (px, py) ในพิกัดแผนที่ไว้ที่ตำแหน่งเดิมบนหน้าจอ */
export function zoomAround(v: View, factor: number, px: number, py: number, W: number, H: number): View {
  const k = clampK(v.k * factor);
  const fx = (px - v.x) / (W / v.k);
  const fy = (py - v.y) / (H / v.k);
  return clampView({ k, x: px - fx * (W / k), y: py - fy * (H / k) }, W, H);
}

/** แปลงตำแหน่งบนหน้าจอเป็นพิกัดแผนที่ (นับขอบว่างจาก preserveAspectRatio) scale = พิกเซลต่อ 1 หน่วยแผนที่ */
export function toMapPoint(v: View, box: Box, cx: number, cy: number, W: number, H: number) {
  const w = W / v.k;
  const h = H / v.k;
  const scale = Math.min(box.width / w, box.height / h);
  const offX = (box.width - w * scale) / 2;
  const offY = (box.height - h * scale) / 2;
  return { x: v.x + (cx - box.left - offX) / scale, y: v.y + (cy - box.top - offY) / scale, scale };
}

export function panBy(v: View, dxPx: number, dyPx: number, scale: number, W: number, H: number): View {
  return clampView({ ...v, x: v.x - dxPx / scale, y: v.y - dyPx / scale }, W, H);
}
