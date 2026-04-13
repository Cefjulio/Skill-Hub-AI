import React, { useEffect, useState } from 'react'
import confetti from 'canvas-confetti'
import { RotateCcw, CheckCircle, XCircle, ChevronRight, Clock } from 'lucide-react'
import { useQuiz, useRecordAttempt, useQuizAttempts } from '../hooks/useQuizzes'
import { useAuthStore } from '../stores'
import type { Answer } from '../types'

interface QuizPlayerProps {
  quizId: string
  onClose?: () => void
}

type Phase = 'thinking' | 'answering' | 'feedback'

const successAudio = () => {
  try {
    const ctx = new AudioContext()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.frequency.setValueAtTime(523.25, ctx.currentTime)
    osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.1)
    osc.frequency.setValueAtTime(783.99, ctx.currentTime + 0.2)
    gain.gain.setValueAtTime(0.3, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5)
    osc.start(ctx.currentTime)
    osc.stop(ctx.currentTime + 0.5)
  } catch {}
}

const errorAudio = () => {
  try {
    const ctx = new AudioContext()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.type = 'sawtooth'
    osc.frequency.setValueAtTime(200, ctx.currentTime)
    osc.frequency.setValueAtTime(150, ctx.currentTime + 0.15)
    gain.gain.setValueAtTime(0.2, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3)
    osc.start(ctx.currentTime)
    osc.stop(ctx.currentTime + 0.3)
  } catch {}
}

export const QuizPlayer: React.FC<QuizPlayerProps> = ({ quizId, onClose }) => {
  const { data: quiz, isLoading } = useQuiz(quizId)
  const recordAttempt = useRecordAttempt()
  const { data: attempts = [] } = useQuizAttempts(quizId)
  const { user } = useAuthStore()

  const [currentQ, setCurrentQ] = useState(0)
  const [phase, setPhase] = useState<Phase>('thinking')
  const [selected, setSelected] = useState<string[]>([])
  const [results, setResults] = useState<Record<string, boolean>>({})
  const [finished, setFinished] = useState(false)
  const [score, setScore] = useState(0)

  useEffect(() => {
    setCurrentQ(0)
    setPhase('thinking')
    setSelected([])
    setResults({})
    setFinished(false)
    setScore(0)
  }, [quizId])

  if (isLoading) return <div className="flex items-center justify-center p-12"><div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" /></div>
  if (!quiz) return null

  const questions = quiz.questions ?? []
  if (questions.length === 0) return <div className="p-6 text-gray-400 text-center">No questions yet.</div>

  const question = questions[currentQ]
  const isMultiple = question.type === 'multiple'

  const toggleAnswer = (id: string) => {
    if (phase !== 'answering') return
    if (isMultiple) {
      setSelected((s) => s.includes(id) ? s.filter((x) => x !== id) : [...s, id])
    } else {
      setSelected([id])
    }
  }

  const checkAnswer = () => {
    const correct = question.answers?.filter((a) => a.is_correct).map((a) => a.id) ?? []
    const isCorrect = isMultiple
      ? correct.length === selected.length && correct.every((id) => selected.includes(id))
      : selected.length === 1 && correct.includes(selected[0])

    setResults((r) => ({ ...r, [question.id]: isCorrect }))
    setPhase('feedback')

    if (isCorrect) {
      successAudio()
      setScore((s) => s + question.score)
    } else {
      errorAudio()
    }
  }

  const checkFlashcard = async (passed: boolean) => {
    const newResults = { ...results, [question.id]: passed }
    const newScore = passed ? score + question.score : score
    
    setResults(newResults)
    setScore(newScore)
    setPhase('feedback')

    if (passed) successAudio()
    else errorAudio()

    // Optionally auto-advance after a short delay or let them click next
    // I'll stick to requiring them to click Next to be consistent with the rest of the flow
    // or I can call next(newResults, newScore) if I update next(). Let's just show feedback.
  }

  const next = async () => {
    if (currentQ < questions.length - 1) {
      setCurrentQ((q) => q + 1)
      setPhase('thinking')
      setSelected([])
    } else {
      // Done
      const allCorrect = Object.values(results).every(Boolean)
      const maxScore = questions.reduce((sum, q) => sum + q.score, 0)
      const finalScore = score

      setFinished(true)
      if (allCorrect) {
        confetti({ particleCount: 200, spread: 100, origin: { y: 0.5 } })
      }
      if (user) {
        try {
          await recordAttempt.mutateAsync({ quiz_id: quizId, user_id: user.id, score: finalScore, max_score: maxScore, passed: allCorrect })
        } catch {}
      }
    }
  }

  if (finished) {
    const passed = Object.values(results).every(Boolean)
    const maxScore = questions.reduce((sum, q) => sum + q.score, 0)

    return (
      <div className="p-6 flex flex-col gap-6">
        <div className={passed ? 'quiz-result-pass' : 'quiz-result-fail'}>
          <div className="text-4xl mb-3">{passed ? '🎉' : '😔'}</div>
          <h2 className={`text-2xl font-bold mb-1 ${passed ? 'text-emerald-400' : 'text-red-400'}`}>
            {passed ? 'Congratulations! You Passed!' : 'Not quite there yet'}
          </h2>
          <p className="text-gray-400 text-sm mb-4">
            Score: {score} / {maxScore}
          </p>
          <div className="flex justify-center gap-3">
            <button onClick={() => { setCurrentQ(0); setPhase('thinking'); setSelected([]); setResults({}); setFinished(false); setScore(0) }} className="btn btn-secondary gap-2">
              <RotateCcw size={15} /> Try Again
            </button>
            {onClose && <button onClick={onClose} className="btn btn-primary">Done</button>}
          </div>
        </div>

        {attempts.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-gray-400 mb-3 uppercase tracking-wider">Recent Attempts</h3>
            <div className="flex flex-col gap-2">
              {attempts.map((a) => (
                <div key={a.id} className="flex items-center justify-between px-3 py-2 bg-[#0f1117] rounded-lg border border-[#1e2334]">
                  <div className="flex items-center gap-2 text-sm text-gray-400">
                    <Clock size={13} />
                    {new Date(a.created_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-gray-300">{a.score}/{a.max_score}</span>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${a.passed ? 'bg-emerald-500/15 text-emerald-400' : 'bg-red-500/15 text-red-400'}`}>
                      {a.passed ? 'PASS' : 'FAIL'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="p-6 flex flex-col gap-5">
      {/* Progress */}
      <div className="flex items-center justify-between text-sm text-gray-500">
        <span>Question {currentQ + 1} of {questions.length}</span>
        <span>{question.type === 'multiple' ? 'Select all correct' : question.type === 'truefalse' ? 'True or False' : 'Single answer'}</span>
      </div>
      <div className="progress-bar">
        <div className="progress-fill" style={{ width: `${((currentQ) / questions.length) * 100}%` }} />
      </div>

      {/* Question */}
      <div className="quiz-question-card">
        <div className="p-8 border-b border-[#1e2334]">
          <div className="prose prose-invert text-sm" dangerouslySetInnerHTML={{ __html: question.content }} />
        </div>

        {phase === 'thinking' && (
          <div className="p-5 flex justify-center">
            {question.type === 'flashcard' ? (
               <button onClick={() => setPhase('answering')} className="btn btn-primary btn-lg gap-2 animate-pulse-glow">
                 <RotateCcw size={18} /> Reveal Answer
               </button>
            ) : (
              <button onClick={() => setPhase('answering')} className="btn btn-primary btn-lg gap-2 animate-pulse-glow">
                <ChevronRight size={18} /> Think of the answer
              </button>
            )}
          </div>
        )}

        {(phase === 'answering' || phase === 'feedback') && (
          <div className="p-8 flex flex-col gap-3">
            {question.type === 'flashcard' ? (
              // FLASHCARD RENDERING
              <>
                <div className="p-6 bg-[#0f1117] border border-[#1e2334] rounded-xl">
                  <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Back (Answer)</h4>
                  <div className="prose prose-invert text-sm" dangerouslySetInnerHTML={{ __html: question.answers?.[0]?.content || '' }} />
                </div>
                
                <div className="mt-4 flex flex-col items-center gap-3">
                  {phase === 'answering' ? (
                    <>
                      <p className="text-sm text-gray-400">Did you get it right?</p>
                      <div className="flex gap-3 w-full sm:w-auto">
                        <button onClick={() => checkFlashcard(false)} className="btn btn-danger flex-1 gap-2">
                          <XCircle size={16} /> Failed
                        </button>
                        <button onClick={() => checkFlashcard(true)} className="btn btn-success flex-1 gap-2">
                          <CheckCircle size={16} /> Passed
                        </button>
                      </div>
                    </>
                  ) : (
                    <div className={`w-full py-3 rounded-lg text-center font-medium text-sm border ${results[question.id] ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' : 'bg-red-500/10 text-red-400 border-red-500/30'}`}>
                      {results[question.id] ? 'Marked as Passed' : 'Marked as Failed'}
                    </div>
                  )}
                </div>
              </>
            ) : (
              // STANDARD QUESTION RENDERING
              question.answers?.map((answer: Answer) => {
                const isSelected = selected.includes(answer.id)
                let cls = 'answer-option'
                
                if (phase === 'feedback') {
                  if (answer.is_correct && isSelected) cls += ' correct'
                  else if (answer.is_correct && !isSelected) cls += ' missed-correct'
                  else if (!answer.is_correct && isSelected) cls += ' incorrect'
                } else if (isSelected) {
                  cls += ' selected'
                }

                return (
                  <button key={answer.id} onClick={() => toggleAnswer(answer.id)} className={cls}>
                    <span className={`w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-all ${
                      phase === 'feedback' && answer.is_correct && isSelected ? 'border-emerald-500 bg-emerald-500' :
                      phase === 'feedback' && answer.is_correct && !isSelected ? 'border-emerald-500/50' :
                      phase === 'feedback' && isSelected && !answer.is_correct ? 'border-red-500 bg-red-500' :
                      isSelected ? 'border-indigo-500 bg-indigo-500' :
                      'border-gray-600'
                    }`}>
                      {phase === 'feedback' && answer.is_correct && isSelected && <CheckCircle size={12} className="text-white" />}
                      {phase === 'feedback' && !answer.is_correct && isSelected && <XCircle size={12} className="text-white" />}
                    </span>
                    <span className="text-sm" dangerouslySetInnerHTML={{ __html: answer.content }} />
                  </button>
                )
              })
            )}

            <div className="mt-2 flex justify-end gap-2">
              {phase === 'answering' && question.type !== 'flashcard' && (
                <button
                  onClick={checkAnswer}
                  disabled={selected.length === 0}
                  className="btn btn-primary"
                >
                  Check Answer
                </button>
              )}
              {phase === 'feedback' && (
                <button onClick={next} className="btn btn-primary gap-2">
                  {currentQ < questions.length - 1 ? 'Next Question' : 'Finish Quiz'}
                  <ChevronRight size={16} />
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
