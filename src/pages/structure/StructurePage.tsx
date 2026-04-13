import React, { useState } from 'react'
import { Plus, Pencil, Trash2, X, Check, Search, Loader2, LayoutGrid, List, ChevronUp, ChevronDown, ArrowUpDown, Star } from 'lucide-react'
import { Header } from '../../components/Header'
import toast from 'react-hot-toast'

// Generic CRUD page factory for Categories, Courses, Levels, Sections
interface StructureItem {
  id: string
  name: string
  description?: string
  created_at: string
  [key: string]: any
}

interface StructurePageProps {
  title: string
  entityName: string
  useItems: () => { data?: StructureItem[], isLoading: boolean }
  useCreate: () => any
  useUpdate: () => any
  useDelete: () => any
  extraFields?: Array<{
    key: string
    label: string
    type: 'select'
    options: { id: string; name: string }[]
    optionLabel?: string
  }>
  icon: React.ReactNode
  showPriority?: boolean
}

export const StructurePage: React.FC<StructurePageProps> = ({
  title, entityName, useItems, useCreate, useUpdate, useDelete, extraFields = [], icon, showPriority = false
}) => {
  const { data: items = [], isLoading } = useItems()
  const create = useCreate()
  const update = useUpdate()
  const del = useDelete()

  const [modal, setModal] = useState<'create' | 'edit' | null>(null)
  const [editing, setEditing] = useState<StructureItem | null>(null)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [extras, setExtras] = useState<Record<string, string>>({})
  const [search, setSearch] = useState('')
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('table')
  const [colFilters, setColFilters] = useState<Record<string, string>>({})
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null)

  const extraOptions = Object.fromEntries(
    extraFields.map((ef) => [ef.key, ef.options])
  )

  const openCreate = () => {
    setName(''); setDescription(''); setExtras({})
    setEditing(null); setModal('create')
  }

  const openEdit = (item: StructureItem) => {
    setName(item.name); setDescription(item.description ?? '')
    const ex: Record<string, string> = {}
    extraFields.forEach((ef) => { ex[ef.key] = item[ef.key] ?? '' })
    setExtras(ex); setEditing(item); setModal('edit')
  }

  const save = async () => {
    if (!name.trim()) return toast.error('Name is required')
    try {
      const payload = { name: name.trim(), description: description || undefined, ...extras }
      if (modal === 'create') {
        await create.mutateAsync(payload)
        toast.success(`${entityName} created!`)
      } else if (editing) {
        await update.mutateAsync({ id: editing.id, ...payload })
        toast.success(`${entityName} updated!`)
      }
      setModal(null); setEditing(null)
    } catch (e: any) { toast.error(e.message) }
  }

  const remove = async (id: string) => {
    if (!confirm(`Delete this ${entityName.toLowerCase()}?`)) return
    await del.mutateAsync(id)
    toast.success(`${entityName} deleted`)
  }

  const togglePriority = async (item: StructureItem) => {
    try {
      await update.mutateAsync({ id: item.id, is_priority: !item.is_priority })
      toast.success(item.is_priority ? 'Removed from priority' : 'Marked as priority!')
    } catch (e: any) { toast.error(e.message) }
  }

  const filtered = items.filter((item) => {
    // Global Search
    const matchesGlobal = item.name.toLowerCase().includes(search.toLowerCase())
    if (!matchesGlobal) return false

    // Column Filters
    for (const [key, val] of Object.entries(colFilters)) {
      if (!val) continue
      let targetValue = ''
      if (key === 'name') {
        targetValue = item.name
      } else if (key === 'created_at') {
        targetValue = new Date(item.created_at).toLocaleDateString()
      } else {
        const opt = extraOptions[key]?.find((o) => o.id === item[key])
        targetValue = opt?.name ?? ''
      }
      if (!targetValue.toLowerCase().includes(val.toLowerCase())) return false
    }

    return true
  })

  const sorted = [...filtered].sort((a, b) => {
    if (!sortConfig) return 0
    const { key, direction } = sortConfig
    let valA = a[key] ?? ''
    let valB = b[key] ?? ''

    if (extraOptions[key]) {
      valA = extraOptions[key].find((o) => o.id === valA)?.name ?? ''
      valB = extraOptions[key].find((o) => o.id === valB)?.name ?? ''
    }

    if (valA < valB) return direction === 'asc' ? -1 : 1
    if (valA > valB) return direction === 'asc' ? 1 : -1
    return 0
  })

  const toggleSort = (key: string) => {
    setSortConfig((prev) => {
      if (prev?.key === key) {
        if (prev.direction === 'asc') return { key, direction: 'desc' }
        return null
      }
      return { key, direction: 'asc' }
    })
  }

  const SortIcon = ({ colKey }: { colKey: string }) => {
    if (sortConfig?.key !== colKey) return <ArrowUpDown size={12} className="opacity-30" />
    return sortConfig.direction === 'asc' ? <ChevronUp size={12} className="text-indigo-500" /> : <ChevronDown size={12} className="text-indigo-500" />
  }

  return (
    <>
      <Header title={title} />
      <div className="page-content flex flex-col gap-5">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex-1 min-w-48">
            <div className="search-input-wrapper">
              <Search size={15} className="search-icon" />
              <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
                placeholder={`Search ${entityName.toLowerCase()}s...`}
                className="form-input search-input py-2 text-sm" />
            </div>
          </div>
          <div className="flex items-center gap-3 ml-auto">
            <div className="view-toggle-group">
              <button onClick={() => setViewMode('grid')} className={`view-toggle-btn ${viewMode === 'grid' ? 'active' : ''}`} title="Grid View">
                <LayoutGrid size={16} />
              </button>
              <button onClick={() => setViewMode('table')} className={`view-toggle-btn ${viewMode === 'table' ? 'active' : ''}`} title="Table View">
                <List size={16} />
              </button>
            </div>
            <button onClick={openCreate} className="btn btn-primary gap-2">
              <Plus size={15} /> New {entityName}
            </button>
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12"><Loader2 size={24} className="animate-spin text-indigo-500" /></div>
        ) : sorted.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">{icon}</div>
            <p className="font-medium text-gray-400">{items.length === 0 ? `No ${entityName.toLowerCase()}s yet` : 'No results match your filters'}</p>
            <p className="text-sm text-gray-600 mt-1">{items.length === 0 ? `Create your first ${entityName.toLowerCase()} to get started` : 'Try clearing your search or column filters'}</p>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {sorted.map((item) => (
              <div key={item.id} className={`card group hover:border-indigo-500/30 transition-all ${item.is_priority ? 'priority-item-card' : ''}`}>
                <div className="card-body flex flex-col gap-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className={`w-8 h-8 rounded-lg border flex items-center justify-center ${item.is_priority ? 'bg-amber-500/10 border-amber-500/20' : 'bg-indigo-500/10 border-indigo-500/20'}`}>
                        {item.is_priority ? <Star size={14} className="text-amber-400 fill-amber-400" /> : icon}
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-200 text-sm flex items-center gap-1.5">
                          {item.name}
                        </h3>
                        {extraFields.map((ef) => {
                          const opt = extraOptions[ef.key]?.find((o) => o.id === item[ef.key])
                          return opt ? <div key={ef.key} className="text-xs text-gray-500">{ef.label}: {opt.name}</div> : null
                        })}
                      </div>
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {showPriority && (
                        <button onClick={() => togglePriority(item)} className={`btn btn-icon btn-sm ${item.is_priority ? 'text-amber-400 hover:text-amber-500' : 'text-gray-600 hover:text-gray-400'}`}>
                          <Star size={13} fill={item.is_priority ? "currentColor" : "none"} />
                        </button>
                      )}
                      <button onClick={() => openEdit(item)} className="btn btn-icon btn-ghost btn-sm"><Pencil size={13} /></button>
                      <button onClick={() => remove(item.id)} className="btn btn-icon btn-danger btn-sm"><Trash2 size={13} /></button>
                    </div>
                  </div>
                  {item.description && <p className="text-xs text-gray-500 line-clamp-2">{item.description}</p>}
                  <div className="text-xs text-gray-600 mt-1">{new Date(item.created_at).toLocaleDateString()}</div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="table-container">
            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    <th className="w-12"></th>
                    {showPriority && <th className="w-10"></th>}
                    <th>
                      <div className="sort-header" onClick={() => toggleSort('name')}>
                        Name <SortIcon colKey="name" />
                      </div>
                    </th>
                    {extraFields.map((ef) => (
                      <th key={ef.key}>
                        <div className="sort-header" onClick={() => toggleSort(ef.key)}>
                          {ef.label} <SortIcon colKey={ef.key} />
                        </div>
                      </th>
                    ))}
                    <th>
                      <div className="sort-header" onClick={() => toggleSort('created_at')}>
                        Created At <SortIcon colKey="created_at" />
                      </div>
                    </th>
                    <th className="text-right">Actions</th>
                  </tr>
                  <tr className="column-filter-row">
                    <th></th>
                    {showPriority && <th></th>}
                    <th>
                      <input type="text" placeholder="Filter name..." className="column-filter-input"
                        value={colFilters.name ?? ''} onChange={(e) => setColFilters(prev => ({ ...prev, name: e.target.value }))} />
                    </th>
                    {extraFields.map((ef) => (
                      <th key={ef.key}>
                        <input type="text" placeholder={`Filter ${ef.label.toLowerCase()}...`} className="column-filter-input"
                          value={colFilters[ef.key] ?? ''} onChange={(e) => setColFilters(prev => ({ ...prev, [ef.key]: e.target.value }))} />
                      </th>
                    ))}
                    <th>
                      <input type="text" placeholder="Filter date..." className="column-filter-input"
                        value={colFilters.created_at ?? ''} onChange={(e) => setColFilters(prev => ({ ...prev, created_at: e.target.value }))} />
                    </th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {sorted.map((item) => (
                    <tr key={item.id} className={`hover:bg-white/[0.01] transition-colors ${item.is_priority ? 'priority-table-row' : ''}`}>
                      <td className="text-center">
                        <div className="w-6 h-6 rounded bg-indigo-500/10 flex items-center justify-center mx-auto">
                          {React.cloneElement(icon as any, { size: 12 })}
                        </div>
                      </td>
                      {showPriority && (
                        <td className="text-center">
                          <button onClick={() => togglePriority(item)} className={`${item.is_priority ? 'text-amber-400' : 'text-gray-700 hover:text-gray-500'} transition-colors`}>
                            <Star size={14} fill={item.is_priority ? "currentColor" : "none"} />
                          </button>
                        </td>
                      )}
                      <td className="font-medium text-gray-300">{item.name}</td>
                      {extraFields.map((ef) => {
                        const opt = extraOptions[ef.key]?.find((o) => o.id === item[ef.key])
                        return <td key={ef.key} className="text-gray-400">{opt?.name ?? '—'}</td>
                      })}
                      <td className="text-gray-500">{new Date(item.created_at).toLocaleDateString()}</td>
                      <td className="text-right">
                        <div className="flex justify-end gap-1">
                          <button onClick={() => openEdit(item)} className="btn btn-icon btn-ghost btn-sm" title="Edit"><Pencil size={13} /></button>
                          <button onClick={() => remove(item.id)} className="btn btn-icon btn-danger btn-sm" title="Delete"><Trash2 size={13} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Modal */}
        {modal && (
          <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setModal(null)}>
            <div className="modal-content">
              <div className="modal-header">
                <h2 className="font-semibold text-base">{modal === 'create' ? `New ${entityName}` : `Edit ${entityName}`}</h2>
                <button onClick={() => setModal(null)} className="btn btn-icon btn-ghost btn-sm"><X size={15} /></button>
              </div>
              <div className="modal-body">
                {extraFields.map((ef) => (
                  <div key={ef.key} className="form-group">
                    <label className="form-label">{ef.label}</label>
                    <select value={extras[ef.key] ?? ''} onChange={(e) => setExtras((ex) => ({ ...ex, [ef.key]: e.target.value }))}
                      className="form-input form-select">
                      <option value="">— Select {ef.label} —</option>
                      {extraOptions[ef.key]?.map((o) => (
                        <option key={o.id} value={o.id}>{o.name}</option>
                      ))}
                    </select>
                  </div>
                ))}
                <div className="form-group">
                  <label className="form-label">Name *</label>
                  <input autoFocus value={name} onChange={(e) => setName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && save()}
                    className="form-input" placeholder={`${entityName} name...`} />
                </div>
                <div className="form-group">
                  <label className="form-label">Description (optional)</label>
                  <textarea value={description} onChange={(e) => setDescription(e.target.value)}
                    className="form-input form-textarea" placeholder="Optional description..." />
                </div>
              </div>
              <div className="modal-footer">
                <button onClick={() => setModal(null)} className="btn btn-secondary">Cancel</button>
                <button onClick={save} disabled={create.isPending || update.isPending} className="btn btn-primary gap-1.5">
                  <Check size={14} /> {modal === 'create' ? 'Create' : 'Save'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  )
}
