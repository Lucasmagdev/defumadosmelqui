import { DashboardStats } from '@/components/admin/dashboard-stats'
import { RevenueChart } from '@/components/admin/revenue-chart'
import { OrdersList } from '@/components/admin/orders-list'

export default function AdminDashboard() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-serif text-3xl font-bold text-[var(--foreground)]" style={{ fontFamily: 'var(--font-playfair)' }}>
          Dashboard
        </h1>
        <p className="mt-1 text-[var(--muted-foreground)]">
          Visão geral do seu negócio
        </p>
      </div>

      <DashboardStats />
      <RevenueChart />
      <OrdersList />
    </div>
  )
}
