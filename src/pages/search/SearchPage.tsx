import React from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { Search, BookOpen, Brain, FolderOpen } from 'lucide-react'
import { useLessons } from '../../hooks/useStructure'
import { useQuizzes } from '../../hooks/useQuizzes'
import { useFiles } from '../../hooks/useFiles'
import { Header } from '../../components/Header'

export const SearchPage: React.FC = () => {
  const [params] = useSearchParams()
  const q = params.get('q')?.toLowerCase() ?? ''

  const { data: lessons = [] } = useLessons()
  const { data: quizzes = [] } = useQuizzes()
  const { data: files = [] } = useFiles()

  const lessonResults = lessons.filter((l) => l.title.toLowerCase().includes(q))
  const quizResults = quizzes.filter((qz) => qz.title.toLowerCase().includes(q))
  const fileResults = files.filter((f) => f.title.toLowerCase().includes(q))

  const total = lessonResults.length + quizResults.length + fileResults.length

  return (
    <>
      <Header />
      <div className="page-content flex flex-col gap-5">
        <div>
          <h2 className="text-lg font-bold text-white">Search Results</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            {total} result{total !== 1 ? 's' : ''} for "<span className="text-indigo-400">{q}</span>"
          </p>
        </div>

        {total === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon"><Search size={28} className="text-gray-600" /></div>
            <p className="font-medium text-gray-400">No results found</p>
            <p className="text-sm text-gray-600 mt-1">Try a different search term</p>
          </div>
        ) : (
          <div className="flex flex-col gap-5">
            {lessonResults.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <BookOpen size={15} className="text-indigo-400" />
                  <h3 className="text-sm font-semibold text-gray-300">Lessons ({lessonResults.length})</h3>
                </div>
                <div className="flex flex-col gap-2">
                  {lessonResults.map((l) => (
                    <Link key={l.id} to={`/lessons/${l.id}`} className="card hover:border-indigo-500/40 transition-all">
                      <div className="card-body flex items-center gap-3">
                        <BookOpen size={16} className="text-indigo-400 flex-shrink-0" />
                        <div>
                          <div className="font-medium text-sm text-gray-200">{l.title}</div>
                          {l.course?.name && <div className="text-xs text-gray-500">{l.course.name}</div>}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {quizResults.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Brain size={15} className="text-pink-400" />
                  <h3 className="text-sm font-semibold text-gray-300">Quizzes ({quizResults.length})</h3>
                </div>
                <div className="flex flex-col gap-2">
                  {quizResults.map((q) => (
                    <Link key={q.id} to={`/quizzes/${q.id}/edit`} className="card hover:border-pink-500/40 transition-all">
                      <div className="card-body flex items-center gap-3">
                        <Brain size={16} className="text-pink-400 flex-shrink-0" />
                        <div className="font-medium text-sm text-gray-200">{q.title}</div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {fileResults.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <FolderOpen size={15} className="text-amber-400" />
                  <h3 className="text-sm font-semibold text-gray-300">Files ({fileResults.length})</h3>
                </div>
                <div className="flex flex-col gap-2">
                  {fileResults.map((f) => (
                    <Link key={f.id} to="/repository" className="card hover:border-amber-500/40 transition-all">
                      <div className="card-body flex items-center gap-3">
                        <FolderOpen size={16} className="text-amber-400 flex-shrink-0" />
                        <div>
                          <div className="font-medium text-sm text-gray-200">{f.title}</div>
                          <div className="text-xs text-gray-500 capitalize">{f.file_type}</div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  )
}
