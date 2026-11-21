import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { root, sourceDigest, sha256 } from './backend-source.mjs';
const prefix = process.env.OPENCRAFT_TOOLCHAINS || path.join(homedir(), '.cache/opencraft-toolchains');
const go = process.env.OPENCRAFT_GO || path.join(prefix, 'go/bin/go');
const rustc = process.env.OPENCRAFT_RUSTC || path.join(prefix, 'rust/bin/rustc');
const output = path.join(root, 'worker/generated');
mkdirSync(output, { recursive: true });
function run(command, args, options = {}) {
  const result = spawnSync(command, args, { cwd: root, env: process.env, encoding: 'utf8', ...options });
  if (result.error || result.status !== 0) { process.stderr.write(result.stderr || String(result.error || 'Backend build failed')); process.exit(1); }
  return result.stdout.trim();
}
if (!existsSync(go) || !existsSync(rustc)) throw new Error('Run python scripts/bootstrap-backend.py, or set OPENCRAFT_GO and OPENCRAFT_RUSTC.');
const goVersion = run(go, ['version']);
const rustVersion = run(rustc, ['--version']);
run(go, ['build', '-trimpath', '-buildvcs=false', '-ldflags=-s -w', '-o', path.join(output, 'api.wasm'), './cmd/wasm'], { cwd: path.join(root, 'backend/go-api'), env: { ...process.env, GOOS: 'js', GOARCH: 'wasm', CGO_ENABLED: '0', GOTOOLCHAIN: 'local', GOCACHE: path.join(prefix, 'go-cache') } });
run(rustc, ['--edition=2021', '--crate-name', 'opencraft_money', '--crate-type=cdylib', '--target=wasm32-unknown-unknown', '-C', 'opt-level=s', '-C', 'panic=abort', '-C', 'lto=fat', '-C', 'strip=symbols', 'backend/rust-money/src/lib.rs', '-o', path.join(output, 'money.wasm')]);
const goRoot = run(go, ['env', 'GOROOT']);
const driver = [path.join(goRoot, 'lib/wasm/wasm_exec.js'), path.join(goRoot, 'misc/wasm/wasm_exec.js')].find(existsSync);
if (!driver) throw new Error('The matching official Go Wasm runtime was not found.');
writeFileSync(path.join(output, 'go-runtime.js'), readFileSync(driver, 'utf8') + '\nexport default globalThis.Go;\n');
const artifacts = Object.fromEntries(['api.wasm', 'money.wasm', 'go-runtime.js'].map(name => [name, sha256(readFileSync(path.join(output, name)))]));
writeFileSync(path.join(output, 'build.json'), JSON.stringify({ sourceSha256: sourceDigest(), goVersion, rustVersion, artifacts }, null, 2) + '\n');
console.log(JSON.stringify({ goVersion, rustVersion, artifacts: Object.keys(artifacts) }));
