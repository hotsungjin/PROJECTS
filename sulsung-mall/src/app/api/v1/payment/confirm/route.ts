import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { confirmPayment } from '@/lib/payment/toss'
import { sendOrderConfirm } from '@/lib/notification/solapi'
import { formatPrice } from '@/utils/format'
import { distributeReferralRewards } from '@/lib/referral-reward'

const schema = z.object({
  paymentKey: z.string(),
  orderId:    z.string().uuid(),
  amount:     z.number().int().positive(),
})

export async function POST(req: NextRequest) {
  try {
    const body = schema.parse(await req.json())
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = await createClient() as any

    // 1. 주문 조회 및 금액 검증 (서버사이드 재검증 - 위변조 방지)
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*, members(phone, name)')
      .eq('id', body.orderId)
      .eq('status', 'pending_payment')
      .single()

    if (orderError || !order) {
      return NextResponse.json({ error: '유효하지 않은 주문입니다.' }, { status: 400 })
    }

    if (order.total_amount !== body.amount) {
      return NextResponse.json({ error: '결제 금액이 일치하지 않습니다.' }, { status: 400 })
    }

    // 2. 토스페이먼츠 결제 승인
    const tossResult = await confirmPayment(body.paymentKey, body.orderId, body.amount)

    // 3. DB 업데이트 (결제 정보 저장 + 주문 상태 변경)
    const [, , orderItems] = await Promise.all([
      supabase.from('payments').insert({
        order_id:       order.id,
        pg_provider:    'toss',
        payment_key:    body.paymentKey,
        payment_method: tossResult.method,
        amount:         body.amount,
        status:         'done',
        approved_at:    tossResult.approvedAt,
        raw_response:   tossResult,
      }),
      supabase.from('orders').update({
        status:  'paid',
        paid_at: new Date().toISOString(),
      }).eq('id', order.id),
      supabase.from('order_items').select('goods_name').eq('order_id', order.id).limit(1).single(),
    ])

    // 4. 주문 상태 이력
    await supabase.from('order_status_logs').insert({
      order_id:    order.id,
      from_status: 'pending_payment',
      to_status:   'paid',
      created_by:  'system',
    })

    // 5. 카카오 알림톡 발송 (비동기, 실패해도 결제 성공)
    const memberPhone = (order.members as any)?.phone
    if (memberPhone) {
      sendOrderConfirm({
        phone:       memberPhone,
        orderNo:     order.order_no,
        goodsName:   (orderItems as any)?.goods_name ?? '주문상품',
        totalAmount: formatPrice(order.total_amount),
      }).catch(console.error)
    }

    // 6. 추천 리워드 지급
    distributeReferralRewards(supabase, order.id, order.member_id, order.total_amount)
      .catch(err => console.error('[Referral Reward Error]', err))

    return NextResponse.json({ success: true, orderId: order.id })
  } catch (err: any) {
    console.error('[payment/confirm]', err)
    return NextResponse.json({ error: err.message ?? '결제 처리 중 오류가 발생했습니다.' }, { status: 500 })
  }
}
