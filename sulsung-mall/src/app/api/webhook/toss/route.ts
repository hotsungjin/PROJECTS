import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { sendOrderConfirm, sendCancelComplete } from '@/lib/notification/solapi'
import { formatPrice } from '@/utils/format'
import { distributeReferralRewards, cancelReferralRewards } from '@/lib/referral-reward'

// 토스페이먼츠 웹훅 시크릿 검증
function verifyWebhook(req: NextRequest): boolean {
  const secret = process.env.TOSS_WEBHOOK_SECRET
  if (!secret) return true // 시크릿 미설정 시 스킵 (개발 환경)
  const headerSecret = req.headers.get('toss-webhook-secret')
  return headerSecret === secret
}

export async function POST(req: NextRequest) {
  if (!verifyWebhook(req)) {
    return NextResponse.json({ error: 'Invalid webhook secret' }, { status: 401 })
  }

  const body = await req.json()
  const { eventType, data } = body

  console.log(`[Toss Webhook] ${eventType}`, JSON.stringify(data).slice(0, 500))

  const supabase = await createAdminClient() as any

  try {
    switch (eventType) {
      // 가상계좌 입금 완료
      case 'DEPOSIT_CALLBACK': {
        const { orderId, status } = data

        if (status !== 'DONE') break

        // 주문 조회
        const { data: order } = await supabase
          .from('orders')
          .select('id, order_no, status, total_amount, member_id, members(phone, name)')
          .eq('id', orderId)
          .single()

        if (!order || order.status !== 'pending_payment') break

        // 결제 정보 업데이트
        await supabase
          .from('payments')
          .update({ status: 'done', approved_at: new Date().toISOString() })
          .eq('order_id', order.id)

        // 주문 상태 → paid
        await supabase
          .from('orders')
          .update({ status: 'paid', paid_at: new Date().toISOString() })
          .eq('id', order.id)

        // 상태 로그
        await supabase.from('order_status_logs').insert({
          order_id: order.id,
          from_status: 'pending_payment',
          to_status: 'paid',
          memo: '가상계좌 입금 확인 (웹훅)',
          changed_by: 'system',
        })

        // 알림톡
        const phone = order.members?.phone
        if (phone) {
          const { data: item } = await supabase
            .from('order_items')
            .select('goods_name')
            .eq('order_id', order.id)
            .limit(1)
            .single()

          sendOrderConfirm({
            phone,
            orderNo: order.order_no,
            goodsName: item?.goods_name ?? '주문상품',
            totalAmount: formatPrice(order.total_amount),
          }).catch(console.error)
        }

        // 추천 리워드 지급
        distributeReferralRewards(supabase, order.id, order.member_id, order.total_amount)
          .catch(err => console.error('[Referral Reward Error]', err))

        break
      }

      // 결제 취소 (토스 관리자 또는 자동취소)
      case 'PAYMENT_STATUS_CHANGED': {
        const { paymentKey, status } = data

        if (status !== 'CANCELED' && status !== 'PARTIAL_CANCELED') break

        const { data: payment } = await supabase
          .from('payments')
          .select('order_id, orders(id, order_no, status, total_amount, member_id, members(phone))')
          .eq('payment_key', paymentKey)
          .single()

        if (!payment) break

        const order = payment.orders as any

        // 이미 취소된 주문이면 스킵
        if (order.status === 'cancelled') break

        await supabase.from('payments')
          .update({ status: status === 'CANCELED' ? 'cancelled' : 'partial_cancelled' })
          .eq('payment_key', paymentKey)

        await supabase.from('orders')
          .update({ status: 'cancelled', cancelled_at: new Date().toISOString() })
          .eq('id', order.id)

        await supabase.from('order_status_logs').insert({
          order_id: order.id,
          from_status: order.status,
          to_status: 'cancelled',
          memo: '토스 웹훅 결제 취소',
          changed_by: 'system',
        })

        // 추천 리워드 취소
        await cancelReferralRewards(supabase, order.id)

        // 재고 복구
        const { data: orderItems } = await supabase
          .from('order_items')
          .select('goods_id, qty')
          .eq('order_id', order.id)

        for (const item of orderItems ?? []) {
          const { data: goods } = await supabase
            .from('goods')
            .select('stock')
            .eq('id', item.goods_id)
            .single()

          if (goods) {
            await supabase
              .from('goods')
              .update({ stock: goods.stock + item.qty })
              .eq('id', item.goods_id)
          }
        }

        // 취소 알림
        const cancelPhone = order.members?.phone
        if (cancelPhone) {
          sendCancelComplete({
            phone: cancelPhone,
            orderNo: order.order_no,
            cancelAmount: formatPrice(order.total_amount),
          }).catch(console.error)
        }
        break
      }

      // 가상계좌 환불 완료
      case 'VIRTUAL_ACCOUNT_REFUND': {
        const { paymentKey } = data

        const { data: payment } = await supabase
          .from('payments')
          .select('order_id')
          .eq('payment_key', paymentKey)
          .single()

        if (payment) {
          await supabase.from('payments')
            .update({ status: 'refunded' })
            .eq('payment_key', paymentKey)

          await supabase.from('order_status_logs').insert({
            order_id: payment.order_id,
            from_status: 'cancelled',
            to_status: 'cancelled',
            memo: '가상계좌 환불 완료 (웹훅)',
            changed_by: 'system',
          })
        }
        break
      }

      default:
        console.log(`[Toss Webhook] Unhandled event: ${eventType}`)
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('[Toss Webhook Error]', error)
    // 웹훅은 항상 200 리턴 (재시도 방지)
    return NextResponse.json({ success: false, error: error.message })
  }
}
