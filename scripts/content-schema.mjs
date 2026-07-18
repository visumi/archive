const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function validateManifest(manifest) {
  const errors = [];
  if (!Array.isArray(manifest.collections)) return ['collections must be an array'];

  const slugs = new Set();
  for (const collection of manifest.collections) {
    if (!slugPattern.test(collection.slug ?? '')) errors.push(`collection slug "${collection.slug}" is invalid`);
    if (slugs.has(collection.slug)) errors.push(`collection slug "${collection.slug}" is duplicated`);
    slugs.add(collection.slug);
    if (!collection.title) errors.push(`${collection.slug}: title is required`);
    if (!collection.date) errors.push(`${collection.slug}: date is required`);
    if (!Array.isArray(collection.entries) || collection.entries.length === 0) errors.push(`${collection.slug}: at least one photo is required`);
    const ids = new Set();
    for (const photo of collection.entries ?? []) {
      if (!slugPattern.test(photo.id ?? '')) errors.push(`${collection.slug}: photo id "${photo.id}" is invalid`);
      if (ids.has(photo.id)) errors.push(`${collection.slug}: photo id "${photo.id}" is duplicated`);
      ids.add(photo.id);
      if (!photo.file || /originals?/i.test(photo.file)) errors.push(`${collection.slug}/${photo.id}: file must not reference originals`);
      if (!photo.alt?.trim()) errors.push(`${collection.slug}/${photo.id}: alt is required`);
      if (!Number.isFinite(photo.width) || !Number.isFinite(photo.height) || photo.width < 1 || photo.height < 1) errors.push(`${collection.slug}/${photo.id}: width and height are required`);
    }
    if (collection.entries?.length && !ids.has(collection.cover)) errors.push(`${collection.slug}: cover must reference a photo id`);
  }
  return errors;
}
