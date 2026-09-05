import { baseApi } from './baseApi'

export const couponApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getCoupons: builder.query<any, void>({
      query: () => '/admin/coupons',
      providesTags: ['Coupon'],
    }),
    createCoupon: builder.mutation<any, any>({
      query: (body) => ({ url: '/admin/coupons', method: 'POST', body }),
      invalidatesTags: ['Coupon'],
    }),
    deleteCoupon: builder.mutation<any, number | string>({
      query: (id) => ({ url: `/admin/coupons/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Coupon'],
    }),
  }),
})

export const {
  useGetCouponsQuery,
  useCreateCouponMutation,
  useDeleteCouponMutation,
} = couponApi
