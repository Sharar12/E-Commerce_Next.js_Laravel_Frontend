import { baseApi } from './baseApi'

export interface Product {
  id: number
  category_id: number
  brand_id: number
  name: string
  sku: string
  description?: string
  base_price: number
  stock_quantity: number
  weight?: number
  is_seasonal?: boolean
  seasonal_start_date?: string
  seasonal_end_date?: string
  status: 'active' | 'inactive'
  sales_count?: number
  category?: any
  brand?: any
  images?: any[]
  reviews?: any[]
  wishlists?: any[]
}

export const productApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getProducts: builder.query<{ success: boolean; status: number; data: Product[] }, { status?: string } | void>({
      query: (params) => {
        const statusParam = params && params.status ? `?status=${params.status}` : ''
        return `/products${statusParam}`
      },
      providesTags: ['Product'],
    }),
    getProductById: builder.query<{ success: boolean; data: Product }, number | string>({
      query: (id) => `/products/${id}`,
      providesTags: (_result, _error, id) => [{ type: 'Product', id }],
    }),
    createProduct: builder.mutation<any, FormData | Partial<Product>>({
      query: (body) => ({
        url: '/admin/products',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Product', 'Dashboard'],
    }),
    updateProduct: builder.mutation<any, { id: number | string; body: FormData | Partial<Product> }>({
      query: ({ id, body }) => ({
        url: `/admin/products/${id}`,
        method: 'POST',
        body,
      }),
      invalidatesTags: (_result, _error, { id }) => ['Product', { type: 'Product', id }, 'Dashboard'],
    }),
    deleteProduct: builder.mutation<any, number | string>({
      query: (id) => ({
        url: `/admin/products/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Product', 'Dashboard'],
    }),
  }),
})

export const {
  useGetProductsQuery,
  useGetProductByIdQuery,
  useCreateProductMutation,
  useUpdateProductMutation,
  useDeleteProductMutation,
} = productApi
