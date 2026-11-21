import { authRequest } from './auth.js';
import { profileRequest } from './profile.js';
import { showcaseRequest } from './showcase.js';
import { memberLegalRequest } from './member-legal.js';
import goModule from './generated/api.wasm';
import rustModule from './generated/money.wasm';
import catalog from '../shared/catalog.json' with { type: 'json' };
import { createBackend } from './backend-runtime.js';
import { marketplaceRequest } from './marketplace-http.js';
let backend;
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (['/api/agreements','/api/seller-application','/api/support'].includes(url.pathname)) return memberLegalRequest(request,env);
    if (url.pathname === '/api/profile') return profileRequest(request, env);
    if (url.pathname === '/api/member-profile') return showcaseRequest(request, env);
    if (url.pathname.startsWith('/api/auth/')) {
      try { return await authRequest(request, env); }
      catch { return Response.json({ error: 'service-unavailable' }, { status: 503, headers: { 'Cache-Control': 'no-store' } }); }
    }
    if (url.pathname.startsWith('/api/')) {
      try {
        // Go runtime startup must happen in request scope on Workers.
        backend ||= createBackend(goModule, rustModule, catalog);
        return await marketplaceRequest(request, await backend);
      } catch { return Response.json({ error: 'backend-unavailable' }, { status: 503, headers: { 'Cache-Control': 'no-store' } }); }
    }
    return env.ASSETS.fetch(request);
  },
};
