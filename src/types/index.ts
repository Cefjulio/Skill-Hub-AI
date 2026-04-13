// ============================================================
// SHARED TYPES FOR SKILL HUB AI
// ============================================================

export interface Tag {
  id: string
  name: string
  color: string
  created_at: string
}

export interface FileItem {
  id: string
  title: string
  description?: string
  file_type: 'image' | 'audio' | 'pdf' | 'youtube' | 'embed'
  file_url?: string
  embed_url?: string
  storage_path?: string
  created_at: string
  user_id?: string
  tags?: Tag[]
  file_tasks?: FileTask[]
}

export interface FileTask {
  id: string
  file_id: string
  content: string
  completed: boolean
  position: number
  created_at: string
}

export interface Category {
  id: string
  name: string
  description?: string
  image_url?: string
  created_at: string
}

export interface Course {
  id: string
  category_id?: string
  name: string
  description?: string
  is_priority?: boolean
  category?: Category
}

export interface DailyLesson {
  id: string
  user_id: string
  course_id: string
  lesson_id: string
  assigned_date: string
  created_at: string
  lesson?: Lesson
  course?: Course
}

export interface Level {
  id: string
  course_id?: string
  name: string
  description?: string
  image_url?: string
  position: number
  created_at: string
  course?: Course
}

export interface Section {
  id: string
  level_id?: string
  name: string
  description?: string
  position: number
  created_at: string
  level?: Level
}

export interface Lesson {
  id: string
  section_id?: string
  category_id?: string
  course_id?: string
  level_id?: string
  title: string
  content?: string
  image_url?: string
  position: number
  created_at: string
  tags?: Tag[]
  quizzes?: Quiz[]
  section?: Section
  category?: Category
  course?: Course
  level?: Level
  completed?: boolean
}

export interface Quiz {
  id: string
  title: string
  description?: string
  created_at: string
  questions?: Question[]
}

export interface Question {
  id: string
  quiz_id: string
  type: 'single' | 'multiple' | 'truefalse' | 'flashcard'
  content: string
  score: number
  position: number
  created_at: string
  answers?: Answer[]
}

export interface Answer {
  id: string
  question_id: string
  content: string
  is_correct: boolean
  position: number
  created_at: string
}

export interface QuizAttempt {
  id: string
  quiz_id: string
  user_id: string
  score: number
  max_score: number
  passed: boolean
  created_at: string
}

export interface UserProgress {
  id: string
  user_id: string
  lesson_id: string
  completed: boolean
  completed_at?: string
  created_at: string
}
