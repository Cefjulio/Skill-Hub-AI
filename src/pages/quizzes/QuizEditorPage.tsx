import React, { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import {
  ArrowLeft, Plus, Trash2, GripVertical, Check, X, Brain,
  ChevronDown, ChevronUp, Save, Loader2, Pencil
} from 'lucide-react'
import {
  useQuiz, useUpdateQuiz, useCreateQuestion, useUpdateQuestion,
  useDeleteQuestion, useCreateAnswer, useDeleteAnswer, useUpdateAnswer
} from '../../hooks/useQuizzes'
import { RichTextEditor } from '../../components/RichTextEditor'
import { Header } from '../../components/Header'
import type { Question } from '../../types'
import toast from 'react-hot-toast'

const QUESTION_TYPES = [
  { value: 'single', label: 'Single Choice' },
  { value: 'multiple', label: 'Multiple Answer' },
  { value: 'truefalse', label: 'True / False' },
  { value: 'flashcard', label: 'Flash Card' },
]

const QuestionEditor: React.FC<{
  question: Question
  quizId: string
  index: number
}> = ({ question, quizId, index }) => {
  const createAnswer = useCreateAnswer()
  const deleteAnswer = useDeleteAnswer()
  const updateAnswer = useUpdateAnswer()
  const updateQuestion = useUpdateQuestion()
  const deleteQuestion = useDeleteQuestion()
  const [expanded, setExpanded] = useState(true)
  const [content, setContent] = useState(question.content)
  const [score, setScore] = useState(question.score)
  const [type, setType] = useState(question.type)
  const [newAnswer, setNewAnswer] = useState('<p></p>')
  const [addingAnswer, setAddingAnswer] = useState(false)
  const [saving, setSaving] = useState(false)
  
  const [editingAnswerId, setEditingAnswerId] = useState<string | null>(null)
  const [editingContent, setEditingContent] = useState('')
  const [savingEdit, setSavingEdit] = useState(false)

  // Sync state with props if they change externally (e.g. after a refetch)
  useEffect(() => {
    setContent(question.content)
    setScore(question.score)
    setType(question.type)
  }, [question.content, question.score, question.type])

  const saveQuestion = async () => {
    setSaving(true)
    try {
      await updateQuestion.mutateAsync({ id: question.id, quiz_id: quizId, content, score, type })
      toast.success('Question saved')
    } catch (e: any) { toast.error(e.message) }
    finally { setSaving(false) }
  }

  const toggleType = async (newType: Question['type']) => {
    if (newType === type) return
    setType(newType)
    try {
      await updateQuestion.mutateAsync({ id: question.id, quiz_id: quizId, type: newType })
      toast.success(`Question type set to ${newType}`)
    } catch (e: any) { toast.error(e.message) }
  }

  const addAnswer = async () => {
    const stripped = newAnswer.replace(/<[^>]*>/g, '').trim()
    if (!stripped && !newAnswer.includes('<img') && !newAnswer.includes('<iframe') && !newAnswer.includes('<audio')) return
    
    setAddingAnswer(true)
    try {
      await createAnswer.mutateAsync({ 
        answer: { 
          question_id: question.id, 
          content: newAnswer, 
          is_correct: false, 
          position: (question.answers?.length ?? 0) + 1 
        }, 
        quiz_id: quizId 
      })
      setNewAnswer('<p></p>')
      toast.success('Answer added')
    } catch (e: any) { 
      toast.error(e.message) 
    } finally {
      setAddingAnswer(false)
    }
  }



  const removeSelf = async () => {
    if (!confirm('Delete this question?')) return
    await deleteQuestion.mutateAsync({ id: question.id, quiz_id: quizId })
    toast.success('Question deleted')
  }

  const toggleAnswerCorrectness = async (a: any) => {
    try {
      const isChecking = !a.is_correct
      
      if (isChecking && type === 'single') {
        // Uncheck all other answers first if it's single choice
        const otherChecked = answers.filter(other => other.id !== a.id && other.is_correct)
        if (otherChecked.length > 0) {
          const { supabase } = await import('../../lib/supabase')
          await Promise.all(otherChecked.map(other => 
            supabase.from('answers').update({ is_correct: false }).eq('id', other.id)
          ))
        }
      }

      const { supabase } = await import('../../lib/supabase')
      await supabase.from('answers').update({ is_correct: isChecking }).eq('id', a.id)
      
      // Trigger refetch by "updating" the question (even if no data change)
      await updateQuestion.mutateAsync({ id: question.id, quiz_id: quizId })
      toast.success(isChecking ? 'Correct answer set' : 'Answer unmarked')
    } catch (e: any) {
      toast.error(e.message)
    }
  }

  const saveAnswerEdit = async () => {
    if (!editingAnswerId) return
    const stripped = editingContent.replace(/<[^>]*>/g, '').trim()
    if (!stripped && !editingContent.includes('<img') && !editingContent.includes('<iframe') && !editingContent.includes('<audio')) {
      toast.error('Answer content cannot be empty')
      return
    }

    setSavingEdit(true)
    try {
      await updateAnswer.mutateAsync({ 
        id: editingAnswerId, 
        quiz_id: quizId,
        content: editingContent 
      })
      toast.success('Answer updated')
      setEditingAnswerId(null)
    } catch (e: any) {
      toast.error(e.message)
    } finally {
      setSavingEdit(false)
    }
  }

  const answers = question.answers ?? []

  return (
    <div className="card animate-fade-in">
      <div className="card-header">
        <div className="flex items-center gap-2.5">
          <GripVertical size={15} className="text-gray-600 cursor-grab" />
          <span className="w-6 h-6 rounded-full bg-indigo-500/20 flex items-center justify-center text-xs font-bold text-indigo-400">{index + 1}</span>
          <div className="flex gap-1.5">
            {QUESTION_TYPES.map((qt) => (
              <button key={qt.value} onClick={() => toggleType(qt.value as Question['type'])}
                className={`btn btn-sm ${type === qt.value ? 'btn-primary' : 'btn-secondary'}`}>
                {qt.label}
              </button>
            ))}
          </div>
          <div className="form-group flex-row items-center gap-1.5 ml-auto">
            <label className="form-label mb-0 whitespace-nowrap">Score</label>
            <input type="number" min={1} max={10} value={score} onChange={(e) => setScore(Number(e.target.value))}
              className="form-input w-14 text-center py-1 text-sm" />
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <button onClick={saveQuestion} disabled={saving} className="btn btn-success btn-sm gap-1">
            {saving ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />} Save
          </button>
          <button onClick={removeSelf} className="btn btn-icon btn-danger btn-sm"><Trash2 size={13} /></button>
          <button onClick={() => setExpanded((e) => !e)} className="btn btn-icon btn-ghost btn-sm">
            {expanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
          </button>
        </div>
      </div>

      {expanded && (
        <div className="card-body flex flex-col gap-4">
          <div className="form-group">
            <label className="form-label">{type === 'flashcard' ? 'Front (Question)' : 'Question Content'}</label>
            <RichTextEditor content={content} onChange={setContent} placeholder={type === 'flashcard' ? 'Enter the front of the flashcard...' : 'Enter your question...'} minHeight="100px" />
          </div>

            {/* Answers */}
            <div className="form-group">
              <label className="form-label">
                {type === 'flashcard' ? 'Back (Answer)' : `Answers ${type === 'multiple' ? '(select all correct)' : '(select one correct)'}`}
              </label>

              <div className="flex flex-col gap-2">
                {answers.map((a) => (
                  <div key={a.id} className="flex items-start gap-2">
                    {type !== 'flashcard' && (
                      <button
                        onClick={() => toggleAnswerCorrectness(a)}
                        className={`w-5 h-5 rounded border-2 mt-2 flex items-center justify-center flex-shrink-0 transition-all ${a.is_correct ? 'bg-emerald-500 border-emerald-500' : 'border-gray-600'}`}>
                        {a.is_correct && <Check size={11} className="text-white" />}
                      </button>
                    )}
                    
                    {editingAnswerId === a.id ? (
                      <div className="flex-1 flex flex-col gap-2">
                        <RichTextEditor content={editingContent} onChange={setEditingContent} minHeight="auto" />
                        <div className="flex justify-end gap-2">
                          <button onClick={() => setEditingAnswerId(null)} className="btn btn-ghost btn-sm">Cancel</button>
                          <button onClick={saveAnswerEdit} disabled={savingEdit} className="btn btn-primary btn-sm gap-1">
                            {savingEdit ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />} Save
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="flex-1 bg-[#0f1117] rounded-lg border border-[#1e2334] overflow-hidden">
                          <RichTextEditor content={a.content} readOnly minHeight="auto" />
                        </div>
                        <div className="flex items-center gap-1">
                          <button 
                            onClick={() => {
                              setEditingAnswerId(a.id)
                              setEditingContent(a.content)
                            }} 
                            className="btn btn-icon btn-ghost btn-sm"
                          >
                            <Pencil size={12} />
                          </button>
                          <button onClick={() => deleteAnswer.mutateAsync({ id: a.id, quiz_id: quizId })} className="btn btn-icon btn-danger btn-sm">
                            <X size={12} />
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                ))}

                {/* Quick Add for True/False */}
                {type === 'truefalse' && answers.length < 2 && (
                  <div className="flex gap-2 mt-2">
                    {['True', 'False'].map((v) => (
                      !answers.find((a) => a.content === v) && (
                        <button 
                          key={v} 
                          onClick={() => createAnswer.mutateAsync({ 
                            answer: { question_id: question.id, content: v, is_correct: false, position: answers.length + 1 }, 
                            quiz_id: quizId 
                          })}
                          className="btn btn-secondary btn-sm"
                        >
                          Add "{v}"
                        </button>
                      )
                    ))}
                  </div>
                )}

                {/* Standard Add Answer for Single/Multiple/Flashcard */}
                {type !== 'truefalse' && (type !== 'flashcard' || answers.length === 0) && (
                  <div className="flex flex-col gap-2 mt-2">
                    <RichTextEditor 
                      content={newAnswer} 
                      onChange={setNewAnswer} 
                      placeholder={type === 'flashcard' ? "Type the back of the flashcard and use the repository button to add media..." : "Type an answer option and use the repository button to add media..."}
                      minHeight="100px" 
                    />
                    <button 
                      onClick={addAnswer} 
                      disabled={addingAnswer} 
                      className="btn btn-secondary gap-1 self-end"
                    >
                      {addingAnswer ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />} {type === 'flashcard' ? 'Save Back Content' : 'Add Answer'}
                    </button>
                  </div>
                )}
              </div>
            </div>
        </div>
      )}
    </div>
  )
}

export const QuizEditorView: React.FC<{ quizId: string; onClose?: () => void }> = ({ quizId, onClose }) => {
  const { data: quiz, isLoading } = useQuiz(quizId)
  const updateQuiz = useUpdateQuiz()
  const createQuestion = useCreateQuestion()

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [titleEditing, setTitleEditing] = useState(false)

  useEffect(() => {
    if (quiz) { setTitle(quiz.title); setDescription(quiz.description ?? '') }
  }, [quiz])

  const saveTitle = async () => {
    if (!title.trim()) return
    await updateQuiz.mutateAsync({ id: quizId, title, description })
    setTitleEditing(false)
    toast.success('Quiz updated')
  }

  const addQuestion = async () => {
    await createQuestion.mutateAsync({
      quiz_id: quizId, type: 'single', content: '<p>New question</p>', score: 1,
      position: (quiz?.questions?.length ?? 0) + 1
    })
    toast.success('Question added')
  }

  if (isLoading) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="flex flex-col gap-5 w-full max-w-4xl mx-auto pb-4">
      {/* Quiz Title */}
      <div className="card">
        <div className="card-body flex flex-col gap-3">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-500/20 to-rose-500/20 border border-pink-500/20 flex items-center justify-center mt-1">
              <Brain size={18} className="text-pink-400" />
            </div>
            {titleEditing ? (
              <div className="flex-1 flex gap-2">
                <input value={title} onChange={(e) => setTitle(e.target.value)} autoFocus
                  onKeyDown={(e) => e.key === 'Enter' && saveTitle()}
                  className="form-input flex-1 text-base font-semibold" />
                <button onClick={saveTitle} className="btn btn-primary btn-sm gap-1"><Save size={13} /> Save</button>
                <button onClick={() => setTitleEditing(false)} className="btn btn-secondary btn-sm"><X size={13} /></button>
              </div>
            ) : (
              <div className="flex-1 flex items-center gap-2 group mt-2">
                <h1 className="text-lg font-bold text-white leading-none">{quiz?.title}</h1>
                <button onClick={() => setTitleEditing(true)} className="btn btn-icon btn-ghost btn-sm opacity-0 group-hover:opacity-100 hover:opacity-100">
                  <Pencil size={13} />
                </button>
              </div>
            )}
            {onClose && (
               <button onClick={onClose} className="btn btn-primary gap-1 ml-auto shrink-0">
                  <Check size={14} /> Done Editing
               </button>
            )}
          </div>
          <div className="text-xs text-gray-500">{quiz?.questions?.length ?? 0} questions · Total score: {quiz?.questions?.reduce((s, q) => s + q.score, 0) ?? 0} pts</div>
        </div>
      </div>

      {/* Questions */}
      <div className="flex flex-col gap-4">
        {quiz?.questions?.map((q, i) => (
          <QuestionEditor key={q.id} question={q} quizId={quizId} index={i} />
        ))}

        <button onClick={addQuestion} className="btn btn-secondary gap-2 justify-center py-4 border-dashed border-[#2d3450] hover:border-indigo-500/50 w-full mb-8">
          <Plus size={16} /> Add Question
        </button>
      </div>
    </div>
  )
}

export const QuizEditorPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  return (
    <>
      <Header />
      <div className="page-content flex flex-col gap-5">
        <Link to="/quizzes" className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-200 w-fit">
          <ArrowLeft size={15} /> Back to Quizzes
        </Link>
        <QuizEditorView quizId={id!} />
      </div>
    </>
  )
}
