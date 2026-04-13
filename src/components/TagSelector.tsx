import React from 'react'
import { X } from 'lucide-react'
import { useTags, useCreateTag } from '../hooks/useTags'
import type { Tag } from '../types'
import toast from 'react-hot-toast'

interface TagSelectorProps {
  selectedIds: string[]
  onChange: (ids: string[]) => void
  placeholder?: string
}

export const TagSelector: React.FC<TagSelectorProps> = ({ selectedIds, onChange, placeholder = 'Add tags...' }) => {
  const { data: tags = [] } = useTags()
  const createTag = useCreateTag()
  const [input, setInput] = React.useState('')
  const [open, setOpen] = React.useState(false)
  const ref = React.useRef<HTMLDivElement>(null)

  const filtered = tags.filter((t) =>
    t.name.toLowerCase().includes(input.toLowerCase()) && !selectedIds.includes(t.id)
  )

  const selected = tags.filter((t) => selectedIds.includes(t.id))

  const toggle = (tag: Tag) => {
    if (selectedIds.includes(tag.id)) {
      onChange(selectedIds.filter((id) => id !== tag.id))
    } else {
      onChange([...selectedIds, tag.id])
    }
  }

  const createNew = async () => {
    if (!input.trim()) return
    try {
      const colors = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#3b82f6', '#14b8a6', '#f97316']
      const color = colors[Math.floor(Math.random() * colors.length)]
      const tag = await createTag.mutateAsync({ name: input.trim(), color })
      onChange([...selectedIds, tag.id])
      setInput('')
    } catch {
      toast.error('Tag already exists')
    }
  }

  React.useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <div className="relative" ref={ref}>
      <div
        className="form-input flex flex-wrap gap-1.5 min-h-10 cursor-text"
        onClick={() => { setOpen(true) }}
      >
        {selected.map((tag) => (
          <span
            key={tag.id}
            className="tag-chip"
            style={{ background: tag.color + '25', color: tag.color, border: `1px solid ${tag.color}55` }}
          >
            {tag.name}
            <button
              onClick={(e) => { e.stopPropagation(); toggle(tag) }}
              className="ml-0.5 hover:opacity-70"
            >
              <X size={10} />
            </button>
          </span>
        ))}
        <input
          value={input}
          onChange={(e) => { setInput(e.target.value); setOpen(true) }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') { e.preventDefault(); createNew() }
          }}
          placeholder={selected.length === 0 ? placeholder : ''}
          className="flex-1 min-w-24 bg-transparent outline-none text-sm text-gray-300 placeholder-gray-600"
        />
      </div>

      {open && (filtered.length > 0 || input.trim()) && (
        <div className="absolute z-50 top-full mt-1 left-0 right-0 bg-[#1a1f2e] border border-[#2d3450] rounded-lg shadow-xl max-h-48 overflow-y-auto animate-fade-in">
          {filtered.map((tag) => (
            <button
              key={tag.id}
              onClick={() => { toggle(tag); setInput('') }}
              className="w-full flex items-center gap-2 px-3 py-2 hover:bg-[#252d40] text-left text-sm"
            >
              <span className="w-2.5 h-2.5 rounded-full" style={{ background: tag.color }} />
              <span className="text-gray-300">{tag.name}</span>
            </button>
          ))}
          {input.trim() && !tags.find((t) => t.name.toLowerCase() === input.toLowerCase()) && (
            <button
              onClick={createNew}
              className="w-full flex items-center gap-2 px-3 py-2 hover:bg-[#252d40] text-left text-sm text-indigo-400 border-t border-[#1e2334]"
            >
              <span>+ Create "{input}"</span>
            </button>
          )}
        </div>
      )}
    </div>
  )
}
