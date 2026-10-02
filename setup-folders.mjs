import { mkdirSync } from 'node:fs';

const dirs = [
  'packages/shared/src',
  'apps/api/src/domain',
  'apps/api/src/application',
  'apps/api/src/infrastructure',
  'apps/api/src/interface',
  'apps/web/src/domain',
  'apps/web/src/application',
  'apps/web/src/infrastructure',
  'apps/web/src/presentation',
  'docs',
];

for (const dir of dirs) {
  mkdirSync(dir, { recursive: true });
  console.log('created', dir);
}