import React, { useState } from 'react'
import { Plus, Brain, Pencil, Trash2, Play, X, Check, Search } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useQuizzes, useCreateQuiz, useDeleteQuiz } from '../../hooks/useQuizzes'
import { Header } from '../../components/Header'
import { RichTextEditor } from '../../components/RichTextEditor'
import toast from 'react-hot-toast'
import { QuizPlayer } from '../../components/QuizPlayer'

export const QuizzesPage: React.FC = () => {
  const { data: quizzes = [], isLoading } = useQuizzes()
  const createQuiz = useCreateQuiz()
  const deleteQuiz = useDeleteQuiz()

  const [modal, setModal] = useState(false)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [search, setSearch] = useState('')
  const [playing, setPlaying] = useState<string | null>(null)

  const save = async () => {
    if (!title.trim()) return toast.error('Title is required')
    try {
      await createQuiz.mutateAsync({ title: title.trim(), description })
      toast.success('Quiz created!')
      setModal(false); setTitle(''); setDescription('')
    } catch (e: any) { toast.error(e.message) }
  }

  const remove = async (id: string) => {
    if (!confirm('Delete this quiz and all its questions?')) return
    await deleteQuiz.mutateAsync(id)
    toast.success('Quiz deleted')
  }

  const filtered = quizzes.filter((q) => q.title.toLowerCase().includes(search.toLowerCase()))

  return (
    <>
      <Header title="Quizzes" />
      <div className="page-content flex flex-col gap-5">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex-1 min-w-48">
            <div className="search-input-wrapper">
              <Search size={15} className="search-icon" />
              <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
                placeholder="Search quizzes..." className="form-input search-input py-2 text-sm" />
            </div>
          </div>
          <button onClick={() => setModal(true)} className="btn btn-primary gap-2 ml-auto">
            <Plus size={15} /> New Quiz
          </button>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12"><div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" /></div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon"><Brain size={28} className="text-gray-600" /></div>
            <p className="font-medium text-gray-400">No quizzes yet</p>
            <p className="text-sm text-gray-600 mt-1">Create your first quiz to test knowledge</p>
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

        {/* Create Modal */}
        {modal && (
          <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setModal(false)}>
            <div className="modal-content">
              <div className="modal-header">
                <h2 className="font-semibold text-base">Create Quiz</h2>
                <button onClick={() => setModal(false)} className="btn btn-icon btn-ghost btn-sm"><X size={15} /></button>
              </div>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Quiz Title *</label>
                  <input autoFocus value={title} onChange={(e) => setTitle(e.target.value)} className="form-input" placeholder="e.g. Basic Grammar Quiz" />
                </div>
                <div className="form-group">
                  <label className="form-label">Description (optional)</label>
                  <RichTextEditor content={description} onChange={setDescription} placeholder="Describe this quiz..." minHeight="100px" />
                </div>
              </div>
              <div className="modal-footer">
                <button onClick={() => setModal(false)} className="btn btn-secondary">Cancel</button>
                <button onClick={save} disabled={createQuiz.isPending} className="btn btn-primary gap-1.5">
                  <Check size={14} /> Create & Add Questions
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Quiz Player Modal */}
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
