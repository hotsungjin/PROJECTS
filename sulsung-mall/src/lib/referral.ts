import { REFERRAL_RATES } from '@/constants'

/** 6자리 추천코드 생성 (혼동 문자 제외) */
export function generateReferralCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // 0,1,I,O 제외
  let code = ''
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return code
}

/** 추천인 등급 계산 (직접 추천 수 기준) */
export function calculateGrade(directCount: number): { grade: string; multiplier: number } {
  if (directCount >= 20) return { grade: '목장', multiplier: 2.0 }
  if (directCount >= 10) return { grade: '숲', multiplier: 1.75 }
  if (directCount >= 5) return { grade: '나무', multiplier: 1.5 }
  if (directCount >= 2) return { grade: '새싹', multiplier: 1.25 }
  return { grade: '씨앗', multiplier: 1.0 }
}

/** depth별 리워드 비율 반환 */
export function getRateByDepth(depth: number): number {
  return REFERRAL_RATES[depth - 1] ?? 0
}

/** 리워드 포인트 계산 */
export function calculateRewardPoints(
  orderAmount: number,
  depth: number,
  gradeMultiplier: number,
): number {
  const baseRate = getRateByDepth(depth)
  return Math.floor(orderAmount * baseRate * gradeMultiplier)
}

/** 1년 이내 추천인지 확인 */
export function isWithinOneYear(referralDate: string): boolean {
  const oneYearAgo = new Date()
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1)
  return new Date(referralDate) > oneYearAgo
}
