import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import {
  BookOpen, Tag, FolderOpen, Brain, LayoutDashboard, GitBranch,
  GraduationCap, Layers, BookMarked, AlignLeft, X
} from 'lucide-react'
import { useAuthStore, useUIStore } from '../stores'
import { useUserProgress } from '../hooks/useStructure'

const navItems = [
  { label: 'Dashboard', icon: LayoutDashboard, href: '/' },
  { label: 'Hierarchy', icon: GitBranch, href: '/hierarchy' },
]

const contentItems = [
  { label: 'Lessons', icon: BookOpen, href: '/lessons' },
  { label: 'Quizzes', icon: Brain, href: '/quizzes' },
  { label: 'File Repository', icon: FolderOpen, href: '/repository' },
  { label: 'Tags', icon: Tag, href: '/tags' },
]

const structureItems = [
  { label: 'Categories', icon: GraduationCap, href: '/categories' },
  { label: 'Courses', icon: BookMarked, href: '/courses' },
  { label: 'Levels', icon: Layers, href: '/levels' },
  { label: 'Sections', icon: AlignLeft, href: '/sections' },
]

export const Sidebar: React.FC = () => {
  const location = useLocation()
  const { user, signOut } = useAuthStore()
  const { sidebarOpen, setSidebarOpen } = useUIStore()
  const { data: progress = [] } = useUserProgress(user?.id ?? '')

  const completedCount = progress.filter((p: any) => p.completed).length

  const isActive = (href: string) => {
    if (href === '/') return location.pathname === '/'
    return location.pathname.startsWith(href)
  }

  return (
    <>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-30 md:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      <aside className={`sidebar flex flex-col ${sidebarOpen ? 'is-open' : 'is-collapsed'}`}>
        {/* Logo */}
        <div className="sidebar-logo">
          <div className="logo-icon">
            <Brain size={20} className="text-white" />
          </div>
          <div>
            <div className="logo-text">Skill Hub AI</div>
            <div className="text-xs text-gray-600">Learning Platform</div>
          </div>
          <button className="ml-auto btn btn-icon btn-ghost md:hidden" onClick={() => setSidebarOpen(false)}>
            <X size={16} />
          </button>
        </div>

        {/* Progress pill */}
        {user && completedCount > 0 && (
          <div className="mx-3 mt-3 px-3 py-2 bg-indigo-500/10 border border-indigo-500/20 rounded-lg">
            <div className="text-xs text-indigo-300 font-medium">{completedCount} lesson{completedCount !== 1 ? 's' : ''} completed</div>
          </div>
        )}

        {/* Main Nav */}
        <div className="sidebar-section">
          <div className="sidebar-section-label">Main</div>
          {navItems.map((item) => (
            <Link key={item.href} to={item.href} className={`nav-item ${isActive(item.href) ? 'active' : ''}`}>
              <item.icon size={16} className="nav-item-icon" />
              {item.label}
            </Link>
          ))}
        </div>

        <div className="divider mx-3" />

        {/* Content Nav */}
        <div className="sidebar-section">
          <div className="sidebar-section-label">Content</div>
          {contentItems.map((item) => (
            <Link key={item.href} to={item.href} className={`nav-item ${isActive(item.href) ? 'active' : ''}`}>
              <item.icon size={16} className="nav-item-icon" />
              {item.label}
            </Link>
          ))}
        </div>

        <div className="divider mx-3" />

        {/* Structure Nav */}
        <div className="sidebar-section">
          <div className="sidebar-section-label">Structure</div>
          {structureItems.map((item) => (
            <Link key={item.href} to={item.href} className={`nav-item ${isActive(item.href) ? 'active' : ''}`}>
              <item.icon size={16} className="nav-item-icon" />
              {item.label}
            </Link>
          ))}
        </div>

        {/* User */}
        {user && (
          <div className="mt-auto p-3 border-t border-[#1e2334]">
            <div className="flex items-center gap-2.5 px-2 py-2 rounded-lg">
              <div className="w-7 h-7 rounded-full bg-indigo-500/30 flex items-center justify-center text-indigo-400 text-xs font-bold flex-shrink-0">
                {user.email?.[0]?.toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-medium text-gray-300 truncate">{user.email}</div>
              </div>
              <button onClick={signOut} className="text-xs text-gray-500 hover:text-red-400 transition-colors">
                Sign out
              </button>
            </div>
          </div>
        )}
      </aside>
    </>
  )
}
