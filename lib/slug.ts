import Position from "@/models/position"

function toSlug(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim()
    .slice(0, 80)
}

export async function generateUniqueSlug(title: string): Promise<string> {
  const base = toSlug(title) || "position"
  const randomSuffix = Math.random().toString(36).slice(2, 6)
  const slug = `${base}-${randomSuffix}`

  const exists = await Position.findOne({ slug })
  if (exists) return generateUniqueSlug(title)
  return slug
}
