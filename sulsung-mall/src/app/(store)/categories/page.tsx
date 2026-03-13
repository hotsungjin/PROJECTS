import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import Image from 'next/image'

export default async function CategoriesPage() {
  const supabase = await createClient()

  const { data: categoriesRaw } = await (supabase as any)
    .from('categories')
    .select('id, name, slug, image_url, sort_order')
    .eq('is_active', true)
    .is('parent_id', null)
    .order('sort_order')

  const categories = (categoriesRaw ?? []) as { id: number; name: string; slug: string; image_url: string | null; sort_order: number }[]

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#f7f4f1' }}>
      <div className="px-4 pt-4 pb-2">
        <h1 className="text-[18px] font-bold" style={{ color: '#333' }}>카테고리</h1>
      </div>

      <div className="px-4 pb-6">
        <div className="grid grid-cols-2 gap-3">
          {/* 전체 상품 */}
          <Link
            href="/goods"
            className="bg-white rounded-xl p-4 flex flex-col items-center justify-center gap-2 shadow-sm hover:shadow-md transition-shadow"
            style={{ minHeight: '100px' }}
          >
            <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: '#f3f0ed' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="3" y="3" width="7" height="7" rx="1.5" stroke="#968774" strokeWidth="1.8" />
                <rect x="14" y="3" width="7" height="7" rx="1.5" stroke="#968774" strokeWidth="1.8" />
                <rect x="3" y="14" width="7" height="7" rx="1.5" stroke="#968774" strokeWidth="1.8" />
                <rect x="14" y="14" width="7" height="7" rx="1.5" stroke="#968774" strokeWidth="1.8" />
              </svg>
            </div>
            <span className="text-[13px] font-medium" style={{ color: '#333' }}>전체 상품</span>
          </Link>

          {categories.map(cat => (
            <Link
              key={cat.id}
              href={`/goods?category=${cat.slug}`}
              className="bg-white rounded-xl p-4 flex flex-col items-center justify-center gap-2 shadow-sm hover:shadow-md transition-shadow"
              style={{ minHeight: '100px' }}
            >
              {cat.image_url ? (
                <div className="w-10 h-10 rounded-full overflow-hidden">
                  <Image src={cat.image_url} alt={cat.name} width={40} height={40} className="object-cover w-full h-full" />
                </div>
              ) : (
                <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: '#f3f0ed' }}>
                  <span className="text-[16px]">🥩</span>
                </div>
              )}
              <span className="text-[13px] font-medium text-center" style={{ color: '#333' }}>{cat.name}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
