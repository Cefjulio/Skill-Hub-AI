import React, { useState } from 'react'
import { Plus, Pencil, Trash2, Tag as TagIcon, Check, X } from 'lucide-react'
import { useTags, useCreateTag, useUpdateTag, useDeleteTag } from '../../hooks/useTags'
import { Header } from '../../components/Header'
import type { Tag } from '../../types'
import toast from 'react-hot-toast'

const COLORS = [
  '#6366f1','#8b5cf6','#ec4899','#f59e0b','#10b981',
  '#3b82f6','#14b8a6','#f97316','#ef4444','#a855f7',
  '#06b6d4','#84cc16','#d946ef','#0ea5e9','#22d3ee',
]

const TagRow: React.FC<{
  tag: Tag
  onEdit: (tag: Tag) => void
  onDelete: (id: string) => void
}> = ({ tag, onEdit, onDelete }) => (
  <tr className="group">
    <td>
      <div className="flex items-center gap-2.5">
        <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: tag.color }} />
        <span
          className="badge"
          style={{ background: tag.color + '20', color: tag.color, border: `1px solid ${tag.color}40` }}
        >
          {tag.name}
        </span>
      </div>
    </td>
    <td className="text-gray-500 text-xs font-mono">{tag.color}</td>
    <td className="text-gray-500 text-xs">{new Date(tag.created_at).toLocaleDateString()}</td>
    <td>
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity justify-end">
        <button onClick={() => onEdit(tag)} className="btn btn-icon btn-ghost btn-sm"><Pencil size={13} /></button>
        <button onClick={() => onDelete(tag.id)} className="btn btn-icon btn-danger btn-sm"><Trash2 size={13} /></button>
      </div>
    </td>
  </tr>
)

export const TagsPage: React.FC = () => {
  const { data: tags = [], isLoading } = useTags()
  const createTag = useCreateTag()
  const updateTag = useUpdateTag()
  const deleteTag = useDeleteTag()

  const [editing, setEditing] = useState<Tag | null>(null)
  const [creating, setCreating] = useState(false)
  const [name, setName] = useState('')
  const [color, setColor] = useState(COLORS[0])

  const openCreate = () => { setCreating(true); setEditing(null); setName(''); setColor(COLORS[0]) }
  const openEdit = (tag: Tag) => { setEditing(tag); setCreating(false); setName(tag.name); setColor(tag.color) }
  const cancel = () => { setCreating(false); setEditing(null) }

  const save = async () => {
    if (!name.trim()) return
    try {
      if (editing) {
        await updateTag.mutateAsync({ id: editing.id, name: name.trim(), color })
        toast.success('Tag updated')
      } else {
        await createTag.mutateAsync({ name: name.trim(), color })
        toast.success('Tag created')
      }
      cancel()
    } catch (e: any) {
      toast.error(e.message ?? 'Error saving tag')
    }
  }

  const remove = async (id: string) => {
    if (!confirm('Delete this tag? It will be removed from all items.')) return
    await deleteTag.mutateAsync(id)
    toast.success('Tag deleted')
  }

  const formOpen = creating || !!editing

  return (
    <>
      <Header title="Tags" />
      <div className="page-content flex flex-col gap-5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-white">Tag Repository</h2>
            <p className="text-sm text-gray-500 mt-0.5">{tags.length} tags · Reusable across lessons, files & quizzes</p>
          </div>
          <button onClick={openCreate} className="btn btn-primary gap-2">
            <Plus size={16} /> New Tag
          </button>
        </div>

        {/* Create / Edit form */}
        {formOpen && (
          <div className="card animate-fade-in">
            <div className="card-header">
              <h3 className="font-semibold text-sm">{editing ? 'Edit Tag' : 'Create Tag'}</h3>
            </div>
            <div className="card-body flex flex-col gap-4">
              <div className="flex gap-3">
                <div className="form-group flex-1">
                  <label className="form-label">Tag Name</label>
                  <input
                    autoFocus
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && save()}
                    className="form-input"
                    placeholder="e.g. Grammar, Vocabulary..."
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Preview</label>
                  <div className="h-10 flex items-center px-3 bg-[#0f1117] border border-[#1e2334] rounded-lg">
                    <span
                      className="badge"
                      style={{ background: color + '20', color, border: `1px solid ${color}40` }}
                    >
                      {name || 'Tag name'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Color</label>
                <div className="flex flex-wrap gap-2 p-3 bg-[#0f1117] rounded-lg border border-[#1e2334]">
                  {COLORS.map((c) => (
                    <button
                      key={c}
                      onClick={() => setColor(c)}
                      style={{ background: c }}
                      className={`w-7 h-7 rounded-full transition-all hover:scale-110 flex items-center justify-center ${color === c ? 'ring-2 ring-white ring-offset-2 ring-offset-[#0f1117] scale-110' : ''}`}
                    >
                      {color === c && <Check size={13} className="text-white" />}
                    </button>
                  ))}
                  <input
                    type="color"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    className="w-7 h-7 rounded-full cursor-pointer bg-transparent border-2 border-dashed border-gray-600 hover:border-gray-400"
                    title="Custom color"
                  />
                </div>
              </div>

              <div className="flex gap-2 justify-end">
                <button onClick={cancel} className="btn btn-secondary gap-1"><X size={14} /> Cancel</button>
                <button onClick={save} disabled={!name.trim() || createTag.isPending || updateTag.isPending} className="btn btn-primary gap-1">
                  <Check size={14} /> {editing ? 'Update' : 'Create'} Tag
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Tags table */}
        <div className="card">
          {isLoading ? (
            <div className="p-8 flex justify-center">
              <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : tags.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon"><TagIcon size={28} className="text-gray-600" /></div>
              <p className="font-medium text-gray-400">No tags yet</p>
              <p className="text-sm text-gray-600 mt-1">Create your first tag to organize content</p>
            </div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Tag</th>
                  <th>Color</th>
                  <th>Created</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {tags.map((tag) => (
                  <TagRow key={tag.id} tag={tag} onEdit={openEdit} onDelete={remove} />
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </>
  )
}
