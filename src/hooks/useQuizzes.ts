import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import type { Quiz, Question, Answer, QuizAttempt } from '../types'

export const useQuizzes = () =>
  useQuery({
    queryKey: ['quizzes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('quizzes').select('*').order('created_at', { ascending: false })
      if (error) throw error
      return data as Quiz[]
    },
  })

export const useQuiz = (id: string) =>
  useQuery({
    queryKey: ['quizzes', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('quizzes')
        .select(`*, questions(*, answers(*))`)
        .eq('id', id)
        .single()
      if (error) throw error
      return {
        ...data,
        questions: (data.questions ?? []).sort((a: Question, b: Question) => a.position - b.position).map((q: any) => ({
          ...q,
          answers: (q.answers ?? []).sort((a: Answer, b: Answer) => a.position - b.position),
        })),
      } as Quiz
    },
    enabled: !!id,
  })

export const useCreateQuiz = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (quiz: { title: string; description?: string }) => {
      const { data, error } = await supabase.from('quizzes').insert(quiz).select().single()
      if (error) throw error
      return data as Quiz
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['quizzes'] }),
  })
}

export const useUpdateQuiz = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Quiz> & { id: string }) => {
      const { error } = await supabase.from('quizzes').update(updates).eq('id', id)
      if (error) throw error
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['quizzes'] })
      qc.invalidateQueries({ queryKey: ['quizzes', vars.id] })
    },
  })
}

export const useDeleteQuiz = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('quizzes').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['quizzes'] }),
  })
}

export const useCreateQuestion = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (question: Omit<Question, 'id' | 'created_at' | 'answers'>) => {
      const { data, error } = await supabase.from('questions').insert(question).select().single()
      if (error) throw error
      return data as Question
    },
    onSuccess: (_, vars) => qc.invalidateQueries({ queryKey: ['quizzes', vars.quiz_id] }),
  })
}

export const useUpdateQuestion = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, quiz_id, ...updates }: Partial<Question> & { id: string; quiz_id: string }) => {
      const { error } = await supabase.from('questions').update(updates).eq('id', id)
      if (error) throw error
      return { quiz_id }
    },
    onSuccess: (data) => qc.invalidateQueries({ queryKey: ['quizzes', data?.quiz_id] }),
  })
}

export const useDeleteQuestion = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, quiz_id }: { id: string; quiz_id: string }) => {
      const { error } = await supabase.from('questions').delete().eq('id', id)
      if (error) throw error
      return { quiz_id }
    },
    onSuccess: (data) => qc.invalidateQueries({ queryKey: ['quizzes', data?.quiz_id] }),
  })
}

export const useCreateAnswer = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ answer, quiz_id }: { answer: Omit<Answer, 'id' | 'created_at'>; quiz_id: string }) => {
      const { data, error } = await supabase.from('answers').insert(answer).select().single()
      if (error) throw error
      return { ...data, quiz_id } as Answer & { quiz_id: string }
    },
    onSuccess: (data) => qc.invalidateQueries({ queryKey: ['quizzes', data.quiz_id] }),
  })
}

export const useUpdateAnswer = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, quiz_id, ...updates }: Partial<Answer> & { id: string; quiz_id: string }) => {
      const { error } = await supabase.from('answers').update(updates).eq('id', id)
      if (error) throw error
      return { quiz_id }
    },
    onSuccess: (data) => qc.invalidateQueries({ queryKey: ['quizzes', data?.quiz_id] }),
  })
}

export const useDeleteAnswer = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, quiz_id }: { id: string; quiz_id: string }) => {
      const { error } = await supabase.from('answers').delete().eq('id', id)
      if (error) throw error
      return { quiz_id }
    },
    onSuccess: (data) => qc.invalidateQueries({ queryKey: ['quizzes', data?.quiz_id] }),
  })
}

export const useRecordAttempt = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (attempt: Omit<QuizAttempt, 'id' | 'created_at'>) => {
      const { data, error } = await supabase.from('quiz_attempts').insert(attempt).select().single()
      if (error) throw error
      return data as QuizAttempt
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['quiz_attempts'] }),
  })
}

export const useQuizAttempts = (quizId: string) =>
  useQuery({
    queryKey: ['quiz_attempts', quizId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('quiz_attempts')
        .select('*')
        .eq('quiz_id', quizId)
        .order('created_at', { ascending: false })
        .limit(5)
      if (error) throw error
      return data as QuizAttempt[]
    },
    enabled: !!quizId,
  })
