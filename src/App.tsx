import React, { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'react-hot-toast'

import { supabase } from './lib/supabase'
import { useAuthStore, useUIStore } from './stores'

import { ErrorBoundary } from './components/ErrorBoundary'

// Pages
import { AuthPage } from './pages/auth/AuthPage'
import { Dashboard } from './pages/dashboard/Dashboard'
import { TagsPage } from './pages/tags/TagsPage'
import { RepositoryPage } from './pages/repository/RepositoryPage'
import { QuizzesPage } from './pages/quizzes/QuizzesPage'
import { QuizEditorPage } from './pages/quizzes/QuizEditorPage'
import { LessonsPage, LessonEditorPage, LessonViewerPage } from './pages/lessons/LessonsPage'
import { HierarchyPage } from './pages/hierarchy/HierarchyPage'
import { SearchPage } from './pages/search/SearchPage'

// Structure pages
import { StructurePage } from './pages/structure/StructurePage'
import {
  useCategories, useCreateCategory, useUpdateCategory, useDeleteCategory,
  useCourses, useCreateCourse, useUpdateCourse, useDeleteCourse,
  useLevels, useCreateLevel, useUpdateLevel, useDeleteLevel,
  useSections, useCreateSection, useUpdateSection, useDeleteSection,
} from './hooks/useStructure'
import { GraduationCap, BookMarked, Layers, AlignLeft } from 'lucide-react'

// Components
import { Sidebar } from './components/Sidebar'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 30_000, retry: 1 },
  },
})

const ProtectedLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { sidebarOpen } = useUIStore()
  return (
    <div className="app-layout">
      <Sidebar />
      <div className={`main-content ${sidebarOpen ? '' : 'main-content-full'}`}>
        {children}
      </div>
    </div>
  )
}

// Generic Page Wrappers to handle hooks correctly and prevent hook violations
const CategoriesPage = () => (
  <StructurePage
    key="categories"
    title="Categories"
    entityName="Category"
    icon={<GraduationCap size={14} className="text-indigo-400" />}
    useItems={useCategories as any}
    useCreate={useCreateCategory}
    useUpdate={useUpdateCategory}
    useDelete={useDeleteCategory}
  />
)

const CoursesPage = () => {
  const { data: categories = [] } = useCategories()
  return (
    <StructurePage
      key="courses"
      title="Courses"
      entityName="Course"
      icon={<BookMarked size={14} className="text-violet-400" />}
      useItems={useCourses as any}
      useCreate={useCreateCourse}
      useUpdate={useUpdateCourse}
      useDelete={useDeleteCourse}
      extraFields={[{ key: 'category_id', label: 'Category', type: 'select', options: categories }]}
      showPriority={true}
    />
  )
}

const LevelsPage = () => {
  const { data: courses = [] } = useCourses()
  return (
    <StructurePage
      key="levels"
      title="Levels"
      entityName="Level"
      icon={<Layers size={14} className="text-pink-400" />}
      useItems={useLevels as any}
      useCreate={useCreateLevel}
      useUpdate={useUpdateLevel}
      useDelete={useDeleteLevel}
      extraFields={[{ key: 'course_id', label: 'Course', type: 'select', options: courses }]}
    />
  )
}

const SectionsPage = () => {
  const { data: levels = [] } = useLevels()
  return (
    <StructurePage
      key="sections"
      title="Sections"
      entityName="Section"
      icon={<AlignLeft size={14} className="text-amber-400" />}
      useItems={useSections as any}
      useCreate={useCreateSection}
      useUpdate={useUpdateSection}
      useDelete={useDeleteSection}
      extraFields={[{ key: 'level_id', label: 'Level', type: 'select', options: levels }]}
    />
  )
}

const AppRoutes: React.FC = () => {
  const { user, loading, setUser, setLoading } = useAuthStore()
  const { theme } = useUIStore()

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
  }, [theme])

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[var(--bg-page)] text-[var(--text-primary)]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <div className="text-sm text-gray-500">Loading Skill Hub AI...</div>
        </div>
      </div>
    )
  }

  if (!user) return <AuthPage />

  return (
    <ProtectedLayout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/tags" element={<TagsPage />} />
        <Route path="/repository" element={<RepositoryPage />} />
        <Route path="/quizzes" element={<QuizzesPage />} />
        <Route path="/quizzes/:id/edit" element={<QuizEditorPage />} />
        <Route path="/lessons" element={<LessonsPage />} />
        <Route path="/lessons/new" element={<LessonEditorPage />} />
        <Route path="/lessons/:id" element={<LessonViewerPage />} />
        <Route path="/lessons/:id/edit" element={<LessonEditorPage />} />
        <Route path="/hierarchy" element={<HierarchyPage />} />
        <Route path="/search" element={<SearchPage />} />

        {/* Structure routes */}
        <Route path="/categories" element={<CategoriesPage />} />
        <Route path="/courses" element={<CoursesPage />} />
        <Route path="/levels" element={<LevelsPage />} />
        <Route path="/sections" element={<SectionsPage />} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </ProtectedLayout>
  )
}

const App: React.FC = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AppRoutes />
        <Toaster
          position="bottom-right"
          toastOptions={{
            style: {
              background: '#1a1f2e',
              color: '#e2e8f0',
              border: '1px solid #2d3450',
              fontSize: '14px',
            },
            success: { iconTheme: { primary: '#10b981', secondary: '#fff' } },
            error: { iconTheme: { primary: '#ef4444', secondary: '#fff' } },
          }}
        />
      </BrowserRouter>
    </QueryClientProvider>
  </ErrorBoundary>
)

export default App
