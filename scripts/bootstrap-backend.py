#!/usr/bin/env python3
"""Install the pinned official Go/Rust compilers in a user-owned cache."""
import argparse
import concurrent.futures
import hashlib
import json
from pathlib import Path
import platform
import subprocess
import tarfile
import tempfile

parser = argparse.ArgumentParser()
parser.add_argument('--prefix', type=Path, default=Path.home() / '.cache/opencraft-toolchains')
args = parser.parse_args()
if platform.system() != 'Linux' or platform.machine() not in ('x86_64', 'AMD64'):
    raise SystemExit('This bootstrap supports Linux x86_64. Install Go and Rust with wasm32-unknown-unknown on other platforms.')
root = Path(__file__).resolve().parents[1]
lock = json.loads((root / 'backend/toolchains.lock.json').read_text())
prefix = args.prefix.resolve()
prefix.mkdir(parents=True, exist_ok=True)
downloads = prefix / 'downloads'
downloads.mkdir(exist_ok=True)
entries = [('go', lock['go'])] + list(lock['rust']['components'].items())

def download(entry):
    name, spec = entry
    archive = downloads / spec['url'].rsplit('/', 1)[1]
    if not archive.exists() or hashlib.sha256(archive.read_bytes()).hexdigest() != spec['sha256']:
        subprocess.run(['curl', '-fsSL', '--retry', '2', '--max-time', '240', spec['url'], '-o', str(archive)], check=True)
    if hashlib.sha256(archive.read_bytes()).hexdigest() != spec['sha256']:
        archive.unlink(missing_ok=True)
        raise RuntimeError(f'Official checksum mismatch: {name}')
    return name, archive

with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:
    archives = list(pool.map(download, entries))
for name, archive in archives:
    if name == 'go':
        if not (prefix / 'go/bin/go').exists():
            with tarfile.open(archive) as package:
                package.extractall(prefix, filter='data')
    else:
        with tempfile.TemporaryDirectory(prefix='rust-component-', dir=prefix) as temporary:
            unpack = Path(temporary)
            with tarfile.open(archive) as package:
                package.extractall(unpack, filter='data')
            installer = next(unpack.glob('*/install.sh'))
            subprocess.run(['bash', str(installer), '--prefix=' + str(prefix / 'rust'), '--disable-ldconfig'], check=True, stdout=subprocess.DEVNULL)
print(json.dumps({'go': str(prefix / 'go/bin/go'), 'rustc': str(prefix / 'rust/bin/rustc')}))
