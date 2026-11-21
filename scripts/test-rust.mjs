import { mkdirSync } from 'node:fs';
import { homedir } from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { root } from './backend-source.mjs';
const prefix = process.env.OPENCRAFT_TOOLCHAINS || path.join(homedir(), '.cache/opencraft-toolchains');
const rustc = process.env.OPENCRAFT_RUSTC || path.join(prefix, 'rust/bin/rustc');
const folder = path.join(root, '.sites-runtime');
mkdirSync(folder, { recursive: true });
const target = path.join(folder, 'rust-money-tests');
for (const [command, args] of [[rustc, ['--edition=2021', '--test', 'backend/rust-money/src/lib.rs', '-o', target]], [target, []]]) {
  const result = spawnSync(command, args, { cwd: root, stdio: 'inherit' });
  if (result.status !== 0) process.exit(result.status || 1);
}
