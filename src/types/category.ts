export interface Category {
  id: string
  label: string
  icon: string
  description: string
  children?: Category[]
}

export interface CategoryPath {
  level1: string
  level2: string
  level3: string
}

export function getCategoryLabel(
  categories: Category[],
  path: [string, string, string]
): string {
  const l1 = categories.find((c) => c.id === path[0])
  const l2 = l1?.children?.find((c) => c.id === path[1])
  const l3 = l2?.children?.find((c) => c.id === path[2])
  return [l1?.label, l2?.label, l3?.label].filter(Boolean).join(' > ')
}
