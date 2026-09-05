import { baseApi } from './baseApi'

export const shippingApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getShippingMethods: builder.query<any, void>({
      query: () => '/shipping-methods',
      providesTags: ['Shipping'],
    }),
  }),
})

export const { useGetShippingMethodsQuery } = shippingApi
