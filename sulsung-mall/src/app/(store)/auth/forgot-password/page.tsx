'use client'

import { useState } from 'react'
import Link from 'next/link'
import { SITE_NAME } from '@/constants'

type Step = 'phone' | 'reset' | 'done'

export default function ForgotPasswordPage() {
  const [step, setStep] = useState<Step>('phone')
  const [phone, setPhone] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [newPasswordConfirm, setNewPasswordConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const inputStyle = { borderColor: '#e0dbd5', color: '#333' }

  function formatPhone(value: string) {
    const nums = value.replace(/[^0-9]/g, '').slice(0, 11)
    if (nums.length <= 3) return nums
    if (nums.length <= 7) return `${nums.slice(0, 3)}-${nums.slice(3)}`
    return `${nums.slice(0, 3)}-${nums.slice(3, 7)}-${nums.slice(7)}`
  }

  function getCleanPhone(value: string) {
    return value.replace(/[^0-9]/g, '')
  }

  // TODO: 솔라피 계정 생성 후 SMS 인증 다시 활성화
  function handleGoToReset() {
    const cleanPhone = getCleanPhone(phone)
    if (cleanPhone.length < 10) { setError('올바른 휴대폰 번호를 입력해주세요.'); return }
    setError('')
    setStep('reset')
  }

  async function handleResetPassword(e: React.FormEvent) {
    e.preventDefault()
    if (newPassword.length < 8) { setError('비밀번호는 8자 이상이어야 합니다.'); return }
    if (newPassword !== newPasswordConfirm) { setError('비밀번호가 일치하지 않습니다.'); return }

    setLoading(true); setError('')
    const res = await fetch('/api/v1/auth/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        phone: getCleanPhone(phone),
        password: newPassword,
      }),
    })
    const data = await res.json()
    setLoading(false)

    if (!res.ok) { setError(data.error); return }
    setStep('done')
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#f7f4f1' }}>
      <div className="flex-1 flex flex-col justify-center px-6 py-10">
        <div className="text-center mb-8">
          <Link href="/" className="text-[26px] font-bold" style={{ color: '#968774' }}>{SITE_NAME}</Link>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm max-w-md mx-auto w-full">
          {step === 'done' ? (
            <div className="text-center py-4">
              <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: '#f0ebe4' }}>
                <svg className="w-8 h-8" style={{ color: '#968774' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-lg font-bold text-gray-900 mb-2">비밀번호가 변경되었습니다</h2>
              <p className="text-sm text-gray-500 mb-6">새 비밀번호로 로그인해주세요.</p>
              <Link href="/auth/login"
                className="inline-block px-6 py-2.5 rounded-xl text-sm font-semibold text-white"
                style={{ backgroundColor: '#968774' }}>
                로그인하기
              </Link>
            </div>
          ) : (
            <>
              <h2 className="text-lg font-bold text-gray-900 mb-2">비밀번호 재설정</h2>
              <p className="text-sm text-gray-500 mb-6">
                가입하신 휴대폰 번호를 입력하여 비밀번호를 재설정합니다.
              </p>

              {error && (
                <div className="text-[13px] px-4 py-3 rounded-xl mb-4" style={{ backgroundColor: '#fff0f0', color: '#e84a3b' }}>
                  {error}
                </div>
              )}

              {/* 휴대폰 입력 (인증 없이 바로 진행) */}
              {step === 'phone' && (
                <div className="space-y-3">
                  <input type="tel" value={phone}
                    onChange={e => setPhone(formatPhone(e.target.value))}
                    placeholder="가입하신 휴대폰 번호"
                    className="w-full border rounded-xl px-4 py-3 text-[14px] focus:outline-none"
                    style={inputStyle} />
                  <button onClick={handleGoToReset}
                    disabled={getCleanPhone(phone).length < 10}
                    className="w-full py-3.5 rounded-xl font-semibold text-[15px] text-white disabled:opacity-50"
                    style={{ backgroundColor: '#968774' }}>
                    다음
                  </button>
                </div>
              )}

              {/* 새 비밀번호 입력 */}
              {step === 'reset' && (
                <form onSubmit={handleResetPassword} className="space-y-3">
                  <div>
                    <label className="block text-[12px] font-medium mb-1" style={{ color: '#888' }}>새 비밀번호 (8자 이상)</label>
                    <input type="password" value={newPassword}
                      onChange={e => setNewPassword(e.target.value)}
                      required
                      className="w-full border rounded-xl px-4 py-3 text-[14px] focus:outline-none"
                      style={inputStyle} />
                  </div>
                  <div>
                    <label className="block text-[12px] font-medium mb-1" style={{ color: '#888' }}>비밀번호 확인</label>
                    <input type="password" value={newPasswordConfirm}
                      onChange={e => setNewPasswordConfirm(e.target.value)}
                      required
                      className="w-full border rounded-xl px-4 py-3 text-[14px] focus:outline-none"
                      style={inputStyle} />
                  </div>
                  <button type="submit" disabled={loading}
                    className="w-full py-3.5 rounded-xl font-semibold text-[15px] text-white disabled:opacity-50"
                    style={{ backgroundColor: '#968774' }}>
                    {loading ? '변경 중...' : '비밀번호 변경'}
                  </button>
                </form>
              )}

              <div className="mt-4 text-center">
                <Link href="/auth/login" className="text-[13px]" style={{ color: '#968774' }}>
                  로그인으로 돌아가기
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
