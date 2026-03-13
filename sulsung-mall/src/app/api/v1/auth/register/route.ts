import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createAdminClient } from '@/lib/supabase/server'
import { generateReferralCode, calculateGrade } from '@/lib/referral'

const schema = z.object({
  phone: z.string().min(10),
  password: z.string().min(8),
  name: z.string().min(1),
  verificationId: z.number(),
  marketingSms: z.boolean().default(false),
  marketingKakao: z.boolean().default(false),
  referralCode: z.string().optional(),
})

export async function POST(req: NextRequest) {
  try {
    const body = schema.parse(await req.json())
    const supabase = await createAdminClient() as any

    // 인증 완료 여부 확인
    const { data: verification } = await supabase
      .from('sms_verifications')
      .select('*')
      .eq('id', body.verificationId)
      .eq('phone', body.phone)
      .eq('purpose', 'signup')
      .eq('verified', true)
      .single()

    if (!verification) {
      return NextResponse.json({ error: '휴대폰 인증이 완료되지 않았습니다.' }, { status: 400 })
    }

    // 중복 가입 체크
    const { data: existing } = await supabase
      .from('members')
      .select('id')
      .eq('phone', body.phone)
      .single()

    if (existing) {
      return NextResponse.json({ error: '이미 가입된 휴대폰 번호입니다.' }, { status: 409 })
    }

    // 추천인 확인
    let referrerId: string | null = null
    if (body.referralCode) {
      const { data: referrer } = await supabase
        .from('members')
        .select('id')
        .eq('referral_code', body.referralCode.toUpperCase())
        .single()

      if (!referrer) {
        return NextResponse.json({ error: '유효하지 않은 추천 코드입니다.' }, { status: 400 })
      }
      referrerId = referrer.id
    }

    // 고유 추천코드 생성 (최대 5회 시도)
    let myReferralCode = ''
    for (let i = 0; i < 5; i++) {
      const candidate = generateReferralCode()
      const { data: dup } = await supabase
        .from('members')
        .select('id')
        .eq('referral_code', candidate)
        .single()
      if (!dup) {
        myReferralCode = candidate
        break
      }
    }
    if (!myReferralCode) {
      return NextResponse.json({ error: '추천코드 생성에 실패했습니다. 다시 시도해주세요.' }, { status: 500 })
    }

    // Supabase Auth 계정 생성
    const email = `${body.phone}@sulsung.internal`
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password: body.password,
      email_confirm: true,
    })

    if (authError) {
      return NextResponse.json({ error: authError.message }, { status: 500 })
    }

    // members 테이블에 프로필 저장
    const { data: newMember, error: memberError } = await supabase.from('members').insert({
      auth_id: authData.user.id,
      phone: body.phone,
      name: body.name,
      grade: '일반',
      referral_code: myReferralCode,
      referred_by: referrerId,
      marketing_sms: body.marketingSms,
      marketing_kakao: body.marketingKakao,
    }).select('id').single()

    if (memberError) {
      await supabase.auth.admin.deleteUser(authData.user.id)
      return NextResponse.json({ error: memberError.message }, { status: 500 })
    }

    // 추천인이 있으면 referral 관계 구축
    if (referrerId && newMember) {
      await setupReferralRelationship(supabase, newMember.id, referrerId)
    }

    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

async function setupReferralRelationship(
  supabase: any,
  newMemberId: string,
  referrerId: string,
) {
  // 1. referral_members 레코드 생성
  await supabase.from('referral_members').insert({
    member_id: newMemberId,
    referrer_id: referrerId,
  })

  // 2. referral_tree 구축 (직접 추천인 + 상위 조상 최대 5단계)
  // depth 1: 직접 추천인
  const treeEntries: { ancestor_member_id: string; descendant_member_id: string; depth: number }[] = [
    { ancestor_member_id: referrerId, descendant_member_id: newMemberId, depth: 1 },
  ]

  // 추천인의 상위 조상 조회 (depth 1~4 → 새 회원 기준 depth 2~5)
  const { data: ancestors } = await supabase
    .from('referral_tree')
    .select('ancestor_member_id, depth')
    .eq('descendant_member_id', referrerId)
    .lte('depth', 4)
    .order('depth', { ascending: true })

  if (ancestors) {
    for (const anc of ancestors) {
      const newDepth = anc.depth + 1
      if (newDepth <= 5) {
        treeEntries.push({
          ancestor_member_id: anc.ancestor_member_id,
          descendant_member_id: newMemberId,
          depth: newDepth,
        })
      }
    }
  }

  await supabase.from('referral_tree').insert(treeEntries)

  // 3. 추천인 등급 업데이트
  const { count: directCount } = await supabase
    .from('referral_members')
    .select('id', { count: 'exact', head: true })
    .eq('referrer_id', referrerId)

  const { grade, multiplier } = calculateGrade(directCount ?? 0)
  await supabase
    .from('referral_members')
    .update({ grade, grade_multiplier: multiplier })
    .eq('member_id', referrerId)

  // 4. 마일스톤 체크: 첫 추천
  if (directCount === 1) {
    const { error } = await supabase.from('referral_milestones').insert({
      member_id: referrerId,
      milestone_type: 'first_referral',
      points_given: 5000,
    })
    if (!error) {
      await supabase.rpc('increment_mileage', { p_member_id: referrerId, p_amount: 5000 })
    }
  }

  // 마일스톤: 5명 직접 추천
  if (directCount === 5) {
    const { error } = await supabase.from('referral_milestones').insert({
      member_id: referrerId,
      milestone_type: 'direct_5',
      points_given: 20000,
    })
    if (!error) {
      await supabase.rpc('increment_mileage', { p_member_id: referrerId, p_amount: 20000 })
    }
  }

  // 마일스톤: 네트워크 10명
  const { count: networkCount } = await supabase
    .from('referral_tree')
    .select('id', { count: 'exact', head: true })
    .eq('ancestor_member_id', referrerId)

  if (networkCount && networkCount >= 10) {
    const { error } = await supabase.from('referral_milestones').insert({
      member_id: referrerId,
      milestone_type: 'network_10',
      points_given: 30000,
    })
    if (!error) {
      await supabase.rpc('increment_mileage', { p_member_id: referrerId, p_amount: 30000 })
    }
  }
}
