export const COLOR_PALETTE = [
  '#E53935', // แดง
  '#FB8C00', // ส้ม
  '#FDD835', // เหลือง
  '#43A047', // เขียว
  '#00897B', // เขียวน้ำทะเล
  '#00ACC1', // ฟ้าเขียว
  '#1E88E5', // น้ำเงิน
  '#3949AB', // คราม
  '#8E24AA', // ม่วง
  '#D81B60', // ชมพู
  '#6D4C41', // น้ำตาล
  '#546E7A', // เทาน้ำเงิน
] as const;

export function pickColor(usedColors: readonly string[]): string {
  const counts = new Map<string, number>();
  for (const color of usedColors) {
    const key = color.toUpperCase();
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  let best: string = COLOR_PALETTE[0];
  let bestCount = Number.POSITIVE_INFINITY;
  for (const color of COLOR_PALETTE) {
    const count = counts.get(color) ?? 0;
    if (count < bestCount) {
      best = color;
      bestCount = count;
    }
  }
  return best;
}