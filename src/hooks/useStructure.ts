import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import type { Category, Course, Level, Section, Lesson, DailyLesson } from '../types'

// ---- CATEGORIES ----
export const useCategories = () =>
  useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const { data, error } = await supabase.from('categories').select('*').order('name')
      if (error) throw error
      return data as Category[]
    },
  })

export const useCreateCategory = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (cat: Omit<Category, 'id' | 'created_at'>) => {
      const { data, error } = await supabase.from('categories').insert(cat).select().single()
      if (error) throw error
      return data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['categories'] }),
  })
}

export const useUpdateCategory = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Category> & { id: string }) => {
      const { error } = await supabase.from('categories').update(updates).eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['categories'] }),
  })
}

export const useDeleteCategory = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('categories').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['categories'] }),
  })
}

// ---- COURSES ----
export const useCourses = (categoryId?: string) =>
  useQuery({
    queryKey: ['courses', categoryId],
    queryFn: async () => {
      let q = supabase.from('courses').select('*, category:categories(*)').order('name')
      if (categoryId) q = q.eq('category_id', categoryId)
      const { data, error } = await q
      if (error) throw error
      return data as Course[]
    },
  })

export const useCreateCourse = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (course: Omit<Course, 'id' | 'created_at' | 'category'>) => {
      const { data, error } = await supabase.from('courses').insert(course).select().single()
      if (error) throw error
      return data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['courses'] }),
  })
}

export const useUpdateCourse = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Course> & { id: string }) => {
      const { error } = await supabase.from('courses').update(updates).eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['courses'] }),
  })
}

export const useDeleteCourse = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('courses').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['courses'] }),
  })
}

// ---- LEVELS ----
export const useLevels = (courseId?: string) =>
  useQuery({
    queryKey: ['levels', courseId],
    queryFn: async () => {
      let q = supabase.from('levels').select('*, course:courses(*)').order('position')
      if (courseId) q = q.eq('course_id', courseId)
      const { data, error } = await q
      if (error) throw error
      return data as Level[]
    },
  })

export const useCreateLevel = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (level: Omit<Level, 'id' | 'created_at' | 'course'>) => {
      const { data, error } = await supabase.from('levels').insert(level).select().single()
      if (error) throw error
      return data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['levels'] }),
  })
}

export const useUpdateLevel = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Level> & { id: string }) => {
      const { error } = await supabase.from('levels').update(updates).eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['levels'] }),
  })
}

export const useDeleteLevel = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('levels').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['levels'] }),
  })
}

// ---- SECTIONS ----
export const useSections = (levelId?: string) =>
  useQuery({
    queryKey: ['sections', levelId],
    queryFn: async () => {
      let q = supabase.from('sections').select('*, level:levels(*)').order('position')
      if (levelId) q = q.eq('level_id', levelId)
      const { data, error } = await q
      if (error) throw error
      return data as Section[]
    },
  })

export const useCreateSection = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (section: Omit<Section, 'id' | 'created_at' | 'level'>) => {
      const { data, error } = await supabase.from('sections').insert(section).select().single()
      if (error) throw error
      return data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['sections'] }),
  })
}

export const useUpdateSection = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Section> & { id: string }) => {
      const { error } = await supabase.from('sections').update(updates).eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['sections'] }),
  })
}

export const useDeleteSection = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('sections').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['sections'] }),
  })
}

// ---- LESSONS ----
export const useLessons = (filters?: { levelId?: string; sectionId?: string; courseId?: string }) =>
  useQuery({
    queryKey: ['lessons', filters],
    queryFn: async () => {
      let q = supabase
        .from('lessons')
        .select(`*, lesson_tags(tag_id, tags(*)), lesson_quizzes(quiz_id, quizzes(*)), category:categories(*), course:courses(*), level:levels(*), section:sections(*)`)
        .order('position')

      if (filters?.levelId) q = q.eq('level_id', filters.levelId)
      if (filters?.sectionId) q = q.eq('section_id', filters.sectionId)
      if (filters?.courseId) q = q.eq('course_id', filters.courseId)

      const { data, error } = await q
      if (error) throw error

      return data.map((l: any) => ({
        ...l,
        tags: l.lesson_tags?.map((lt: any) => lt.tags).filter(Boolean) ?? [],
        quizzes: l.lesson_quizzes?.map((lq: any) => lq.quizzes).filter(Boolean) ?? [],
      })) as Lesson[]
    },
  })

export const useLesson = (id: string) =>
  useQuery({
    queryKey: ['lessons', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('lessons')
        .select(`*, lesson_tags(tag_id, tags(*)), lesson_quizzes(quiz_id, quizzes(*)), category:categories(*), course:courses(*), level:levels(*), section:sections(*)`)
        .eq('id', id)
        .single()
      if (error) throw error
      return {
        ...data,
        tags: data.lesson_tags?.map((lt: any) => lt.tags).filter(Boolean) ?? [],
        quizzes: data.lesson_quizzes?.map((lq: any) => lq.quizzes).filter(Boolean) ?? [],
      } as Lesson
    },
    enabled: !!id,
  })

export const useCreateLesson = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({
      lesson,
      tagIds,
      quizIds,
    }: {
      lesson: Omit<Lesson, 'id' | 'created_at' | 'tags' | 'quizzes' | 'category' | 'course' | 'level' | 'section' | 'completed'>
      tagIds: string[]
      quizIds: string[]
    }) => {
      const { data, error } = await supabase.from('lessons').insert(lesson).select().single()
      if (error) throw error
      if (tagIds.length > 0) await supabase.from('lesson_tags').insert(tagIds.map((tid) => ({ lesson_id: data.id, tag_id: tid })))
      if (quizIds.length > 0) await supabase.from('lesson_quizzes').insert(quizIds.map((qid) => ({ lesson_id: data.id, quiz_id: qid })))
      return data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['lessons'] }),
  })
}

export const useUpdateLesson = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({
      id,
      lesson,
      tagIds,
      quizIds,
    }: {
      id: string
      lesson: Partial<Lesson>
      tagIds?: string[]
      quizIds?: string[]
    }) => {
      const { error } = await supabase.from('lessons').update(lesson).eq('id', id)
      if (error) throw error
      if (tagIds !== undefined) {
        await supabase.from('lesson_tags').delete().eq('lesson_id', id)
        if (tagIds.length > 0) await supabase.from('lesson_tags').insert(tagIds.map((tid) => ({ lesson_id: id, tag_id: tid })))
      }
      if (quizIds !== undefined) {
        await supabase.from('lesson_quizzes').delete().eq('lesson_id', id)
        if (quizIds.length > 0) await supabase.from('lesson_quizzes').insert(quizIds.map((qid) => ({ lesson_id: id, quiz_id: qid })))
      }
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['lessons'] }) },
  })
}

export const useDeleteLesson = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('lessons').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['lessons'] }),
  })
}

// ---- USER PROGRESS ----
export const useUserProgress = (userId: string) =>
  useQuery({
    queryKey: ['user_progress', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_progress').select('*').eq('user_id', userId)
      if (error) throw error
      return data
    },
    enabled: !!userId,
  })

export const useMarkLessonComplete = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ userId, lessonId, completed }: { userId: string; lessonId: string; completed: boolean }) => {
      const { error } = await supabase.from('user_progress').upsert({
        user_id: userId,
        lesson_id: lessonId,
        completed,
        completed_at: completed ? new Date().toISOString() : null,
      }, { onConflict: 'user_id,lesson_id' })
      if (error) throw error
    },
    onSuccess: (_, vars) => qc.invalidateQueries({ queryKey: ['user_progress', vars.userId] }),
  })
}
// ---- DAILY GOALS / PRIORITIES ----
export const useDailyLessons = (userId: string) =>
  useQuery({
    queryKey: ['daily-lessons', userId],
    queryFn: async () => {
      if (!userId) return []
      const today = new Date().toISOString().split('T')[0]
      const { data, error } = await supabase
        .from('daily_lessons')
        .select('*, lesson:lessons(*, section:sections(*), level:levels(*), course:courses(*)), course:courses(*)')
        .eq('user_id', userId)
        .eq('assigned_date', today)
      
      if (error) throw error
      return data as DailyLesson[]
    },
    enabled: !!userId,
  })

export const useRefreshDailyQueue = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (userId: string) => {
      if (!userId) return

      // 1. Get priority courses
      const { data: priorities, error: pError } = await supabase
        .from('courses')
        .select('*')
        .eq('is_priority', true)
      if (pError) throw pError
      if (!priorities?.length) return

      // 2. Get all data needed for next-lesson discovery
      const [{ data: lessons }, { data: levels }, { data: sections }, { data: progress }] = await Promise.all([
        supabase.from('lessons').select('*'),
        supabase.from('levels').select('*').order('position'),
        supabase.from('sections').select('*').order('position'),
        supabase.from('user_progress').select('*').eq('user_id', userId).eq('completed', true)
      ])

      const completedIds = new Set(progress?.map(p => p.lesson_id) || [])
      const today = new Date().toISOString().split('T')[0]

      const newGoals = []

      for (const course of priorities) {
        // Find next lesson for this course
        // Replicate logic: Filter lessons for this course
        const courseLessons = (lessons || []).filter(l => l.course_id === course.id)
        if (!courseLessons.length) continue

        // Sort them by hierarchy
        const sorted = courseLessons.sort((a, b) => {
          const lA = levels?.find(lev => lev.id === a.level_id)
          const lB = levels?.find(lev => lev.id === b.level_id)
          const sA = sections?.find(sec => sec.id === a.section_id)
          const sB = sections?.find(sec => sec.id === b.section_id)

          // 1. Level priority
          const levDiff = (lA?.position ?? 999) - (lB?.position ?? 999)
          if (levDiff !== 0) return levDiff

          // 2. Section priority
          const secDiff = (sA?.position ?? 999) - (sB?.position ?? 999)
          if (secDiff !== 0) return secDiff

          // 3. Lesson priority
          return (a.position ?? 999) - (b.position ?? 999)
        })

        const next = sorted.find(l => !completedIds.has(l.id))
        if (next) {
          newGoals.push({
            user_id: userId,
            course_id: course.id,
            lesson_id: next.id,
            assigned_date: today
          })
        }
      }

      if (newGoals.length) {
        // Clear existing for today
        await supabase.from('daily_lessons').delete().eq('user_id', userId).eq('assigned_date', today)
        // Insert new
        const { error: iError } = await supabase.from('daily_lessons').upsert(newGoals)
        if (iError) throw iError
      }
    },
    onSuccess: (_, userId) => {
      qc.invalidateQueries({ queryKey: ['daily-lessons', userId] })
    }
  })
}
