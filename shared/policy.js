export const POLICY_VERSION = '2026-11-15';
export const SELLER_TERMS_VERSION = '2026-11-15';

export function ageOn(birthDate, today = new Date()) {
  if (typeof birthDate !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(birthDate)) return null;
  const date = new Date(birthDate + 'T00:00:00Z');
  if (!Number.isFinite(date.getTime()) || date.toISOString().slice(0,10) !== birthDate) return null;
  // Eligibility follows the calendar day in Thailand (UTC+7), not the host clock zone.
  const now = new Date(new Date(today).getTime() + 7 * 60 * 60 * 1000);
  const age = now.getUTCFullYear() - date.getUTCFullYear() - (now.getUTCMonth() < date.getUTCMonth() || (now.getUTCMonth() === date.getUTCMonth() && now.getUTCDate() < date.getUTCDate()) ? 1 : 0);
  return age >= 0 && age <= 120 ? age : null;
}

export function normalizeAgreement(value, today = new Date()) {
  if (!value || value.acceptedTerms !== true || value.acknowledgedPrivacy !== true || value.termsVersion !== POLICY_VERSION || value.privacyVersion !== POLICY_VERSION) return null;
  const age = ageOn(value.birthDate, today);
  if (age === null || age < 13) return null;
  return { birthDate: value.birthDate, termsVersion: POLICY_VERSION, privacyVersion: POLICY_VERSION, acceptedTerms: true, acknowledgedPrivacy: true };
}

export function accountAccess(agreement, claims = {}, today = new Date()) {
  const age = ageOn(agreement?.birthDate, today);
  const current = !!agreement && agreement.termsVersion === POLICY_VERSION && agreement.privacyVersion === POLICY_VERSION && agreement.acceptedTerms === true && agreement.acknowledgedPrivacy === true && age !== null && age >= 13;
  const guardianApproved = current && claims.opencraft_guardian_approval === agreement.id;
  const eligible = current && (age >= 20 || guardianApproved);
  return { current, age, guardianRequired: age !== null && age < 20, guardianApproved, eligible, sellerApproved: eligible && claims.opencraft_seller_approved === true, storeVerified: eligible && claims.opencraft_seller_approved === true && claims.opencraft_store_verified === true };
}

export function normalizeSellerApplication(value, age) {
  if (!value || !['goods','game_service','service'].includes(value.kind) || typeof value.storeName !== 'string' || value.storeName.trim().length < 2 || value.storeName.length > 60 || typeof value.description !== 'string' || value.description.trim().length < 10 || value.description.length > 500 || value.acceptedSellerTerms !== true || value.termsVersion !== SELLER_TERMS_VERSION || value.prohibitedItemsAcknowledged !== true || value.publisherRulesAcknowledged !== true) return null;
  if (age === null || age < 13 || (value.kind === 'game_service' && age < 15)) return null;
  return { storeName: value.storeName.trim(), description: value.description.trim(), kind: value.kind, termsVersion: SELLER_TERMS_VERSION, acceptedSellerTerms: true, prohibitedItemsAcknowledged: true, publisherRulesAcknowledged: true };
}
