import { baseApi } from './baseApi'

export interface Category {
  id: number
  name: string
  description?: string
  status: number
  parent_id?: number | null
  image?: string
  parent?: Category
  children?: Category[]
  products_count?: number
}

export const categoryApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getCategoryTree: builder.query<{ status: number; data: Category[] }, void>({
      query: () => '/categories/tree',
      providesTags: ['Category'],
    }),
    getAdminCategories: builder.query<{ status: number; data: Category[] }, void>({
      query: () => '/admin/categories',
      providesTags: ['Category'],
    }),
    getCategoryById: builder.query<{ status: number; data: Category }, number>({
      query: (id) => `/admin/categories/${id}`,
      providesTags: (_result, _error, id) => [{ type: 'Category', id }],
    }),
    createCategory: builder.mutation<any, FormData | Partial<Category>>({
      query: (body) => ({
        url: '/admin/categories',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Category'],
    }),
    updateCategory: builder.mutation<any, { id: number; body: FormData | Partial<Category> }>({
      query: ({ id, body }) => ({
        url: `/admin/categories/${id}`,
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Category'],
    }),
    deleteCategory: builder.mutation<any, number>({
      query: (id) => ({
        url: `/admin/categories/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Category'],
    }),
  }),
})

export const {
  useGetCategoryTreeQuery,
  useGetAdminCategoriesQuery,
  useGetCategoryByIdQuery,
  useCreateCategoryMutation,
  useUpdateCategoryMutation,
  useDeleteCategoryMutation,
} = categoryApi
