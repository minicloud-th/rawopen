# Policies, minors and seller activation

Public document routes are `/privacy`, `/terms`, `/seller-terms`, and `/legal/guardians`. `/sell` describes seller registration separately from ordinary membership; `/dashboard/seller-apply` accepts authenticated, eligible applicants. `/contact` records authenticated support requests, including requests from accounts awaiting guardian approval. This change does not send messages to a guardian or accept identity-document uploads.

## Enforced gates

- The platform minimum is 13, evaluated on Thailand's calendar day. Date of birth is self-declared, not an identity/age verification result. An invalid or under-13 birth date is rejected; a stored date cannot be changed by another acceptance request. Corrections require operator review.
- Terms acceptance and acknowledgement of the privacy notice are separate, unchecked controls. No marketing consent is required or collected. Versions and server timestamps are stored in `member_agreements` and immutable `policy_events`; seller terms acknowledgements also create immutable events.
- Existing members must complete the current agreement gate. Under the platform's conservative policy, ages 13–19 wait for verified representative consent before using member features. This is a platform policy, not a claim that every minor or every processing activity legally needs identical consent. Exceptions in capacity require review.
- A signed, trusted Firebase custom attribute `opencraft_guardian_approval` must equal the current agreement record's `id` before an under-20 account becomes eligible. Never set this from a checkbox, a support message, or the applicant's own claim. Operators must verify the lawful representative's authority and consent scope first and retain the corresponding evidence using an approved secure process. A policy-version change creates a new agreement ID and requires the representative approval to be reviewed again.
- `opencraft_seller_approved: true` grants seller UI/data rights only for an eligible account. A seller application remains `pending_review` and does not grant this claim. `opencraft_store_verified: true` displays the blue badge only when seller approval is also present. A review must cover identity, legal capacity, category rights and payment-provider requirements before these claims are granted.
- Non-sellers do not see the store sidebar item, store/profile dropdown entries, storefront tab, store editor or portfolio editor. Direct store/profile routes give a clear unavailable state. The showcase API hides stored shop fields and rejects attempts to write new shop details before seller approval. Personal account fields remain editable after the agreement gate.
- Game farming/item-finding service applications require age 15. The app never provides a per-service parental override for younger applicants. Merely naming work a contract for results does not settle employment classification; applicable labor/child-protection duties still depend on the facts.

## Scope still requiring operator setup

Transactions, wallet credits, seller payouts, document KYC, representative-document intake, seller review administration and automated deletion are not implemented by these routes. Do not treat a support ticket, application, photo URL, email verification or MFA as a completed KYC review. The app deliberately does not collect identity cards, birth certificates, face/ID images or bank-account evidence through free text. Do not ask applicants to send these through the support form.

Before real seller activation or transactions, publish the operator's actual legal identity/address/privacy contact, implement a secure review/evidence process and retention schedule, select payment-provider age/account eligibility rules, confirm category permissions, implement complaint/refund operating times and any required platform notifications. The current policies state the exploratory nature of the site and do not claim a registered legal entity, payment protection, a guaranteed complaint SLA, or legal compliance certification.

Support requests are stored per Firebase UID and receive a reference ID; at most five requests per rolling day are accepted. Operators can review them in the authorized D1 administration interface. No external notification or user-facing ticket-status console is provided. Requests to access/delete/correct data still require a real operator response and identity checks proportionate to the request. The published privacy notice describes request-based review rather than claiming an automatic deletion feature.

## Legal references reviewed

- https://pdpa.sidata.plus/article-20/ — PDPA section 20 and capacity exceptions.
- https://pdpa.sidata.plus/reference-article-20/ — Civil and Commercial Code section 27.
- https://www.mol.go.th/employee/สิทธิตามกฎหมายแรงงาน — Ministry of Labour child-employment protections.
- https://www.etda.or.th/th/pr-news/DPS_16.aspx?feed=cb66f430-5546-4dd8-b279-3827e88d154b — ETDA guidance on platform terms.

The source defines platform eligibility policy rather than asserting that all game-account sales are lawful, that every online seller needs the same registration, or that using a marketplace label removes employment duties. The legal documents are original operational text for this implementation, and should be reviewed with the operator's actual business facts before commercial launch.

Validation: `node --test tests/legal.test.mjs tests/profile.test.mjs` covers birthday boundaries, invalid age, current-version evidence, age-change rejection, UID isolation, representative approval forgery, pending seller access, blue-badge separation, game-service age restrictions, authentication, request boundaries and the existing durable profile API.
