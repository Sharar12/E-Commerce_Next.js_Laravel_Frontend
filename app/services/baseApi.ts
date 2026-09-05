import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'

const getApiBaseUrl = () => {
  if (process.env.NEXT_PUBLIC_API_URL) return process.env.NEXT_PUBLIC_API_URL
  return 'http://127.0.0.1:8000/api'
}

export const baseApi = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({
    baseUrl: getApiBaseUrl(),
    prepareHeaders: (headers) => {
      if (typeof window !== 'undefined') {
        const token = localStorage.getItem('token') || localStorage.getItem('adminToken') || localStorage.getItem('userToken')
        if (token) {
          headers.set('Authorization', `Bearer ${token}`)
        }
      }
      headers.set('Accept', 'application/json')
      return headers
    },
  }),
  tagTypes: [
    'Product',
    'Category',
    'Cart',
    'Order',
    'Coupon',
    'Discount',
    'Inventory',
    'Shipping',
    'Transaction',
    'Review',
    'Dashboard',
    'User',
  ],
  endpoints: () => ({}),
})
