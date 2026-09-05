import { baseApi } from './baseApi'

export const reportApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getReports: builder.query<any, void>({
      query: () => '/admin/reports',
      providesTags: ['Dashboard'],
    }),
  }),
})

export const { useGetReportsQuery } = reportApi
