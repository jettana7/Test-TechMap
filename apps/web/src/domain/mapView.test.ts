import { describe, expect, it } from 'vitest';
import { INITIAL_VIEW, MAX_K, clampView, panBy, toMapPoint, zoomAround } from './mapView';

const W = 500;
const H = 1000;

describe('mapView', () => {
  it('ซูมแล้วจุดใต้เมาส์อยู่ที่เดิมบนหน้าจอ', () => {
    const box = { left: 10, top: 20, width: 500, height: 1000 };
    const before = toMapPoint(INITIAL_VIEW, box, 210, 520, W, H);
    const v = zoomAround(INITIAL_VIEW, 2, before.x, before.y, W, H);
    const after = toMapPoint(v, box, 210, 520, W, H);
    expect(after.x).toBeCloseTo(before.x, 6);
    expect(after.y).toBeCloseTo(before.y, 6);
    expect(v.k).toBe(2);
  });

  it('ไม่ซูมออกต่ำกว่า 1 และไม่ซูมเข้าเกินสูงสุด และกรอบไม่หลุดขอบ', () => {
    expect(zoomAround(INITIAL_VIEW, 0.1, 100, 100, W, H)).toEqual(INITIAL_VIEW);
    expect(zoomAround(INITIAL_VIEW, 1000, 100, 100, W, H).k).toBe(MAX_K);
    const v = clampView({ k: 2, x: -50, y: 9999 }, W, H);
    expect(v).toEqual({ k: 2, x: 0, y: H - H / 2 });
  });

  it('ลากแผนที่ได้เมื่อซูมแล้ว แต่ไม่เลื่อนหลุดขอบ', () => {
    const zoomed = { k: 2, x: 100, y: 200 };
    const moved = panBy(zoomed, 50, 0, 1, W, H);
    expect(moved.x).toBe(50);
    expect(panBy(zoomed, -99999, 0, 1, W, H).x).toBe(W - W / 2);
    expect(panBy(INITIAL_VIEW, 80, 80, 1, W, H)).toEqual(INITIAL_VIEW);
  });

  it('คำนวณขอบว่างเมื่อกล่องกว้างกว่าสัดส่วนแผนที่', () => {
    const box = { left: 0, top: 0, width: 1000, height: 1000 };
    const p = toMapPoint(INITIAL_VIEW, box, 500, 500, W, H);
    expect(p.x).toBeCloseTo(250, 6);
    expect(p.y).toBeCloseTo(500, 6);
  });
});
