export function slugify(text: string): string {
  return text
    .trim()
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

export function uniqueSlug(base: string, existing: string[]): string {
  let slug = slugify(base || 'post')
  if (!slug) slug = 'post'
  const set = new Set(existing)
  if (!set.has(slug)) return slug
  let i = 1
  while (set.has(`${slug}-${i}`)) i++
  return `${slug}-${i}`
}
