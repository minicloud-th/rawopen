import { createHash } from 'node:crypto';
import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
export const root = fileURLToPath(new URL('../', import.meta.url));
export function sourceDigest() {
  const files = ['backend/toolchains.lock.json', 'scripts/build-backend.mjs', 'scripts/backend-source.mjs'];
  for (const directory of ['backend/go-api', 'backend/rust-money']) {
    const walk = relative => {
      for (const entry of readdirSync(path.join(root, relative), { withFileTypes: true })) {
        if (['target', '.git'].includes(entry.name)) continue;
        const next = path.posix.join(relative, entry.name);
        if (entry.isDirectory()) walk(next); else if (/\.(go|rs|toml)$/.test(next) || entry.name === 'go.mod') files.push(next);
      }
    };
    walk(directory);
  }
  const hash = createHash('sha256');
  for (const file of files.sort()) hash.update(file).update('\0').update(readFileSync(path.join(root, file))).update('\0');
  return hash.digest('hex');
}
export const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');
