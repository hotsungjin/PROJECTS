import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { formatPrice, formatDateTime } from '@/utils/format'
import { REFERRAL_RATES } from '@/constants'
import ReferralShareClient from './ReferralShareClient'
import MypageHeader from '@/components/store/mypage/MypageHeader'

export default async function ReferralPage() {
  const supabase = await createClient() as any
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: member } = await supabase
    .from('members')
    .select('id, name, mileage, referral_code')
    .eq('auth_id', user.id)
    .single()
  if (!member) redirect('/auth/login')

  // 추천인 등급 정보
  const { data: referralInfo } = await supabase
    .from('referral_members')
    .select('grade, grade_multiplier')
    .eq('member_id', member.id)
    .single()

  // 직접 추천 수
  const { count: invitedCount } = await supabase
    .from('referral_members')
    .select('id', { count: 'exact', head: true })
    .eq('referrer_id', member.id)

  // 총 적립 리워드
  const { data: totalEarnedData } = await supabase
    .from('referral_rewards')
    .select('final_points')
    .eq('receiver_id', member.id)
    .eq('status', '지급완료')

  const totalEarned = (totalEarnedData ?? []).reduce((sum: number, r: any) => sum + r.final_points, 0)

  // 추천 리워드 이력
  const { data: rewards } = await supabase
    .from('referral_rewards')
    .select('depth, base_rate, multiplier, order_amount, final_points, status, created_at')
    .eq('receiver_id', member.id)
    .order('created_at', { ascending: false })
    .limit(20)

  const referralCode = member.referral_code
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://sulsung-mall.com'
  const referralUrl = referralCode ? `${siteUrl}/auth/signup?ref=${referralCode}` : null

  return (
    <div style={{ backgroundColor: '#fff', minHeight: '100vh' }}>
      <MypageHeader title="추천 리워드" />

      {/* 내 추천 링크 */}
      <div className="rounded-2xl p-6 mb-6 text-white" style={{ background: 'linear-gradient(to right, #968774, #a89882)' }}>
        <p className="text-sm font-medium mb-1 opacity-90">내 추천 코드</p>
        <p className="text-3xl font-bold tracking-widest mb-4">{referralCode ?? '-'}</p>
        {referralUrl && <ReferralShareClient url={referralUrl} code={referralCode} />}
        <div className="mt-4 grid grid-cols-3 gap-4 pt-4 border-t border-white/20">
          <div>
            <p className="text-xs opacity-75">추천 등급</p>
            <p className="text-lg font-bold">{referralInfo?.grade ?? '씨앗'}</p>
          </div>
          <div>
            <p className="text-xs opacity-75">추천인 수</p>
            <p className="text-xl font-bold">{invitedCount ?? 0}명</p>
          </div>
          <div>
            <p className="text-xs opacity-75">총 리워드</p>
            <p className="text-xl font-bold">{totalEarned.toLocaleString()}P</p>
          </div>
        </div>
      </div>

      {/* 리워드 구조 */}
      <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
        <h3 className="text-sm font-semibold text-gray-900 mb-4">추천 리워드 구조</h3>
        <div className="space-y-2">
          {REFERRAL_RATES.map((rate, idx) => (
            <div key={idx} className="flex justify-between items-center py-2 border-b border-gray-50 last:border-0">
              <span className="text-sm text-gray-700">L{idx + 1} {idx === 0 ? '(직접 추천)' : `(${idx + 1}단계)`}</span>
              <span className="text-sm font-semibold" style={{ color: '#968774' }}>
                {(rate * 100).toFixed(1)}% {referralInfo?.grade_multiplier > 1 ? `× ${referralInfo.grade_multiplier}` : ''}
              </span>
            </div>
          ))}
        </div>
        <p className="text-xs text-gray-400 mt-3">추천인의 구매 금액에 비례하여 마일리지가 지급됩니다. (추천일로부터 1년간 유효)</p>
      </div>

      {/* 리워드 이력 */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h3 className="text-sm font-semibold text-gray-900 mb-4">리워드 적립 이력</h3>
        {(rewards ?? []).length > 0 ? (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="pb-2 text-left text-xs text-gray-500 font-medium">일시</th>
                <th className="pb-2 text-left text-xs text-gray-500 font-medium">단계</th>
                <th className="pb-2 text-right text-xs text-gray-500 font-medium">리워드</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {(rewards ?? []).map((r: any, idx: number) => (
                <tr key={idx} className={r.status === '취소' ? 'opacity-50' : ''}>
                  <td className="py-2 text-xs text-gray-500">{formatDateTime(r.created_at)}</td>
                  <td className="py-2 text-xs text-gray-700">L{r.depth}</td>
                  <td className="py-2 text-right font-medium" style={{ color: r.status === '취소' ? '#999' : '#968774' }}>
                    {r.status === '취소' ? '-' : '+'}{r.final_points.toLocaleString()}P
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="text-sm text-gray-400">아직 리워드 이력이 없습니다.</p>
        )}
      </div>
    </div>
  )
}
