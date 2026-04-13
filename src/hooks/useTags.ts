import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import type { Tag } from '../types'

export const useTags = () =>
  useQuery({
    queryKey: ['tags'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tags').select('*').order('name')
      if (error) throw error
      return data as Tag[]
    },
  })

export const useCreateTag = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (tag: { name: string; color: string }) => {
      const { data, error } = await supabase.from('tags').insert(tag).select().single()
      if (error) throw error
      return data as Tag
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tags'] }),
  })
}

export const useUpdateTag = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Tag> & { id: string }) => {
      const { data, error } = await supabase.from('tags').update(updates).eq('id', id).select().single()
      if (error) throw error
      return data as Tag
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tags'] }),
  })
}

export const useDeleteTag = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('tags').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tags'] }),
  })
}
