export interface SheetGateway {
  /**
   * คืนทุกแถวใต้หัวตารางตามลำดับในชีต (รวมแถวว่างที่คั่นอยู่)
   * ทุกค่าต้องเป็น string และแต่ละแถวกว้างเท่าจำนวนคอลัมน์
   */
  readRows(): string[][];
  /** เพิ่มแถวต่อท้าย */
  appendRow(values: readonly string[]): void;
  /** เขียนทับทั้งแถว โดย sheetRow เป็นเลขแถวจริงในชีต (แถวข้อมูลแรก = 2) */
  writeRow(sheetRow: number, values: readonly string[]): void;
}