import { baseApi } from './baseApi'

export const discountApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getDiscounts: builder.query<any, void>({
      query: () => '/discounts',
      providesTags: ['Discount'],
    }),
    createDiscount: builder.mutation<any, any>({
      query: (body) => ({ url: '/admin/discounts', method: 'POST', body }),
      invalidatesTags: ['Discount'],
    }),
  }),
})

export const { useGetDiscountsQuery, useCreateDiscountMutation } = discountApi
