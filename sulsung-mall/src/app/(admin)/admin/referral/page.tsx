import { createClient } from '@/lib/supabase/server'
import { formatPrice, formatDateTime } from '@/utils/format'
import { REFERRAL_RATES } from '@/constants'
import { ADMIN_ITEMS_PER_PAGE } from '@/constants'
import Link from 'next/link'

export default async function AdminReferralPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | undefined }>
}) {
  const params = await searchParams
  const page = Number(params.page ?? '1')
  const search = params.search ?? ''
  const grade = params.grade ?? ''
  const tab = params.tab ?? 'overview'

  const supabase = await createClient() as any
  const now = new Date()
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()

  // 통계 데이터 병렬 조회
  const [
    { count: totalReferrals },
    { count: thisMonthReferrals },
    { data: allRewards },
    { data: thisMonthRewards },
    { data: gradeStats },
  ] = await Promise.all([
    supabase.from('referral_members').select('id', { count: 'exact', head: true }),
    supabase.from('referral_members').select('id', { count: 'exact', head: true }).gte('created_at', thisMonthStart),
    supabase.from('referral_rewards').select('final_points, status'),
    supabase.from('referral_rewards').select('final_points, status').gte('created_at', thisMonthStart),
    supabase.from('referral_members').select('grade'),
  ])

  const totalRewardPoints = (allRewards ?? [])
    .filter((r: any) => r.status === '지급완료')
    .reduce((sum: number, r: any) => sum + r.final_points, 0)

  const thisMonthRewardPoints = (thisMonthRewards ?? [])
    .filter((r: any) => r.status === '지급완료')
    .reduce((sum: number, r: any) => sum + r.final_points, 0)

  // 등급별 회원 수
  const gradeCounts: Record<string, number> = {}
  for (const g of (gradeStats ?? [])) {
    gradeCounts[g.grade] = (gradeCounts[g.grade] ?? 0) + 1
  }

  // 탭별 데이터 조회
  let members: any[] = []
  let rewards: any[] = []
  let totalCount = 0

  if (tab === 'members') {
    // 추천 회원 목록
    let query = supabase
      .from('members')
      .select('id, name, phone, referral_code, referred_by, mileage, created_at, referral_members!referral_members_member_id_fkey(grade, grade_multiplier)', { count: 'exact' })
      .not('referral_code', 'is', null)
      .order('created_at', { ascending: false })

    if (search) {
      query = query.or(`name.ilike.%${search}%,phone.ilike.%${search}%,referral_code.ilike.%${search}%`)
    }

    const { data, count } = await query
      .range((page - 1) * ADMIN_ITEMS_PER_PAGE, page * ADMIN_ITEMS_PER_PAGE - 1)

    members = data ?? []
    totalCount = count ?? 0

    // 각 회원의 직접 추천 수 조회
    for (const m of members) {
      const { count: invCount } = await supabase
        .from('referral_members')
        .select('id', { count: 'exact', head: true })
        .eq('referrer_id', m.id)
      m._invitedCount = invCount ?? 0
    }
  } else if (tab === 'rewards') {
    // 리워드 이력
    const { data, count } = await supabase
      .from('referral_rewards')
      .select('*, receiver:receiver_id(name, phone, referral_code), buyer:buyer_id(name, phone)', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range((page - 1) * ADMIN_ITEMS_PER_PAGE, page * ADMIN_ITEMS_PER_PAGE - 1)

    rewards = data ?? []
    totalCount = count ?? 0
  }

  const totalPages = Math.ceil(totalCount / ADMIN_ITEMS_PER_PAGE)

  function buildUrl(overrides: Record<string, string | number>) {
    const p = new URLSearchParams()
    if (params.tab) p.set('tab', params.tab)
    if (params.search) p.set('search', params.search)
    if (params.grade) p.set('grade', params.grade)
    if (params.page) p.set('page', params.page)
    for (const [k, v] of Object.entries(overrides)) {
      p.set(k, String(v))
    }
    return `/admin/referral?${p.toString()}`
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">추천 관리</h1>

      {/* 탭 네비게이션 */}
      <div className="flex gap-1 mb-6 border-b border-gray-200">
        {[
          { key: 'overview', label: '현황' },
          { key: 'members', label: '추천 회원' },
          { key: 'rewards', label: '리워드 이력' },
        ].map(t => (
          <Link key={t.key} href={buildUrl({ tab: t.key, page: '1' })}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
              tab === t.key ? 'border-green-600 text-green-700' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}>
            {t.label}
          </Link>
        ))}
      </div>

      {/* 현황 탭 */}
      {tab === 'overview' && (
        <>
          {/* KPI 카드 */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {[
              { label: '총 추천 건수', value: `${(totalReferrals ?? 0).toLocaleString()}건` },
              { label: '이번 달 추천', value: `${(thisMonthReferrals ?? 0).toLocaleString()}건` },
              { label: '총 지급 리워드', value: `${totalRewardPoints.toLocaleString()}P` },
              { label: '이번 달 리워드', value: `${thisMonthRewardPoints.toLocaleString()}P` },
            ].map((kpi, i) => (
              <div key={i} className="bg-white rounded-xl shadow-sm p-5">
                <p className="text-xs text-gray-500 mb-1">{kpi.label}</p>
                <p className="text-xl font-bold text-gray-900">{kpi.value}</p>
              </div>
            ))}
          </div>

          {/* 등급 분포 */}
          <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">추천 등급 분포</h3>
            <div className="grid grid-cols-5 gap-3">
              {['씨앗', '새싹', '나무', '숲', '목장'].map((g, i) => (
                <div key={g} className="text-center p-3 rounded-lg bg-gray-50">
                  <p className="text-lg font-bold text-gray-900">{gradeCounts[g] ?? 0}</p>
                  <p className="text-xs text-gray-500">{g}</p>
                  <p className="text-[10px] text-gray-400">×{[1.0, 1.25, 1.5, 1.75, 2.0][i]}</p>
                </div>
              ))}
            </div>
          </div>

          {/* 리워드 구조 */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">리워드 구조</h3>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="pb-2 text-left text-xs text-gray-500 font-medium">단계</th>
                  <th className="pb-2 text-right text-xs text-gray-500 font-medium">기본 비율</th>
                  <th className="pb-2 text-right text-xs text-gray-500 font-medium">예시 (10만원 주문)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {REFERRAL_RATES.map((rate, idx) => (
                  <tr key={idx}>
                    <td className="py-2.5 text-gray-700">L{idx + 1} {idx === 0 ? '(직접 추천)' : `(${idx + 1}단계)`}</td>
                    <td className="py-2.5 text-right font-medium text-green-700">{(rate * 100).toFixed(1)}%</td>
                    <td className="py-2.5 text-right text-gray-500">{formatPrice(Math.floor(100000 * rate))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* 추천 회원 탭 */}
      {tab === 'members' && (
        <>
          <form className="flex gap-2 mb-4">
            <input type="hidden" name="tab" value="members" />
            <input name="search" defaultValue={search} placeholder="이름, 전화번호, 추천코드 검색"
              className="flex-1 max-w-md border border-gray-200 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-gray-400" />
            <button type="submit"
              className="px-4 py-2 bg-gray-800 text-white text-sm rounded-lg hover:bg-gray-700">
              검색
            </button>
          </form>

          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="px-6 py-3 border-b border-gray-100 text-sm text-gray-500">
              총 {totalCount.toLocaleString()}명
            </div>
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs text-gray-500 font-medium">이름</th>
                  <th className="px-4 py-3 text-left text-xs text-gray-500 font-medium">전화번호</th>
                  <th className="px-4 py-3 text-left text-xs text-gray-500 font-medium">추천코드</th>
                  <th className="px-4 py-3 text-center text-xs text-gray-500 font-medium">등급</th>
                  <th className="px-4 py-3 text-center text-xs text-gray-500 font-medium">추천수</th>
                  <th className="px-4 py-3 text-right text-xs text-gray-500 font-medium">마일리지</th>
                  <th className="px-4 py-3 text-right text-xs text-gray-500 font-medium">가입일</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {members.map((m: any) => {
                  const refInfo = Array.isArray(m.referral_members) ? m.referral_members[0] : m.referral_members
                  return (
                    <tr key={m.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-gray-900">
                        <Link href={`/admin/members/${m.id}`} className="hover:underline">{m.name}</Link>
                      </td>
                      <td className="px-4 py-3 text-gray-500">{m.phone}</td>
                      <td className="px-4 py-3 font-mono text-xs text-gray-700">{m.referral_code}</td>
                      <td className="px-4 py-3 text-center">
                        <span className="inline-block px-2 py-0.5 text-xs rounded-full bg-green-50 text-green-700">
                          {refInfo?.grade ?? '씨앗'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center text-gray-700">{m._invitedCount}</td>
                      <td className="px-4 py-3 text-right text-gray-700">{m.mileage?.toLocaleString() ?? 0}P</td>
                      <td className="px-4 py-3 text-right text-xs text-gray-400">{formatDateTime(m.created_at)}</td>
                    </tr>
                  )
                })}
                {members.length === 0 && (
                  <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-400">데이터가 없습니다.</td></tr>
                )}
              </tbody>
            </table>

            {/* 페이지네이션 */}
            {totalPages > 1 && (
              <div className="flex justify-center gap-1 px-4 py-3 border-t border-gray-100">
                {Array.from({ length: totalPages }, (_, i) => i + 1).slice(
                  Math.max(0, page - 3), Math.min(totalPages, page + 2)
                ).map(p => (
                  <Link key={p} href={buildUrl({ page: p })}
                    className={`px-3 py-1 rounded text-sm ${p === page ? 'bg-gray-800 text-white' : 'text-gray-500 hover:bg-gray-100'}`}>
                    {p}
                  </Link>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {/* 리워드 이력 탭 */}
      {tab === 'rewards' && (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="px-6 py-3 border-b border-gray-100 text-sm text-gray-500">
            총 {totalCount.toLocaleString()}건
          </div>
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs text-gray-500 font-medium">일시</th>
                <th className="px-4 py-3 text-left text-xs text-gray-500 font-medium">수령자</th>
                <th className="px-4 py-3 text-left text-xs text-gray-500 font-medium">구매자</th>
                <th className="px-4 py-3 text-center text-xs text-gray-500 font-medium">단계</th>
                <th className="px-4 py-3 text-right text-xs text-gray-500 font-medium">주문금액</th>
                <th className="px-4 py-3 text-right text-xs text-gray-500 font-medium">리워드</th>
                <th className="px-4 py-3 text-center text-xs text-gray-500 font-medium">상태</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {rewards.map((r: any) => (
                <tr key={r.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-xs text-gray-500">{formatDateTime(r.created_at)}</td>
                  <td className="px-4 py-3 text-gray-900">{r.receiver?.name ?? '-'}</td>
                  <td className="px-4 py-3 text-gray-500">{r.buyer?.name ?? '-'}</td>
                  <td className="px-4 py-3 text-center text-gray-700">L{r.depth}</td>
                  <td className="px-4 py-3 text-right text-gray-500">{formatPrice(r.order_amount)}</td>
                  <td className="px-4 py-3 text-right font-medium text-green-700">+{r.final_points.toLocaleString()}P</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`inline-block px-2 py-0.5 text-xs rounded-full ${
                      r.status === '지급완료' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'
                    }`}>
                      {r.status}
                    </span>
                  </td>
                </tr>
              ))}
              {rewards.length === 0 && (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-400">리워드 이력이 없습니다.</td></tr>
              )}
            </tbody>
          </table>

          {totalPages > 1 && (
            <div className="flex justify-center gap-1 px-4 py-3 border-t border-gray-100">
              {Array.from({ length: totalPages }, (_, i) => i + 1).slice(
                Math.max(0, page - 3), Math.min(totalPages, page + 2)
              ).map(p => (
                <Link key={p} href={buildUrl({ page: p })}
                  className={`px-3 py-1 rounded text-sm ${p === page ? 'bg-gray-800 text-white' : 'text-gray-500 hover:bg-gray-100'}`}>
                  {p}
                </Link>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
