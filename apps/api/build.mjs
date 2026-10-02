import { build } from 'esbuild';
import { appendFileSync, copyFileSync, mkdirSync, readFileSync } from 'node:fs';

const ENTRY = 'src/main.ts';
const OUT_DIR = 'dist';
const OUT_FILE = `${OUT_DIR}/Code.js`;

function exportedNames(entryPath) {
  const source = readFileSync(entryPath, 'utf8');
  const names = [];
  for (const match of source.matchAll(/export\s*\{([^}]+)\}/g)) {
    for (const name of match[1].split(',')) {
      const trimmed = name.trim();
      if (trimmed !== '') names.push(trimmed);
    }
  }
  if (names.length === 0) throw new Error(`ไม่พบ export ใน ${entryPath}`);
  return names;
}

mkdirSync(OUT_DIR, { recursive: true });

await build({
  entryPoints: [ENTRY],
  bundle: true,
  format: 'iife',
  globalName: 'App',
  target: 'es2019',
  outfile: OUT_FILE,
  legalComments: 'none',
  logLevel: 'info',
});

const shims = exportedNames(ENTRY)
  .map((name) => `\nfunction ${name}() {\n  return App.${name}.apply(null, arguments);\n}\n`)
  .join('');
appendFileSync(OUT_FILE, shims);

copyFileSync('appsscript.json', `${OUT_DIR}/appsscript.json`);
console.log('build เสร็จ ->', OUT_FILE);