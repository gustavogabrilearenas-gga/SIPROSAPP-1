import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api, apiUtils, type CrudId } from '@/lib/api'

const shouldInvalidate = (resource: string) =>
  ({ queryKey }: { queryKey: unknown }) =>
    Array.isArray(queryKey) && queryKey[0] === resource

export function createCrudHooks<T = Record<string, unknown>>(resource: string) {
  const listKey = (params?: Record<string, unknown>) => [resource, 'list', params ?? {}]
  const detailKey = (id: CrudId | undefined | null) => [resource, 'detail', id]

  const useList = (params?: Record<string, unknown>) =>
    useQuery({
      queryKey: listKey(params),
      queryFn: async () => {
        const payload = await api.list<T>(resource, params)
        return apiUtils.extractResults(payload)
      },
    })

  const useRetrieve = (id: CrudId | undefined | null) =>
    useQuery({
      queryKey: detailKey(id),
      queryFn: () => api.retrieve<T>(resource, id as CrudId),
      enabled: id !== undefined && id !== null,
    })

  const useCreate = () => {
    const queryClient = useQueryClient()
    return useMutation({
      mutationFn: (payload: Partial<T>) => api.create<T>(resource, payload),
      onSuccess: () => {
        queryClient.invalidateQueries({ predicate: shouldInvalidate(resource) })
      },
    })
  }

  const useUpdate = () => {
    const queryClient = useQueryClient()
    return useMutation({
      mutationFn: ({ id, data }: { id: CrudId; data: Partial<T> }) =>
        api.update<T>(resource, id, data),
      onSuccess: (_data, variables) => {
        queryClient.invalidateQueries({ queryKey: detailKey(variables.id) })
        queryClient.invalidateQueries({ predicate: shouldInvalidate(resource) })
      },
    })
  }

  const useRemove = () => {
    const queryClient = useQueryClient()
    return useMutation({
      mutationFn: (id: CrudId) => api.remove(resource, id),
      onSuccess: (_data, id) => {
        queryClient.invalidateQueries({ queryKey: detailKey(id) })
        queryClient.invalidateQueries({ predicate: shouldInvalidate(resource) })
      },
    })
  }

  return {
    useList,
    useRetrieve,
    useCreate,
    useUpdate,
    useRemove,
  }
}

