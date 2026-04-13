import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import type { FileItem } from '../types'

export const useFiles = (filters?: { file_type?: string; tag_id?: string }) =>
  useQuery({
    queryKey: ['files', filters],
    queryFn: async () => {
      let query = supabase
        .from('files')
        .select(`*, file_tags(tag_id, tags(*)), file_tasks(*)`)
        .order('created_at', { ascending: false })

      if (filters?.file_type) query = query.eq('file_type', filters.file_type)

      const { data, error } = await query
      if (error) throw error

      return data.map((f: any) => ({
        ...f,
        tags: f.file_tags?.map((ft: any) => ft.tags).filter(Boolean) ?? [],
        file_tasks: f.file_tasks ?? [],
      })) as FileItem[]
    },
  })

export const useFile = (id: string) =>
  useQuery({
    queryKey: ['files', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('files')
        .select(`*, file_tags(tag_id, tags(*)), file_tasks(*)`)
        .eq('id', id)
        .single()
      if (error) throw error
      return {
        ...data,
        tags: data.file_tags?.map((ft: any) => ft.tags).filter(Boolean) ?? [],
        file_tasks: data.file_tasks ?? [],
      } as FileItem
    },
    enabled: !!id,
  })

export const useCreateFile = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({
      file,
      tagIds,
    }: {
      file: Omit<FileItem, 'id' | 'created_at' | 'tags' | 'file_tasks'>
      tagIds: string[]
    }) => {
      const { data, error } = await supabase.from('files').insert(file).select().single()
      if (error) throw error

      if (tagIds.length > 0) {
        await supabase.from('file_tags').insert(tagIds.map((tid) => ({ file_id: data.id, tag_id: tid })))
      }
      return data as FileItem
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['files'] }),
  })
}

export const useUpdateFile = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({
      id,
      file,
      tagIds,
    }: {
      id: string
      file: Partial<FileItem>
      tagIds?: string[]
    }) => {
      const { error } = await supabase.from('files').update(file).eq('id', id)
      if (error) throw error

      if (tagIds !== undefined) {
        await supabase.from('file_tags').delete().eq('file_id', id)
        if (tagIds.length > 0) {
          await supabase.from('file_tags').insert(tagIds.map((tid) => ({ file_id: id, tag_id: tid })))
        }
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['files'] }),
  })
}

export const useDeleteFile = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('files').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['files'] }),
  })
}

export const useUploadFile = () =>
  useMutation({
    mutationFn: async ({ bucket, file, path }: { bucket: string; file: File; path: string }) => {
      const { data, error } = await supabase.storage.from(bucket).upload(path, file, { upsert: true })
      if (error) throw error
      const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(data.path)
      return { publicUrl: urlData.publicUrl, path: data.path }
    },
  })
