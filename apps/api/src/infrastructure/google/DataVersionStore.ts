import type {DataVersion} from '../../application/ports';
import { PROP_DATA_VERSION } from './config';

export class ScriptPropertiesDataVersion implements DataVersion {
  current(): number {
    const raw = PropertiesService.getScriptProperties().getProperty(PROP_DATA_VERSION);
    const parsed = raw === null ? 0 : Number.parseInt(raw, 10);
    return Number.isNaN(parsed) ? 0 : parsed;
  }

  bump(): number {
    const next = this.current() + 1;
    PropertiesService.getScriptProperties().setProperty(PROP_DATA_VERSION, String(next));
    return next;
  }
}