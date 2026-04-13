import React, { useState } from 'react'
import { Plus, Brain, Pencil, Trash2, Play, X, Check, Search, GraduationCap, BookMarked, Layers, AlignLeft, RotateCcw } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useQuizzes, useCreateQuiz, useDeleteQuiz } from '../../hooks/useQuizzes'
import { useCategories, useCourses, useLevels, useSections } from '../../hooks/useStructure'
import { Header } from '../../components/Header'
import { RichTextEditor } from '../../components/RichTextEditor'
import toast from 'react-hot-toast'
import { QuizPlayer } from '../../components/QuizPlayer'

export const QuizzesPage: React.FC = () => {
  const { data: quizzes = [], isLoading } = useQuizzes()
  const createQuiz = useCreateQuiz()
  const deleteQuiz = useDeleteQuiz()

  // Structure data for filters and create form
  const { data: categories = [] } = useCategories()
  const { data: allCourses = [] } = useCourses()
  const { data: allLevels = [] } = useLevels()
  const { data: allSections = [] } = useSections()

  // ── Create modal state ──────────────────────────────────────────
  const [modal, setModal] = useState(false)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [newCategoryId, setNewCategoryId] = useState('')
  const [newCourseId, setNewCourseId] = useState('')
  const [newLevelId, setNewLevelId] = useState('')
  const [newSectionId, setNewSectionId] = useState('')

  // Cascaded options for create form
  const createFilteredCourses = newCategoryId ? allCourses.filter((c: any) => c.category_id === newCategoryId) : allCourses
  const createFilteredLevels  = newCourseId   ? allLevels.filter((l: any) => l.course_id === newCourseId)     : allLevels
  const createFilteredSections = newLevelId   ? allSections.filter((s: any) => s.level_id === newLevelId)     : allSections

  const handleNewCategoryChange = (val: string) => { setNewCategoryId(val); setNewCourseId(''); setNewLevelId(''); setNewSectionId('') }
  const handleNewCourseChange   = (val: string) => { setNewCourseId(val);   setNewLevelId(''); setNewSectionId('') }
  const handleNewLevelChange    = (val: string) => { setNewLevelId(val);    setNewSectionId('') }

  const resetModal = () => {
    setModal(false); setTitle(''); setDescription('')
    setNewCategoryId(''); setNewCourseId(''); setNewLevelId(''); setNewSectionId('')
  }

  // ── Filter state ────────────────────────────────────────────────
  const [search, setSearch] = useState('')
  const [filterCategoryId, setFilterCategoryId] = useState('')
  const [filterCourseId, setFilterCourseId] = useState('')
  const [filterLevelId, setFilterLevelId] = useState('')
  const [filterSectionId, setFilterSectionId] = useState('')

  // Cascaded options for filter bar
  const filterCourses   = filterCategoryId ? allCourses.filter((c: any) => c.category_id === filterCategoryId) : allCourses
  const filterLevels    = filterCourseId   ? allLevels.filter((l: any) => l.course_id === filterCourseId)     : allLevels
  const filterSections  = filterLevelId    ? allSections.filter((s: any) => s.level_id === filterLevelId)     : allSections

  const handleFilterCategoryChange = (val: string) => { setFilterCategoryId(val); setFilterCourseId(''); setFilterLevelId(''); setFilterSectionId('') }
  const handleFilterCourseChange   = (val: string) => { setFilterCourseId(val);   setFilterLevelId(''); setFilterSectionId('') }
  const handleFilterLevelChange    = (val: string) => { setFilterLevelId(val);    setFilterSectionId('') }

  const clearFilters = () => { setSearch(''); setFilterCategoryId(''); setFilterCourseId(''); setFilterLevelId(''); setFilterSectionId('') }
  const isFiltered   = search || filterCategoryId || filterCourseId || filterLevelId || filterSectionId

  const [playing, setPlaying] = useState<string | null>(null)

  // ── Save ────────────────────────────────────────────────────────
  const save = async () => {
    if (!title.trim()) return toast.error('Title is required')
    try {
      await createQuiz.mutateAsync({
        title: title.trim(),
        description,
        category_id: newCategoryId || undefined,
        course_id:   newCourseId   || undefined,
        level_id:    newLevelId    || undefined,
        section_id:  newSectionId  || undefined,
      })
      toast.success('Quiz created!')
      resetModal()
    } catch (e: any) { toast.error(e.message) }
  }

  const remove = async (id: string) => {
    if (!confirm('Delete this quiz and all its questions?')) return
    await deleteQuiz.mutateAsync(id)
    toast.success('Quiz deleted')
  }

  // ── Filtering ────────────────────────────────────────────────────
  const filtered = quizzes.filter((q) => {
    if (search && !q.title.toLowerCase().includes(search.toLowerCase())) return false
    if (filterCategoryId && q.category_id !== filterCategoryId) return false
    if (filterCourseId   && q.course_id   !== filterCourseId)   return false
    if (filterLevelId    && q.level_id    !== filterLevelId)     return false
    if (filterSectionId  && q.section_id  !== filterSectionId)   return false
    return true
  })

  return (
    <>
      <Header title="Quizzes" />
      <div className="page-content flex flex-col gap-5">

        {/* ── Top bar ── */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex-1 min-w-48">
            <div className="search-input-wrapper">
              <Search size={15} className="search-icon" />
              <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
                placeholder="Search quizzes..." className="form-input search-input py-2 text-sm" />
            </div>
          </div>
          {isFiltered && (
            <button onClick={clearFilters} className="btn btn-ghost btn-sm gap-1.5 text-gray-500 hover:text-gray-300">
              <RotateCcw size={13} /> Clear filters
            </button>
          )}
          <button onClick={() => setModal(true)} className="btn btn-primary gap-2 ml-auto">
            <Plus size={15} /> New Quiz
          </button>
        </div>

        {/* ── Structure filters ── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {/* Category */}
          <div className="relative">
            <GraduationCap size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-600 pointer-events-none" />
            <select value={filterCategoryId} onChange={(e) => handleFilterCategoryChange(e.target.value)}
              className="form-input form-select text-xs py-2 pl-7 w-full">
              <option value="">All Categories</option>
              {categories.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>

          {/* Course */}
          <div className="relative">
            <BookMarked size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-600 pointer-events-none" />
            <select value={filterCourseId} onChange={(e) => handleFilterCourseChange(e.target.value)}
              className="form-input form-select text-xs py-2 pl-7 w-full">
              <option value="">All Courses</option>
              {filterCourses.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>

          {/* Level */}
          <div className="relative">
            <Layers size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-600 pointer-events-none" />
            <select value={filterLevelId} onChange={(e) => handleFilterLevelChange(e.target.value)}
              className="form-input form-select text-xs py-2 pl-7 w-full">
              <option value="">All Levels</option>
              {filterLevels.map((l: any) => <option key={l.id} value={l.id}>{l.name}</option>)}
            </select>
          </div>

          {/* Section */}
          <div className="relative">
            <AlignLeft size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-600 pointer-events-none" />
            <select value={filterSectionId} onChange={(e) => setFilterSectionId(e.target.value)}
              className="form-input form-select text-xs py-2 pl-7 w-full">
              <option value="">All Sections</option>
              {filterSections.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
        </div>

        {/* ── Grid ── */}
        {isLoading ? (
          <div className="flex justify-center py-12"><div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" /></div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon"><Brain size={28} className="text-gray-600" /></div>
            <p className="font-medium text-gray-400">{isFiltered ? 'No quizzes match your filters' : 'No quizzes yet'}</p>
            <p className="text-sm text-gray-600 mt-1">{isFiltered ? 'Try clearing your filters' : 'Create your first quiz to test knowledge'}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filtered.map((quiz) => (
              <div key={quiz.id} className="card group hover:border-indigo-500/40 transition-all">
                <div className="card-body flex flex-col gap-3">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-500/20 to-rose-500/20 border border-pink-500/20 flex items-center justify-center flex-shrink-0">
                      <Brain size={18} className="text-pink-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-200 text-sm leading-tight">{quiz.title}</h3>
                      {quiz.description && (
                        <div className="text-xs text-gray-500 mt-0.5 line-clamp-2" dangerouslySetInnerHTML={{ __html: quiz.description }} />
                      )}
                    </div>
                  </div>

                  {/* Structure breadcrumb */}
                  {(quiz.category || quiz.course || quiz.level || quiz.section) && (
                    <div className="flex flex-wrap gap-1">
                      {quiz.category && <span className="inline-flex items-center gap-1 text-xs bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 rounded-full px-2 py-0.5"><GraduationCap size={10}/>{(quiz.category as any).name}</span>}
                      {quiz.course   && <span className="inline-flex items-center gap-1 text-xs bg-violet-500/10 text-violet-300 border border-violet-500/20 rounded-full px-2 py-0.5"><BookMarked size={10}/>{(quiz.course as any).name}</span>}
                      {quiz.level    && <span className="inline-flex items-center gap-1 text-xs bg-pink-500/10 text-pink-300 border border-pink-500/20 rounded-full px-2 py-0.5"><Layers size={10}/>{(quiz.level as any).name}</span>}
                      {quiz.section  && <span className="inline-flex items-center gap-1 text-xs bg-sky-500/10 text-sky-300 border border-sky-500/20 rounded-full px-2 py-0.5"><AlignLeft size={10}/>{(quiz.section as any).name}</span>}
                    </div>
                  )}

                  <div className="text-xs text-gray-600">
                    Created {new Date(quiz.created_at).toLocaleDateString()}
                  </div>

                  <div className="flex gap-2 pt-1 border-t border-[#1e2334]">
                    <button onClick={() => setPlaying(quiz.id)} className="btn btn-success btn-sm gap-1.5 flex-1 justify-center">
                      <Play size={13} /> Play
                    </button>
                    <Link to={`/quizzes/${quiz.id}/edit`} className="btn btn-secondary btn-sm gap-1.5 flex-1 justify-center">
                      <Pencil size={13} /> Edit
                    </Link>
                    <button onClick={() => remove(quiz.id)} className="btn btn-icon btn-danger btn-sm">
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── Create Modal ── */}
        {modal && (
          <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && resetModal()}>
            <div className="modal-content">
              <div className="modal-header">
                <h2 className="font-semibold text-base">Create Quiz</h2>
                <button onClick={resetModal} className="btn btn-icon btn-ghost btn-sm"><X size={15} /></button>
              </div>
              <div className="modal-body flex flex-col gap-4">
                <div className="form-group">
                  <label className="form-label">Quiz Title *</label>
                  <input autoFocus value={title} onChange={(e) => setTitle(e.target.value)} className="form-input" placeholder="e.g. Basic Grammar Quiz" />
                </div>

                {/* Cascading structure selects */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="form-group">
                    <label className="form-label">Category</label>
                    <select value={newCategoryId} onChange={(e) => handleNewCategoryChange(e.target.value)} className="form-input form-select text-sm py-2">
                      <option value="">— Category —</option>
                      {categories.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Course</label>
                    <select value={newCourseId} onChange={(e) => handleNewCourseChange(e.target.value)} className="form-input form-select text-sm py-2"
                      disabled={createFilteredCourses.length === 0 && !newCourseId}>
                      <option value="">— Course —</option>
                      {createFilteredCourses.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Level</label>
                    <select value={newLevelId} onChange={(e) => handleNewLevelChange(e.target.value)} className="form-input form-select text-sm py-2"
                      disabled={createFilteredLevels.length === 0 && !newLevelId}>
                      <option value="">— Level —</option>
                      {createFilteredLevels.map((l: any) => <option key={l.id} value={l.id}>{l.name}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Section</label>
                    <select value={newSectionId} onChange={(e) => setNewSectionId(e.target.value)} className="form-input form-select text-sm py-2"
                      disabled={createFilteredSections.length === 0 && !newSectionId}>
                      <option value="">— Section —</option>
                      {createFilteredSections.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Description (optional)</label>
                  <RichTextEditor content={description} onChange={setDescription} placeholder="Describe this quiz..." minHeight="100px" />
                </div>
              </div>
              <div className="modal-footer">
                <button onClick={resetModal} className="btn btn-secondary">Cancel</button>
                <button onClick={save} disabled={createQuiz.isPending} className="btn btn-primary gap-1.5">
                  <Check size={14} /> Create &amp; Add Questions
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── Quiz Player Modal ── */}
        {playing && (
          <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setPlaying(null)}>
            <div className="modal-content modal-xl">
              <div className="modal-header">
                <h2 className="font-semibold text-base">{quizzes.find((q) => q.id === playing)?.title}</h2>
                <button onClick={() => setPlaying(null)} className="btn btn-icon btn-ghost btn-sm"><X size={15} /></button>
              </div>
              <QuizPlayer quizId={playing} onClose={() => setPlaying(null)} />
            </div>
          </div>
        )}
      </div>
    </>
  )
}
