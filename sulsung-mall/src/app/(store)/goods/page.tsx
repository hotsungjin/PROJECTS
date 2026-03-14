import { createClient } from '@/lib/supabase/server'
import { ITEMS_PER_PAGE } from '@/constants'
import Link from 'next/link'
import GoodsFilterClient from './GoodsFilterClient'
import GoodsInfiniteGrid from './GoodsInfiniteGrid'
import SortDropdown from './SortDropdown'

interface SearchParams {
  category?: string
  sort?: string
  q?: string
  page?: string
  min_price?: string
  max_price?: string
  tag?: string
  curation?: string
}

function buildQuery(params: SearchParams) {
  const qs = new URLSearchParams()
  if (params.category) qs.set('category', params.category)
  if (params.sort) qs.set('sort', params.sort)
  if (params.q) qs.set('q', params.q)
  if (params.min_price) qs.set('min_price', params.min_price)
  if (params.max_price) qs.set('max_price', params.max_price)
  if (params.tag) qs.set('tag', params.tag)
  if (params.curation) qs.set('curation', params.curation)
  return qs.toString()
}

function buildLink(params: SearchParams, overrides: Partial<SearchParams>) {
  const merged = { ...params, ...overrides }
  // 페이지가 변경되지 않는 필터 변경 시 페이지 초기화
  if (!overrides.page) delete merged.page
  const qs = buildQuery(merged)
  return `/goods${qs ? `?${qs}` : ''}`
}

export default async function GoodsListPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params = await searchParams
  const supabase = await createClient()
  const from = 0

  let goods: any[] = []
  let count: number | null = 0

  // 큐레이션 모드: curation_goods 테이블에서 상품 조회
  if (params.curation) {
    const { data: curation } = await (supabase as any)
      .from('curations')
      .select('id, name')
      .eq('slug', params.curation)
      .eq('is_active', true)
      .single()

    if (curation) {
      const { data: curationGoods, count: cCount } = await (supabase as any)
        .from('curation_goods')
        .select('goods(id, name, slug, price, sale_price, thumbnail_url, sale_count, tags, status)', { count: 'exact' })
        .eq('curation_id', curation.id)
        .order('sort_order')
        .range(from, from + ITEMS_PER_PAGE - 1)

      goods = (curationGoods ?? [])
        .map((cg: any) => cg.goods)
        .filter((g: any) => g && g.status === 'active')
      count = cCount
    }
  } else {
    // 일반 모드
    let query = supabase
      .from('goods')
      .select('id, name, slug, price, sale_price, thumbnail_url, sale_count, tags, categories(name)', { count: 'exact' })
      .eq('status', 'active')
      .range(from, from + ITEMS_PER_PAGE - 1)

    if (params.q) {
      query = query.or(`name.ilike.%${params.q}%,tags.cs.{${params.q}}`)
    }
    if (params.min_price) {
      const min = Number(params.min_price)
      if (!isNaN(min)) query = query.gte('price', min)
    }
    if (params.max_price) {
      const max = Number(params.max_price)
      if (!isNaN(max)) query = query.lte('price', max)
    }
    if (params.tag) {
      query = query.contains('tags', [params.tag])
    }

    if (params.sort === 'newest') query = query.order('created_at', { ascending: false })
    else if (params.sort === 'price_asc') query = query.order('sale_price', { ascending: true, nullsFirst: false })
    else if (params.sort === 'price_desc') query = query.order('price', { ascending: false })
    else query = query.order('sale_count', { ascending: false })

    if (params.category) {
      const { data: cat } = await supabase.from('categories').select('id, parent_id').eq('slug', params.category).single()
      if (cat) {
        // 부모 카테고리인 경우 자식 카테고리 상품도 포함
        if (!(cat as any).parent_id) {
          const { data: children } = await supabase.from('categories').select('id').eq('parent_id', (cat as any).id)
          const ids = [(cat as any).id, ...((children ?? []) as any[]).map((c: any) => c.id)]
          query = (query as any).in('category_id', ids)
        } else {
          query = (query as any).eq('category_id', (cat as any).id)
        }
      }
    }

    const { data: goodsRaw, count: gCount } = await query
    goods = (goodsRaw as any[]) ?? []
    count = gCount
  }
  const { data: categoriesRaw } = await supabase.from('categories').select('id, name, slug').eq('is_active', true).is('parent_id', null)
  // 상품이 있는 카테고리만 필터링
  const allCats = (categoriesRaw ?? []) as unknown as { id: number; name: string; slug: string }[]
  const { data: allChildren } = await supabase.from('categories').select('id, parent_id').eq('is_active', true).not('parent_id', 'is', null)
  const childrenMap = new Map<number, number[]>()
  for (const c of (allChildren ?? []) as any[]) {
    const arr = childrenMap.get(c.parent_id) ?? []
    arr.push(c.id)
    childrenMap.set(c.parent_id, arr)
  }
  const { data: goodsCounts } = await (supabase as any).from('goods').select('category_id').eq('status', 'active')
  const catIdSet = new Set((goodsCounts ?? []).map((g: any) => g.category_id))
  const categories = allCats.filter(cat => {
    if (catIdSet.has(cat.id)) return true
    const kids = childrenMap.get(cat.id) ?? []
    return kids.some(kid => catIdSet.has(kid))
  })

  // 활성 필터 개수
  const activeFilters = [params.min_price, params.max_price, params.tag].filter(Boolean).length
  const queryString = buildQuery(params)

  return (
    <div>
      {/* 카테고리 탭 (수평 스크롤) */}
      <div className="overflow-x-auto scrollbar-hide bg-white" style={{ marginTop: '2px' }}>
        <div className="flex px-4 py-2 gap-2 whitespace-nowrap">
          <Link
            href={buildLink(params, { category: undefined })}
            className="flex-shrink-0 px-4 py-1.5 rounded-full text-[13px] font-medium transition-colors"
            style={!params.category ? { backgroundColor: '#968774', color: '#fff' } : { backgroundColor: '#f3f0ed', color: '#666' }}
          >
            전체
          </Link>
          {(categories ?? []).map((cat) => (
            <Link
              key={cat.id}
              href={buildLink(params, { category: cat.slug })}
              className="flex-shrink-0 px-4 py-1.5 rounded-full text-[13px] font-medium transition-colors"
              style={params.category === cat.slug ? { backgroundColor: '#968774', color: '#fff' } : { backgroundColor: '#f3f0ed', color: '#666' }}
            >
              {cat.name}
            </Link>
          ))}
        </div>
      </div>

      {/* 상품수 + 정렬 + 필터 (한 줄) */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-white">
        <div className="flex items-center gap-2">
          <p className="text-[12px]" style={{ color: '#888' }}>
            총 <strong style={{ color: '#333' }}>{count ?? 0}</strong>개 상품
          </p>
          <GoodsFilterClient
            currentMinPrice={params.min_price ?? ''}
            currentMaxPrice={params.max_price ?? ''}
            currentTag={params.tag ?? ''}
            currentParams={params as Record<string, string | undefined>}
            activeFilters={activeFilters}
          />
        </div>
        <SortDropdown
          currentSort={params.sort ?? ''}
          currentParams={params as Record<string, string | undefined>}
        />
      </div>

      {/* 검색 결과 표시 */}
      {params.q && (
        <div className="px-4 py-3" style={{ backgroundColor: '#f7f4f1' }}>
          <p className="text-[13px]" style={{ color: '#666' }}>
            &ldquo;<strong style={{ color: '#333' }}>{params.q}</strong>&rdquo; 검색 결과 {count ?? 0}개
          </p>
        </div>
      )}

      {/* 활성 필터 뱃지 */}
      {(params.tag || params.min_price || params.max_price) && (
        <div className="px-4 pt-3 flex flex-wrap gap-1.5 bg-white">
          {params.tag && (
            <Link href={buildLink(params, { tag: undefined })}
              className="inline-flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-full"
              style={{ backgroundColor: '#f3f0ed', color: '#968774' }}>
              #{params.tag} ✕
            </Link>
          )}
          {(params.min_price || params.max_price) && (
            <Link href={buildLink(params, { min_price: undefined, max_price: undefined })}
              className="inline-flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-full"
              style={{ backgroundColor: '#f3f0ed', color: '#968774' }}>
              {params.min_price ? `${Number(params.min_price).toLocaleString()}원` : '0원'}
              {' ~ '}
              {params.max_price ? `${Number(params.max_price).toLocaleString()}원` : '∞'}
              {' '}✕
            </Link>
          )}
        </div>
      )}

      {/* 상품 그리드 (무한스크롤) */}
      <div className="px-4 pt-4 pb-6 bg-white">
        <GoodsInfiniteGrid
          initialGoods={goods}
          totalCount={count ?? 0}
          perPage={ITEMS_PER_PAGE}
          queryString={queryString}
        />
      </div>
    </div>
  )
}
