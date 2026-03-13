import AdminSidebar from '@/components/admin/layout/AdminSidebar'
import AdminHeader from '@/components/admin/layout/AdminHeader'
import { getAdminUser } from '@/lib/admin-auth'
import { redirect } from 'next/navigation'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const admin = await getAdminUser()
  if (!admin) redirect('/admin/login')

  return (
    <div className="flex h-screen bg-gray-100">
      <AdminSidebar role={admin.role} permissions={admin.permissions} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <AdminHeader name={admin.name} role={admin.role} />
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  )
}
