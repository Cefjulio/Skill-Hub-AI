import React, { useState } from 'react'
import { Plus, Pencil, Trash2, X, Check, Search, ArrowLeft, CheckCircle2, BookOpen, Brain, Play, ChevronRight, ChevronDown, GraduationCap, LayoutGrid } from 'lucide-react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useLessons, useLesson, useCreateLesson, useUpdateLesson, useDeleteLesson, useUserProgress, useMarkLessonComplete, useCategories, useCourses, useLevels, useSections } from '../../hooks/useStructure'
import { useQuizzes, useCreateQuiz } from '../../hooks/useQuizzes'
import { useTags } from '../../hooks/useTags'
import { Header } from '../../components/Header'
import { TagSelector } from '../../components/TagSelector'
import { RichTextEditor } from '../../components/RichTextEditor'
import { QuizPlayer } from '../../components/QuizPlayer'
import { QuizEditorView } from '../quizzes/QuizEditorPage'
import { useAuthStore } from '../../stores'
import { Filter, Layers, Book, Gauge, CheckSquare, Tag as TagIcon, RotateCcw } from 'lucide-react'
import type { Tag } from '../../types'
import toast from 'react-hot-toast'

export const LessonsPage: React.FC = () => {
  const { user } = useAuthStore()
  const { data: lessons = [], isLoading } = useLessons()
  const { data: progress = [] } = useUserProgress(user?.id ?? '')
  const deleteLesson = useDeleteLesson()
  const [search, setSearch] = useState('')
  const [filterCategory, setFilterCategory] = useState('')
  const [filterCourse, setFilterCourse] = useState('')
  const [filterLevel, setFilterLevel] = useState('')
  const [filterStatus, setFilterStatus] = useState<'all' | 'completed' | 'ongoing'>('all')
  const [filterTags, setFilterTags] = useState<string[]>([])

  const [expandedCourses, setExpandedCourses] = useState<Set<string>>(new Set())
  const [expandedLevels, setExpandedLevels] = useState<Set<string>>(new Set())
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set())

  const completedIds = new Set(progress.filter((p: any) => p.completed).map((p: any) => p.lesson_id))

  // Fetching options for filters
  const { data: categories = [] } = useCategories()
  const { data: allCourses = [] } = useCourses()
  const { data: allLevels = [] } = useLevels()
  const { data: tags = [] } = useTags()

  // Cascading Logic
  const filteredCourseOptions = filterCategory 
    ? allCourses.filter(c => c.category_id === filterCategory)
    : allCourses

  const filteredLevelOptions = filterCourse
    ? allLevels.filter(l => l.course_id === filterCourse)
    : allLevels
  
  // 1. Initial Filtering
  const filtered = lessons.filter((l) => {
    // Search
    if (search && !l.title.toLowerCase().includes(search.toLowerCase())) return false
    
    // Category
    if (filterCategory && l.category_id !== filterCategory) return false
    
    // Course
    if (filterCourse && l.course_id !== filterCourse) return false
    
    // Level
    if (filterLevel && l.level_id !== filterLevel) return false
    
    // Tag
    if (filterTags.length > 0 && !l.tags?.some(t => filterTags.includes(t.id))) return false
    
    // Status
    if (filterStatus !== 'all') {
      const isDone = completedIds.has(l.id)
      if (filterStatus === 'completed' && !isDone) return false
      if (filterStatus === 'ongoing' && isDone) return false
    }

    return true
  })

  const clearFilters = () => {
    setSearch(''); setFilterCategory(''); setFilterCourse(''); setFilterLevel(''); setFilterStatus('all'); setFilterTags([])
  }

  const isFiltered = search || filterCategory || filterCourse || filterLevel || filterStatus !== 'all' || filterTags.length > 0

  // 2. Grouping Logic
  const groupedData = filtered.reduce((acc, lesson) => {
    const course = lesson.course
    const courseId = course?.id || 'unassigned'
    const courseName = course?.name || 'Unassigned Lessons'
    
    if (!acc[courseId]) {
      acc[courseId] = {
        id: courseId,
        name: courseName,
        created_at: course?.created_at || '0',
        levels: {}
      }
    }

    const level = lesson.level
    const levelId = level?.id || 'unassigned'
    const levelName = level?.name || 'General'

    if (!acc[courseId].levels[levelId]) {
      acc[courseId].levels[levelId] = {
        id: levelId,
        name: levelName,
        position: level?.position ?? 999,
        created_at: level?.created_at || '0',
        sections: {}
      }
    }

    const section = lesson.section
    const sectionId = section?.id || 'unassigned'
    const sectionName = section?.name || 'General'
    
    if (!acc[courseId].levels[levelId].sections[sectionId]) {
      acc[courseId].levels[levelId].sections[sectionId] = {
        id: sectionId,
        name: sectionName,
        position: section?.position ?? 999,
        created_at: section?.created_at || '0',
        lessons: []
      }
    }

    acc[courseId].levels[levelId].sections[sectionId].lessons.push(lesson)
    return acc
  }, {} as any)

  // 3. Sorting & Tree Conversion
  const sortedTree = Object.values(groupedData)
    .sort((a: any, b: any) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()) // Oldest Courses first
    .map((course: any) => ({
      ...course,
      levels: Object.values(course.levels)
        .sort((a: any, b: any) => (a.position - b.position) || (new Date(a.created_at).getTime() - new Date(b.created_at).getTime()))
        .map((level: any) => ({
          ...level,
          sections: Object.values(level.sections)
            .sort((a: any, b: any) => (a.position - b.position) || (new Date(a.created_at).getTime() - new Date(b.created_at).getTime()))
            .map((section: any) => ({
              ...section,
              lessons: section.lessons.sort((a: any, b: any) => (a.position - b.position) || (new Date(a.created_at).getTime() - new Date(b.created_at).getTime()))
            }))
        }))
    }))

  const toggleCourse = (id: string) => {
    const next = new Set(expandedCourses)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setExpandedCourses(next)
  }

  const toggleLevel = (id: string) => {
    const next = new Set(expandedLevels)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setExpandedLevels(next)
  }

  const toggleSection = (id: string) => {
    const next = new Set(expandedSections)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setExpandedSections(next)
  }

  const remove = async (id: string) => {
    if (!confirm('Delete this lesson?')) return
    await deleteLesson.mutateAsync(id)
    toast.success('Lesson deleted')
  }

  return (
    <>
      <Header title="Lessons" />
      <div className="page-content flex flex-col gap-5">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex-1 min-w-48">
            <div className="search-input-wrapper">
              <Search size={15} className="search-icon" />
              <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
                placeholder="Search lessons..." className="form-input search-input py-2 text-sm" />
            </div>
          </div>
          <Link to="/lessons/new" className="btn btn-primary gap-2 ml-auto"><Plus size={15} /> New Lesson</Link>
        </div>

        {/* Filter Bar */}
        <div className="filter-bar">
          <div className="filter-group">
            <label className="filter-label">Category</label>
            <div className="filter-select-wrapper">
              <Layers size={14} className="filter-icon" />
              <select value={filterCategory} onChange={(e) => { setFilterCategory(e.target.value); setFilterCourse(''); setFilterLevel('') }} className="form-input filter-select">
                <option value="">All Categories</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
          </div>

          <div className="filter-group">
            <label className="filter-label">Course</label>
            <div className="filter-select-wrapper">
              <Book size={14} className="filter-icon" />
              <select value={filterCourse} onChange={(e) => { setFilterCourse(e.target.value); setFilterLevel('') }} className="form-input filter-select">
                <option value="">All Courses</option>
                {filteredCourseOptions.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
          </div>

          <div className="filter-group">
            <label className="filter-label">Level</label>
            <div className="filter-select-wrapper">
              <Gauge size={14} className="filter-icon" />
              <select value={filterLevel} onChange={(e) => setFilterLevel(e.target.value)} className="form-input filter-select">
                <option value="">All Levels</option>
                {filteredLevelOptions.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
              </select>
            </div>
          </div>

          <div className="filter-group">
            <label className="filter-label">Status</label>
            <div className="filter-select-wrapper">
              <CheckSquare size={14} className="filter-icon" />
              <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value as any)} className="form-input filter-select">
                <option value="all">All Status</option>
                <option value="completed">Completed</option>
                <option value="ongoing">In Progress</option>
              </select>
            </div>
          </div>

          <div className="filter-group flex-[2!important] min-w-[200px]">
            <label className="filter-label">Tags</label>
            <TagSelector selectedIds={filterTags} onChange={setFilterTags} placeholder="Filter by tags..." />
          </div>

          {isFiltered && (
            <button onClick={clearFilters} className="btn-clear-filters flex items-center gap-1.5" title="Clear all filters">
              <RotateCcw size={13} /> Clear
            </button>
          )}
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12"><div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" /></div>
        ) : sortedTree.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon"><BookOpen size={28} className="text-gray-600" /></div>
            <p className="font-medium text-gray-400">{lessons.length === 0 ? 'No lessons yet' : 'No lessons match your search'}</p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {sortedTree.map((course: any) => {
              const isExpanded = expandedCourses.has(course.id)
              return (
                <div key={course.id} className="hierarchy-course-group">
                  <div className={`hierarchy-course-header ${isExpanded ? 'expanded' : ''}`} onClick={() => toggleCourse(course.id)}>
                    {isExpanded ? <ChevronDown size={18} className="text-gray-500" /> : <ChevronRight size={18} className="text-gray-500" />}
                    <GraduationCap size={18} className="text-indigo-400" />
                    <span className="font-bold text-gray-200">{course.name}</span>
                    <span className="ml-auto text-xs font-medium text-gray-600 px-2 py-0.5 bg-[#0f1117] rounded-full">
                      {course.levels.reduce((acc: number, l: any) => acc + l.sections.reduce((acc2: number, s: any) => acc2 + s.lessons.length, 0), 0)} lessons
                    </span>
                  </div>

                  {isExpanded && (
                    <div className="animate-fade-in">
                      {course.levels.map((level: any) => {
                        const levelExpanded = expandedLevels.has(level.id)
                        return (
                          <div key={level.id} className="hierarchy-level-group">
                            <div className="hierarchy-level-header" onClick={() => toggleLevel(level.id)}>
                              {levelExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                              <span>{level.name}</span>
                              <span className="text-[10px] opacity-40 ml-2">
                                ({level.sections.reduce((acc: number, s: any) => acc + s.lessons.length, 0)} total)
                              </span>
                            </div>

                            {levelExpanded && (
                              <div className="animate-fade-in">
                                {level.sections.map((section: any) => {
                                  const sectionExpanded = expandedSections.has(section.id)
                                  return (
                                    <div key={section.id} className="hierarchy-section-group">
                                      <div className="hierarchy-section-header" onClick={() => toggleSection(section.id)}>
                                        {sectionExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                                        <span>{section.name}</span>
                                        <span className="text-[10px] text-gray-700 ml-2">({section.lessons.length})</span>
                                      </div>

                                      {sectionExpanded && (
                                        <div className="hierarchy-lessons-list animate-slide-in">
                                          {section.lessons.map((lesson: any) => {
                                            const completed = completedIds.has(lesson.id)
                                            return (
                                              <div key={lesson.id} className={`lesson-card flex items-center gap-4 group ${completed ? 'completed' : 'not-started'}`}>
                                                <CheckCircle2 size={18} className={completed ? 'text-emerald-500 flex-shrink-0' : 'text-gray-700 flex-shrink-0'} />
                                                <div className="flex-1 min-w-0">
                                                  <div className="flex items-center gap-2 flex-wrap">
                                                    <h3 className="font-semibold text-gray-200 text-sm">{lesson.title}</h3>
                                                    {lesson.tags?.slice(0, 2).map((tag: Tag) => (
                                                      <span key={tag.id} className="tag-chip" style={{ background: tag.color + '20', color: tag.color }}>{tag.name}</span>
                                                    ))}
                                                  </div>
                                                  <div className="text-[11px] text-gray-600 mt-0.5 flex items-center gap-2 flex-wrap">
                                                    {lesson.quizzes && lesson.quizzes.length > 0 && (
                                                      <span className="flex items-center gap-1 text-pink-500/80"><Brain size={10} /> {lesson.quizzes.length} quiz</span>
                                                    )}
                                                  </div>
                                                </div>
                                                <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                                                  <Link to={`/lessons/${lesson.id}`} className="btn btn-secondary btn-sm gap-1 py-1 px-2"><BookOpen size={11} /> View</Link>
                                                  <Link to={`/lessons/${lesson.id}/edit`} className="btn btn-ghost btn-icon btn-sm"><Pencil size={12} /></Link>
                                                  <button onClick={() => remove(lesson.id)} className="btn btn-icon btn-danger btn-sm"><Trash2 size={12} /></button>
                                                </div>
                                              </div>
                                            )
                                          })}
                                        </div>
                                      )}
                                    </div>
                                  )
                                })}
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </>
  )
}

export const LessonEditorPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const isNew = id === 'new' || !id
  const { data: lesson, isLoading } = useLesson(isNew ? '' : id!)
  const createLesson = useCreateLesson()
  const updateLesson = useUpdateLesson()

  const { data: categories = [] } = useCategories()
  const { data: courses = [] } = useCourses()
  const { data: levels = [] } = useLevels()
  const { data: sections = [] } = useSections()
  const { data: quizzes = [] } = useQuizzes()

  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [courseId, setCourseId] = useState('')
  const [levelId, setLevelId] = useState('')
  const [sectionId, setSectionId] = useState('')
  const [tagIds, setTagIds] = useState<string[]>([])
  const [quizIds, setQuizIds] = useState<string[]>([])
  const [saving, setSaving] = useState(false)
  const [initialized, setInitialized] = useState(false)
  
  const createQuiz = useCreateQuiz()
  const [editingQuizId, setEditingQuizId] = useState<string | null>(null)
  const [creatingQuizTitle, setCreatingQuizTitle] = useState('')
  const [showCreateQuizPrompt, setShowCreateQuizPrompt] = useState(false)

  const handleCreateQuiz = async () => {
    if (!creatingQuizTitle.trim()) return
    try {
      const q = await createQuiz.mutateAsync({ title: creatingQuizTitle.trim(), description: '' })
      setQuizIds(prev => [...prev, q.id])
      setCreatingQuizTitle('')
      setShowCreateQuizPrompt(false)
      setEditingQuizId(q.id)
      toast.success('Quiz created!')
    } catch (e: any) { toast.error(e.message) }
  }

  React.useEffect(() => {
    if (lesson && !initialized) {
      setTitle(lesson.title); setContent(lesson.content ?? '')
      setCategoryId(lesson.category_id ?? ''); setCourseId(lesson.course_id ?? '')
      setLevelId(lesson.level_id ?? ''); setSectionId(lesson.section_id ?? '')
      setTagIds(lesson.tags?.map((t: Tag) => t.id) ?? [])
      setQuizIds(lesson.quizzes?.map((q: any) => q.id) ?? [])
      setInitialized(true)
    }
  }, [lesson, initialized])

  const save = async () => {
    if (!title.trim()) return toast.error('Title is required')
    setSaving(true)
    try {
      const payload = {
        title: title.trim(), content,
        category_id: categoryId || undefined, course_id: courseId || undefined,
        level_id: levelId || undefined, section_id: sectionId || undefined,
        position: lesson?.position ?? 0
      }
      if (isNew) {
        const created = await createLesson.mutateAsync({ lesson: payload as any, tagIds, quizIds })
        toast.success('Lesson created!')
        navigate(`/lessons/${(created as any).id}`)
      } else {
        await updateLesson.mutateAsync({ id: id!, lesson: payload, tagIds, quizIds })
        toast.success('Lesson saved!')
        navigate(`/lessons/${id}`)
      }
    } catch (e: any) { toast.error(e.message) }
    finally { setSaving(false) }
  }

  if (!isNew && isLoading) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return (
    <>
      <Header />
      <div className="page-content flex flex-col gap-5 max-w-3xl">
        <div className="flex items-center gap-3">
          <Link to="/lessons" className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-200">
            <ArrowLeft size={15} /> Back
          </Link>
          <h1 className="text-lg font-bold text-white">{isNew ? 'New Lesson' : 'Edit Lesson'}</h1>
          <button onClick={save} disabled={saving} className="btn btn-primary gap-1.5 ml-auto">
            {saving ? <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Check size={14} />}
            {isNew ? 'Create Lesson' : 'Save Changes'}
          </button>
        </div>

        <div className="card">
          <div className="card-body flex flex-col gap-5">
            <div className="form-group">
              <label className="form-label">Lesson Title *</label>
              <input value={title} onChange={(e) => setTitle(e.target.value)} className="form-input text-lg font-semibold" placeholder="Lesson title..." />
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { label: 'Category', val: categoryId, set: setCategoryId, opts: categories },
                { label: 'Course', val: courseId, set: setCourseId, opts: courses },
                { label: 'Level', val: levelId, set: setLevelId, opts: levels },
                { label: 'Section', val: sectionId, set: setSectionId, opts: sections },
              ].map((field) => (
                <div key={field.label} className="form-group">
                  <label className="form-label">{field.label}</label>
                  <select value={field.val} onChange={(e) => field.set(e.target.value)} className="form-input form-select text-sm py-2">
                    <option value="">— {field.label} —</option>
                    {field.opts.map((o: any) => <option key={o.id} value={o.id}>{o.name}</option>)}
                  </select>
                </div>
              ))}
            </div>

            <div className="form-group">
              <label className="form-label">Tags</label>
              <TagSelector selectedIds={tagIds} onChange={setTagIds} />
            </div>

            <div className="form-group">
              <label className="form-label">Attach Quizzes</label>
              <div className="flex flex-wrap items-center gap-2 p-3 bg-[#0f1117] rounded-lg border border-[#1e2334] min-h-12">
                {quizzes.map((q) => (
                  <button
                    key={q.id} type="button"
                    onClick={() => setQuizIds((ids) => ids.includes(q.id) ? ids.filter((id) => id !== q.id) : [...ids, q.id])}
                    className={`btn btn-sm gap-1.5 ${quizIds.includes(q.id) ? 'btn-primary' : 'btn-secondary'}`}
                  >
                    {quizIds.includes(q.id) && <Check size={11} />}
                    <Brain size={11} /> {q.title}
                  </button>
                ))}
                {quizzes.length === 0 && !showCreateQuizPrompt && <span className="text-xs text-gray-600">No quizzes available.</span>}
                
                {showCreateQuizPrompt ? (
                   <div className="flex items-center gap-2 w-full mt-2 pt-2 border-t border-[#1e2334]">
                      <input autoFocus value={creatingQuizTitle} onChange={e => setCreatingQuizTitle(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleCreateQuiz()} className="form-input text-sm py-1.5 flex-1" placeholder="New Quiz Title..." />
                      <button onClick={handleCreateQuiz} type="button" className="btn btn-primary btn-sm" disabled={createQuiz.isPending}>Create</button>
                      <button onClick={() => setShowCreateQuizPrompt(false)} type="button" className="btn btn-secondary btn-sm"><X size={14} /></button>
                   </div>
                ) : (
                   <button type="button" onClick={() => setShowCreateQuizPrompt(true)} className="btn btn-secondary btn-sm gap-1.5 ml-auto border-dashed border-[#2d3450] hover:border-indigo-500/50">
                      <Plus size={14} /> New Quiz
                   </button>
                )}
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Content</label>
              <RichTextEditor content={content} onChange={setContent} placeholder="Write your lesson content..." minHeight="350px" />
            </div>
          </div>
        </div>
      </div>

      {/* Embedded Quiz Editor Modal */}
      {editingQuizId && (
        <div className="modal-overlay" style={{ zIndex: 60 }}>
          <div className="modal-content w-full h-full max-w-none rounded-none overflow-y-auto" style={{ background: '#080a0f' }}>
            <div className="max-w-4xl mx-auto w-full pt-12 relative">
               <QuizEditorView quizId={editingQuizId} onClose={() => setEditingQuizId(null)} />
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export const LessonViewerPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const { data: lesson, isLoading } = useLesson(id!)
  const { user } = useAuthStore()
  const { data: progress = [] } = useUserProgress(user?.id ?? '')
  const markComplete = useMarkLessonComplete()

  const [playingQuiz, setPlayingQuiz] = useState<string | null>(null)

  const isCompleted = progress.some((p: any) => p.lesson_id === id && p.completed)

  const toggleComplete = async () => {
    if (!user) return toast.error('Sign in to track progress')
    await markComplete.mutateAsync({ userId: user.id, lessonId: id!, completed: !isCompleted })
    toast.success(isCompleted ? 'Lesson marked incomplete' : 'Lesson completed! 🎉')
  }

  if (isLoading) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )
  if (!lesson) return null

  return (
    <>
      <Header />
      <div className="page-content flex flex-col gap-5 max-w-3xl">
        {/* Nav */}
        <div className="flex items-center gap-3">
          <Link to="/lessons" className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-200">
            <ArrowLeft size={15} /> Back to Lessons
          </Link>
          <div className="ml-auto flex items-center gap-2">
            <Link to={`/lessons/${id}/edit`} className="btn btn-secondary btn-sm gap-1.5"><Pencil size={13} /> Edit</Link>
            <button onClick={toggleComplete} className={`btn btn-sm gap-1.5 ${isCompleted ? 'btn-secondary' : 'btn-success'}`}>
              <CheckCircle2 size={14} /> {isCompleted ? 'Reset' : 'Mark Complete'}
            </button>
          </div>
        </div>

        {/* Header card */}
        <div className={`card ${isCompleted ? 'border-emerald-500/30' : ''}`} style={isCompleted ? { background: 'rgba(16,185,129,0.05)' } : {}}>
          <div className="card-body">
            <div className="flex items-start gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${isCompleted ? 'bg-emerald-500/20' : 'bg-indigo-500/20'}`}>
                {isCompleted ? <CheckCircle2 size={20} className="text-emerald-500" /> : <BookOpen size={20} className="text-indigo-400" />}
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">{lesson.title}</h1>
                <div className="flex flex-wrap gap-2 mt-1.5 text-xs text-gray-500">
                  {lesson.category?.name && <span>{lesson.category.name}</span>}
                  {lesson.course?.name && <span>· {lesson.course.name}</span>}
                  {lesson.level?.name && <span>· {lesson.level.name}</span>}
                </div>
                {lesson.tags && lesson.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {lesson.tags.map((tag: Tag) => (
                      <span key={tag.id} className="tag-chip" style={{ background: tag.color + '20', color: tag.color }}>{tag.name}</span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="card">
          <div className="card-body">
            <RichTextEditor content={lesson.content ?? ''} readOnly />
          </div>
        </div>

        {/* Quizzes */}
        {lesson.quizzes && lesson.quizzes.length > 0 && (
          <div className="flex flex-col gap-3">
            <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Quizzes</h2>
            {lesson.quizzes.map((quiz: any) => (
              <div key={quiz.id} className="card">
                <div className="card-body flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-pink-500/20 flex items-center justify-center"><Brain size={16} className="text-pink-400" /></div>
                  <div className="flex-1">
                    <div className="font-medium text-sm text-gray-200">{quiz.title}</div>
                  </div>
                  <button onClick={() => setPlayingQuiz(quiz.id)} className="btn btn-success btn-sm gap-1.5">
                    <Play size={13} /> Take Quiz
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quiz modal */}
      {playingQuiz && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setPlayingQuiz(null)}>
          <div className="modal-content modal-xl">
            <div className="modal-header">
              <h2 className="font-semibold text-base">{lesson.quizzes?.find((q: any) => q.id === playingQuiz)?.title}</h2>
              <button onClick={() => setPlayingQuiz(null)} className="btn btn-icon btn-ghost btn-sm"><X size={15} /></button>
            </div>
            <QuizPlayer quizId={playingQuiz} onClose={() => setPlayingQuiz(null)} />
          </div>
        </div>
      )}
    </>
  )
}
