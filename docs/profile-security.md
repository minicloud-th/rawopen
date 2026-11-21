# OpenCraft member profile and security status

The signed-in member hub includes an owner-only profile at `/dashboard/profile`. The account menu opens profile, store, security, and settings pages. Members can edit their display name, HTTPS photo URL, short bio, store name and description, and up to six portfolio entries. Portfolio image URLs must use HTTPS. These fields are saved per Firebase user ID in the D1 `member_showcases` table. The app does not upload files or expose a public profile directory in this change.

The small sidebar avatar is circular and uses the member's saved photo. Its amber outline means that email verification or multi-factor authentication is still incomplete. It turns green only when the Firebase account record reports both `emailVerified` and at least one enrolled MFA factor. The client does not submit or control these flags. Store verification is a separate blue badge and appears only when the trusted Firebase account's `customAttributes` contains `opencraft_store_verified: true`; an administrator must set that custom claim after reviewing the store. There is no self-service store verification action.

## Firebase TOTP setup

The browser flow uses Firebase Authentication's TOTP multi-factor APIs. Before members can enroll, enable TOTP multi-factor authentication for the `opencraft-oauth` Firebase project through Firebase Authentication with Identity Platform. Firebase also requires a verified email address and recent sign-in. The UI reauthenticates supported password, Google, and GitHub sessions before creating the TOTP secret. Discord and LINE currently use a custom-token sign-in flow and do not offer a reauthentication flow in this enrollment screen.

The secret is held in the browser component's memory while the member completes enrollment. It is not written to D1, browser storage, a URL, or application logs. The user adds the displayed key to an authenticator app and enters a six-digit code. Firebase receives the enrollment assertion. On a later sign-in, the app shows a second-factor form for enrolled TOTP accounts. Recovery codes, factor removal, and account-recovery flows are not implemented here.

The Firebase project provider setting is an external console configuration and was not changed as part of the source update. Until the project enables TOTP, Firebase will reject enrollment and the UI will explain the configuration requirement. No claim is made that a real account has enrolled MFA.

## Implementation paths

- shadcn-compatible UI is in `src/components/ui`, configured through `components.json`; styles live under `src/` and are imported by the relevant entry points.
- `src/components/ui/avatar.tsx` uses Radix Avatar. `avatar-border.tsx` renders the amber/green account ring; the store tab alone renders the blue `VerifiedBadge` when the trusted store claim is present.
- `src/lib/showcase.ts` authenticates profile reads and writes with the Firebase ID token. `worker/showcase.js` verifies the account through Firebase Identity Toolkit, validates a bounded payload, and stores content by UID.
- The new Drizzle migration creates `member_showcases`. Existing migrations are retained and applied through the normal Sites publish migration step.
- Light and dark appearances are saved in local device storage; they are not account-wide preferences.

The profile API has no public read mode. Every request requires a validated Firebase ID token, responses are private/no-store, and updates require same-origin requests. Unknown properties such as `mfaEnabled` and `storeVerified` are not persisted.
