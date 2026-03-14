'use client'

import { useState, useEffect, useRef } from 'react'
import { Plus, Pencil, Trash2, MapPin, Search } from 'lucide-react'

declare global { interface Window { daum: any } }

interface Address {
  id: string; name: string; phone: string; zipcode: string
  address1: string; address2: string; is_default: boolean; label: string
}

const LABELS = ['집', '회사', '기타']

export default function AddressesClient({ memberId, initialAddresses }: {
  memberId: string; initialAddresses: Address[]
}) {
  const [addresses, setAddresses] = useState<Address[]>(initialAddresses)
  const [showForm, setShowForm] = useState(false)
  const [editTarget, setEditTarget] = useState<Address | null>(null)
  const [form, setForm] = useState({ name: '', phone: '', zipcode: '', address1: '', address2: '', label: '집', is_default: false })
  const [loading, setLoading] = useState(false)
  const [showPostcode, setShowPostcode] = useState(false)
  const postcodeRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const script = document.createElement('script')
    script.src = '//t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js'
    document.head.appendChild(script)
  }, [])

  const openNew = () => {
    setForm({ name: '', phone: '', zipcode: '', address1: '', address2: '', label: '집', is_default: addresses.length === 0 })
    setEditTarget(null)
    setShowForm(true)
  }

  const openEdit = (addr: Address) => {
    setForm({ name: addr.name, phone: addr.phone, zipcode: addr.zipcode, address1: addr.address1, address2: addr.address2 ?? '', label: addr.label || '집', is_default: addr.is_default })
    setEditTarget(addr)
    setShowForm(true)
  }

  const openPostcode = () => {
    setShowPostcode(true)
    setTimeout(() => {
      if (!postcodeRef.current) return
      postcodeRef.current.innerHTML = ''
      new window.daum.Postcode({
        oncomplete(data: any) {
          setForm(f => ({
            ...f,
            zipcode: data.zonecode,
            address1: data.roadAddress || data.jibunAddress,
          }))
          setShowPostcode(false)
        },
        width: '100%',
        height: '100%',
      }).embed(postcodeRef.current)
    }, 100)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    const url = editTarget ? `/api/v1/addresses/${editTarget.id}` : '/api/v1/addresses'
    const method = editTarget ? 'PATCH' : 'POST'
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, member_id: memberId }),
    })
    if (res.ok) {
      const json = await res.json()
      if (form.is_default) {
        setAddresses(prev => prev.map(a => a.id === (editTarget?.id ?? json.data.id)
          ? json.data
          : { ...a, is_default: false }
        ))
        if (!editTarget) {
          setAddresses(prev => [...prev, json.data].map(a => a.id === json.data.id ? json.data : { ...a, is_default: false }))
        }
      } else {
        if (editTarget) {
          setAddresses(prev => prev.map(a => a.id === editTarget.id ? json.data : a))
        } else {
          setAddresses(prev => [...prev, json.data])
        }
      }
      setShowForm(false)
    }
    setLoading(false)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('배송지를 삭제하시겠습니까?')) return
    const res = await fetch(`/api/v1/addresses/${id}`, { method: 'DELETE' })
    if (res.ok) setAddresses(prev => prev.filter(a => a.id !== id))
  }

  const setDefault = async (id: string) => {
    await fetch(`/api/v1/addresses/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_default: true }),
    })
    setAddresses(prev => prev.map(a => ({ ...a, is_default: a.id === id })))
  }

  return (
    <div className="pb-8" style={{ paddingLeft: '20px', paddingRight: '20px' }}>
      {/* 배송지 목록 */}
      <div className="mt-2">
        {addresses.map(addr => (
          <div key={addr.id}
            className="py-5"
            style={{ borderBottom: '1px solid #f0f0f0' }}>
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-[16px] font-bold" style={{ color: '#222' }}>{addr.name}</span>
                  {addr.label && (
                    <span className="text-[12px] px-2 py-0.5 rounded-full"
                      style={{ backgroundColor: '#f5f3f0', color: '#968774' }}>
                      {addr.label}
                    </span>
                  )}
                  {addr.is_default && (
                    <span className="text-[12px] px-2 py-0.5 rounded-full font-medium"
                      style={{ backgroundColor: '#968774', color: '#fff' }}>
                      기본 배송지
                    </span>
                  )}
                </div>
                <p className="text-[14px]" style={{ color: '#555' }}>{addr.phone}</p>
                <p className="text-[14px] mt-1" style={{ color: '#333' }}>
                  [{addr.zipcode}] {addr.address1} {addr.address2}
                </p>
              </div>
              <div className="flex gap-1.5 flex-shrink-0 ml-3">
                <button onClick={() => openEdit(addr)}
                  className="text-[13px] px-3 py-1.5 rounded-lg"
                  style={{ border: '1px solid #ddd', color: '#555' }}>
                  수정
                </button>
                <button onClick={() => handleDelete(addr.id)}
                  className="text-[13px] px-3 py-1.5 rounded-lg"
                  style={{ border: '1px solid #ddd', color: '#555' }}>
                  삭제
                </button>
              </div>
            </div>
            {!addr.is_default && (
              <button onClick={() => setDefault(addr.id)}
                className="mt-3 text-[13px] font-medium"
                style={{ color: '#968774' }}>
                기본 배송지로 설정
              </button>
            )}
          </div>
        ))}

        {addresses.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-14 h-14 rounded-full flex items-center justify-center mb-4" style={{ backgroundColor: '#f5f3f0' }}>
              <MapPin className="w-6 h-6" style={{ color: '#c4b9a7' }} />
            </div>
            <p className="text-[15px] font-medium" style={{ color: '#999' }}>등록된 배송지가 없어요</p>
            <p className="text-[13px] mt-1" style={{ color: '#bbb' }}>새 배송지를 추가해 보세요</p>
          </div>
        )}
      </div>

      {/* 새 배송지 추가 버튼 */}
      {!showForm && (
        <div className="mt-4">
          <button onClick={openNew}
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-[15px] font-semibold text-white"
            style={{ backgroundColor: '#968774' }}>
            <Plus className="w-5 h-5" /> 새 배송지 추가
          </button>
        </div>
      )}

      {/* 인라인 폼 */}
      {showForm && (
        <div className="mt-4 rounded-2xl overflow-hidden" style={{ border: '1px solid #e8e4df' }}>
          <div className="px-5 pt-5 pb-3" style={{ borderBottom: '1px solid #f0f0f0' }}>
            <h3 className="text-[18px] font-bold" style={{ color: '#222' }}>
              {editTarget ? '배송지 수정' : '새 배송지'}
            </h3>
          </div>

          <form onSubmit={handleSubmit} className="px-5 pt-4 pb-5">
              {/* 수령인 */}
              <div className="mb-4">
                <label className="block text-[13px] font-medium mb-1.5" style={{ color: '#333' }}>수령인</label>
                <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required
                  placeholder="이름을 입력해 주세요"
                  className="w-full px-3.5 py-3 rounded-xl text-[14px] focus:outline-none"
                  style={{ border: '1px solid #ddd', color: '#222' }}
                  onFocus={e => (e.currentTarget.style.borderColor = '#968774')}
                  onBlur={e => (e.currentTarget.style.borderColor = '#ddd')} />
              </div>

              {/* 연락처 */}
              <div className="mb-4">
                <label className="block text-[13px] font-medium mb-1.5" style={{ color: '#333' }}>연락처</label>
                <input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} required
                  placeholder="'-' 없이 입력해 주세요"
                  className="w-full px-3.5 py-3 rounded-xl text-[14px] focus:outline-none"
                  style={{ border: '1px solid #ddd', color: '#222' }}
                  onFocus={e => (e.currentTarget.style.borderColor = '#968774')}
                  onBlur={e => (e.currentTarget.style.borderColor = '#ddd')} />
              </div>

              {/* 우편번호 */}
              <div className="mb-4">
                <label className="block text-[13px] font-medium mb-1.5" style={{ color: '#333' }}>주소</label>
                <div className="flex gap-2">
                  <input value={form.zipcode} readOnly required
                    placeholder="우편번호"
                    className="flex-1 px-3.5 py-3 rounded-xl text-[14px] focus:outline-none"
                    style={{ border: '1px solid #ddd', color: '#222', backgroundColor: '#fafafa' }} />
                  <button type="button" onClick={openPostcode}
                    className="flex items-center gap-1.5 px-4 py-3 rounded-xl text-[13px] font-medium whitespace-nowrap"
                    style={{ border: '1px solid #968774', color: '#968774' }}>
                    <Search className="w-4 h-4" />
                    주소 검색
                  </button>
                </div>
              </div>

              {/* 카카오 주소 검색 임베드 */}
              {showPostcode && (
                <div className="mb-4 rounded-xl overflow-hidden" style={{ border: '1px solid #ddd' }}>
                  <div ref={postcodeRef} style={{ height: '400px' }} />
                </div>
              )}

              {/* 주소 */}
              <div className="mb-4">
                <input value={form.address1} readOnly required
                  placeholder="주소를 검색해 주세요"
                  className="w-full px-3.5 py-3 rounded-xl text-[14px] focus:outline-none"
                  style={{ border: '1px solid #ddd', color: '#222', backgroundColor: '#fafafa' }} />
              </div>

              {/* 상세주소 */}
              <div className="mb-4">
                <input value={form.address2} onChange={e => setForm(f => ({ ...f, address2: e.target.value }))}
                  placeholder="상세주소를 입력해 주세요"
                  className="w-full px-3.5 py-3 rounded-xl text-[14px] focus:outline-none"
                  style={{ border: '1px solid #ddd', color: '#222' }}
                  onFocus={e => (e.currentTarget.style.borderColor = '#968774')}
                  onBlur={e => (e.currentTarget.style.borderColor = '#ddd')} />
              </div>

              {/* 별칭 */}
              <div className="mb-5">
                <label className="block text-[13px] font-medium mb-2" style={{ color: '#333' }}>주소 별칭</label>
                <div className="flex gap-2">
                  {LABELS.map(l => (
                    <button key={l} type="button"
                      onClick={() => setForm(f => ({ ...f, label: l }))}
                      className="px-4 py-2 rounded-full text-[13px] font-medium transition-colors"
                      style={form.label === l
                        ? { backgroundColor: '#968774', color: '#fff' }
                        : { backgroundColor: '#fff', color: '#666', border: '1px solid #ddd' }
                      }>
                      {l}
                    </button>
                  ))}
                </div>
              </div>

              {/* 기본 배송지 설정 */}
              <label className="flex items-center gap-2.5 cursor-pointer mb-6">
                <div className="relative w-5 h-5 flex items-center justify-center">
                  <input type="checkbox" checked={form.is_default}
                    onChange={e => setForm(f => ({ ...f, is_default: e.target.checked }))}
                    className="w-5 h-5 rounded" style={{ accentColor: '#968774' }} />
                </div>
                <span className="text-[14px]" style={{ color: '#333' }}>기본 배송지로 설정</span>
              </label>

              {/* 버튼 */}
              <div className="flex gap-3">
                <button type="button" onClick={() => setShowForm(false)}
                  className="flex-1 py-3.5 rounded-xl text-[15px] font-medium"
                  style={{ border: '1px solid #ddd', color: '#555' }}>
                  취소
                </button>
                <button type="submit" disabled={loading}
                  className="flex-1 py-3.5 rounded-xl text-[15px] font-semibold text-white disabled:opacity-50"
                  style={{ backgroundColor: '#968774' }}>
                  {loading ? '저장 중...' : '저장'}
                </button>
              </div>
            </form>
        </div>
      )}
    </div>
  )
}
