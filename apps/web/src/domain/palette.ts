/** สีพาสเทลของจังหวัด (เลขสีมาจาก mapData: จังหวัดที่ติดกันไม่ซ้ำกัน) */
export const PROVINCE_FILLS: readonly string[] = [
  '#FDE2E4', '#E2ECE9', '#FFF1C9', '#DFE7FD', '#EADCF8', '#D6EADF',
  '#FCE1CF', '#D8F0F5', '#F1E4D4', '#E6EFC8', '#F5D9EC', '#DCE3EA',
];

export function provinceFill(tone: number): string {
  return PROVINCE_FILLS[tone % PROVINCE_FILLS.length] ?? '#EEEEEE';
}
