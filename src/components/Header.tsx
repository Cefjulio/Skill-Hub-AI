import React, { useState } from 'react'
import { Menu, Search, Sun, Moon } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useUIStore } from '../stores'

export const Header: React.FC<{ title?: string }> = ({ title }) => {
  const { toggleSidebar, theme, toggleTheme } = useUIStore()
  const [query, setQuery] = useState('')
  const navigate = useNavigate()

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (query.trim()) navigate(`/search?q=${encodeURIComponent(query.trim())}`)
  }

  return (
    <header className="page-header">
      <button onClick={toggleSidebar} className="btn btn-icon btn-ghost">
        <Menu size={18} />
      </button>

      {title && <h1 className="text-base font-semibold text-[var(--text-primary)] hidden sm:block">{title}</h1>}

      <form onSubmit={handleSearch} className="flex-1 max-w-md mx-auto">
        <div className="search-input-wrapper">
          <Search size={15} className="search-icon" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search lessons, quizzes, files..."
            className="form-input search-input py-2 text-sm w-full"
          />
        </div>
      </form>

      <div className="ml-auto flex items-center gap-2">
        <button 
          onClick={toggleTheme} 
          className="btn btn-icon btn-ghost text-[var(--text-secondary)] hover:text-amber-500 hover:bg-amber-500/5 transition-all"
          title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
        >
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        <div className="hidden sm:flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-2.5 py-1 text-xs text-emerald-400">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          Live
        </div>
      </div>
    </header>
  )
}
