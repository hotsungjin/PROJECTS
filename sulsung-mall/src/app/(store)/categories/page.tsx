import { createClient } from '@/lib/supabase/server'
import CategoryClient from './CategoryClient'

interface Category {
  id: number
  name: string
  slug: string
  image_url: string | null
  sort_order: number
  parent_id: number | null
}

export default async function CategoriesPage() {
  const supabase = await createClient()

  const { data: categoriesRaw } = await (supabase as any)
    .from('categories')
    .select('id, name, slug, image_url, sort_order, parent_id')
    .eq('is_active', true)
    .order('sort_order')

  const allCategories = (categoriesRaw ?? []) as Category[]

  const parents = allCategories.filter(c => c.parent_id === null)
  const children = allCategories.filter(c => c.parent_id !== null)

  return <CategoryClient parents={parents} children={children} />
}
