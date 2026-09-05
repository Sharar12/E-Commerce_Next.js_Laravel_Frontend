import { baseApi } from './baseApi'

export const reviewApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getReviews: builder.query<any, void>({
      query: () => '/admin/reviews',
      providesTags: ['Review'],
    }),
  }),
})

export const { useGetReviewsQuery } = reviewApi
