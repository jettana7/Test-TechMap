import { PROP_SPREADSHEET_ID } from './config';

export function getSpreadsheet(): GoogleAppsScript.Spreadsheet.Spreadsheet {
  const id = PropertiesService.getScriptProperties().getProperty(PROP_SPREADSHEET_ID);
  if (id === null || id === '') {
    throw new Error('ยังไม่ได้ตั้งค่าระบบ กรุณารันฟังก์ชัน setupSheets ก่อน');
  }
  return SpreadsheetApp.openById(id);
}

export function getSheet(name: string): GoogleAppsScript.Spreadsheet.Sheet {
  const sheet = getSpreadsheet().getSheetByName(name);
  if (sheet === null) {
    throw new Error(`ไม่พบชีต "${name}" (ถูกลบหรือเปลี่ยนชื่อ?) ลองรัน setupSheets ใหม่`);
  }
  return sheet;
}