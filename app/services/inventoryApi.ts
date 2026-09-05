import { baseApi } from './baseApi'

export const inventoryApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getInventoryLogs: builder.query<any, void>({
      query: () => '/admin/inventory-log',
      providesTags: ['Inventory'],
    }),
  }),
})

export const { useGetInventoryLogsQuery } = inventoryApi
