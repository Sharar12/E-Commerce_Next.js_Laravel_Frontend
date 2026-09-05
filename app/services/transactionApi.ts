import { baseApi } from './baseApi'

export const transactionApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getTransactions: builder.query<any, void>({
      query: () => '/transactions',
      providesTags: ['Transaction'],
    }),
  }),
})

export const { useGetTransactionsQuery } = transactionApi
