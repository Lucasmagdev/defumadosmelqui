import { redirect } from 'next/navigation'
import { getUser, isAdmin } from '@/lib/supabase-server'
import { AdminSidebar } from '@/components/admin/sidebar'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await getUser()

  if (!user) redirect('/login?admin=1')
  if (!isAdmin(user)) redirect('/')

  return (
    <div className="flex min-h-screen bg-[var(--background)]">
      <AdminSidebar />
      <main className="flex-1 overflow-auto">
        <div className="p-6 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  )
}
