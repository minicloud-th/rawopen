export const profileGoals = ['buyer', 'seller', 'both'];
export const profileInterests = ['digital', 'gadget', 'design', 'fashion', 'gaming', 'handmade', 'service'];
export function normalizeProfile(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return null;
  const displayName = typeof input.displayName === 'string' ? input.displayName.trim() : '';
  if (displayName.length < 2 || displayName.length > 60 || /[\u0000-\u001f\u007f]/.test(displayName)) return null;
  if (!profileGoals.includes(input.goal) || !Array.isArray(input.interests) || input.interests.length < 1 || input.interests.length > 5) return null;
  if (!input.interests.every(value => profileInterests.includes(value))) return null;
  const interests = [...new Set(input.interests)];
  return { displayName, goal: input.goal, interests };
}
