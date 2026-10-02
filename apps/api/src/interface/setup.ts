import { SheetTechnicianRepository } from '../infrastructure/SheetTechnicianRepository';
import { ScriptPropertiesDataVersion } from '../infrastructure/google/DataVersionStore';
import { SpreadsheetGateway } from '../infrastructure/google/SpreadsheetGateway';
import {
  AUDIT_HEADERS,
  PROP_SPREADSHEET_ID,
  SHEET_AUDIT,
  SHEET_TECHNICIANS,
} from '../infrastructure/google/config';
import { getSpreadsheet } from '../infrastructure/google/spreadsheetProvider';
import { COLUMN_COUNT, HEADER_LABELS, columnIndex } from '../infrastructure/sheetSchema';

type Spreadsheet = GoogleAppsScript.Spreadsheet.Spreadsheet;
type Sheet = GoogleAppsScript.Spreadsheet.Sheet;
type Range = GoogleAppsScript.Spreadsheet.Range;

const HEADER_BACKGROUND = '#E8EAF6';
const SYSTEM_BACKGROUND = '#F1F1F1';
const SYSTEM_FIRST_COLUMN = columnIndex('id') + 1;
const SYSTEM_COLUMN_COUNT = columnIndex('updatedBy') - columnIndex('id') + 1;

/** ต้องตรงกับชื่อฟังก์ชันที่ export ใน main.ts */
const HANDLER_EDIT = 'handleEdit';
const HANDLER_CHANGE = 'handleChange';

function ensureSheet(spreadsheet: Spreadsheet, name: string): Sheet {
  const existing = spreadsheet.getSheetByName(name);
  if (existing !== null) return existing;

  const sheets = spreadsheet.getSheets();
  const only = sheets[0];
  const isBlankDefault =
    sheets.length === 1 && only !== undefined && only.getLastRow() === 0 && only.getLastColumn() === 0;
  if (isBlankDefault && only !== undefined) {
    only.setName(name);
    return only;
  }
  return spreadsheet.insertSheet(name);
}

function warnOnly(range: Range, description: string): void {
  range.protect().setDescription(description).setWarningOnly(true);
}

function prepareTechniciansSheet(spreadsheet: Spreadsheet): void {
  const sheet = ensureSheet(spreadsheet, SHEET_TECHNICIANS);
  const maxRows = sheet.getMaxRows();

  sheet.getRange(1, 1, maxRows, COLUMN_COUNT).setNumberFormat('@');
  sheet
    .getRange(1, 1, 1, COLUMN_COUNT)
    .setValues([[...HEADER_LABELS]])
    .setFontWeight('bold')
    .setBackground(HEADER_BACKGROUND);
  sheet.setFrozenRows(1);
  sheet.setColumnWidth(columnIndex('baseProvinces') + 1, 240);
  sheet.setColumnWidth(columnIndex('serviceProvinces') + 1, 240);

  const systemRange = sheet.getRange(
    2,
    SYSTEM_FIRST_COLUMN,
    Math.max(maxRows - 1, 1),
    SYSTEM_COLUMN_COUNT,
  );
  systemRange.setBackground(SYSTEM_BACKGROUND);

  for (const protection of sheet.getProtections(SpreadsheetApp.ProtectionType.RANGE)) {
    protection.remove();
  }
  warnOnly(sheet.getRange(1, 1, 1, COLUMN_COUNT), 'หัวตาราง: ห้ามสลับลำดับ ลบ หรือแทรกคอลัมน์');
  warnOnly(systemRange, 'คอลัมน์ของระบบ (id, เวลาแก้ไข, ผู้แก้ไข): ปกติไม่ต้องแก้');
}

function prepareAuditSheet(spreadsheet: Spreadsheet): void {
  const sheet = ensureSheet(spreadsheet, SHEET_AUDIT);
  sheet.getRange(1, 1, sheet.getMaxRows(), AUDIT_HEADERS.length).setNumberFormat('@');
  sheet
    .getRange(1, 1, 1, AUDIT_HEADERS.length)
    .setValues([[...AUDIT_HEADERS]])
    .setFontWeight('bold')
    .setBackground(HEADER_BACKGROUND);
  sheet.setFrozenRows(1);
  sheet.setColumnWidth(5, 400);
}

export function setupSheets(): void {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  if (spreadsheet === null) {
    throw new Error('สคริปต์นี้ต้องผูกกับ Google Sheet (สร้างด้วย clasp create-script --type sheets)');
  }
  PropertiesService.getScriptProperties().setProperty(PROP_SPREADSHEET_ID, spreadsheet.getId());
  prepareTechniciansSheet(spreadsheet);
  prepareAuditSheet(spreadsheet);
  Logger.log(`ตั้งค่าชีตเรียบร้อย: ${spreadsheet.getUrl()}`);
}

export function installTriggers(): void {
  const spreadsheet = getSpreadsheet();

  for (const trigger of ScriptApp.getProjectTriggers()) {
    const name = trigger.getHandlerFunction();
    if (name === HANDLER_EDIT || name === HANDLER_CHANGE) ScriptApp.deleteTrigger(trigger);
  }

  ScriptApp.newTrigger(HANDLER_EDIT).forSpreadsheet(spreadsheet).onEdit().create();
  ScriptApp.newTrigger(HANDLER_CHANGE).forSpreadsheet(spreadsheet).onChange().create();
  Logger.log('ติดตั้ง trigger เรียบร้อย');
}

export function checkSetup(): void {
  const snapshot = new SheetTechnicianRepository(new SpreadsheetGateway()).snapshot();
  const version = new ScriptPropertiesDataVersion().current();
  Logger.log(
    `ช่าง ${snapshot.technicians.length} คน | ข้อมูลผิดปกติ ${snapshot.issues.length} รายการ | version ${version}`,
  );
  for (const issue of snapshot.issues) {
    Logger.log(`แถว ${issue.sheetRow}: ${issue.message}`);
  }
  const handlers = ScriptApp.getProjectTriggers().map((t) => t.getHandlerFunction());
  Logger.log(`Triggers: ${handlers.length === 0 ? '(ยังไม่มี)' : handlers.join(', ')}`);
}