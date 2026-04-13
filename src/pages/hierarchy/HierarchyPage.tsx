import React, { useState } from 'react'
import { ChevronRight, ChevronDown, GitBranch, BookOpen, Brain, CheckCircle2, TrendingUp } from 'lucide-react'
import { useCategories, useCourses, useLevels, useSections, useLessons, useUserProgress } from '../../hooks/useStructure'
import { Header } from '../../components/Header'
import { Link } from 'react-router-dom'
import { useAuthStore } from '../../stores'

const ProgressBadge: React.FC<{ done: number; total: number }> = ({ done, total }) => {
  const pct = total > 0 ? Math.round((done / total) * 100) : 0
  return (
    <div className="flex items-center gap-2">
      <div className="progress-bar w-20">
        <div className="progress-fill" style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs text-gray-400">{done}/{total} ({pct}%)</span>
    </div>
  )
}

export const HierarchyPage: React.FC = () => {
  const { user } = useAuthStore()
  const { data: categories = [] } = useCategories()
  const { data: courses = [] } = useCourses()
  const { data: levels = [] } = useLevels()
  const { data: sections = [] } = useSections()
  const { data: lessons = [] } = useLessons()
  const { data: progress = [] } = useUserProgress(user?.id ?? '')

  const completedIds = new Set(progress.filter((p: any) => p.completed).map((p: any) => p.lesson_id))

  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set())
  const [expandedCourses, setExpandedCourses] = useState<Set<string>>(new Set())
  const [expandedLevels, setExpandedLevels] = useState<Set<string>>(new Set())
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set())


  const toggle = (setFn: React.Dispatch<React.SetStateAction<Set<string>>>, id: string) => {
    setFn((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const expandAll = () => {
    setExpandedCategories(new Set(categories.map((c) => c.id)))
    setExpandedCourses(new Set(courses.map((c) => c.id)))
    setExpandedLevels(new Set(levels.map((l) => l.id)))
    setExpandedSections(new Set(sections.map((s) => s.id)))
  }

  const getLessonsForLevel = (levelId: string) => lessons.filter((l) => l.level_id === levelId)
  const getLessonsForSection = (sectionId: string) => lessons.filter((l) => l.section_id === sectionId)

  const totalCompleted = completedIds.size
  const totalLessons = lessons.length

  return (
    <>
      <Header title="Hierarchy" />
      <div className="page-content flex flex-col gap-5">
        {/* Stats row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'Categories', val: categories.length, color: 'text-indigo-400' },
            { label: 'Courses', val: courses.length, color: 'text-violet-400' },
            { label: 'Levels', val: levels.length, color: 'text-pink-400' },
            { label: 'Lessons', val: totalLessons, color: 'text-amber-400' },
          ].map((s) => (
            <div key={s.label} className="stat-card">
              <div>
                <div className={`stat-value ${s.color}`}>{s.val}</div>
                <div className="stat-label">{s.label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Overall Progress */}
        {totalLessons > 0 && (
          <div className="card">
            <div className="card-body flex items-center gap-4">
              <TrendingUp size={18} className="text-indigo-400 flex-shrink-0" />
              <div className="flex-1">
                <div className="text-sm font-medium text-gray-300 mb-1.5">Overall Progress</div>
                <ProgressBadge done={totalCompleted} total={totalLessons} />
              </div>
            </div>
          </div>
        )}

        {/* Controls */}
        <div className="flex items-center gap-3 flex-wrap">
          <button onClick={expandAll} className="btn btn-secondary btn-sm gap-1.5">
            <ChevronDown size={13} /> Expand All
          </button>
          <button onClick={() => { setExpandedCategories(new Set()); setExpandedCourses(new Set()); setExpandedLevels(new Set()); setExpandedSections(new Set()) }}
            className="btn btn-ghost btn-sm text-gray-500">
            Collapse All
          </button>
        </div>

        {/* Tree */}
        {categories.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon"><GitBranch size={28} className="text-gray-600" /></div>
            <p className="font-medium text-gray-400">No structure yet</p>
            <p className="text-sm text-gray-600 mt-1">
              Create <Link to="/categories" className="text-indigo-400">Categories</Link>, <Link to="/courses" className="text-indigo-400">Courses</Link>, and <Link to="/levels" className="text-indigo-400">Levels</Link> first
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {categories.map((cat) => {
              const catCourses = courses.filter((c) => c.category_id === cat.id)
              const catExpanded = expandedCategories.has(cat.id)
              const catLessons = lessons.filter((l) => l.category_id === cat.id)
              const catDone = catLessons.filter((l) => completedIds.has(l.id)).length

              return (
                <div key={cat.id} className="card">
                  <button
                    onClick={() => toggle(setExpandedCategories, cat.id)}
                    className="w-full flex items-center gap-3 p-4 tree-toggle"
                  >
                    <div className="w-8 h-8 rounded-lg bg-indigo-500/20 flex items-center justify-center flex-shrink-0">
                      <GitBranch size={15} className="text-indigo-400" />
                    </div>
                    <div className="flex-1 text-left">
                      <div className="font-semibold text-gray-200">{cat.name}</div>
                      <div className="text-xs text-gray-500">{catCourses.length} courses · {catLessons.length} lessons</div>
                    </div>
                    {catLessons.length > 0 && <ProgressBadge done={catDone} total={catLessons.length} />}
                    {catExpanded ? <ChevronDown size={15} className="text-gray-500 flex-shrink-0" /> : <ChevronRight size={15} className="text-gray-500 flex-shrink-0" />}
                  </button>

                  {catExpanded && (
                    <div className="px-4 pb-4 flex flex-col gap-2 border-t border-[#1e2334] pt-3">
                      {catCourses.length === 0 ? (
                        <div className="text-xs text-gray-600 py-2 pl-4">No courses in this category</div>
                      ) : catCourses.map((course) => {
                        const cLevels = levels.filter((l) => l.course_id === course.id)
                        const cExpanded = expandedCourses.has(course.id)
                        const cLessons = lessons.filter((l) => l.course_id === course.id)
                        const cDone = cLessons.filter((l) => completedIds.has(l.id)).length

                        return (
                          <div key={course.id} className="border border-[#1e2334] rounded-lg overflow-hidden">
                            <button
                              onClick={() => toggle(setExpandedCourses, course.id)}
                              className="w-full flex items-center gap-3 px-4 py-3 tree-toggle"
                            >
                              <div className="w-6 h-6 rounded-md bg-violet-500/20 flex items-center justify-center flex-shrink-0">
                                <BookOpen size={12} className="text-violet-400" />
                              </div>
                              <div className="flex-1 text-left">
                                <div className="font-medium text-sm text-gray-200">{course.name}</div>
                                <div className="text-xs text-gray-500">{cLevels.length} levels</div>
                              </div>
                              {cLessons.length > 0 && <ProgressBadge done={cDone} total={cLessons.length} />}
                              {cExpanded ? <ChevronDown size={13} className="text-gray-600 flex-shrink-0" /> : <ChevronRight size={13} className="text-gray-600 flex-shrink-0" />}
                            </button>

                            {cExpanded && (
                              <div className="px-4 pb-3 flex flex-col gap-2 border-t border-[#1e2334] pt-2 bg-[#0f1117]">
                                {cLevels.map((level) => {
                                  const lSections = sections.filter((s) => s.level_id === level.id)
                                  const lExpanded = expandedLevels.has(level.id)
                                  const lLessons = getLessonsForLevel(level.id)
                                  const lDone = lLessons.filter((l) => completedIds.has(l.id)).length

                                  return (
                                    <div key={level.id} className="border border-[#1e2334] rounded-lg overflow-hidden">
                                      <button
                                        onClick={() => toggle(setExpandedLevels, level.id)}
                                        className="w-full flex items-center gap-3 px-4 py-2.5 tree-toggle"
                                      >
                                        <div className="w-5 h-5 rounded bg-pink-500/20 flex items-center justify-center flex-shrink-0">
                                          <span className="text-pink-400 text-xs font-bold">L</span>
                                        </div>
                                        <div className="flex-1 text-left">
                                          <div className="text-sm text-gray-300">{level.name}</div>
                                        </div>
                                        {lLessons.length > 0 && <ProgressBadge done={lDone} total={lLessons.length} />}
                                        {lExpanded ? <ChevronDown size={12} className="text-gray-600" /> : <ChevronRight size={12} className="text-gray-600" />}
                                      </button>

                                      {lExpanded && (
                                        <div className="border-t border-[#1e2334] px-4 py-2 flex flex-col gap-1">
                                          {lSections.map((section) => {
                                            const sLessons = getLessonsForSection(section.id)
                                            const sExpanded = expandedSections.has(section.id)
                                            const sDone = sLessons.filter((l) => completedIds.has(l.id)).length

                                            return (
                                              <div key={section.id}>
                                                <button
                                                  onClick={() => toggle(setExpandedSections, section.id)}
                                                  className="flex items-center gap-2 py-1.5 px-2 rounded text-sm hover:bg-white/5 w-full text-left"
                                                >
                                                  {sExpanded ? <ChevronDown size={12} className="text-gray-600" /> : <ChevronRight size={12} className="text-gray-600" />}
                                                  <span className="text-gray-400 font-medium">{section.name}</span>
                                                  {sLessons.length > 0 && <span className="text-xs text-gray-600 ml-auto">{sDone}/{sLessons.length}</span>}
                                                </button>

                                                {sExpanded && sLessons.map((lesson) => (
                                                  <Link key={lesson.id} to={`/lessons/${lesson.id}`}
                                                    className="flex items-center gap-2 py-1.5 px-6 hover:bg-white/5 rounded text-sm group">
                                                    <CheckCircle2 size={13} className={completedIds.has(lesson.id) ? 'text-emerald-500' : 'text-gray-700'} />
                                                    <span className={`flex-1 ${completedIds.has(lesson.id) ? 'text-emerald-400' : 'text-gray-400'}`}>{lesson.title}</span>
                                                    {lesson.quizzes && lesson.quizzes.length > 0 && (
                                                      <Brain size={11} className="text-pink-500 opacity-70" />
                                                    )}
                                                  </Link>
                                                ))}
                                              </div>
                                            )
                                          })}

                                          {/* Lessons not in a section */}
                                          {lLessons.filter((l) => !l.section_id || !lSections.find((s) => s.id === l.section_id)).map((lesson) => (
                                            <Link key={lesson.id} to={`/lessons/${lesson.id}`}
                                              className="flex items-center gap-2 py-1.5 px-4 hover:bg-white/5 rounded text-sm">
                                              <CheckCircle2 size={13} className={completedIds.has(lesson.id) ? 'text-emerald-500' : 'text-gray-700'} />
                                              <span className={completedIds.has(lesson.id) ? 'text-emerald-400' : 'text-gray-400'}>{lesson.title}</span>
                                            </Link>
                                          ))}
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
