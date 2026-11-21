# OpenCraft

Thai marketplace with an animated product presentation. The supplied OpenCraft wordmark and symbol remain the brand assets.

## Development

The site uses React TSX, Tailwind 4, Vite, and shadcn component aliases, with a Go marketplace API and a Rust money engine. Go and Rust run as server-side WebAssembly inside the existing Cloudflare Worker. Firebase authentication and D1 profiles remain connected. Install dependencies with `npm ci`, run `npm run dev`, and build with `npm run build`. `npm run check` checks TypeScript. The build produces `dist/client` and `dist/server` for deployment with a configured D1 database binding. See [backend architecture and build instructions](docs/backend.md).

UI components live in `src/components/ui`, accessed through `@/components/ui`. `src/lib/utils.ts` provides `cn`; `components.json` configures the aliases so copied shadcn components resolve consistently. This folder is the shared home for presentation and reusable UI rather than a parallel component path. Additional shadcn components can be added with `npx shadcn@latest add button` from the project root. Tailwind uses `src/theme.css` through the PostCSS integration; TypeScript is configured in `tsconfig.json`.

## Adapted references

- The supplied Vante rail and two-sided card treatment drive a product ribbon. Six cards settle into a clickable collection. Three.js/WebGL 2 is used when available, with a CSS 3D rail when WebGL is disabled. One supplied creative video preview is served locally and plays only while visible. The surrounding product images remain local assets.
- The supplied Halden canvas bowl expands with scroll. Letter reveals use Thai grapheme clusters, preserving vowels and tone marks.
- The supplied marquee remains available as a reusable component; it is not mounted on the home page. The catalog and seller invitation stay still so the hero carries the presentation.
- Category navigation uses plain, keyboard-operable text buttons. The original dock component remains available but is not mounted.

The opening has a skip-to-catalog link. Playback buttons, scene dots, and the hero search form have been removed. Search remains in the header. Reduced-motion preferences remove the pinned presentation and automatic motion. Offscreen and hidden-tab work is suspended; media and graphics resources are cleaned up on unmount. Existing search, filters, sorting, details, favorites, cart, and local store drafts remain connected to their existing browser-local state.

## Content boundaries

All listings, seller names, and prices are illustrative. Firebase account registration and sign-in are integrated; provider activation and server credential setup are described in `docs/auth-setup.md`. Seller onboarding, inventory, payments, orders, fulfillment, and messaging are not connected. The interface identifies this at the relevant actions. No real checkout or order is created.

Product photographs: Unsplash, for illustrative use. Product graphics: original SVG illustrations. Font: Prompt (Google Fonts), served locally. Brand assets: supplied by the user. Creative video: the supplied reference URL, used as presentation media rather than a product promise.

## Current visual hierarchy

The hero retains its logo reveal, bowl glow, headline, and 3D ribbon. The supplied scroll-morph hero is adapted in `src/components/ui/scroll-morph-hero.tsx`: local product imagery fans from a compact stack in depth into an elliptical ring, then opens into a lower arc on native page scroll. The two Thai headline lines jump in with a brief soft landing, followed by the description. The logo introduction is shortened to 900ms and the gallery arrival lasts 1.45s. It uses 20 images on desktop and 12 on narrow screens, image-only faces, accessible product links, a hover flip, and a static reduced-motion layout. No wheel or touch events are intercepted. The headline starts once the ring has opened enough to leave it clear. `src/scroll-morph.css` contains the base layout; `src/jump-in.css` contains the coordinated entrance.

The home page then moves through categories, a six-item catalog, a three-part collection story, and a concise seller invitation. Catalog cards contain an image, a short title, and a price; details and seller information appear after opening a product. Decorative badges, crossed-out prices, duplicate promotions, the moving wall, and the three-step explainer have been removed from the rendered home page. Digital artwork covers use one clear composition rather than layered mini interfaces.

The footer uses the supplied `halftone-wordmark-footer.tsx` component, adapted to OpenCraft's local logo image. A cropped alpha mask preserves the supplied lettering and symbol; the dots carry a blue-to-cyan ink gradient, part around the pointer, and ripple on click. The footer includes Thai shopping, seller, and information links connected to the existing catalog and dialogs, plus a back-to-top button. It respects reduced-motion changes, sleeps offscreen and in hidden tabs, and falls back to the original logo when Canvas is unavailable. It uses the existing React setup without additional dependencies.

Home-page text and imagery resolve from a soft blur as they enter the viewport. `src/lib/scroll-reveal.ts` coordinates headings, product images/captions, the collection, seller invitation, and footer with small staggered delays. Each item reveals once; product IDs preserve that state when sorting or favorites rebuild the catalog. New results are observed automatically. The existing hero keeps its own timeline, dialogs remain immediate, keyboard focus makes its target clear immediately, and reduced-motion preferences show all content without transitions. `src/scroll-reveal.css` contains the effect; no additional dependency is needed.

The supplied Hyperiux Split Canvas is adapted in `src/components/ui/split-canvas.tsx`, with scoped layout in `src/split-canvas.css`. A pinned central image changes through pixelated horizontal blinds as three text chapters pass: everyday products, digital files, and design services. Its actions connect to existing category filters. Three.js is loaded dynamically only when WebGL is available and the collection is near the viewport. Canvas 2D reproduces the transition without WebGL, with an image as the last fallback. Settled images are clear. Reduced-motion mode and short narrow screens use static image/text sections. Offscreen and hidden-tab drawing stops. No new dependency or external image URL is required.

The header adapts the supplied Nimbus UI Waterline component in `src/components/ui/liquid-glass-navbar.tsx`. A single glass bar contains the supplied wordmark, three text links, and search/cart/menu actions. Favorites, account, seller onboarding, and help share an accessible disclosure on desktop and mobile. The selected liquid drop follows navigation and the current section. It uses CSS when WebGL is unavailable, has no sound, sleeps when idle/hidden, and honors reduced motion. Header styling lives in `src/top-bar.css`; no new dependency was required.

Interaction timing is coordinated in `src/smooth-motion.css`: the header menu resolves from its trigger, the cart slides from the right, and dialogs gently settle into place. Native discrete transitions keep exits visible without timers delaying close or navigation. Controls compress briefly on press and the cart count responds to changes. Reduced motion shows each state immediately. A stable scrollbar gutter avoids sideways layout shifts; shared dialog scroll locking survives transitions between dialogs. The hero caches stage dimensions and skips repeated DOM writes after scroll movement settles. Native page scrolling is preserved.

## Membership

`/signup`, `/login`, `/account` and `/reset-password` use a separate, restrained authentication layout, loaded only when visited. Firebase 13.3 manages email/password, Google and GitHub sessions, verification and recovery. Discord and LINE use the Worker OAuth bridge and Firebase custom authentication; runtime credentials are required before those channels become active. See `docs/auth-setup.md` for exact console settings, callback URLs, secret names, boundaries and validation. No test account has been created in production. The app now builds a Worker entry in `dist/server/index.js` and static assets in `dist/client`; the same Site identity and audience are preserved.

## Member home

Successful email, Google/GitHub, and custom-provider sign-in now leads to `/dashboard`. Firebase must report an authenticated user before the member layout renders. It follows the supplied reference: a narrow left rail, a rounded white main panel, and six layered product cards. Buttons, swipe gestures, and arrow keys select the cards; reduced motion uses immediate transitions. The front card opens existing product details, and favorites/cart use the existing browser-local flows. Account/settings open `/account`; the main CTA returns to the catalog. The marketing hero remains at `/`. Product data is shared through `src/lib/catalog.js`. `preview/member.html` is a development-only visual fixture and is excluded from the production Vite entry/build. It does not create or impersonate a Firebase session.


## Landing, search and first-visit questions

- `/` presents the clear-glass marketplace Hero with the heading “สินค้า งานดิจิทัล และบริการ ในที่เดียว” and the original promise as supporting copy. It includes public catalog search, category/type tabs, buy/hire/sell guidance, seller introduction, a four-phase roadmap and FAQ. Planned commerce services are labeled accurately; fees, payouts, seller verification and Protect are not advertised as available.
- Product discovery and details work before Firebase sign-in. `/dashboard`, `/account` and signed-in account flows are wrapped in `MemberGate`: fetch the authenticated user's durable profile; if absent, show the three-step questionnaire; only show member content once the answers save. Read/write failures offer retry instead of granting a completion flag.
- Questions collect display name, buyer/seller/both intent and 1–5 category interests. Records are stored in D1 by verified Firebase UID. No email, password, token or platform identity header is stored in that table. Catalog recommendations prioritize the saved categories when sorting by recommendation.
- The profile avatar is circular and supports the Firebase provider photo. The supplied `profile-menu.tsx` is integrated with working account, saved-items, help and sign-out actions. Its optional setup prop is intentionally omitted. `animated-tabs.tsx` supports controlled selection, composes original handlers and respects reduced motion; actual catalog and journey tabs include keyboard navigation.
- Components follow the existing shadcn alias `@/components/ui` → `src/components/ui/`, not a duplicate root directory. TypeScript, Tailwind, Framer Motion and Lucide were already installed. Shared tokens are in `src/theme.css`; new page styles in `src/landing.css` and `src/onboarding.css`.

### Durable profile API

`GET /api/profile` and `PUT /api/profile` require a Firebase ID token in the Authorization header. The Worker verifies the project/expiry and validates the token with Firebase Auth `accounts:lookup`, checks disabled/revoked records, and derives the record key from the verified UID. A submitted uid cannot choose another record. Writes require same-origin JSON, bounded request bodies, and schema validation; responses use no-store. Official protocol: https://firebase.google.com/docs/reference/rest/auth#section-get-account-info

The hosting manifest declares `d1: "DB"`. `db/schema.ts` and generated `drizzle/` SQL/journal are committed. Generate subsequent schema changes with `npm run db:generate`; never edit an applied migration. Hosted deployment applies migrations. Local migration command from this project root:

```bash
node node_modules/wrangler/bin/wrangler.js d1 execute DB --local --config dist/server/wrangler.json --persist-to .wrangler/state --file drizzle/0000_loving_peter_quill.sql
```

The existing Firebase console provider/authorized-domain setup remains required as documented in `docs/auth-setup.md`. UI fixtures under `preview/member.html` and `preview/welcome.html` are development-only, never production auth bypasses. The welcome fixture tests question state and completion UI without creating an account or writing a member record. Security and persistence tests use Node SQLite plus a mocked Firebase lookup (`npm run test:profile`); real Firebase sign-in across devices was not exercised in this session.

### Clear-glass Hero

`src/components/ui/glass-marketplace-hero.tsx` and `src/glass-hero.css` replace the previous multi-scene Hero with a responsive two-column composition. Layered vector glass ribbons, beveled highlights, faint reflections and a translucent display panel share cyan/silver lighting. Pointer movement updates only CSS custom properties for shallow perspective and reflected light; there is no continuous render loop or WebGL requirement. Reduced-motion and touch input keep the optical object still. All SVG IDs are scoped per component. The Hero discovery action focuses public search, while the secondary action opens signup. The existing brand wordmark, member hub and onboarding are retained. Legacy Hero source files remain available but are excluded from the current entry's imports.


### Animated member menu and member pages

`src/components/ui/animated-menu-bar.tsx` uses the existing React, TypeScript, Tailwind/shadcn alias, Framer Motion and Lucide dependencies. `src/animated-menu-bar.css` owns the menu styles, and `animated-menu-bar-demo.tsx` retains the original horizontal demo. Optional `orientation`, `items`, `counts`, `labels` and `hrefs` props support the Thai sidebar without breaking its original button API. Route links preserve modifier clicks, browser history and `aria-current="page"`; labels expand beside the rail without changing the content width. Controls remain at least 44 px, with visible focus and reduced-motion handling.

The member avatar sits below the menu. Provider photos fill the circle with `object-fit: cover`; the compact outline is amber until email and MFA are complete, then green. The avatar has no white side gutters or blue background. A neutral initial is used when no photo exists. Profile, store, security, account settings, theme, and sign-out are available from the profile menu.

`src/lib/member-navigation.ts` is the route and title source. All pages use the same sidebar and Firebase/profile guard, including direct URL visits. Email and popup sign-in return established members to their requested member page; first-time members still complete onboarding. `member-pages.tsx` supplies the separate page content, with styles in `src/member-pages.css`.

| Page | URL |
| --- | --- |
| Discovery | `/dashboard` |
| Saved products | `/dashboard/saved` |
| Cart | `/dashboard/cart` |
| Top up | `/dashboard/topup` |
| Store draft | `/dashboard/store` |
| Notifications | `/dashboard/notifications` |
| Help | `/dashboard/help` |
| Security | `/dashboard/security` |
| Account settings | `/account` |
| Social-style profile | `/dashboard/profile` |

Saved products and cart quantities share the existing commerce state. Cart totals and sidebar counts update together; physical quantities are bounded at nine, while digital goods and services remain single items. Store drafts use the same browser-local key as the earlier seller dialog, with inline validation and save feedback. The notifications page shows an accurate empty state. The profile and security pages use trusted Firebase account state for email and MFA status. Orders, payments and published stores are not simulated. The development-only member fixture exercises the actual views and route history without creating an authenticated session and remains excluded from production output.

The top-up page uses `src/components/ui/member-topup.tsx` and `src/member-topup.css`. Members can select an amount, enter a positive custom amount with up to two decimal places, choose PromptPay or card as a proposed channel, and review the selection. Amounts are converted to integer satang before formatting. Its status explicitly says payments are unavailable, the final payment control is disabled, and no QR, checkout request, balance, ledger entry or transaction history is fabricated or stored. Payment-provider and verified-webhook integration is required before accepting funds.

### Member profile, store showcase, and account security

Current privacy and service/seller terms have separate public pages, linked from signup and footers. Membership now requires the current age/terms gate; seller applications are separate and remain pending until review. Store/profile/portfolio controls stay hidden for ordinary members. See `docs/legal-rollout.md` for the enforced age/representative/role gates, operational limits and review requirements. Run `npm run test:legal` for the corresponding authorization and age-boundary checks.

The member avatar uses `src/components/ui/profile-dropdown.tsx`, adapted from the supplied dropdown for this React/Vite app. Shared Radix dropdown primitives live in `src/components/ui/dropdown-menu.tsx`. The menu uses collision-aware portal positioning, keyboard navigation, outside-click and Escape dismissal, and device-local theme selection. `src/profile-dropdown.css` adds a soft 340 ms scale/blur entrance from the avatar edge and a 160 ms return animation before unmounting. A brief avatar press responds to taps; reduced-motion preferences remove movement and blur. The existing circular avatar and trusted security status are retained.

`/dashboard/profile` now has editable profile details, a portfolio grid, and a store tab. The circular sidebar avatar shows an amber border until both email verification and a trusted Firebase MFA factor are present; it turns green only after both are confirmed server-side. The store tab displays a blue verified badge only for the privileged Firebase store-verification claim. The account settings page edits the saved profile, store description, and up to six portfolio entries. Appearance controls offer light and dark themes and remember the selection on the current device. The detailed security and Firebase TOTP setup notes are in `docs/profile-security.md`.

## Current marketplace refinement

The public landing and member home now share `src/market-refinement.css`: warm neutral surfaces, OpenCraft blue accents, consistent search and category controls, and image-led product cards. Member discovery begins directly with search rather than a second carousel. Product cards reveal softly on entering the viewport and respect reduced motion. The existing sidebar, icon order, profile placement and approved-seller gates remain intact; its surface border is only tuned to the shared palette. Account pages use narrower readable rows and consistent field spacing. The glass hero and iOS profile disclosure keep their existing interaction.

## Unified design refresh

All current routes now share the OpenCraft design in `src/market-refinement.css`. Contra informs discovery, wide search composition, horizontal topic navigation and the image grid; Apple Store informs restrained product imagery and the title/price hierarchy; Linear informs the account field rows, appearance control, security sections and compact settings tabs. The landing, member discovery, saved products, cart, wallet preview, seller pages, profile, sign-in, registration, password recovery, first-run questions, consent gate, public policy documents and contact page use the shared colors and control scale.

The application sidebar and profile disclosure are unchanged, including their positioning, menu order, labels, badges and seller gating. Public/auth/document pages retain their own layouts without adding an application sidebar. Product cards are shared by discovery and saved items. Existing Firebase flows, consent wording, guardian restrictions, store approval gates and Go/Rust APIs are retained. Photography reveals softly once, reveals immediately on keyboard focus, respects reduced motion and cleans up when its root unmounts.

## Supplied HTML design

The supplied OpenCraft (4).html now informs the theme in src/reference-skin.css: the exact charcoal/gray surface values, blue capsule actions, 16px filled fields, 18–28px panel corners, centered sign-in, grouped settings rows and product shelves. Product cards use real catalog assets and show title, image, price and the existing details/cart actions. New visitors start in dark mode; an explicitly saved light/dark choice is retained. The sidebar markup, navigation files and profile disclosure are unchanged. The HTML reference's demo login, credits, balances and invite-redemption JavaScript are not imported. Firebase, age/consent gates, seller approval and Go/Rust APIs remain authoritative.
