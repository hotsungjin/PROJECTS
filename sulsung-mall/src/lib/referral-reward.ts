import { getRateByDepth, isWithinOneYear } from '@/lib/referral'

/**
 * 결제 완료 시 추천 리워드 분배
 * referral_tree에서 구매자의 상위 1~5단계 조상을 조회하여 리워드 지급
 */
export async function distributeReferralRewards(
  supabase: any,
  orderId: string,
  buyerMemberId: string,
  orderAmount: number,
) {
  // 구매자의 상위 조상 조회 (depth 1~5)
  const { data: ancestors } = await supabase
    .from('referral_tree')
    .select(`
      ancestor_member_id,
      depth,
      created_at
    `)
    .eq('descendant_member_id', buyerMemberId)
    .lte('depth', 5)
    .order('depth', { ascending: true })

  if (!ancestors || ancestors.length === 0) return

  for (const ancestor of ancestors) {
    // 1년 유효기간 체크
    if (!isWithinOneYear(ancestor.created_at)) continue

    // 조상의 등급 배수 조회
    const { data: referralMember } = await supabase
      .from('referral_members')
      .select('grade_multiplier')
      .eq('member_id', ancestor.ancestor_member_id)
      .single()

    const multiplier = referralMember?.grade_multiplier ?? 1.0
    const baseRate = getRateByDepth(ancestor.depth)
    const finalPoints = Math.floor(orderAmount * baseRate * multiplier)

    if (finalPoints <= 0) continue

    // referral_rewards 기록
    await supabase.from('referral_rewards').insert({
      receiver_id: ancestor.ancestor_member_id,
      order_id: orderId,
      buyer_id: buyerMemberId,
      depth: ancestor.depth,
      base_rate: baseRate,
      multiplier,
      order_amount: orderAmount,
      final_points: finalPoints,
      status: '지급완료',
    })

    // 마일리지 적립
    await supabase.rpc('increment_mileage', {
      p_member_id: ancestor.ancestor_member_id,
      p_amount: finalPoints,
    })
  }
}

/**
 * 결제 취소 시 추천 리워드 취소
 */
export async function cancelReferralRewards(
  supabase: any,
  orderId: string,
) {
  // 해당 주문의 지급완료 리워드 조회
  const { data: rewards } = await supabase
    .from('referral_rewards')
    .select('id, receiver_id, final_points')
    .eq('order_id', orderId)
    .eq('status', '지급완료')

  if (!rewards || rewards.length === 0) return

  for (const reward of rewards) {
    // 상태를 취소로 변경
    await supabase
      .from('referral_rewards')
      .update({ status: '취소' })
      .eq('id', reward.id)

    // 마일리지 차감
    await supabase.rpc('increment_mileage', {
      p_member_id: reward.receiver_id,
      p_amount: -reward.final_points,
    })
  }
}
