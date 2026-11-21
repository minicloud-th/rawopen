# TSX, Go and Rust

## Responsibilities

| Layer | Implementation | Responsibility |
| --- | --- | --- |
| Interface | React TSX, Tailwind, shadcn aliases | Landing, member pages, loading, validation messages and interaction |
| Marketplace API | `backend/go-api` | Catalog search/filter/sort, trusted catalog prices, quote validation, top-up preview |
| Money engine | `backend/rust-money` | Exact decimal-to-satang parsing, checked line totals and addition |
| Transport | `worker/index.js`, `worker/marketplace-http.js` | HTTP, bounded JSON bodies, same-origin writes, routing to Go |
| Accounts | Existing Firebase Auth and D1 profile API | Sign-in and durable authenticated profiles |
| Catalog | `shared/catalog.json` | Shared illustrative listings; prices are read independently by the server |

Go and Rust compile to WebAssembly modules executed inside the server Worker. They are not downloaded to browsers, and this deployment does not run native Go/Rust processes. The JavaScript bridge handles ABI conversion; money parsing and arithmetic execute in Rust. Go starts lazily inside a request and remains available for later requests in the same isolate, with a 64 MiB Go memory limit.

## HTTP API

| Route | Input | Result |
| --- | --- | --- |
| `GET /api/catalog` | `q`, `category`, `filter`, `sort` | Matching products and count |
| `POST /api/quote` | `{ "items": [{ "id": "headphones", "quantity": 2 }] }` | Trusted unit/line totals and `totalSatang` |
| `POST /api/topup/preview` | `{ "amount": "42.29", "method": "promptpay" }` | `amountSatang: 4229`, method, `paymentsEnabled: false` |
| `GET /api/runtime` | None | Actual Go/Rust runtime check, including a Rust-computed value |

All amounts use integer satang. The server rejects client-supplied prices, duplicate/unknown products, fractional quantities, malformed decimals and unsafe integer overflow. Physical quantities are 1–9; digital products and services allow one unit per line. Request bodies are limited to 32 KiB, queries to 200 code points and quotes to 50 lines. POST endpoints require the site's own Origin. Quote responses explicitly return `checkoutEnabled: false`.

## Frontend work

The compiled backend artifacts are tracked so interface work needs only Node and npm:

```sh
npm ci
npm run dev
npm run check
npm run test:backend
npm run test:auth
npm run test:profile
npm run build
```

The build verifies source and artifact SHA-256 hashes before TypeScript and Vite run. It fails if backend source changes without rebuilding its modules.

## Go or Rust changes

Install the pinned official toolchains into a user-owned cache, then rebuild:

```sh
python scripts/bootstrap-backend.py
npm run build:backend
npm run test:backend
npm run test:rust
npm run build
```

`backend/toolchains.lock.json` records official package URLs and SHA-256 checksums. The bootstrap supports `--prefix /path/to/toolchains`; set `OPENCRAFT_TOOLCHAINS` to that same path for subsequent commands. Individual compiler paths can be provided with `OPENCRAFT_GO` and `OPENCRAFT_RUSTC`. Rust needs the `wasm32-unknown-unknown` standard library. The Go/Rust modules have no external dependencies; builds use `go build` and `rustc` directly. The generated Go driver is copied from the exact compiler SDK. Its BSD license is distributed at `/licenses/GO-LICENSE.txt`.

`tests/backend.test.mjs` runs the actual compiled Go/Rust modules through the production bridge and HTTP adapter, including concurrent requests, price injection, invalid quantities, decimals, overflow, request limits and origin checks. Native Rust tests independently cover money operations.

## Deployment and boundaries

The existing Worker and D1 binding are retained. Cloudflare Workers supports precompiled Go and Rust WebAssembly modules; see [the official runtime documentation](https://developers.cloudflare.com/workers/runtime-apis/webassembly/). The build emits both Worker modules and client assets for the existing Site publishing workflow.

Listings remain illustrative. Cart contents, favorites and store drafts remain browser-local; authenticated profiles use D1. Top-up previews validate amounts without taking payment or increasing a balance. Payment capture, real orders, inventory, a wallet ledger and seller payouts are not implemented by these endpoints.
