const text = (value, min, max) => typeof value === 'string' && value.length <= max && value.trim().length >= min && !/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(value);

function imageUrl(value) {
  if (!text(value, 1, 2048)) return false;
  const normalized = value.trim();
  if (normalized.startsWith('/assets/') && !normalized.includes('..')) return true;
  try {
    const url = new URL(normalized);
    return url.protocol === 'https:' && !url.username && !url.password;
  } catch { return false; }
}

export function normalizeShowcase(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const { displayName, bio, photoURL, storeName, storeBio, works } = value;
  if (!text(displayName, 2, 60) || !text(bio ?? '', 0, 240) || !(photoURL === '' || imageUrl(photoURL)) || !text(storeName ?? '', 0, 60) || !text(storeBio ?? '', 0, 500) || !Array.isArray(works) || works.length > 6) return null;
  const cleanWorks = [];
  for (const work of works) {
    if (!work || typeof work !== 'object' || !text(work.title, 2, 80) || !text(work.description ?? '', 0, 240) || !imageUrl(work.image)) return null;
    cleanWorks.push({ title: work.title.trim(), description: (work.description ?? '').trim(), image: work.image.trim() });
  }
  return { displayName: displayName.trim(), bio: bio.trim(), photoURL: photoURL.trim(), storeName: storeName.trim(), storeBio: storeBio.trim(), works: cleanWorks };
}
