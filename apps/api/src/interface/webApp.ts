import { Login, VerifyToken, type AuthDeps } from '../application/authUseCases';
import {
  CreateTechnician,
  DeleteTechnician,
  UpdateTechnician,
  type UseCaseDeps,
} from '../application/technicianUseCases';
import { SheetTechnicianRepository } from '../infrastructure/SheetTechnicianRepository';
import {
  AppsScriptSigner,
  CacheLoginThrottle,
  ScriptPropertiesAuthSecrets,
} from '../infrastructure/google/AuthAdapters';
import { ScriptPropertiesDataVersion } from '../infrastructure/google/DataVersionStore';
import { SheetAuditLogger } from '../infrastructure/google/SheetAuditLogger';
import { SpreadsheetGateway } from '../infrastructure/google/SpreadsheetGateway';
import { withLock } from '../infrastructure/google/lock';
import { SystemClock, UuidGenerator } from '../infrastructure/google/systemAdapters';
import { handleRequest, type RouterDeps } from './router';

/** ส่วนของ event ที่ใช้จริง */
interface PostEvent {
  readonly postData?: { readonly contents?: string };
}

function buildRouterDeps(): RouterDeps {
  const repository = new SheetTechnicianRepository(new SpreadsheetGateway());
  const clock = new SystemClock();

  const useCaseDeps: UseCaseDeps = {
    repository,
    clock,
    ids: new UuidGenerator(),
    audit: new SheetAuditLogger(),
  };
  const authDeps: AuthDeps = {
    secrets: new ScriptPropertiesAuthSecrets(),
    signer: new AppsScriptSigner(),
    clock,
    throttle: new CacheLoginThrottle(),
  };

  return {
    login: new Login(authDeps),
    verify: new VerifyToken(authDeps),
    snapshots: repository,
    version: new ScriptPropertiesDataVersion(),
    create: new CreateTechnician(useCaseDeps),
    update: new UpdateTechnician(useCaseDeps),
    remove: new DeleteTechnician(useCaseDeps),
    runExclusive: withLock,
    logError: (message) => Logger.log(message),
  };
}

function jsonOutput(body: unknown): GoogleAppsScript.Content.TextOutput {
  return ContentService.createTextOutput(JSON.stringify(body)).setMimeType(
    ContentService.MimeType.JSON,
  );
}

export function doPost(event?: PostEvent): GoogleAppsScript.Content.TextOutput {
  const response = handleRequest(event?.postData?.contents, buildRouterDeps());
  return jsonOutput(response);
}

/** เปิด URL ของ Web App ในเบราว์เซอร์เพื่อเช็กว่า deploy สำเร็จ (ไม่คืนข้อมูลใดๆ) */
export function doGet(): GoogleAppsScript.Content.TextOutput {
  return jsonOutput({ ok: true, data: { service: 'technician-map-api' } });
}
