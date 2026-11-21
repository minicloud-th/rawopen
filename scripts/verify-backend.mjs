import { readFileSync } from 'node:fs';
import path from 'node:path';
import { root, sourceDigest, sha256 } from './backend-source.mjs';
const output = path.join(root, 'worker/generated');
const metadata = JSON.parse(readFileSync(path.join(output, 'build.json'), 'utf8'));
if (metadata.sourceSha256 !== sourceDigest()) throw new Error('Go/Rust source changed. Run npm run build:backend before building the website.');
for (const name of ['api.wasm', 'money.wasm', 'go-runtime.js']) {
  if (sha256(readFileSync(path.join(output, name))) !== metadata.artifacts[name]) throw new Error(`Backend artifact does not match its verified build: ${name}`);
}
console.log('Verified Go/Rust source and compiled module checksums.');
