import { baseApi } from './baseApi'

export interface DashboardStats {
  metrics: {
    total_products: number
    total_orders: number
    total_users: number
    total_revenue: number
  }
  orders_by_status: Record<string, number>
  weekly_chart: Array<{ label: string; revenue: number; orders: number }>
  monthly_chart: Array<{ label: string; revenue: number; orders: number }>
  yearly_chart: Array<{ label: string; revenue: number; orders: number }>
  top_products: any[]
  recent_orders: any[]
}

export const dashboardApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getDashboardStats: builder.query<{ status: number; data: DashboardStats }, void>({
      query: () => '/admin/dashboard/stats',
      providesTags: ['Dashboard'],
    }),
  }),
})

export const { useGetDashboardStatsQuery } = dashboardApi
