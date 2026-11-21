# OpenCraft authentication setup

The UI and Firebase SDK use the supplied project `opencraft-oauth`. The web configuration is public; no server credential is in the client bundle. Analytics is not started by the registration page.

## Firebase console

1. Open Authentication and enable Email/Password, Google, and GitHub. Configure the Google support email and the GitHub OAuth application's Client ID and Client Secret in Firebase.
2. Add `opencraft-market.kawertyff-2.chatgpt.site` to Authentication → Settings → Authorized domains. Add a custom domain when it is connected. Add localhost/127.0.0.1 only when needed for development.
3. GitHub's authorization callback URL is `https://opencraft-oauth.firebaseapp.com/__/auth/handler`.
4. Configure password policy, email enumeration protection, verification/reset email templates, sender name, and reply-to address. The signup form requires at least 8 characters; Firebase's policy is authoritative.
5. Configure action continue URLs for this domain. Signup sends email verification; the account screen can resend or refresh verification. Reset emails return to `/login`.

## Discord and LINE

The Worker implements OAuth authorization-code flow with PKCE and encrypted HttpOnly state cookies. It exchanges codes server-side, retrieves the provider's stable user ID, and issues a short-lived, RS256-signed Firebase custom token. No provider token or secret enters a URL, client bundle, or localStorage. The handoff is returned through a same-origin POST and its cookie is cleared. Provider identities use `discord:<id>` and `line:<id>`; accounts are never automatically merged by matching email.

Create the OAuth apps and register these exact callback URLs:

- Discord: `https://opencraft-market.kawertyff-2.chatgpt.site/api/auth/discord/callback` (scope `identify`).
- LINE Login: `https://opencraft-market.kawertyff-2.chatgpt.site/api/auth/line/callback` (scope `profile`).

Set these **server runtime secrets** in the Site's hosting environment:

| Key | Value |
| --- | --- |
| `AUTH_STATE_SECRET` | A cryptographically random string of at least 32 characters. |
| `FIREBASE_CLIENT_EMAIL` | Service account email for `opencraft-oauth`. |
| `FIREBASE_PRIVATE_KEY` | Its PKCS#8 private key; literal `\n` or real newlines are accepted. |
| `DISCORD_CLIENT_ID` | Discord OAuth application client ID. |
| `DISCORD_CLIENT_SECRET` | Discord OAuth application secret. |
| `LINE_CHANNEL_ID` | LINE Login channel ID. |
| `LINE_CHANNEL_SECRET` | LINE Login channel secret. |

The current Site already has a generated `AUTH_STATE_SECRET`; retain it when adding the remaining credentials. Redeploy the saved Site version after updating runtime secrets. `/api/auth/providers` reports only availability booleans; unconfigured channels do not attempt OAuth or pretend to sign a visitor in. For local development use untracked `.dev.vars`. Never paste server secrets into frontend source or a public issue.

## Boundaries and verification

- Firebase Authentication stores account identity and handles password hashing, recovery, provider sessions and persistence.
- The marketplace's favorites, cart and seller drafts remain browser-local. Signup does not enable payments, orders or seller payouts.
- The Site's existing owner-only ChatGPT access gate remains unchanged and is separate from marketplace membership.
- Future protected commerce endpoints must verify Firebase ID tokens server-side and authorize resources by UID. Client session state is not API authorization.
- Run `npm run test:auth` for state/origin/PKCE checks and both mocked provider-to-Firebase token flows. These tests make no external provider calls and create no Firebase accounts.
- Complete an actual email verification, password reset and each provider sign-in after console/secret setup. An SDK integration and mocked tests do not establish that provider configuration is enabled.

Sources: [Firebase email/password](https://firebase.google.com/docs/auth/web/password-auth), [Google](https://firebase.google.com/docs/auth/web/google-signin), [GitHub](https://firebase.google.com/docs/auth/web/github-auth), [custom tokens](https://firebase.google.com/docs/auth/admin/create-custom-tokens), [Discord OAuth2](https://docs.discord.com/developers/topics/oauth2), [LINE Login PKCE](https://developers.line.biz/en/docs/line-login/integrate-pkce/).
