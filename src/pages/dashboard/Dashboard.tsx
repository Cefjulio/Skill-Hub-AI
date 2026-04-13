import React from 'react'
import { BookOpen, Brain, FolderOpen, Tag, CheckCircle2, Target, Star, RefreshCw, Play, Sparkles } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useAuthStore } from '../../stores'
import { useLessons, useUserProgress, useDailyLessons, useRefreshDailyQueue } from '../../hooks/useStructure'
import { useQuizzes } from '../../hooks/useQuizzes'
import { useTags } from '../../hooks/useTags'
import { useFiles } from '../../hooks/useFiles'
import { Header } from '../../components/Header'

export const Dashboard: React.FC = () => {
  const { user } = useAuthStore()
  const { data: lessons = [] } = useLessons()
  const { data: quizzes = [] } = useQuizzes()
  const { data: tags = [] } = useTags()
  const { data: files = [] } = useFiles()
  const { data: progress = [] } = useUserProgress(user?.id ?? '')
  const { data: dailyGoals = [], isLoading: goalsLoading } = useDailyLessons(user?.id ?? '')
  const refreshQueue = useRefreshDailyQueue()

  // Auto-fill queue if empty for today
  React.useEffect(() => {
    if (user?.id && !goalsLoading && dailyGoals.length === 0) {
      refreshQueue.mutate(user.id)
    }
  }, [user?.id, dailyGoals.length, goalsLoading])

  const incompleteGoals = dailyGoals.filter(g => !progress.some(p => p.lesson_id === g.lesson_id && p.completed))

  const completedLessons = progress.filter((p: any) => p.completed).length
  const progressPct = lessons.length > 0 ? Math.round((completedLessons / lessons.length) * 100) : 0

  const stats = [
    { label: 'Lessons', value: lessons.length, icon: BookOpen, color: 'from-indigo-500 to-violet-500', href: '/lessons' },
    { label: 'Quizzes', value: quizzes.length, icon: Brain, color: 'from-pink-500 to-rose-500', href: '/quizzes' },
    { label: 'Files', value: files.length, icon: FolderOpen, color: 'from-amber-500 to-orange-500', href: '/repository' },
    { label: 'Tags', value: tags.length, icon: Tag, color: 'from-emerald-500 to-teal-500', href: '/tags' },
  ]

  const recentLessons = lessons.slice(0, 4)
  const completedLessonIds = new Set(progress.filter((p: any) => p.completed).map((p: any) => p.lesson_id))

  return (
    <>
      <Header title="Dashboard" />
      <div className="page-content flex flex-col gap-6">
        {/* Welcome */}
        <div className="relative overflow-hidden card p-6" style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.2), rgba(139,92,246,0.1), #141720)' }}>
          <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-500/5 rounded-full -translate-y-1/2 translate-x-1/2" />
          <h2 className="text-xl font-bold text-white mb-1">
            Welcome back, {user?.email?.split('@')[0]} 👋
          </h2>
          <p className="text-gray-400 text-sm mb-4">Continue your learning journey</p>
          <div className="flex items-center gap-3">
            <div className="flex-1 max-w-xs">
              <div className="flex justify-between text-xs text-gray-400 mb-1.5">
                <span>Overall Progress</span>
                <span>{progressPct}%</span>
              </div>
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: `${progressPct}%` }} />
              </div>
            </div>
            <div className="text-sm text-gray-400">{completedLessons}/{lessons.length} lessons</div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {stats.map((s) => (
            <Link key={s.label} to={s.href} className="stat-card hover:no-underline group">
              <div className={`stat-icon bg-gradient-to-br ${s.color}`}>
                <s.icon size={20} className="text-white" />
              </div>
              <div>
                <div className="stat-value">{s.value}</div>
                <div className="stat-label">{s.label}</div>
              </div>
            </Link>
          ))}
        </div>

        {/* Daily Priorities */}
        {dailyGoals.length > 0 && (
          <div className="card border-amber-500/20 bg-gradient-to-br from-[#1a1f2e] to-[#0f1117]">
            <div className="card-header border-b border-white/[0.05]">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-amber-500/10 rounded-lg">
                  <Star size={16} className="text-amber-400 fill-amber-400" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-100">Daily Priority Focus</h3>
                  <p className="text-[10px] text-gray-500 uppercase tracking-wider">Your personalized next steps</p>
                </div>
              </div>
              <button 
                onClick={() => user?.id && refreshQueue.mutate(user.id)}
                disabled={refreshQueue.isPending}
                className="btn btn-ghost btn-sm gap-2 text-gray-400 hover:text-amber-400"
                title="Refresh daily queue"
              >
                <RefreshCw size={14} className={refreshQueue.isPending ? 'animate-spin' : ''} />
                <span className="text-xs">Refresh Goal</span>
              </button>
            </div>
            <div className="p-4">
              {incompleteGoals.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-6 text-center">
                  <div className="w-12 h-12 bg-emerald-500/10 rounded-full flex items-center justify-center mb-3">
                    <Sparkles size={24} className="text-emerald-400" />
                  </div>
                  <h4 className="text-gray-200 font-semibold italic text-sm">Priority Goals Completed!</h4>
                  <p className="text-xs text-gray-500 mt-1 max-w-[250px]">You've cleared your focus list for today. Use the refresh button to see what's next!</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {incompleteGoals.map((goal) => (
                    <div key={goal.id} className="priority-focus-card group">
                      <div className="flex flex-col gap-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <div className="text-[10px] font-bold text-amber-500/80 uppercase truncate">
                              {goal.course?.name}
                            </div>
                            <h4 className="text-sm font-semibold text-white truncate mt-0.5 group-hover:text-amber-400 transition-colors">
                              {goal.lesson?.title}
                            </h4>
                          </div>
                          <Link to={`/lessons/${goal.lesson_id}`} className="p-2 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 rounded-lg transition-all">
                            <Play size={14} fill="currentColor" />
                          </Link>
                        </div>
                        <div className="flex items-center gap-2 mt-auto pt-2 border-t border-white/[0.03]">
                           <span className="text-[10px] text-gray-500">
                             Next from: <span className="text-gray-400">{goal.lesson?.level?.name} / {goal.lesson?.section?.name}</span>
                           </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Quick Links */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Recent Lessons */}
          <div className="card">
            <div className="card-header">
              <div className="flex items-center gap-2">
                <BookOpen size={16} className="text-indigo-400" />
                <h3 className="font-semibold text-sm">Recent Lessons</h3>
              </div>
              <Link to="/lessons" className="text-xs text-indigo-400 hover:text-indigo-300">View all →</Link>
            </div>
            <div className="divide-y divide-[#1e2334]">
              {recentLessons.length === 0 ? (
                <div className="p-4 text-center text-gray-500 text-sm">No lessons yet</div>
              ) : recentLessons.map((lesson) => (
                <Link key={lesson.id} to={`/lessons/${lesson.id}`} className="flex items-center gap-3 px-4 py-3 hover:bg-white/[0.02] transition-colors">
                  <CheckCircle2
                    size={16}
                    className={completedLessonIds.has(lesson.id) ? 'text-emerald-500' : 'text-gray-700'}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-gray-200 truncate">{lesson.title}</div>
                    <div className="text-xs text-gray-500">{lesson.course?.name ?? 'No course'}</div>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="card">
            <div className="card-header">
              <div className="flex items-center gap-2">
                <Target size={16} className="text-violet-400" />
                <h3 className="font-semibold text-sm">Quick Actions</h3>
              </div>
            </div>
            <div className="card-body flex flex-col gap-2.5">
              {[
                { label: 'New Lesson', href: '/lessons/new', emoji: '📚' },
                { label: 'Create Quiz', href: '/quizzes/new', emoji: '🧠' },
                { label: 'Upload File', href: '/repository/new', emoji: '📁' },
                { label: 'View Hierarchy', href: '/hierarchy', emoji: '🌳' },
              ].map((a) => (
                <Link
                  key={a.href}
                  to={a.href}
                  className="flex items-center gap-3 px-3 py-2.5 bg-[#0f1117] hover:bg-[#1a1f2e] rounded-lg transition-colors border border-[#1e2334] hover:border-indigo-500/30"
                >
                  <span className="text-lg">{a.emoji}</span>
                  <span className="text-sm text-gray-300 font-medium">{a.label}</span>
                  <span className="ml-auto text-gray-600">→</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
